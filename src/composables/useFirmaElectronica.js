import { ref, nextTick } from 'vue'

// Composable de firma manuscrita en canvas + captura de metadata forense.
// Replica el patrón ya usado en FirmaCodeudorPage.vue para reutilizarlo en
// otros flujos de confirmación por token (ej. radicación asistida).
export function useFirmaElectronica() {
  const firmaImagen = ref('')
  const firmaCanvasRef = ref(null)
  const firmaFileRef = ref(null)
  const errorFirmaArchivo = ref('')
  const FIRMA_TAMANO_MAXIMO_MB = 3
  const _dibujando = ref(false)
  const _trazoPrev = ref(null)

  function prepararCanvas() {
    const c = firmaCanvasRef.value
    if (!c) return
    const rect = c.getBoundingClientRect()
    const cssW = Math.max(1, Math.round(rect.width))
    const cssH = Math.max(1, Math.round(rect.height || 140))
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(cssW * dpr)
    c.height = Math.round(cssH * dpr)
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(12, cssH - 24)
    ctx.lineTo(cssW - 12, cssH - 24)
    ctx.stroke()
    ctx.setLineDash([])
  }

  function _ctx() {
    const c = firmaCanvasRef.value
    if (!c) return null
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
    return ctx
  }

  function _pos(evt) {
    const c = firmaCanvasRef.value
    if (!c) return null
    const rect = c.getBoundingClientRect()
    const clientX = evt.touches?.[0]?.clientX ?? evt.clientX
    const clientY = evt.touches?.[0]?.clientY ?? evt.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
    return { x, y }
  }

  function iniciarTrazo(evt) {
    evt.preventDefault()
    const pos = _pos(evt)
    if (!pos) return
    _dibujando.value = true
    _trazoPrev.value = pos
    const ctx = _ctx()
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function moverTrazo(evt) {
    evt.preventDefault()
    if (!_dibujando.value) return
    const pos = _pos(evt)
    if (!pos) { terminarTrazo(); return }
    const ctx = _ctx()
    const prev = _trazoPrev.value
    if (ctx && prev) {
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    _trazoPrev.value = pos
  }

  function terminarTrazo() {
    if (!_dibujando.value) return
    _dibujando.value = false
    _trazoPrev.value = null
    const c = firmaCanvasRef.value
    if (!c) return
    firmaImagen.value = c.toDataURL('image/png')
  }

  function limpiarTrazo() {
    prepararCanvas()
    firmaImagen.value = ''
  }

  async function cargarFirmaImagen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    errorFirmaArchivo.value = ''
    if (file.size > FIRMA_TAMANO_MAXIMO_MB * 1024 * 1024) {
      errorFirmaArchivo.value = `La imagen pesa demasiado (máximo ${FIRMA_TAMANO_MAXIMO_MB}MB). Reduce el tamaño e intenta de nuevo.`
      return
    }
    const reader = new FileReader()
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('Error leyendo imagen'))
      reader.onload = () => resolve(String(reader.result || ''))
      reader.readAsDataURL(file)
    })
    firmaImagen.value = dataUrl
  }

  async function _sha256Hex(texto) {
    const data = new TextEncoder().encode(texto)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function _obtenerIpPublica() {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1200)
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
      if (!res.ok) return ''
      const data = await res.json()
      return String(data?.ip || '')
    } catch { return '' } finally { clearTimeout(t) }
  }

  async function _obtenerTimestampServidor() {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1200)
    try {
      const res = await fetch('/', { method: 'HEAD', cache: 'no-store', signal: ctrl.signal })
      const d = res.headers.get('date') ? new Date(res.headers.get('date')) : null
      if (!d || Number.isNaN(d.getTime())) return null
      return { iso: d.toISOString(), unix: String(Math.floor(d.getTime() / 1000)) }
    } catch { return null } finally { clearTimeout(t) }
  }

  function _obtenerInfoDispositivo() {
    const ua = navigator.userAgent || ''
    const tipo = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'movil' : 'desktop'
    const os =
      /Windows NT/i.test(ua) ? 'Windows' :
      /Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua) ? 'macOS' :
      /Android/i.test(ua) ? 'Android' :
      /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
      /Linux/i.test(ua) ? 'Linux' : ''
    const navegador =
      /Edg\//i.test(ua) ? 'Edge' :
      /OPR\//i.test(ua) ? 'Opera' :
      /Chrome\//i.test(ua) && !/Edg\//i.test(ua) ? 'Chrome' :
      /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'Safari' :
      /Firefox\//i.test(ua) ? 'Firefox' : ''
    return { tipo, os, navegador }
  }

  function _obtenerGeolocalizacion() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      const t = setTimeout(() => resolve(null), 4000)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(t)
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
        },
        () => { clearTimeout(t); resolve(null) },
        { timeout: 3500, maximumAge: 60000 },
      )
    })
  }

  // Construye el objeto de evidencia forense de la firma (hash, ip, dispositivo, geo).
  async function capturarMetadataForense({ identificacion = '', nombre = '' } = {}) {
    const ahora = new Date().toISOString()
    const nonce = crypto.randomUUID()
    const transaccionId = crypto.randomUUID()
    const resolucion = `${window.screen.width}x${window.screen.height}`
    const disp = _obtenerInfoDispositivo()
    const [selloTiempo, ipPublica, geo] = await Promise.all([
      _obtenerTimestampServidor(),
      _obtenerIpPublica(),
      _obtenerGeolocalizacion(),
    ])
    const imgHash = firmaImagen.value ? await _sha256Hex(firmaImagen.value) : ''
    const base = [
      identificacion, nombre, ahora, nonce, transaccionId,
      navigator.userAgent || '', navigator.platform || '', navigator.language || '',
      resolucion, imgHash,
    ].join('|')
    const hash = await _sha256Hex(base)

    return {
      firma_imagen_dataurl: firmaImagen.value,
      nombre_firma: nombre,
      cc_firma: identificacion,
      firma_hash: hash,
      ip_publica: ipPublica,
      user_agent: navigator.userAgent || '',
      firma_transaccion_id: transaccionId,
      firma_nonce: nonce,
      firma_timestamp_servidor_iso: selloTiempo?.iso || '',
      firma_dispositivo_tipo: disp.tipo || '',
      firma_sistema_operativo: disp.os || '',
      firma_navegador: disp.navegador || '',
      geo: geo || {},
    }
  }

  function prepararCanvasEnSiguienteTick() {
    nextTick(() => prepararCanvas())
  }

  return {
    firmaImagen, firmaCanvasRef, firmaFileRef, errorFirmaArchivo, FIRMA_TAMANO_MAXIMO_MB,
    prepararCanvas, prepararCanvasEnSiguienteTick,
    iniciarTrazo, moverTrazo, terminarTrazo, limpiarTrazo,
    cargarFirmaImagen, capturarMetadataForense,
  }
}
