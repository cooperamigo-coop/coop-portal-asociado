import { supabase } from '@/services/supabase'

/**
 * Solicita el envío de un código OTP de 4 dígitos al correo indicado.
 * @param {string} email   - Dirección de correo del destinatario
 * @param {string} contexto - 'afiliacion' | 'credito'
 */
export async function enviarOtp(email, contexto) {
  const { data, error } = await supabase.functions.invoke('validate-email-otp', {
    body: { action: 'send', email, contexto },
  })
  if (error) throw error
  return data
}

/**
 * Verifica el código OTP ingresado por el usuario.
 * @param {string} email  - Correo al que se envió el código
 * @param {string} codigo - Código de 4 dígitos ingresado
 * @returns {{ ok: boolean, valid: boolean }}
 */
export async function verificarOtp(email, codigo) {
  const { data, error } = await supabase.functions.invoke('validate-email-otp', {
    body: { action: 'verify', email, codigo },
  })
  if (error) throw error
  return data
}
