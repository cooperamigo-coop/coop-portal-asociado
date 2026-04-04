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
// Pasos 9-11 se muestran solo si tiene_codeudor === true
export const PASOS_FORMULARIO = [
  { numero: 1,  titulo: 'Modalidad de crédito',     seccion: 'Solicitud'   },
  { numero: 2,  titulo: 'Datos de la solicitud',    seccion: 'Solicitud'   },
  { numero: 3,  titulo: 'Datos personales',         seccion: 'Solicitante' },
  { numero: 4,  titulo: 'Información laboral',      seccion: 'Solicitante' },
  { numero: 5,  titulo: 'Información financiera',   seccion: 'Solicitante' },
  { numero: 6,  titulo: 'Patrimonio',               seccion: 'Solicitante' },
  { numero: 7,  titulo: 'Cuenta de desembolso',     seccion: 'Solicitante' },
  { numero: 8,  titulo: 'Información del codeudor', seccion: 'Codeudor'    },
  { numero: 9,  titulo: 'Laboral codeudor',         seccion: 'Codeudor'    },
  { numero: 10, titulo: 'Financiera codeudor',      seccion: 'Codeudor'    },
  { numero: 11, titulo: 'Patrimonio codeudor',      seccion: 'Codeudor'    },
  { numero: 12, titulo: 'Autorizaciones',           seccion: 'Legal'       },
  { numero: 13, titulo: 'Firmas',                   seccion: 'Legal'       },
]
