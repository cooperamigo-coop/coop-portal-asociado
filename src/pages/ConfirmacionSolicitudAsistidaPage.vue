<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import ModalAutorizaciones from '@/components/forms/ModalAutorizaciones.vue'
import ModalOtpEmail from '@/components/forms/ModalOtpEmail.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import {
  IconLoader2, IconCircleCheck, IconAlertTriangle,
} from '@tabler/icons-vue'
import {
  obtenerSolicitudAsistidaPorToken,
  confirmarSolicitudAsistida,
} from '@/services/confirmacionAsistida.service'
import { useFirmaElectronica } from '@/composables/useFirmaElectronica'

const route = useRoute()
const token = computed(() => route.query.token || '')
const tipo = computed(() => (route.query.tipo === 'afiliacion' ? 'afiliacion' : 'credito'))

// paso: 'cargando' | 'otp' | 'revisar' | 'firmar' | 'enviando' | 'exito' | 'error'
const paso = ref('cargando')
const solicitud = ref(null)
const errorMsg = ref('')

const emailAsociado = computed(() => solicitud.value?.correo_electronico || solicitud.value?.email || '')
const nombreAsociado = computed(() => {
  const s = solicitud.value
  if (!s) return ''
  return `${s.nombres || ''} ${s.apellidos || ''}`.trim()
})

const {
  firmaImagen, firmaCanvasRef, firmaFileRef,
  prepararCanvasEnSiguienteTick, iniciarTrazo, moverTrazo, terminarTrazo, limpiarTrazo,
  cargarFirmaImagen, capturarMetadataForense,
} = useFirmaElectronica()

const nombreFirma = ref('')
const numDocFirma = ref('')
const firmaMetodo = ref('dibujar')

const esCreditoEducativo = computed(() => tipo.value === 'credito' && solicitud.value?.modalidad_credito === 'educativo')
const beneficiarioNombre = ref('')
const autorizaDesembolsoDirecto = ref(false)

onMounted(async () => {
  if (!token.value) {
    errorMsg.value = 'El enlace no contiene un token válido.'
    paso.value = 'error'
    return
  }
  try {
    const data = await obtenerSolicitudAsistidaPorToken(token.value, tipo.value)
    if (data?.error) {
      const mapa = {
        token_invalido: 'El enlace no es válido o ha expirado.',
        solicitud_no_disponible: 'Esta solicitud no está disponible para confirmación en este momento.',
        token_expirado: 'El enlace de confirmación expiró. Solicita que el asesor te reenvíe la invitación.',
        tipo_invalido: 'El enlace no es válido.',
      }
      errorMsg.value = mapa[data.error] || 'No se pudo cargar la solicitud.'
      paso.value = 'error'
      return
    }
    solicitud.value = data
    nombreFirma.value = nombreAsociado.value
    numDocFirma.value = data.numero_identificacion || data.cedula || ''
    paso.value = 'otp'
  } catch {
    errorMsg.value = 'No se pudo verificar el enlace. Intenta nuevamente.'
    paso.value = 'error'
  }
})

function onOtpValidado() {
  paso.value = 'revisar'
}

const modalAutorizacionesVisible = ref(false)
const autorizacionAceptada = ref(false)

function irAAutorizar() {
  modalAutorizacionesVisible.value = true
}

function onAutorizacionAceptada() {
  autorizacionAceptada.value = true
  paso.value = 'firmar'
  nextTick(() => prepararCanvasEnSiguienteTick())
}

function seleccionarMetodo(metodo) {
  firmaMetodo.value = metodo
  firmaImagen.value = ''
  if (metodo === 'dibujar') prepararCanvasEnSiguienteTick()
}

function formatMonto(n) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

async function enviarConfirmacion() {
  if (!nombreFirma.value.trim() || !firmaImagen.value) return
  if (esCreditoEducativo.value && (!beneficiarioNombre.value.trim() || !autorizaDesembolsoDirecto.value)) return
  paso.value = 'enviando'
  try {
    const evidencia = await capturarMetadataForense({
      identificacion: numDocFirma.value || '',
      nombre: nombreFirma.value.trim(),
    })
    evidencia.firma_metodo = firmaMetodo.value
    if (esCreditoEducativo.value) {
      evidencia.beneficiario_nombre = beneficiarioNombre.value.trim()
      evidencia.autorizacion_desembolso_directo_educativo = true
    }

    const resultado = await confirmarSolicitudAsistida(token.value, tipo.value, evidencia)
    if (resultado?.error) {
      const mapa = {
        no_disponible_o_expirado: 'Esta solicitud ya fue confirmada o el enlace expiró.',
        tipo_invalido: 'El enlace no es válido.',
      }
      errorMsg.value = mapa[resultado.error] || 'No se pudo confirmar la solicitud.'
      paso.value = 'error'
      return
    }
    paso.value = 'exito'
  } catch {
    errorMsg.value = 'Error al enviar la confirmación. Intenta nuevamente.'
    paso.value = 'error'
  }
}
</script>

