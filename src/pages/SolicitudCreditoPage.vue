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
  IconUserX, IconMail, IconRotate, IconUsers, IconUserCheck, IconFileDescription,
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
  { label: 'Formulario' },
  { label: 'Revisión'  },
]

const seccionActual = computed(() => {
  if (paso.value === 1) return 1
  if (paso.value === 2) return 2
  if (paso.value === 3) return 3
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

    <!-- ═══ FORMULARIO ACTIVO (3 pasos) ════════════════════ -->
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

      <StepIndicator :pasos="secciones" :actual="seccionActual" />

      <!-- Título del paso + barra de progreso -->
      <div :style="{ marginBottom: 'var(--sp-xl)', marginTop: 'var(--sp-lg)' }">
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

        <!-- ── PASO 2: Formulario Completo (Estilo PDF) ───────── -->
        <div v-if="paso === 2" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-2xl)',
        }">

          <!-- 1. Información de la Solicitud -->
          <div id="seccion-solicitud" :style="{
            background:   'var(--color-bg-card)',
            border:       '1px solid var(--color-border-card)',
            borderRadius: 'var(--r-xl)',
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
              <CampoMoneda
                v-if="mostrarValorCredito"
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
                        <input :value="general.plazo_solicitado" type="number" :style="{ flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--color-text-1)' }" @input="actualizarPlazo($event.target.value)" />
                        <label :style="{ position: 'absolute', left: '12px', top: '0', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-3)', background: 'var(--color-bg-card)', padding: '0 3px' }">Plazo (meses) *</label>
                      </div>
                    </div>
                  </div>
                  <CampoTexto :model-value="general.denominacion_carrera" label="Carrera o denominación" required @update:model-value="actualizarGeneral('denominacion_carrera', $event)" />
                </template>
                <div v-else :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '7fr 3fr', gap: 'var(--sp-lg)' }">
                  <CampoTexto :model-value="general.destino_credito" label="Destino del crédito" required @update:model-value="actualizarGeneral('destino_credito', $event)" />
                  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
                    <div :style="{ position: 'relative', display: 'flex', alignItems: 'center', padding: '12px 14px', border: errorPlazo ? '1px solid var(--color-error)' : '1px solid var(--color-border)', borderRadius: 'var(--r-lg)', background: 'var(--color-bg-card)' }">
                      <input :value="general.plazo_solicitado" type="number" :style="{ flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--color-text-1)' }" @input="actualizarPlazo($event.target.value)" />
                      <label :style="{ position: 'absolute', left: '12px', top: '0', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-3)', background: 'var(--color-bg-card)', padding: '0 3px' }">Plazo (meses) *</label>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 2. Información del Solicitante -->
          <SeccionPersona id="seccion-persona" :model-value="persona" titulo="Información del solicitante" :bloquear-documento="true" :bloquear-correo="true" :direccion-estructurada="direccionEstructurada" :ubicacion="ubicacionResidencia" :show-nivel-educativo="true" @update:model-value="persona = $event" @update:direccion-estructurada="direccionEstructurada = $event" @update:ubicacion="ubicacionResidencia = $event" />

          <!-- Bloqueo por menor de edad -->
          <div v-if="esMenorDeEdad" :style="{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-md)', padding: 'var(--sp-lg) var(--sp-xl)', borderRadius: 'var(--r-md)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/></svg>
            <div>
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-error-text)', fontSize: 'var(--text-base)', marginBottom: 'var(--sp-2xs)' }">No es posible continuar con la solicitud</div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-error-text)', fontWeight: 'var(--fw-medium)', lineHeight: '1.5' }">El solicitante debe ser mayor de 18 años para acceder a productos de crédito.</div>
            </div>
          </div>

          <!-- 3. Información Laboral -->
          <div id="seccion-laboral" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconRotate :size="20" /> Información laboral
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <SelectorTipoTrabajador :model-value="laboral.tipo_trabajador" @update:model-value="actualizarLaboral('tipo_trabajador', $event)" />
              <div v-if="laboral.tipo_trabajador" :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <CampoTexto :model-value="laboral.nombre_empresa" label="Nombre de la empresa" required @update:model-value="actualizarLaboral('nombre_empresa', $event)" />
                  <CampoTexto :model-value="laboral.cargo_oficio" label="Cargo u oficio" required @update:model-value="actualizarLaboral('cargo_oficio', $event)" />
                  <CampoSelectBuscable :model-value="laboral.tipo_contrato" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboral('tipo_contrato', $event)" />
                  <SelectorFecha :model-value="laboral.fecha_ingreso" label="Fecha de ingreso" required @update:model-value="actualizarLaboral('fecha_ingreso', $event)" />
                </template>
                <template v-if="laboral.tipo_trabajador === 'independiente'">
                  <CampoTexto :model-value="laboral.actividad_comercial" label="Actividad comercial" required @update:model-value="actualizarLaboral('actividad_comercial', $event)" />
                  <CampoTexto :model-value="laboral.ocupacion" label="Ocupación" required @update:model-value="actualizarLaboral('ocupacion', $event)" />
                  <SelectorFecha :model-value="laboral.fecha_inicio_actividad" label="Fecha de inicio" required @update:model-value="actualizarLaboral('fecha_inicio_actividad', $event)" />
                </template>
                <template v-if="laboral.tipo_trabajador === 'pensionado'">
                  <CampoSelectBuscable :model-value="laboral.entidad_pagadora" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" :style="{ gridColumn: '1 / -1' }" @update:model-value="actualizarLaboral('entidad_pagadora', $event)" />
                </template>
                <template v-if="laboral.tipo_trabajador === 'estudiante'">
                  <CampoTexto :model-value="laboral.institucion_educativa" label="Institución educativa" required @update:model-value="actualizarLaboral('institucion_educativa', $event)" />
                  <CampoSelectBuscable :model-value="laboral.nivel_educativo" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboral('nivel_educativo', $event)" />
                </template>
              </div>
              <div v-if="laboral.tipo_trabajador && laboral.tipo_trabajador !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
                <CampoCheck :model-value="laboral.tiene_dependientes" label="Tengo personas a cargo" @update:model-value="actualizarLaboral('tiene_dependientes', $event)" />
                <CampoTexto v-if="laboral.tiene_dependientes" :model-value="laboral.numero_dependientes" label="Número de dependientes" type="number" :style="{ maxWidth: '200px' }" @update:model-value="actualizarLaboral('numero_dependientes', $event)" />
              </div>
            </div>
          </div>

          <!-- 4. Información Financiera -->
          <SeccionFinanciera id="seccion-financiera" :model-value="financiera" titulo="Información financiera" :salario-bloqueado="salarioBloqueado" :tipo-trabajador="laboral.tipo_trabajador" @update:model-value="financiera = $event" />

          <!-- 5. Patrimonio -->
          <SeccionPatrimonio id="seccion-patrimonio" :model-value="patrimonio" titulo="Patrimonio" @update:model-value="patrimonio = $event" />

          <!-- 6. Cuenta de Desembolso -->
          <div v-if="mostrarCuentaDesembolso" id="seccion-cuenta" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconFileCheck :size="20" /> Cuenta de desembolso
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
              <CampoSelectBuscable :model-value="cuenta.tipo_cuenta" label="Tipo de cuenta" required :opciones="opsTipoCuenta" @update:model-value="actualizarCuenta('tipo_cuenta', $event)" />
              <CampoSelectBuscable :model-value="cuenta.entidad_bancaria" label="Entidad bancaria" required :disabled="!cuenta.tipo_cuenta" :limit="0" :opciones="[...ENTIDADES_BANCARIAS.map(e => ({ value: e, label: e })), { value: 'otro', label: 'Otra entidad' }]" @update:model-value="actualizarCuenta('entidad_bancaria', $event)" />
              <CampoTexto v-if="cuenta.entidad_bancaria === 'otro'" :model-value="cuenta.entidad_bancaria_otro" label="Especifique entidad" required @update:model-value="actualizarCuenta('entidad_bancaria_otro', $event)" />
              <CampoTexto :model-value="cuenta.numero_cuenta" label="Número de cuenta" required solo-numeros :maxlength="18" :disabled="!cuenta.entidad_bancaria" @update:model-value="actualizarCuenta('numero_cuenta', $event)" />
              <CampoCheck :model-value="cuenta.cuenta_tercero" label="La cuenta pertenece a un tercero" @update:model-value="actualizarCuenta('cuenta_tercero', $event)" />
              <template v-if="cuenta.cuenta_tercero">
                <div :style="{ padding: 'var(--sp-xl)', borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', display: 'flex', flexDirection:'column', gap: 'var(--sp-lg)' }">
                  <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }">Datos del titular</div>
                  <CampoTexto :model-value="cuenta.nombre_tercero" label="Nombre completo" required @update:model-value="actualizarCuenta('nombre_tercero', $event)" />
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
                    <CampoSelect :model-value="cuenta.tipo_doc_tercero" label="Tipo documento" required :opciones="opsTipoDocTitular" @update:model-value="actualizarCuenta('tipo_doc_tercero', $event)" />
                    <CampoTexto :model-value="cuenta.numero_doc_tercero" label="Número documento" required solo-numeros @update:model-value="actualizarCuenta('numero_doc_tercero', $event)" />
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 7. Codeudores -->
          <div id="seccion-codeudores" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
            <div :style="{ padding: 'var(--sp-md) var(--sp-xl)', background: 'var(--color-primary)', color: 'white', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconUsers :size="20" /> ¿Desea agregar codeudores?
            </div>
            <div :style="{ padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 'var(--sp-md)' }">
                <div v-for="opcion in [{ num: 0, titulo: 'Sin codeudor' }, { num: 1, titulo: '1 Codeudor' }, { num: 2, titulo: '2 Codeudores' }]" :key="opcion.num" :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-xl)', borderRadius: 'var(--r-md)', border: numCodudores === opcion.num ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: numCodudores === opcion.num ? 'var(--color-primary-light)' : 'var(--color-bg-surface)', cursor: 'pointer' }" @click="numCodudores = opcion.num">
                  <IconUsers :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-1)' }">{{ opcion.titulo }}</div>
                </div>
              </div>
              <template v-if="numCodudores >= 1">
                <SeccionPersona :model-value="personaCod1" titulo="Datos del codeudor 1" :es-codeudor="true" :direccion-estructurada="direccionEstructuradaCod1" :ubicacion="ubicacionCod1" @update:model-value="personaCod1 = $event" @update:direccion-estructurada="direccionEstructuradaCod1 = $event" @update:ubicacion="ubicacionCod1 = $event" />
              </template>
              <template v-if="numCodudores >= 2">
                <SeccionPersona :model-value="personaCod2" titulo="Datos del codeudor 2" :es-codeudor="true" :direccion-estructurada="direccionEstructuradaCod2" :ubicacion="ubicacionCod2" @update:model-value="personaCod2 = $event" @update:direccion-estructurada="direccionEstructuradaCod2 = $event" @update:ubicacion="ubicacionCod2 = $event" />
              </template>
            </div>
          </div>

          <!-- 8. Documentos -->
          <SeccionDocumentos id="seccion-documentos" :tipo-trabajador="laboral.tipo_trabajador" :modalidad-credito="general.modalidad_credito" :solicitud-id="solicitudId" @completado-cedula="urls => { documentos.doc_cedula_frente_url = urls.frente; documentos.doc_cedula_reverso_url = urls.reverso }" @sesion-creada="onSesionCapturaCreada" @url-soporte-laboral="url => { documentos.doc_soporte_laboral_url = url ?? '' }" @url-liquidacion-matricula="url => { documentos.doc_liquidacion_matricula_url = url ?? '' }" />

          <!-- 9. Autorizaciones -->
          <div id="seccion-autorizaciones" :style="{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }">
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

        <!-- ── PASO 3: Revisión y firma ─────────────────── -->
        <div v-if="paso === 3" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

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
              <button @click="irASeccion('seccion-solicitud')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
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
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--primary-color)', fontWeight: 'var(--fw-extrabold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(general.valor_desembolso) || '—' }}</div>
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
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Datos personales</span>
              <button @click="irASeccion('seccion-persona')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
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
              <button @click="irASeccion('seccion-laboral')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', gridColumn: '1 / -1' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de trabajador</div>
                  <div :style="sr(laboral.tipo_trabajador)">{{ label(LABEL_TIPO_TRABAJADOR, laboral.tipo_trabajador) }}</div>
                </div>
                <template v-if="laboral.tipo_trabajador === 'empleado'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Empresa</div>
                    <div :style="sr(laboral.nombre_empresa)">{{ laboral.nombre_empresa || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Cargo</div>
                    <div :style="sr(laboral.cargo_oficio)">{{ laboral.cargo_oficio || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Tipo contrato</div>
                    <div :style="sr(laboral.tipo_contrato)">{{ label(LABEL_TIPO_CONTRATO, laboral.tipo_contrato) }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Fecha ingreso</div>
                    <div :style="sr(laboral.fecha_ingreso)">{{ formatFecha(laboral.fecha_ingreso) || '—' }}</div>
                  </div>
                </template>
                <template v-if="laboral.tipo_trabajador === 'independiente'">
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Actividad</div>
                    <div :style="sr(laboral.actividad_comercial)">{{ laboral.actividad_comercial || '—' }}</div>
                  </div>
                  <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Ocupación</div>
                    <div :style="sr(laboral.ocupacion)">{{ laboral.ocupacion || '—' }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Información financiera -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Información financiera</span>
              <button @click="irASeccion('seccion-financiera')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Ingresos fijos</div>
                  <div :style="sr(financiera.salario_ingresos_fijos)">{{ formatMonto(financiera.salario_ingresos_fijos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Otros ingresos</div>
                  <div :style="sr(financiera.ingresos_independiente)">{{ formatMonto(financiera.ingresos_independiente) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Gastos familiares</div>
                  <div :style="sr(financiera.gastos_familiares)">{{ formatMonto(financiera.gastos_familiares) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Obligaciones</div>
                  <div :style="sr(financiera.obligaciones_financieras)">{{ formatMonto(financiera.obligaciones_financieras) || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Patrimonio -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Patrimonio</span>
              <button @click="irASeccion('seccion-patrimonio')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Propiedad raíz</div>
                  <div :style="sr(patrimonio.tiene_propiedad_raiz)">{{ patrimonio.tiene_propiedad_raiz ? formatMonto(patrimonio.valor_propiedad_raiz) : 'No tiene' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Vehículo</div>
                  <div :style="sr(patrimonio.tiene_vehiculo)">{{ patrimonio.tiene_vehiculo ? formatMonto(patrimonio.valor_vehiculo) : 'No tiene' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuenta de desembolso -->
          <div v-if="mostrarCuentaDesembolso" :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Cuenta de desembolso</span>
              <button @click="irASeccion('seccion-cuenta')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Banco</div>
                  <div :style="sr(cuenta.entidad_bancaria)">{{ cuenta.entidad_bancaria === 'otro' ? cuenta.entidad_bancaria_otro : cuenta.entidad_bancaria || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Tipo / Número</div>
                  <div :style="sr(cuenta.numero_cuenta)">{{ label(LABEL_TIPO_CUENTA, cuenta.tipo_cuenta) }} {{ cuenta.numero_cuenta }}</div>
                </div>
                <div v-if="cuenta.cuenta_tercero" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', gridColumn: '1 / -1' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Titular (Tercero)</div>
                  <div :style="sr(cuenta.nombre_tercero)">{{ cuenta.nombre_tercero }} ({{ label(LABEL_TIPO_DOC, cuenta.tipo_doc_tercero) }} {{ cuenta.numero_doc_tercero }})</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Codeudores -->
          <div v-if="numCodudores > 0" :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Codeudores ({{ numCodudores }})</span>
              <button @click="irASeccion('seccion-codeudores')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div v-if="numCodudores >= 1" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: numCodudores > 1 ? '1px solid var(--color-border)' : 'none' }">
                <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Codeudor 1</div>
                <div :style="sr(personaCod1.nombres_codeudor)">{{ [personaCod1.nombres_codeudor, personaCod1.apellidos_codeudor].filter(Boolean).join(' ') || '—' }}</div>
              </div>
              <div v-if="numCodudores >= 2" :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)' }">Codeudor 2</div>
                <div :style="sr(personaCod2.nombres_codeudor2)">{{ [personaCod2.nombres_codeudor2, personaCod2.apellidos_codeudor2].filter(Boolean).join(' ') || '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Documentos -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Documentos</span>
              <button @click="irASeccion('seccion-documentos')" :style="{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }">
                <IconPencil :size="14" /> Editar
              </button>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)', padding: 'var(--sp-sm) var(--sp-lg)' }">
              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }">
                <div v-for="doc in docResumen" :key="doc.label" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', background: 'var(--color-bg-card)', padding: '4px 10px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)' }">
                  <IconFile :size="14" :style="{ color: doc.url ? 'var(--color-success)' : 'var(--color-text-3)' }" />
                  <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: doc.url ? 'var(--color-text-1)' : 'var(--color-text-3)' }">{{ doc.label }}</span>
                  <IconCheck v-if="doc.url" :size="12" style="color: var(--color-success)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Firma digital -->
          <div :style="{ borderRadius: 'var(--r-md)', border: '2px solid var(--color-accent)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)' }">
              <IconShieldCheck :size="16" style="color: var(--color-dark);" />
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-dark)', textTransform: 'uppercase', letterSpacing: '0.07em' }">Firma digital</span>
            </div>
            <div :style="{ padding: 'var(--sp-lg)', background: 'var(--color-bg-surface)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
              <CampoTexto label="Nombre completo (firma)" placeholder="Escriba su nombre completo" :model-value="firma.nombre_firma" @update:model-value="firma.nombre_firma = $event" />
            </div>
          </div>
        </div>
      </div>

      <!-- Navegación -->
      <div :style="{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-2xl)', gap: 'var(--sp-md)' }">
        <PortalButton variant="secondary" @click="paso === 1 ? router.push('/') : anterior()">{{ paso === 1 ? 'Cancelar' : 'Anterior' }}</PortalButton>
        <PortalButton v-if="!esUltimoPaso" variant="primary" :loading="loading" :disabled="(paso === 1 && !general.modalidad_credito) || (paso === 2 && !pasoSolicitudValido)" @click="siguiente()">Siguiente</PortalButton>
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