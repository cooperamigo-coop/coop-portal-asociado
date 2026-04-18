import { jsPDF } from 'jspdf'

/**
 * Genera un PDF con dos imágenes, una arriba de la otra.
 * @param {string} imagenFrente  - Base64 o URL de la imagen frontal
 * @param {string} imagenReverso - Base64 o URL de la imagen de reverso
 * @returns {Promise<File>}      - El archivo PDF generado
 */
export async function generarPdfCedula(imagenFrente, imagenReverso) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const maxWidth = pageWidth - (margin * 2)
  const separacion = 8
  const etiquetaH = 6
  const espacioVertical = pageHeight - (margin * 2) - separacion - (etiquetaH * 2)
  const maxHeightPorImagen = espacioVertical / 2

  const cargarImagen = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = src
      img.onload = () => resolve(img)
      img.onerror = reject
    })
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

    // Etiquetas y marcos para dejar ambas fotos "encuadradas"
    doc.setFontSize(10)
    doc.text('Frente', margin, margin + 4)
    doc.rect(boxFrente.x, boxFrente.y, boxFrente.w, boxFrente.h)
    doc.text('Reverso', margin, boxReverso.y - 2)
    doc.rect(boxReverso.x, boxReverso.y, boxReverso.w, boxReverso.h)

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
