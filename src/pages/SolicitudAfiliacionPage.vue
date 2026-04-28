<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout       from '@/components/layout/PortalLayout.vue'
import StepIndicator      from '@/components/ui/StepIndicator.vue'
import PortalButton       from '@/components/ui/PortalButton.vue'
import AlertaBanner       from '@/components/ui/AlertaBanner.vue'
import CampoTexto         from '@/components/forms/CampoTexto.vue'
import CampoSelect        from '@/components/forms/CampoSelect.vue'
import CampoSelectBuscable from '@/components/forms/CampoSelectBuscable.vue'
import CampoMoneda        from '@/components/forms/CampoMoneda.vue'
import CampoCheck         from '@/components/forms/CampoCheck.vue'
import ModalOtpEmail      from '@/components/forms/ModalOtpEmail.vue'
import SelectorFecha      from '@/components/forms/SelectorFecha.vue'
import ModalDireccion     from '@/components/forms/ModalDireccion.vue'
import SelectorDeptoMunicipio from '@/components/forms/SelectorDeptoMunicipio.vue'
import SelectorTipoTrabajador from '@/components/forms/SelectorTipoTrabajador.vue'
import SeccionFinanciera   from '@/components/forms/SeccionFinanciera.vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'
import { useAfiliacion }  from '@/composables/useAfiliacion'
import { useBreakpoint }  from '@/composables/useBreakpoint'
import { subirDocumentoSolicitud, obtenerMensajeErrorSubidaDocumento } from '@/services/documentos.service'
import { IconCircleCheck, IconUserCheck, IconCheck, IconMapPin, IconX, IconUpload, IconEye, IconRefresh, IconFileDescription, IconLoader2, IconRotateClockwise2 } from '@tabler/icons-vue'
import { ENTIDADES_PENSIONES, TIPOS_CONTRATO } from '@/data/formularioCredito'

const router = useRouter()
const { isMobile } = useBreakpoint()

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  tipoDocumentoInicial, numeroDocumentoInicial, errorNumeroDoc,
  aceptaAutorizacion, loadingVerificacion, mostrarModalYaAsociado,
  oficina, fechaSolicitud, tipoSolicitud,
  datosPersonales, datosLaborales,
  actividadIndependiente, datosFinancieros, activosPasivos,
  datosConyuge, referencias, declaraciones,
  documentos,
  pasoValido, necesitaConyuge, esIndependiente,
  validarCampoActual, schemaPersonales,
  verificarYContinuar, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud,
} = useAfiliacion()

function normalizarStorageKey(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const documentosKey = computed(() => {
  const cedula = String(numeroDocumentoInicial.value || datosPersonales.value.cedula || '').trim()
  if (cedula) return `afiliacion_${normalizarStorageKey(cedula)}`
  const email = String(emailInicial.value || '').trim()
  if (email) return `afiliacion_${normalizarStorageKey(email)}`
  return 'afiliacion'
})

const soporteTitulo = computed(() =>
  datosLaborales.value.tipo_trabajador === 'empleado'
    ? 'Certificación laboral'
    : 'Certificación de ingresos'
)

const soporteDescripcion = computed(() =>
  datosLaborales.value.tipo_trabajador === 'empleado'
    ? 'Cargue su certificación laboral vigente en formato PDF'
    : 'Cargue su certificación de ingresos en formato PDF'
)

const soporteCargando = ref(false)
const soporteError = ref(null)
const modalSoporteVisible = ref(false)

async function onFileSoporte(e) {
  const archivo = e.target.files?.[0]
  e.target.value = ''
  if (!archivo) return
  soporteCargando.value = true
  soporteError.value = null
  try {
    const url = await subirDocumentoSolicitud(documentosKey.value, 'afiliacion_soporte_ingresos', archivo)
    documentos.value = { ...documentos.value, doc_soporte_ingresos_laboral_url: url }
  } catch (err) {
    soporteError.value = obtenerMensajeErrorSubidaDocumento(err)
  } finally {
    soporteCargando.value = false
  }
}

function quitarSoporte() {
  documentos.value = { ...documentos.value, doc_soporte_ingresos_laboral_url: '' }
  soporteError.value = null
}

function abrirSoporte() {
  if (!documentos.value.doc_soporte_ingresos_laboral_url) return
  modalSoporteVisible.value = true
}

function cerrarSoporte() {
  modalSoporteVisible.value = false
}

// ── Opciones ────────────────────────────────────────────────────────────────
const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]
const opsTipoDocumento = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
]
const opsEstadoCivil = [
  { value: 'Soltero(a)',   label: 'Soltero(a)'   },
  { value: 'Casado(a)',    label: 'Casado(a)'    },
  { value: 'Viudo(a)',     label: 'Viudo(a)'     },
  { value: 'Separado(a)',  label: 'Separado(a)'  },
]
const opsTipoVivienda = [
  { value: 'Propia',    label: 'Propia'    },
  { value: 'Arrendada', label: 'Arrendada' },
  { value: 'Familiar',  label: 'Familiar'  },
]
const opsGenero = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino',  label: 'Femenino'  },
]
const opsNivelAcademico = [
  { value: 'tecnico',         label: 'Técnico'                  },
  { value: 'tecnologico',     label: 'Tecnológico'              },
  { value: 'pregrado',        label: 'Pregrado / Universitario' },
  { value: 'especializacion', label: 'Especialización'          },
  { value: 'maestria',        label: 'Maestría'                 },
  { value: 'doctorado',       label: 'Doctorado'                },
]
const opsOcupacion = [
  { value: 'Empleado',      label: 'Empleado'      },
  { value: 'Jubilado',      label: 'Jubilado'      },
  { value: 'Pensionado',    label: 'Pensionado'    },
  { value: 'Independiente', label: 'Independiente' },
  { value: 'Otro',          label: 'Otro'          },
]
const opsTipoContrato = TIPOS_CONTRATO
const opsEntidadesPensiones = ENTIDADES_PENSIONES.map(e => ({ value: e, label: e }))
const opsInstitucionEducativa = [
  { value: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ', label: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ' },
]
const opsNivelEducativo = [
  { value: 'tecnico',         label: 'Técnico'                  },
  { value: 'tecnologico',     label: 'Tecnológico'              },
  { value: 'pregrado',        label: 'Pregrado / Universitario' },
  { value: 'especializacion', label: 'Especialización'          },
  { value: 'maestria',        label: 'Maestría'                 },
  { value: 'doctorado',       label: 'Doctorado'                },
]
const opsOficina = [
  { value: 'PRINCIPAL - MEDELLÍN', label: 'Principal — Medellín' },
]

const opsTipoSolicitud = [
  { value: 'afiliacion',          label: 'Afiliación' },
  { value: 'actualizacion_datos', label: 'Actualización de datos' },
]

const opsRH = [
  { value: 'A+',  label: 'A+'  }, { value: 'A-',  label: 'A-'  },
  { value: 'B+',  label: 'B+'  }, { value: 'B-',  label: 'B-'  },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+',  label: 'O+'  }, { value: 'O-',  label: 'O-'  },
]

