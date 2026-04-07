const PREFIJO = 'coop_borrador_'
const VERSION = 'v1'

function claveStorage(correo) {
  return `${PREFIJO}${VERSION}_${correo.toLowerCase().trim()}`
}

/**
 * Guarda el estado actual del formulario en localStorage.
 * Se llama al avanzar cada paso.
 */
export function guardarBorradorLocal(correo, datos) {
  if (!correo) return
  try {
    const payload = {
      datos,
      guardadoEn: new Date().toISOString(),
      version:    VERSION,
    }
    localStorage.setItem(claveStorage(correo), JSON.stringify(payload))
  } catch {
    console.warn('No se pudo guardar el borrador local')
  }
}

/**
 * Recupera el borrador guardado para un correo.
 * Retorna null si no hay borrador o expiró (7 días).
 */
export function recuperarBorradorLocal(correo) {
  if (!correo) return null
  try {
    const raw = localStorage.getItem(claveStorage(correo))
    if (!raw) return null

    const payload = JSON.parse(raw)
    const diasTranscurridos =
      (new Date() - new Date(payload.guardadoEn)) / (1000 * 60 * 60 * 24)

    if (diasTranscurridos > 7) {
      localStorage.removeItem(claveStorage(correo))
      return null
    }

    return payload.datos
  } catch {
    return null
  }
}

/**
 * Elimina el borrador al enviar la solicitud exitosamente.
 */
export function limpiarBorradorLocal(correo) {
  if (!correo) return
  try {
    localStorage.removeItem(claveStorage(correo))
  } catch {}
}

/**
 * Verifica si existe un borrador para ese correo sin recuperarlo.
 */
export function tieneBorrador(correo) {
  if (!correo) return false
  try {
    return !!localStorage.getItem(claveStorage(correo))
  } catch {
    return false
  }
}

/**
 * Retorna la fecha de guardado del borrador sin recuperar todos los datos.
 */
export function obtenerFechaBorrador(correo) {
  if (!correo) return null
  try {
    const raw = localStorage.getItem(claveStorage(correo))
    if (!raw) return null
    const payload = JSON.parse(raw)
    return payload.guardadoEn || null
  } catch {
    return null
  }
}
