import { supabase } from './supabase'

// Verificar si el asociado existe via RPC
export async function verificarAsociado(numeroDocumento, tipoDocumento) {
  const { data, error } = await supabase.rpc('verificar_asociado_portal', {
    p_numero_documento: numeroDocumento,
    p_tipo_documento:   tipoDocumento,
  })
  if (error) throw error
  // data: { existe: boolean, nombre_corto?: string, inicial_apellido?: string }
  return data
}

export async function crearBorrador(datos) {
  const { data, error } = await supabase
    .from('solicitudes_credito_portal')
    .insert({ ...datos, estado: 'borrador' })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function actualizarBorrador(id, datos) {
  if (!id || id === 'null') throw new Error('ID de solicitud inválido')
  const { data, error } = await supabase
    .from('solicitudes_credito_portal')
    .update({ ...datos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('estado', 'borrador')
    .select()
    .single()
  if (error) throw error
  return data
}

export async function enviarSolicitud(id) {
  const { data, error } = await supabase
    .from('solicitudes_credito_portal')
    .update({ estado: 'enviado' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
