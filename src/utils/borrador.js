const PREFIJO = 'coop_borrador_'
const VERSION = 'v1'

function claveStorage(correo) {
  return `${PREFIJO}${VERSION}_${correo.toLowerCase().trim()}`
}

/**
 * Serializa de forma segura un objeto antes de guardarlo en localStorage.
 * Elimina Proxies de Vue, referencias circulares, imágenes base64 y funciones.
 */
function sanitizarParaStorage(obj) {
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        // Ignorar campos internos de Vue reactivity
        if (key.startsWith('__v_') || key === 'dep' || key === '_rawValue' || key === '_value') {
          return undefined
        }
        // Excluir imágenes base64 (pesan varios MB)
        if (typeof value === 'string' && value.startsWith('data:image')) {
          return '[imagen]'
        }
        // Excluir URLs de archivos subidos (se guardan en Supabase Storage)
        if ((key.endsWith('_url') || key.endsWith('_b64')) && typeof value === 'string' && value.length > 300) {
          return '[archivo]'
        }
        // Excluir funciones y símbolos
        if (typeof value === 'function' || typeof value === 'symbol') {
          return undefined
        }
        // Convertir Date a ISO string
        if (value instanceof Date) {
          return value.toISOString()
        }
        return value
      })
    )
  } catch (e) {
    console.error('[Borrador] Error al sanitizar estado:', e.message)
    return null
  }
}

/**
 * Limpia entradas antiguas de borrador (más de 7 días) para liberar cuota.
 */
function limpiarEntradasAntiguas() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(PREFIJO)) continue
      try {
        const payload = JSON.parse(localStorage.getItem(key) || '{}')
        const hace1Dia = Date.now() - 1 * 24 * 60 * 60 * 1000
        if (new Date(payload.guardadoEn).getTime() < hace1Dia) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
  } catch { /* ignorar */ }
}

/**
 * Guarda el estado actual del formulario en localStorage.
 */
export function guardarBorradorLocal(correo, datos) {
  if (!correo) return
  try {
    const sanitizado = sanitizarParaStorage(datos)
    if (!sanitizado) {
      console.warn('[Borrador] Estado no serializable — borrador no guardado')
      return
    }

    const payload = {
      datos:      sanitizado,
      guardadoEn: new Date().toISOString(),
      version:    VERSION,
    }

    const serializado = JSON.stringify(payload)
    const tamanoKB = (serializado.length * 2) / 1024

    if (tamanoKB > 3000) {
      console.warn(`[Borrador] Estado muy grande (${tamanoKB.toFixed(0)}KB) — no se guarda`)
      return
    }

    console.log(`[Borrador] Guardando ${tamanoKB.toFixed(1)}KB, paso ${sanitizado.paso || '?'}`)
    localStorage.setItem(claveStorage(correo), serializado)
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('[Borrador] localStorage lleno — limpiando entradas antiguas')
      limpiarEntradasAntiguas()
      try {
        localStorage.setItem(claveStorage(correo), JSON.stringify({
          datos: { paso: datos.paso || 1, _reducido: true },
          guardadoEn: new Date().toISOString(),
          version: VERSION,
        }))
      } catch { /* nada más se puede hacer */ }
    } else {
      console.error('[Borrador] Error guardando en localStorage:', e.message)
    }
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

    if (diasTranscurridos > 1) {
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
