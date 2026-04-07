const EF_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captura-documento`

/**
 * Crea una sesión de captura.
 * solicitudId es opcional: si aún no existe en BD se pasa null
 * y se usa sesionFormulario como identificador temporal.
 */
export async function crearSesionCaptura(solicitudId, campo = 'documento_identidad', sesionFormulario = null) {
  const res = await fetch(`${EF_BASE}/crear`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      solicitud_id:      solicitudId || null,
      sesion_formulario: sesionFormulario,
      paso:              'documento_identidad',
      campo,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al crear sesión de captura')
  return data // { sesion_id, token, url_captura }
}

/**
 * Consulta el estado actual de una sesión de captura.
 */
export async function consultarEstadoCaptura(token) {
  const res = await fetch(`${EF_BASE}/estado/${token}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al consultar estado')
  return data
}

/**
 * Sube una foto (frente o reverso) a una sesión de captura.
 */
export async function subirFotoCaptura(token, lado, archivo) {
  const fd = new FormData()
  fd.append('lado', lado)
  fd.append('foto', archivo)
  const res = await fetch(`${EF_BASE}/subir/${token}`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al subir foto')
  return data // { url, estado }
}

/**
 * Vincula una sesión de captura (creada sin solicitud_id) a la solicitud
 * una vez que esta se guarda en BD por primera vez.
 */
export async function vincularSolicitudCaptura(token, solicitudId) {
  if (!token || !solicitudId) return
  const res = await fetch(`${EF_BASE}/vincular/${token}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ solicitud_id: solicitudId }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al vincular sesión de captura')
  }
}
