<script setup>
import { ref, computed, watch, nextTick } from 'vue'

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
import { subirDocumentoSolicitud }  from '@/services/documentos.service'

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

function _nombreCorto(nombre) {
  if (!nombre) return ''
  return nombre.length > 28 ? nombre.substring(0, 25) + '...' : nombre
}

async function _subirDocTercero(archivo, tipo, estado, campo) {
  if (!solicitudId.value) return
  estado.cargando = true
  estado.error    = null
  try {
    const url = await subirDocumentoSolicitud(solicitudId.value, tipo, archivo)
    estado.url    = url
    estado.nombre = archivo.name
    documentos.value[campo] = url
  } catch (err) {
    console.error(`[_subirDocTercero] Error subiendo ${tipo}:`, err)
    estado.error = 'No se pudo subir el archivo. Verifique su conexión o el tamaño del archivo.'
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
}

async function onFileCert(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) await _subirDocTercero(f, 'certificacion_bancaria_tercero', certBancaria.value, 'doc_certificacion_bancaria_tercero_url')
}
function quitarCert() {
  certBancaria.value = { cargando: false, url: null, nombre: null, error: null }
  documentos.value.doc_certificacion_bancaria_tercero_url = ''
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
  { label: 'Documentos y', label2: 'autorización' },
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
  { value: 'pregrado',  label: 'Pregrado'  },
  { value: 'postgrado', label: 'Postgrado' },
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
const LABEL_TIPO_ESTUDIO = { pregrado: 'Pregrado', postgrado: 'Postgrado' }
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
  const items = [
    { label: 'Cédula (Titular)', url: documentos.value.doc_cedula_solicitante_url },
  ]

  // 1. Solicitante
  if (laboral.value.tipo_trabajador === 'empleado') {
    items.push({ label: 'Carta laboral', url: documentos.value.doc_carta_laboral_solicitante_url })
    items.push({ label: 'Colillas pago', url: documentos.value.doc_colillas_pago_solicitante_url })
  } else if (laboral.value.tipo_trabajador === 'pensionado') {
    items.push({ label: 'Desprendibles pensión', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  } else if (laboral.value.tipo_trabajador && laboral.value.tipo_trabajador !== 'cuidado_hogar') {
    items.push({ label: 'Soporte ingresos', url: documentos.value.doc_soporte_ingresos_solicitante_url })
  }

  // Educativo
  if (esEducativo.value) {
    items.push({ label: 'Liquidación matrícula', url: documentos.value.doc_liquidacion_matricula_url })
  }

  // Tercero
  if (cuenta.value.cuenta_tercero) {
    items.push({ label: 'Carta autorización (Tercero)', url: documentos.value.doc_carta_autorizacion_tercero_url })
    items.push({ label: 'Certificación bancaria (Tercero)', url: documentos.value.doc_certificacion_bancaria_tercero_url })
  }

  // 2. Codeudores
  if (numCodudores.value >= 1) {
    items.push({ label: 'Cédula (Cod. 1)', url: documentos.value.doc_cedula_codeudor_url })
    if (documentos.value.doc_soporte_laboral_codeudor_url) {
      const labelDoc = laboralCod1.value.tipo_trabajador_codeudor === 'empleado' ? 'Carta/Colillas (Cod. 1)' : 'Soporte ingresos (Cod. 1)'
      items.push({ label: labelDoc, url: documentos.value.doc_soporte_laboral_codeudor_url })
    }
  }
  if (numCodudores.value >= 2) {
    items.push({ label: 'Cédula (Cod. 2)', url: documentos.value.doc_cedula_codeudor2_url })
    if (documentos.value.doc_soporte_laboral_codeudor2_url) {
      const labelDoc = laboralCod2.value.tipo_trabajador_codeudor2 === 'empleado' ? 'Carta/Colillas (Cod. 2)' : 'Soporte ingresos (Cod. 2)'
      items.push({ label: labelDoc, url: documentos.value.doc_soporte_laboral_codeudor2_url })
    }
  }

  return items
})

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
  if (!financiera.value.salario_ingresos_fijos)                     items.push('Ingresos')
  if (mostrarCuentaDesembolso.value && !cuenta.value.numero_cuenta) items.push('Número de cuenta bancaria')
  return items
})

