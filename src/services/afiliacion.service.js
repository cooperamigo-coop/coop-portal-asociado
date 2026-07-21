import { supabase } from './supabase'

export async function buscarAsociadoPorCedula(cedula) {
  const { data, error } = await supabase.rpc('buscar_asociado_portal', { p_cedula: cedula })
  if (error) throw error
  return data
}

export async function actualizarCamposAsociado(id, campos) {
  const { error } = await supabase
    .from('asociados')
    .update(campos)
    .eq('id', id)
  if (error) throw error
}

// Sincroniza los datos del asociado con lo diligenciado en la solicitud de
// crédito (RPC SECURITY DEFINER: valida campo por campo, actualiza lo que
// cambió y nunca sobrescribe con vacío)
export async function sincronizarDatosAsociadoPortal(cedula, campos) {
  const { data, error } = await supabase.rpc('sincronizar_datos_asociado_portal', {
    p_cedula: cedula,
    p_campos: campos,
  })
  if (error) throw error
  return data
}

export async function actualizarEmailAsociado(cedula, email) {
  const { data, error } = await supabase.rpc('actualizar_email_asociado_portal', {
    p_cedula: cedula,
    p_nuevo_email: email.trim(),
  })
  if (error) throw error
  return data // true = actualizado, false = mismo correo o cedula no encontrada
}

export async function crearAsociadoAfiliacion(payload) {
  const { data, error } = await supabase.rpc('crear_asociado_portal_afiliacion', { p_payload: payload })
  if (error) throw error
  return data
}

export async function crearSolicitudAfiliacion(payload) {
  const { data, error } = await supabase
    .from('solicitudes_afiliacion')
    .insert({ ...payload, estado: 'en_revision' })
    .select('id, consecutivo')
    .single()
  if (error) throw error
  return data
}
