function domingoPascua(anio) {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anio, mes - 1, dia)
}

function sumarDias(fecha, dias) {
  const f = new Date(fecha)
  f.setDate(f.getDate() + dias)
  return f
}

// Ley Emiliani: traslada el festivo al lunes siguiente si no cae en lunes.
function trasladarALunes(fecha) {
  const diasParaLunes = (1 - fecha.getDay() + 7) % 7
  return diasParaLunes === 0 ? fecha : sumarDias(fecha, diasParaLunes)
}

function formatoYMD(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function festivosColombia(anio) {
  const fijos = [
    new Date(anio, 0, 1),   // Año Nuevo
    new Date(anio, 4, 1),   // Día del Trabajo
    new Date(anio, 6, 20),  // Independencia
    new Date(anio, 7, 7),   // Batalla de Boyacá
    new Date(anio, 11, 8),  // Inmaculada Concepción
    new Date(anio, 11, 25), // Navidad
  ]

  const trasladables = [
    new Date(anio, 0, 6),   // Reyes Magos
    new Date(anio, 2, 19),  // San José
    new Date(anio, 5, 29),  // San Pedro y San Pablo
    new Date(anio, 7, 15),  // Asunción de la Virgen
    new Date(anio, 9, 12),  // Día de la Raza
    new Date(anio, 10, 1),  // Todos los Santos
    new Date(anio, 10, 11), // Independencia de Cartagena
  ].map(trasladarALunes)

  const pascua = domingoPascua(anio)
  const semanaSanta = [
    sumarDias(pascua, -3), // Jueves Santo
    sumarDias(pascua, -2), // Viernes Santo
  ]

  const basadosEnPascuaTrasladables = [
    sumarDias(pascua, 39), // Ascensión del Señor
    sumarDias(pascua, 60), // Corpus Christi
    sumarDias(pascua, 68), // Sagrado Corazón de Jesús
  ].map(trasladarALunes)

  return new Set(
    [...fijos, ...trasladables, ...semanaSanta, ...basadosEnPascuaTrasladables].map(formatoYMD)
  )
}

export function esFestivoColombia(fecha) {
  return festivosColombia(fecha.getFullYear()).has(formatoYMD(fecha))
}

/**
 * Portal disponible: lunes a viernes, 8:00 a.m. a 5:00 p.m., hora Colombia.
 * Nunca disponible en fin de semana ni festivos colombianos.
 */
export function esFueraDeHorarioAtencion(fecha = new Date()) {
  if (import.meta.env.DEV) return false
  const bogota = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
  const dia = bogota.getDay() // 0=domingo, 6=sábado
  const hora = bogota.getHours()
  if (dia === 0 || dia === 6) return true
  if (esFestivoColombia(bogota)) return true
  if (hora < 8 || hora >= 17) return true
  return false
}
