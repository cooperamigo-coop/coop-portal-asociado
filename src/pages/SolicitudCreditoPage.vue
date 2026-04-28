<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

async function irASeccion(id) {
  irAPaso(2)
  await nextTick()
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
import { useRouter } from 'vue-router'
import PortalLayout           from '@/components/layout/PortalLayout.vue'
import StepIndicator         from '@/components/ui/StepIndicator.vue'
import ModalOtpEmail          from '@/components/forms/ModalOtpEmail.vue'
import PortalButton           from '@/components/ui/PortalButton.vue'
import SelectorModalidad      from '@/components/forms/SelectorModalidad.vue'
import SeccionDocumentos      from '@/components/forms/SeccionDocumentos.vue'
import SelectorTipoTrabajador from '@/components/forms/SelectorTipoTrabajador.vue'
import SeccionPersona         from '@/components/forms/SeccionPersona.vue'
import SeccionFinanciera      from '@/components/forms/SeccionFinanciera.vue'
import SeccionPatrimonio      from '@/components/forms/SeccionPatrimonio.vue'
import CampoTexto             from '@/components/forms/CampoTexto.vue'
import CampoSelect            from '@/components/forms/CampoSelect.vue'
import CampoSelectBuscable    from '@/components/forms/CampoSelectBuscable.vue'
import CampoMoneda            from '@/components/forms/CampoMoneda.vue'
import CampoCheck             from '@/components/forms/CampoCheck.vue'
import SelectorFecha          from '@/components/forms/SelectorFecha.vue'
import ModalDireccion         from '@/components/forms/ModalDireccion.vue'
import SelectorDeptoMunicipio from '@/components/forms/SelectorDeptoMunicipio.vue'
import ModalAutorizaciones    from '@/components/forms/ModalAutorizaciones.vue'
import {
  IconCircleCheck, IconShieldCheck,
  IconUser, IconUserX, IconMail, IconRotate, IconUsers, IconUserCheck, IconFileDescription,
  IconCheck, IconUpload, IconCamera, IconX, IconLoader2,
  IconPencil, IconAlertTriangle, IconFileCheck, IconFile, IconRotateClockwise2,
} from '@tabler/icons-vue'
import { useSolicitudCredito } from '@/composables/useSolicitudCredito'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { vincularSolicitudCaptura } from '@/services/captura.service'
import { subirDocumentoSolicitud, obtenerMensajeErrorSubidaDocumento }  from '@/services/documentos.service'
import { jsPDF } from 'jspdf'

const { isMobile } = useBreakpoint()
import { TIPOS_CONTRATO, ENTIDADES_PENSIONES } from '@/data/formularioCredito'
import { ENTIDADES_BANCARIAS } from '@/data/colombiaData.js'

const router = useRouter()

const {
  paso, loading, error, enviado,
  porcentaje, pasosActivos, pasoActual, esUltimoPaso,
  verificacion, verificado, loadingVerificacion, errorVerificacion,
  mostrarModalNoAsociado,
  tieneBorradorPrevio, borradorRecuperado,
  mostrarOpcionBorrador, fechaBorrador, ultimoGuardado,
  verificarYContinuar, onCorreoCambia,
  continuarConBorrador, empezarDeNuevo,
  general, persona, laboral, financiera, patrimonio, cuenta,
  direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
  numCodudores,
  personaCod1, laboralCod1, financieraCod1, patrimonioCod1,
  personaCod2, laboralCod2, financieraCod2, patrimonioCod2,
  ubicacionResidencia,
  ubicacionCod1, ubicacionCod2,
  autorizaciones, firma,
  documentos,
  solicitudId,
  fechaSolicitud,
  mostrarTipoOperacion, mostrarValorCredito,
  mostrarValorReestructura, mostrarValorDesembolso, mostrarCuentaDesembolso,
  salarioBloqueado, montoTotalOperacion, pasoSolicitudValido, erroresCampos,
  siguiente, anterior, irAPaso, enviar, guardarPaso, formatMonto,
} = useSolicitudCredito()

const modalAutorizacionesVisible = ref(false)
const aceptaCondiciones = ref(false)
const errorCorreo = ref(null)
const errorPlazo   = ref(null)
const plazoFocused = ref(false)

// ── Tab activa en la sección de codeudores ─────────────────
const tabCodudorActivo = ref(1)
watch(numCodudores, (n) => { if (n < 2) tabCodudorActivo.value = 1 })

// ── Documentos cuenta de tercero ──────────────────────────
const refCartaUpload = ref(null)
const refCartaCamera = ref(null)
const cartaAutorizacion = ref({ cargando: false, url: null, nombre: null, error: null })

const refCertUpload = ref(null)
const refCertCamera = ref(null)
const certBancaria  = ref({ cargando: false, url: null, nombre: null, error: null })
const modalPreviewDocVisible = ref(false)
const modalPreviewDocUrl = ref('')
const modalPreviewDocTitulo = ref('')

const intentoContinuarPaso2 = ref(false)

function _nombreCorto(nombre) {
  if (!nombre) return ''
  return nombre.length > 28 ? nombre.substring(0, 25) + '...' : nombre
}

function _nombreDesdeUrl(url) {
  if (!url) return null
  try {
    const limpio = url.split('?')[0]
    const archivo = limpio.substring(limpio.lastIndexOf('/') + 1)
    return decodeURIComponent(archivo || '')
  } catch {
    return null
  }
}

async function _subirDocTercero(archivo, tipo, estado, campo) {
  if (!solicitudId.value) {
    await guardarPaso()
  }
  if (!solicitudId.value) {
    estado.error = 'No se pudo crear la solicitud para cargar documentos. Intente nuevamente.'
    return
  }
  estado.cargando = true
  estado.error    = null
  try {
    const url = await subirDocumentoSolicitud(solicitudId.value, tipo, archivo)
    estado.url    = url
    estado.nombre = archivo.name
    estado.cargando = false
    documentos.value = { ...documentos.value, [campo]: url }
    await guardarPaso()
  } catch (err) {
    console.error(`[_subirDocTercero] Error subiendo ${tipo}:`, err)
    estado.error = obtenerMensajeErrorSubidaDocumento(err)
  } finally {
    estado.cargando = false
  }
}

async function onFileCarta(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) await _subirDocTercero(f, 'carta_autorizacion_tercero', cartaAutorizacion.value, 'doc_carta_autorizacion_tercero_url')
}
function quitarCarta() {
  cartaAutorizacion.value = { cargando: false, url: null, nombre: null, error: null }
  documentos.value.doc_carta_autorizacion_tercero_url = ''
  guardarPaso()
}

async function onFileCert(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) await _subirDocTercero(f, 'certificacion_bancaria_tercero', certBancaria.value, 'doc_certificacion_bancaria_tercero_url')
}
function quitarCert() {
  certBancaria.value = { cargando: false, url: null, nombre: null, error: null }
  documentos.value.doc_certificacion_bancaria_tercero_url = ''
  guardarPaso()
}

watch(() => documentos.value.doc_carta_autorizacion_tercero_url, (url) => {
  if (url) {
    cartaAutorizacion.value = {
      ...cartaAutorizacion.value,
      cargando: false,
      url,
      nombre: cartaAutorizacion.value.nombre || _nombreDesdeUrl(url),
      error: null,
    }
  } else {
    cartaAutorizacion.value = { ...cartaAutorizacion.value, url: null, nombre: null }
  }
}, { immediate: true })

watch(() => documentos.value.doc_certificacion_bancaria_tercero_url, (url) => {
  if (url) {
    certBancaria.value = {
      ...certBancaria.value,
      cargando: false,
      url,
      nombre: certBancaria.value.nombre || _nombreDesdeUrl(url),
      error: null,
    }
  } else {
    certBancaria.value = { ...certBancaria.value, url: null, nombre: null }
  }
}, { immediate: true })

watch(() => paso.value, (p) => {
  if (p !== 2) intentoContinuarPaso2.value = false
})

function abrirPreviewDoc(url, titulo) {
  if (!url) return
  modalPreviewDocUrl.value = url
  modalPreviewDocTitulo.value = titulo || 'Documento'
  modalPreviewDocVisible.value = true
}

function cerrarPreviewDoc() {
  modalPreviewDocVisible.value = false
  modalPreviewDocUrl.value = ''
  modalPreviewDocTitulo.value = ''
}

function continuar() {
  if (paso.value === 2 && !pasoSolicitudValido.value) {
    intentoContinuarPaso2.value = true
    return
  }
  if (paso.value === 3 && hayErroresDuplicidad.value) {
    return
  }
  if (paso.value === 4 && !autorizaciones.value.autorizacion_aceptada) {
    return
  }
  intentoContinuarPaso2.value = false
  siguiente()
}

const esMenorDeEdad = computed(() => {
  const fn = persona.value.fecha_nacimiento
  if (!fn) return false
  const nacimiento = new Date(fn)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad < 18
})

function validarCorreo(valor) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  errorCorreo.value = valor && !re.test(valor) ? 'Ingrese un correo electrónico válido' : null
}

function onCorreoCambiaConValidacion(valor) {
  onCorreoCambia(valor)
  errorCorreo.value = null
}

function onCorreoBlur() {
  validarCorreo(verificacion.value.correo)
}

const indexPasoActual = computed(() => {
  if (paso.value === 1) return 0
  return pasosActivos.value.findIndex(p => p.numero === paso.value)
})

const totalPasosVisibles = computed(() => pasosActivos.value.length - 1)

const secciones = [
  { label: 'Tipo de crédito'        },
  { label: 'Diligenciar formulario' },
  { label: 'Codeudores'             },
  { label: 'Documentos'             },
  { label: 'Enviar solicitud'       },
]

const seccionActual = computed(() => {
  if (paso.value === 1) return 1
  if (paso.value === 2) return 2
  if (paso.value === 3) return 3
  if (paso.value === 4) return 4
  if (paso.value === 5) return 5
  return 1
})

const opsTipoOperacion = [
  { value: 'credito_nuevo',           label: 'Crédito nuevo'               },
  { value: 'reestructura',            label: 'Reestructura'                },
  { value: 'reestructura_desembolso', label: 'Reestructura con desembolso' },
]

const opsTipoEstudio = [
  { value: 'pregrado',        label: 'Pregrado' },
  { value: 'especializacion', label: 'Especialización' },
  { value: 'maestria',        label: 'Maestría' },
  { value: 'postgrado',       label: 'Postgrado' },
  { value: 'doctorado',       label: 'Doctorado' },
]

const opsInstitucionEducativa = [
  { value: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ', label: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ' },
]

const opsTipoCuenta = [
  { value: 'ahorros',   label: 'Cuenta de ahorros' },
  { value: 'corriente', label: 'Cuenta corriente'   },
]

const opsTipoDocTitular = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]

const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]

const opsNivelEducativo = [
  { value: 'tecnico',         label: 'Técnico'                  },
  { value: 'tecnologico',     label: 'Tecnológico'              },
  { value: 'pregrado',        label: 'Pregrado / Universitario' },
  { value: 'especializacion', label: 'Especialización'          },
  { value: 'maestria',        label: 'Maestría'                 },
  { value: 'doctorado',       label: 'Doctorado'                },
]

const opsEntidadesPensiones = ENTIDADES_PENSIONES.map(e => ({ value: e, label: e }))
const opsTipoContrato = TIPOS_CONTRATO

// ── Helpers de etiquetas para la pantalla de resumen ─────
const LABEL_MODALIDAD    = { ordinario: 'Crédito ordinario', educativo: 'Crédito educativo' }
const LABEL_TIPO_ESTUDIO = {
  pregrado: 'Pregrado',
  especializacion: 'Especialización',
  maestria: 'Maestría',
  postgrado: 'Postgrado',
  doctorado: 'Doctorado',
}
const LABEL_TIPO_OP   = {
  credito_nuevo:           'Crédito nuevo',
  reestructura:            'Reestructura',
  reestructura_desembolso: 'Reestructura con desembolso',
}
const LABEL_TIPO_DOC = {
  cedula_ciudadania:  'Cédula de ciudadanía',
  cedula_extranjeria: 'Cédula de extranjería',
  pasaporte:          'Pasaporte',
  otro:               'Otro',
}
const LABEL_TIPO_TRABAJADOR = {
  empleado:           'Empleado',
  independiente:      'Trabajador independiente',
  pensionado:         'Pensionado',
  estudiante:         'Estudiante',
  cuidado_hogar:      'Cuidado del hogar',
}
const LABEL_TIPO_CUENTA    = { ahorros: 'Cuenta de ahorros', corriente: 'Cuenta corriente' }
const LABEL_TIPO_CONTRATO  = { fijo: 'Término fijo', indefinido: 'Término indefinido', otro: 'Otro' }
const LABEL_NIVEL_EDUCATIVO = {
  ninguno: 'Ninguno', primaria_incompleta: 'Primaria incompleta', primaria_completa: 'Primaria completa',
  secundaria_incompleta: 'Bachillerato incompleto', secundaria_completa: 'Bachillerato completo',
  tecnico: 'Técnico', tecnologo: 'Tecnólogo', tecnologico: 'Tecnológico',
  universitario: 'Universitario / Pregrado', pregrado: 'Pregrado / Universitario',
  especializacion: 'Especialización', maestria: 'Maestría', doctorado: 'Doctorado',
}

function label(map, val) { return map[val] || val || '—' }

