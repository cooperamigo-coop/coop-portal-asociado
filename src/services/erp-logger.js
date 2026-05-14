/**
 * Envía eventos de email al ERP (Centra Technologies DC) para trazabilidad.
 * Silencioso — nunca bloquea el flujo principal aunque falle.
 */
const ERP_URL = import.meta.env.VITE_ERP_SUPABASE_URL
const ERP_KEY = import.meta.env.VITE_ERP_SUPABASE_ANON_KEY

export async function logEmailEvent(payload) {
  if (!ERP_URL || !ERP_KEY) return
  try {
    await fetch(`${ERP_URL}/rest/v1/email_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ERP_KEY,
        'Authorization': `Bearer ${ERP_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
    })
  } catch (e) {
    console.warn('[erp-logger] No se pudo registrar el evento de email:', e?.message)
  }
}
