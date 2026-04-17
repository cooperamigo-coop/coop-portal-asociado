<script setup>
import { ref, computed, watch } from 'vue'
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
  IconUserX, IconMail, IconRotate, IconUsers, IconUserCheck, IconFileDescription,
  IconCheck, IconUpload, IconCamera, IconX, IconLoader2,
  IconPencil, IconAlertTriangle, IconFileCheck, IconFile,
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
  salarioBloqueado, montoTotalOperacion, pasoSolicitudValido,
  siguiente, anterior, irAPaso, enviar, guardarPaso, formatMonto,
} = useSolicitudCredito()

const modalAutorizacionesVisible = ref(false)
const aceptaCondiciones = ref(false)
const errorCorreo = ref(null)
const errorPlazo   = ref(null)
const plazoFocused = ref(false)

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
  } catch {
    estado.error = 'Error al subir el archivo. Intente de nuevo.'
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
  { label: 'Solicitud'   },
  { label: 'Solicitante' },
  { label: 'Codeudores'  },
  { label: 'Legal'       },
]

const seccionActual = computed(() => {
  const s = pasoActual.value?.seccion
  if (['Solicitud'].includes(s))   return 1
  if (['Solicitante'].includes(s)) return 2
  if (['Codeudores', 'Codeudor 1', 'Codeudor 2'].includes(s)) return 3
  if (['Legal'].includes(s))       return 4
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
    { label: 'Cédula (frente)',  url: documentos.value.doc_cedula_frente_url },
    { label: 'Cédula (reverso)', url: documentos.value.doc_cedula_reverso_url },
  ]
  if (laboral.value.tipo_trabajador && laboral.value.tipo_trabajador !== 'cuidado_hogar') {
    items.push({ label: 'Soporte laboral', url: documentos.value.doc_soporte_laboral_url })
  }
  if (esEducativo.value) {
    items.push({ label: 'Liquidación de matrícula', url: documentos.value.doc_liquidacion_matricula_url })
  }
  if (cuenta.value.cuenta_tercero) {
    items.push({ label: 'Carta de autorización (tercero)', url: documentos.value.doc_carta_autorizacion_tercero_url })
    items.push({ label: 'Certificación bancaria (tercero)', url: documentos.value.doc_certificacion_bancaria_tercero_url })
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

// Prefill nombre en la firma cuando llega al paso 19
watch(paso, async (nuevoPaso) => {
  if (nuevoPaso === 19 && !firma.value.nombre_firma) {
    const nombreCompleto = [persona.value.nombres, persona.value.apellidos].filter(Boolean).join(' ')
    if (nombreCompleto) firma.value = { ...firma.value, nombre_firma: nombreCompleto }
  }
  // Garantiza que la solicitud esté guardada antes de pasos que requieren solicitudId
  if ((nuevoPaso === 7 || nuevoPaso === 17) && !solicitudId.value) {
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
        background: 'var(--color-primary-light)',
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

    <!-- ═══ FORMULARIO ACTIVO (13 pasos) ════════════════════ -->
    <div v-else :style="{ width: '100%', margin: '0 auto' }">

      <!-- Banner: borrador encontrado — Continuar o Empezar de nuevo -->
      <div v-if="mostrarOpcionBorrador" :style="{
        background:   'var(--color-primary-light)',
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

      <StepIndicator v-if="paso > 1" :pasos="secciones" :actual="seccionActual" />

      <!-- Título del paso + contador + barra de progreso -->
      <div v-if="paso > 1" :style="{ marginBottom: 'var(--sp-xl)' }">
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
              width: (indexPasoActual / totalPasosVisibles * 100) + '%',
              background: 'var(--color-primary)',
              borderRadius: 'var(--r-pill)',
              transition: 'width var(--transition-base)',
            }" />
          </div>
        </div>

      <!-- Contenido del paso -->
      <div :style="{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-md)',
        padding:      isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
        boxShadow:    'var(--shadow-card)',
        position:     'relative',
      }">

        <!-- ── PASO 1: Modalidad de crédito ─────────────────── -->
        <div v-if="paso === 1" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorModalidad
            :model-value="general.modalidad_credito"
            @update:model-value="seleccionarModalidad"
          />

          <!-- Tipo de operación — solo para crédito ordinario -->
          <div v-if="mostrarTipoOperacion" :style="{
            marginTop: 'var(--sp-sm)',
            animation: 'fadeIn 0.3s ease-out'
          }">
            <div :style="{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--color-primary)',
              marginBottom: 'var(--sp-md)',
              textAlign: 'center'
            }">¿Qué tipo de operación desea realizar?</div>
            <CampoSelectBuscable
              :model-value="general.tipo_operacion"
              label="Tipo de operación"
              required
              :opciones="opsTipoOperacion"
              @update:model-value="actualizarGeneral('tipo_operacion', $event)"
            />
          </div>
        </div>

        <!-- ── PASO 2: Datos de la solicitud ────────────────── -->
        <div v-if="paso === 2" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <!-- Valor del crédito (nuevo o educativo) -->
          <CampoMoneda
            v-if="mostrarValorCredito"
            :model-value="general.valor_credito"
            label="Valor del crédito"
            required
            @update:model-value="actualizarGeneral('valor_credito', $event)"
          />

          <!-- Reestructura con desembolso: dos campos lado a lado -->
          <div
            v-if="mostrarValorReestructura && mostrarValorDesembolso"
            :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }"
          >
            <CampoMoneda
              :model-value="general.valor_reestructura"
              label="Valor reestructura"
              required
              @update:model-value="actualizarGeneral('valor_reestructura', $event)"
            />
            <CampoMoneda
              :model-value="general.valor_desembolso"
              label="Valor desembolso"
              required
              @update:model-value="actualizarGeneral('valor_desembolso', $event)"
            />
          </div>

          <!-- Solo reestructura (sin desembolso) -->
          <CampoMoneda
            v-if="mostrarValorReestructura && !mostrarValorDesembolso"
            :model-value="general.valor_reestructura"
            label="Valor de la reestructura"
            required
            @update:model-value="actualizarGeneral('valor_reestructura', $event)"
          />


          <!-- Destino / campos educativo + plazo — visibles cuando hay tipo de operación (o es educativo) -->
          <template v-if="!mostrarTipoOperacion || general.tipo_operacion">

            <!-- ── Crédito educativo ── -->
            <template v-if="esEducativo">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                <CampoSelectBuscable
                  :model-value="general.tipo_estudio"
                  label="Tipo de estudio"
                  required
                  :opciones="opsTipoEstudio"
                  @update:model-value="actualizarGeneral('tipo_estudio', $event)"
                />

                <!-- Plazo -->
                <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
                  <div :style="{
                    position:     'relative',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          'var(--sp-sm)',
                    padding:      '12px 14px',
                    border:       errorPlazo ? '1px solid var(--color-error)' : plazoFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--r-lg)',
                    background:   'var(--color-bg-card)',
                    boxSizing:    'border-box',
                    transition:   'border-color var(--transition-fast)',
                  }">
                    <input
                      :value="general.plazo_solicitado"
                      type="number"
                      min="1"
                      :max="maxPlazo"
                      :style="{
                        flex:       '1',
                        border:     'none',
                        outline:    'none',
                        background: 'transparent',
                        fontSize:   'var(--text-base)',
                        fontFamily: 'var(--font-body)',
                        color:      'var(--color-text-1)',
                        minWidth:   '0',
                        padding:    '0',
                      }"
                      @input="actualizarPlazo($event.target.value)"
                      @focus="plazoFocused = true"
                      @blur="plazoFocused = false"
                    />
                    <label :style="{
                      position:      'absolute',
                      left:          '12px',
                      top:           (plazoFocused || general.plazo_solicitado) ? '0' : '50%',
                      transform:     'translateY(-50%)',
                      fontSize:      (plazoFocused || general.plazo_solicitado) ? '10px' : 'var(--text-base)',
                      fontWeight:    (plazoFocused || general.plazo_solicitado) ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                      color:         errorPlazo ? 'var(--color-error-text)' : plazoFocused ? 'var(--color-primary)' : 'var(--color-text-3)',
                      background:    (plazoFocused || general.plazo_solicitado) ? 'var(--color-bg-card)' : 'transparent',
                      padding:       (plazoFocused || general.plazo_solicitado) ? '0 3px' : '0',
                      pointerEvents: 'none',
                      zIndex:        '1',
                      whiteSpace:    'nowrap',
                      transition:    'all var(--transition-fast)',
                    }">
                      Plazo (meses) <span :style="{ color: 'var(--color-error)' }">*</span>
                    </label>
                  </div>
                  <span v-if="errorPlazo" :style="{
                    fontSize:   'var(--text-xs)',
                    color:      'var(--color-error-text)',
                    fontWeight: 'var(--fw-semibold)',
                  }">{{ errorPlazo }}</span>
                </div>
              </div>

              <CampoTexto
                :model-value="general.denominacion_carrera"
                label="Carrera o denominación"
                placeholder="Ej: Ingeniería de sistemas"
                required
                :maxlength="80"
                @update:model-value="actualizarGeneral('denominacion_carrera', $event)"
              />
            </template>

            <!-- ── Crédito ordinario ── -->
            <div v-else :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 3fr', gap: 'var(--sp-lg)' }">
              <CampoTexto
                :model-value="general.destino_credito"
                label="Destino del crédito"
                placeholder="¿Para qué usará el crédito?"
                required
                :maxlength="40"
                @update:model-value="actualizarGeneral('destino_credito', $event)"
              />

              <!-- Plazo con floating label y "meses" dentro del campo -->
              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
                <div :style="{
                  position:     'relative',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--sp-sm)',
                  padding:      '12px 14px',
                  border:       errorPlazo ? '1px solid var(--color-error)' : plazoFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)',
                  background:   'var(--color-bg-card)',
                  boxSizing:    'border-box',
                  transition:   'border-color var(--transition-fast)',
                }">
                  <input
                    :value="general.plazo_solicitado"
                    type="number"
                    min="1"
                    :max="maxPlazo"
                    :style="{
                      flex:       '1',
                      border:     'none',
                      outline:    'none',
                      background: 'transparent',
                      fontSize:   'var(--text-base)',
                      fontFamily: 'var(--font-body)',
                      color:      'var(--color-text-1)',
                      minWidth:   '0',
                      padding:    '0',
                    }"
                    @input="actualizarPlazo($event.target.value)"
                    @focus="plazoFocused = true"
                    @blur="plazoFocused = false"
                  />
                  <label :style="{
                    position:      'absolute',
                    left:          '12px',
                    top:           (plazoFocused || general.plazo_solicitado) ? '0' : '50%',
                    transform:     'translateY(-50%)',
                    fontSize:      (plazoFocused || general.plazo_solicitado) ? '10px' : 'var(--text-base)',
                    fontWeight:    (plazoFocused || general.plazo_solicitado) ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                    color:         errorPlazo ? 'var(--color-error-text)' : plazoFocused ? 'var(--color-primary)' : 'var(--color-text-3)',
                    background:    (plazoFocused || general.plazo_solicitado) ? 'var(--color-bg-card)' : 'transparent',
                    padding:       (plazoFocused || general.plazo_solicitado) ? '0 3px' : '0',
                    pointerEvents: 'none',
                    zIndex:        '1',
                    whiteSpace:    'nowrap',
                    transition:    'all var(--transition-fast)',
                  }">
                    Plazo (meses) <span :style="{ color: 'var(--color-error)' }">*</span>
                  </label>
                </div>
                <span v-if="errorPlazo" :style="{
                  fontSize:   'var(--text-xs)',
                  color:      'var(--color-error-text)',
                  fontWeight: 'var(--fw-semibold)',
                }">{{ errorPlazo }}</span>
              </div>
            </div>

          </template>
        </div>

        <!-- ── PASO 3: Datos personales solicitante ──────────── -->
        <template v-if="paso === 3">
          <SeccionPersona
            :model-value="persona"
            titulo="Información del solicitante"
            :bloquear-documento="true"
            :bloquear-correo="true"
            :direccion-estructurada="direccionEstructurada"
            :ubicacion="ubicacionResidencia"
            :show-nivel-educativo="true"
            @update:model-value="persona = $event"
            @update:direccion-estructurada="direccionEstructurada = $event"
            @update:ubicacion="ubicacionResidencia = $event"
          />

          <!-- Bloqueo por menor de edad -->
          <div
            v-if="esMenorDeEdad"
            :style="{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          'var(--sp-md)',
              padding:      'var(--sp-lg) var(--sp-xl)',
              borderRadius: 'var(--r-md)',
              background:   'var(--color-error-bg)',
              border:       '1px solid var(--color-error)',
              marginTop:    'var(--sp-lg)',
            }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:2px">
              <circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="2"/>
              <path d="M12 8v4m0 4h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div>
              <div :style="{
                fontWeight:   'var(--fw-bold)',
                color:        'var(--color-error-text)',
                fontSize:     'var(--text-base)',
                marginBottom: 'var(--sp-2xs)',
              }">No es posible continuar con la solicitud</div>
              <div :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-error-text)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: '1.5',
              }">
                El solicitante debe ser mayor de 18 años para acceder a productos de crédito.
                Por favor verifique la fecha de nacimiento ingresada.
              </div>
            </div>
          </div>
        </template>

        <!-- ── PASO 4: Información laboral solicitante ───────── -->
        <div v-if="paso === 4" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <SelectorTipoTrabajador
            :model-value="laboral.tipo_trabajador"
            @update:model-value="actualizarLaboral('tipo_trabajador', $event)"
          />

          <!-- Campos dinámicos por tipo de trabajador -->
          <div
            v-if="laboral.tipo_trabajador"
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <!-- Empleado -->
            <template v-if="laboral.tipo_trabajador === 'empleado'">
              <CampoTexto
                :model-value="laboral.nombre_empresa"
                label="Nombre de la empresa"
                placeholder="Empresa donde trabaja"
                required
                @update:model-value="actualizarLaboral('nombre_empresa', $event)"
              />
              <CampoTexto
                :model-value="laboral.cargo_oficio"
                label="Cargo u oficio"
                placeholder="Ej: Contador, Docente"
                required
                @update:model-value="actualizarLaboral('cargo_oficio', $event)"
              />
              <CampoSelectBuscable
                :model-value="laboral.tipo_contrato"
                label="Tipo de contrato"
                required
                :opciones="opsTipoContrato"
                @update:model-value="actualizarLaboral('tipo_contrato', $event)"
              />
              <CampoTexto
                v-if="laboral.tipo_contrato === 'otro'"
                :model-value="laboral.tipo_contrato_otro"
                label="Especifique el tipo de contrato"
                placeholder="Describa el contrato"
                @update:model-value="actualizarLaboral('tipo_contrato_otro', $event)"
              />
              <SelectorFecha
                :model-value="laboral.fecha_ingreso"
                label="Fecha de ingreso"
                required
                :max-year="new Date().getFullYear()"
                :min-year="1970"
                @update:model-value="actualizarLaboral('fecha_ingreso', $event)"
              />
            </template>

            <!-- Independiente -->
            <template v-if="laboral.tipo_trabajador === 'independiente'">
              <CampoTexto
                :model-value="laboral.actividad_comercial"
                label="Actividad comercial"
                placeholder="Ej: Comercio, Consultoría"
                required
                @update:model-value="actualizarLaboral('actividad_comercial', $event)"
              />
              <CampoTexto
                :model-value="laboral.ocupacion"
                label="Ocupación"
                placeholder="Ej: Diseñador freelance"
                required
                @update:model-value="actualizarLaboral('ocupacion', $event)"
              />
              <SelectorFecha
                :model-value="laboral.fecha_inicio_actividad"
                label="Fecha de inicio de la actividad"
                required
                :max-year="new Date().getFullYear()"
                :min-year="1970"
                @update:model-value="actualizarLaboral('fecha_inicio_actividad', $event)"
              />
            </template>

            <!-- Pensionado -->
            <template v-if="laboral.tipo_trabajador === 'pensionado'">
              <CampoSelectBuscable
                :model-value="laboral.entidad_pagadora"
                label="Entidad pagadora"
                required
                :opciones="opsEntidadesPensiones"
                :style="{ gridColumn: '1 / -1' }"
                @update:model-value="actualizarLaboral('entidad_pagadora', $event)"
              />
            </template>

            <!-- Estudiante -->
            <template v-if="laboral.tipo_trabajador === 'estudiante'">
              <CampoTexto
                :model-value="laboral.institucion_educativa"
                label="Institución educativa"
                placeholder="Nombre de la institución"
                required
                @update:model-value="actualizarLaboral('institucion_educativa', $event)"
              />
              <CampoSelectBuscable
                :model-value="laboral.nivel_educativo"
                label="Nivel educativo"
                required
                :opciones="opsNivelEducativo"
                @update:model-value="actualizarLaboral('nivel_educativo', $event)"
              />
            </template>

            <!-- Cuidado del hogar — sin campos adicionales -->
            <template v-if="laboral.tipo_trabajador === 'cuidado_hogar'">
              <!-- Sin campos adicionales para cuidado del hogar -->
            </template>
          </div>

          <!-- Dependientes — todos los tipos excepto cuidado_hogar -->
          <div v-if="laboral.tipo_trabajador && laboral.tipo_trabajador !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck
              :model-value="laboral.tiene_dependientes"
              label="Tengo personas a cargo (hijos, padres, etc.)"
              @update:model-value="actualizarLaboral('tiene_dependientes', $event)"
            />
            <CampoTexto
              v-if="laboral.tiene_dependientes"
              :model-value="laboral.numero_dependientes"
              label="Número de dependientes"
              placeholder="Ej: 2"
              type="number"
              :style="{ maxWidth: '200px' }"
              @update:model-value="actualizarLaboral('numero_dependientes', $event)"
            />
          </div>
        </div>

        <!-- ── PASO 5: Información financiera ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 5"
          :model-value="financiera"
          titulo="Información financiera"
          :salario-bloqueado="salarioBloqueado"
          :tipo-trabajador="laboral.tipo_trabajador"
          @update:model-value="financiera = $event"
        />

        <!-- ── PASO 6: Patrimonio solicitante ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 6"
          :model-value="patrimonio"
          titulo="Patrimonio"
          @update:model-value="patrimonio = $event"
        />

        <!-- ── PASO 7: Cuenta de desembolso (condicional) ─────── -->
        <div v-if="paso === 7" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
          <CampoSelectBuscable
            :model-value="cuenta.tipo_cuenta"
            label="Tipo de cuenta"
            required
            :opciones="opsTipoCuenta"
            @update:model-value="actualizarCuenta('tipo_cuenta', $event)"
          />
          <CampoSelectBuscable
            :model-value="cuenta.entidad_bancaria"
            label="Entidad bancaria"
            required
            :disabled="!cuenta.tipo_cuenta"
            :limit="0"
            :opciones="[...ENTIDADES_BANCARIAS.map(e => ({ value: e, label: e })), { value: 'otro', label: 'Otra entidad' }]"
            placeholder="Seleccione su banco"
            @update:model-value="actualizarCuenta('entidad_bancaria', $event)"
          />
          <CampoTexto
            v-if="cuenta.entidad_bancaria === 'otro'"
            :model-value="cuenta.entidad_bancaria_otro"
            label="Especifique la entidad bancaria"
            placeholder="Nombre del banco o entidad"
            required
            @update:model-value="actualizarCuenta('entidad_bancaria_otro', $event)"
          />
          <CampoTexto
            :model-value="cuenta.numero_cuenta"
            label="Número de cuenta"
            placeholder="Sin guiones ni espacios"
            required
            solo-numeros
            :maxlength="18"
            :disabled="!cuenta.entidad_bancaria || (cuenta.entidad_bancaria === 'otro' && !cuenta.entidad_bancaria_otro)"
            @update:model-value="actualizarCuenta('numero_cuenta', $event)"
          />

          <!-- ¿Cuenta de tercero? -->
          <CampoCheck
            :model-value="cuenta.cuenta_tercero"
            label="La cuenta bancaria pertenece a un tercero"
            @update:model-value="actualizarCuenta('cuenta_tercero', $event)"
          />

          <!-- Datos del titular + documentos requeridos -->
          <template v-if="cuenta.cuenta_tercero">
            <div :style="{
              padding:      'var(--sp-xl)',
              borderRadius: 'var(--r-xl)',
              border:       '1px solid var(--color-border)',
              background:   'var(--color-bg-surface)',
              display:      'flex',
              flexDirection:'column',
              gap:          'var(--sp-lg)',
            }">
              <div :style="{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-base)',
                fontWeight: 'var(--fw-bold)',
                color:      'var(--color-text-1)',
              }">Datos del titular de la cuenta</div>

              <CampoTexto
                :model-value="cuenta.nombre_tercero"
                label="Nombre completo del titular"
                placeholder="Nombre como aparece en el banco"
                required
                @update:model-value="actualizarCuenta('nombre_tercero', $event)"
              />
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                <CampoSelect
                  :model-value="cuenta.tipo_doc_tercero"
                  label="Tipo de documento"
                  required
                  :opciones="opsTipoDocTitular"
                  @update:model-value="actualizarCuenta('tipo_doc_tercero', $event)"
                />
                <CampoTexto
                  :model-value="cuenta.numero_doc_tercero"
                  label="Número de documento"
                  placeholder="Sin puntos ni espacios"
                  required
                  solo-numeros
                  @update:model-value="actualizarCuenta('numero_doc_tercero', $event)"
                />
              </div>

              <!-- Carta de autorización -->
              <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }">
                <div :style="{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
                  padding: 'var(--sp-md) var(--sp-xl)',
                  background: 'var(--color-bg-surface)',
                  borderBottom: '1px solid var(--color-border-card)',
                }">
                  <div :style="{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--color-impulso)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
                  }">
                    <IconFileDescription :size="18" :style="{ color: '#fff' }" />
                  </div>
                  <div>
                    <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                      Carta de autorización firmada
                      <span :style="{
                        marginLeft: 'var(--sp-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
                        color: 'var(--color-error)', background: 'var(--color-error-bg)',
                        padding: '1px 8px', borderRadius: 'var(--r-pill)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }">Obligatorio</span>
                    </div>
                    <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                      Carta firmada por el titular autorizando el desembolso en su cuenta.
                    </div>
                  </div>
                </div>
                <div :style="{ padding: 'var(--sp-xl)', background: 'var(--color-bg-card)' }">
                  <div v-if="cartaAutorizacion.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
                    <IconLoader2 :size="16" :style="{ animation: 'spin 1s linear infinite' }" />
                    Subiendo archivo…
                  </div>
                  <div v-else-if="cartaAutorizacion.url" :style="{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                    padding: 'var(--sp-md) var(--sp-lg)', borderRadius: 'var(--r-lg)',
                    background: 'var(--color-success-bg)', border: '1px solid var(--color-success)',
                  }">
                    <IconCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                    <span :style="{ fontSize: 'var(--text-base)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ _nombreCorto(cartaAutorizacion.nombre) }}</span>
                    <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="quitarCarta">
                      <IconX :size="16" :style="{ color: 'var(--color-success-text)' }" />
                    </button>
                  </div>
                  <div v-else-if="cartaAutorizacion.error" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }">
                    <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderRadius: 'var(--r-lg)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', fontSize: 'var(--text-sm)', color: 'var(--color-error)', fontWeight: 'var(--fw-semibold)' }">{{ cartaAutorizacion.error }}</div>
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCartaUpload?.click()">
                      <IconUpload :size="15" />Reintentar
                    </button>
                  </div>
                  <div v-else :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCartaUpload?.click()">
                      <IconUpload :size="15" />Subir archivo
                    </button>
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary)' }" @click="refCartaCamera?.click()">
                      <IconCamera :size="15" />Tomar fotos
                    </button>
                  </div>
                  <input ref="refCartaUpload" type="file" accept=".pdf,image/*" :style="{ display: 'none' }" @change="onFileCarta" />
                  <input ref="refCartaCamera" type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onFileCarta" />
                </div>
              </div>

              <!-- Certificación bancaria -->
              <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }">
                <div :style="{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
                  padding: 'var(--sp-md) var(--sp-xl)',
                  background: 'var(--color-bg-surface)',
                  borderBottom: '1px solid var(--color-border-card)',
                }">
                  <div :style="{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
                  }">
                    <IconFileDescription :size="18" :style="{ color: '#fff' }" />
                  </div>
                  <div>
                    <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                      Certificación bancaria
                      <span :style="{
                        marginLeft: 'var(--sp-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
                        color: 'var(--color-error)', background: 'var(--color-error-bg)',
                        padding: '1px 8px', borderRadius: 'var(--r-pill)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }">Obligatorio</span>
                    </div>
                    <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                      Certificado bancario expedido por la entidad que confirme la titularidad de la cuenta.
                    </div>
                  </div>
                </div>
                <div :style="{ padding: 'var(--sp-xl)', background: 'var(--color-bg-card)' }">
                  <div v-if="certBancaria.cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
                    <IconLoader2 :size="16" :style="{ animation: 'spin 1s linear infinite' }" />
                    Subiendo archivo…
                  </div>
                  <div v-else-if="certBancaria.url" :style="{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                    padding: 'var(--sp-md) var(--sp-lg)', borderRadius: 'var(--r-lg)',
                    background: 'var(--color-success-bg)', border: '1px solid var(--color-success)',
                  }">
                    <IconCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                    <span :style="{ fontSize: 'var(--text-base)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ _nombreCorto(certBancaria.nombre) }}</span>
                    <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="quitarCert">
                      <IconX :size="16" :style="{ color: 'var(--color-success-text)' }" />
                    </button>
                  </div>
                  <div v-else-if="certBancaria.error" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }">
                    <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderRadius: 'var(--r-lg)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', fontSize: 'var(--text-sm)', color: 'var(--color-error)', fontWeight: 'var(--fw-semibold)' }">{{ certBancaria.error }}</div>
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCertUpload?.click()">
                      <IconUpload :size="15" />Reintentar
                    </button>
                  </div>
                  <div v-else :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)' }" @click="refCertUpload?.click()">
                      <IconUpload :size="15" />Subir archivo
                    </button>
                    <button :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)', cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary)' }" @click="refCertCamera?.click()">
                      <IconCamera :size="15" />Tomar fotos
                    </button>
                  </div>
                  <input ref="refCertUpload" type="file" accept=".pdf,image/*" :style="{ display: 'none' }" @change="onFileCert" />
                  <input ref="refCertCamera" type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onFileCert" />
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ── PASO 8: Selección de codeudores ─────────────────── -->
        <div v-if="paso === 8" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)' }">
            ¿Desea agregar codeudores a su solicitud?
          </div>
          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 'var(--sp-md)' }">
            <div
              v-for="opcion in [
                { num: 0, titulo: 'Sin codeudor',   desc: 'Continúo solo'          },
                { num: 1, titulo: '1 Codeudor',     desc: 'Añadir un codeudor'     },
                { num: 2, titulo: '2 Codeudores',   desc: 'Añadir dos codeudores'  },
              ]"
              :key="opcion.num"
              :style="{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--sp-sm)', padding: 'var(--sp-xl)',
                borderRadius: 'var(--r-md)',
                border: numCodudores === opcion.num ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: numCodudores === opcion.num ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                cursor: 'pointer', transition: 'all var(--transition-fast)', textAlign: 'center',
              }"
              @click="numCodudores = opcion.num"
            >
              <IconUserCheck v-if="opcion.num === 1" :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
              <IconUsers v-else :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
              <div :style="{ fontWeight: 'var(--fw-bold)', color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-1)', fontSize: 'var(--text-base)' }">{{ opcion.titulo }}</div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">{{ opcion.desc }}</div>
            </div>
          </div>
        </div>

        <!-- ── PASO 9: Datos personales Codeudor 1 ──────────────── -->
        <SeccionPersona
          v-if="paso === 9"
          :model-value="personaCod1"
          titulo="Datos del codeudor 1"
          :es-codeudor="true"
          :direccion-estructurada="direccionEstructuradaCod1"
          :ubicacion="ubicacionCod1"
          @update:model-value="personaCod1 = $event"
          @update:direccion-estructurada="direccionEstructuradaCod1 = $event"
          @update:ubicacion="ubicacionCod1 = $event"
        />

        <!-- ── PASO 10: Laboral Codeudor 1 ───────────────────── -->
        <div v-if="paso === 10" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorTipoTrabajador
            :model-value="laboralCod1.tipo_trabajador_codeudor"
            @update:model-value="actualizarLaboralCod1('tipo_trabajador_codeudor', $event)"
          />
          <div
            v-if="laboralCod1.tipo_trabajador_codeudor"
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'empleado'">
              <CampoTexto :model-value="laboralCod1.nombre_empresa_codeudor" label="Nombre de la empresa" placeholder="Empresa donde trabaja" required @update:model-value="actualizarLaboralCod1('nombre_empresa_codeudor', $event)" />
              <CampoTexto :model-value="laboralCod1.cargo_oficio_codeudor" label="Cargo u oficio" placeholder="Ej: Contador, Docente" required @update:model-value="actualizarLaboralCod1('cargo_oficio_codeudor', $event)" />
              <CampoSelectBuscable :model-value="laboralCod1.tipo_contrato_codeudor" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod1('tipo_contrato_codeudor', $event)" />
              <SelectorFecha :model-value="laboralCod1.fecha_ingreso_codeudor" label="Fecha de ingreso" required :max-year="new Date().getFullYear()" :min-year="1970" @update:model-value="actualizarLaboralCod1('fecha_ingreso_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
              <CampoTexto :model-value="laboralCod1.actividad_comercial_codeudor" label="Actividad comercial" placeholder="Ej: Comercio" required @update:model-value="actualizarLaboralCod1('actividad_comercial_codeudor', $event)" />
              <CampoTexto :model-value="laboralCod1.ocupacion_codeudor" label="Ocupación" placeholder="Ej: Diseñador freelance" required @update:model-value="actualizarLaboralCod1('ocupacion_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'pensionado'">
              <CampoSelectBuscable :model-value="laboralCod1.entidad_pagadora_codeudor" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" :style="{ gridColumn: '1 / -1' }" @update:model-value="actualizarLaboralCod1('entidad_pagadora_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'estudiante'">
              <CampoTexto :model-value="laboralCod1.institucion_educativa_codeudor" label="Institución educativa" placeholder="Nombre de la institución" required @update:model-value="actualizarLaboralCod1('institucion_educativa_codeudor', $event)" />
              <CampoSelectBuscable :model-value="laboralCod1.nivel_educativo_codeudor" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod1('nivel_educativo_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'cuidado_hogar'">
              <!-- Sin campos adicionales -->
            </template>
          </div>
          <div v-if="laboralCod1.tipo_trabajador_codeudor && laboralCod1.tipo_trabajador_codeudor !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck :model-value="laboralCod1.tiene_dependientes_codeudor" label="Tiene personas a cargo" @update:model-value="actualizarLaboralCod1('tiene_dependientes_codeudor', $event)" />
            <CampoTexto v-if="laboralCod1.tiene_dependientes_codeudor" :model-value="laboralCod1.numero_dependientes_codeudor" label="Número de dependientes" type="number" :style="{ maxWidth: '200px' }" @update:model-value="actualizarLaboralCod1('numero_dependientes_codeudor', $event)" />
          </div>
        </div>

        <!-- ── PASO 11: Financiera Codeudor 1 ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 11"
          :model-value="financieraCod1"
          titulo="Información financiera — Codeudor 1"
          :tipo-trabajador="laboralCod1.tipo_trabajador_codeudor"
          @update:model-value="financieraCod1 = $event"
        />

        <!-- ── PASO 12: Patrimonio Codeudor 1 ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 12"
          :model-value="patrimonioCod1"
          titulo="Patrimonio — Codeudor 1"
          @update:model-value="patrimonioCod1 = $event"
        />

        <!-- ── PASO 13: Datos personales Codeudor 2 ──────────── -->
        <SeccionPersona
          v-if="paso === 13"
          :model-value="personaCod2"
          titulo="Datos del codeudor 2"
          :es-codeudor="true"
          :direccion-estructurada="direccionEstructuradaCod2"
          :ubicacion="ubicacionCod2"
          @update:model-value="personaCod2 = $event"
          @update:direccion-estructurada="direccionEstructuradaCod2 = $event"
          @update:ubicacion="ubicacionCod2 = $event"
        />

        <!-- ── PASO 14: Laboral Codeudor 2 ───────────────────── -->
        <div v-if="paso === 14" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorTipoTrabajador
            :model-value="laboralCod2.tipo_trabajador_codeudor2"
            @update:model-value="actualizarLaboralCod2('tipo_trabajador_codeudor2', $event)"
          />
          <div
            v-if="laboralCod2.tipo_trabajador_codeudor2"
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'empleado'">
              <CampoTexto :model-value="laboralCod2.nombre_empresa_codeudor2" label="Nombre de la empresa" placeholder="Empresa donde trabaja" required @update:model-value="actualizarLaboralCod2('nombre_empresa_codeudor2', $event)" />
              <CampoTexto :model-value="laboralCod2.cargo_oficio_codeudor2" label="Cargo u oficio" placeholder="Ej: Contador, Docente" required @update:model-value="actualizarLaboralCod2('cargo_oficio_codeudor2', $event)" />
              <CampoSelectBuscable :model-value="laboralCod2.tipo_contrato_codeudor2" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod2('tipo_contrato_codeudor2', $event)" />
              <SelectorFecha :model-value="laboralCod2.fecha_ingreso_codeudor2" label="Fecha de ingreso" required :max-year="new Date().getFullYear()" :min-year="1970" @update:model-value="actualizarLaboralCod2('fecha_ingreso_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
              <CampoTexto :model-value="laboralCod2.actividad_comercial_codeudor2" label="Actividad comercial" placeholder="Ej: Comercio" required @update:model-value="actualizarLaboralCod2('actividad_comercial_codeudor2', $event)" />
              <CampoTexto :model-value="laboralCod2.ocupacion_codeudor2" label="Ocupación" placeholder="Ej: Diseñador freelance" required @update:model-value="actualizarLaboralCod2('ocupacion_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'pensionado'">
              <CampoSelectBuscable :model-value="laboralCod2.entidad_pagadora_codeudor2" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" :style="{ gridColumn: '1 / -1' }" @update:model-value="actualizarLaboralCod2('entidad_pagadora_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'estudiante'">
              <CampoTexto :model-value="laboralCod2.institucion_educativa_codeudor2" label="Institución educativa" placeholder="Nombre de la institución" required @update:model-value="actualizarLaboralCod2('institucion_educativa_codeudor2', $event)" />
              <CampoSelectBuscable :model-value="laboralCod2.nivel_educativo_codeudor2" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod2('nivel_educativo_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'cuidado_hogar'">
              <!-- Sin campos adicionales -->
            </template>
          </div>
          <div v-if="laboralCod2.tipo_trabajador_codeudor2 && laboralCod2.tipo_trabajador_codeudor2 !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck :model-value="laboralCod2.tiene_dependientes_codeudor2" label="Tiene personas a cargo" @update:model-value="actualizarLaboralCod2('tiene_dependientes_codeudor2', $event)" />
            <CampoTexto v-if="laboralCod2.tiene_dependientes_codeudor2" :model-value="laboralCod2.numero_dependientes_codeudor2" label="Número de dependientes" type="number" :style="{ maxWidth: '200px' }" @update:model-value="actualizarLaboralCod2('numero_dependientes_codeudor2', $event)" />
          </div>
        </div>

        <!-- ── PASO 15: Financiera Codeudor 2 ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 15"
          :model-value="financieraCod2"
          titulo="Información financiera — Codeudor 2"
          :tipo-trabajador="laboralCod2.tipo_trabajador_codeudor2"
          @update:model-value="financieraCod2 = $event"
        />

        <!-- ── PASO 16: Patrimonio Codeudor 2 ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 16"
          :model-value="patrimonioCod2"
          titulo="Patrimonio — Codeudor 2"
          @update:model-value="patrimonioCod2 = $event"
        />

        <!-- ── PASO 17: Documentos ──────────────────────────────── -->
        <SeccionDocumentos
          v-if="paso === 17"
          :tipo-trabajador="laboral.tipo_trabajador"
          :modalidad-credito="general.modalidad_credito"
          :solicitud-id="solicitudId"
          @completado-cedula="urls => { documentos.doc_cedula_frente_url = urls.frente; documentos.doc_cedula_reverso_url = urls.reverso }"
          @sesion-creada="onSesionCapturaCreada"
          @url-soporte-laboral="url => { documentos.doc_soporte_laboral_url = url ?? '' }"
          @url-liquidacion-matricula="url => { documentos.doc_liquidacion_matricula_url = url ?? '' }"
        />

        <!-- ── PASO 18: Autorizaciones ────────────────────────── -->
        <div v-if="paso === 18" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)' }">Autorizaciones y declaraciones legales</div>

          <div :style="{
            border: '1px solid var(--color-border-card)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-xl)',
            background: 'var(--color-bg-card)',
            boxShadow: 'var(--shadow-card)',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-md)' }">
              <div>
                <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)' }">Autorizaciones y declaraciones legales</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)' }">Debe leer y aceptar los términos para continuar.</div>
              </div>
              <div :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                padding: 'var(--sp-sm) var(--sp-lg)',
                borderRadius: 'var(--r-pill)',
                background: autorizaciones.autorizacion_aceptada ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
                border: autorizaciones.autorizacion_aceptada ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
              }">
                <IconCircleCheck v-if="autorizaciones.autorizacion_aceptada" :size="16" :style="{ color: 'var(--color-success)' }" />
                <span :style="{
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
                  color: autorizaciones.autorizacion_aceptada ? 'var(--color-success-text)' : 'var(--color-text-3)',
                }">{{ autorizaciones.autorizacion_aceptada ? 'Aceptadas' : 'Pendiente' }}</span>
              </div>
            </div>

            <PortalButton
              variant="primary"
              :full="true"
              :style="{ marginTop: 'var(--sp-lg)' }"
              @click="modalAutorizacionesVisible = true"
            >
              <IconFileDescription :size="15" />
              {{ autorizaciones.autorizacion_aceptada ? 'Revisar autorizaciones' : 'Leer y aceptar autorizaciones' }}
            </PortalButton>
          </div>

          <ModalAutorizaciones
            v-model:visible="modalAutorizacionesVisible"
            :aceptado="autorizaciones.autorizacion_aceptada"
            @aceptar="autorizaciones.autorizacion_aceptada = true"
            @rechazar="autorizaciones.autorizacion_aceptada = false"
          />
        </div>

        <!-- ── PASO 19: Confirmación y firma ─────────────────── -->
        <div v-if="paso === 19" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <!-- Título -->
          <div :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-lg)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
          }">Revise su solicitud antes de firmar</div>

          <!-- ── Banner de campos vacíos ────────────────────────── -->
          <div v-if="alertasVacias.length > 0" :style="{ borderRadius: 'var(--r-md)', padding: 'var(--sp-md) var(--sp-lg)', background: '#fff8f0', border: '1px solid var(--color-impulso)', display: 'flex', gap: 'var(--sp-md)' }">
            <IconAlertTriangle :size="20" style="color: var(--color-impulso); flex-shrink: 0; margin-top: 2px;" />
            <div>
              <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-impulso)', marginBottom: 'var(--sp-xs)' }">
                Hay {{ alertasVacias.length }} campo{{ alertasVacias.length > 1 ? 's' : '' }} sin completar
              </div>
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xs)' }">
                <span
                  v-for="alerta in alertasVacias"
                  :key="alerta"
                  :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-impulso)', background: 'rgba(254,153,50,0.12)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }"
                >{{ alerta }}</span>
              </div>
            </div>
          </div>

          <!-- ── Tarjeta resumen reutilizable ─────────────────────── -->
          <!-- Solicitud -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Solicitud</span>
              <button @click="irAPaso(1)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                <IconPencil :size="11" />Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Modalidad</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_MODALIDAD, general.modalidad_credito) }}</div>
                </div>
                <div v-if="mostrarTipoOperacion" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de operación</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_OP, general.tipo_operacion) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: mostrarTipoOperacion ? '' : '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Monto solicitado</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--fw-extrabold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(general.valor_credito || general.valor_reestructura) || '—' }}</div>
                </div>
                <div v-if="mostrarValorDesembolso" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Valor desembolso</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--fw-extrabold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(general.valor_desembolso) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Plazo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ general.plazo_solicitado ? general.plazo_solicitado + ' meses' : '—' }}</div>
                </div>
                <!-- Educativo: tipo estudio + carrera -->
                <template v-if="esEducativo">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderTop: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de estudio</div>
                    <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_ESTUDIO, general.tipo_estudio) }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderTop: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Carrera o denominación</div>
                    <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ general.denominacion_carrera || '—' }}</div>
                  </div>
                </template>
                <!-- Ordinario: destino -->
                <div v-else :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Destino</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ general.destino_credito || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos personales -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Datos personales</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre completo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [persona.nombres, persona.apellidos].filter(Boolean).join(' ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, persona.tipo_documento) }} {{ persona.numero_identificacion }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo electrónico</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ persona.correo_electronico || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de nacimiento</div>
                  <div :style="sr(persona.fecha_nacimiento)">{{ formatFecha(persona.fecha_nacimiento) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de expedición</div>
                  <div :style="sr(persona.fecha_expedicion_documento)">{{ formatFecha(persona.fecha_expedicion_documento) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nivel educativo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_NIVEL_EDUCATIVO, persona.nivel_educativo_solicitante) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ciudad / Dpto.</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [ubicacionResidencia.municipio_nombre, ubicacionResidencia.depto_nombre].filter(Boolean).join(', ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Dirección</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ persona.direccion_residencia?.split(', ').slice(0, -1).join(', ') || persona.direccion_residencia || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Información laboral -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Información laboral</span>
              <button @click="irAPaso(6)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                <IconPencil :size="11" />Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <!-- Tipo de trabajador — fila completa -->
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', gridColumn: '1 / -1' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de trabajador</div>
                  <div :style="sr(laboral.tipo_trabajador)">{{ label(LABEL_TIPO_TRABAJADOR, laboral.tipo_trabajador) }}</div>
                </div>
                <!-- Empleado -->
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Empresa</div>
                    <div :style="sr(laboral.nombre_empresa)">{{ laboral.nombre_empresa || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Cargo / Oficio</div>
                    <div :style="sr(laboral.cargo_oficio)">{{ laboral.cargo_oficio || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de contrato</div>
                    <div :style="sr(laboral.tipo_contrato)">{{ label(LABEL_TIPO_CONTRATO, laboral.tipo_contrato) }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de ingreso</div>
                    <div :style="sr(laboral.fecha_ingreso)">{{ formatFecha(laboral.fecha_ingreso) || '—' }}</div>
                  </div>
                </template>
                <!-- Independiente -->
                <template v-else-if="laboral.tipo_trabajador === 'independiente'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Actividad comercial</div>
                    <div :style="sr(laboral.actividad_comercial)">{{ laboral.actividad_comercial || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ocupación</div>
                    <div :style="sr(laboral.ocupacion)">{{ laboral.ocupacion || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Inicio de actividad</div>
                    <div :style="sr(laboral.fecha_inicio_actividad)">{{ formatFecha(laboral.fecha_inicio_actividad) || '—' }}</div>
                  </div>
                  <div :style="{ borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }" />
                </template>
                <!-- Pensionado -->
                <template v-else-if="laboral.tipo_trabajador === 'pensionado'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Entidad pagadora</div>
                    <div :style="sr(laboral.entidad_pagadora)">{{ laboral.entidad_pagadora || '—' }}</div>
                  </div>
                  <div :style="{ borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }" />
                </template>
                <!-- Estudiante -->
                <template v-else-if="laboral.tipo_trabajador === 'estudiante'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Institución educativa</div>
                    <div :style="sr(laboral.institucion_educativa)">{{ laboral.institucion_educativa || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nivel de estudio</div>
                    <div :style="sr(laboral.nivel_educativo)">{{ label(LABEL_NIVEL_EDUCATIVO, laboral.nivel_educativo) }}</div>
                  </div>
                </template>
                <!-- Dependientes -->
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tiene dependientes</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ laboral.tiene_dependientes ? (laboral.numero_dependientes ? laboral.numero_dependientes + ' dependiente(s)' : 'Sí') : 'No' }}</div>
                </div>
                <div :style="{ borderLeft: '1px solid var(--color-border)' }" />
              </div>
            </div>
          </div>

          <!-- Situación financiera -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Situación financiera y patrimonio</span>
              <button @click="irAPaso(11)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                <IconPencil :size="11" />Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Salario / Ingresos fijos</div>
                  <div :style="sr(financiera.salario_ingresos_fijos)">{{ formatMonto(financiera.salario_ingresos_fijos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Otros ingresos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.ingresos_independiente) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Gastos familiares</div>
                  <div :style="sr(financiera.gastos_familiares)">{{ formatMonto(financiera.gastos_familiares) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Obligaciones financieras</div>
                  <div :style="sr(financiera.obligaciones_financieras)">{{ formatMonto(financiera.obligaciones_financieras) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Otros gastos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.otros_gastos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fuente de ingresos</div>
                  <div :style="sr(financiera.fuente_ingresos)">{{ financiera.fuente_ingresos || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Propiedad raíz</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ patrimonio.tiene_propiedad_raiz ? (formatMonto(patrimonio.valor_propiedad_raiz) || 'Sí') : 'No' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Vehículo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ patrimonio.tiene_vehiculo ? (formatMonto(patrimonio.valor_vehiculo) || 'Sí') : 'No' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuenta de desembolso (condicional) -->
          <div v-if="mostrarCuentaDesembolso" :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Cuenta de desembolso</span>
              <button @click="irAPaso(14)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                <IconPencil :size="11" />Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: cuenta.cuenta_tercero ? '1px solid var(--color-border)' : '' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_CUENTA, cuenta.tipo_cuenta) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)', borderBottom: cuenta.cuenta_tercero ? '1px solid var(--color-border)' : '' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Entidad bancaria</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.entidad_bancaria === 'otro' ? (cuenta.entidad_bancaria_otro || 'Otra entidad') : (cuenta.entidad_bancaria || '—') }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)', borderBottom: cuenta.cuenta_tercero ? '1px solid var(--color-border)' : '' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Número de cuenta</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.numero_cuenta || '—' }}</div>
                </div>
              </div>
              <!-- Tercero -->
              <div v-if="cuenta.cuenta_tercero" :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Titular de la cuenta</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.nombre_tercero || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo doc. titular</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, cuenta.tipo_doc_tercero) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento titular</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.numero_doc_tercero || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Codeudor 1 (condicional) -->
          <div v-if="numCodudores >= 1" :style="{ marginTop: 'var(--sp-2xl)' }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }">
              <div :style="{ height: '1px', flex: 1, background: 'var(--color-border)' }" />
              <div :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }">Información del Codeudor 1</div>
              <div :style="{ height: '1px', flex: 1, background: 'var(--color-border)' }" />
            </div>
            <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
              <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Datos Personales - Codeudor 1</span>
                <button @click="irAPaso(15)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                  <IconPencil :size="11" />Editar
                </button>
              </div>
              <div :style="{ background: 'var(--color-bg-surface)' }">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre</div>
                    <div :style="sr(personaCod1.nombres_codeudor)">{{ [personaCod1.nombres_codeudor, personaCod1.apellidos_codeudor].filter(Boolean).join(' ') || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                    <div :style="sr(personaCod1.numero_identificacion_codeudor)">{{ label(LABEL_TIPO_DOC, personaCod1.tipo_documento_codeudor) }} {{ personaCod1.numero_identificacion_codeudor }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo</div>
                    <div :style="sr(personaCod1.correo_codeudor)">{{ personaCod1.correo_codeudor || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de nacimiento</div>
                    <div :style="sr(personaCod1.fecha_nacimiento_codeudor)">{{ formatFecha(personaCod1.fecha_nacimiento_codeudor) || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de trabajador</div>
                    <div :style="sr(laboralCod1.tipo_trabajador_codeudor)">{{ label(LABEL_TIPO_TRABAJADOR, laboralCod1.tipo_trabajador_codeudor) }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ciudad / Dpto.</div>
                    <div :style="sr(ubicacionCod1.municipio_nombre)">{{ [ubicacionCod1.municipio_nombre, ubicacionCod1.depto_nombre].filter(Boolean).join(', ') || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Dirección</div>
                    <div :style="sr(personaCod1.direccion_codeudor)">{{ personaCod1.direccion_codeudor?.split(', ').slice(0, -1).join(', ') || personaCod1.direccion_codeudor || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ingresos</div>
                    <div :style="sr(financieraCod1.salario_codeudor || financieraCod1.ingresos_independiente_codeudor)">{{ formatMonto(financieraCod1.salario_codeudor || financieraCod1.ingresos_independiente_codeudor) || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Codeudor 2 (condicional) -->
          <div v-if="numCodudores >= 2" :style="{ marginTop: 'var(--sp-2xl)' }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }">
              <div :style="{ height: '1px', flex: 1, background: 'var(--color-border)' }" />
              <div :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }">Información del Codeudor 2</div>
              <div :style="{ height: '1px', flex: 1, background: 'var(--color-border)' }" />
            </div>
            <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
              <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Datos Personales - Codeudor 2</span>
                <button @click="irAPaso(16)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                  <IconPencil :size="11" />Editar
                </button>
              </div>
              <div :style="{ background: 'var(--color-bg-surface)' }">
                <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre</div>
                    <div :style="sr(personaCod2.nombres_codeudor2)">{{ [personaCod2.nombres_codeudor2, personaCod2.apellidos_codeudor2].filter(Boolean).join(' ') || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                    <div :style="sr(personaCod2.numero_identificacion_codeudor2)">{{ label(LABEL_TIPO_DOC, personaCod2.tipo_documento_codeudor2) }} {{ personaCod2.numero_identificacion_codeudor2 }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo</div>
                    <div :style="sr(personaCod2.correo_codeudor2)">{{ personaCod2.correo_codeudor2 || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de nacimiento</div>
                    <div :style="sr(personaCod2.fecha_nacimiento_codeudor2)">{{ formatFecha(personaCod2.fecha_nacimiento_codeudor2) || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de trabajador</div>
                    <div :style="sr(laboralCod2.tipo_trabajador_codeudor2)">{{ label(LABEL_TIPO_TRABAJADOR, laboralCod2.tipo_trabajador_codeudor2) }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ciudad / Dpto.</div>
                    <div :style="sr(ubicacionCod2.municipio_nombre)">{{ [ubicacionCod2.municipio_nombre, ubicacionCod2.depto_nombre].filter(Boolean).join(', ') || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Dirección</div>
                    <div :style="sr(personaCod2.direccion_codeudor2)">{{ personaCod2.direccion_codeudor2?.split(', ').slice(0, -1).join(', ') || personaCod2.direccion_codeudor2 || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ingresos</div>
                    <div :style="sr(financieraCod2.salario_codeudor2 || financieraCod2.ingresos_independiente_codeudor2)">{{ formatMonto(financieraCod2.salario_codeudor2 || financieraCod2.ingresos_independiente_codeudor2) || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }" />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tarjeta de Documentos Adjuntos ──────────────── -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Documentos Adjuntos</span>
              <button @click="irAPaso(5)" :style="{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }">
                <IconPencil :size="11" />Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)', padding: 'var(--sp-lg)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-md)' }">
                <div v-for="doc in docResumen" :key="doc.label" :style="{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                  padding: 'var(--sp-sm) var(--sp-md)',
                  borderRadius: 'var(--r-md)',
                  background: doc.url ? 'rgba(39,174,96,0.05)' : 'rgba(214,61,61,0.05)',
                  border: `1px solid ${doc.url ? 'rgba(39,174,96,0.2)' : 'rgba(214,61,61,0.2)'}`
                }">
                  <IconCircleCheck v-if="doc.url" :size="16" style="color: var(--color-success);" />
                  <IconAlertTriangle v-else :size="16" style="color: var(--color-error);" />
                  <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: doc.url ? 'var(--color-text-1)' : 'var(--color-error)', flex: 1 }">{{ doc.label }}</span>
                  <span v-if="doc.url" :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--fw-bold)' }">SUBIDO</span>
                  <span v-else :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 'var(--fw-bold)' }">PENDIENTE</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Firma digital ─────────────────────────────────── -->
          <div :style="{
            borderRadius: 'var(--r-md)',
            border:       '2px solid var(--color-accent)',
            overflow:     'hidden',
          }">
            <div :style="{
              padding:    'var(--sp-sm) var(--sp-lg)',
              background: 'var(--color-accent)',
              display:    'flex',
              alignItems: 'center',
              gap:        'var(--sp-xs)',
            }">
              <IconShieldCheck :size="16" style="color: var(--color-dark);" />
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-dark)', textTransform: 'uppercase', letterSpacing: '0.07em' }">Firma digital</span>
            </div>
            <div :style="{
              padding:        'var(--sp-lg)',
              background:     'var(--color-bg-surface)',
              display:        'flex',
              flexDirection:  'column',
              gap:            'var(--sp-md)',
            }">
              <div :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-text-2)',
                lineHeight: '1.6',
              }">
                Al escribir su nombre completo confirma que ha revisado toda la información, que es veraz y que autoriza a
                <strong :style="{ color: 'var(--color-primary)' }">Cooperamigó</strong> a procesarla para el estudio de su solicitud.
              </div>
              <CampoTexto
                label="Nombre completo (firma)"
                placeholder="Escriba su nombre y apellidos tal como aparecen en su documento"
                :model-value="firma.nombre_firma"
                @update:model-value="firma.nombre_firma = $event"
              />
              <div :style="{
                fontSize:     'var(--text-xs)',
                color:        'var(--color-text-3)',
                fontWeight:   'var(--fw-medium)',
                lineHeight:   '1.6',
                paddingTop:   'var(--sp-xs)',
                borderTop:    '1px solid var(--color-border)',
              }">
                Un asesor de Cooperamigó se comunicará con usted en los próximos días hábiles para continuar con el proceso.
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Error general -->
      <div v-if="error" :style="{
        background:   'var(--color-error-bg)',
        color:        'var(--color-error-text)',
        padding:      'var(--sp-md) var(--sp-lg)',
        borderRadius: 'var(--r-lg)',
        fontSize:     'var(--text-base)',
        fontWeight:   'var(--fw-medium)',
        marginBottom: 'var(--sp-lg)',
      }">{{ error }}</div>

      <!-- Navegación -->
      <div :style="{
        display:        'flex',
        flexDirection:  isMobile ? 'column-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems:     'stretch',
        gap:            'var(--sp-md)',
        marginTop:      'var(--sp-2xl)',
      }">
        <PortalButton
          variant="secondary"
          :full="isMobile"
          @click="paso === pasosActivos[0]?.numero ? router.push('/') : anterior()"
        >
          {{ paso === pasosActivos[0]?.numero ? 'Cancelar' : 'Anterior' }}
        </PortalButton>
        <PortalButton
          v-if="!esUltimoPaso"
          variant="primary"
          :loading="loading"
          :disabled="
            (paso === 1 && (!general.modalidad_credito || (mostrarTipoOperacion && !general.tipo_operacion))) ||
            (paso === 2 && !pasoSolicitudValido) ||
            (paso === 3 && esMenorDeEdad) ||
            (paso === 18 && !autorizaciones.autorizacion_aceptada)
          "
          :full="isMobile"
          @click="siguiente()"
        >
          Siguiente
        </PortalButton>
        <PortalButton
          v-if="esUltimoPaso"
          variant="primary"
          :loading="loading"
          :full="isMobile"
          @click="enviar()"
        >
          Enviar solicitud
        </PortalButton>
      </div>

    </div>

    <!-- ═══ MODAL — Asociado no encontrado ══════════════════ -->
    <Teleport to="body">
      <Transition :name="isMobile ? 'sheet-modal' : 'fade-modal'">
        <div
          v-if="mostrarModalNoAsociado"
          :style="{
            position:       'fixed',
            inset:          '0',
            zIndex:         '60',
            display:        'flex',
            alignItems:     isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding:        isMobile ? '0' : 'var(--sp-lg)',
          }"
        >
          <!-- Backdrop -->
          <div :style="{
            position:       'absolute',
            inset:          '0',
            background:     'rgba(23,43,54,0.5)',
            backdropFilter: 'blur(3px)',
          }" @click="mostrarModalNoAsociado = false" />

          <!-- Card del modal -->
          <div :style="{
            position:     'relative',
            width:        '100%',
            maxWidth:     isMobile ? '100%' : '480px',
            background:   'var(--color-bg-card)',
            borderRadius: isMobile ? 'var(--r-2xl) var(--r-2xl) 0 0' : 'var(--r-2xl)',
            boxShadow:    'var(--shadow-modal)',
            padding:      isMobile ? 'var(--sp-md) var(--sp-lg) var(--sp-2xl)' : 'var(--sp-2xl)',
            maxHeight:    isMobile ? '55vh' : 'none',
            overflowY:    isMobile ? 'auto' : 'visible',
            animation:    isMobile
              ? 'entrarModalSheet 0.35s cubic-bezier(0.32,0.72,0,1) both'
              : 'entrarModal 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }">
            <!-- Handle (solo mobile) -->
            <div v-if="isMobile" :style="{
              width:        '40px',
              height:       '4px',
              borderRadius: 'var(--r-pill)',
              background:   'var(--color-border)',
              margin:       '0 auto var(--sp-lg)',
            }" />

            <!-- Icono -->
            <div :style="{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-lg)',
              flexShrink: '0',
            }">
              <IconUserX :size="30" :style="{ color: 'var(--color-warning-text)' }" />
            </div>

            <!-- Título + descripción -->
            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily:   'var(--font-display)',
                fontSize:     'var(--text-lg)',
                fontWeight:   'var(--fw-extrabold)',
                color:        'var(--color-text-1)',
                marginBottom: 'var(--sp-sm)',
              }">Documento no encontrado</div>
              <div :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: '1.6',
              }">
                El documento
                <strong :style="{ color: 'var(--color-text-1)' }">{{ verificacion.numero_documento }}</strong>
                no se encuentra en la base de asociados de Cooperamigó. Recuerde que, para el trámite de créditos, debe ser asociado activo de la entidad.
              </div>
            </div>

            <!-- Divisor -->
            <div :style="{
              height:     '1px',
              background: 'var(--color-border)',
              margin:     'var(--sp-lg) 0',
            }" />

            <!-- Acciones -->
            <div :style="{
              display:        'flex',
              flexDirection:  isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
              gap:            'var(--sp-sm)',
            }">
              <PortalButton variant="secondary" :full="isMobile" @click="mostrarModalNoAsociado = false">
                Volver e intentar
              </PortalButton>
              <PortalButton variant="primary" :full="isMobile" @click="router.push({ path: '/', query: { vista: 'no-asociado' } })">
                Gestionar afiliación
              </PortalButton>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes entrarModal {
  from {
    opacity:   0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity:   1;
    transform: translateY(0) scale(1);
  }
}

@keyframes entrarModalSheet {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* Transición desktop */
.fade-modal-enter-active { transition: opacity 0.2s ease; }
.fade-modal-leave-active { transition: opacity 0.15s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to     { opacity: 0; }

/* Transición bottom sheet mobile */
.sheet-modal-enter-active { transition: opacity 0.3s ease; }
.sheet-modal-leave-active { transition: opacity 0.2s ease; }
.sheet-modal-enter-from,
.sheet-modal-leave-to     { opacity: 0; }
</style>
