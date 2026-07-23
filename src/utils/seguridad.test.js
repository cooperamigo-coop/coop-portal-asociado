import { describe, it, expect, vi } from 'vitest'
import {
  sanitizarTexto,
  sanitizarObjeto,
  esBot,
  registrarInicioFormulario,
  envioDemasiadorapido,
  hashearTexto,
  verificarRateLimit,
  registrarIntento,
} from './seguridad'

describe('sanitizarTexto', () => {
  it('elimina etiquetas HTML/script de un texto', () => {
    expect(sanitizarTexto('<script>alert(1)</script>Juan')).toBe('alert(1)Juan')
  })

  it('elimina caracteres especiales usados en inyecciones', () => {
    expect(sanitizarTexto(`Juan"'<>`)).toBe('Juan')
  })

  it('elimina el prefijo javascript: usado para XSS en atributos href', () => {
    expect(sanitizarTexto('javascript:alert(1)')).toBe('alert(1)')
  })

  it('elimina manejadores de evento tipo onerror=/onclick=', () => {
    expect(sanitizarTexto('onerror=alert(1)')).toBe('alert(1)')
  })

  it('no toca valores que no son string (números, null, undefined)', () => {
    expect(sanitizarTexto(123)).toBe(123)
    expect(sanitizarTexto(null)).toBe(null)
    expect(sanitizarTexto(undefined)).toBe(undefined)
  })

  it('quita espacios sobrantes al inicio/final', () => {
    expect(sanitizarTexto('  Juan Pérez  ')).toBe('Juan Pérez')
  })
})

describe('sanitizarObjeto', () => {
  it('sanitiza recursivamente campos anidados (ej. cónyuge, referencias)', () => {
    const entrada = {
      nombres: '<b>Juan</b>',
      conyuge: {
        nombres: '<script>alert(1)</script>Maria',
      },
    }
    const resultado = sanitizarObjeto(entrada)
    expect(resultado.nombres).toBe('Juan')
    expect(resultado.conyuge.nombres).toBe('alert(1)Maria')
  })

  it('convierte strings vacíos después de sanitizar en null', () => {
    const resultado = sanitizarObjeto({ nombres: '   ' })
    expect(resultado.nombres).toBeNull()
  })

  it('no aplica la sanitización de caracteres especiales a campos de URL/base64', () => {
    const entrada = { doc_frente_url: 'https://storage.example.com/a/b.png?x=1&y=2' }
    const resultado = sanitizarObjeto(entrada)
    expect(resultado.doc_frente_url).toBe('https://storage.example.com/a/b.png?x=1&y=2')
  })

  it('deja pasar sin cambios valores que no son objeto (arrays, números)', () => {
    expect(sanitizarObjeto('texto')).toBe('texto')
    expect(sanitizarObjeto(42)).toBe(42)
    expect(sanitizarObjeto(null)).toBe(null)
  })
})

describe('esBot', () => {
  it('detecta un bot cuando el campo honeypot viene lleno', () => {
    expect(esBot('cualquier-valor')).toBe(true)
  })

  it('no marca como bot cuando el honeypot está vacío (comportamiento humano esperado)', () => {
    expect(esBot('')).toBe(false)
  })
})

describe('envioDemasiadorapido', () => {
  it('marca como sospechoso un envío que nunca registró inicio de formulario', () => {
    expect(envioDemasiadorapido('formulario-sin-registrar')).toBe(true)
  })

  it('marca como sospechoso un envío que ocurre antes del mínimo de segundos', () => {
    registrarInicioFormulario('form-rapido')
    expect(envioDemasiadorapido('form-rapido', 5)).toBe(true)
  })

  it('no marca como sospechoso un envío que ya superó el mínimo de segundos', () => {
    registrarInicioFormulario('form-lento')
    // minimoSegundos = 0 simula que ya pasó tiempo suficiente sin usar temporizadores reales
    expect(envioDemasiadorapido('form-lento', 0)).toBe(false)
  })
})

describe('hashearTexto', () => {
  it('devuelve null cuando el texto de entrada está vacío', async () => {
    expect(await hashearTexto('')).toBeNull()
    expect(await hashearTexto(null)).toBeNull()
  })

  it('genera el mismo hash para el mismo texto (determinístico)', async () => {
    const a = await hashearTexto('correo@example.com')
    const b = await hashearTexto('correo@example.com')
    expect(a).toBe(b)
  })

  it('genera hashes distintos para textos distintos', async () => {
    const a = await hashearTexto('correo@example.com')
    const b = await hashearTexto('otro@example.com')
    expect(a).not.toBe(b)
  })

  it('nunca devuelve el texto original en claro (no reversible a simple vista)', async () => {
    const hash = await hashearTexto('dato-sensible')
    expect(hash).not.toContain('dato-sensible')
  })
})

describe('verificarRateLimit', () => {
  it('bloquea cuando la RPC indica que se superó el límite', async () => {
    const supabaseFalso = { rpc: vi.fn().mockResolvedValue({ data: true, error: null }) }
    const bloqueado = await verificarRateLimit(supabaseFalso, '123', 'consulta_cedula')
    expect(bloqueado).toBe(true)
  })

  it('no bloquea cuando la RPC indica que aún hay cupo', async () => {
    const supabaseFalso = { rpc: vi.fn().mockResolvedValue({ data: false, error: null }) }
    const bloqueado = await verificarRateLimit(supabaseFalso, '123', 'consulta_cedula')
    expect(bloqueado).toBe(false)
  })

  it('falla abierto (no bloquea) si la RPC responde con error — comportamiento documentado en CLAUDE.md', async () => {
    const supabaseFalso = { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('RPC no disponible') }) }
    const bloqueado = await verificarRateLimit(supabaseFalso, '123', 'consulta_cedula')
    expect(bloqueado).toBe(false)
  })

  it('falla abierto (no bloquea) si la llamada de red lanza una excepción', async () => {
    const supabaseFalso = { rpc: vi.fn().mockRejectedValue(new Error('network error')) }
    const bloqueado = await verificarRateLimit(supabaseFalso, '123', 'consulta_cedula')
    expect(bloqueado).toBe(false)
  })
})

describe('registrarIntento', () => {
  it('no lanza error aunque la RPC de registro falle (no debe bloquear el flujo principal)', async () => {
    const supabaseFalso = { rpc: vi.fn().mockRejectedValue(new Error('RPC no disponible')) }
    await expect(registrarIntento(supabaseFalso, '123', 'consulta_cedula')).resolves.toBeUndefined()
  })

  it('llama la RPC con la cédula y la acción correctas', async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const supabaseFalso = { rpc: rpcMock }
    await registrarIntento(supabaseFalso, '123', 'consulta_cedula')
    expect(rpcMock).toHaveBeenCalledWith('registrar_intento_portal', {
      p_cedula: '123',
      p_accion: 'consulta_cedula',
      p_ip_hash: null,
    })
  })
})
