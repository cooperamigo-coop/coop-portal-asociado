import { supabase } from './supabase'

// Todas las operaciones de Crédito Rotativo van por RPCs SECURITY DEFINER
// (el portal es anónimo; nunca lee las tablas del módulo directamente).

export async function consultarCreditoRotativo(cedula) {
  const { data, error } = await supabase.rpc('consultar_credito_rotativo_portal', {
    p_cedula: cedula,
  })
  if (error) throw error
  return data // null si el asociado no tiene el producto habilitado
}

// Versión de las condiciones mostradas al asociado. Debe incrementarse cada
// vez que cambie el texto de condiciones en SeccionCreditoRotativo.vue, para
// que la evidencia probatoria (Ley 527) registre qué versión exacta se aceptó.
export const VERSION_CONDICIONES_ROTATIVO = 'condiciones-rotativo-v1.0-2026-07-17'

export async function activarCreditoRotativo(cedula, cupo, cuenta) {
  const { data, error } = await supabase.rpc('activar_credito_rotativo_portal', {
    p_cedula: cedula,
    p_cupo: cupo,
    p_banco: cuenta.banco,
    p_tipo_cuenta: cuenta.tipo,
    p_numero_cuenta: cuenta.numero,
    p_version_condiciones: VERSION_CONDICIONES_ROTATIVO,
  })
  if (error) throw error
  return data // { ok, error? }
}

export async function solicitarDesembolsoRotativo(cedula, monto) {
  const { data, error } = await supabase.rpc('solicitar_desembolso_rotativo_portal', {
    p_cedula: cedula,
    p_monto: monto,
  })
  if (error) throw error
  return data // { ok, error? }
}
