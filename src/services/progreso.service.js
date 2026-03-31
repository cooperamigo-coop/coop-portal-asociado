import { supabase } from './supabase'

export async function buscarBorrador(email, tipo) {
  const { data, error } = await supabase
    .from('borradores')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('tipo', tipo)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function guardarBorrador(email, tipo, paso, datos) {
  const { error } = await supabase
    .from('borradores')
    .upsert(
      { email: email.toLowerCase().trim(), tipo, paso_actual: paso, datos },
      { onConflict: 'email,tipo' }
    )
  if (error) throw error
}

export async function eliminarBorrador(email, tipo) {
  const { error } = await supabase
    .from('borradores')
    .delete()
    .eq('email', email.toLowerCase().trim())
    .eq('tipo', tipo)
  if (error) throw error
}
