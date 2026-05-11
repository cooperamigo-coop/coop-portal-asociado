// ─── Sanitizar texto antes de enviar a BD ────────────────────────────────────
export function sanitizarTexto(valor) {
  if (!valor || typeof valor !== 'string') return valor
  return valor
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`\\*\/\[\]{}|^~]/g, '')
    .replace(/--+/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// ─── Sanitizar objeto completo (recursivo) ───────────────────────────────────
export function sanitizarObjeto(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
  const resultado = {}
  for (const [clave, valor] of Object.entries(obj)) {
    if (typeof valor === 'string') {
      const k = clave.toLowerCase()
      // Campos que contienen URLs o base64 — no aplicar la regex de caracteres especiales
      const esUrl = k.startsWith('doc_') || k.endsWith('_url')
        || k === 'firma_solicitante' || k === 'firma_codeudor_1' || k === 'firma_codeudor_2'
      if (esUrl) {
        // Las URLs de Storage no se sanitizan con la regex de caracteres especiales
        resultado[clave] = valor.trim() === '' ? null : valor.trim()
      } else {
        const limpio = sanitizarTexto(valor)
        resultado[clave] = limpio === '' ? null : limpio
      }
    } else if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
      resultado[clave] = sanitizarObjeto(valor)
    } else {
      resultado[clave] = valor
    }
  }
  return resultado
}

// ─── Detectar bot por honeypot ────────────────────────────────────────────────
export function esBot(campoHoneypot) {
  return campoHoneypot !== ''
}

// ─── Detectar envío demasiado rápido ─────────────────────────────────────────
const tiemposInicio = new Map()

export function registrarInicioFormulario(id) {
  tiemposInicio.set(id, Date.now())
}

export function envioDemasiadorapido(id, minimoSegundos = 5) {
  const inicio = tiemposInicio.get(id)
  if (!inicio) return true // nunca registrado = sospechoso
  const transcurrido = (Date.now() - inicio) / 1000
  return transcurrido < minimoSegundos
}

// ─── Hash simple de texto (privacy-friendly) ─────────────────────────────────
export async function hashearTexto(texto) {
  if (!texto) return null
  const encoder = new TextEncoder()
  const data = encoder.encode(texto + 'cooperamigo_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

// ─── Verificar rate limit via RPC ─────────────────────────────────────────────
export async function verificarRateLimit(supabase, cedula, accion) {
  try {
    const { data, error } = await supabase
      .rpc('verificar_rate_limit', {
        p_cedula: cedula,
        p_accion: accion,
        p_limite: 3,
        p_ventana_horas: 24,
      })
    if (error) {
      console.error('[RateLimit] RPC error — dejar pasar:', error.message)
      return false
    }
    return data === true
  } catch {
    return false // en caso de error de red, no bloquear
  }
}

// ─── Registrar intento via RPC ────────────────────────────────────────────────
export async function registrarIntento(supabase, cedula, accion) {
  try {
    await supabase.rpc('registrar_intento_portal', {
      p_cedula: cedula,
      p_accion: accion,
      p_ip_hash: null,
    })
  } catch {
    // No bloquear si la RPC no está disponible aún
  }
}
