const EF_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captura-documento`

/**
 * Crea una sesión de captura en el servidor y retorna el token + URL de captura.
 */
export async function crearSesionCaptura(solicitudId, campo = 'documento_identidad') {
  const res = await fetch(`${EF_BASE}/crear`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ solicitud_id: solicitudId, paso: 'documento_identidad', campo }),
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
 * @param {string} token
 * @param {'frente'|'reverso'} lado
 * @param {File} archivo
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