function seleccionarModalidad(v) {
  actualizarGeneral('modalidad_credito', v)
}

function actualizarGeneral(campo, valor) {
  general.value = { ...general.value, [campo]: valor }
}

const esEducativo = computed(() => general.value.modalidad_credito === 'educativo')
const esOrdinario = computed(() => general.value.modalidad_credito === 'ordinario')
const maxPlazo    = computed(() => esEducativo.value ? 6 : esOrdinario.value ? 60 : 120)

// Clamp plazo si ya tenía un valor mayor cuando se cambia la modalidad
watch(esEducativo, (educativo) => {
  if (educativo && Number(general.value.plazo_solicitado) > 6) {
    general.value = { ...general.value, plazo_solicitado: '6' }
  }
})
watch(esOrdinario, (ordinario) => {
  if (ordinario && Number(general.value.plazo_solicitado) > 60) {
    general.value = { ...general.value, plazo_solicitado: '60' }
  }
})

function actualizarPlazo(valor) {
  const num = Number(valor)
  if (valor !== '' && num > maxPlazo.value) {
    const label = esEducativo.value ? 'educativo' : 'ordinario'
    errorPlazo.value = `El plazo máximo para crédito ${label} es ${maxPlazo.value} meses.`
    actualizarGeneral('plazo_solicitado', valor)
  } else {
    errorPlazo.value = null
    actualizarGeneral('plazo_solicitado', valor)
  }
}

function actualizarLaboral(campo, valor) {
  laboral.value = { ...laboral.value, [campo]: valor }
}

