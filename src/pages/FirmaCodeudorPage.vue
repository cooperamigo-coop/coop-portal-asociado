<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { jsPDF } from 'jspdf'
import ModalAutorizaciones from '@/components/forms/ModalAutorizaciones.vue'
import ModalOtpEmail      from '@/components/forms/ModalOtpEmail.vue'
import PortalButton       from '@/components/ui/PortalButton.vue'
import {
  IconLoader2, IconCircleCheck, IconAlertTriangle, IconDownload,
} from '@tabler/icons-vue'
import { obtenerSolicitudPorToken, guardarFirmaCodeudor } from '@/services/firmaCodeudor.service'

const route = useRoute()
const token = computed(() => route.query.token || '')

// ── Estado principal ───────────────────────────────────────────────────────────
// paso: 'cargando' | 'otp' | 'revisar' | 'firmar' | 'enviando' | 'exito' | 'error'
const paso    = ref('cargando')
const solicitud = ref(null)
const errorMsg  = ref('')

// ── Autorizaciones ─────────────────────────────────────────────────────────────
const modalAutorizacionesVisible = ref(false)
const autorizacionAceptada       = ref(false)

// ── Firma ──────────────────────────────────────────────────────────────────────
const firmaImagen        = ref('')
const nombreFirma        = ref('')
const numDocFirma        = ref('')
const firmaMetodo        = ref('dibujar')
const firmaArchivoNombre = ref('')
const firmaCanvasRef     = ref(null)
const firmaFileRef       = ref(null)
const _dibujandoFirma    = ref(false)
const _firmaTrazoPrev    = ref(null)

// ── PDF ────────────────────────────────────────────────────────────────────────
const pdfUrl   = ref('')
const _pdfAssets = {
  logoPngDataUrl: null,
  logoRatio: null,
  afacadRegularB64: null,
  afacadBoldB64: null,
  afacadFailed: false,
}

// ── Datos calculados de firma (para paso exito) ────────────────────────────────
const _firmaGuardada = ref(null)

// ── Carga inicial ──────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!token.value) {
    errorMsg.value = 'El enlace no contiene un token válido.'
    paso.value = 'error'
    return
  }
  try {
    const data = await obtenerSolicitudPorToken(token.value)
    if (data?.error) {
      const mapa = {
        token_invalido: 'El enlace de firma no es válido o ha expirado.',
        solicitud_no_disponible: 'Esta solicitud no está disponible para firma en este momento.',
      }
      errorMsg.value = mapa[data.error] || 'No se pudo cargar la solicitud.'
      paso.value = 'error'
      return
    }
    if (data?.firma_completada) {
      errorMsg.value = 'Esta firma ya fue completada anteriormente.'
      paso.value = 'error'
      return
    }
    solicitud.value = data
    paso.value = 'otp'
  } catch {
    errorMsg.value = 'No se pudo verificar el enlace. Intenta nuevamente.'
    paso.value = 'error'
  }
})

// ── OTP ────────────────────────────────────────────────────────────────────────
function onOtpValidado() {
  paso.value = 'revisar'
}

// ── Revisar → Autorizar ────────────────────────────────────────────────────────
function irAAutorizar() {
  modalAutorizacionesVisible.value = true
}

function onAutorizacionAceptada() {
  autorizacionAceptada.value = true
  paso.value = 'firmar'
  nextTick(() => prepararCanvasFirma())
}

function seleccionarMetodo(metodo) {
  firmaMetodo.value = metodo
  firmaImagen.value = ''
  if (metodo === 'dibujar') nextTick(() => prepararCanvasFirma())
}

