import { supabase } from '@/services/supabase'
import { logEmailEvent } from '@/services/erp-logger'

export async function enviarOtp(email, contexto) {
  const t0 = Date.now()
  const asunto = `Código de verificación — Solicitud de ${contexto === 'afiliacion' ? 'Afiliación' : 'Crédito'}`
  const template = `otp-${contexto}`

  try {
    const { data, error } = await supabase.functions.invoke('validate-email-otp', {
      body: { action: 'send', email, contexto },
    })
    if (error) throw error

    logEmailEvent({
      plataforma:       'coop-portal-frontend',
      tipo_evento:      'EMAIL_ENVIADO',
      estado:           'ENVIADO',
      destinatario:     email,
      asunto,
      template_usado:   template,
      campos_completos: ['email'],
      campos_faltantes: [],
      campos_con_error: [],
      metadata:         { contexto, duracion_ms: Date.now() - t0 },
    })

    return data
  } catch (err) {
    logEmailEvent({
      plataforma:       'coop-portal-frontend',
      tipo_evento:      'EMAIL_FALLIDO',
      estado:           'FALLIDO',
      destinatario:     email,
      asunto,
      template_usado:   template,
      campos_completos: ['email'],
      campos_faltantes: [],
      campos_con_error: [],
      mensaje_error:    err?.message ?? String(err),
      metadata:         { contexto, duracion_ms: Date.now() - t0 },
    })
    throw err
  }
}

export async function verificarOtp(email, codigo) {
  const { data, error } = await supabase.functions.invoke('validate-email-otp', {
    body: { action: 'verify', email, codigo },
  })
  if (error) throw error
  return data
}