function actualizarCuenta(campo, valor) {
  cuenta.value = { ...cuenta.value, [campo]: valor }
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
      background:   'var(--color-bg-card)',
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      padding:      '64px var(--sp-2xl)',
      boxShadow:    'var(--shadow-card)',
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
      }">¡Solicitud enviada exitosamente!</div>
      <div :style="{
        fontSize:   'var(--text-base)',
        color:      'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)',
        lineHeight: '1.7',
        maxWidth:   '480px',
        margin:     '0 auto var(--sp-2xl)',
      }">
        Su solicitud de crédito fue radicada correctamente.
        Un asesor de Cooperamigó se comunicará con usted en
        los próximos días hábiles para continuar el proceso.
      </div>
      <PortalButton variant="primary" @click="router.push('/')">
        Volver al inicio
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
              Autorizo a la Cooperativa Multiactiva Luis Amigó para tratar mis datos personales, incluyendo mi número de celular y correo electrónico, con la finalidad de contactarme, gestionar mi solicitud, realizar seguimiento y enviarme información relacionada con los productos y servicios ofrecidos por la cooperativa.
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
    <div v-else :style="{ width: '100%', margin: '0 auto' }">

      <!-- Banner: borrador encontrado — Continuar o Empezar de nuevo -->
      <div v-if="mostrarOpcionBorrador" :style="{
        background:   'var(--color-bg-card)',
        borderRadius: 'var(--r-md)',
        padding:      'var(--sp-lg) var(--sp-xl)',
        marginBottom: 'var(--sp-xl)',
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-md)',
      }">
        <div :style="{ flex: '1' }">
          <div :style="{
            fontWeight:   'var(--fw-bold)',
            color:        'var(--color-primary)',
            fontSize:     'var(--text-base)',
            marginBottom: '2px',
          }">Tiene una solicitud sin terminar</div>
          <div :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-2)',
            fontWeight: 'var(--fw-medium)',
          }">
            Guardada el {{ formatearFecha(fechaBorrador) }}.
            Puede continuar donde la dejó o empezar desde cero.
          </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)', flexShrink: '0' }">
          <PortalButton variant="primary" small @click="continuarConBorrador">
            Continuar solicitud
          </PortalButton>
          <PortalButton variant="secondary" small @click="empezarDeNuevo">
            Empezar de nuevo
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
      <div :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)',
        }">Solicitud de crédito</div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)' }">
          Obtenga el financiamiento que necesita con las mejores condiciones
        </div>
      </div>

      <StepIndicator v-if="paso !== 1" :pasos="secciones" :actual="seccionActual" />

      <!-- Título del paso + barra de progreso — solo pasos 2 y 3 -->
      <div v-if="paso !== 1" :style="{ marginBottom: 'var(--sp-xl)', marginTop: 'var(--sp-lg)' }">
        <div :style="{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 'var(--sp-sm)',
        }">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
            color: 'var(--color-text-1)',
          }">{{ pasoActual?.titulo }}</div>
        </div>
        <div :style="{
          height: '6px', background: 'var(--color-border)',
          borderRadius: 'var(--r-pill)', overflow: 'hidden',
        }">
          <div :style="{
            height: '100%',
            width: (porcentaje) + '%',
            background: 'var(--color-primary)',
            borderRadius: 'var(--r-pill)',
            transition: 'width var(--transition-base)',
          }" />
        </div>
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
              <!-- Tipo de operación — solo para crédito ordinario -->
              <CampoSelectBuscable
                v-if="mostrarTipoOperacion"
                :model-value="general.tipo_operacion"
                label="Tipo de operación"
                required
                :opciones="opsTipoOperacion"
                @update:model-value="actualizarGeneral('tipo_operacion', $event)"
              />
              <CampoMoneda
                v-if="mostrarValorCredito && esEducativo"
                :model-value="general.valor_credito"
                label="Valor del crédito"
                required
                @update:model-value="actualizarGeneral('valor_credito', $event)"
              />
              <div v-if="mostrarValorReestructura && mostrarValorDesembolso" :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
                <CampoMoneda :model-value="general.valor_reestructura" label="Valor reestructura" required @update:model-value="actualizarGeneral('valor_reestructura', $event)" />
                <CampoMoneda :model-value="general.valor_desembolso" label="Valor desembolso" required @update:model-value="actualizarGeneral('valor_desembolso', $event)" />
              </div>
              <CampoMoneda v-if="mostrarValorReestructura && !mostrarValorDesembolso" :model-value="general.valor_reestructura" label="Valor de la reestructura" required @update:model-value="actualizarGeneral('valor_reestructura', $event)" />
              <template v-if="!mostrarTipoOperacion || general.tipo_operacion">
                <template v-if="esEducativo">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="general.tipo_estudio" label="Tipo de estudio" required :opciones="opsTipoEstudio" @update:model-value="actualizarGeneral('tipo_estudio', $event)" />
                    <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
                      <div :style="{ position: 'relative', display: 'flex', alignItems: 'center', padding: '12px 14px', border: errorPlazo ? '1px solid var(--color-error)' : '1px solid var(--color-border)', borderRadius: 'var(--r-lg)', background: 'var(--color-bg-card)' }">
                        <input :value="general.plazo_solicitado" type="text" inputmode="numeric" maxlength="2" :style="{ flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--color-text-1)' }" @keydown="e => { const ok = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab']; if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault() }" @input="actualizarPlazo($event.target.value)" />
                        <label :style="{ position: 'absolute', left: '12px', top: '0', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 'var(--fw-semibold)', color: errorPlazo ? 'var(--color-error-text)' : 'var(--color-text-3)', background: 'var(--color-bg-card)', padding: '0 3px' }">Plazo (meses) <span :style="{ color: 'var(--color-error)' }">*</span></label>
                      </div>
                      <span v-if="errorPlazo" :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-error-text)', fontWeight: 'var(--fw-medium)' }">{{ errorPlazo }}</span>
                    </div>
                  </div>
                  <CampoTexto :model-value="general.denominacion_carrera" label="Carrera o denominación" required @update:model-value="actualizarGeneral('denominacion_carrera', $event)" />
                </template>
                <div v-else :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : mostrarValorCredito ? '1fr 2fr 1fr' : '3fr 1fr', gap: 'var(--sp-lg)' }">
                  <CampoMoneda v-if="mostrarValorCredito" :model-value="general.valor_credito" label="Valor del crédito" required @update:model-value="actualizarGeneral('valor_credito', $event)" />
                  <CampoTexto :model-value="general.destino_credito" label="Destino del crédito" required :maxlength="40" @update:model-value="actualizarGeneral('destino_credito', $event ? $event.toUpperCase() : $event)" />
                  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
                    <div :style="{ position: 'relative', display: 'flex', alignItems: 'center', padding: '12px 14px', border: errorPlazo ? '1px solid var(--color-error)' : '1px solid var(--color-border)', borderRadius: 'var(--r-lg)', background: 'var(--color-bg-card)' }">
                      <input :value="general.plazo_solicitado" type="text" inputmode="numeric" maxlength="2" :style="{ flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--color-text-1)' }" @keydown="e => { const ok = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab']; if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault() }" @input="actualizarPlazo($event.target.value)" />
                      <label :style="{ position: 'absolute', left: '12px', top: '0', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 'var(--fw-semibold)', color: errorPlazo ? 'var(--color-error-text)' : 'var(--color-text-3)', background: 'var(--color-bg-card)', padding: '0 3px' }">Plazo (meses) <span :style="{ color: 'var(--color-error)' }">*</span></label>
                    </div>
                    <span v-if="errorPlazo" :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-error-text)', fontWeight: 'var(--fw-medium)' }">{{ errorPlazo }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 2. Información del Solicitante -->
          <div id="seccion-persona" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUserCheck :size="20" /> Información del solicitante
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
              <IconRotate :size="20" /> Información laboral
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <SelectorTipoTrabajador :model-value="laboral.tipo_trabajador" @update:model-value="actualizarLaboral('tipo_trabajador', $event)" />
              <div v-if="laboral.tipo_trabajador" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

                <!-- Empleado -->
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboral.nombre_empresa" label="Nombre de la empresa" required @update:model-value="actualizarLaboral('nombre_empresa', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboral.cargo_oficio" label="Cargo u oficio" required @update:model-value="actualizarLaboral('cargo_oficio', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboral.tipo_contrato" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboral('tipo_contrato', $event)" />
                    <SelectorFecha :model-value="laboral.fecha_ingreso" label="Fecha de ingreso" required @update:model-value="actualizarLaboral('fecha_ingreso', $event)" />
                  </div>
                </template>

                <!-- Independiente -->
                <template v-if="laboral.tipo_trabajador === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboral.actividad_comercial" label="Actividad comercial" required :maxlength="50" @update:model-value="actualizarLaboral('actividad_comercial', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboral.fecha_inicio_actividad" label="Fecha de inicio" required @update:model-value="actualizarLaboral('fecha_inicio_actividad', $event)" />
                    <CampoTexto :model-value="laboral.ocupacion" label="Ocupación" required :maxlength="50" @update:model-value="actualizarLaboral('ocupacion', $event ? $event.toUpperCase() : $event)" />
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

          <!-- 6. Cuenta de Desembolso -->
          <div v-if="mostrarCuentaDesembolso" id="seccion-cuenta" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileCheck :size="20" /> Cuenta de desembolso
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
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
                      <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Carta firmada por el titular autorizando el desembolso.</div>
                    </div>
                    <div v-if="cartaAutorizacion.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
                      <IconLoader2 :size="15" :style="{ animation: 'spin 1s linear infinite' }" /> Subiendo…
                    </div>
                    <div v-else-if="cartaAutorizacion.url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-lg)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', flexShrink: '0', maxWidth: '160px' }">
                      <IconCheck :size="13" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                      <span :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ cartaAutorizacion.nombre?.length > 16 ? cartaAutorizacion.nombre.substring(0, 13) + '...' : cartaAutorizacion.nombre }}</span>
                      <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: 'var(--r-sm)', flexShrink: '0' }" @click="quitarCarta"><IconX :size="13" :style="{ color: 'var(--color-success-text)' }" /></button>
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
                      <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Certificación bancaria del titular que confirme la cuenta.</div>
                    </div>
                    <div v-if="certBancaria.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
                      <IconLoader2 :size="15" :style="{ animation: 'spin 1s linear infinite' }" /> Subiendo…
                    </div>
                    <div v-else-if="certBancaria.url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', padding: '4px var(--sp-md)', borderRadius: 'var(--r-lg)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', flexShrink: '0', maxWidth: '160px' }">
                      <IconCheck :size="13" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                      <span :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ certBancaria.nombre?.length > 16 ? certBancaria.nombre.substring(0, 13) + '...' : certBancaria.nombre }}</span>
                      <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: 'var(--r-sm)', flexShrink: '0' }" @click="quitarCert"><IconX :size="13" :style="{ color: 'var(--color-success-text)' }" /></button>
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
                  border: numCodudores === opcion.num ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
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
                    <CampoTexto :model-value="laboralCod1.nombre_empresa_codeudor" label="Nombre de la empresa" required @update:model-value="actualizarLaboralCod1('nombre_empresa_codeudor', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboralCod1.cargo_oficio_codeudor" label="Cargo u oficio" required @update:model-value="actualizarLaboralCod1('cargo_oficio_codeudor', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod1.tipo_contrato_codeudor" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod1('tipo_contrato_codeudor', $event)" />
                    <SelectorFecha :model-value="laboralCod1.fecha_ingreso_codeudor" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod1('fecha_ingreso_codeudor', $event)" />
                  </div>
                </template>
                <!-- Independiente -->
                <template v-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod1.actividad_comercial_codeudor" label="Actividad comercial" required :maxlength="50" @update:model-value="actualizarLaboralCod1('actividad_comercial_codeudor', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboralCod1.fecha_inicio_actividad_codeudor" label="Fecha de inicio" required @update:model-value="actualizarLaboralCod1('fecha_inicio_actividad_codeudor', $event)" />
                    <CampoTexto :model-value="laboralCod1.ocupacion_codeudor" label="Ocupación" required :maxlength="50" @update:model-value="actualizarLaboralCod1('ocupacion_codeudor', $event ? $event.toUpperCase() : $event)" />
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
                    <CampoSelectBuscable :model-value="laboralCod1.nivel_educativo_codeudor" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod1('nivel_educativo_codeudor', $event)" />
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
                    <CampoTexto :model-value="laboralCod2.nombre_empresa_codeudor2" label="Nombre de la empresa" required @update:model-value="actualizarLaboralCod2('nombre_empresa_codeudor2', $event ? $event.toUpperCase() : $event)" />
                    <CampoTexto :model-value="laboralCod2.cargo_oficio_codeudor2" label="Cargo u oficio" required @update:model-value="actualizarLaboralCod2('cargo_oficio_codeudor2', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelectBuscable :model-value="laboralCod2.tipo_contrato_codeudor2" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod2('tipo_contrato_codeudor2', $event)" />
                    <SelectorFecha :model-value="laboralCod2.fecha_ingreso_codeudor2" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod2('fecha_ingreso_codeudor2', $event)" />
                  </div>
                </template>
                <!-- Independiente -->
                <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-lg)' }">
                    <CampoTexto :model-value="laboralCod2.actividad_comercial_codeudor2" label="Actividad comercial" required :maxlength="50" @update:model-value="actualizarLaboralCod2('actividad_comercial_codeudor2', $event ? $event.toUpperCase() : $event)" />
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <SelectorFecha :model-value="laboralCod2.fecha_inicio_actividad_codeudor2" label="Fecha de inicio" required @update:model-value="actualizarLaboralCod2('fecha_inicio_actividad_codeudor2', $event)" />
                    <CampoTexto :model-value="laboralCod2.ocupacion_codeudor2" label="Ocupación" required :maxlength="50" @update:model-value="actualizarLaboralCod2('ocupacion_codeudor2', $event ? $event.toUpperCase() : $event)" />
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
                    <CampoSelectBuscable :model-value="laboralCod2.nivel_educativo_codeudor2" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod2('nivel_educativo_codeudor2', $event)" />
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

      </div>

      <!-- ── PASO 4: Documentos y autorización ────────── -->
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
              @update:model-value="documentos = $event"
              @sesion-creada="onSesionCapturaCreada"
            />
          </div>
        </div>

        <!-- Autorizaciones legales -->
        <div id="seccion-autorizaciones" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
          <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
            <IconShieldCheck :size="20" /> Autorizaciones legales
          </div>
          <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-md)' }">
              <div>
                <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">Autorizaciones y declaraciones</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }">Debe leer y aceptar para continuar.</div>
              </div>
              <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-lg)', borderRadius: 'var(--r-pill)', background: autorizaciones.autorizacion_aceptada ? 'var(--color-success-bg)' : 'var(--color-bg-surface)', border: autorizaciones.autorizacion_aceptada ? '1px solid var(--color-success)' : '1px solid var(--color-border)' }">
                <IconCircleCheck v-if="autorizaciones.autorizacion_aceptada" :size="16" :style="{ color: 'var(--color-success)' }" />
                <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: autorizaciones.autorizacion_aceptada ? 'var(--color-success-text)' : 'var(--color-text-3)' }">{{ autorizaciones.autorizacion_aceptada ? 'Aceptadas' : 'Pendiente' }}</span>
              </div>
            </div>
            <PortalButton variant="primary" :full="true" @click="modalAutorizacionesVisible = true">Leer y aceptar autorizaciones</PortalButton>
          </div>
        </div>

        <ModalAutorizaciones v-model:visible="modalAutorizacionesVisible" :aceptado="autorizaciones.autorizacion_aceptada" @aceptar="autorizaciones.autorizacion_aceptada = true" @rechazar="autorizaciones.autorizacion_aceptada = false" />

      </div>

      <!-- ── PASO 5: Revisión y firma ─────────────────── -->
      <div v-if="paso === 5" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <!-- Título -->
          <div :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-lg)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
          }">Revise su solicitud antes de firmar</div>

          <!-- ── Banner de campos faltantes ────────────────────────── -->
          <div v-if="!pasoSolicitudValido" :style="{ borderRadius: 'var(--r-md)', padding: 'var(--sp-md) var(--sp-lg)', background: '#fff8f0', border: '1px solid var(--color-impulso)', display: 'flex', gap: 'var(--sp-md)' }">
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

          <!-- ── SECCIONES DEL SUMARIO ─────────────────────────── -->
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            
            <!-- 1. Datos de la Solicitud -->
            <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'white', overflow: 'hidden' }">
              <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-1)' }">
                  <IconFileDescription :size="16" /> Datos de la solicitud
                </div>
                <button @click="irAPaso(1)" :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }">Editar</button>
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
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Monto</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '800', color: 'var(--color-primary)' }">{{ formatMonto(general.valor_credito || general.valor_reestructura) }}</div>
                </div>
                <div>
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Plazo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.plazo_solicitado }} meses</div>
                </div>
                <div v-if="esEducativo" :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Carrera</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.denominacion_carrera }} ({{ label(LABEL_TIPO_ESTUDIO, general.tipo_estudio) }})</div>
                </div>
                <div v-else :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Destino</div>
                  <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ general.destino_credito }}</div>
                </div>
              </div>
            </div>

            <!-- 2. Información del Titular (Compacto) -->
            <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'white', overflow: 'hidden' }">
              <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-1)' }">
                  <IconUser :size="16" /> Información del titular
                </div>
                <button @click="irAPaso(2)" :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }">Editar</button>
              </div>
              <div :style="{ padding: 'var(--sp-md) var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
                
                <!-- Personal y Residencia -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nombre</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.nombres }} {{ persona.apellidos }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Documento</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, persona.tipo_documento) }} {{ persona.numero_identificacion }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Expedición</div>
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
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel Educativo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, persona.nivel_educativo_solicitante) }}</div>
                  </div>
                  <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Dirección</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ persona.direccion_residencia }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ciudad</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ ubicacionResidencia.municipio_nombre }}, {{ ubicacionResidencia.depto_nombre }}</div>
                  </div>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />

                <!-- Laboral -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Tipo Trabajador</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_TRABAJADOR, laboral.tipo_trabajador) }}</div>
                  </div>
                  <template v-if="laboral.tipo_trabajador === 'empleado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Empresa</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.nombre_empresa }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.cargo_oficio }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Contrato</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CONTRATO, laboral.tipo_contrato) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingreso</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboral.fecha_ingreso) }}</div>
                    </div>
                  </template>
                  <template v-if="laboral.tipo_trabajador === 'independiente'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Actividad</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.actividad_comercial }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Inicio</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatFecha(laboral.fecha_inicio_actividad) }}</div>
                    </div>
                  </template>
                  <template v-if="laboral.tipo_trabajador === 'pensionado'">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 3' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Entidad Pagadora</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ laboral.entidad_pagadora }}</div>
                    </div>
                  </template>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />

                <!-- Financiera y Patrimonio -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos Fijos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-success-text)' }">{{ formatMonto(financiera.salario_ingresos_fijos || financiera.mesada_pensional) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Otros Ingresos</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ formatMonto(financiera.ingresos_independiente) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Gastos Fam.</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-error-text)' }">{{ formatMonto(financiera.gastos_familiares) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-error-text)' }">{{ formatMonto(financiera.obligaciones_financieras) }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Pers. a cargo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ financiera.numero_dependientes }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Propiedad Raíz</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonio.tiene_propiedad_raiz ? 'SÍ (' + formatMonto(patrimonio.valor_propiedad_raiz) + ')' : 'NO' }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Vehículo</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ patrimonio.tiene_vehiculo ? 'SÍ (' + formatMonto(patrimonio.valor_vehiculo) + ')' : 'NO' }}</div>
                  </div>
                </div>

                <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />

                <!-- Bancaria -->
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 'var(--sp-md)' }">
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Banco para desembolso</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ cuenta.entidad_bancaria === 'otro' ? cuenta.entidad_bancaria_otro : cuenta.entidad_bancaria }}</div>
                  </div>
                  <div>
                    <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Cuenta</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_CUENTA, cuenta.tipo_cuenta) }} {{ cuenta.numero_cuenta }} {{ cuenta.cuenta_tercero ? '(Tercero: ' + cuenta.nombre_tercero + ')' : '' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Codeudores (si existen) -->
            <template v-if="numCodudores > 0">
              <div v-for="i in numCodudores" :key="i" :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'white', overflow: 'hidden' }">
                <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                  <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-1)' }">
                    <IconUserCheck :size="16" /> Codeudor {{ i }}
                  </div>
                  <button @click="irAPaso(3)" :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }">Editar</button>
                </div>
                <div :style="{ padding: 'var(--sp-md) var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                  <!-- Personal -->
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nombre</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ i === 1 ? (personaCod1.nombres_codeudor + ' ' + personaCod1.apellidos_codeudor) : (personaCod2.nombres_codeudor2 + ' ' + personaCod2.apellidos_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Documento</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_DOC, i === 1 ? personaCod1.tipo_documento_codeudor : personaCod2.tipo_documento_codeudor2) }} {{ i === 1 ? personaCod1.numero_identificacion_codeudor : personaCod2.numero_identificacion_codeudor2 }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Celular</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ i === 1 ? personaCod1.celular_codeudor : personaCod2.celular_codeudor2 }}</div>
                    </div>
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Correo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ i === 1 ? personaCod1.correo_codeudor : personaCod2.correo_codeudor2 }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Nivel Educativo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_NIVEL_EDUCATIVO, i === 1 ? personaCod1.nivel_educativo_codeudor : personaCod2.nivel_educativo_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ciudad</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ i === 1 ? (ubicacionCod1.municipio_nombre + ', ' + ubicacionCod1.depto_nombre) : (ubicacionCod2.municipio_nombre + ', ' + ubicacionCod2.depto_nombre) }}</div>
                    </div>
                  </div>

                  <div :style="{ height: '1px', background: 'var(--color-border-light)' }" />

                  <!-- Laboral / Financiera -->
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 'var(--sp-md)' }">
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ocupación</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ label(LABEL_TIPO_TRABAJADOR, i === 1 ? laboralCod1.tipo_trabajador_codeudor : laboralCod2.tipo_trabajador_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Ingresos</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-success-text)' }">{{ i === 1 ? formatMonto(financieraCod1.salario_codeudor || financieraCod1.mesada_pensional_codeudor) : formatMonto(financieraCod2.salario_codeudor2 || financieraCod2.mesada_pensional_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Obligaciones</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-error-text)' }">{{ i === 1 ? formatMonto(financieraCod1.obligaciones_financieras_codeudor) : formatMonto(financieraCod2.obligaciones_financieras_codeudor2) }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Pers. a cargo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ i === 1 ? financieraCod1.numero_dependientes_codeudor : financieraCod2.numero_dependientes_codeudor2 }}</div>
                    </div>
                    <div :style="{ gridColumn: isMobile ? 'auto' : 'span 2' }">
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Empresa/Actividad</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">
                        {{ i === 1 ? (laboralCod1.nombre_empresa_codeudor || laboralCod1.actividad_comercial_codeudor || laboralCod1.entidad_pagadora_codeudor) : (laboralCod2.nombre_empresa_codeudor2 || laboralCod2.actividad_comercial_codeudor2 || laboralCod2.entidad_pagadora_codeudor2) }}
                      </div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Propiedad Raíz</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ (i === 1 ? patrimonioCod1.tiene_propiedad_raiz_codeudor : patrimonioCod2.tiene_propiedad_raiz_codeudor2) ? 'SÍ' : 'NO' }}</div>
                    </div>
                    <div>
                      <div :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Vehículo</div>
                      <div :style="{ fontSize: 'var(--text-sm)', fontWeight: '600' }">{{ (i === 1 ? patrimonioCod1.tiene_vehiculo_codeudor : patrimonioCod2.tiene_vehiculo_codeudor2) ? 'SÍ' : 'NO' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 4. Documentos cargados -->
            <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'white', overflow: 'hidden' }">
              <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-1)' }">
                  <IconUpload :size="16" /> Documentos adjuntos
                </div>
                <button @click="irAPaso(4)" :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }">Editar</button>
              </div>
              <div :style="{ padding: 'var(--sp-md) var(--sp-lg)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }">
                <div v-for="doc in docResumen" :key="doc.label" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', background: doc.url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)', padding: '4px 12px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (doc.url ? 'var(--color-success)' : 'var(--color-border)') }">
                  <IconCheck v-if="doc.url" :size="12" :style="{ color: 'var(--color-success)' }" />
                  <IconX v-else :size="12" :style="{ color: 'var(--color-error)' }" />
                  <span :style="{ fontSize: '11px', fontWeight: 'bold', color: doc.url ? 'var(--color-success-text)' : 'var(--color-text-3)' }">{{ doc.label }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Firma digital -->
          <div :style="{ borderRadius: 'var(--r-xl)', border: '2px solid var(--color-accent)', overflow: 'hidden', marginTop: 'var(--sp-lg)' }">
            <div :style="{ padding: '12px var(--sp-lg)', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconShieldCheck :size="18" style="color: var(--color-dark);" />
              <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-dark)', textTransform: 'uppercase', letterSpacing: '0.07em' }">Firma electrónica de la solicitud</span>
            </div>
            <div :style="{ padding: 'var(--sp-xl)', background: 'white', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: '1.6' }">
                Al escribir su nombre a continuación, usted certifica que la información proporcionada es veraz y autoriza a <strong>Cooperamigo</strong> para realizar las validaciones correspondientes.
              </div>
              <CampoTexto label="Escriba su nombre completo para firmar" placeholder="TAL CUAL APARECE EN SU CÉDULA" :model-value="firma.nombre_firma" @update:model-value="firma.nombre_firma = $event" />
            </div>
          </div>
        </div>

      <!-- Navegación -->
      <div :style="{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-2xl)', gap: 'var(--sp-md)' }">
        <PortalButton variant="secondary" @click="paso === 1 ? router.push('/') : anterior()">{{ paso === 1 ? 'Cancelar' : 'Anterior' }}</PortalButton>
        <PortalButton v-if="!esUltimoPaso" variant="primary" :loading="loading" :disabled="(paso === 1 && !general.modalidad_credito) || (paso === 2 && !pasoSolicitudValido)" @click="siguiente()">Continuar</PortalButton>
        <PortalButton v-if="esUltimoPaso" variant="primary" :loading="loading" :disabled="!firma.nombre_firma" @click="enviar()">Enviar solicitud</PortalButton>
      </div>
    </div>

    <!-- Modal Asociado no encontrado -->
    <Teleport to="body">
      <div v-if="mostrarModalNoAsociado" :style="{ position: 'fixed', inset: '0', zIndex: '100', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)', background: 'rgba(0,0,0,0.5)' }">
        <div :style="{ background: 'white', padding: 'var(--sp-2xl)', borderRadius: 'var(--r-xl)', maxWidth: '400px', textAlign: 'center' }">
          <IconUserX :size="48" style="color: var(--color-error); margin-bottom: var(--sp-lg)" />
          <div :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-md)' }">No eres asociado aún</div>
          <PortalButton variant="primary" @click="router.push('/solicitud-afiliacion')">Afiliarme ahora</PortalButton>
          <PortalButton variant="secondary" @click="mostrarModalNoAsociado = false" :style="{ marginTop: 'var(--sp-sm)' }">Cerrar</PortalButton>
        </div>
      </div>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>