// ── Canvas firma ───────────────────────────────────────────────────────────────
function prepararCanvasFirma() {
  const c = firmaCanvasRef.value
  if (!c) return
  const rect = c.getBoundingClientRect()
  const cssW = Math.max(1, Math.round(rect.width))
  const cssH = Math.max(1, Math.round(rect.height || 140))
  const dpr = window.devicePixelRatio || 1
  c.width  = Math.round(cssW * dpr)
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

function _canvasCtx() {
  const c = firmaCanvasRef.value
  if (!c) return null
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.lineWidth   = 2.2
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.strokeStyle = '#111827'
  return ctx
}

function _posEnCanvas(evt) {
  const c = firmaCanvasRef.value
  if (!c) return null
  const rect   = c.getBoundingClientRect()
  const clientX = evt.touches?.[0]?.clientX ?? evt.clientX
  const clientY = evt.touches?.[0]?.clientY ?? evt.clientY
  const x = clientX - rect.left
  const y = clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function iniciarFirmaDibujo(evt) {
  evt.preventDefault()
  const pos = _posEnCanvas(evt)
  if (!pos) return
  _dibujandoFirma.value   = true
  _firmaTrazoPrev.value   = pos
  const ctx = _canvasCtx()
  if (!ctx) return
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function moverFirmaDibujo(evt) {
  evt.preventDefault()
  if (!_dibujandoFirma.value) return
  const pos = _posEnCanvas(evt)
  if (!pos) { terminarFirmaDibujo(); return }
  const ctx  = _canvasCtx()
  const prev = _firmaTrazoPrev.value
  if (ctx && prev) {
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }
  _firmaTrazoPrev.value = pos
}

function terminarFirmaDibujo() {
  if (!_dibujandoFirma.value) return
  _dibujandoFirma.value = false
  _firmaTrazoPrev.value = null
  const c = firmaCanvasRef.value
  if (!c) return
  firmaImagen.value = c.toDataURL('image/png')
}

function limpiarFirmaDibujo() {
  const c = firmaCanvasRef.value
  if (!c) return
  prepararCanvasFirma()
  firmaImagen.value = ''
}

async function cargarFirmaImagen(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  firmaArchivoNombre.value = file.name || ''
  const reader = new FileReader()
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onerror = () => reject(new Error('Error leyendo imagen'))
    reader.onload  = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
  firmaImagen.value = dataUrl
}

// ── Utilidades criptográficas ──────────────────────────────────────────────────
async function _sha256Hex(texto) {
  const data = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function _base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function _obtenerIpPublica() {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 1200)
  try {
    const res  = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
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
    const d   = res.headers.get('date') ? new Date(res.headers.get('date')) : null
    if (!d || Number.isNaN(d.getTime())) return null
    return { iso: d.toISOString(), unix: String(Math.floor(d.getTime() / 1000)), fuente: 'http-date' }
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

// ── Enviar firma ───────────────────────────────────────────────────────────────
async function enviarFirma() {
  if (!nombreFirma.value.trim() || !firmaImagen.value) return
  paso.value = 'enviando'
  try {
    const ahora        = new Date().toISOString()
    const nonce        = crypto.randomUUID()
    const transaccionId = crypto.randomUUID()
    const resolucion   = `${window.screen.width}x${window.screen.height}`
    const disp         = _obtenerInfoDispositivo()
    const selloTiempo  = await _obtenerTimestampServidor()
    const ipPublica    = await _obtenerIpPublica()
    const imgHash      = await _sha256Hex(firmaImagen.value)
    const base         = [
      numDocFirma.value || '',
      nombreFirma.value.trim(),
      ahora, nonce, transaccionId,
      navigator.userAgent || '',
      navigator.platform || '',
      navigator.language || '',
      resolucion,
      firmaMetodo.value,
      imgHash,
    ].join('|')
    const hash = await _sha256Hex(base)

    const datos = {
      firma_imagen_dataurl:         firmaImagen.value,
      nombre_firma:                 nombreFirma.value.trim(),
      cc_firma:                     numDocFirma.value || '',
      firma_hash:                   hash,
      firma_ip_publica:             ipPublica,
      firma_transaccion_id:         transaccionId,
      firma_fecha_iso:              ahora,
      firma_nonce:                  nonce,
      firma_imagen_hash:            imgHash,
      firma_metodo:                 firmaMetodo.value,
      firma_timestamp_servidor_iso: selloTiempo?.iso || '',
      firma_user_agent:             navigator.userAgent || '',
      firma_dispositivo_tipo:       disp.tipo || '',
      firma_sistema_operativo:      disp.os || '',
      firma_navegador:              disp.navegador || '',
    }

    const resultado = await guardarFirmaCodeudor(token.value, datos)

    if (resultado?.error) {
      const mapa = {
        token_invalido:            'El enlace no es válido.',
        solicitud_no_disponible:   'La solicitud no está disponible.',
        ya_firmado:                'Esta firma ya fue completada anteriormente.',
      }
      errorMsg.value = mapa[resultado.error] || 'No se pudo guardar la firma.'
      paso.value = 'error'
      return
    }

    _firmaGuardada.value = { datos, hash, ipPublica, transaccionId, ahora }

    try {
      const blob = await _generarPdfConfirmacion(datos, hash, ipPublica, transaccionId, ahora)
      if (pdfUrl.value?.startsWith('blob:')) URL.revokeObjectURL(pdfUrl.value)
      pdfUrl.value = URL.createObjectURL(blob)
    } catch { /* PDF opcional */ }

    paso.value = 'exito'
  } catch {
    errorMsg.value = 'Error al enviar la firma. Intenta nuevamente.'
    paso.value = 'error'
  }
}

// ── Formato ────────────────────────────────────────────────────────────────────
function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatMonto(v) {
  const n = Number(v) || 0
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function formatFechaSimple(fechaStr) {
  if (!fechaStr) return '—'
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── PDF ────────────────────────────────────────────────────────────────────────
async function _asegurarLogoPngDataUrl() {
  if (_pdfAssets.logoPngDataUrl) return _pdfAssets.logoPngDataUrl
  const res    = await fetch('/logo-principal.svg')
  const svgText = await res.text()
  const blob   = new Blob([svgText], { type: 'image/svg+xml' })
  const url    = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload  = () => resolve(i)
      i.onerror = () => reject(new Error('No logo'))
      i.src = url
    })
    _pdfAssets.logoRatio = img.width ? (img.height / img.width) : null
    const canvas = document.createElement('canvas')
    canvas.width  = 900
    canvas.height = Math.max(300, Math.round((img.height / img.width) * 900))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    _pdfAssets.logoPngDataUrl = canvas.toDataURL('image/png')
    return _pdfAssets.logoPngDataUrl
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function _asegurarFuenteAfacad(doc) {
  if (_pdfAssets.afacadFailed) return false
  try {
    if (!_pdfAssets.afacadRegularB64 || !_pdfAssets.afacadBoldB64) {
      const urlRegular = new URL('../assets/fonts/Afacad-Regular.ttf', import.meta.url).href
      const urlBold    = new URL('../assets/fonts/Afacad-Bold.ttf',    import.meta.url).href
      const [bufR, bufB] = await Promise.all([
        fetch(urlRegular).then(r => r.arrayBuffer()),
        fetch(urlBold).then(r => r.arrayBuffer()),
      ])
      _pdfAssets.afacadRegularB64 = _base64FromArrayBuffer(bufR)
      _pdfAssets.afacadBoldB64    = _base64FromArrayBuffer(bufB)
    }
    doc.addFileToVFS('Afacad-Regular.ttf', _pdfAssets.afacadRegularB64)
    doc.addFont('Afacad-Regular.ttf', 'Afacad', 'normal')
    doc.addFileToVFS('Afacad-Bold.ttf', _pdfAssets.afacadBoldB64)
    doc.addFont('Afacad-Bold.ttf', 'Afacad', 'bold')
    return true
  } catch {
    _pdfAssets.afacadFailed = true
    return false
  }
}

async function _generarPdfConfirmacion(datos, hash, ipPublica, transaccionId, ahora) {
  const doc      = new jsPDF()
  const afacadOk = await _asegurarFuenteAfacad(doc)
  const font     = afacadOk ? 'Afacad' : 'helvetica'
  doc.setFont(font, 'normal')
  const logoPng = await _asegurarLogoPngDataUrl()

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const cPrimary  = { r: 17,  g: 76,  b: 90  }
  const cSurface  = { r: 245, g: 247, b: 250 }
  const cBorder   = { r: 220, g: 227, b: 233 }
  const cText     = { r: 17,  g: 24,  b: 39  }
  const cMuted    = { r: 107, g: 114, b: 128 }

  const sf = (c) => doc.setFillColor(c.r, c.g, c.b)
  const sd = (c) => doc.setDrawColor(c.r, c.g, c.b)
  const st = (c) => doc.setTextColor(c.r, c.g, c.b)

  const sol     = solicitud.value || {}
  const numCod  = sol.num_codeudor
  const headerH = 34

  // ── Header ──────────────────────────────────────────────────────────────────
  sf(cPrimary); doc.rect(0, 0, pageW, 6, 'F')
  sf({ r: 255, g: 255, b: 255 }); doc.rect(0, 6, pageW, headerH - 6, 'F')
  sd(cBorder); doc.line(0, headerH, pageW, headerH)

  try {
    const props  = doc.getImageProperties(logoPng)
    const ratio  = props?.width ? (props.height / props.width) : (_pdfAssets.logoRatio || 0.385)
    const logoW  = 26
    const logoH  = Math.max(8, Math.min(12, logoW * ratio))
    doc.addImage(logoPng, 'PNG', 14, 11 + ((10 - logoH) / 2), logoW, logoH)
  } catch {}

  st(cText)
  doc.setFont(font, 'bold'); doc.setFontSize(13)
  doc.text('Confirmación de firma — Codeudor', 44, 16)
  doc.setFont(font, 'normal'); doc.setFontSize(9)
  doc.text(`Fecha: ${formatearFecha(ahora)}`, pageW - 14, 14, { align: 'right' })
  doc.text(`Codeudor N°: ${numCod}`, pageW - 14, 20, { align: 'right' })

  let y = headerH + 10
  const x       = 14
  const cardW   = pageW - x * 2
  const cardPad = 8
  const r       = 3
  const sp      = (t, w) => doc.splitTextToSize(String(t ?? ''), w)

  const nuevaPagina = () => {
    doc.addPage()
    sf(cPrimary); doc.rect(0, 0, pageW, 6, 'F')
    sf({ r: 255, g: 255, b: 255 }); doc.rect(0, 6, pageW, headerH - 6, 'F')
    sd(cBorder); doc.line(0, headerH, pageW, headerH)
    try {
      const props = doc.getImageProperties(logoPng)
      const ratio = props?.width ? (props.height / props.width) : (_pdfAssets.logoRatio || 0.385)
      const logoW = 26; const logoH = Math.max(8, Math.min(12, logoW * ratio))
      doc.addImage(logoPng, 'PNG', 14, 11 + ((10 - logoH) / 2), logoW, logoH)
    } catch {}
    st(cText)
    doc.setFont(font, 'bold'); doc.setFontSize(13)
    doc.text('Confirmación de firma — Codeudor', 44, 16)
    doc.setFont(font, 'normal'); doc.setFontSize(9)
    doc.text(`Fecha: ${formatearFecha(ahora)}`, pageW - 14, 14, { align: 'right' })
    doc.text(`Codeudor N°: ${numCod}`, pageW - 14, 20, { align: 'right' })
    y = headerH + 10
  }

  const card = (titulo, items) => {
    const colGap = 10
    const colW   = (cardW - colGap) / 2
    const rows   = []
    for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1]])
    const ls = 7, vs = 9.2, ll = 3.4, vl = 4.2
    const rowH = rows.map(([izq, der]) => {
      const lL = Math.max((izq ? sp(String(izq.label || '').toUpperCase(), colW - 2) : ['']).length, (der ? sp(String(der.label || '').toUpperCase(), colW - 2) : ['']).length, 1)
      const vL = Math.max((izq ? sp(izq.value, colW - 2) : ['']).length, (der ? sp(der.value, colW - 2) : ['']).length, 1)
      return 3 + (lL * ll) + 1 + (vL * vl) + 5
    })
    const contentH = rowH.reduce((a, b) => a + b, 0)
    const alto     = 10 + contentH + cardPad + 4
    if (y + alto > pageH - 16) nuevaPagina()

    sf({ r: 255, g: 255, b: 255 }); sd(cBorder)
    doc.roundedRect(x, y, cardW, alto, r, r, 'FD')
    sf(cSurface); doc.roundedRect(x, y, cardW, 10, r, r, 'F')
    st(cText); doc.setFontSize(10); doc.setFont(font, 'bold')
    doc.text(titulo, x + cardPad, y + 7)
    doc.setFont(font, 'normal')

    let yy = y + 16
    for (let i = 0; i < rows.length; i++) {
      const [izq, der] = rows[i]
      const rH = rowH[i]
      const renderCol = (item, xOff) => {
        if (!item) return
        doc.setFontSize(ls); st(cMuted)
        const lLines = sp(String(item.label || '').toUpperCase(), colW - 2)
        lLines.forEach((l, j) => doc.text(l, xOff, yy + (j * ll)))
        doc.setFontSize(vs); st(cText)
        const vLines = sp(item.value, colW - 2)
        vLines.forEach((l, j) => doc.text(l, xOff, yy + (lLines.length * ll) + 1 + (j * vl)))
      }
      renderCol(izq, x + cardPad)
      renderCol(der, x + cardPad + colW + colGap)
      yy += rH
    }
    y += alto + 8
  }

  // ── Tarjetas ────────────────────────────────────────────────────────────────
  card('Datos de la solicitud', [
    { label: 'Titular',         value: `${sol.nombres_titular || ''} ${sol.apellidos_titular || ''}`.trim() || '—' },
    { label: 'Fecha solicitud', value: sol.fecha_solicitud ? formatFechaSimple(sol.fecha_solicitud) : '—' },
    { label: 'Valor crédito',   value: sol.valor_credito ? formatMonto(sol.valor_credito) : '—' },
    { label: 'Plazo',           value: sol.plazo_solicitado ? `${sol.plazo_solicitado} meses` : '—' },
    { label: 'Destino',         value: sol.destino_credito || '—' },
    { label: 'Modalidad',       value: sol.modalidad_credito || '—' },
  ])

  card('Datos del codeudor firmante', [
    { label: 'Nombre completo',  value: datos.nombre_firma || '—' },
    { label: 'Identificación',   value: datos.cc_firma || '—' },
    { label: 'Rol',              value: `Codeudor N° ${numCod}` },
    { label: 'Correo verificado', value: sol.email_codeudor || '—' },
  ])

  card('Evidencia de firma electrónica', [
    { label: 'Fecha firma',    value: formatearFecha(ahora) },
    { label: 'Método',         value: datos.firma_metodo || 'dibujar' },
    { label: 'Hash firma',     value: hash || '—' },
    { label: 'IP pública',     value: ipPublica || '—' },
    { label: 'Transacción ID', value: transaccionId || '—' },
    { label: 'Dispositivo',    value: [datos.firma_dispositivo_tipo, datos.firma_sistema_operativo, datos.firma_navegador].filter(Boolean).join(' / ') || '—' },
  ])

  // ── Imagen firma ────────────────────────────────────────────────────────────
  const img = firmaImagen.value
  if (img) {
    const imgW = cardW
    const imgH = 28
    if (y + imgH + 10 > pageH - 16) nuevaPagina()
    sd(cBorder); sf({ r: 255, g: 255, b: 255 })
    doc.roundedRect(x, y, imgW, imgH, r, r, 'FD')
    try {
      doc.addImage(img, 'PNG', x + 6, y + 6, imgW - 12, imgH - 12)
    } catch {
      st(cMuted); doc.setFontSize(8)
      doc.text('Firma (imagen no disponible)', x + 6, y + 16)
    }
    y += imgH + 8
  }

  // ── Pie de página ───────────────────────────────────────────────────────────
  st(cMuted); doc.setFontSize(7.5)
  doc.text(
    'Documento generado por el portal de Cooperamigo. Tiene validez como evidencia de firma electrónica.',
    pageW / 2, pageH - 10, { align: 'center' }
  )

  return doc.output('blob')
}

function descargarPdf() {
  if (!pdfUrl.value) return
  const a  = document.createElement('a')
  a.href   = pdfUrl.value
  a.download = `firma-codeudor-${solicitud.value?.num_codeudor || ''}-${Date.now()}.pdf`
  a.click()
}
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: 'var(--color-bg-app)',
    display: 'flex',
    flexDirection: 'column',
  }">

    <!-- Mini-header ──────────────────────────────────────────────────────── -->
    <header :style="{
      background: 'var(--color-primary)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: 'var(--shadow-card)',
    }">
      <img src="/logo-principal.svg" alt="Cooperamigó" :style="{ height: '28px', filter: 'brightness(0) invert(1)' }" />
      <span :style="{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-sm)' }">Portal de Firma</span>
    </header>

    <!-- Contenido principal ─────────────────────────────────────────────── -->
    <div :style="{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: paso === 'cargando' || paso === 'enviando' ? 'center' : 'flex-start',
      padding: '32px 16px 64px',
    }">

      <!-- CARGANDO ────────────────────────────────────────────────────────── -->
      <div v-if="paso === 'cargando'" :style="{ textAlign: 'center' }">
        <IconLoader2 :size="44" :style="{ color: 'var(--color-primary)', animation: 'girar 1s linear infinite' }" />
        <p :style="{ marginTop: '14px', color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">Verificando enlace...</p>
      </div>

      <!-- ENVIANDO ────────────────────────────────────────────────────────── -->
      <div v-else-if="paso === 'enviando'" :style="{ textAlign: 'center' }">
        <IconLoader2 :size="44" :style="{ color: 'var(--color-primary)', animation: 'girar 1s linear infinite' }" />
        <p :style="{ marginTop: '14px', color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">Guardando tu firma...</p>
      </div>

      <!-- ERROR ──────────────────────────────────────────────────────────── -->
      <div v-else-if="paso === 'error'" :style="{
        maxWidth: '480px', width: '100%',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--r-lg)',
        padding: '36px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
      }">
        <IconAlertTriangle :size="52" :style="{ color: 'var(--color-error)', marginBottom: '16px' }" />
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '10px' }">
          Enlace no disponible
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', lineHeight: '1.7' }">{{ errorMsg }}</p>
      </div>

      <!-- OTP ────────────────────────────────────────────────────────────── -->
      <!-- ModalOtpEmail usa Teleport to="body" — se monta como overlay modal -->
      <template v-if="paso === 'otp'">
        <div :style="{ maxWidth: '480px', width: '100%', textAlign: 'center' }">
          <h2 :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '6px' }">
            Verificación de identidad
          </h2>
          <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">
            Recibirás un código de verificación en tu correo para continuar.
          </p>
        </div>
        <ModalOtpEmail
          :email="solicitud?.email_codeudor || ''"
          contexto="firma_codeudor"
          @validado="onOtpValidado"
        />
      </template>

      <!-- REVISAR ─────────────────────────────────────────────────────────── -->
      <div v-else-if="paso === 'revisar'" :style="{ maxWidth: '640px', width: '100%' }">
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '4px' }">
          Revisa los datos de la solicitud
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginBottom: '24px' }">
          Estás siendo convocado como <strong>codeudor N° {{ solicitud?.num_codeudor }}</strong> en la siguiente solicitud de crédito.
        </p>

        <!-- Card titular -->
        <div :style="{
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)',
        }">
          <p :style="{
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
            color: 'var(--color-text-3)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '14px',
          }">Titular de la solicitud</p>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Nombre</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.nombres_titular }} {{ solicitud?.apellidos_titular }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Identificación</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.tipo_documento_titular }} {{ solicitud?.num_doc_titular }}
              </p>
            </div>
          </div>
        </div>

        <!-- Card crédito -->
        <div :style="{
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)',
        }">
          <p :style="{
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
            color: 'var(--color-text-3)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '14px',
          }">Datos del crédito</p>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Valor solicitado</p>
              <p :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">
                {{ solicitud?.valor_credito ? formatMonto(solicitud.valor_credito) : '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Plazo</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.plazo_solicitado ? `${solicitud.plazo_solicitado} meses` : '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Destino</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.destino_credito || '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Modalidad</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.modalidad_credito || '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Fecha solicitud</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.fecha_solicitud ? formatFechaSimple(solicitud.fecha_solicitud) : '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Tipo de operación</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.tipo_operacion || '—' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Aviso -->
        <div :style="{
          background: 'var(--color-primary-light)',
          borderRadius: 'var(--r-md)',
          padding: '14px 16px',
          marginBottom: '24px',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-primary)',
          lineHeight: '1.6',
        }">
          Al continuar, confirmas que has revisado los datos de esta solicitud y procederás a firmar como codeudor,
          asumiendo las responsabilidades que esto implica conforme a las autorizaciones que se presentarán a continuación.
        </div>

        <PortalButton variant="primary" full @click="irAAutorizar">
          Continuar — Aceptar autorizaciones
        </PortalButton>
      </div>

      <!-- FIRMAR ──────────────────────────────────────────────────────────── -->
      <div v-else-if="paso === 'firmar'" :style="{ maxWidth: '560px', width: '100%' }">
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '4px' }">
          Firma electrónica
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginBottom: '24px' }">
          Completa los campos y dibuja tu firma para finalizar el proceso.
        </p>

        <div :style="{ display: 'flex', flexDirection: 'column', gap: '18px' }">

          <!-- Nombre -->
          <div>
            <label :style="{
              display: 'block', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)', marginBottom: '6px',
            }">
              Nombre completo (tal como aparece en su cédula)
            </label>
            <input
              v-model="nombreFirma"
              type="text"
              placeholder="Ej: JUAN CAMILO PÉREZ GÓMEZ"
              :style="{
                width: '100%', boxSizing: 'border-box',
                height: '44px', padding: '0 12px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-1)', outline: 'none',
              }"
            />
          </div>

          <!-- Número de identificación -->
          <div>
            <label :style="{
              display: 'block', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)', marginBottom: '6px',
            }">
              Número de identificación
            </label>
            <input
              v-model="numDocFirma"
              type="text"
              placeholder="Ej: 12345678"
              :style="{
                width: '100%', boxSizing: 'border-box',
                height: '44px', padding: '0 12px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-1)', outline: 'none',
              }"
            />
          </div>

          <!-- Selector método -->
          <div :style="{ display: 'flex', gap: '8px' }">
            <button
              v-for="m in [{ k: 'dibujar', label: 'Dibujar firma' }, { k: 'cargar', label: 'Cargar imagen' }]"
              :key="m.k"
              :style="{
                padding: '8px 16px',
                borderRadius: 'var(--r-md)',
                border: firmaMetodo === m.k ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: firmaMetodo === m.k ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                color: firmaMetodo === m.k ? 'var(--color-primary)' : 'var(--color-text-2)',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-base)',
              }"
              @click="seleccionarMetodo(m.k)"
            >
              {{ m.label }}
            </button>
          </div>

          <!-- Canvas dibujar -->
          <div v-if="firmaMetodo === 'dibujar'">
            <div :style="{
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              background: 'white',
            }">
              <canvas
                ref="firmaCanvasRef"
                width="720"
                height="220"
                :style="{ width: '100%', height: '140px', touchAction: 'none', display: 'block', cursor: 'crosshair' }"
                @mousedown="iniciarFirmaDibujo"
                @mousemove="moverFirmaDibujo"
                @mouseup="terminarFirmaDibujo"
                @mouseleave="terminarFirmaDibujo"
                @touchstart.prevent="iniciarFirmaDibujo"
                @touchmove.prevent="moverFirmaDibujo"
                @touchend.prevent="terminarFirmaDibujo"
              />
            </div>
            <button
              :style="{
                marginTop: '6px', background: 'none', border: 'none',
                color: 'var(--color-text-3)', fontSize: 'var(--text-sm)',
                cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-body)',
              }"
              @click="limpiarFirmaDibujo"
            >Limpiar</button>
          </div>

          <!-- Cargar imagen -->
          <div v-else-if="firmaMetodo === 'cargar'">
            <div
              :style="{
                border: '2px dashed var(--color-border)', borderRadius: 'var(--r-md)',
                padding: '28px', textAlign: 'center', cursor: 'pointer',
                background: 'var(--color-bg-app)',
              }"
              @click="firmaFileRef?.click()"
            >
              <p v-if="!firmaImagen" :style="{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }">
                Haz clic para seleccionar una imagen de tu firma (PNG o JPG)
              </p>
              <img
                v-else
                :src="firmaImagen"
                :style="{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }"
                alt="Vista previa de firma"
              />
            </div>
            <input
              ref="firmaFileRef"
              type="file"
              accept="image/png,image/jpeg"
              :style="{ display: 'none' }"
              @change="cargarFirmaImagen"
            />
          </div>

          <!-- Confirmación imagen capturada -->
          <div
            v-if="firmaMetodo === 'dibujar' && firmaImagen"
            :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)' }"
          >
            Firma capturada. Puedes volver a dibujar si deseas cambiarla.
          </div>

          <PortalButton
            variant="primary"
            full
            :disabled="!nombreFirma.trim() || !firmaImagen"
            @click="enviarFirma"
          >
            Aplicar firma electrónica
          </PortalButton>
        </div>
      </div>

      <!-- ÉXITO ──────────────────────────────────────────────────────────── -->
      <div
        v-else-if="paso === 'exito'"
        :style="{
          maxWidth: '480px', width: '100%',
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--r-lg)',
          padding: '36px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <IconCircleCheck :size="60" :style="{ color: 'var(--color-primary)', marginBottom: '18px' }" />
        <h2 :style="{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '10px' }">
          ¡Firma completada!
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', lineHeight: '1.7', marginBottom: '28px' }">
          Tu firma electrónica ha sido registrada exitosamente como <strong>codeudor N° {{ solicitud?.num_codeudor }}</strong>.
          Puedes cerrar esta ventana.
        </p>
        <PortalButton v-if="pdfUrl" variant="secondary" full @click="descargarPdf">
          <IconDownload :size="16" />
          Descargar comprobante PDF
        </PortalButton>
      </div>

    </div>

    <!-- Modal Autorizaciones ────────────────────────────────────────────── -->
    <ModalAutorizaciones
      :visible="modalAutorizacionesVisible"
      :aceptado="autorizacionAceptada"
      @update:visible="modalAutorizacionesVisible = $event"
      @aceptar="onAutorizacionAceptada"
      @rechazar="modalAutorizacionesVisible = false"
    />
  </div>
</template>

<style scoped>
@keyframes girar {
  to { transform: rotate(360deg); }
}
</style>
