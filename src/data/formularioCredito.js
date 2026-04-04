export const ENTIDADES_PENSIONES = [
  'Colpensiones',
  'Porvenir',
  'Protección',
  'Colfondos',
  'Old Mutual',
  'Skandia',
  'Fondo Nacional del Ahorro',
  'Casur',
  'Fomag',
  'Fonprecon',
  'Fondo Prestacional del Magisterio',
  'Otra entidad',
]

export const VIAS_PRINCIPALES = [
  'Calle', 'Carrera', 'Avenida',
  'Diagonal', 'Transversal', 'Circular', 'Autopista',
]

export const CUADRANTES = ['Norte', 'Sur', 'Este', 'Oeste']

export const TIPOS_CONTRATO = [
  { value: 'fijo',       label: 'Término fijo'      },
  { value: 'indefinido', label: 'Término indefinido' },
  { value: 'otro',       label: 'Otro'               },
]

export const TIPOS_DOCUMENTO = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
  { value: 'pasaporte',          label: 'Pasaporte'             },
  { value: 'otro',               label: 'Otro'                  },
]

// Paso 7 se muestra solo si tipo_operacion !== 'reestructura'
// Pasos 9-12 se muestran solo si numCodudores >= 1
// Pasos 13-16 se muestran solo si numCodudores >= 2
export const PASOS_FORMULARIO = [
  { numero: 1,  titulo: 'Modalidad de crédito',                seccion: 'Solicitud'   },
  { numero: 2,  titulo: 'Datos de la solicitud',               seccion: 'Solicitud'   },
  { numero: 3,  titulo: 'Datos personales',                    seccion: 'Solicitante' },
  { numero: 4,  titulo: 'Información laboral',                 seccion: 'Solicitante' },
  { numero: 5,  titulo: 'Información financiera',              seccion: 'Solicitante' },
  { numero: 6,  titulo: 'Patrimonio',                          seccion: 'Solicitante' },
  { numero: 7,  titulo: 'Cuenta de desembolso',                seccion: 'Solicitante' },
  { numero: 8,  titulo: 'Codeudores',                          seccion: 'Codeudores'  },
  { numero: 9,  titulo: 'Datos personales — Codeudor 1',       seccion: 'Codeudor 1'  },
  { numero: 10, titulo: 'Información laboral — Codeudor 1',    seccion: 'Codeudor 1'  },
  { numero: 11, titulo: 'Información financiera — Codeudor 1', seccion: 'Codeudor 1'  },
  { numero: 12, titulo: 'Patrimonio — Codeudor 1',             seccion: 'Codeudor 1'  },
  { numero: 13, titulo: 'Datos personales — Codeudor 2',       seccion: 'Codeudor 2'  },
  { numero: 14, titulo: 'Información laboral — Codeudor 2',    seccion: 'Codeudor 2'  },
  { numero: 15, titulo: 'Información financiera — Codeudor 2', seccion: 'Codeudor 2'  },
  { numero: 16, titulo: 'Patrimonio — Codeudor 2',             seccion: 'Codeudor 2'  },
  { numero: 17, titulo: 'Autorizaciones',                      seccion: 'Legal'       },
  { numero: 18, titulo: 'Firmas',                              seccion: 'Legal'       },
]
