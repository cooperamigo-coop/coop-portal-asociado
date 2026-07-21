import { jsPDF } from 'jspdf'

let _fuenteCache = null

function _base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function _asegurarFuenteDmSans(doc) {
  if (_fuenteCache === false) return false
  try {
    if (!_fuenteCache) {
      const urlRegular = new URL('../assets/fonts/DMSans-Regular.ttf', import.meta.url).href
      const urlBold    = new URL('../assets/fonts/DMSans-Bold.ttf',    import.meta.url).href
      const [bufRegular, bufBold] = await Promise.all([
        fetch(urlRegular).then(r => r.arrayBuffer()),
        fetch(urlBold).then(r => r.arrayBuffer()),
      ])
      _fuenteCache = {
        regular: _base64FromArrayBuffer(bufRegular),
        bold:    _base64FromArrayBuffer(bufBold),
      }
    }
    doc.addFileToVFS('DMSans-Regular.ttf', _fuenteCache.regular)
    doc.addFont('DMSans-Regular.ttf', 'DMSans', 'normal')
    doc.addFileToVFS('DMSans-Bold.ttf', _fuenteCache.bold)
    doc.addFont('DMSans-Bold.ttf', 'DMSans', 'bold')
    return true
  } catch {
    _fuenteCache = false
    return false
  }
}

/**
 * Genera un PDF con dos imágenes, una arriba de la otra.
 * @param {string} imagenFrente  - Base64 o URL de la imagen frontal
 * @param {string} imagenReverso - Base64 o URL de la imagen de reverso
 * @returns {Promise<File>}      - El archivo PDF generado
 */
export async function generarPdfCedula(imagenFrente, imagenReverso) {
  const doc = new jsPDF()
  const dmSansOk = await _asegurarFuenteDmSans(doc)
  doc.setFont(dmSansOk ? 'DMSans' : 'helvetica', 'bold')

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const maxWidth = pageWidth - (margin * 2)
  const separacion = 8
  const etiquetaH = 6
  const espacioVertical = pageHeight - (margin * 2) - separacion - (etiquetaH * 2)
  const maxHeightPorImagen = espacioVertical / 2

  const cargarImagen = (src) => {
    // URLs blob ya están en memoria — cargar directo sin fetch
    // (fetch a blob: viola connect-src en CSP)
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo decodificar la imagen'))
        img.src = src
      })
    }
    // URLs remotas (Supabase): fetch para obtener el blob y evitar taint de canvas
    return fetch(src)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} al descargar imagen`)
        return res.blob()
      })
      .then(blob => new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo decodificar la imagen'))
        img.src = objectUrl
      }))
  }

  try {
    const [imgF, imgR] = await Promise.all([
      cargarImagen(imagenFrente),
      cargarImagen(imagenReverso)
    ])

    const calcularDimensiones = (img, box) => {
      // "Contain" dentro del marco: conserva encuadre original sin recortes
      const escalaW = box.w / img.width
      const escalaH = box.h / img.height
      const escala = Math.min(escalaW, escalaH)
      const w = img.width * escala
      const h = img.height * escala
      const x = box.x + ((box.w - w) / 2)
      const y = box.y + ((box.h - h) / 2)
      return { x, y, w, h }
    }

    const boxFrente = { x: margin, y: margin + etiquetaH, w: maxWidth, h: maxHeightPorImagen }
    const boxReverso = { x: margin, y: margin + etiquetaH + maxHeightPorImagen + separacion + etiquetaH, w: maxWidth, h: maxHeightPorImagen }

    const frente = calcularDimensiones(imgF, boxFrente)
    const reverso = calcularDimensiones(imgR, boxReverso)

    // Etiquetas (sin recuadro alrededor de las imágenes): solo "Frente"/"Reverso" en
    // negrita, el resto de la línea en regular — centradas como una sola línea.
    const font = dmSansOk ? 'DMSans' : 'helvetica'
    const dibujarEtiqueta = (negrita, resto, y) => {
      doc.setFontSize(10)
      doc.setFont(font, 'bold')
      const wNegrita = doc.getTextWidth(negrita)
      doc.setFont(font, 'normal')
      const wResto = doc.getTextWidth(resto)
      const startX = (pageWidth - (wNegrita + wResto)) / 2
      doc.setFont(font, 'bold')
      doc.text(negrita, startX, y)
      doc.setFont(font, 'normal')
      doc.text(resto, startX + wNegrita, y)
    }
    dibujarEtiqueta('Frente', ' (Documento de identificación)', margin + 4)
    dibujarEtiqueta('Reverso', ' (Documento de identificación)', boxReverso.y - 2)

    // Dibujar frente arriba y reverso abajo, ambos visibles en la misma página
    doc.addImage(imgF, 'JPEG', frente.x, frente.y, frente.w, frente.h)
    doc.addImage(imgR, 'JPEG', reverso.x, reverso.y, reverso.w, reverso.h)

    const blob = doc.output('blob')
    return new File([blob], 'cedula.pdf', { type: 'application/pdf' })
  } catch (error) {
    console.error('Error generando PDF de cédula:', error)
    throw error
  }
}
