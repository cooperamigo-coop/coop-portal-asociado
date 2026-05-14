import { ref, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { supabase } from '@/services/supabase'
import { crearSesionCaptura, subirFotoCaptura, vincularSolicitudCaptura, consultarEstadoCaptura } from '@/services/captura.service'
import { generarPdfCedula } from '@/utils/pdfGenerator'
import { subirDocumentoSolicitud } from '@/services/documentos.service'

async function generarDataUrlQR(texto) {
  return await QRCode.toDataURL(texto, {
    width: 280,
    margin: 1,
    color: { dark: '#172B36', light: '#ffffff' },
  })
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

      qrDataUrl.value = await generarDataUrlQR(data.url_captura)
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

  // ── Polling fallback (arranca tras 5 s para dar tiempo a Realtime) ─────────
  let _pollDelay = 3000
  let _pollTimeout = null

  function iniciarPolling(sId) {
    detenerPolling()
    _pollDelay = 3000

    function programarSiguiente() {
      _pollTimeout = setTimeout(async () => {
        if (!['esperando_qr', 'capturando_movil'].includes(estado.value)) return
        try {
          // Direct PostgREST query is blocked by RLS (requires x-capture-token header
          // which PostgREST can't receive from a Realtime/trigger context).
          // The Edge Function runs as service role and bypasses RLS.
          const data = await consultarEstadoCaptura(token.value)
          if (data) {
            aplicarActualizacion(data)
            if (data.estado === 'completado') {
              desuscribir()
              return
            }
          }
        } catch { /* ignorar */ }

        _pollDelay = Math.min(_pollDelay * 1.5, 30000)
        programarSiguiente()
      }, _pollDelay)
    }

    // Esperar 5 s antes del primer poll para que Realtime se conecte primero
    _pollTimeout = setTimeout(programarSiguiente, 5000)
  }

  function detenerPolling() {
    if (_pollTimeout) {
      clearTimeout(_pollTimeout)
      _pollTimeout = null
    }
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

  // ── Iniciar captura directa en móvil (pide permiso de cámara) ───────────
  async function iniciarCapturaMovil() {
    error.value = null
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        stream.getTracks().forEach(t => t.stop())
      } catch (e) {
        // Si se niega el permiso, igual mostramos el grid — el input capture lo maneja
      }
    }
    estado.value = 'capturando_movil'
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

  // ── Generar PDF final y subirlo ──────────────────────────────────────────
  async function finalizarConPdf(solicitudId, campo) {
    if (!urlFrente.value || !urlReverso.value) return null
    estado.value = 'subiendo'
    try {
      const pdfFile = await generarPdfCedula(urlFrente.value, urlReverso.value)
      const url = await subirDocumentoSolicitud(solicitudId, campo, pdfFile)
      estado.value = 'completado'
      return url
    } catch (e) {
      estado.value = 'error'
      error.value = 'Error al generar el PDF de la cédula.'
      throw e
    }
  }

  // ── Subir PDF directamente (opción 1) ─────────────────────────────────────
  async function subirPdfDirecto(solicitudId, campo, archivo) {
    estado.value = 'subiendo'
    try {
      const url = await subirDocumentoSolicitud(solicitudId, campo, archivo)
      estado.value = 'completado'
      return url
    } catch (e) {
      estado.value = 'error'
      error.value = 'Error al subir el PDF.'
      throw e
    }
  }

  return {
    esMovil,
    estado, urlFrente, urlReverso,
    qrDataUrl, urlCaptura, sesionId, token,
    error, progreso,
    crearSesionQR, subirFotoLocal, iniciarCapturaMovil, cancelar, vincularSolicitud,
    finalizarConPdf, subirPdfDirecto,
  }
}
