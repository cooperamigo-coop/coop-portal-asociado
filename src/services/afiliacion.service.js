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
  const { error } = await supabase
    .from('solicitudes_afiliacion')
    .insert({ ...payload, estado: 'en_revision' })
  if (error) throw error
}

export async function crearAsociadoAfiliacion(payload) {
  const { error } = await supabase
    .from('asociados')
    .insert({ ...payload, activo: false })

  // Si ya existe (reintento tras error parcial), buscar y devolver el existente
  if (error?.code === '23505') {
    return buscarAsociadoPorCedula(payload.cedula)
  }

  if (error) throw error
  // INSERT exitoso: buscar la fila recién creada con el SELECT policy conocido
  return buscarAsociadoPorCedula(payload.cedula)
}