const opsCanalesComunicacion = [
  { value: 'direccion_principal', label: 'Dirección principal' },
  { value: 'direccion_empresa',   label: 'Dirección empresa'   },
  { value: 'correo',              label: 'Correo electrónico'  },
  { value: 'sms',                 label: 'Mensajería SMS'      },
  { value: 'apps_web',            label: 'Aplicaciones o web'   },
  { value: 'llamada',             label: 'Llamada telefónica'   },
]

// ── Pasos del indicador (pasos 1-5, excluyendo 0 y 6) ──────────────────────
const pasos = computed(() => ([
  { label: 'Información general' },
  { label: 'Laboral y financiera' },
  { label: 'Cónyuge o', label2: necesitaConyuge ? 'compañero(a) permanente' : 'compañero(a) permanente — Omitido' },
  { label: 'Referencias' },
  { label: 'Declaraciones y', label2: 'autorizaciones', noWrapLabel: true, headerJoin: true },
]))

// Estilos reutilizables
const estiloSeccionTitulo = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--color-text-1)',
  marginBottom: 'var(--sp-lg)',
}
const estiloSubtitulo = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--fw-extrabold)',
  color: 'var(--color-text-1)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingBottom: 'var(--sp-sm)',
  borderBottom: '1px solid var(--color-border-card)',
  marginBottom: 'var(--sp-md)',
  marginTop: 'var(--sp-lg)',
}
const estiloBloque = {
  background: 'var(--color-bg-card)',
  borderRadius: 'var(--r-md)',
  padding: 'var(--sp-lg)',
}
const grid2 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
  gap: 'var(--sp-lg)',
})
const grid3 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
  gap: 'var(--sp-lg)',
})
const grid4 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)',
  gap: 'var(--sp-lg)',
})
const grid3070 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '3fr 7fr',
  gap: 'var(--sp-lg)',
})
const gridFechaLugar = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 2fr',
  gap: 'var(--sp-lg)',
})
const grid207010 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '15fr 60fr 25fr',
  gap: 'var(--sp-lg)',
})
const spanFull = { gridColumn: '1 / -1' }

const modalLugarNacimientoVisible = ref(false)
const tempLugarNacimiento = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })
const modalLugarExpedicionConyugeVisible = ref(false)
const tempLugarExpedicionConyuge = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })
const modalDireccionVisible = ref(false)
const modalDireccionNegocioVisible = ref(false)

const lugarNacimientoFormateado = computed(() => {
  const u = datosPersonales.value?.lugar_nacimiento_ubicacion
  if (!u?.municipio_nombre || !u?.depto_nombre) return datosPersonales.value?.lugar_nacimiento || ''
  return `${u.municipio_nombre} (${u.depto_nombre})`.toUpperCase()
})

const lugarExpedicionConyugeFormateado = computed(() => {
  const u = datosConyuge.value?.lugar_expedicion_ubicacion
  if (!u?.municipio_nombre || !u?.depto_nombre) return datosConyuge.value?.lugar_expedicion || ''
  return `${u.municipio_nombre} (${u.depto_nombre})`.toUpperCase()
})

const puedeGuardarLugarNacimiento = computed(() => {
  const u = tempLugarNacimiento.value
  return !!(u?.depto_codigo && u?.municipio_codigo)
})

const puedeGuardarLugarExpedicionConyuge = computed(() => {
  const u = tempLugarExpedicionConyuge.value
  return !!(u?.depto_codigo && u?.municipio_codigo)
})

const fechaSolicitudFormateada = computed(() => {
  const v = fechaSolicitud.value
  if (!v) return ''
  const [y, m, d] = String(v).split('-')
  if (!y || !m || !d) return String(v)
  return `${d}/${m}/${y}`
})

function abrirLugarNacimiento() {
  tempLugarNacimiento.value = { ...(datosPersonales.value?.lugar_nacimiento_ubicacion || {}) }
  modalLugarNacimientoVisible.value = true
}
function confirmarLugarNacimiento() {
  if (!puedeGuardarLugarNacimiento.value) return
  datosPersonales.value.lugar_nacimiento_ubicacion = { ...tempLugarNacimiento.value }
  datosPersonales.value.lugar_nacimiento = lugarNacimientoFormateado.value
  modalLugarNacimientoVisible.value = false
}

function abrirLugarExpedicionConyuge() {
  tempLugarExpedicionConyuge.value = { ...(datosConyuge.value?.lugar_expedicion_ubicacion || {}) }
  modalLugarExpedicionConyugeVisible.value = true
}
function confirmarLugarExpedicionConyuge() {
  if (!puedeGuardarLugarExpedicionConyuge.value) return
  datosConyuge.value.lugar_expedicion_ubicacion = { ...tempLugarExpedicionConyuge.value }
  datosConyuge.value.lugar_expedicion = lugarExpedicionConyugeFormateado.value
  modalLugarExpedicionConyugeVisible.value = false
}

function onConfirmarDireccion(preview) {
  datosPersonales.value.direccion = preview || datosPersonales.value.direccion
  const m = datosPersonales.value.direccion_residencia_modelo
  if (m?.barrio) datosPersonales.value.barrio = m.barrio
  if (m?.municipio_nombre) datosPersonales.value.ciudad = m.municipio_nombre
}

function onConfirmarDireccionNegocio(preview) {
  actividadIndependiente.value.direccion_negocio = preview || actividadIndependiente.value.direccion_negocio
}

function normalizarTextoUpper(v) {
  const raw = String(v ?? '')
  const cleaned = raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '').replace(/\s+/g, ' ').trim()
  return cleaned.toUpperCase()
}

function clampDigits(v, max) {
  const raw = String(v ?? '')
  const cleaned = raw.replace(/\D/g, '')
  if (!cleaned) return ''
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return ''
  return String(Math.min(Math.max(n, 1), max))
}

function toggleCanal(valor) {
  const arr = Array.isArray(datosPersonales.value.canales_comunicacion) ? [...datosPersonales.value.canales_comunicacion] : []
  const idx = arr.indexOf(valor)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(valor)
  datosPersonales.value.canales_comunicacion = arr
}

// ── OTP: validación de correo ────────────────────────────────────────────────
const emailValidado    = ref(false)
const mostrarModalOtp  = ref(false)
const bannerRecuperadoVisible = ref(false)
const continuarDespuesOtp = ref(false)

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function onRestaurarBorrador() {
  try {
    restaurarBorrador()
    bannerRecuperadoVisible.value = true
    setTimeout(() => {
      bannerRecuperadoVisible.value = false
    }, 5000)
  } catch {
    bannerRecuperadoVisible.value = false
  }
}

function onDocumentoAreaClick() {
  if (emailValidado.value) return
  const email = emailInicial.value.trim()
  if (!email || !RE_EMAIL.test(email)) return
  if (import.meta.env.DEV) {
    emailValidado.value = true
    return
  }
  if (import.meta.env.VITE_SKIP_OTP === 'true') {
    emailValidado.value = true
    return
  }
  mostrarModalOtp.value = true
}

async function onOtpValidado() {
  emailValidado.value   = true
  mostrarModalOtp.value = false
  if (continuarDespuesOtp.value) {
    continuarDespuesOtp.value = false
    await verificarYContinuar()
  }
}

