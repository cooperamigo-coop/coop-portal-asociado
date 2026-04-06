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

export async function crearAsociadoAfiliacion(payload) {
  const { error } = await supabase
    .from('asociados')
    .insert({ ...payload, activo: false })

  // Si ya existe (reintento tras error parcial), devolver el existente
  if (error?.code === '23505') {
    return buscarAsociadoPorCedula(payload.cedula)
  }

  if (error) throw error
  return buscarAsociadoPorCedula(payload.cedula)
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
