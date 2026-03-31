import { supabase } from './supabase'

export async function buscarAsociadoPorCedula(cedula) {
  const { data, error } = await supabase
    .from('asociados')
    .select('id, cedula, nombres, apellidos, email')
    .eq('cedula', cedula)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function crearSolicitudAfiliacion(payload) {
  const { data, error } = await supabase
    .from('solicitudes_afiliacion')
    .insert({ ...payload, estado: 'en_revision' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearAsociadoAfiliacion(payload) {
  const { data, error } = await supabase
    .from('asociados')
    .insert({ ...payload, activo: false })
    .select()
    .single()
  if (error) throw error
  return data
}
