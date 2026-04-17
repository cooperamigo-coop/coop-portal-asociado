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
  const margin = 10
  const maxWidth = pageWidth - (margin * 2)

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

    // Calcular dimensiones para que quepan (manteniendo proporción)
    const ratioF = imgF.width / imgF.height
    const ratioR = imgR.width / imgR.height

    const hF = maxWidth / ratioF
    const hR = maxWidth / ratioR

    // Dibujar frente arriba
    doc.addImage(imgF, 'JPEG', margin, margin, maxWidth, hF)

    // Dibujar reverso abajo
    doc.addImage(imgR, 'JPEG', margin, margin + hF + 10, maxWidth, hR)

    const blob = doc.output('blob')
    return new File([blob], 'cedula.pdf', { type: 'application/pdf' })
  } catch (error) {
    console.error('Error generando PDF de cédula:', error)
    throw error
  }
}
