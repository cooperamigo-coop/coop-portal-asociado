import { supabase } from './supabase'

export async function buscarAsociadoPorCedula(cedula) {
  const { data, error } = await supabase
    .from('asociados')
    .select('id, cedula, nombres, apellidos, email, telefono, empresa, cargo, salario')
    .eq('cedula', cedula)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function crearAsociado(payload) {
  const { data, error } = await supabase
    .from('asociados')
    .insert({ ...payload, activo: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearSolicitudCredito(payload) {
  const { data, error } = await supabase
    .from('solicitudes_credito')
    .insert({ ...payload, estado: 'radicado', tasa_interes: 0.018 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function consultarEstadoSolicitud(consecutivo) {
  const { data, error } = await supabase
    .from('solicitudes_credito')
    .select(`
      consecutivo, estado, tipo_credito,
      monto_solicitado, monto_aprobado, plazo_meses,
      created_at, fecha_aprobacion, fecha_desembolso
    `)
    .eq('consecutivo', consecutivo)
    .single()
  if (error) throw error
  return data
}
