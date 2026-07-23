import { describe, it, expect } from 'vitest'
import {
  schemaPersonales,
  schemaLaborales,
  schemaCredito,
  schemaAfiliacion,
  validarCampo,
  validarSchema,
} from './portal.schemas'

const datosValidos = {
  cedula: '1234567890',
  nombres: 'Juan Carlos',
  apellidos: 'Pérez Gómez',
  email: 'juan@example.com',
  telefono: '3001234567',
  fecha_nacimiento: '1990-01-01',
  ciudad: 'Medellín',
  direccion: 'Calle 10 # 20-30',
}

describe('schemaPersonales', () => {
  it('acepta datos personales válidos', () => {
    const resultado = schemaPersonales.safeParse(datosValidos)
    expect(resultado.success).toBe(true)
  })

  it('rechaza cédulas con letras', () => {
    const resultado = schemaPersonales.safeParse({ ...datosValidos, cedula: '123abc456' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza nombres con caracteres no permitidos (ej. inyección de código)', () => {
    const resultado = schemaPersonales.safeParse({ ...datosValidos, nombres: '<script>alert(1)</script>' })
    expect(resultado.success).toBe(false)
  })

  it('sanitiza el nombre aunque los caracteres sean válidos (quita espacios extra)', () => {
    const resultado = schemaPersonales.safeParse({ ...datosValidos, nombres: '  Juan Carlos  ' })
    expect(resultado.success).toBe(true)
    expect(resultado.data.nombres).toBe('Juan Carlos')
  })

  it('rechaza un correo con formato inválido', () => {
    const resultado = schemaPersonales.safeParse({ ...datosValidos, email: 'no-es-un-correo' })
    expect(resultado.success).toBe(false)
  })

  it('acepta correo vacío (campo opcional en este formulario)', () => {
    const resultado = schemaPersonales.safeParse({ ...datosValidos, email: '' })
    expect(resultado.success).toBe(true)
  })

  it('rechaza a un menor de edad por fecha de nacimiento', () => {
    const hace10anios = new Date()
    hace10anios.setFullYear(hace10anios.getFullYear() - 10)
    const fecha = hace10anios.toISOString().slice(0, 10)
    const resultado = schemaPersonales.safeParse({ ...datosValidos, fecha_nacimiento: fecha })
    expect(resultado.success).toBe(false)
  })
})

const datosLaboralesValidos = {
  empresa: 'Cooperativa Multiactiva Luis Amigó',
  cargo: 'Analista',
  tipo_contrato: 'indefinido',
  salario: '1500000',
  fecha_ingreso_empresa: '2020-01-01',
}

describe('schemaLaborales', () => {
  it('acepta datos laborales válidos y convierte el salario a número', () => {
    const resultado = schemaLaborales.safeParse(datosLaboralesValidos)
    expect(resultado.success).toBe(true)
    expect(resultado.data.salario).toBe(1500000)
  })

  it('rechaza un salario por debajo del mínimo permitido', () => {
    const resultado = schemaLaborales.safeParse({ ...datosLaboralesValidos, salario: '100000' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un salario que no es numérico', () => {
    const resultado = schemaLaborales.safeParse({ ...datosLaboralesValidos, salario: 'no-es-un-numero' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un nombre de empresa con caracteres de inyección', () => {
    const resultado = schemaLaborales.safeParse({ ...datosLaboralesValidos, empresa: '<script>x</script>' })
    expect(resultado.success).toBe(false)
  })
})

const datosCreditoValidos = {
  tipo_credito: 'consumo',
  monto_solicitado: '5000000',
  plazo_meses: '24',
  destino: 'Compra de vehículo',
}

describe('schemaCredito', () => {
  it('acepta una solicitud de crédito válida y convierte monto/plazo a número', () => {
    const resultado = schemaCredito.safeParse(datosCreditoValidos)
    expect(resultado.success).toBe(true)
    expect(resultado.data.monto_solicitado).toBe(5000000)
    expect(resultado.data.plazo_meses).toBe(24)
  })

  it('rechaza un tipo de crédito que no existe en el catálogo', () => {
    const resultado = schemaCredito.safeParse({ ...datosCreditoValidos, tipo_credito: 'hipotecario-fantasma' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un monto por debajo del mínimo', () => {
    const resultado = schemaCredito.safeParse({ ...datosCreditoValidos, monto_solicitado: '100000' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un monto por encima del máximo permitido', () => {
    const resultado = schemaCredito.safeParse({ ...datosCreditoValidos, monto_solicitado: '999999999' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un plazo con decimales (debe ser un número entero de meses)', () => {
    const resultado = schemaCredito.safeParse({ ...datosCreditoValidos, plazo_meses: '24.5' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza un plazo fuera del rango permitido (6-120 meses)', () => {
    const resultado = schemaCredito.safeParse({ ...datosCreditoValidos, plazo_meses: '200' })
    expect(resultado.success).toBe(false)
  })
})

describe('schemaAfiliacion', () => {
  it('exige correo electrónico (a diferencia de schemaPersonales, aquí es obligatorio)', () => {
    const datos = { ...datosValidos, ...datosLaboralesValidos, email: '' }
    const resultado = schemaAfiliacion.safeParse(datos)
    expect(resultado.success).toBe(false)
  })

  it('acepta un registro de afiliación completo y válido', () => {
    const datos = { ...datosValidos, ...datosLaboralesValidos, email: 'nuevo.asociado@example.com' }
    const resultado = schemaAfiliacion.safeParse(datos)
    expect(resultado.success).toBe(true)
  })
})

describe('validarCampo', () => {
  it('devuelve null cuando el valor del campo es válido', () => {
    expect(validarCampo(schemaPersonales, 'cedula', '123456789')).toBeNull()
  })

  it('devuelve un mensaje de error cuando el valor del campo es inválido', () => {
    const mensaje = validarCampo(schemaPersonales, 'cedula', 'abc')
    expect(mensaje).toBeTruthy()
  })

  it('devuelve null para un campo que no existe en el schema (defensivo)', () => {
    expect(validarCampo(schemaPersonales, 'campo_inexistente', 'x')).toBeNull()
  })
})

describe('validarSchema', () => {
  it('reporta válido:true y los datos transformados cuando todo el objeto es correcto', () => {
    const resultado = validarSchema(schemaPersonales, datosValidos)
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
  })

  it('reporta un mensaje de error por cada campo inválido', () => {
    const resultado = validarSchema(schemaPersonales, { ...datosValidos, cedula: 'abc', nombres: '123' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.cedula).toBeTruthy()
    expect(resultado.errores.nombres).toBeTruthy()
  })
})