async function onVerificarYContinuarClick() {
  if (import.meta.env.DEV) {
    emailValidado.value = true
    continuarDespuesOtp.value = false
    await verificarYContinuar()
    return
  }
  if (!pasoValido.value) return
  if (!emailValidado.value) {
    if (import.meta.env.VITE_SKIP_OTP === 'true') {
      emailValidado.value = true
      continuarDespuesOtp.value = false
      await verificarYContinuar()
      return
    }
    continuarDespuesOtp.value = true
    onDocumentoAreaClick()
    return
  }
  continuarDespuesOtp.value = false
  await verificarYContinuar()
}
</script>

<template>
  <PortalLayout>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 0: Verificación inicial                                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="paso === 0" :style="{ maxWidth: '420px', width: '100%', margin: '0 auto' }">

      <div :style="{ marginBottom: 'var(--sp-2xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-xl)',
          fontWeight: 'var(--fw-extrabold)',
          color:      'var(--color-text-1)',
        }">¡Saludos! Comencemos con tu solicitud</div>
      </div>

      <!-- Borrador disponible -->
      <template v-if="borradorDisponible">
        <div :style="{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-p-light)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-xl)',
          marginBottom: 'var(--sp-xl)',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }">
          <div :style="{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-p-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sp-md)',
            color: 'var(--color-primary)'
          }">
            <IconRotateClockwise2 :size="24" />
          </div>
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-lg)',
            marginBottom: '4px'
          }">¡Hola de nuevo!</div>
          <div :style="{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-2)',
            fontWeight: 'var(--fw-medium)',
            marginBottom: 'var(--sp-xl)',
            lineHeight: '1.5'
          }">
            Encontramos una solicitud que empezaste anteriormente.<br>
            <strong>¿Te gustaría retomar desde donde quedaste?</strong>
          </div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }">
            <PortalButton variant="primary" :full="true" @click="onRestaurarBorrador">
              Sí, continuar mi solicitud
            </PortalButton>
            <button 
              @click="descartarBorrador"
              :style="{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-3)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer',
                padding: 'var(--sp-sm)',
                textDecoration: 'underline'
              }"
            >
              No, prefiero empezar de cero
            </button>
          </div>
        </div>
      </template>

      <!-- Formulario de verificación -->
      <template v-else>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

          <CampoTexto
            v-model="emailInicial"
            label="Correo electrónico"
            type="email"
            placeholder="su.correo@ejemplo.com"
            required
            :error="errorEmail"
            @keyup.enter="onVerificarYContinuarClick"
          />

          <!-- Selector de Tipo de Documento -->
          <CampoSelect
            v-model="tipoDocumentoInicial"
            label="Tipo de documento"
            required
            :opciones="opsTipoDocVerificacion"
            @click="onDocumentoAreaClick"
          />

          <!-- Número de Documento -->
          <CampoTexto
            v-model="numeroDocumentoInicial"
            label="Número de documento"
            placeholder="Sin puntos ni espacios"
            required
            solo-numeros
            :maxlength="15"
            :error="errorNumeroDoc"
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

          <label :style="{
            display: 'flex', alignItems: 'flex-start',
            gap: 'var(--sp-sm)', cursor: 'pointer',
          }">
            <input
              type="checkbox"
              v-model="aceptaAutorizacion"
              :style="{
                marginTop: '3px', flexShrink: '0', cursor: 'pointer',
                accentColor: 'var(--color-primary)', width: '15px', height: '15px',
              }"
            />
            <span :style="{
              fontSize: 'var(--text-xs)', color: 'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)', lineHeight: '1.7',
            }">
              Autorizo a la Cooperativa Multiactiva Luis Amigó para tratar mis datos personales con la finalidad de gestionar mi proceso de afiliación, contactarme y suministrarme información relacionada con los servicios y beneficios de la cooperativa.
              Asimismo, autorizo, cuando sea necesario, la consulta de mi información en operadores de información y riesgo, con el fin de validar mis datos.
              Declaro que conozco mis derechos como titular de la información. Igualmente, manifiesto que he leído y acepto los
              <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">Términos y condiciones</a>
              y la
              <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">Política de tratamiento de datos personales</a>.
            </span>
          </label>

          <div :style="{
            display: 'flex', justifyContent: 'space-between',
            gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)',
          }">
            <PortalButton variant="secondary" @click="router.push('/')">Volver</PortalButton>
            <PortalButton
              variant="primary"
              :disabled="!pasoValido"
              :loading="loadingVerificacion"
              @click="onVerificarYContinuarClick"
            >
              Verificar y continuar
            </PortalButton>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 6: Éxito                                                       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-else-if="paso === 6" :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-md)',
      padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
      boxShadow: 'var(--shadow-card)',
      textAlign: 'center',
    }">
      <div :style="{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'var(--color-success-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--sp-xl)',
      }">
        <IconCircleCheck :size="36" :style="{ color: 'var(--color-success)' }" />
      </div>
      <div :style="{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
        color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)',
      }">¡Solicitud de afiliación enviada!</div>
      <div :style="{
        fontSize: 'var(--text-lg)', color: 'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
        maxWidth: '480px', margin: '0 auto var(--sp-xl)',
      }">
        Su solicitud está en proceso de revisión. Le notificaremos por correo electrónico.
      </div>
      <div v-if="solicitudCreada" :style="{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-lg) var(--sp-xl)',
          marginBottom: 'var(--sp-xl)',
          display: 'inline-block',
        }">
        <div :style="{
          fontSize: 'var(--text-sm)', color: 'var(--color-text-3)',
          fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-xs)',
        }">Número de solicitud</div>
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-primary)', letterSpacing: '0.05em',
        }">{{ solicitudCreada.consecutivo ?? solicitudCreada.id }}</div>
      </div>
      <PortalButton variant="primary" @click="router.push('/')">Volver al inicio</PortalButton>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASOS 1–6: Formulario principal                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <div :style="{ width: '100%', margin: '0 auto', paddingTop: 'var(--sp-xl)' }">

        <!-- Banner: datos recuperados -->
        <div v-if="bannerRecuperadoVisible" :style="{
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

      <div :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-2)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '0.02em',
          marginBottom: 'var(--sp-sm)',
          textAlign: 'right',
        }">SAR FT 001 V. 1.0 30/12/2025</div>

        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: '2px', lineHeight: '1.1',
        }">Formato único de afiliación y/o conocimiento del asociado.</div>
      </div>

      <div :style="{ marginTop: paso !== 1 ? '56px' : '0' }">
        <StepIndicator :pasos="pasos" :actual="paso" />
      </div>

      <div :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
      }">

        <div :style="{
          padding: 'var(--sp-md) var(--sp-xl)',
          background: 'var(--color-primary)',
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--fw-bold)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-sm)',
        }">
          <IconUserCheck :size="20" />
          <template v-if="pasos[paso - 1]?.headerJoin && pasos[paso - 1]?.label2">
            <div :style="{ whiteSpace: 'nowrap' }">{{ `${pasos[paso - 1]?.label} ${pasos[paso - 1]?.label2}` }}</div>
          </template>
          <div v-else :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }">
            <div :style="{ whiteSpace: 'nowrap' }">{{ pasos[paso - 1]?.label }}</div>
            <div v-if="pasos[paso - 1]?.label2">{{ pasos[paso - 1]?.label2 }}</div>
          </div>
        </div>

        <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-xl)' }">

        <!-- Honeypot anti-bot — NO modificar -->
        <div aria-hidden="true" :style="{
          position: 'absolute', left: '-9999px',
          width: '1px', height: '1px', overflow: 'hidden',
          opacity: '0', pointerEvents: 'none',
        }">
          <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 1: Información General                                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 1">

          <AlertaBanner
            v-if="asociadoExistente"
            tipo="info"
            :mensaje="`Registro encontrado: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
            :style="{ marginBottom: 'var(--sp-lg)' }"
          />

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Datos generales</div>
              <div :style="grid3(isMobile)">
                <CampoTexto
                  :model-value="fechaSolicitudFormateada"
                  label="Fecha solicitud"
                  required
                  disabled
                />
                <CampoSelect
                  v-model="oficina"
                  label="Oficina"
                  :opciones="opsOficina"
                  required
                />
                <CampoSelect
                  v-model="tipoSolicitud"
                  label="Tipo de solicitud"
                  :opciones="opsTipoSolicitud"
                  required
                />
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información personal</div>
              <div :style="grid3(isMobile)">
                <CampoSelect
                  v-model="datosPersonales.tipo_identificacion"
                  label="Tipo documento"
                  :opciones="opsTipoDocumento"
                  required
                  disabled
                />
                <CampoTexto
                  v-model="datosPersonales.cedula"
                  label="No. Documento"
                  placeholder="Sin puntos ni espacios"
                  required
                  solo-numeros
                  :maxlength="15"
                  disabled
                />
                <CampoTexto
                  :model-value="datosPersonales.nombres"
                  label="Nombres completos"
                  placeholder="NOMBRES"
                  required
                  :disabled="!!asociadoExistente"
                  :error="erroresCampos.nombres"
                  @update:model-value="datosPersonales.nombres = normalizarTextoUpper($event)"
                />
                <CampoTexto
                  :model-value="datosPersonales.apellidos"
                  label="Apellidos completos"
                  placeholder="APELLIDOS"
                  required
                  :disabled="!!asociadoExistente"
                  :error="erroresCampos.apellidos"
                  @update:model-value="datosPersonales.apellidos = normalizarTextoUpper($event)"
                />
                <CampoSelect
                  v-model="datosPersonales.nivel_academico"
                  label="Nivel académico"
                  :opciones="opsNivelAcademico"
                  required
                />
                <CampoTexto
                  :model-value="datosPersonales.titulo"
                  label="Título académico"
                  placeholder="Ej. INGENIERO, TÉCNICO, ADMINISTRADOR"
                  required
                  @update:model-value="datosPersonales.titulo = normalizarTextoUpper($event)"
                />
                <div :style="spanFull">
                  <div :style="gridFechaLugar(isMobile)">
                    <SelectorFecha
                      :model-value="datosPersonales.fecha_expedicion"
                      label="Fecha expedición"
                      required
                      :max-year="new Date().getFullYear()"
                      @update:model-value="datosPersonales.fecha_expedicion = $event"
                    />
                    <SelectorFecha
                      :model-value="datosPersonales.fecha_nacimiento"
                      label="Fecha nacimiento"
                      required
                      :error="erroresCampos.fecha_nacimiento"
                      :max-year="new Date().getFullYear()"
                      @update:model-value="datosPersonales.fecha_nacimiento = $event"
                    />
                    <div :style="{ position: 'relative' }">
                      <CampoTexto
                        :model-value="lugarNacimientoFormateado"
                        label="Lugar de nacimiento"
                        placeholder="Seleccione municipio y departamento"
                        required
                        disabled
                      />
                      <button
                        type="button"
                        :style="{
                          position: 'absolute',
                          inset: '0',
                          background: 'transparent',
                          border: 'none',
                          padding: '0',
                          cursor: 'pointer',
                        }"
                        @click="abrirLugarNacimiento"
                        aria-label="Seleccionar lugar de nacimiento"
                      />
                    </div>
                  </div>
                </div>
                <CampoTexto
                  v-if="datosPersonales.tipo_identificacion === 'CE'"
                  v-model="datosPersonales.nacionalidad"
                  label="Nacionalidad"
                  placeholder="Nacionalidad"
                  required
                />
                <div :style="spanFull">
                  <div :style="grid4(isMobile)">
                    <CampoSelect
                      v-model="datosPersonales.estado_civil"
                      label="Estado civil"
                      :opciones="opsEstadoCivil"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.tipo_vivienda"
                      label="Tipo de vivienda"
                      :opciones="opsTipoVivienda"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.genero"
                      label="Sexo"
                      :opciones="opsGenero"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.rh"
                      label="RH"
                      :opciones="opsRH"
                      required
                    />
                  </div>
                </div>
                <div :style="spanFull">
                  <div :style="grid3070(isMobile)">
                    <CampoTexto
                      :model-value="datosPersonales.personas_a_cargo"
                      label="No. Personas a cargo"
                      placeholder="0"
                      required
                      solo-numeros
                      @update:model-value="datosPersonales.personas_a_cargo = String($event ?? '').replace(/\\D/g, '')"
                    />
                    <CampoTexto
                      :model-value="datosPersonales.personas_economicamente_activas"
                      label="No. Personas económicamente activas en núcleo familiar"
                      placeholder="0"
                      required
                      solo-numeros
                      @update:model-value="datosPersonales.personas_economicamente_activas = String($event ?? '').replace(/\\D/g, '')"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Contacto y residencia</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <div :style="grid2(isMobile)">
                  <CampoTexto
                    :model-value="emailInicial"
                    label="Correo electrónico personal"
                    type="email"
                    disabled
                  />
                  <CampoTexto
                    v-model="datosPersonales.otro_email"
                    label="Correo electrónico alternativo"
                    type="email"
                    placeholder="correo.alternativo@ejemplo.com"
                  />
                </div>
                <div :style="grid2(isMobile)">
                  <CampoTexto
                    v-model="datosPersonales.telefono"
                    label="Teléfono"
                    placeholder="Ej. 6044456789"
                    solo-numeros
                    required
                  />
                  <CampoTexto
                    v-model="datosPersonales.celular"
                    label="Celular"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                    required
                  />
                </div>
                <div :style="{ position: 'relative' }">
                  <CampoTexto
                    :model-value="datosPersonales.direccion"
                    label="Dirección de residencia"
                    placeholder="Seleccione la dirección"
                    required
                    disabled
                  />
                  <button
                    type="button"
                    :style="{
                      position: 'absolute',
                      inset: '0',
                      background: 'transparent',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                    }"
                    @click="modalDireccionVisible = true"
                    aria-label="Seleccionar dirección de residencia"
                  />
                </div>
                <div :style="grid2(isMobile)">
                  <CampoTexto
                    :model-value="datosPersonales.estrato"
                    label="Estrato"
                    placeholder="1 – 6"
                    required
                    solo-numeros
                    @update:model-value="datosPersonales.estrato = clampDigits($event, 6)"
                  />
                  <CampoTexto
                    :model-value="datosPersonales.tiempo_residencia_meses"
                    label="Tiempo en la residencia (meses)"
                    placeholder="Ej. 24"
                    required
                    solo-numeros
                    @update:model-value="datosPersonales.tiempo_residencia_meses = String($event ?? '').replace(/\\D/g, '')"
                  />
                </div>
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Canales de comunicación de preferencia</div>
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-md)' }">
                <CampoCheck
                  v-for="op in opsCanalesComunicacion"
                  :key="op.value"
                  :model-value="Array.isArray(datosPersonales.canales_comunicacion) && datosPersonales.canales_comunicacion.includes(op.value)"
                  :label="op.label"
                  @update:model-value="() => toggleCanal(op.value)"
                />
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Exposición política y pública</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
                    <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                      ¿Administra recursos públicos?
                    </div>
                    <div :style="{ minWidth: '0' }">
                      <CampoCheck
                        :model-value="datosPersonales.administra_recursos_publicos === true"
                        label="Sí"
                        @update:model-value="() => { datosPersonales.administra_recursos_publicos = true }"
                      />
                    </div>
                    <div :style="{ minWidth: '0' }">
                      <CampoCheck
                        :model-value="datosPersonales.administra_recursos_publicos === false"
                        label="No"
                        @update:model-value="() => { datosPersonales.administra_recursos_publicos = false }"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
                    <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                      ¿Es persona expuesta públicamente (PEP)?
                    </div>
                    <div :style="{ minWidth: '0' }">
                      <CampoCheck
                        :model-value="datosPersonales.persona_expuesta_publicamente === true"
                        label="Sí"
                        @update:model-value="() => { datosPersonales.persona_expuesta_publicamente = true }"
                      />
                    </div>
                    <div :style="{ minWidth: '0' }">
                      <CampoCheck
                        :model-value="datosPersonales.persona_expuesta_publicamente === false"
                        label="No"
                        @update:model-value="() => { datosPersonales.persona_expuesta_publicamente = false }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Teleport to="body">
            <Transition name="fade-modal">
              <div v-if="modalLugarNacimientoVisible" :style="{
                position: 'fixed', inset: '0', zIndex: '75',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--sp-lg)',
              }">
                <div :style="{
                  position: 'absolute', inset: '0',
                  background: 'rgba(23,43,54,0.55)',
                  backdropFilter: 'blur(3px)',
                }" @click="modalLugarNacimientoVisible = false" />

                <div
                  role="dialog"
                  aria-modal="true"
                  :style="{
                    position: 'relative', width: '100%', maxWidth: '640px',
                    background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex', flexDirection: 'column',
                  }"
                >
                  <div :style="{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--sp-xl) var(--sp-2xl)',
                    borderBottom: '1px solid var(--color-border-card)',
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
                      <div :style="{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }">
                        <IconMapPin :size="18" style="color: white;" />
                      </div>
                      <div>
                        <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                          Lugar de nacimiento
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                          Seleccione departamento y municipio
                        </div>
                      </div>
                    </div>
                    <button :style="{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
                      display: 'flex', alignItems: 'center',
                    }" @click="modalLugarNacimientoVisible = false">
                      <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
                    </button>
                  </div>

                  <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)' }">
                    <SelectorDeptoMunicipio
                      :model-value="tempLugarNacimiento"
                      required
                      @update:model-value="tempLugarNacimiento = $event"
                    />
                  </div>

                  <div :style="{
                    padding: 'var(--sp-lg) var(--sp-2xl)',
                    borderTop: '1px solid var(--color-border-card)',
                    display: 'flex',
                    gap: 'var(--sp-md)',
                    justifyContent: 'flex-end',
                  }">
                    <PortalButton variant="secondary" @click="modalLugarNacimientoVisible = false">Cancelar</PortalButton>
                    <PortalButton variant="primary" :disabled="!puedeGuardarLugarNacimiento" @click="confirmarLugarNacimiento">Guardar</PortalButton>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>

          <ModalDireccion
            :model-value="datosPersonales.direccion_residencia_modelo"
            :visible="modalDireccionVisible"
            @update:model-value="datosPersonales.direccion_residencia_modelo = $event"
            @update:visible="modalDireccionVisible = $event"
            @confirmar="onConfirmarDireccion"
          />
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 2: Laboral y financiera                                -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 2">
          <div :style="estiloSeccionTitulo">Laboral y financiera</div>

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <SelectorTipoTrabajador v-model="datosLaborales.tipo_trabajador" />
            </div>

            <template v-if="datosLaborales.tipo_trabajador === 'empleado'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid3(isMobile)">
                  <div :style="spanFull">
                    <CampoTexto
                      v-model="datosLaborales.nombre_empresa"
                      label="Nombre de la empresa"
                      placeholder="Empresa donde trabaja"
                      required
                      @update:model-value="datosLaborales.nombre_empresa = normalizarTextoUpper($event)"
                    />
                  </div>
                  <CampoTexto
                    v-model="datosLaborales.cargo_oficio"
                    label="Cargo u oficio"
                    placeholder="Ej. Contador, Docente"
                    required
                    @update:model-value="datosLaborales.cargo_oficio = normalizarTextoUpper($event)"
                  />
                  <CampoSelectBuscable
                    v-model="datosLaborales.tipo_contrato"
                    label="Tipo de contrato"
                    :opciones="opsTipoContrato"
                    required
                  />
                  <template v-if="datosLaborales.tipo_contrato === 'otro'">
                    <CampoTexto
                      v-model="datosLaborales.tipo_contrato_otro"
                      label="¿Cuál?"
                      placeholder="Describe el tipo de contrato"
                      required
                      @update:model-value="datosLaborales.tipo_contrato_otro = normalizarTextoUpper($event)"
                    />
                  </template>
                  <SelectorFecha
                    v-model="datosLaborales.fecha_ingreso"
                    label="Fecha de inicio"
                    required
                  />
                </div>
              </div>
            </template>

            <template v-if="esIndependiente">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Actividad económica independiente</div>
                <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                  <div :style="grid207010(isMobile)">
                    <CampoTexto
                      v-model="actividadIndependiente.ciiu_1"
                      label="Código CIIU"
                      required
                    />
                    <CampoTexto
                      v-model="actividadIndependiente.descripcion_actividad_1"
                      label="Descripción de actividad comercial"
                      required
                      @update:model-value="actividadIndependiente.descripcion_actividad_1 = normalizarTextoUpper($event)"
                    />
                    <SelectorFecha
                      v-model="actividadIndependiente.fecha_inicio_actividad_1"
                      label="Fecha de inicio"
                      required
                    />
                  </div>

                  <div :style="grid207010(isMobile)">
                    <CampoTexto
                      v-model="actividadIndependiente.ciiu_2"
                      label="Código CIIU"
                    />
                    <CampoTexto
                      v-model="actividadIndependiente.descripcion_actividad_2"
                      label="Descripción de actividad comercial"
                      @update:model-value="actividadIndependiente.descripcion_actividad_2 = normalizarTextoUpper($event)"
                    />
                    <SelectorFecha
                      v-model="actividadIndependiente.fecha_inicio_actividad_2"
                      label="Fecha de inicio"
                    />
                  </div>

                  <div :style="grid2(isMobile)">
                    <div :style="{ width: '100%' }">
                      <div :style="{ position: 'relative' }">
                        <CampoTexto
                          :model-value="actividadIndependiente.direccion_negocio"
                          label="Dirección del establecimiento"
                          required
                          disabled
                        />
                        <button
                          type="button"
                          :style="{
                            position: 'absolute',
                            inset: '0',
                            background: 'transparent',
                            border: 'none',
                            padding: '0',
                            cursor: 'pointer',
                          }"
                          @click="modalDireccionNegocioVisible = true"
                          aria-label="Seleccionar dirección del establecimiento"
                        />
                      </div>
                    </div>

                    <CampoTexto
                      v-model="actividadIndependiente.telefono_negocio"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      required
                      solo-numeros
                    />
                  </div>
                </div>
              </div>

              <ModalDireccion
                :model-value="actividadIndependiente.direccion_negocio_modelo"
                :visible="modalDireccionNegocioVisible"
                @update:model-value="actividadIndependiente.direccion_negocio_modelo = $event"
                @update:visible="modalDireccionNegocioVisible = $event"
                @confirmar="onConfirmarDireccionNegocio"
              />
            </template>

            <template v-if="datosLaborales.tipo_trabajador === 'pensionado'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid2(isMobile)">
                  <CampoSelectBuscable
                    v-model="datosLaborales.entidad_pagadora"
                    label="Entidad pagadora"
                    required
                    :opciones="opsEntidadesPensiones"
                  />
                </div>
              </div>
            </template>

            <template v-if="datosLaborales.tipo_trabajador === 'estudiante'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid2(isMobile)">
                  <CampoSelectBuscable
                    v-model="datosLaborales.institucion_educativa"
                    label="Institución educativa"
                    required
                    :opciones="opsInstitucionEducativa"
                  />
                  <CampoSelectBuscable
                    v-model="datosLaborales.nivel_educativo"
                    label="Nivel educativo"
                    required
                    :opciones="opsNivelEducativo"
                  />
                </div>
              </div>
            </template>

            <template v-if="datosLaborales.tipo_trabajador">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información financiera</div>
                <SeccionFinanciera
                  v-model="datosFinancieros"
                  :tipo-trabajador="datosLaborales.tipo_trabajador"
                  :mostrar-dependientes="false"
                />
              </div>

              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Propiedad raíz</div>
                <div :style="grid3(isMobile)">
                  <CampoTexto
                    v-model="activosPasivos.tipo_propiedad_raiz"
                    label="Tipo de propiedad raíz"
                    placeholder="Ej. Casa, Apartamento, Lote"
                  />
                  <CampoTexto
                    v-model="activosPasivos.matricula_inmobiliaria"
                    label="Matrícula inmobiliaria"
                    placeholder="Número de matrícula"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.deuda_cooperativa"
                    label="Deuda con la cooperativa"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.cuota_mensual_cooperativa"
                    label="Cuota mensual cooperativa"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.valor_comercial_hipoteca"
                    label="Valor comercial / hipoteca"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.deuda_otras_entidades"
                    label="Deuda con otras entidades"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.cuota_mensual_otras_deudas"
                    label="Cuota mensual otras deudas"
                  />
                </div>
              </div>

              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Vehículo</div>
                <div :style="grid3(isMobile)">
                  <CampoTexto
                    v-model="activosPasivos.marca_vehiculo"
                    label="Marca"
                    placeholder="Ej. Chevrolet"
                  />
                  <CampoTexto
                    v-model="activosPasivos.modelo_vehiculo"
                    label="Modelo / Año"
                    placeholder="Ej. Spark 2020"
                  />
                  <CampoTexto
                    v-model="activosPasivos.placa_vehiculo"
                    label="Placa"
                    placeholder="ABC 123"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.valor_comercial_pignorado"
                    label="Valor comercial / pignoraciones"
                  />
                </div>
              </div>

              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Otras deudas</div>
                <div :style="grid3(isMobile)">
                  <CampoMoneda
                    v-model="activosPasivos.otras_deudas"
                    label="Otras deudas"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.cuota_mensual_otras_deudas_2"
                    label="Cuota mensual otras deudas"
                  />
                  <CampoMoneda
                    v-model="activosPasivos.total_pasivos"
                    label="Total pasivos"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 3: Cónyuge / Compañero                                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 3">

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div v-if="necesitaConyuge" :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Datos del cónyuge / compañero(a)</div>
              <div :style="grid3(isMobile)">
                <CampoSelect
                  v-model="datosConyuge.tipo_identificacion"
                  label="Tipo de identificación"
                  :opciones="opsTipoDocumento"
                  required
                />
                <CampoTexto
                  v-model="datosConyuge.numero_identificacion"
                  label="Número de identificación"
                  placeholder="Sin puntos ni espacios"
                  solo-numeros
                  required
                />
                <SelectorFecha
                  :model-value="datosConyuge.fecha_expedicion"
                  label="Fecha expedición"
                  required
                  :max-year="new Date().getFullYear()"
                  @update:model-value="datosConyuge.fecha_expedicion = $event"
                />
              </div>

              <div :style="{ marginTop: 'var(--sp-lg)' }" />

              <div :style="grid3(isMobile)">
                <div :style="{ position: 'relative' }">
                  <CampoTexto
                    :model-value="lugarExpedicionConyugeFormateado"
                    label="Lugar de expedición"
                    placeholder="Seleccione municipio y departamento"
                    required
                    disabled
                  />
                  <button
                    type="button"
                    :style="{
                      position: 'absolute',
                      inset: '0',
                      background: 'transparent',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                    }"
                    @click="abrirLugarExpedicionConyuge"
                    aria-label="Seleccionar lugar de expedición"
                  />
                </div>
                <CampoTexto
                  v-model="datosConyuge.nacionalidad"
                  label="Nacionalidad"
                  placeholder="Ej. Colombiana"
                  required
                />
                <CampoTexto
                  v-model="datosConyuge.telefono"
                  label="Teléfono"
                  placeholder="Ej. 3001234567"
                  solo-numeros
                  required
                />
              </div>

              <div :style="{ marginTop: 'var(--sp-lg)' }" />

              <div :style="grid2(isMobile)">
                <CampoTexto
                  :model-value="datosConyuge.nombres"
                  label="Nombres completos"
                  placeholder="Nombres"
                  required
                  @update:model-value="datosConyuge.nombres = normalizarTextoUpper($event)"
                />
                <CampoTexto
                  :model-value="datosConyuge.apellidos"
                  label="Apellidos completos"
                  placeholder="Apellidos"
                  required
                  @update:model-value="datosConyuge.apellidos = normalizarTextoUpper($event)"
                />
              </div>
            </div>

            <div
              v-else
              :style="{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-xl)',
                textAlign: 'center',
                color: 'var(--color-text-2)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--fw-medium)',
              }"
            >
              Usted ha indicado que su estado civil es ({{ datosPersonales.estado_civil || 'No informado' }}). Por lo tanto, puede omitir este paso y continuar.
            </div>
          </div>

          <Teleport to="body">
            <Transition name="fade-modal">
              <div v-if="modalLugarExpedicionConyugeVisible" :style="{
                position: 'fixed', inset: '0', zIndex: '75',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--sp-lg)',
              }">
                <div :style="{
                  position: 'absolute', inset: '0',
                  background: 'rgba(23,43,54,0.55)',
                  backdropFilter: 'blur(3px)',
                }" @click="modalLugarExpedicionConyugeVisible = false" />

                <div
                  role="dialog"
                  aria-modal="true"
                  :style="{
                    position: 'relative', width: '100%', maxWidth: '640px',
                    background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex', flexDirection: 'column',
                  }"
                >
                  <div :style="{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--sp-xl) var(--sp-2xl)',
                    borderBottom: '1px solid var(--color-border-card)',
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
                      <div :style="{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }">
                        <IconMapPin :size="18" style="color: white;" />
                      </div>
                      <div>
                        <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                          Lugar de expedición
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                          Seleccione departamento y municipio
                        </div>
                      </div>
                    </div>
                    <button :style="{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
                      display: 'flex', alignItems: 'center',
                    }" @click="modalLugarExpedicionConyugeVisible = false">
                      <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
                    </button>
                  </div>

                  <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)' }">
                    <SelectorDeptoMunicipio
                      :model-value="tempLugarExpedicionConyuge"
                      required
                      @update:model-value="tempLugarExpedicionConyuge = $event"
                    />
                  </div>

                  <div :style="{
                    padding: 'var(--sp-lg) var(--sp-2xl)',
                    borderTop: '1px solid var(--color-border-card)',
                    display: 'flex',
                    gap: 'var(--sp-md)',
                    justifyContent: 'flex-end',
                  }">
                    <PortalButton variant="secondary" @click="modalLugarExpedicionConyugeVisible = false">Cancelar</PortalButton>
                    <PortalButton variant="primary" :disabled="!puedeGuardarLugarExpedicionConyuge" @click="confirmarLugarExpedicionConyuge">Guardar</PortalButton>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 4: Referencias                                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 4">

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Referencias</div>

              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <div :style="{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '120px 1fr 160px',
                  gap: 'var(--sp-lg)',
                  alignItems: 'start',
                }">
                  <CampoTexto :model-value="'Personal'" label="Tipo" disabled />
                  <CampoTexto
                    v-model="referencias.personal.nombres"
                    label="Nombres completos"
                    placeholder="Nombre completo"
                    required
                  />
                  <CampoTexto
                    v-model="referencias.personal.contacto"
                    label="Contacto"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                    required
                  />
                </div>

                <div :style="{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '120px 1fr 0.7fr 160px',
                  gap: 'var(--sp-lg)',
                  alignItems: 'start',
                }">
                  <CampoTexto :model-value="'Familiar'" label="Tipo" disabled />
                  <CampoTexto
                    v-model="referencias.familiar.nombres"
                    label="Nombres completos"
                    placeholder="Nombre completo"
                    required
                  />
                  <CampoTexto
                    v-model="referencias.familiar.parentesco"
                    label="Parentesco"
                    placeholder="Ej. Hermano(a), Padre, Madre"
                    required
                  />
                  <CampoTexto
                    v-model="referencias.familiar.contacto"
                    label="Contacto"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                    required
                  />
                </div>

                <div :style="{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '120px 1fr 0.8fr 160px 160px',
                  gap: 'var(--sp-lg)',
                  alignItems: 'start',
                }">
                  <CampoTexto :model-value="'Financiera'" label="Tipo" disabled />
                  <CampoTexto
                    v-model="referencias.financiera.nombre_establecimiento"
                    label="Nombre establecimiento"
                    placeholder="Nombre comercial"
                  />
                  <CampoTexto
                    v-model="referencias.financiera.tipo_producto"
                    label="Tipo producto"
                    placeholder="Ej. Cuenta, crédito, tarjeta"
                  />
                  <CampoTexto
                    v-model="referencias.financiera.numero_cuenta"
                    label="No. cuenta"
                    placeholder="Número"
                    solo-numeros
                  />
                  <CampoTexto
                    v-model="referencias.financiera.contacto"
                    label="Contacto"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                  />
                </div>

                <div :style="{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '120px 1fr 160px',
                  gap: 'var(--sp-lg)',
                  alignItems: 'start',
                }">
                  <CampoTexto :model-value="'Comercial'" label="Tipo" disabled />
                  <CampoTexto
                    v-model="referencias.comercial.nombre_establecimiento"
                    label="Nombre establecimiento"
                    placeholder="Nombre comercial"
                  />
                  <CampoTexto
                    v-model="referencias.comercial.contacto"
                    label="Contacto"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 5: Declaraciones + Texto legal                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 5">

          <!-- ── Texto legal ────────────────────────────────────────── -->
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-xl)',
            marginBottom: 'var(--sp-xl)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-2)',
            lineHeight: '1.7',
            textAlign: 'justify',
            textJustify: 'inter-word',
          }">
            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)', textAlign: 'left' }">
              DECLARACIÓN VOLUNTARIA DE ORIGEN DE FONDOS. CONSULTA, REPORTE Y TRATAMIENTO DE DATOS PERSONALES Y CENTRALES DE RIESGOS.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizamos voluntariamente a COOPERAMIGÓ para enviar y/o confirmar operaciones y transacciones
              que realicemos con dicha entidad y/o información sobre obligaciones crediticias y/o información
              de campañas comerciales realizadas por la cooperativa, a través de cualquier medio de comunicación.
              La información puede enviarse al teléfono celular y/o al correo electrónico reportado como de nuestro
              uso o propiedad. El costo de los mensajes enviados será asumido por COOPERAMIGÓ.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              En cumplimiento de las normas legales, declaro a COOPERAMIGÓ bajo la gravedad de juramento que
              los fondos y bienes que poseemos provienen de las actividades lícitas descritas en el presente
              formulario. Así mismo, declaro que no admitiré que terceros efectúen depósitos en mis cuentas con
              fondos de actividades ilícitas y no efectuaré transacciones destinadas a dichas actividades
              contempladas en el Código Penal Colombiano, en el Sistema de Administración del Riesgo de Lavado de Activo y Financiamiento del Terrorismo <strong>(SARLAFT)</strong> o en cualquier norma que lo modifique o adicione.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              De igual modo, autorizo a COOPERAMIGÓ para verificar y reportar a las entidades competentes toda la información suministrada, declarando ser verídica y legal.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizo a COOPERAMIGÓ para que, con fines de información, consulte y reporte lo que se refiera al comportamiento financiero, crediticio y comercial en las centrales de riesgo.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              De igual manera autorizo a COOPERAMIGÓ para tratar mis datos personales de acuerdo con la política establecida de <strong>HABEAS DATA</strong> y para los fines relacionados con su objeto social y, en especial, para los fines legales, contractuales y comerciales descritos en la política de tratamiento de la información, publicada en la página web <strong>www.cooperamigo.coop</strong>.
            </p>
            <p>
              Si se presentan cambios en los datos consignados, me obligo a informarlos oportunamente a COOPERAMIGÓ
              y actualizar al menos una vez al año los datos plasmados en esta solicitud de afiliación para asociados.
            </p>
            <div :style="{ marginTop: 'var(--sp-lg)' }">
              <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)', textAlign: 'left' }">
                ACLARACIONES
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Autorizo a destruir los documentos anexos solicitados a la solicitud, si vencidos treinta (30) días desde la notificación de su rechazo o aplazamiento, no los hubiere reclamado.
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Manifiesto que al momento de tomar este servicio gozo de buen estado de salud y no presento ninguna enfermedad preexistente. Autorizo a cualquier institución médica que me haya atendido a suministrar mi historia clínica o a la compañía aseguradora que ella asigne.
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Manifiesto que acataré las leyes, estatutos, normas y reglamentos que rigen la Cooperativa. De igual forma acataré las decisiones que, en desarrollo de sus actividades, dicten los organismos encargados de dirección, administración y control.
              </p>
            </div>
          </div>

          <div :style="estiloSubtitulo">Documentos requeridos</div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)', marginBottom: 'var(--sp-xl)' }">
            <CapturaDocumento
              :solicitud-id="null"
              :storage-key="documentosKey"
              campo="afiliacion_cedula"
              label="Cédula de ciudadanía"
              :required="true"
              :initial-url="documentos.doc_cedula_solicitante_url"
              @completado="documentos.doc_cedula_solicitante_url = $event"
            />

            <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }">
              <div :style="{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-md)',
                padding: 'var(--sp-md) var(--sp-xl)',
                background: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
              }">
                <div :style="{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success)' : 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
                }">
                  <IconCircleCheck v-if="documentos.doc_soporte_ingresos_laboral_url" :size="18" :style="{ color: '#fff' }" />
                  <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
                </div>
                <div :style="{ flex: '1', minWidth: '0' }">
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                    {{ soporteTitulo }}
                    <span v-if="!documentos.doc_soporte_ingresos_laboral_url" :style="{ marginLeft: 'var(--sp-sm)', fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 6px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase' }">Obligatorio</span>
                  </div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                    {{ documentos.doc_soporte_ingresos_laboral_url ? 'Documento cargado correctamente' : soporteDescripcion }}
                  </div>
                </div>

                <div v-if="soporteCargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
                  <IconLoader2 :size="16" class="spin" />
                </div>
                <div v-else-if="documentos.doc_soporte_ingresos_laboral_url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
                  <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirSoporte">
                    <IconEye :size="13" /> Visualizar
                  </button>
                  <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarSoporte">
                    <IconRefresh :size="16" />
                  </button>
                </div>
                <div v-else :style="{ flexShrink: '0' }">
                  <label :style="{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
                    padding: '6px 14px', borderRadius: 'var(--r-pill)',
                    border: '1px solid var(--color-border)', background: 'white',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
                  }">
                    <IconUpload :size="14" />Subir PDF
                    <input type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFileSoporte" />
                  </label>
                </div>
              </div>

              <div v-if="soporteError" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
                {{ soporteError }}
              </div>
            </div>
          </div>

          <!-- ── Sección 10: Declaraciones SARLAFT ─────────────────── -->
          <div :style="estiloSubtitulo">Declaraciones adicionales</div>
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-lg)',
            marginBottom: 'var(--sp-xl)',
          }">
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                1. ¿Manejo o he manejado dineros públicos de la nación, departamento, municipio o algún ente descentralizado?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.maneja_dinero_publico === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.maneja_dinero_publico = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.maneja_dinero_publico === false"
                  label="No"
                  @update:model-value="() => { declaraciones.maneja_dinero_publico = false }"
                />
              </div>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                2. ¿Soy contratista con el estado, departamento, municipio o algún ente descentralizado?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_contratista_estado === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.es_contratista_estado = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_contratista_estado === false"
                  label="No"
                  @update:model-value="() => { declaraciones.es_contratista_estado = false }"
                />
              </div>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                3. ¿Actualmente soy líder comunitario o miembro de alta jerarquía en algún partido político?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_lider_politico === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.es_lider_politico = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_lider_politico === false"
                  label="No"
                  @update:model-value="() => { declaraciones.es_lider_politico = false }"
                />
              </div>
            </div>
          </div>

          <!-- ── Autorización tratamiento de datos ──────────────────── -->
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            transition: 'all var(--transition-fast)',
          }">
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 90px 90px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                Autorizo el tratamiento de mis datos personales. *
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.autoriza_tratamiento_datos === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.autoriza_tratamiento_datos = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.autoriza_tratamiento_datos === false"
                  label="No"
                  @update:model-value="() => { declaraciones.autoriza_tratamiento_datos = false }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Error general -->
        <AlertaBanner
          v-if="error"
          tipo="error"
          :mensaje="error"
          :style="{ marginTop: 'var(--sp-lg)' }"
        />

        <!-- ── Navegación ─────────────────────────────────────────────── -->
        <div :style="{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          marginTop: 'var(--sp-2xl)',
          gap: 'var(--sp-md)',
        }">
          <PortalButton
            variant="secondary"
            :full="isMobile"
            @click="paso > 1 ? irAPaso(paso - 1) : router.push('/')"
          >
            {{ paso === 1 ? 'Cancelar' : 'Anterior' }}
          </PortalButton>
          <PortalButton
            variant="primary"
            :disabled="!pasoValido"
            :loading="loading"
            :full="isMobile"
            @click="paso < 5 ? irAPaso(paso + 1) : enviarSolicitud()"
          >
            {{ paso === 5 ? (loading ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente' }}
          </PortalButton>
        </div>
      </div>
    </div>
  </div>
</template>

    <!-- Modal OTP -->
    <ModalOtpEmail
      v-if="mostrarModalOtp"
      :email="emailInicial"
      contexto="afiliacion"
      @validado="onOtpValidado"
    />

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL — Ya es asociado                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition :name="isMobile ? 'sheet-modal' : 'fade-modal'">
        <div
          v-if="mostrarModalYaAsociado"
          :style="{
            position: 'fixed', inset: '0', zIndex: '60',
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
          }" @click="mostrarModalYaAsociado = false" />

          <div :style="{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : '440px',
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
              background: 'var(--color-success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-lg)',
            }">
              <IconUserCheck :size="30" :style="{ color: 'var(--color-success)' }" />
            </div>
            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
                color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)',
              }">¡Ya haces parte de Cooperamigó!</div>
              <div :style="{
                fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
              }">
                El documento <strong :style="{ color: 'var(--color-text-1)' }">{{ numeroDocumentoInicial }}</strong> ya está vinculado como asociado activo de nuestra Cooperativa.
                <br><br>
                Puedes comunicarte al correo electrónico <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">bienestarsocial@cooperamigo.coop</span> o al contacto <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">304 455 0161</span> para obtener más información.
              </div>
            </div>
            <div :style="{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
              gap: 'var(--sp-sm)',
            }">
              <PortalButton variant="secondary" :full="isMobile" @click="mostrarModalYaAsociado = false">
                Volver
              </PortalButton>
              <PortalButton variant="primary" :full="isMobile" @click="router.push('/solicitar-credito')">
                Solicitar crédito
              </PortalButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="modalSoporteVisible" :style="{ position: 'fixed', inset: '0', zIndex: '1000', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(980px, 96vw)', height: 'min(86vh, 920px)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-lg) var(--sp-xl)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">{{ soporteTitulo }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarSoporte">
              <IconX :size="20" />
            </button>
          </div>
          <iframe :src="documentos.doc_soporte_ingresos_laboral_url" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes entrarModal {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes entrarModalSheet {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.fade-modal-enter-active  { transition: opacity 0.2s ease; }
.fade-modal-leave-active  { transition: opacity 0.15s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to      { opacity: 0; }
.sheet-modal-enter-active { transition: opacity 0.3s ease; }
.sheet-modal-leave-active { transition: opacity 0.2s ease; }
.sheet-modal-enter-from,
.sheet-modal-leave-to     { opacity: 0; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
