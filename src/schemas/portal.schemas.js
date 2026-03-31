import { z } from 'zod'

// ─── Sanitizador base ─────────────────────────────────────────────────────────
const sanitizar = (val) =>
  val
    .replace(/<[^>]*>/g, '')           // quita tags HTML
    .replace(/[<>"'`\\]/g, '')         // quita chars peligrosos
    .replace(/javascript:/gi, '')      // quita protocolo JS
    .replace(/on\w+\s*=/gi, '')        // quita event handlers
    .trim()

// ─── Helpers de campo ────────────────────────────────────────────────────────
// Texto requerido con sanitización
const textoSeguro = (maxLen = 200) =>
  z.string().max(maxLen).transform(sanitizar)

// Texto opcional: acepta '' o string válido
const textoSeguroOpcional = (maxLen = 200) =>
  z.string().max(maxLen).transform(val => (val ? sanitizar(val) : ''))

// ─── Schema: Datos personales ────────────────────────────────────────────────
export const schemaPersonales = z.object({
  cedula: z
    .string()
    .min(5, 'Mínimo 5 dígitos')
    .max(15, 'Máximo 15 dígitos')
    .regex(/^[0-9]+$/, 'Solo se permiten números'),

  nombres: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(
      /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/,
      'Solo se permiten letras y espacios'
    )
    .transform(sanitizar),

  apellidos: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(
      /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/,
      'Solo se permiten letras y espacios'
    )
    .transform(sanitizar),

  // Acepta '' (vacío) o un email válido
  email: z
    .string()
    .max(254, 'Correo demasiado largo')
    .refine(
      (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Correo electrónico inválido'
    )
    .transform((val) => (val ? val.toLowerCase() : '')),

  telefono: z
    .string()
    .refine(
      (val) => val === '' || /^[0-9+\s\-]{7,15}$/.test(val),
      'Teléfono inválido'
    ),

  fecha_nacimiento: z
    .string()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Fecha inválida'
    )
    .refine((val) => {
      if (!val) return true
      const fecha = new Date(val)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fecha.getFullYear()
      return edad >= 18 && edad <= 100
    }, 'Debe ser mayor de 18 años'),

  ciudad: textoSeguroOpcional(100),
  direccion: textoSeguroOpcional(200),
})

// ─── Schema: Datos laborales ─────────────────────────────────────────────────
export const schemaLaborales = z.object({
  empresa: textoSeguro(200),

  cargo: textoSeguroOpcional(100),

  tipo_contrato: z
    .union([
      z.enum(['indefinido', 'fijo', 'obra', 'prestacion']),
      z.literal(''),
    ])
    .optional(),

  // El input type="number" siempre envía string; z.preprocess convierte a number
  salario: z.preprocess(
    (val) => Number(val),
    z
      .number({ invalid_type_error: 'Ingrese un valor numérico válido' })
      .min(500000, 'El salario mínimo es $500.000')
      .max(100000000, 'Valor de salario inválido')
  ),

  fecha_ingreso_empresa: z
    .string()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Fecha inválida'
    ),
})

// ─── Schema: Datos del crédito ────────────────────────────────────────────────
export const schemaCredito = z.object({
  tipo_credito: z.enum(
    ['consumo', 'vivienda', 'educativo', 'emergencia'],
    { error: () => ({ message: 'Seleccione un tipo de crédito válido' }) }
  ),

  monto_solicitado: z.preprocess(
    (val) => Number(val),
    z
      .number({ invalid_type_error: 'Ingrese un monto válido' })
      .min(500000, 'El monto mínimo es $500.000')
      .max(100000000, 'El monto máximo es $100.000.000')
  ),

  plazo_meses: z.preprocess(
    (val) => Number(val),
    z
      .number({ invalid_type_error: 'Seleccione un plazo válido' })
      .int('El plazo debe ser un número entero')
      .min(6, 'El plazo mínimo es 6 meses')
      .max(120, 'El plazo máximo es 120 meses')
  ),

  destino: textoSeguroOpcional(500),
})

// ─── Schema: Datos de afiliación (email requerido) ───────────────────────────
export const schemaAfiliacion = z.object({
  ...schemaPersonales.shape,
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido')
    .max(254, 'Correo demasiado largo')
    .transform((val) => val.toLowerCase()),
  ...schemaLaborales.shape,
})

// ─── Helper: validar campo individual ────────────────────────────────────────
export function validarCampo(schema, campo, valor) {
  const fieldSchema = schema.shape?.[campo]
  if (!fieldSchema) return null
  const resultado = fieldSchema.safeParse(valor)
  if (resultado.success) return null
  return resultado.error.issues?.[0]?.message ?? resultado.error.errors?.[0]?.message ?? 'Valor inválido'
}

// ─── Helper: validar schema completo ─────────────────────────────────────────
export function validarSchema(schema, datos) {
  const resultado = schema.safeParse(datos)
  if (resultado.success) return { valido: true, datos: resultado.data, errores: {} }

  const errores = {}
  const issues = resultado.error.issues ?? resultado.error.errors ?? []
  issues.forEach((issue) => {
    const campo = issue.path?.[0]
    if (campo && !errores[campo]) errores[campo] = issue.message
  })
  return { valido: false, datos: null, errores }
}
