import { supabase } from './supabase'

export async function buscarAsociadoPorCedula(cedula) {
  const { data, error } = await supabase
    .from('asociados')
    .select('id, cedula, nombres, apellidos, email, nivel_academico, titulo, fecha_nacimiento, fecha_expedicion, direccion, ciudad_expedicion, tipo_identificacion, ciudad, barrio, empresa, cargo, tipo_contrato, fecha_ingreso_empresa, ocupacion, salario, gastos_familiares, otros_ingresos, cuotas_credito, total_ingresos, total_egresos, activos_pasivos')
    .eq('cedula', cedula)
    .maybeSingle()
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

export async function actualizarEmailAsociado(cedula, email) {
  const { data, error } = await supabase.rpc('actualizar_email_asociado_portal', {
    p_cedula: cedula,
    p_nuevo_email: email.trim(),
  })
  if (error) throw error
  return data // true = actualizado, false = mismo correo o cedula no encontrada
}

export async function crearAsociadoAfiliacion(payload) {
  const { data, error } = await supabase
    .from('asociados')
    .insert({ ...payload, activo: false })
    .select('id, cedula, nombres, apellidos, email, nivel_academico, titulo, fecha_nacimiento, fecha_expedicion, direccion, ciudad_expedicion, tipo_identificacion, ciudad, barrio, empresa, cargo, tipo_contrato, fecha_ingreso_empresa, ocupacion, salario, gastos_familiares, otros_ingresos, cuotas_credito, total_ingresos, total_egresos, activos_pasivos')
    .single()

  if (error?.code === '23505') return buscarAsociadoPorCedula(payload.cedula)
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
