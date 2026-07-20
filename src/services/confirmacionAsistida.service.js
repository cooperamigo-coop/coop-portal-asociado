import { supabase } from './supabase'

export async function obtenerSolicitudAsistidaPorToken(token, tipo) {
  const { data, error } = await supabase.rpc('get_solicitud_asistida_por_token', {
    p_token: token,
    p_tipo: tipo,
  })
  if (error) throw error
  return data
}

export async function confirmarSolicitudAsistida(token, tipo, datos) {
  const { data, error } = await supabase.rpc('confirmar_solicitud_asistida', {
    p_token: token,
    p_tipo: tipo,
    p_datos: datos,
  })
  if (error) throw error
  return data
}
