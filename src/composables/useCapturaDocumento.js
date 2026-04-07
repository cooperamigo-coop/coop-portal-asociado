import { ref, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { supabase } from '@/services/supabase'
import { crearSesionCaptura, subirFotoCaptura, vincularSolicitudCaptura } from '@/services/captura.service'

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

  let canalRealtime = null

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

      qrDataUrl.value = await QRCode.toDataURL(data.url_captura, {
        width:  280,
        margin: 2,
        color:  { dark: '#172B36', light: '#FFFFFF' },
      })

      estado.value = 'esperando_qr'
      suscribirRealtime(data.sesion_id)
    } catch (e) {
      estado.value = 'error'
      error.value  = e.message
      console.error('[useCapturaDocumento] Error:', e)
    }
  }

  // ── Realtime: escuchar actualizaciones de la sesión ──────────────────────
  function suscribirRealtime(sId) {
    if (canalRealtime) supabase.removeChannel(canalRealtime)

    canalRealtime = supabase
      .channel(`captura-${sId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sesiones_captura_documento', filter: `id=eq.${sId}` },
        (payload) => {
          const row = payload.new
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
          } else {
            estado.value = 'capturando_movil'
          }
        }
      )
      .subscribe()
  }

  function desuscribir() {
    if (canalRealtime) {
      supabase.removeChannel(canalRealtime)
      canalRealtime = null
    }
  }

  // ── Subir foto directa (móvil usa el componente sin QR) ──────────────────
  async function subirFotoLocal(lado, archivo) {
    if (!token.value) return
    estado.value = 'subiendo'
    error.value  = null

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

  onUnmounted(desuscribir)

  return {
    esMovil,
    estado, urlFrente, urlReverso,
    qrDataUrl, urlCaptura, sesionId, token,
    error, progreso,
    crearSesionQR, subirFotoLocal, cancelar, vincularSolicitud,
  }
}
