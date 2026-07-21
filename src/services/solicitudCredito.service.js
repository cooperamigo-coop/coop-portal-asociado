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
  // UUID generado en cliente para evitar PGRST116 cuando RLS bloquea el read-back del INSERT
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('solicitudes_credito_portal')
    .insert({ id, ...datos, estado: 'borrador' })
  if (error) throw error
  return { id }
}

export async function actualizarBorrador(id, datos) {
  if (!id || id === 'null') throw new Error('ID de solicitud inválido')
  const { data, error } = await supabase.rpc('actualizar_borrador_credito_portal', {
    p_id: id,
    p_datos: datos,
  })
  if (error) throw error
  return data // null si no hay fila que coincida (solicitud enviada o eliminada)
}

export async function enviarSolicitud(id) {
  const { data, error } = await supabase.rpc('enviar_solicitud_credito_portal', { p_id: id })
  if (error) throw error
  if (!data) throw new Error('Solicitud no encontrada o ya fue enviada')
  return data
}

export async function obtenerConsecutivoRadicado(solicitudId) {
  const { data, error } = await supabase.rpc('obtener_consecutivo_radicado', {
    p_id: solicitudId,
  })
  if (error) throw error
  return data ?? 1
}

export async function notificarCodudores(solicitudId) {
  const { error } = await supabase.functions.invoke('notificar-codeudores', {
    body: { solicitud_id: solicitudId },
  })
  if (error) throw error
}

export async function notificarTitularSolicitudRadicada({
  solicitudId,
  emailTitular,
  nombreTitular,
  radicado,
  requiereCodeudores,
  numCodeudores,
  fechaSolicitudIso,
}) {
  const pasos = [
    'Recepción de la solicitud y validación inicial.',
    'Revisión de información y documentos.',
    'Análisis de riesgo y capacidad de pago.',
    'Aprobación y formalización del crédito.',
    'Desembolso (si aplica) y notificación de resultado.',
  ]

  function escaparHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  const asunto = 'Solicitud de crédito radicada exitosamente'
  const saludo = nombreTitular ? `Hola, ${escaparHtml(nombreTitular)}.` : 'Hola.'
  const textoCodeudores = requiereCodeudores
    ? `Se registró la firma de los codeudores (${numCodeudores || 0}).`
    : 'No se registraron codeudores para esta solicitud.'

  const text = [
    asunto,
    '',
    saludo,
    '',
    `Tu solicitud de crédito fue radicada exitosamente${radicado ? ` (Radicado: ${radicado})` : ''}.`,
    fechaSolicitudIso ? `Fecha de solicitud: ${fechaSolicitudIso}` : '',
    '',
    '¿Ahora qué sigue?',
    ...pasos.map((p, i) => `${i + 1}. ${p}`),
    '',
    textoCodeudores,
    '',
    'Cooperamigó',
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111827; line-height:1.6;">
      <h2 style="margin:0 0 12px 0;">${asunto}</h2>
      <p style="margin:0 0 12px 0;">${saludo}</p>
      <p style="margin:0 0 12px 0;">
        Tu solicitud de crédito fue radicada exitosamente${radicado ? ` <strong>(Radicado: ${radicado})</strong>` : ''}.
      </p>
      ${fechaSolicitudIso ? `<p style="margin:0 0 12px 0;"><strong>Fecha de solicitud:</strong> ${fechaSolicitudIso}</p>` : ''}
      <h3 style="margin:18px 0 8px 0;">¿Ahora qué sigue?</h3>
      <ol style="margin:0 0 12px 18px; padding:0;">
        ${pasos.map(p => `<li style="margin:0 0 6px 0;">${p}</li>`).join('')}
      </ol>
      <p style="margin:0 0 12px 0; color:#374151;">${textoCodeudores}</p>
      <p style="margin:18px 0 0 0; color:#6B7280;">Cooperamigó</p>
    </div>
  `.trim()

  const fnName = (import.meta.env.VITE_SUPABASE_FN_NOTIFICAR_RADICADA_TITULAR || 'notificar-radicada-titular').trim()

  let lastError = null
  try {
    const body = {
      tipo: 'credito_radicada_titular',
      solicitud_id: solicitudId,
      subject: asunto,
      html,
      text,
      meta: {
        radicado,
        requiere_codeudores: !!requiereCodeudores,
        num_codeudores: numCodeudores || 0,
      },
    }
    if (emailTitular) body.to = emailTitular
    const { error } = await supabase.functions.invoke(fnName, { body })
    if (error) throw error
    return
  } catch (e) {
    lastError = e
  }

  if (lastError) throw lastError
}

export async function notificarEquipoCreditos({
  radicado,
  nombre,
  cedula,
  correo,
  telefono,
  tipo_operacion,
  monto,
  plazo,
  fecha_radicacion,
}) {
  const { error } = await supabase.functions.invoke('notificar-equipo-creditos', {
    body: {
      radicado,
      nombre,
      cedula,
      correo,
      telefono,
      tipo_operacion,
      monto,
      plazo,
      fecha_radicacion,
    },
  })
  if (error) throw error
}
