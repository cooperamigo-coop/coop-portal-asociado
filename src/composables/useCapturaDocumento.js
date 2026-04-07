import { ref, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { crearSesionCaptura, subirFotoCaptura, vincularSolicitudCaptura } from '@/services/captura.service'

function generarUrlQR(texto) {
  const encoded = encodeURIComponent(texto)
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}&bgcolor=ffffff&color=172B36&margin=10`
}

export function useCapturaDocumento() {
  // ── Detección de dispositivo ──────────────────────────────────────────────
  const esMovil = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  // ── Estado ────────────────────────────────────────────────────────────────
  // idle | generando | esperando_qr | capturando_movil | subiendo | completado | error
  const estado      = ref('idle')
  const urlFrente   = ref(null)
  const urlReverso  = ref(null)
  const qrDataUrl   = ref(null)
  const urlCaptura  = ref(null)
  const sesionId    = ref(null)
  const token       = ref(null)
  const error       = ref(null)
  // null | 'frente' | 'reverso' | 'ambos'
  const progreso    = ref(null)

  let canalRealtime   = null
  let pollingInterval = null

  // ── Crear sesión QR ───────────────────────────────────────────────────────
  async function crearSesionQR(solicitudId, campo = 'documento_identidad') {
    estado.value = 'generando'
    error.value  = null

    try {
      // Si la solicitud aún no está guardada en BD, usamos un ID temporal
      // que luego se vincula vía vincularSolicitud()
      const sesionFormulario = solicitudId
        ? null
        : `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`

      const data = await crearSesionCaptura(solicitudId || null, campo, sesionFormulario)

      sesionId.value   = data.sesion_id
      token.value      = data.token
      urlCaptura.value = data.url_captura

      qrDataUrl.value = generarUrlQR(data.url_captura)
      estado.value    = 'esperando_qr'
      suscribirRealtime(data.sesion_id)
      iniciarPolling(data.sesion_id)
    } catch (e) {
      estado.value = 'error'
      error.value  = e.message
      console.error('[useCapturaDocumento] Error:', e)
    }
  }

  // ── Realtime: escuchar actualizaciones de la sesión ──────────────────────
  function suscribirRealtime(sId) {
    if (canalRealtime) supabase.removeChannel(canalRealtime)

    console.log('[Realtime] Suscribiendo a sesión:', sId)

    canalRealtime = supabase
      .channel(`captura-doc-${sId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sesiones_captura_documento', filter: `id=eq.${sId}` },
        (payload) => {
          console.log('[Realtime] Evento recibido:', payload)
          aplicarActualizacion(payload.new)
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Estado suscripción:', status)
      })
  }

  function desuscribir() {
    if (canalRealtime) {
      supabase.removeChannel(canalRealtime)
      canalRealtime = null
    }
  }

  // ── Polling fallback cada 3 s ─────────────────────────────────────────────
  function iniciarPolling(sId) {
    detenerPolling()
    pollingInterval = setInterval(async () => {
      if (!['esperando_qr', 'capturando_movil'].includes(estado.value)) {
        detenerPolling()
        return
      }
      try {
        const { data, error: err } = await supabase
          .from('sesiones_captura_documento')
          .select('estado, url_frente, url_reverso')
          .eq('id', sId)
          .single()

        if (err || !data) return

        if (data.url_frente && !urlFrente.value) {
          console.log('[Polling] Frente detectado')
        }
        if (data.url_reverso && !urlReverso.value) {
          console.log('[Polling] Reverso detectado')
        }
        aplicarActualizacion(data)

        if (data.estado === 'completado') {
          detenerPolling()
          desuscribir()
        }
      } catch (e) {
        console.warn('[Polling] Error:', e.message)
      }
    }, 3000)
  }

  function detenerPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // ── Lógica compartida entre Realtime y Polling ───────────────────────────
  function aplicarActualizacion(row) {
    if (row.url_frente)  urlFrente.value  = row.url_frente
    if (row.url_reverso) urlReverso.value = row.url_reverso

    if (row.url_frente && row.url_reverso) {
      progreso.value = 'ambos'
    } else if (row.url_frente) {
      progreso.value = 'frente'
    } else if (row.url_reverso) {
      progreso.value = 'reverso'
    }

    if (row.estado === 'completado') {
      estado.value = 'completado'
      desuscribir()
      detenerPolling()
    } else if (row.url_frente || row.url_reverso) {
      estado.value = 'capturando_movil'
    }
  }

  // ── Crear sesión silenciosa (upload directo, sin QR) ─────────────────────
  async function _asegurarSesion(solicitudId, campo) {
    if (token.value) return true
    try {
      const sesionFormulario = solicitudId
        ? null
        : `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const data = await crearSesionCaptura(solicitudId || null, campo, sesionFormulario)
      sesionId.value = data.sesion_id
      token.value    = data.token
      // urlCaptura intencionalmente NO se asigna — discrimina flujo QR vs directo
      return true
    } catch (e) {
      error.value  = e.message
      estado.value = 'error'
      console.error('[useCapturaDocumento] Error creando sesión:', e)
      return false
    }
  }

  // ── Subir foto directa (desde dispositivo o desde CapturaMovilPage) ───────
  async function subirFotoLocal(lado, archivo, solicitudId = null, campo = 'documento_identidad') {
    estado.value = 'subiendo'
    error.value  = null

    // Crear sesión si aún no existe (upload directo sin QR previo)
    if (!token.value) {
      const ok = await _asegurarSesion(solicitudId, campo)
      if (!ok) return
    }

    try {
      const data = await subirFotoCaptura(token.value, lado, archivo)
      if (lado === 'frente')  urlFrente.value  = data.url
      if (lado === 'reverso') urlReverso.value = data.url

      progreso.value = urlFrente.value && urlReverso.value
        ? 'ambos'
        : urlFrente.value ? 'frente' : 'reverso'

      estado.value = data.estado === 'completado' ? 'completado' : 'capturando_movil'
    } catch (e) {
      estado.value = 'error'
      error.value  = e.message
    }
  }

  // ── Vincular sesión a solicitud cuando se guarda en BD ───────────────────
  async function vincularSolicitud(solicitudId) {
    if (!token.value || !solicitudId) return
    try {
      await vincularSolicitudCaptura(token.value, solicitudId)
    } catch (e) {
      console.warn('[useCapturaDocumento] No se pudo vincular solicitud:', e)
    }
  }

  // ── Cancelar y limpiar ────────────────────────────────────────────────────
  function cancelar() {
    desuscribir()
    detenerPolling()
    estado.value     = 'idle'
    qrDataUrl.value  = null
    urlCaptura.value = null
    sesionId.value   = null
    token.value      = null
    progreso.value   = null
    error.value      = null
    urlFrente.value  = null
    urlReverso.value = null
  }

  onUnmounted(() => {
    desuscribir()
    detenerPolling()
  })

  return {
    esMovil,
    estado, urlFrente, urlReverso,
    qrDataUrl, urlCaptura, sesionId, token,
    error, progreso,
    crearSesionQR, subirFotoLocal, cancelar, vincularSolicitud,
  }
}