// Formatea "YYYY-MM-DD" → "15 de marzo de 2001"
function formatFecha(iso) {
  if (!iso) return null
  const partes = iso.split('-')
  if (partes.length < 3) return iso
  const [y, m, d] = partes.map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Helpers para valores en el resumen
function vr(val) { return val || 'Sin completar' }
function sr(val) {
  const vacio = !val && val !== 0 && val !== false
  return {
    fontSize:   'var(--text-sm)',
    color:      vacio ? 'var(--color-impulso)' : 'var(--color-text-1)',
    fontWeight: 'var(--fw-semibold)',
    marginTop:  'var(--sp-2xs)',
  }
}

// Documentos requeridos según el contexto
const docResumen = computed(() => {
  const labelDocCodeudor = (tipo) => {
    return {
      empleado: 'Carta laboral',
      independiente: 'Certificado de ingresos',
      pensionado: 'Últimas 2 colillas de pago',
      estudiante: 'Certificado académico',
      cuidado_hogar: 'Extractos bancarios',
    }[tipo] || 'Soporte de ingresos'
  }

  const items = [
    { label: 'Cédula del titular', url: documentos.value.doc_cedula_solicitante_url },
  ]

  // 1. Solicitante
  if (laboral.value.tipo_trabajador === 'empleado') {
    items.push({ label: 'Carta laboral', url: documentos.value.doc_carta_laboral_solicitante_url })
    items.push({ label: 'Últimas 3 colillas de pago', url: documentos.value.doc_colillas_pago_solicitante_url })
  } else if (laboral.value.tipo_trabajador === 'pensionado') {
    items.push({ label: 'Últimas 2 colillas de pago', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  } else if (laboral.value.tipo_trabajador === 'independiente') {
    items.push({ label: 'Certificado de ingresos', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  } else if (laboral.value.tipo_trabajador === 'estudiante') {
    items.push({ label: 'Certificado académico', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  } else if (laboral.value.tipo_trabajador && laboral.value.tipo_trabajador !== 'cuidado_hogar') {
    items.push({ label: 'Soporte de ingresos', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  }

  // Educativo
  if (esEducativo.value) {
    items.push({ label: 'Liquidación de matrícula', url: documentos.value.doc_liquidacion_matricula_url })
  }

  // Tercero
  if (cuenta.value.cuenta_tercero) {
    items.push({ label: 'Carta de autorización', url: documentos.value.doc_carta_autorizacion_tercero_url })
    items.push({ label: 'Certificación bancaria', url: documentos.value.doc_certificacion_bancaria_tercero_url })
  }

  // 2. Codeudores
  if (numCodudores.value >= 1) {
    items.push({ label: 'Cédula del Codeudor 1', url: documentos.value.doc_cedula_codeudor_url })
    if (documentos.value.doc_soporte_laboral_codeudor_url) {
      items.push({ label: labelDocCodeudor(laboralCod1.value.tipo_trabajador_codeudor), url: documentos.value.doc_soporte_laboral_codeudor_url })
    }
  }
  if (numCodudores.value >= 2) {
    items.push({ label: 'Cédula del Codeudor 2', url: documentos.value.doc_cedula_codeudor2_url })
    if (documentos.value.doc_soporte_laboral_codeudor2_url) {
      items.push({ label: labelDocCodeudor(laboralCod2.value.tipo_trabajador_codeudor2), url: documentos.value.doc_soporte_laboral_codeudor2_url })
    }
  }

  return items
})

function _esVacio(v) {
  return v === null || v === undefined || v === ''
}

function _labelCampo(k) {
  return String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function _upperBonito(v) {
  return String(v).replace(/[_-]+/g, ' ').trim().toUpperCase()
}

function _valorVisible(k, v) {
  if (_esVacio(v)) return null
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string' && k.includes('fecha')) return formatFecha(v) || v
  if (typeof v === 'number' && /(valor|monto|salario|ingresos|gastos|obligaciones|mesada|cuota|total)/i.test(k)) return formatMonto(v)
  if (typeof v === 'string' && /_url$/.test(k)) return 'Documento cargado'
  // Enum lookups — evitar valores crudos como cedula_ciudadania
  if (['tipo_documento', 'tipo_documento_codeudor', 'tipo_documento_codeudor2'].includes(k)) return LABEL_TIPO_DOC[v] || v
  if (k === 'modalidad_credito') return LABEL_MODALIDAD[v] || v
  if (k === 'tipo_operacion') return LABEL_TIPO_OP[v] || v
  if (k === 'tipo_estudio') return LABEL_TIPO_ESTUDIO[v] || v
  if (['tipo_trabajador', 'tipo_trabajador_codeudor', 'tipo_trabajador_codeudor2'].includes(k)) return LABEL_TIPO_TRABAJADOR[v] || v
  if (k === 'tipo_cuenta') return LABEL_TIPO_CUENTA[v] || v
  if (['tipo_contrato', 'tipo_contrato_codeudor', 'tipo_contrato_codeudor2'].includes(k)) return LABEL_TIPO_CONTRATO[v] || v
  if (['nivel_educativo_solicitante', 'nivel_educativo_codeudor', 'nivel_educativo_codeudor2'].includes(k)) return LABEL_NIVEL_EDUCATIVO[v] || v
  // Capitalizar primera letra en otros strings
  const str = String(v)
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function _seccionResumen(titulo, obj, omit = [], orden = null) {
  const items = Object.entries(obj)
    .filter(([k, v]) => !omit.includes(k) && !_esVacio(v))
    .map(([k, v]) => ({ key: k, label: _labelCampo(k), value: _valorVisible(k, v) }))
    .filter(i => !_esVacio(i.value))
    .sort((a, b) => {
      if (!orden) return 0
      const ai = orden.indexOf(a.key)
      const bi = orden.indexOf(b.key)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  return { titulo, items }
}

const seccionesRevisionCompleta = computed(() => {
  const salida = []
  salida.push(_seccionResumen(
    'Información de la solicitud',
    general.value,
    [],
    [
      'modalidad_credito',
      'tipo_operacion',
      'valor_credito',
      'valor_reestructura',
      'valor_desembolso',
      'plazo_solicitado',
      'destino_credito',
      'tipo_estudio',
      'denominacion_carrera',
    ]
  ))
  salida.push(_seccionResumen('Información personal', persona.value))
  salida.push(_seccionResumen('Ubicación de residencia', ubicacionResidencia.value))
  salida.push(_seccionResumen('Situación laboral', laboral.value))
  salida.push(_seccionResumen('Información financiera', financiera.value))
  salida.push(_seccionResumen('Patrimonio', patrimonio.value))
  salida.push(_seccionResumen('Cuenta para desembolso', cuenta.value))
  salida.push(_seccionResumen('Documentos adjuntos', documentos.value))
  if (numCodudores.value >= 1) {
    salida.push(_seccionResumen('Codeudor 1 — Información personal', personaCod1.value))
    salida.push(_seccionResumen('Codeudor 1 — Situación laboral', laboralCod1.value))
    salida.push(_seccionResumen('Codeudor 1 — Información financiera', financieraCod1.value))
    salida.push(_seccionResumen('Codeudor 1 — Patrimonio', patrimonioCod1.value))
  }
  if (numCodudores.value >= 2) {
    salida.push(_seccionResumen('Codeudor 2 — Información personal', personaCod2.value))
    salida.push(_seccionResumen('Codeudor 2 — Situación laboral', laboralCod2.value))
    salida.push(_seccionResumen('Codeudor 2 — Información financiera', financieraCod2.value))
    salida.push(_seccionResumen('Codeudor 2 — Patrimonio', patrimonioCod2.value))
  }
  return salida.filter(s => s.items.length > 0)
})

// ── Validaciones de unicidad entre titular y codeudores ─────
const erroresDuplicidadCod1 = computed(() => {
  const errs = []
  if (!numCodudores.value) return errs
  const c = personaCod1.value
  const t = persona.value
  if (c.correo_electronico_codeudor && c.correo_electronico_codeudor === t.correo_electronico)
    errs.push('El correo del Codeudor 1 coincide con el del titular')
  if (c.celular_codeudor && c.celular_codeudor === t.celular)
    errs.push('El celular del Codeudor 1 coincide con el del titular')
  if (c.numero_identificacion_codeudor && c.numero_identificacion_codeudor === t.numero_identificacion)
    errs.push('La identificación del Codeudor 1 coincide con la del titular')
  return errs
})

const erroresDuplicidadCod2 = computed(() => {
  const errs = []
  if (numCodudores.value < 2) return errs
  const c  = personaCod2.value
  const t  = persona.value
  const c1 = personaCod1.value
  if (c.correo_electronico_codeudor2) {
    if (c.correo_electronico_codeudor2 === t.correo_electronico) errs.push('El correo del Codeudor 2 coincide con el del titular')
    if (c.correo_electronico_codeudor2 === c1.correo_electronico_codeudor)  errs.push('El correo del Codeudor 2 coincide con el del Codeudor 1')
  }
  if (c.celular_codeudor2) {
    if (c.celular_codeudor2 === t.celular)           errs.push('El celular del Codeudor 2 coincide con el del titular')
    if (c.celular_codeudor2 === c1.celular_codeudor) errs.push('El celular del Codeudor 2 coincide con el del Codeudor 1')
  }
  if (c.numero_identificacion_codeudor2) {
    if (c.numero_identificacion_codeudor2 === t.numero_identificacion)       errs.push('La identificación del Codeudor 2 coincide con la del titular')
    if (c.numero_identificacion_codeudor2 === c1.numero_identificacion_codeudor) errs.push('La identificación del Codeudor 2 coincide con la del Codeudor 1')
  }
  return errs
})

const hayErroresDuplicidad = computed(() =>
  erroresDuplicidadCod1.value.length > 0 || erroresDuplicidadCod2.value.length > 0
)

const firmaSolicitanteAplicada = computed(() => !!firma.value.firma_hash)

const firmaMetodo = computed({
  get: () => firma.value.firma_metodo || 'dibujar',
  set: (v) => {
    const prev = firma.value.firma_metodo || 'dibujar'
    const update = { ...firma.value, firma_metodo: v }
    if (v !== prev) {
      update.firma_imagen_dataurl = ''
    }
    firma.value = update
  },
})

const firmaImagen = computed({
  get: () => firma.value.firma_imagen_dataurl || '',
  set: (v) => { firma.value = { ...firma.value, firma_imagen_dataurl: v } },
})

const firmaCanvasRef = ref(null)
const firmaFileRef = ref(null)
const firmaArchivoNombre = ref('')
const _dibujandoFirma = ref(false)
const _firmaTrazoPrev = ref(null)
const _firmaCanvasCssHeight = 140

function _invalidarFirma() {
  if (!firma.value.firma_hash) return
  firma.value = {
    ...firma.value,
    firma_hash: '',
    firma_fecha_iso: '',
    firma_nonce: '',
    firma_user_agent: '',
    firma_plataforma: '',
    firma_idioma: '',
    firma_timezone: '',
    firma_resolucion: '',
    firma_imagen_hash: '',
    firma_transaccion_id: '',
    firma_timestamp_servidor_iso: '',
    firma_timestamp_servidor_unix: '',
    firma_timestamp_fuente: '',
    firma_ip_publica: '',
    firma_dispositivo_tipo: '',
    firma_sistema_operativo: '',
    firma_navegador: '',
    firma_geo_lat: '',
    firma_geo_lon: '',
    firma_geo_accuracy: '',
    firma_doc_hash_sha256: '',
    firma_doc_hash_firmado_b64: '',
    firma_doc_firma_public_key_jwk: null,
    firma_doc_firma_alg: '',
  }
}

watch(
  [
    () => firma.value.nombre_firma,
    () => firmaMetodo.value,
    () => firmaImagen.value,
  ],
  () => {
    _invalidarFirma()
  }
)

function _canvasCtx() {
  const c = firmaCanvasRef.value
  if (!c) return null
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#111827'
  return ctx
}

function prepararCanvasFirma() {
  const c = firmaCanvasRef.value
  if (!c) return
  const rect = c.getBoundingClientRect()
  const cssW = Math.max(1, Math.round(rect.width))
  const cssH = Math.max(1, Math.round(rect.height || _firmaCanvasCssHeight))
  const dpr = window.devicePixelRatio || 1
  c.width = Math.round(cssW * dpr)
  c.height = Math.round(cssH * dpr)
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(12, cssH - 24)
  ctx.lineTo(cssW - 12, cssH - 24)
  ctx.stroke()
}

function _posEnCanvas(evt) {
  const c = firmaCanvasRef.value
  if (!c) return null
  const rect = c.getBoundingClientRect()
  const clientX = evt.touches?.[0]?.clientX ?? evt.clientX
  const clientY = evt.touches?.[0]?.clientY ?? evt.clientY
  const x = clientX - rect.left
  const y = clientY - rect.top
  return { x: Math.max(0, Math.min(rect.width, x)), y: Math.max(0, Math.min(rect.height, y)) }
}

function iniciarFirmaDibujo(evt) {
  if (firmaMetodo.value !== 'dibujar') return
  const p = _posEnCanvas(evt)
  const ctx = _canvasCtx()
  if (!p || !ctx) return
  if (ctx.lineWidth !== 2.2) {
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }
  _dibujandoFirma.value = true
  _firmaTrazoPrev.value = p
}

function moverFirmaDibujo(evt) {
  if (!_dibujandoFirma.value) return
  const p = _posEnCanvas(evt)
  const ctx = _canvasCtx()
  if (!p || !ctx || !_firmaTrazoPrev.value) return
  evt.preventDefault?.()
  ctx.beginPath()
  ctx.moveTo(_firmaTrazoPrev.value.x, _firmaTrazoPrev.value.y)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  _firmaTrazoPrev.value = p
}

function terminarFirmaDibujo() {
  if (!_dibujandoFirma.value) return
  _dibujandoFirma.value = false
  _firmaTrazoPrev.value = null
  const c = firmaCanvasRef.value
  if (!c) return
  firmaImagen.value = c.toDataURL('image/png')
}

function limpiarFirmaDibujo() {
  const c = firmaCanvasRef.value
  if (!c) return
  prepararCanvasFirma()
  firmaImagen.value = ''
}

watch(
  () => paso.value,
  (p) => {
    if (p === 5 && firmaMetodo.value === 'dibujar') {
      nextTick(() => {
        prepararCanvasFirma()
      })
    }
  }
)

watch(
  () => firmaMetodo.value,
  (m) => {
    if (m !== 'dibujar') return
    nextTick(() => {
      prepararCanvasFirma()
    })
  },
  { immediate: true }
)

function _onResizeFirma() {
  if (firmaMetodo.value !== 'dibujar') return
  prepararCanvasFirma()
}

onMounted(() => {
  window.addEventListener('resize', _onResizeFirma)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', _onResizeFirma)
})

async function cargarFirmaImagen(evt) {
  const file = evt?.target?.files?.[0]
  if (evt?.target) evt.target.value = ''
  if (!file) return
  firmaArchivoNombre.value = file.name || ''
  const reader = new FileReader()
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onerror = () => reject(new Error('Error leyendo la imagen'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
  try {
    const norm = await _normalizarImagenParaPdf(dataUrl)
    firmaImagen.value = norm.dataUrl
  } catch {
    firmaImagen.value = dataUrl
  }
}

function seleccionarFirmaArchivo() {
  firmaFileRef.value?.click?.()
}

async function _sha256Hex(texto) {
  const data = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function _sha256HexBuffer(buf) {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function _base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function _mimeDesdeDataUrl(dataUrl) {
  const m = /^data:([^;]+);/i.exec(String(dataUrl || ''))
  return m?.[1] ? String(m[1]).toLowerCase() : ''
}

async function _convertirDataUrlAPng(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    i.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, img.naturalWidth || img.width || 1)
  canvas.height = Math.max(1, img.naturalHeight || img.height || 1)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

async function _normalizarImagenParaPdf(dataUrl) {
  const mime = _mimeDesdeDataUrl(dataUrl)
  if (mime === 'image/jpeg' || mime === 'image/jpg') return { dataUrl, tipo: 'JPEG' }
  if (mime === 'image/png') return { dataUrl, tipo: 'PNG' }
  const png = await _convertirDataUrlAPng(dataUrl)
  return { dataUrl: png, tipo: 'PNG' }
}

async function _obtenerTimestampServidor() {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 1200)
  try {
    const res = await fetch('/', { method: 'HEAD', cache: 'no-store', signal: ctrl.signal })
    const dateHeader = res.headers.get('date') || ''
    const d = dateHeader ? new Date(dateHeader) : null
    if (!d || Number.isNaN(d.getTime())) return null
    return {
      iso: d.toISOString(),
      unix: String(Math.floor(d.getTime() / 1000)),
      fuente: 'http-date',
    }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function _obtenerInfoDispositivo() {
  const ua = navigator.userAgent || ''
  const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const tipo = esMovil ? 'movil' : 'desktop'
  const os =
    /Windows NT/i.test(ua) ? 'Windows' :
    /Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua) ? 'macOS' :
    /Android/i.test(ua) ? 'Android' :
    /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
    /Linux/i.test(ua) ? 'Linux' :
    ''
  const navegador =
    /Edg\//i.test(ua) ? 'Edge' :
    /OPR\//i.test(ua) ? 'Opera' :
    /Chrome\//i.test(ua) && !/Edg\//i.test(ua) ? 'Chrome' :
    /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'Safari' :
    /Firefox\//i.test(ua) ? 'Firefox' :
    ''
  return { tipo, os, navegador }
}

async function _firmarHashDocumento(hashHex) {
  const bytes = new Uint8Array(hashHex.match(/.{1,2}/g)?.map(h => parseInt(h, 16)) || [])
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  const firmaBin = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    bytes
  )
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  return {
    alg: 'ECDSA-P256-SHA256',
    firmaB64: _base64FromArrayBuffer(firmaBin),
    publicKeyJwk: publicJwk,
  }
}

async function aplicarFirmaSolicitante() {
  const nombre = (firma.value.nombre_firma || '').trim()
  if (!nombre) return
  if (!firmaImagen.value) return
  if (!solicitudId.value) await guardarPaso()
  const ahora = new Date().toISOString()
  const nonce = crypto.randomUUID()
  const transaccionId = crypto.randomUUID()
  const resolucion = `${window.screen.width}x${window.screen.height}`
  const disp = _obtenerInfoDispositivo()
  const selloTiempo = await _obtenerTimestampServidor()
  const ipPublica = await _obtenerIpPublica()
  const imgHash = await _sha256Hex(firmaImagen.value)
  const base = [
    persona.value.numero_identificacion || '',
    nombre,
    ahora,
    nonce,
    transaccionId,
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    resolucion,
    firmaMetodo.value,
    imgHash,
  ].join('|')
  const hash = await _sha256Hex(base)
  const nuevo = {
    ...firma.value,
    nombre_firma: nombre,
    firma_metodo: firmaMetodo.value,
    firma_tipografia: '',
    firma_imagen_dataurl: firmaImagen.value,
    firma_imagen_hash: imgHash,
    firma_hash: hash,
    firma_fecha_iso: ahora,
    firma_nonce: nonce,
    firma_transaccion_id: transaccionId,
    firma_timestamp_servidor_iso: selloTiempo?.iso || '',
    firma_timestamp_servidor_unix: selloTiempo?.unix || '',
    firma_timestamp_fuente: selloTiempo?.fuente || '',
    firma_ip_publica: ipPublica || '',
    firma_user_agent: navigator.userAgent || '',
    firma_plataforma: navigator.platform || '',
    firma_idioma: navigator.language || '',
    firma_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    firma_resolucion: resolucion,
    firma_dispositivo_tipo: disp.tipo || '',
    firma_sistema_operativo: disp.os || '',
    firma_navegador: disp.navegador || '',
    firma_geo_lat: '',
    firma_geo_lon: '',
    firma_geo_accuracy: '',
    firma_doc_hash_sha256: '',
    firma_doc_hash_firmado_b64: '',
    firma_doc_firma_public_key_jwk: null,
    firma_doc_firma_alg: '',
  }
  firma.value = nuevo

  try {
    const blob = await _generarPdfFormalizadoBlob()
    const buf = await blob.arrayBuffer()
    const docHash = await _sha256HexBuffer(buf)
    let firmaDoc = null
    try {
      firmaDoc = await _firmarHashDocumento(docHash)
    } catch {
      firmaDoc = null
    }
    firma.value = {
      ...firma.value,
      firma_doc_hash_sha256: docHash,
      firma_doc_hash_firmado_b64: firmaDoc?.firmaB64 || '',
      firma_doc_firma_public_key_jwk: firmaDoc?.publicKeyJwk || null,
      firma_doc_firma_alg: firmaDoc?.alg || '',
    }
  } catch {}
}

async function firmarYEnviar() {
  if (!firma.value.nombre_firma || !firmaImagen.value) return
  if (!firmaSolicitanteAplicada.value) {
    await aplicarFirmaSolicitante()
  }
  await enviar()
}


const _pdfAssets = {
  logoPngDataUrl: null,
  logoRatio: null,
  afacadRegularB64: null,
  afacadBoldB64: null,
  afacadFailed: false,
}

async function _asegurarLogoPngDataUrl() {
  if (_pdfAssets.logoPngDataUrl) return _pdfAssets.logoPngDataUrl
  const res = await fetch('/logo-principal.svg')
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('No se pudo cargar el logo'))
      i.src = url
    })
    _pdfAssets.logoRatio = img.width ? (img.height / img.width) : null
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = Math.max(300, Math.round((img.height / img.width) * 900))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo preparar el logo')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    _pdfAssets.logoPngDataUrl = canvas.toDataURL('image/png')
    return _pdfAssets.logoPngDataUrl
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function _asegurarFuenteAfacad(doc) {
  if (_pdfAssets.afacadFailed) return false
  try {
    if (!_pdfAssets.afacadRegularB64 || !_pdfAssets.afacadBoldB64) {
      const urlRegular = new URL('../assets/fonts/Afacad-Regular.ttf', import.meta.url).href
      const urlBold = new URL('../assets/fonts/Afacad-Bold.ttf', import.meta.url).href
      const [bufRegular, bufBold] = await Promise.all([
        fetch(urlRegular).then(r => r.arrayBuffer()),
        fetch(urlBold).then(r => r.arrayBuffer()),
      ])
      _pdfAssets.afacadRegularB64 = _base64FromArrayBuffer(bufRegular)
      _pdfAssets.afacadBoldB64 = _base64FromArrayBuffer(bufBold)
    }
    doc.addFileToVFS('Afacad-Regular.ttf', _pdfAssets.afacadRegularB64)
    doc.addFont('Afacad-Regular.ttf', 'Afacad', 'normal')
    doc.addFileToVFS('Afacad-Bold.ttf', _pdfAssets.afacadBoldB64)
    doc.addFont('Afacad-Bold.ttf', 'Afacad', 'bold')
    return true
  } catch {
    _pdfAssets.afacadFailed = true
    return false
  }
}

async function _obtenerIpPublica() {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 1200)
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
    if (!res.ok) return ''
    const data = await res.json()
    return String(data?.ip || '')
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

function _escribirLineaPdf(doc, texto, y, x = 14, max = 182) {
  const lineas = doc.splitTextToSize(texto, max)
  for (const l of lineas) {
    if (y > 282) {
      doc.addPage()
      y = 14
    }
    doc.text(l, x, y)
    y += 5
  }
  return y
}

async function _generarPdfFormalizadoBlob() {
  if (!solicitudId.value) await guardarPaso()
  if (!firmaSolicitanteAplicada.value) await aplicarFirmaSolicitante()
  const doc = new jsPDF()
  const afacadOk = await _asegurarFuenteAfacad(doc)
  doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'normal')
  const logoPng = await _asegurarLogoPngDataUrl()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const colorPrimary = { r: 17, g: 76, b: 90 }
  const colorSurface = { r: 245, g: 247, b: 250 }
  const colorBorder = { r: 220, g: 227, b: 233 }
  const colorText = { r: 17, g: 24, b: 39 }
  const colorTextMuted = { r: 107, g: 114, b: 128 }

  const setFill = (c) => doc.setFillColor(c.r, c.g, c.b)
  const setDraw = (c) => doc.setDrawColor(c.r, c.g, c.b)
  const setText = (c) => doc.setTextColor(c.r, c.g, c.b)

  const fechaSolicitudIso = fechaSolicitud?.value
    ? `${fechaSolicitud.value}T00:00:00.000Z`
    : new Date().toISOString()
  const radicado = solicitudId.value
    ? `RAD-${fechaSolicitud.value.replaceAll('-', '')}-${String(solicitudId.value).slice(0, 8).toUpperCase()}`
    : `RAD-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`

  const headerH = 34
  setFill(colorPrimary)
  doc.rect(0, 0, pageW, 6, 'F')
  setFill({ r: 255, g: 255, b: 255 })
  doc.rect(0, 6, pageW, headerH - 6, 'F')
  setDraw(colorBorder)
  doc.line(0, headerH, pageW, headerH)

  try {
    const props = doc.getImageProperties(logoPng)
    const ratio = props?.width ? (props.height / props.width) : (_pdfAssets.logoRatio || (10 / 26))
    const logoW = 26
    const logoH = Math.max(8, Math.min(12, logoW * ratio))
    doc.addImage(logoPng, 'PNG', 14, 11 + ((10 - logoH) / 2), logoW, logoH)
  } catch {}

  setText(colorText)
  doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Solicitud de crédito', 44, 16)
  doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Fecha solicitud: ${formatearFecha(fechaSolicitudIso)}`, pageW - 14, 14, { align: 'right' })
  doc.text(`Radicado: ${radicado}`, pageW - 14, 20, { align: 'right' })

  let y = headerH + 10
  const x = 14
  const cardW = pageW - (x * 2)
  const cardPad = 8
  const r = 3

  const nuevaPagina = () => {
    doc.addPage()
    setFill(colorPrimary)
    doc.rect(0, 0, pageW, 6, 'F')
    setFill({ r: 255, g: 255, b: 255 })
    doc.rect(0, 6, pageW, headerH - 6, 'F')
    setDraw(colorBorder)
    doc.line(0, headerH, pageW, headerH)
    try {
      const props = doc.getImageProperties(logoPng)
      const ratio = props?.width ? (props.height / props.width) : (_pdfAssets.logoRatio || (10 / 26))
      const logoW = 26
      const logoH = Math.max(8, Math.min(12, logoW * ratio))
      doc.addImage(logoPng, 'PNG', 14, 11 + ((10 - logoH) / 2), logoW, logoH)
    } catch {}
    setText(colorText)
    doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Solicitud de crédito', 44, 16)
    doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Fecha solicitud: ${formatearFecha(fechaSolicitudIso)}`, pageW - 14, 14, { align: 'right' })
    doc.text(`Radicado: ${radicado}`, pageW - 14, 20, { align: 'right' })
    y = headerH + 10
  }

  const _split = (texto, maxWidth) => doc.splitTextToSize(String(texto ?? ''), maxWidth)

  const card = (titulo, items) => {
    const colGap = 10
    const colW = (cardW - colGap) / 2
    const rows = []
    for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1]])
    const labelSize = 7
    const valueSize = 9.2
    const labelLH = 3.4
    const valueLH = 4.2
    const rowHeights = rows.map(([izq, der]) => {
      const leftLabelLines = izq ? _split(String(izq.label).toUpperCase(), colW - 2) : []
      const rightLabelLines = der ? _split(String(der.label).toUpperCase(), colW - 2) : []
      const leftValueLines = izq ? _split(izq.value, colW - 2) : []
      const rightValueLines = der ? _split(der.value, colW - 2) : []
      const labelLines = Math.max(leftLabelLines.length, rightLabelLines.length, 1)
      const valueLines = Math.max(leftValueLines.length, rightValueLines.length, 1)
      return 3 + (labelLines * labelLH) + 1 + (valueLines * valueLH) + 5
    })
    const contentH = rowHeights.reduce((a, b) => a + b, 0)
    const alto = 10 + contentH + cardPad + 4
    if (y + alto > pageH - 16) nuevaPagina()

    setFill({ r: 255, g: 255, b: 255 })
    setDraw(colorBorder)
    doc.roundedRect(x, y, cardW, alto, r, r, 'FD')

    setFill(colorSurface)
    doc.roundedRect(x, y, cardW, 10, r, r, 'F')
    setText(colorText)
    doc.setFontSize(10)
    doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'bold')
    doc.text(titulo, x + cardPad, y + 7)

    doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'normal')
    let yy = y + 16
    for (let i = 0; i < rows.length; i++) {
      const [izq, der] = rows[i]
      const rowH = rowHeights[i]
      if (izq) {
        doc.setFontSize(labelSize)
        setText(colorTextMuted)
        const labelLines = _split(String(izq.label).toUpperCase(), colW - 2)
        for (let j = 0; j < labelLines.length; j++) {
          doc.text(labelLines[j], x + cardPad, yy + (j * labelLH))
        }
        doc.setFontSize(valueSize)
        setText(colorText)
        const lines = _split(izq.value, colW - 2)
        for (let j = 0; j < lines.length; j++) {
          doc.text(lines[j], x + cardPad, yy + (labelLines.length * labelLH) + 1 + (j * valueLH))
        }
      }
      if (der) {
        doc.setFontSize(labelSize)
        setText(colorTextMuted)
        const labelLines = _split(String(der.label).toUpperCase(), colW - 2)
        for (let j = 0; j < labelLines.length; j++) {
          doc.text(labelLines[j], x + cardPad + colW + colGap, yy + (j * labelLH))
        }
        doc.setFontSize(valueSize)
        setText(colorText)
        const lines = _split(der.value, colW - 2)
        for (let j = 0; j < lines.length; j++) {
          doc.text(lines[j], x + cardPad + colW + colGap, yy + (labelLines.length * labelLH) + 1 + (j * valueLH))
        }
      }
      yy += rowH
    }
    y += alto + 8
  }

  const cronologiaCard = (eventos) => {
    const leftW = 54
    const gap = 8
    const rightW = cardW - leftW - gap - (cardPad * 2)
    const labelSize = 7
    const valueSize = 9.2
    const labelLH = 3.4
    const valueLH = 4.2

    const filas = eventos.map((e) => {
      const fecha = e.fecha || '—'
      const titulo = e.titulo || ''
      const detalle = e.detalle || ''
      const rightLines = _split(`${titulo}${detalle ? ` — ${detalle}` : ''}`, rightW)
      const h = 3 + labelLH + 1 + (Math.max(1, rightLines.length) * valueLH) + 4
      return { fecha, rightLines, h }
    })
    const contentH = filas.reduce((a, f) => a + f.h, 0)
    const alto = 10 + contentH + cardPad + 4
    if (y + alto > pageH - 16) nuevaPagina()

    setFill({ r: 255, g: 255, b: 255 })
    setDraw(colorBorder)
    doc.roundedRect(x, y, cardW, alto, r, r, 'FD')
    setFill(colorSurface)
    doc.roundedRect(x, y, cardW, 10, r, r, 'F')
    setText(colorText)
    doc.setFontSize(10)
    doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'bold')
    doc.text('Cronología del flujo', x + cardPad, y + 7)

    let yy = y + 16
    for (const f of filas) {
      doc.setFont(afacadOk ? 'Afacad' : 'helvetica', 'normal')
      doc.setFontSize(labelSize)
      setText(colorTextMuted)
      doc.text('FECHA / HORA', x + cardPad, yy)
      doc.setFontSize(valueSize)
      setText(colorText)
      const fechaLines = _split(f.fecha, leftW)
      for (let j = 0; j < fechaLines.length; j++) {
        doc.text(fechaLines[j], x + cardPad, yy + labelLH + 1 + (j * valueLH))
      }

      doc.setFontSize(labelSize)
      setText(colorTextMuted)
      doc.text('EVENTO', x + cardPad + leftW + gap, yy)
      doc.setFontSize(valueSize)
      setText(colorText)
      for (let j = 0; j < f.rightLines.length; j++) {
        doc.text(f.rightLines[j], x + cardPad + leftW + gap, yy + labelLH + 1 + (j * valueLH))
      }

      yy += f.h
      if (yy < y + alto - 8) {
        setDraw(colorBorder)
        doc.line(x + cardPad, yy - 2, x + cardW - cardPad, yy - 2)
      }
    }

    y += alto + 8
  }

  for (const sec of seccionesRevisionCompleta.value) {
    card(sec.titulo, sec.items)
  }

  const ip = firma.value.firma_ip_publica || await _obtenerIpPublica()
  if (ip && ip !== firma.value.firma_ip_publica) {
    firma.value = { ...firma.value, firma_ip_publica: ip }
  }
  const dispositivo = [
    firma.value.firma_dispositivo_tipo,
    firma.value.firma_sistema_operativo,
    firma.value.firma_navegador,
  ].filter(Boolean).join(' / ')

  const firmaCardItems = [
    { label: 'Nombre firmado', value: firma.value.nombre_firma || '' },
    { label: 'Fecha firma', value: formatearFecha(firma.value.firma_fecha_iso || new Date().toISOString()) },
    { label: 'Método', value: firma.value.firma_metodo || '' },
    { label: 'Hash firma', value: firma.value.firma_hash || '' },
    { label: 'IP pública', value: firma.value.firma_ip_publica || '—' },
    { label: 'Dispositivo', value: dispositivo || '—' },
    { label: 'Transacción', value: firma.value.firma_transaccion_id || '—' },
    { label: 'Hash documento', value: firma.value.firma_doc_hash_sha256 || '—' },
  ]
  card('Evidencia de firma — Solicitante', firmaCardItems)

  const img = firma.value.firma_imagen_dataurl || ''
  if (img) {
    const imgW = cardW
    const imgH = 28
    if (y + imgH + 10 > pageH - 16) nuevaPagina()
    setDraw(colorBorder)
    setFill({ r: 255, g: 255, b: 255 })
    doc.roundedRect(x, y, imgW, imgH, r, r, 'FD')
    try {
      const norm = await _normalizarImagenParaPdf(img)
      doc.addImage(norm.dataUrl, norm.tipo, x + 6, y + 6, imgW - 12, imgH - 12)
    } catch {
      setText(colorTextMuted)
      doc.setFontSize(8)
      doc.text('Firma (imagen no soportada)', x + 6, y + 16)
      setText(colorText)
      doc.setFontSize(9)
    }
    y += imgH + 8
  }

  const eventos = [
    { fecha: formatearFecha(fechaSolicitudIso), titulo: 'Solicitud radicada', detalle: radicado },
    { fecha: autorizaciones.value.autorizacion_aceptada ? '—' : '—', titulo: 'Autorizaciones', detalle: autorizaciones.value.autorizacion_aceptada ? 'Aceptadas' : 'Pendientes' },
    { fecha: firma.value.firma_fecha_iso ? formatearFecha(firma.value.firma_fecha_iso) : '—', titulo: 'Firma aplicada', detalle: firma.value.nombre_firma || '' },
    { fecha: new Date().toISOString() ? formatearFecha(new Date().toISOString()) : '—', titulo: 'Documento PDF generado', detalle: '' },
  ]
  cronologiaCard(eventos)

  return doc.output('blob')
}


// ── Cálculos financieros ──────────────────────────────────
const capacidadEndeudamiento = computed(() => {
  const ingresos = (Number(financiera.value.salario_ingresos_fijos) || 0) + (Number(financiera.value.ingresos_independiente) || 0)
  const gastos   = (Number(financiera.value.gastos_familiares) || 0) + (Number(financiera.value.obligaciones_financieras) || 0) + (Number(financiera.value.otros_gastos) || 0)
  return ingresos - gastos
})

const esCapacidadInsuficiente = computed(() => {
  const monto = Number(general.value.valor_credito || general.value.valor_reestructura) || 0
  // Regla simple: si el monto solicitado es > 40 veces su capacidad mensual
  return capacidadEndeudamiento.value > 0 && monto > (capacidadEndeudamiento.value * 40)
})

// Campos críticos vacíos para el banner de alerta
const alertasVacias = computed(() => {
  const items = []
  if (!persona.value.nombres || !persona.value.apellidos)           items.push('Nombre completo')
  if (!persona.value.numero_identificacion)                         items.push('Número de documento')
  if (!persona.value.fecha_nacimiento)                              items.push('Fecha de nacimiento')
  if (!persona.value.fecha_expedicion_documento)                    items.push('Fecha de expedición')
  if (!persona.value.correo_electronico)                            items.push('Correo electrónico')
  if (!persona.value.direccion_residencia)                          items.push('Dirección de residencia')
  if (!laboral.value.tipo_trabajador)                               items.push('Tipo de trabajador')
  if (laboral.value.tipo_trabajador === 'pensionado') {
    if (!financiera.value.mesada_pensional) items.push('Valor mesada pensional')
  } else if (laboral.value.tipo_trabajador === 'independiente') {
    if (!financiera.value.ingresos_independiente) items.push('Ingresos como independiente')
  } else if (laboral.value.tipo_trabajador === 'estudiante' || laboral.value.tipo_trabajador === 'cuidado_hogar') {
    if (!financiera.value.salario_ingresos_fijos) items.push('Ingresos mensuales')
    if (!financiera.value.fuente_ingresos)        items.push('Fuente de ingresos')
  } else {
    if (!financiera.value.salario_ingresos_fijos) items.push('Salario / Ingresos fijos')
  }
  if (mostrarCuentaDesembolso.value && !cuenta.value.numero_cuenta) items.push('Número de cuenta bancaria')
  return items
})

function seleccionarModalidad(v) {
  actualizarGeneral('modalidad_credito', v)
  if (paso.value === 1 && v) {
    siguiente()
  }
}

function actualizarGeneral(campo, valor) {
  const nuevosDatos = { ...general.value, [campo]: valor }

  // Limpiar montos si cambia el tipo de operación para evitar datos inconsistentes
  if (campo === 'tipo_operacion') {
    nuevosDatos.destino_credito = ''
    nuevosDatos.plazo_solicitado = ''
    
    if (valor === 'credito_nuevo') {
      nuevosDatos.valor_reestructura = ''
      nuevosDatos.valor_desembolso = ''
    } else if (valor === 'reestructura') {
      nuevosDatos.valor_credito = ''
      nuevosDatos.valor_desembolso = ''
    } else if (valor === 'reestructura_desembolso') {
      nuevosDatos.valor_credito = ''
    }
  }

  general.value = nuevosDatos
}

const esEducativo = computed(() => general.value.modalidad_credito === 'educativo')
const esOrdinario = computed(() => general.value.modalidad_credito === 'ordinario')
const maxPlazo    = computed(() => esEducativo.value ? 6 : esOrdinario.value ? 60 : 120)

// Clamp plazo si ya tenía un valor mayor cuando se cambia la modalidad
watch(esEducativo, (educativo) => {
  if (educativo && Number(general.value.plazo_solicitado) > 6) {
    general.value = { ...general.value, plazo_solicitado: '6' }
  }
  if (educativo && !general.value.institucion) {
    general.value = { ...general.value, institucion: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ' }
  }
})
watch(esOrdinario, (ordinario) => {
  if (ordinario && Number(general.value.plazo_solicitado) > 60) {
    general.value = { ...general.value, plazo_solicitado: '60' }
  }
})

function actualizarPlazo(valor) {
  const raw = String(valor ?? '')
  const cleaned = raw.replace(/\D/g, '')

  if (!cleaned) {
    errorPlazo.value = null
    actualizarGeneral('plazo_solicitado', '')
    return
  }

  const num = Number(cleaned)
  if (!Number.isFinite(num)) {
    errorPlazo.value = null
    actualizarGeneral('plazo_solicitado', '')
    return
  }

  const min = 1
  const max = maxPlazo.value
  const clamped = Math.min(Math.max(num, min), max)
  if (num > max) {
    const label = esEducativo.value ? 'educativo' : 'ordinario'
    errorPlazo.value = `Plazo máximo crédito ${label} es ${max} meses.`
  } else if (num < min) {
    errorPlazo.value = 'El plazo mínimo es 1 mes.'
  } else {
    errorPlazo.value = null
  }

  actualizarGeneral('plazo_solicitado', String(clamped))
}

function actualizarLaboral(campo, valor) {
  laboral.value = { ...laboral.value, [campo]: valor }
}

function actualizarCuenta(campo, valor) {
  cuenta.value = { ...cuenta.value, [campo]: valor }
}

function actualizarDocumentos(v) {
  documentos.value = v
}

function actualizarLaboralCod1(campo, valor) {
  laboralCod1.value = { ...laboralCod1.value, [campo]: valor }
}
function actualizarLaboralCod2(campo, valor) {
  laboralCod2.value = { ...laboralCod2.value, [campo]: valor }
}

// Prefill nombre en la firma cuando llega al paso 3
watch(paso, async (nuevoPaso) => {
  if (nuevoPaso === 3 && !firma.value.nombre_firma) {
    const nombreCompleto = [persona.value.nombres, persona.value.apellidos].filter(Boolean).join(' ')
    if (nombreCompleto) firma.value = { ...firma.value, nombre_firma: nombreCompleto }
  }
  // Garantiza que la solicitud esté guardada antes de pasos que requieren solicitudId
  if (nuevoPaso === 2 && !solicitudId.value) {
    await guardarPaso()
  }
})

// ── Captura de documento: vincular token a solicitud en cuanto se crea ──────
const tokenCaptura = ref(null)

function onSesionCapturaCreada({ token }) {
  tokenCaptura.value = token
}

// Cuando solicitudId pasa de null a un valor real, vincular si hay token activo
watch(solicitudId, async (nuevoId, prevId) => {
  if (nuevoId && !prevId && tokenCaptura.value) {
    try {
      await vincularSolicitudCaptura(tokenCaptura.value, nuevoId)
    } catch (e) {
      console.warn('[CapturaDocumento] No se pudo vincular:', e)
    }
  }
})

// ── OTP: validación de correo ────────────────────────────────────────────────
const emailValidado   = ref(false)
const mostrarModalOtp = ref(false)

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function onDocumentoAreaClick() {
  if (emailValidado.value) return
  const email = verificacion.value.correo.trim()
  if (!email || !RE_EMAIL.test(email)) return
  if (import.meta.env.VITE_SKIP_OTP === 'true') {
    emailValidado.value = true
    return
  }
  mostrarModalOtp.value = true
}

function onOtpValidado() {
  emailValidado.value   = true
  mostrarModalOtp.value = false
}
</script>

<template>
  <PortalLayout>

    <!-- ═══ PANTALLA DE ÉXITO ═══════════════════════════════ -->
    <div v-if="enviado" :style="{
      background:   'transparent',
      border:       'none',
      borderRadius: 'var(--r-xl)',
      padding:      '64px var(--sp-2xl)',
      boxShadow:    'none',
      textAlign:    'center',
    }">
      <div :style="{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'var(--color-success-bg)',
        border: '2px solid var(--color-success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--sp-xl)',
      }">
        <IconCircleCheck :size="40" :style="{ color: 'var(--color-success)' }" />
      </div>
      <div :style="{
        fontFamily:   'var(--font-display)',
        fontSize:     'var(--text-xl)',
        fontWeight:   'var(--fw-extrabold)',
        color:        'var(--color-text-1)',
        marginBottom: 'var(--sp-md)',
      }">¡Solicitud radicada exitosamente!</div>
      <div :style="{
        fontSize:   'var(--text-base)',
        color:      'var(--color-text-2)',
        fontWeight: 'var(--fw-regular)',
        lineHeight: '1.7',
        maxWidth:   '480px',
        margin:     '0 auto var(--sp-2xl)',
      }">
       Te recomendamos estar atento al correo y contacto proporcionado.<br>
       En caso de presentarse alguna novedad, un asesor de Cooperamigó se comunicará oportunamente.
      </div>
      <PortalButton variant="primary" @click="router.push('/')">
       Regresar al inicio
      </PortalButton>

      <!-- Aviso codeudores -->
      <div v-if="numCodudores > 0" :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--r-md)',
        padding: 'var(--sp-xl)',
        marginTop: 'var(--sp-lg)',
        textAlign: 'left',
      }">
        <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', marginBottom: 'var(--sp-sm)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
          <IconMail :size="16" /> Enlace de firma enviado al codeudor
        </div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', fontWeight: 'var(--fw-medium)', lineHeight: '1.6' }">
          Se enviará un enlace al correo del codeudor para que firme la solicitud.
          El proceso continúa una vez todos los codeudores hayan firmado.
        </div>
      </div>
    </div>

    <!-- ═══ PANTALLA PREVIA — Verificación de identidad ═════ -->
    <div v-else-if="!verificado">

      <div :style="{ maxWidth: '420px', width: '100%', margin: '0 auto' }">

        <!-- Título -->
        <div :style="{ marginBottom: 'var(--sp-2xl)' }">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--text-xl)',
            fontWeight: 'var(--fw-extrabold)',
            color:      'var(--color-text-1)',
          }">¡Saludos! Comencemos con algunos datos</div>
        </div>

        <!-- Campos de verificación -->
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

          <!-- Correo -->
          <div>
            <CampoTexto
              :model-value="verificacion.correo"
              label="Correo electrónico"
              type="email"
              placeholder="su.correo@ejemplo.com"
              required
              :error="errorCorreo"
              @update:model-value="onCorreoCambiaConValidacion($event)"
              @blur="onCorreoBlur"
            />
          </div>

          <!-- Selector de Tipo (Dropdown) -->
          <CampoSelect
            v-model="verificacion.tipo_documento"
            label="Tipo de documento"
            required
            :opciones="opsTipoDocVerificacion"
            @click="onDocumentoAreaClick"
          />

          <!-- Número de Documento -->
          <CampoTexto
            v-model="verificacion.numero_documento"
            label="Número de documento"
            placeholder="Sin puntos ni espacios"
            required
            solo-numeros
            :maxlength="15"
            @click="onDocumentoAreaClick"
          />

          <!-- Badge: correo verificado -->
          <div v-if="emailValidado" :style="{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
            padding: 'var(--sp-sm) var(--sp-md)',
            borderRadius: 'var(--r-md)',
            background: 'var(--color-success-bg)',
          }">
            <IconCircleCheck :size="15" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
            <span :style="{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
              color: 'var(--color-success)',
            }">Correo electrónico verificado</span>
          </div>

          <div v-if="errorVerificacion" :style="{
            background:   'var(--color-error-bg)',
            color:        'var(--color-error-text)',
            padding:      'var(--sp-md) var(--sp-lg)',
            borderRadius: 'var(--r-md)',
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--fw-medium)',
          }">{{ errorVerificacion }}</div>

          <!-- Checkbox de aceptación -->
          <label :style="{
            display:    'flex',
            alignItems: 'flex-start',
            gap:        'var(--sp-sm)',
            cursor:     'pointer',
          }">
            <input
              v-model="aceptaCondiciones"
              type="checkbox"
              :style="{ marginTop: '3px', flexShrink: '0', accentColor: 'var(--color-primary)', width: '15px', height: '15px', cursor: 'pointer' }"
            />

            <span :style="{
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)',
              lineHeight: '1.7',
            }">
              Autorizo a la Cooperativa Multiactiva Luis Amigó para tratar mis datos personales, incluyendo contacto y correo electrónico, con la finalidad de contactarme, gestionar mi solicitud, realizar seguimiento y enviarme información relacionada con los productos y servicios ofrecidos.
              Asimismo, autorizo la consulta, reporte y actualización de mi información en centrales de información financiera y crediticia, con el fin de verificar mis datos y evaluar mi comportamiento crediticio.
              <br><br>
              Declaro que conozco mis derechos como titular de la información y que puedo ejercerlos conforme a la ley. Igualmente, manifiesto que he leído y acepto los
              <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">términos y condiciones</a>
              y la
              <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">política de tratamiento de datos personales</a>
              publicados en <a href="https://www.cooperamigo.coop" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">www.cooperamigo.coop</a> para mi permanente consulta y revisión.
            </span>
          </label>

          <div :style="{
            display: 'flex', justifyContent: 'space-between',
            gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)',
          }">
            <PortalButton variant="secondary" @click="router.push('/')">Volver</PortalButton>
            <PortalButton
              variant="primary"
              :loading="loadingVerificacion"
              :disabled="!aceptaCondiciones || !!errorCorreo || !emailValidado"
              @click="verificarYContinuar()"
            >
              Verificar y continuar
            </PortalButton>
          </div>

        </div>
      </div>

      <!-- Modal OTP (Teleport to body — no afecta la cadena v-if) -->
      <ModalOtpEmail
        v-if="mostrarModalOtp"
        :email="verificacion.correo"
        contexto="credito"
        @validado="onOtpValidado"
      />

    </div>

    <!-- ═══ FORMULARIO ACTIVO (3 pasos) ════════════════════ -->
    <div v-else :style="{ width: '100%', margin: '0 auto', paddingTop: 'var(--sp-xl)' }">

      <!-- Banner: borrador encontrado -->
      <div v-if="mostrarOpcionBorrador" :style="{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-p-light)',
        borderRadius: 'var(--r-md)',
        padding:      'var(--sp-lg) var(--sp-xl)',
        marginBottom: 'var(--sp-xl)',
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-md)',
        boxShadow:    '0 4px 12px rgba(0,0,0,0.03)'
      }">
        <div :style="{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--color-p-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
          color: 'var(--color-primary)'
        }">
          <IconRotateClockwise2 :size="20" />
        </div>
        <div :style="{ flex: '1' }">
          <div :style="{
            fontWeight:   'var(--fw-bold)',
            color:        'var(--color-primary)',
            fontSize:     'var(--text-base)',
            marginBottom: '2px',
          }">Tienes una solicitud en curso</div>
          <div :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-2)',
            fontWeight: 'var(--fw-medium)',
          }">
            Guardamos tu progreso el {{ formatearFecha(fechaBorrador) }}.
          </div>
        </div>
        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', flexShrink: '0' }">
          <button 
            @click="empezarDeNuevo"
            :style="{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-3)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }"
          >
            Empezar de nuevo
          </button>
          <PortalButton variant="primary" small @click="continuarConBorrador">
            Continuar solicitud
          </PortalButton>
        </div>
      </div>

      <!-- Banner: datos recuperados (tras elegir Continuar) -->
      <div v-if="borradorRecuperado && !mostrarOpcionBorrador" :style="{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-sm)',
        padding:      'var(--sp-md) var(--sp-lg)',
        borderRadius: 'var(--r-md)',
        background:   'var(--color-success-bg)',
        marginBottom: 'var(--sp-lg)',
      }">
        <IconCircleCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
        <span :style="{
          fontSize:   'var(--text-sm)',
          color:      'var(--color-success-text)',
          fontWeight: 'var(--fw-semibold)',
        }">Sus datos anteriores fueron recuperados. Continúa desde donde lo dejó.</span>
      </div>

      <!-- Encabezado -->
      <div v-if="!verificado" :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: '2px', lineHeight: '1.1',
        }">Solicitud de crédito</div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-regular)', lineHeight: '1.25' }">
          Obtenga el financiamiento que necesita con las mejores condiciones
        </div>
      </div>

      <div v-if="paso !== 1" :style="{ marginTop: '56px' }">
        <StepIndicator :pasos="secciones" :actual="seccionActual" />
      </div>

      <!-- ── PASO 1: Modalidad de crédito ─────────────────── -->
      <div v-if="paso === 1" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
        <SelectorModalidad
          :model-value="general.modalidad_credito"
          @update:model-value="seleccionarModalidad"
        />
      </div>

      <!-- ── PASO 2: Formulario Completo (Estilo PDF) ───────── -->
      <div v-if="paso === 2" :style="{
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-2xl)',
        marginTop: '48px',
      }">

          <!-- 1. Información de la Solicitud -->
          <div id="seccion-solicitud" :style="{
            background:   'var(--color-bg-card)',
            border:       '1px solid var(--color-border-card)',
            borderRadius: 'var(--r-md)',
            overflow:     'hidden',
            boxShadow:    'var(--shadow-card)',
          }">
            <div :style="{
              padding:    'var(--sp-md) var(--sp-xl)',
              background: 'var(--color-primary)',
              color:      'white',
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-base)',
              fontWeight: 'var(--fw-bold)',
              display:    'flex',
              alignItems: 'center',
              gap:        'var(--sp-sm)',
            }">
              <IconFileDescription :size="20" />
              Información de la solicitud
            </div>

            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
              
              <!-- Fila: Tipo de operación y sus valores asociados -->
              <div :style="{ 
                display: 'grid', 
                gridTemplateColumns: (mostrarTipoOperacion && general.tipo_operacion === 'reestructura_desembolso' && !isMobile) ? '1fr 1fr 1fr' : 
                                     (mostrarTipoOperacion && mostrarValorReestructura && !isMobile) ? '1fr 1fr' : '1fr',
                gap: 'var(--sp-md)' 
              }">
                <CampoSelectBuscable
                  v-if="mostrarTipoOperacion"
                  :model-value="general.tipo_operacion"
                  label="Tipo de operación"
                  required
                  :opciones="opsTipoOperacion"
                  @update:model-value="actualizarGeneral('tipo_operacion', $event)"
                />
                
                <CampoMoneda 
                  v-if="mostrarValorReestructura && mostrarTipoOperacion" 
                  :model-value="general.valor_reestructura" 
                  label="Valor reestructura" 
                  required 
                  @update:model-value="actualizarGeneral('valor_reestructura', $event)" 
                />

                <CampoMoneda 
                  v-if="mostrarValorDesembolso && mostrarTipoOperacion" 
                  :model-value="general.valor_desembolso" 
                  label="Valor desembolso" 
                  required 
                  @update:model-value="actualizarGeneral('valor_desembolso', $event)" 
                />
              </div>

              <!-- Fallbacks para casos donde no se muestra el selector de operación -->
              <div v-if="!mostrarTipoOperacion">
                 <CampoMoneda v-if="mostrarValorReestructura" :model-value="general.valor_reestructura" label="Valor de la reestructura" required @update:model-value="actualizarGeneral('valor_reestructura', $event)" />
              </div>
              <template v-if="!mostrarTipoOperacion || general.tipo_operacion">
                <template v-if="esEducativo">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoMoneda
                      v-if="mostrarValorCredito"
                      :model-value="general.valor_credito"
                      label="Valor del crédito"
                      required
                      @update:model-value="actualizarGeneral('valor_credito', $event)"
                    />
                    <CampoSelectBuscable :model-value="general.tipo_estudio" label="Tipo de estudio" required :opciones="opsTipoEstudio" @update:model-value="actualizarGeneral('tipo_estudio', $event)" />
                    <CampoTexto
                      :model-value="general.plazo_solicitado"
                      label="Plazo (meses)"
                      required
                      solo-numeros
                      :maxlength="2"
                      :error="errorPlazo"
                      @update:model-value="actualizarPlazo($event)"
                    />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="general.denominacion_carrera" label="Carrera o programa académico" required @update:model-value="actualizarGeneral('denominacion_carrera', $event)" />
                    <CampoSelectBuscable :model-value="general.institucion" label="Institución" required :opciones="opsInstitucionEducativa" @update:model-value="actualizarGeneral('institucion', $event)" />
                  </div>
                </template>
                <div v-else :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : mostrarValorCredito ? '1fr 2fr 1fr' : '3fr 1fr', gap: 'var(--sp-lg)' }">
                  <CampoMoneda v-if="mostrarValorCredito" :model-value="general.valor_credito" label="Valor del crédito" required @update:model-value="actualizarGeneral('valor_credito', $event)" />
                  <CampoTexto :model-value="general.destino_credito" label="Destino del crédito" required :maxlength="40" @update:model-value="actualizarGeneral('destino_credito', $event ? $event.toUpperCase() : $event)" />
                  <CampoTexto
                    :model-value="general.plazo_solicitado"
                    label="Plazo (meses)"
                    required
                    solo-numeros
                    :maxlength="2"
                    :error="errorPlazo"
                    @update:model-value="actualizarPlazo($event)"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- 2. Información del Solicitante -->
          <div id="seccion-persona" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUserCheck :size="20" /> Información personal
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPersona :model-value="persona" titulo="" :bloquear-documento="true" :bloquear-correo="true" :direccion-estructurada="direccionEstructurada" :ubicacion="ubicacionResidencia" :show-nivel-educativo="true" @update:model-value="persona = $event" @update:direccion-estructurada="direccionEstructurada = $event" @update:ubicacion="ubicacionResidencia = $event" />
            </div>
          </div>

          <!-- Bloqueo por menor de edad -->
          <div v-if="esMenorDeEdad" :style="{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-md)', padding: 'var(--sp-lg) var(--sp-xl)', borderRadius: 'var(--r-md)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/></svg>
            <div>
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-error-text)', fontSize: 'var(--text-base)', marginBottom: 'var(--sp-2xs)' }">No es posible continuar con la solicitud</div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-error-text)', fontWeight: 'var(--fw-medium)', lineHeight: '1.5' }">El solicitante debe ser mayor de 18 años para acceder a productos de crédito.</div>
            </div>
          </div>

          <!-- 3. Información Laboral -->
          <div id="seccion-laboral" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconRotate :size="20" /> Situación laboral
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <SelectorTipoTrabajador :model-value="laboral.tipo_trabajador" @update:model-value="actualizarLaboral('tipo_trabajador', $event)" />
              <div v-if="laboral.tipo_trabajador" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

                <!-- Empleado -->
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboral.nombre_empresa" label="Nombre de la empresa" required solo-texto-laboral @update:model-value="actualizarLaboral('nombre_empresa', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboral.cargo_oficio" label="Cargo u oficio" required solo-texto-laboral @update:model-value="actualizarLaboral('cargo_oficio', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboral.tipo_contrato" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboral('tipo_contrato', $event)" />
                    <SelectorFecha :model-value="laboral.fecha_ingreso" label="Fecha de ingreso" required @update:model-value="actualizarLaboral('fecha_ingreso', $event)" />
                  </div>
                </template>

                <!-- Independiente -->
                <template v-if="laboral.tipo_trabajador === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboral.actividad_comercial" label="Actividad comercial" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboral('actividad_comercial', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboral.fecha_inicio_actividad" label="Fecha de inicio" required @update:model-value="actualizarLaboral('fecha_inicio_actividad', $event)" />
                    <CampoTexto :model-value="laboral.ocupacion" label="Ocupación" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboral('ocupacion', $event ? $event.toUpperCase() : $event)" />
                  </div>
                </template>

                <!-- Pensionado -->
                <template v-if="laboral.tipo_trabajador === 'pensionado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboral.entidad_pagadora" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" @update:model-value="actualizarLaboral('entidad_pagadora', $event)" />
                  </div>
                </template>

                <!-- Estudiante -->
                <template v-if="laboral.tipo_trabajador === 'estudiante'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboral.institucion_educativa" label="Institución educativa" required @update:model-value="actualizarLaboral('institucion_educativa', $event ? $event.toUpperCase() : $event)" />
                    <CampoSelectBuscable :model-value="laboral.nivel_educativo" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboral('nivel_educativo', $event)" />
                  </div>
                </template>

                <!-- Cuidado del hogar -->
                <template v-if="laboral.tipo_trabajador === 'cuidado_hogar'">
                  <div />
                </template>

              </div>
            </div>
          </div>

          <!-- 4. Información Financiera -->
          <div id="seccion-financiera" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileDescription :size="20" /> Información financiera
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionFinanciera :model-value="financiera" titulo="" :salario-bloqueado="salarioBloqueado" :tipo-trabajador="laboral.tipo_trabajador" @update:model-value="financiera = $event" />
            </div>
          </div>

          <!-- 5. Patrimonio -->
          <div id="seccion-patrimonio" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFile :size="20" /> Patrimonio
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPatrimonio :model-value="patrimonio" titulo="" @update:model-value="patrimonio = $event" />
            </div>
          </div>

          <!-- 6. Cuenta para desembolso -->
          <div v-if="mostrarCuentaDesembolso" id="seccion-cuenta" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileCheck :size="20" /> {{ esEducativo ? 'Autorización de desembolso directo' : 'Cuenta para desembolso' }}
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
              <template v-if="esEducativo">
                <div :style="{ padding: 'var(--sp-xl)', borderRadius: 'var(--r-xl)', background: 'white', display: 'flex', flexDirection:'column', gap: 'var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-regular)', lineHeight: '1.7', textAlign: 'justify' }">
                    Señores
                    <br />
                    <span :style="{ fontWeight: 'var(--fw-bold)' }">COOPERATIVA MULTIACTIVA LUIS AMIGÓ</span>
                    <br /><br />
                    Yo, <span :style="{ fontWeight: 'var(--fw-bold)' }">{{ (persona.nombres + ' ' + persona.apellidos).trim() || '—' }}</span>,
                    identificado(a) con la cédula de ciudadanía No. <span :style="{ fontWeight: 'var(--fw-bold)' }">{{ persona.numero_identificacion || '—' }}</span>,
                    en mi calidad de asociado(a) y como titular del crédito bajo la línea <span :style="{ fontWeight: 'var(--fw-bold)' }">CRÉDITO EDUCATIVO</span>
                    otorgado para estudios en la <span :style="{ fontWeight: 'var(--fw-bold)' }">UNIVERSIDAD CATÓLICA LUIS AMIGÓ</span>,
                    autorizo de manera expresa a la Cooperativa para que efectúe directamente a la institución el pago de la matrícula a nombre del/la señor(a)
                    <input
                      :value="general.beneficiario_nombre"
                      type="text"
                      placeholder="Nombre beneficiario (estudiante)"
                      :style="{
                        display: 'inline-block',
                        minWidth: isMobile ? '160px' : '220px',
                        maxWidth: isMobile ? '220px' : '260px',
                        border: 'none',
                        borderBottom: '1px solid var(--color-text-2)',
                        background: 'transparent',
                        color: 'var(--color-text-2)',
                        caretColor: 'var(--color-text-2)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--fw-medium)',
                        outline: 'none',
                        padding: '0 2px 0 2px',
                        margin: '0 3px',
                        lineHeight: '1.1',
                        height: '18px',
                        verticalAlign: 'bottom',
                      }"
                      @input="actualizarGeneral('beneficiario_nombre', $event.target.value ? $event.target.value.toUpperCase() : $event.target.value)"
                    />,
                    para {{ general.tipo_estudio === 'pregrado' ? 'pregrado' : 'posgrado' }}
                    en el programa de <span :style="{ fontWeight: 'var(--fw-bold)' }">{{ general.denominacion_carrera || '—' }}</span>,
                    por un valor total de <span :style="{ fontWeight: 'var(--fw-bold)' }">{{ formatMonto(general.valor_credito) }}</span>
                    según consta en la liquidación de matrícula anexa.
                  </div>

                  <label :style="{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-sm)', cursor: 'pointer' }">
                    <input
                      v-model="autorizaciones.autorizacion_desembolso_directo_educativo"
                      type="checkbox"
                      :style="{ marginTop: '3px', flexShrink: '0', accentColor: 'var(--color-primary)', width: '15px', height: '15px', cursor: 'pointer' }"
                    />
                    <span :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)', lineHeight: '1.6' }">
                      Autorizo el desembolso directo del crédito a la institución educativa.<span :style="{ color: 'var(--color-error)' }"> *</span>
                    </span>
                  </label>
                </div>
              </template>
              <template v-else>
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                  <CampoSelectBuscable :model-value="cuenta.tipo_cuenta" label="Tipo de cuenta" required :opciones="opsTipoCuenta" @update:model-value="actualizarCuenta('tipo_cuenta', $event)" />
                  <CampoSelectBuscable :model-value="cuenta.entidad_bancaria" label="Entidad bancaria" required :disabled="!cuenta.tipo_cuenta" :limit="0" :opciones="[...ENTIDADES_BANCARIAS.map(e => ({ value: e, label: e })), { value: 'otro', label: 'Otra entidad' }]" @update:model-value="actualizarCuenta('entidad_bancaria', $event)" />
                </div>
                <CampoTexto v-if="cuenta.entidad_bancaria === 'otro'" :model-value="cuenta.entidad_bancaria_otro" label="Especifique entidad" required @update:model-value="actualizarCuenta('entidad_bancaria_otro', $event)" />
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)', alignItems: 'center' }">
                  <CampoTexto :model-value="cuenta.numero_cuenta" label="Número de cuenta" required solo-numeros :maxlength="18" :disabled="!cuenta.entidad_bancaria" @update:model-value="actualizarCuenta('numero_cuenta', $event)" />
                  <CampoCheck :model-value="cuenta.cuenta_tercero" label="La cuenta pertenece a un tercero" @update:model-value="actualizarCuenta('cuenta_tercero', $event)" />
                </div>
                <template v-if="cuenta.cuenta_tercero">
                  <div :style="{ padding: 'var(--sp-xl)', borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', display: 'flex', flexDirection:'column', gap: 'var(--sp-lg)' }">
                    <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }">Datos del titular</div>
                    <CampoTexto :model-value="cuenta.nombre_tercero" label="Nombre completo" required @update:model-value="actualizarCuenta('nombre_tercero', $event ? $event.toUpperCase() : $event)" />
                    <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                      <CampoSelect :model-value="cuenta.tipo_doc_tercero" label="Tipo documento" required :opciones="opsTipoDocTitular" @update:model-value="actualizarCuenta('tipo_doc_tercero', $event)" />
                      <CampoTexto :model-value="cuenta.numero_doc_tercero" label="Número documento" required solo-numeros @update:model-value="actualizarCuenta('numero_doc_tercero', $event)" />
                    </div>
                  </div>

                  <!-- Carta de autorización -->
                  <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-bg-surface)' }">
                      <div :style="{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-impulso)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
                        <IconUpload :size="18" :style="{ color: '#fff' }" />
                      </div>
                      <div :style="{ flex: '1', minWidth: '0' }">
                        <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                          Carta de autorización
                          <span :style="{ marginLeft: 'var(--sp-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 8px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Obligatorio</span>
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-regular)' }">Debe anexar carta firmada autorizando el desembolso de los recursos en cuenta de titularidad de un tercero.</div>
                      </div>
                      <div v-if="cartaAutorizacion.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
                        <IconLoader2 :size="15" :style="{ animation: 'spin 1s linear infinite' }" /> Subiendo…
                      </div>
                      <div v-else-if="cartaAutorizacion.url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
                        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-lg)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', maxWidth: '190px' }">
                          <IconCheck :size="13" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                          <span :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ cartaAutorizacion.nombre?.length > 16 ? cartaAutorizacion.nombre.substring(0, 13) + '...' : cartaAutorizacion.nombre }}</span>
                          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: 'var(--r-sm)', flexShrink: '0' }" @click="quitarCarta"><IconX :size="13" :style="{ color: 'var(--color-success-text)' }" /></button>
                        </div>
                        <button :style="{ border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)', flexShrink: '0' }" @click="abrirPreviewDoc(cartaAutorizacion.url, 'Carta de autorización')">Visualizar</button>
                      </div>
                      <button v-else-if="cartaAutorizacion.error" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-error)', background: 'var(--color-error-bg)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-error)', flexShrink: '0' }" @click="refCartaUpload?.click()">
                        <IconUpload :size="13" /> Reintentar
                      </button>
                      <div v-else :style="{ display: 'flex', gap: 'var(--sp-sm)', flexShrink: '0' }">
                        <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCartaUpload?.click()">
                          <IconUpload :size="13" /> Subir archivo
                        </button>
                      </div>
                      <input ref="refCartaUpload" type="file" accept=".pdf,image/*" :style="{ display: 'none' }" @change="onFileCarta" />
                    </div>
                  </div>

                  <!-- Certificación bancaria -->
                  <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-bg-surface)' }">
                      <div :style="{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-impulso)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
                        <IconUpload :size="18" :style="{ color: '#fff' }" />
                      </div>
                      <div :style="{ flex: '1', minWidth: '0' }">
                        <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                          Certificación bancaria
                          <span :style="{ marginLeft: 'var(--sp-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 8px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Obligatorio</span>
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-regular)' }">Por favor, anexe la certificación bancaria de la cuenta indicada.</div>
                      </div>
                      <div v-if="certBancaria.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
                        <IconLoader2 :size="15" :style="{ animation: 'spin 1s linear infinite' }" /> Subiendo…
                      </div>
                      <div v-else-if="certBancaria.url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
                        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-lg)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', maxWidth: '190px' }">
                          <IconCheck :size="13" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                          <span :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ certBancaria.nombre?.length > 16 ? certBancaria.nombre.substring(0, 13) + '...' : certBancaria.nombre }}</span>
                          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: 'var(--r-sm)', flexShrink: '0' }" @click="quitarCert"><IconX :size="13" :style="{ color: 'var(--color-success-text)' }" /></button>
                        </div>
                        <button :style="{ border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)', flexShrink: '0' }" @click="abrirPreviewDoc(certBancaria.url, 'Certificación bancaria')">Visualizar</button>
                      </div>
                      <button v-else-if="certBancaria.error" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-error)', background: 'var(--color-error-bg)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-error)', flexShrink: '0' }" @click="refCertUpload?.click()">
                        <IconUpload :size="13" /> Reintentar
                      </button>
                      <div v-else :style="{ display: 'flex', gap: 'var(--sp-sm)', flexShrink: '0' }">
                        <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCertUpload?.click()">
                          <IconUpload :size="13" /> Subir archivo
                        </button>
                      </div>
                      <input ref="refCertUpload" type="file" accept=".pdf,image/*" :style="{ display: 'none' }" @change="onFileCert" />
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <div v-if="intentoContinuarPaso2 && !pasoSolicitudValido" :style="{ borderRadius: 'var(--r-md)', padding: 'var(--sp-md) var(--sp-lg)', background: '#fff8f0', display: 'flex', gap: 'var(--sp-md)' }">
            <IconAlertTriangle :size="20" style="color: var(--color-impulso); flex-shrink: 0; margin-top: 2px;" />
            <div>
              <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-impulso)', marginBottom: 'var(--sp-xs)' }">
                No puede continuar: faltan {{ erroresCampos.length }} campo{{ erroresCampos.length > 1 ? 's' : '' }} obligatorio{{ erroresCampos.length > 1 ? 's' : '' }} por completar:
              </div>
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xs)' }">
                <span
                  v-for="err in erroresCampos"
                  :key="err"
                  :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-impulso)', background: 'rgba(254,153,50,0.12)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }"
                >{{ err }}</span>
              </div>
            </div>
          </div>
      </div>

      <!-- ── PASO 3: Codeudores ─────────────────────── -->
      <div v-if="paso === 3" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2xl)' }">

        <!-- Card selección -->
        <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
          <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
            <IconUsers :size="20" /> ¿Desea agregar codeudores?
          </div>
          <div :style="{ padding: 'var(--sp-xl)' }">
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 'var(--sp-md)' }">
              <div
                v-for="opcion in [{ num: 0, titulo: 'Sin codeudor', desc: 'Continúa sin agregar codeudor' }, { num: 1, titulo: '1 Codeudor', desc: 'Agrega un codeudor a la solicitud' }, { num: 2, titulo: '2 Codeudores', desc: 'Agrega dos codeudores a la solicitud' }]"
                :key="opcion.num"
                :style="{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-sm)',
                  padding: 'var(--sp-xl)', borderRadius: 'var(--r-md)', textAlign: 'center',
                  border: '1px solid var(--color-border)',
                  boxShadow: numCodudores === opcion.num ? 'var(--shadow-card)' : 'none',
                  background: numCodudores === opcion.num ? 'var(--color-bg-card)' : 'var(--color-bg-surface)',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                }"
                @click="numCodudores = opcion.num"
              >
                <IconUsers :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
                <div :style="{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-base)', color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-1)' }">{{ opcion.titulo }}</div>
                <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">{{ opcion.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs codeudores (solo cuando hay 2) -->
        <div v-if="numCodudores === 2" :style="{ display: 'flex', borderBottom: '2px solid var(--color-border)' }">
          <button
            v-for="tab in [1, 2]"
            :key="tab"
            :style="{
              padding: 'var(--sp-sm) var(--sp-xl)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--fw-bold)',
              color: tabCodudorActivo === tab ? 'var(--color-primary)' : 'var(--color-text-3)',
              borderBottom: tabCodudorActivo === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all var(--transition-fast)',
            }"
            @click="tabCodudorActivo = tab"
          >Codeudor {{ tab }}</button>
        </div>

        <!-- Formulario codeudor 1 -->
        <template v-if="numCodudores >= 1 && (numCodudores < 2 || tabCodudorActivo === 1)">
          <!-- Información del codeudor 1 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUserCheck :size="20" /> Información del codeudor 1
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPersona
                :model-value="personaCod1"
                titulo=""
                :es-codeudor="true"
                :show-nivel-educativo="true"
                :direccion-estructurada="direccionEstructuradaCod1"
                :ubicacion="ubicacionCod1"
                @update:model-value="personaCod1 = $event"
                @update:direccion-estructurada="direccionEstructuradaCod1 = $event"
                @update:ubicacion="ubicacionCod1 = $event"
              />
            </div>
          </div>
          <!-- Laboral codeudor 1 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconRotate :size="20" /> Información laboral — Codeudor 1
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <SelectorTipoTrabajador :model-value="laboralCod1.tipo_trabajador_codeudor" @update:model-value="actualizarLaboralCod1('tipo_trabajador_codeudor', $event)" />
              <div v-if="laboralCod1.tipo_trabajador_codeudor" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <!-- Empleado -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod1.nombre_empresa_codeudor" label="Nombre de la empresa" required solo-texto-laboral @update:model-value="actualizarLaboralCod1('nombre_empresa_codeudor', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboralCod1.cargo_oficio_codeudor" label="Cargo u oficio" required solo-texto-laboral @update:model-value="actualizarLaboralCod1('cargo_oficio_codeudor', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod1.tipo_contrato_codeudor" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod1('tipo_contrato_codeudor', $event)" />
                    <SelectorFecha :model-value="laboralCod1.fecha_ingreso_codeudor" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod1('fecha_ingreso_codeudor', $event)" />
                  </div>
                </template>
                <!-- Independiente -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod1.actividad_comercial_codeudor" label="Actividad comercial" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboralCod1('actividad_comercial_codeudor', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboralCod1.fecha_inicio_actividad_codeudor" label="Fecha de inicio" required @update:model-value="actualizarLaboralCod1('fecha_inicio_actividad_codeudor', $event)" />
                    <CampoTexto :model-value="laboralCod1.ocupacion_codeudor" label="Ocupación" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboralCod1('ocupacion_codeudor', $event ? $event.toUpperCase() : $event)" />
                  </div>
                </template>
                <!-- Pensionado -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'pensionado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod1.entidad_pagadora_codeudor" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" @update:model-value="actualizarLaboralCod1('entidad_pagadora_codeudor', $event)" />
                  </div>
                </template>
                <!-- Estudiante -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'estudiante'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod1.institucion_educativa_codeudor" label="Institución educativa" required @update:model-value="actualizarLaboralCod1('institucion_educativa_codeudor', $event ? $event.toUpperCase() : $event)" />
                    <CampoSelectBuscable :model-value="laboralCod1.nivel_estudio_actual_codeudor" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod1('nivel_estudio_actual_codeudor', $event)" />
                  </div>
                </template>
                <!-- Cuidado del hogar -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'cuidado_hogar'">
                  <div />
                </template>
              </div>
            </div>
          </div>
          <!-- Financiera codeudor 1 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileDescription :size="20" /> Información financiera — Codeudor 1
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionFinanciera :model-value="financieraCod1" titulo="" :tipo-trabajador="laboralCod1.tipo_trabajador_codeudor" @update:model-value="financieraCod1 = $event" />
            </div>
          </div>
          <!-- Patrimonio codeudor 1 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFile :size="20" /> Patrimonio — Codeudor 1
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPatrimonio :model-value="patrimonioCod1" titulo="" @update:model-value="patrimonioCod1 = $event" />
            </div>
          </div>
        </template>

        <!-- Formulario codeudor 2 -->
        <template v-if="numCodudores >= 2 && tabCodudorActivo === 2">
          <!-- Información del codeudor 2 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUserCheck :size="20" /> Información del codeudor 2
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPersona
                :model-value="personaCod2"
                titulo=""
                :es-codeudor="true"
                :show-nivel-educativo="true"
                :direccion-estructurada="direccionEstructuradaCod2"
                :ubicacion="ubicacionCod2"
                @update:model-value="personaCod2 = $event"
                @update:direccion-estructurada="direccionEstructuradaCod2 = $event"
                @update:ubicacion="ubicacionCod2 = $event"
              />
            </div>
          </div>
          <!-- Laboral codeudor 2 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconRotate :size="20" /> Información laboral — Codeudor 2
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <SelectorTipoTrabajador :model-value="laboralCod2.tipo_trabajador_codeudor2" @update:model-value="actualizarLaboralCod2('tipo_trabajador_codeudor2', $event)" />
              <div v-if="laboralCod2.tipo_trabajador_codeudor2" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <!-- Empleado -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod2.nombre_empresa_codeudor2" label="Nombre de la empresa" required solo-texto-laboral @update:model-value="actualizarLaboralCod2('nombre_empresa_codeudor2', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboralCod2.cargo_oficio_codeudor2" label="Cargo u oficio" required solo-texto-laboral @update:model-value="actualizarLaboralCod2('cargo_oficio_codeudor2', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod2.tipo_contrato_codeudor2" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod2('tipo_contrato_codeudor2', $event)" />
                    <SelectorFecha :model-value="laboralCod2.fecha_ingreso_codeudor2" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod2('fecha_ingreso_codeudor2', $event)" />
                  </div>
                </template>
                <!-- Independiente -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod2.actividad_comercial_codeudor2" label="Actividad comercial" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboralCod2('actividad_comercial_codeudor2', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboralCod2.fecha_inicio_actividad_codeudor2" label="Fecha de inicio" required @update:model-value="actualizarLaboralCod2('fecha_inicio_actividad_codeudor2', $event)" />
                    <CampoTexto :model-value="laboralCod2.ocupacion_codeudor2" label="Ocupación" required solo-texto-laboral :maxlength="50" @update:model-value="actualizarLaboralCod2('ocupacion_codeudor2', $event ? $event.toUpperCase() : $event)" />
                  </div>
                </template>
                <!-- Pensionado -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'pensionado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod2.entidad_pagadora_codeudor2" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" @update:model-value="actualizarLaboralCod2('entidad_pagadora_codeudor2', $event)" />
                  </div>
                </template>
                <!-- Estudiante -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'estudiante'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod2.institucion_educativa_codeudor2" label="Institución educativa" required @update:model-value="actualizarLaboralCod2('institucion_educativa_codeudor2', $event ? $event.toUpperCase() : $event)" />
                    <CampoSelectBuscable :model-value="laboralCod2.nivel_estudio_actual_codeudor2" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod2('nivel_estudio_actual_codeudor2', $event)" />
                  </div>
                </template>
                <!-- Cuidado del hogar -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'cuidado_hogar'">
                  <div />
                </template>
              </div>
            </div>
          </div>
          <!-- Financiera codeudor 2 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileDescription :size="20" /> Información financiera — Codeudor 2
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionFinanciera :model-value="financieraCod2" titulo="" :tipo-trabajador="laboralCod2.tipo_trabajador_codeudor2" @update:model-value="financieraCod2 = $event" />
            </div>
          </div>
          <!-- Patrimonio codeudor 2 -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFile :size="20" /> Patrimonio — Codeudor 2
            </div>
            <div :style="{ padding: 'var(--sp-xl)' }">
              <SeccionPatrimonio :model-value="patrimonioCod2" titulo="" @update:model-value="patrimonioCod2 = $event" />
            </div>
          </div>
        </template>

        <!-- ── Alertas de datos duplicados ──────────────── -->
        <div v-if="erroresDuplicidadCod1.length > 0 || erroresDuplicidadCod2.length > 0" :style="{
          borderRadius: 'var(--r-md)', padding: 'var(--sp-md) var(--sp-lg)',
          background: 'var(--color-error-bg)', border: '1px solid var(--color-error)',
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)',
        }">
          <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-error-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-xs)' }">
            <IconAlertTriangle :size="16" /> Datos duplicados — corrija antes de continuar
          </div>
          <div
            v-for="err in [...erroresDuplicidadCod1, ...erroresDuplicidadCod2]"
            :key="err"
            :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-error-text)', fontWeight: 'var(--fw-medium)' }"
          >• {{ err }}</div>
        </div>

      </div>

      <!-- ── PASO 4: Documentos ────────── -->
      <div v-if="paso === 4" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2xl)' }">

        <!-- Cargue de documentos -->
        <div id="seccion-documentos" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
          <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
            <IconUpload :size="20" /> Cargue de documentos
          </div>
          <div :style="{ padding: 'var(--sp-xl)' }">
            <SeccionDocumentos
              :model-value="documentos"
              :tipo-trabajador="laboral.tipo_trabajador"
              :modalidad-credito="general.modalidad_credito"
              :solicitud-id="solicitudId"
              :num-codeudores="numCodudores"
              :laboral-cod1="laboralCod1"
              :laboral-cod2="laboralCod2"
              titulo=""
              @update:model-value="actualizarDocumentos($event)"
              @sesion-creada="onSesionCapturaCreada"
            />
          </div>
        </div>

        <!-- Autorizaciones legales -->
        <div id="seccion-autorizaciones" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
          <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-md)' }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }">
              <IconShieldCheck :size="20" /> Autorizaciones
            </div>
            <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: 'var(--r-pill)', background: autorizaciones.autorizacion_aceptada ? 'white' : 'rgba(255, 255, 255, 0.15)', border: autorizaciones.autorizacion_aceptada ? '1px solid white' : 'none' }">
              <IconCircleCheck v-if="autorizaciones.autorizacion_aceptada" :size="14" :style="{ color: 'var(--color-success)' }" />
              <span :style="{ fontSize: '10px', fontWeight: 'var(--fw-extrabold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: autorizaciones.autorizacion_aceptada ? 'var(--color-success)' : 'white' }">{{ autorizaciones.autorizacion_aceptada ? 'Aceptadas' : 'Pendiente' }}</span>
            </div>
          </div>
          <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div>
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)' }">Autorizaciones y declaraciones</div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: '1.5' }">Es indispensable que lea y otorgue su consentimiento sobre las declaraciones legales y políticas de tratamiento de datos requeridas para dar trámite a su solicitud de crédito.</div>
            </div>
            <PortalButton variant="primary" :full="true" @click="modalAutorizacionesVisible = true">Revisar contenido...</PortalButton>
          </div>
        </div>

        <ModalAutorizaciones v-model:visible="modalAutorizacionesVisible" :aceptado="autorizaciones.autorizacion_aceptada" @aceptar="autorizaciones.autorizacion_aceptada = true" @rechazar="autorizaciones.autorizacion_aceptada = false" />

        <!-- Acompañamiento de asesor -->
        <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
          <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
            <IconUserCheck :size="20" /> Acompañamiento de asesor
          </div>
          <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : (asesoria.tuvo_asesoria === true ? '1fr 70px 70px 140px' : '1fr 70px 70px'), 
              gap: 'var(--sp-md)', 
              alignItems: 'center' 
            }">
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)' }">
                ¿Tuvo acompañamiento de un asesor para diligenciar la solicitud? *
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="asesoria.tuvo_asesoria === true"
                  label="Sí"
                  @update:model-value="(v) => { asesoria.tuvo_asesoria = v ? true : null; if (!v) asesoria.codigo_asesor = '' }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="asesoria.tuvo_asesoria === false"
                  label="No"
                  @update:model-value="(v) => { asesoria.tuvo_asesoria = v ? false : null; if (v) asesoria.codigo_asesor = '' }"
                />
              </div>
              <div v-if="asesoria.tuvo_asesoria === true" :style="{ minWidth: '0' }">
                <CampoTexto
                  v-model="asesoria.codigo_asesor"
                  label="Código del asesor"
                  placeholder="00000"
                  required
                  solo-numeros
                  :maxlength="5"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── PASO 5: Revisión y firma ─────────────────── -->
      <div v-if="paso === 5" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

          <div :style="{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
            <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)' }">
              Revise su solicitud antes de firmar
            </div>

          </div>

          <!-- ── Banner de campos faltantes ────────────────────────── -->
          <div v-if="!pasoSolicitudValido" :style="{ borderRadius: 'var(--r-md)', padding: 'var(--sp-md) var(--sp-lg)', background: '#fff8f0', display: 'flex', gap: 'var(--sp-md)' }">
            <IconAlertTriangle :size="20" style="color: var(--color-impulso); flex-shrink: 0; margin-top: 2px;" />
            <div>
              <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-impulso)', marginBottom: 'var(--sp-xs)' }">
                Faltan {{ erroresCampos.length }} campo{{ erroresCampos.length > 1 ? 's' : '' }} obligatorios por completar:
              </div>
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xs)' }">
                <span
                  v-for="err in erroresCampos"
                  :key="err"
                  :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-impulso)', background: 'rgba(254,153,50,0.12)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }"
                >{{ err }}</span>
              </div>
            </div>
          </div>

          <!-- 1. Información de la solicitud -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileDescription :size="20" /> Información de la solicitud
            </div>
            <div :style="{ padding: 'var(--sp-md) var(--sp-lg)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 'var(--sp-md)' }">
              <div>
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Modalidad</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_MODALIDAD, general.modalidad_credito) }}</div>
              </div>
              <div v-if="mostrarTipoOperacion">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Operación</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_OP, general.tipo_operacion) }}</div>
              </div>
              <div v-if="mostrarValorCredito">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Valor del crédito</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '800', color: 'var(--color-primary)' }">{{ formatMonto(general.valor_credito) }}</div>
              </div>
              <div v-if="mostrarValorReestructura">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Valor reestructura</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '800', color: 'var(--color-primary)' }">{{ formatMonto(general.valor_reestructura) }}</div>
              </div>
              <div v-if="mostrarValorDesembolso">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Desembolso adicional</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '800', color: 'var(--color-primary)' }">{{ formatMonto(general.valor_desembolso) }}</div>
              </div>
              <div>
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Plazo</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.plazo_solicitado }} meses</div>
              </div>
              <div v-if="esEducativo" :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Programa académico</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.denominacion_carrera }} ({{ label(LABEL_TIPO_ESTUDIO, general.tipo_estudio) }})</div>
                <div :style="{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--color-text-2)', marginTop: '2px' }">{{ general.institucion || '—' }}</div>
              </div>
              <div v-else :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Destino</div>
                <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.destino_credito }}</div>
              </div>
            </div>
          </div>

          <!-- 2. Información personal del titular -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUser :size="20" /> Información personal
            </div>
            <div :style="{ padding: 'var(--sp-lg)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nombre completo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.nombres }} {{ persona.apellidos }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, persona.tipo_documento) }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Número de documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.numero_identificacion }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fecha expedición</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(persona.fecha_expedicion_documento) }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nacimiento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(persona.fecha_nacimiento) }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Celular</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.celular }}</div>
                </div>
                <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Correo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.correo_electronico }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, persona.nivel_educativo_solicitante) }}</div>
                </div>
                <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Dirección</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.direccion_residencia }}</div>
                </div>
              </div>
            </div>
          </div>

          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconRotate :size="20" /> Situación laboral
            </div>
            <div :style="{ padding: 'var(--sp-lg)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo trabajador</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_TRABAJADOR, laboral.tipo_trabajador) }}</div>
                </div>
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Empresa</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.nombre_empresa || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.cargo_oficio || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo de contrato</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CONTRATO, laboral.tipo_contrato) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fecha de ingreso</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboral.fecha_ingreso) || '—' }}</div>
                  </div>
                </template>
                <template v-if="laboral.tipo_trabajador === 'independiente'">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Actividad comercial</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.actividad_comercial || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Inicio actividad</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboral.fecha_inicio_actividad) || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ocupación</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.ocupacion || '—' }}</div>
                  </div>
                </template>
                <template v-if="laboral.tipo_trabajador === 'pensionado'">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Entidad pagadora</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.entidad_pagadora || '—' }}</div>
                  </div>
                </template>
                <template v-if="laboral.tipo_trabajador === 'estudiante'">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Institución educativa</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.institucion_educativa || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, laboral.nivel_educativo) || '—' }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileDescription :size="20" /> Información financiera
            </div>
            <div :style="{ padding: 'var(--sp-lg)' }">
              <template v-if="!laboral.tipo_trabajador || laboral.tipo_trabajador === 'empleado'">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Salario / Ingresos fijos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.salario_ingresos_fijos) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.ingresos_independiente) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.gastos_familiares) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.otros_gastos) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.obligaciones_financieras) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.numero_dependientes || '—' }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="laboral.tipo_trabajador === 'independiente'">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.ingresos_independiente) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.gastos_familiares) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.otros_gastos) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.obligaciones_financieras) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.numero_dependientes || '—' }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="laboral.tipo_trabajador === 'pensionado'">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Mesada pensional</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.mesada_pensional) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.numero_dependientes || '—' }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="['estudiante', 'cuidado_hogar'].includes(laboral.tipo_trabajador)">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos mensuales</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.salario_ingresos_fijos) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fuente de ingresos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.fuente_ingresos || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.numero_dependientes || '—' }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFile :size="20" /> Patrimonio
            </div>
            <div :style="{ padding: 'var(--sp-lg)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Propiedad raíz</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonio.tiene_propiedad_raiz ? 'Sí (' + formatMonto(patrimonio.valor_propiedad_raiz) + ')' : 'No' }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Vehículo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonio.tiene_vehiculo ? 'Sí (' + formatMonto(patrimonio.valor_vehiculo) + ')' : 'No' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!esEducativo && mostrarCuentaDesembolso" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileCheck :size="20" /> Cuenta para desembolso
            </div>
            <div :style="{ padding: 'var(--sp-lg)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Entidad bancaria</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ cuenta.entidad_bancaria === 'otro' ? cuenta.entidad_bancaria_otro : (cuenta.entidad_bancaria || '—') }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo de cuenta</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CUENTA, cuenta.tipo_cuenta) }}</div>
                </div>
                <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Número de cuenta</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ cuenta.numero_cuenta || '—' }}</div>
                </div>
                <template v-if="cuenta.cuenta_tercero">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Titular de la cuenta (tercero)</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ cuenta.nombre_tercero || '—' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo doc. tercero</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, cuenta.tipo_doc_tercero) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">N.° doc. tercero</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ cuenta.numero_doc_tercero || '—' }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div v-if="esEducativo" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-md)' }">
              <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }">
                <IconFileCheck :size="20" /> Autorización de desembolso directo
              </div>
              <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: 'var(--r-pill)', background: autorizaciones.autorizacion_desembolso_directo_educativo ? 'white' : 'rgba(255, 255, 255, 0.15)', border: autorizaciones.autorizacion_desembolso_directo_educativo ? '1px solid white' : 'none' }">
                <IconCircleCheck v-if="autorizaciones.autorizacion_desembolso_directo_educativo" :size="14" :style="{ color: 'var(--color-success)' }" />
                <span :style="{ fontSize: '10px', fontWeight: 'var(--fw-extrabold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: autorizaciones.autorizacion_desembolso_directo_educativo ? 'var(--color-success)' : 'white' }">{{ autorizaciones.autorizacion_desembolso_directo_educativo ? 'Aceptada' : 'Pendiente' }}</span>
              </div>
            </div>
            <div :style="{ padding: 'var(--sp-lg) calc(var(--sp-xl) + 6px)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
              <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-regular)', color: 'var(--color-text-2)', lineHeight: '1.7', textAlign: 'justify' }">
                Señores
                <br />
                <span :style="{ fontWeight: 'var(--fw-bold)' }">COOPERATIVA MULTIACTIVA LUIS AMIGÓ</span>
                <br /><br />
                Yo, <span :style="{ fontWeight: 'var(--fw-semibold)' }">{{ (persona.nombres + ' ' + persona.apellidos).trim() || '—' }}</span>,
                identificado(a) con la cédula de ciudadanía No. <span :style="{ fontWeight: 'var(--fw-semibold)' }">{{ persona.numero_identificacion || '—' }}</span>,
                en mi calidad de asociado(a) y como titular del crédito bajo la línea <span :style="{ fontWeight: 'var(--fw-semibold)' }">CRÉDITO EDUCATIVO</span>
                otorgado para estudios en la <span :style="{ fontWeight: 'var(--fw-semibold)' }">UNIVERSIDAD CATÓLICA LUIS AMIGÓ</span>,
                autorizo de manera expresa a la Cooperativa para que efectúe directamente a la institución el pago de la matrícula a nombre del/la señor(a)
                <span :style="{ fontWeight: 'var(--fw-semibold)' }">{{ general.beneficiario_nombre || '—' }}</span>,
                para {{ general.tipo_estudio === 'pregrado' ? 'pregrado' : 'posgrado' }}
                en el programa de <span :style="{ fontWeight: 'var(--fw-semibold)' }">{{ general.denominacion_carrera || '—' }}</span>,
                por un valor total de <span :style="{ fontWeight: 'var(--fw-semibold)' }">{{ formatMonto(general.valor_credito) }}</span>
                según consta en la liquidación de matrícula anexa.
              </div>
            </div>
          </div>

          <!-- 3. Codeudores (si existen) -->
          <template v-if="numCodudores > 0">

            <!-- Codeudor 1 -->
            <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
              <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
                <IconUserCheck :size="20" /> Codeudor 1
              </div>
              <div :style="{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

                <!-- Datos personales cod1 -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nombre completo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod1.nombres_codeudor }} {{ personaCod1.apellidos_codeudor }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo documento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, personaCod1.tipo_documento_codeudor) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">N.° documento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod1.numero_identificacion_codeudor }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">F. expedición</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(personaCod1.fecha_expedicion_documento_codeudor) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">F. nacimiento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(personaCod1.fecha_nacimiento_codeudor) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Celular</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod1.celular_codeudor }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Correo electrónico</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod1.correo_electronico_codeudor }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, personaCod1.nivel_educativo_codeudor) }}</div>
                  </div>
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Dirección</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod1.direccion_residencia_codeudor }} {{ personaCod1.barrio_codeudor ? '— Barrio: ' + personaCod1.barrio_codeudor : '' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ciudad</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ ubicacionCod1.municipio_nombre }}, {{ ubicacionCod1.depto_nombre }}</div>
                  </div>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Situación laboral</div>

                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo trabajador</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_TRABAJADOR, laboralCod1.tipo_trabajador_codeudor) }}</div>
                  </div>
                  <template v-if="laboralCod1.tipo_trabajador_codeudor === 'empleado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Empresa</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.nombre_empresa_codeudor || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.cargo_oficio_codeudor || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo de contrato</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CONTRATO, laboralCod1.tipo_contrato_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fecha de ingreso</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboralCod1.fecha_ingreso_codeudor) || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Actividad comercial</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.actividad_comercial_codeudor || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Inicio actividad</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboralCod1.fecha_inicio_actividad_codeudor) || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ocupación</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.ocupacion_codeudor || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod1.tipo_trabajador_codeudor === 'pensionado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Entidad pagadora</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.entidad_pagadora_codeudor || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod1.tipo_trabajador_codeudor === 'estudiante'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Institución educativa</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod1.institucion_educativa_codeudor || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, laboralCod1.nivel_estudio_actual_codeudor) || '—' }}</div>
                    </div>
                  </template>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Información financiera</div>

              <!-- Empleado (o sin tipo) -->
                <template v-if="!laboralCod1.tipo_trabajador_codeudor || laboralCod1.tipo_trabajador_codeudor === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Salario / Ingresos fijos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.salario_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.ingresos_independiente_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.gastos_familiares_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.otros_gastos_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.obligaciones_financieras_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod1.numero_dependientes_codeudor || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Independiente -->
                <template v-else-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.ingresos_independiente_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.gastos_familiares_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.otros_gastos_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.obligaciones_financieras_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod1.numero_dependientes_codeudor || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Pensionado -->
                <template v-else-if="laboralCod1.tipo_trabajador_codeudor === 'pensionado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Mesada pensional</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.mesada_pensional_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod1.numero_dependientes_codeudor || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Estudiante / Cuidado del hogar -->
                <template v-else-if="['estudiante', 'cuidado_hogar'].includes(laboralCod1.tipo_trabajador_codeudor)">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos mensuales</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod1.salario_codeudor) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fuente de ingresos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod1.fuente_ingresos_codeudor || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod1.numero_dependientes_codeudor || '—' }}</div>
                    </div>
                  </div>
                </template>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Patrimonio</div>

                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Propiedad raíz</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonioCod1.tiene_propiedad_raiz_codeudor ? 'Sí (' + formatMonto(patrimonioCod1.valor_propiedad_raiz_codeudor) + ')' : 'No' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Vehículo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonioCod1.tiene_vehiculo_codeudor ? 'Sí (' + formatMonto(patrimonioCod1.valor_vehiculo_codeudor) + ')' : 'No' }}</div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Codeudor 2 -->
            <div v-if="numCodudores >= 2" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
              <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
                <IconUserCheck :size="20" /> Codeudor 2
              </div>
              <div :style="{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

                <!-- Datos personales cod2 -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nombre completo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod2.nombres_codeudor2 }} {{ personaCod2.apellidos_codeudor2 }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo documento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, personaCod2.tipo_documento_codeudor2) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">N.° documento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod2.numero_identificacion_codeudor2 }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">F. expedición</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(personaCod2.fecha_expedicion_documento_codeudor2) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">F. nacimiento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(personaCod2.fecha_nacimiento_codeudor2) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Celular</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod2.celular_codeudor2 }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Correo electrónico</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod2.correo_electronico_codeudor2 }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, personaCod2.nivel_educativo_codeudor2) }}</div>
                  </div>
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Dirección</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ personaCod2.direccion_residencia_codeudor2 }} {{ personaCod2.barrio_codeudor2 ? '— Barrio: ' + personaCod2.barrio_codeudor2 : '' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ciudad</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ ubicacionCod2.municipio_nombre }}, {{ ubicacionCod2.depto_nombre }}</div>
                  </div>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Situación laboral</div>

                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo trabajador</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_TRABAJADOR, laboralCod2.tipo_trabajador_codeudor2) }}</div>
                  </div>
                  <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'empleado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Empresa</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.nombre_empresa_codeudor2 || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.cargo_oficio_codeudor2 || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo de contrato</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CONTRATO, laboralCod2.tipo_contrato_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fecha de ingreso</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboralCod2.fecha_ingreso_codeudor2) || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Actividad comercial</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.actividad_comercial_codeudor2 || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Inicio actividad</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboralCod2.fecha_inicio_actividad_codeudor2) || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ocupación</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.ocupacion_codeudor2 || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'pensionado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Entidad pagadora</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.entidad_pagadora_codeudor2 || '—' }}</div>
                    </div>
                  </template>
                  <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'estudiante'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Institución educativa</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboralCod2.institucion_educativa_codeudor2 || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel educativo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, laboralCod2.nivel_estudio_actual_codeudor2) || '—' }}</div>
                    </div>
                  </template>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Información financiera</div>

              <!-- Empleado (o sin tipo) -->
                <template v-if="!laboralCod2.tipo_trabajador_codeudor2 || laboralCod2.tipo_trabajador_codeudor2 === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Salario / Ingresos fijos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.salario_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.ingresos_independiente_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.gastos_familiares_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.otros_gastos_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.obligaciones_financieras_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod2.numero_dependientes_codeudor2 || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Independiente -->
                <template v-else-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos independiente</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.ingresos_independiente_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos familiares</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.gastos_familiares_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros gastos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.otros_gastos_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones financieras</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.obligaciones_financieras_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod2.numero_dependientes_codeudor2 || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Pensionado -->
                <template v-else-if="laboralCod2.tipo_trabajador_codeudor2 === 'pensionado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Mesada pensional</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.mesada_pensional_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod2.numero_dependientes_codeudor2 || '—' }}</div>
                    </div>
                  </div>
                </template>
                <!-- Estudiante / Cuidado del hogar -->
                <template v-else-if="['estudiante', 'cuidado_hogar'].includes(laboralCod2.tipo_trabajador_codeudor2)">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos mensuales</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financieraCod2.salario_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Fuente de ingresos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod2.fuente_ingresos_codeudor2 || '—' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Personas a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financieraCod2.numero_dependientes_codeudor2 || '—' }}</div>
                    </div>
                  </div>
                </template>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Patrimonio</div>

                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Propiedad raíz</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonioCod2.tiene_propiedad_raiz_codeudor2 ? 'Sí (' + formatMonto(patrimonioCod2.valor_propiedad_raiz_codeudor2) + ')' : 'No' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Vehículo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonioCod2.tiene_vehiculo_codeudor2 ? 'Sí (' + formatMonto(patrimonioCod2.valor_vehiculo_codeudor2) + ')' : 'No' }}</div>
                  </div>
                </div>

              </div>
            </div>

          </template>

          <!-- 4. Documentos adjuntos — checklist -->
          <div :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUpload :size="20" /> Documentos adjuntos
            </div>
            <div :style="{ padding: 'var(--sp-md) var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
              <div
                v-for="doc in docResumen"
                :key="doc.label"
                :style="{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                  padding: 'var(--sp-sm) var(--sp-md)',
                  borderRadius: 'var(--r-md)',
                  background: doc.url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
                  cursor: doc.url ? 'pointer' : 'default',
                }"
                @click="doc.url ? (modalPreviewDocUrl = doc.url, modalPreviewDocTitulo = doc.label, modalPreviewDocVisible = true) : null"
              >
                <IconCircleCheck v-if="doc.url" :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                <IconX v-else :size="16" :style="{ color: 'var(--color-error)', flexShrink: '0' }" />
                <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: doc.url ? 'var(--color-success-text)' : 'var(--color-text-3)', flex: '1' }">{{ doc.label }}</span>
                <span v-if="!doc.url" :style="{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', textTransform: 'uppercase' }">Pendiente</span>
              </div>
            </div>
          </div>

          <!-- 5. Firma electrónica de la solicitud -->
          <div :style="{ borderRadius: 'var(--r-lg)', border: '2px solid var(--color-primary)', overflow: 'hidden' }">
            <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconShieldCheck :size="18" style="color: white;" />
              <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'white' }">Firma electrónica de la solicitud</span>
            </div>
            <div :style="{ padding: 'var(--sp-xl)', background: 'white', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">

              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: '1.65', background: 'var(--color-bg-surface)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)', border: '1px solid var(--color-border-light)' }">
                Al firmar, certifica que la información proporcionada es veraz y autoriza a <strong>Cooperamigó</strong> para realizar las validaciones correspondientes.
                <template v-if="numCodudores > 0"> Una vez firmada, se notificará automáticamente a {{ numCodudores === 1 ? 'el codeudor' : 'los codeudores' }} para completar el proceso.</template>
              </div>

              <CampoTexto
                label="Nombre completo del solicitante"
                placeholder="TAL CUAL APARECE EN SU CÉDULA"
                :model-value="firma.nombre_firma"
                @update:model-value="firma.nombre_firma = $event"
              />

              <div :style="{ display: 'flex', gap: '6px', flexWrap: 'wrap' }">
                <button type="button" @click="firmaMetodo = 'dibujar'" :style="{ padding: '6px 10px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (firmaMetodo === 'dibujar' ? 'var(--color-primary)' : 'var(--color-border)'), background: firmaMetodo === 'dibujar' ? 'rgba(17,76,90,0.08)' : 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: firmaMetodo === 'dibujar' ? 'var(--color-primary)' : 'var(--color-text-2)' }">Firmar en pantalla</button>
                <button type="button" @click="firmaMetodo = 'subir'" :style="{ padding: '6px 10px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (firmaMetodo === 'subir' ? 'var(--color-primary)' : 'var(--color-border)'), background: firmaMetodo === 'subir' ? 'rgba(17,76,90,0.08)' : 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: firmaMetodo === 'subir' ? 'var(--color-primary)' : 'var(--color-text-2)' }">Cargar firma</button>
              </div>

              <div v-if="firmaMetodo === 'dibujar'" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ border: '1px solid var(--color-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'white' }">
                  <canvas
                    ref="firmaCanvasRef"
                    width="720"
                    height="220"
                    :style="{ width: '100%', height: '140px', touchAction: 'none', display: 'block', cursor: 'crosshair' }"
                    @mousedown="iniciarFirmaDibujo"
                    @mousemove="moverFirmaDibujo"
                    @mouseup="terminarFirmaDibujo"
                    @mouseleave="terminarFirmaDibujo"
                    @touchstart.prevent="iniciarFirmaDibujo"
                    @touchmove.prevent="moverFirmaDibujo"
                    @touchend="terminarFirmaDibujo"
                  />
                </div>
                <div :style="{ display: 'flex', justifyContent: 'flex-end' }">
                  <PortalButton variant="secondary" @click="limpiarFirmaDibujo()">Limpiar</PortalButton>
                </div>
              </div>

              <div v-if="firmaMetodo === 'subir'" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ border: '1px dashed var(--color-border)', borderRadius: 'var(--r-md)', padding: '10px 12px', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
                  <div :style="{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Archivo de firma</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: firmaArchivoNombre ? 'var(--color-text-1)' : 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '100%' : '340px' }">
                      {{ firmaArchivoNombre || 'Cargue un archivo .png o .jpg con fondo preferiblemente blanco' }}
                    </div>
                  </div>
                  <PortalButton variant="secondary" @click="seleccionarFirmaArchivo()">Seleccionar archivo</PortalButton>
                  <input ref="firmaFileRef" type="file" accept="image/png,image/jpeg" :style="{ display: 'none' }" @change="cargarFirmaImagen" />
                </div>
                <div v-if="firmaImagen" :style="{ border: '1px solid var(--color-border)', borderRadius: 'var(--r-md)', padding: '10px', background: 'white', display: 'flex', flexDirection: 'column', gap: '6px' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Previsualización</div>
                  <img :src="firmaImagen" alt="Previsualización de firma" :style="{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }" />
                </div>
              </div>

              <div v-if="firmaSolicitanteAplicada" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-md)', borderRadius: 'var(--r-md)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }">
                <IconCircleCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-success-text)' }">Firma registrada el {{ formatearFecha(firma.firma_fecha_iso) }}</span>
              </div>

              <PortalButton
                variant="primary"
                :full="true"
                :loading="loading"
                :disabled="!firma.nombre_firma || !firmaImagen || !pasoSolicitudValido"
                @click="firmarYEnviar()"
              >
                <IconShieldCheck :size="16" style="display:inline-block;vertical-align:middle;margin-right:6px;" />
                Firmar solicitud y enviar
              </PortalButton>
            </div>
          </div>
        </div>

      <!-- Navegación -->
      <div :style="{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-2xl)', gap: 'var(--sp-md)' }">
        <PortalButton variant="secondary" @click="paso === 1 ? router.push('/') : anterior()">{{ paso === 1 ? 'Cancelar' : 'Anterior' }}</PortalButton>
        <PortalButton v-if="!esUltimoPaso && paso !== 1" variant="primary" :loading="loading" :disabled="paso === 4 && !autorizaciones.autorizacion_aceptada" @click="continuar()">Continuar</PortalButton>
      </div>
    </div>

    <!-- Modal Asociado no encontrado -->
    <Teleport to="body">
      <div v-if="modalPreviewDocVisible" :style="{ position: 'fixed', inset: '0', zIndex: '120', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(980px, 96vw)', height: 'min(86vh, 920px)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-sm) var(--sp-md)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ modalPreviewDocTitulo }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarPreviewDoc">
              <IconX :size="18" />
            </button>
          </div>
          <iframe :src="modalPreviewDocUrl" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>

      <Transition :name="isMobile ? 'sheet-modal' : 'fade-modal'">
        <div
          v-if="mostrarModalNoAsociado"
          :style="{
            position: 'fixed', inset: '0', zIndex: '100',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : 'var(--sp-lg)',
          }"
        >
          <div :style="{
            position: 'absolute', inset: '0',
            background: 'rgba(23,43,54,0.5)',
            backdropFilter: 'blur(3px)',
          }" @click="mostrarModalNoAsociado = false" />

          <div :style="{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : '520px',
            background: 'var(--color-bg-card)',
            borderRadius: isMobile ? 'var(--r-md) var(--r-md) 0 0' : 'var(--r-md)',
            boxShadow: 'var(--shadow-modal)',
            padding: isMobile ? 'var(--sp-md) var(--sp-lg) var(--sp-2xl)' : 'var(--sp-2xl)',
          }">
            <div v-if="isMobile" :style="{
              width: '40px', height: '4px', borderRadius: 'var(--r-pill)',
              background: 'var(--color-border)', margin: '0 auto var(--sp-lg)',
            }" />

            <div :style="{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-lg)',
            }">
              <IconUserX :size="30" :style="{ color: 'var(--color-primary)' }" />
            </div>

            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--fw-extrabold)',
                color: 'var(--color-text-1)',
                marginBottom: 'var(--sp-sm)',
              }">¡Documento no encontrado!</div>
              <div :style="{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-2)',
                fontWeight: 'var(--fw-regular)',
                lineHeight: '1.6',
              }">
                El documento <strong :style="{ color: 'var(--color-text-1)' }">{{ verificacion.numero_documento || '—' }}</strong> no fue encontrado en nuestra base de datos.
                Para acceder a los servicios de Cooperamigo, debes estar afiliado como asociado activo.
              </div>
            </div>

            <div :style="{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
              gap: 'var(--sp-sm)',
            }">
              <PortalButton variant="secondary" :full="isMobile" @click="mostrarModalNoAsociado = false">
                Volver
              </PortalButton>
              <PortalButton variant="primary" :full="isMobile" @click="router.push('/solicitud-afiliacion')">
                Iniciar afiliación
              </PortalButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
