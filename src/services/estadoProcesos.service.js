import { supabase } from './supabase'
import { hashearTexto } from '@/utils/seguridad'

export async function consultarEstadoProcesos(cedula, correo) {
  const cedulaLimpia = cedula.trim()
  const correoLimpio = correo.trim().toLowerCase()
  const correoHash   = await hashearTexto(correoLimpio)

  const permitido = await verificarRateLimitEstado(cedulaLimpia, correoHash)
  if (!permitido) {
    throw new Error('Has superado el número de intentos permitidos. Inténtalo de nuevo más tarde.')
  }

  const { data, error } = await supabase.rpc('consultar_estado_procesos_portal', {
    p_cedula: cedulaLimpia,
    p_correo: correoLimpio,
  })
  if (error) throw error

  // Solo se cuenta hacia el límite cuando los datos NO corresponden a nada real.
  // Una persona con datos correctos puede consultar su estado tantas veces como quiera.
  if (!data?.encontrado) {
    await registrarIntentoEstado(cedulaLimpia, correoHash)
  }

  return data
}

async function verificarRateLimitEstado(cedula, correoHash) {
  try {
    const { data, error } = await supabase.rpc('verificar_rate_limit_estado', {
      p_cedula: cedula,
      p_correo_hash: correoHash,
    })
    if (error) {
      console.error('[estadoProcesos] RPC rate limit error — dejar pasar:', error.message)
      return true
    }
    return data === true
  } catch {
    return true // en caso de error de red, no bloquear
  }
}

async function registrarIntentoEstado(cedula, correoHash) {
  try {
    await supabase.rpc('registrar_intento_estado', { p_cedula: cedula, p_correo_hash: correoHash })
  } catch {
    // no bloquear si la RPC no está disponible
  }
}