<template>
  <PortalLayout>
    <div :style="{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: paso === 'cargando' || paso === 'enviando' ? 'center' : 'flex-start',
      padding: '0 0 64px',
    }">

      <!-- CARGANDO -->
      <div v-if="paso === 'cargando'" :style="{ textAlign: 'center' }">
        <IconLoader2 :size="44" :style="{ color: 'var(--color-primary)', animation: 'girar 1s linear infinite' }" />
        <p :style="{ marginTop: '14px', color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">Verificando enlace...</p>
      </div>

      <!-- ENVIANDO -->
      <div v-else-if="paso === 'enviando'" :style="{ textAlign: 'center' }">
        <IconLoader2 :size="44" :style="{ color: 'var(--color-primary)', animation: 'girar 1s linear infinite' }" />
        <p :style="{ marginTop: '14px', color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">Guardando tu confirmación...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="paso === 'error'" :style="{
        maxWidth: '480px', width: '100%', background: 'var(--color-bg-card)',
        borderRadius: 'var(--r-lg)', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
      }">
        <IconAlertTriangle :size="52" :style="{ color: 'var(--color-error)', marginBottom: '16px' }" />
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '10px' }">
          Enlace no disponible
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', lineHeight: '1.7' }">{{ errorMsg }}</p>
      </div>

      <!-- OTP -->
      <template v-if="paso === 'otp'">
        <div :style="{ maxWidth: '480px', width: '100%', textAlign: 'center' }">
          <h2 :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '6px' }">
            Verificación de identidad
          </h2>
          <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }">
            Un asesor de Cooperamigó diligenció esta solicitud en tu nombre. Recibirás un código de verificación
            en tu correo para revisarla y confirmarla.
          </p>
        </div>
        <ModalOtpEmail :email="emailAsociado" :contexto="tipo" @validado="onOtpValidado" />
      </template>

      <!-- REVISAR -->
      <div v-else-if="paso === 'revisar'" :style="{ maxWidth: '640px', width: '100%' }">
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '12px' }">
          Revisa los datos de tu solicitud
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }">
          <strong>{{ solicitud?.nombre_asesor || 'Un asesor de la cooperativa' }}</strong> diligenció esta solicitud
          por ti. Revisa cuidadosamente la información y, si todo es correcto, continúa para autorizar el
          tratamiento de tus datos y firmar electrónicamente. Solo hasta ese momento tu solicitud quedará radicada.
        </p>

        <div :style="{
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)',
        }">
          <p :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }">
            Tus datos
          </p>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div v-if="nombreAsociado">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Nombre</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ nombreAsociado }}</p>
            </div>
            <div v-if="solicitud?.numero_identificacion">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Identificación</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.numero_identificacion }}</p>
            </div>
            <div v-if="emailAsociado">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Correo</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ emailAsociado }}</p>
            </div>
          </div>
        </div>

        <div v-if="tipo === 'credito'" :style="{
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)',
        }">
          <p :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }">
            Datos del crédito
          </p>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Valor solicitado</p>
              <p :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">
                {{ formatMonto(solicitud?.valor_credito) }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Plazo</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                {{ solicitud?.plazo_solicitado ? `${solicitud.plazo_solicitado} meses` : '—' }}
              </p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Destino</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.destino_credito || '—' }}</p>
            </div>
            <div>
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Modalidad</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.modalidad_credito || '—' }}</p>
            </div>
          </div>
        </div>

        <div v-else :style="{
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)',
        }">
          <p :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }">
            Datos de afiliación
          </p>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div v-if="solicitud?.empresa">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Empresa / ocupación</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.empresa }}</p>
            </div>
            <div v-if="solicitud?.cargo">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Cargo</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.cargo }}</p>
            </div>
            <div v-if="solicitud?.ciudad">
              <p :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: '2px' }">Ciudad</p>
              <p :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">{{ solicitud?.ciudad }}</p>
            </div>
          </div>
        </div>

        <div :style="{
          background: 'var(--color-primary-light)', borderRadius: 'var(--r-md)', padding: '14px 16px',
          marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', lineHeight: '1.6',
        }">
          Al continuar, confirmas que has revisado los datos de esta solicitud y procederás a firmarla,
          asumiendo las responsabilidades que esto implica conforme a las autorizaciones que se presentarán a continuación.
        </div>

        <PortalButton variant="primary" full @click="irAAutorizar">
          Continuar — Aceptar autorizaciones
        </PortalButton>
      </div>

      <!-- FIRMAR -->
      <div v-else-if="paso === 'firmar'" :style="{ maxWidth: '560px', width: '100%' }">
        <h2 :style="{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '4px' }">
          Firma electrónica
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginBottom: '24px' }">
          Completa los campos y dibuja tu firma para confirmar la solicitud.
        </p>

        <div :style="{ display: 'flex', flexDirection: 'column', gap: '18px' }">
          <div>
            <label :style="{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)', marginBottom: '6px' }">
              Nombre completo (tal como aparece en su cédula)
            </label>
            <input
              v-model="nombreFirma" type="text" placeholder="Ej: JUAN CAMILO PÉREZ GÓMEZ"
              :style="{
                width: '100%', boxSizing: 'border-box', height: '44px', padding: '0 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg-card)', color: 'var(--color-text-1)', outline: 'none',
              }"
            />
          </div>

          <div>
            <label :style="{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)', marginBottom: '6px' }">
              Número de identificación
            </label>
            <input
              v-model="numDocFirma" type="text" placeholder="Ej: 12345678"
              :style="{
                width: '100%', boxSizing: 'border-box', height: '44px', padding: '0 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg-card)', color: 'var(--color-text-1)', outline: 'none',
              }"
            />
          </div>

          <div v-if="esCreditoEducativo" :style="{
            background: 'var(--color-bg-card)', borderRadius: 'var(--r-lg)',
            padding: '20px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '14px',
          }">
            <p :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }">
              Desembolso directo a la institución
            </p>
            <div>
              <label :style="{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)', marginBottom: '6px' }">
                Nombre del beneficiario (institución educativa)
              </label>
              <input
                v-model="beneficiarioNombre" type="text" placeholder="Ej: UNIVERSIDAD CATÓLICA LUIS AMIGÓ"
                :style="{
                  width: '100%', boxSizing: 'border-box', height: '44px', padding: '0 12px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--r-md)',
                  fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                  background: 'var(--color-bg-card)', color: 'var(--color-text-1)', outline: 'none',
                }"
              />
            </div>
            <label :style="{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', cursor: 'pointer' }">
              <input type="checkbox" v-model="autorizaDesembolsoDirecto" :style="{ marginTop: '3px' }" />
              Autorizo que el valor de mi crédito educativo sea desembolsado directamente a la institución educativa mencionada.
            </label>
          </div>

          <div :style="{ display: 'flex', gap: '8px' }">
            <button
              v-for="m in [{ k: 'dibujar', label: 'Dibujar firma' }, { k: 'cargar', label: 'Cargar imagen' }]"
              :key="m.k"
              :style="{
                padding: '8px 16px', borderRadius: 'var(--r-md)',
                border: firmaMetodo === m.k ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: firmaMetodo === m.k ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                color: firmaMetodo === m.k ? 'var(--color-primary)' : 'var(--color-text-2)',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all var(--transition-base)',
              }"
              @click="seleccionarMetodo(m.k)"
            >{{ m.label }}</button>
          </div>

          <div v-if="firmaMetodo === 'dibujar'">
            <div :style="{ border: '1.5px solid var(--color-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'white' }">
              <canvas
                ref="firmaCanvasRef" width="720" height="220"
                :style="{ width: '100%', height: '140px', touchAction: 'none', display: 'block', cursor: 'crosshair' }"
                @mousedown="iniciarTrazo" @mousemove="moverTrazo" @mouseup="terminarTrazo" @mouseleave="terminarTrazo"
                @touchstart.prevent="iniciarTrazo" @touchmove.prevent="moverTrazo" @touchend.prevent="terminarTrazo"
              />
            </div>
            <button
              :style="{ marginTop: '6px', background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-body)' }"
              @click="limpiarTrazo"
            >Limpiar</button>
          </div>

          <div v-else-if="firmaMetodo === 'cargar'">
            <div
              :style="{ border: '2px dashed var(--color-border)', borderRadius: 'var(--r-md)', padding: '28px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg-app)' }"
              @click="firmaFileRef?.click()"
            >
              <p v-if="!firmaImagen" :style="{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }">
                Haz clic para seleccionar una imagen de tu firma (PNG o JPG)
              </p>
              <img v-else :src="firmaImagen" :style="{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }" alt="Vista previa de firma" />
            </div>
            <input ref="firmaFileRef" type="file" accept="image/png,image/jpeg" :style="{ display: 'none' }" @change="cargarFirmaImagen" />
          </div>

          <PortalButton
            variant="primary" full
            :disabled="!nombreFirma.trim() || !numDocFirma.trim() || !firmaImagen || (esCreditoEducativo && (!beneficiarioNombre.trim() || !autorizaDesembolsoDirecto))"
            @click="enviarConfirmacion"
          >
            Confirmar y firmar solicitud
          </PortalButton>
        </div>
      </div>

      <!-- ÉXITO -->
      <div v-else-if="paso === 'exito'" :style="{
        maxWidth: '480px', width: '100%', background: 'var(--color-bg-card)',
        borderRadius: 'var(--r-lg)', padding: '36px', textAlign: 'center', boxShadow: 'var(--shadow-card)',
      }">
        <IconCircleCheck :size="60" :style="{ color: 'var(--color-primary)', marginBottom: '18px' }" />
        <h2 :style="{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '10px' }">
          ¡Solicitud confirmada!
        </h2>
        <p :style="{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', lineHeight: '1.7' }">
          Tu solicitud quedó radicada exitosamente. Puedes cerrar esta ventana.
        </p>
      </div>

    </div>

    <ModalAutorizaciones
      :visible="modalAutorizacionesVisible"
      :aceptado="autorizacionAceptada"
      @update:visible="modalAutorizacionesVisible = $event"
      @aceptar="onAutorizacionAceptada"
      @rechazar="modalAutorizacionesVisible = false"
    />
  </PortalLayout>
</template>

<style scoped>
@keyframes girar {
  to { transform: rotate(360deg); }
}
</style>
