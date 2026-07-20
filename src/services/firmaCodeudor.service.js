import { supabase } from './supabase'

/**
 * Obtiene los datos de la solicitud a través del token de firma del codeudor.
 * @param {string} token - Token único del codeudor (token_firma_codeudor1 o 2)
 * @returns {Promise<object>} - Datos de la solicitud o { error: string }
 */
export async function obtenerSolicitudPorToken(token) {
  const { data, error } = await supabase.rpc('get_solicitud_por_token', {
    p_token: token,
  })
  if (error) throw error
  return data
}

/**
 * Guarda la firma electrónica del codeudor en la BD.
 * @param {string} token - Token único del codeudor
 * @param {object} datos - { firma_imagen_dataurl, nombre_firma, cc_firma, firma_hash, firma_ip_publica, firma_transaccion_id }
 * @returns {Promise<object>} - { ok: true, num_codeudor, estado } o { error: string }
 */
export async function guardarFirmaCodeudor(token, datos) {
  const { data, error } = await supabase.rpc('guardar_firma_codeudor', {
    p_token: token,
    p_datos: datos,
  })
  if (error) throw error
  return data
}
