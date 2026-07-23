const EF_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captura-documento`

/** Lee la respuesta como texto y luego intenta parsearla como JSON */
async function leerRespuesta(res) {
  const texto = await res.text()
  if (!res.ok) {
    console.error(`[captura.service] Error ${res.status} de la EF:`, texto.slice(0, 400))
    let mensaje = `Error ${res.status}`
    try {
      const json = JSON.parse(texto)
      mensaje = json.error || json.message || mensaje
    } catch { /* body no es JSON — usar el texto crudo */ }
    throw new Error(mensaje)
  }
  try {
    return JSON.parse(texto)
  } catch {
    throw new Error(`Respuesta inesperada de la Edge Function: ${texto.slice(0, 200)}`)
  }
}

/**
 * Crea una sesión de captura.
 * solicitudId es opcional: si aún no existe en BD se pasa null
 * y se usa sesionFormulario como identificador temporal.
 */
export async function crearSesionCaptura(solicitudId, campo = 'documento_identidad', sesionFormulario = null) {
  const url = `${EF_BASE}/crear`
  const body = {
    solicitud_id:      solicitudId || null,
    sesion_formulario: sesionFormulario || null,
    paso:              'documento_identidad',
    campo,
  }
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  const data = await leerRespuesta(res)
  return data // { sesion_id, token, url_captura }
}

/**
 * Consulta el estado actual de una sesión de captura.
 */
export async function consultarEstadoCaptura(token) {
  const res = await fetch(`${EF_BASE}/estado/${token}`, {
    headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
  })
  return leerRespuesta(res)
}

/**
 * Sube una foto (frente o reverso) a una sesión de captura.
 */
export async function subirFotoCaptura(token, lado, archivo) {
  const fd = new FormData()
  fd.append('lado', lado)
  fd.append('foto', archivo)
  const res = await fetch(`${EF_BASE}/subir/${token}`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body:    fd,
  })
  return leerRespuesta(res) // { url, estado }
}

/**
 * Vincula una sesión de captura a la solicitud una vez guardada en BD.
 */
export async function vincularSolicitudCaptura(token, solicitudId) {
  if (!token || !solicitudId) return
  const res = await fetch(`${EF_BASE}/vincular/${token}`, {
    method:  'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ solicitud_id: solicitudId }),
  })
  if (!res.ok) await leerRespuesta(res) // solo para lanzar el error
}
