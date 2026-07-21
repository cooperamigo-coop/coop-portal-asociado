<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { useCapturaDocumento } from '@/composables/useCapturaDocumento.js'
import { useBreakpoint } from '@/composables/useBreakpoint'
import PortalButton from '@/components/ui/PortalButton.vue'
import {
  IconCamera, IconUpload, IconQrcode, IconCircleCheck,
  IconRefresh, IconDeviceMobile, IconX, IconAlertCircle, IconClock, IconId, IconLoader2, IconEye
} from '@tabler/icons-vue'

const { isMobile } = useBreakpoint()

const props = defineProps({
  solicitudId: { type: String, default: null },
  storageKey: { type: String, default: null },
  campo: { type: String, default: 'documento_identidad' },
  label: { type: String, default: 'Documento de identidad' },
  required: { type: Boolean, default: false },
  error: { type: String, default: null },
  initialUrl: { type: String, default: null },
  sinPdf: { type: Boolean, default: false },
})
const emit = defineEmits(['completado', 'sesion-creada'])

const {
  esMovil, estado, urlFrente, urlReverso,
  qrDataUrl, urlCaptura, sesionId, token,
  error: errorCaptura,
  progreso, crearSesionQR, subirFotoLocal, iniciarCapturaMovil, cancelar,
  finalizarConPdf, subirPdfDirecto,
} = useCapturaDocumento()

const urlFinal = ref(props.initialUrl || null)
watch(() => props.initialUrl, (v) => { if (v) urlFinal.value = v })
const modalPreviewVisible = ref(false)
const qrModalVisible = ref(false)

// Cierra el modal automáticamente en cuanto el escaneo deja de estar activo
// (ambas fotos capturadas, error, o cancelado)
watch(estado, (v) => {
  if (!['esperando_qr', 'capturando_movil'].includes(v)) qrModalVisible.value = false
})

const uploadKey = computed(() => props.storageKey || props.solicitudId)

// ── Previews locales para upload directo ────────────────────────────────────
const previewFrente  = ref(null)
const previewReverso = ref(null)

function _revocarPreviews() {
  if (previewFrente.value?.startsWith('blob:'))  URL.revokeObjectURL(previewFrente.value)
  if (previewReverso.value?.startsWith('blob:')) URL.revokeObjectURL(previewReverso.value)
  previewFrente.value  = null
  previewReverso.value = null
}

function cancelarConPreview() {
  _revocarPreviews()
  urlFinal.value = null
  qrModalVisible.value = false
  cancelar()
}

onUnmounted(_revocarPreviews)

// ── Notificar al padre cuando el PDF final está listo ──────────────────────
async function onFinalizar() {
  try {
    const url = await finalizarConPdf(uploadKey.value, props.campo)
    urlFinal.value = url
    _revocarPreviews()
    emit('completado', url)
  } catch (e) {
    console.error('Error al finalizar captura:', e)
    // Volver a idle para que el usuario pueda subir PDF manualmente
    cancelar()
    _revocarPreviews()
  }
}

// Escuchar cambios de Realtime/Polling para cuando se capturan ambos en el móvil
watch([urlFrente, urlReverso], ([f, r]) => {
  if (f && r && !urlFinal.value && !esMovil) {
    onFinalizar()
  }
})

async function onPdfSeleccionado(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  try {
    const url = await subirPdfDirecto(uploadKey.value, props.campo, archivo)
    urlFinal.value = url
    _revocarPreviews()
    emit('completado', url)
  } catch (e) {
    console.error('Error al subir PDF:', e)
  }
  e.target.value = ''
}

function abrirPreview() {
  if (!urlFinal.value) return
  modalPreviewVisible.value = true
}

function cerrarPreview() {
  modalPreviewVisible.value = false
}

function onArchivoSeleccionado(lado, e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  if (archivo.type.startsWith('image/')) {
    const objUrl = URL.createObjectURL(archivo)
    if (lado === 'frente') previewFrente.value = objUrl
    else                   previewReverso.value = objUrl
  }
  subirFotoLocal(lado, archivo)
  e.target.value = ''
}

async function iniciarQR() {
  await crearSesionQR(props.solicitudId, props.campo)
  if (token.value) {
    emit('sesion-creada', { token: token.value, sesionId: sesionId.value })
    qrModalVisible.value = true
  }
}

const LADOS = [
  { key: 'frente', label: 'Frente' },
  { key: 'reverso', label: 'Reverso' },
]

const textoEstado = computed(() => {
  if (urlFinal.value) return 'Documento cargado correctamente'
  if (['esperando_qr', 'capturando_movil'].includes(estado.value) && !esMovil.value) return 'Escaneo con celular en curso'
  return 'Cargue el archivo o tome las fotografías de ambos lados'
})
</script>

<template>
  <div :style="{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: urlFinal ? 'var(--color-success-bg)' : '#f8f8f8' }">
    <!-- Header/Banner Principal -->
    <div :style="{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: 'var(--sp-md)',
      padding: isMobile ? 'var(--sp-md) var(--sp-lg)' : 'var(--sp-md) var(--sp-xl)',
    }">
      <!-- Icono + Texto -->
      <div :style="{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-md)', flex: '1', minWidth: '0' }">
        <div :style="{
          width: '36px', height: '36px', borderRadius: '50%',
          background: urlFinal ? 'var(--color-success)' : 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
        }">
          <IconCircleCheck v-if="urlFinal" :size="18" :style="{ color: '#fff' }" />
          <IconId v-else :size="18" :style="{ color: '#fff' }" />
        </div>
        <div :style="{ minWidth: '0' }">
          <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)', lineHeight: '1.1' }">
            {{ label }}<span v-if="required && !urlFinal" :style="{ color: 'var(--color-error)' }">*</span>
          </div>
          <div :style="{ fontSize: 'var(--text-sm)', color: urlFinal ? 'var(--color-success-text)' : 'var(--color-text-3)', marginTop: '0', lineHeight: '1.3' }">
            {{ textoEstado }}
          </div>
        </div>
      </div>

      <!-- Acciones (Estado Idle o Completado) -->
      <div v-if="urlFinal" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
        <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirPreview">
          <IconEye :size="13" /> Visualizar
        </button>
        <button :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success-text)', padding: 'var(--sp-xs)', display: 'flex' }" @click="cancelarConPreview">
          <IconRefresh :size="16" />
        </button>
      </div>

      <div v-else-if="estado === 'idle' || estado === 'error'" :style="{ display: 'flex', gap: 'var(--sp-sm)' }">
        <!-- Botón PDF (oculto si sinPdf) -->
        <label v-if="!sinPdf" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)', flex: isMobile ? '1' : 'unset' }">
          <IconUpload :size="14" /> Subir PDF
          <input type="file" accept=".pdf" :style="{ display: 'none' }" @change="onPdfSeleccionado" />
        </label>
        <!-- Botón Cámara -->
        <button @click="esMovil ? iniciarCapturaMovil() : iniciarQR()" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)', flex: isMobile ? '1' : 'unset', minWidth: isMobile ? 'unset' : '170px' }">
          <IconCamera :size="14" /> Tomar fotografía
        </button>
      </div>

      <div v-else-if="estado === 'subiendo'" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
        <IconLoader2 :size="15" class="spin" /> <span :style="{ fontSize: 'var(--text-xs)' }">Procesando…</span>
      </div>

      <!-- Escaneo con QR en curso (el detalle vive en el modal) -->
      <div v-else-if="['esperando_qr', 'capturando_movil'].includes(estado) && !esMovil" :style="{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
        <IconLoader2 :size="14" class="spin" /> {{ estado === 'capturando_movil' ? 'Esperando fotografías…' : 'Escaneo en curso…' }}
      </div>
    </div>

    <!-- ══ ÁREA EXPANDIDA (Solo cuando hay proceso activo) ════════════ -->
    <div v-if="!urlFinal && esMovil" :style="{ padding: 'var(--sp-lg)' }">

      <!-- Fotos directas en móvil -->
      <div v-if="(esMovil && estado === 'idle_movil') || (esMovil && !urlFinal)" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }">
          <label v-for="lado in LADOS" :key="lado.key" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: 'var(--r-lg)', background: (lado.key === 'frente' ? urlFrente : urlReverso) ? 'var(--color-success-bg)' : 'white' }">
            <IconCamera :size="16" :style="{ color: 'var(--color-primary)' }" />
            <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }">{{ (lado.key === 'frente' ? urlFrente : urlReverso) ? 'Listo ✓' : lado.label }}</span>
            <input type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onArchivoSeleccionado(lado.key, $event)" />
          </label>
        </div>
        <PortalButton v-if="urlFrente && urlReverso" variant="primary" :full="true" size="sm" @click="onFinalizar">Generar PDF</PortalButton>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorCaptura || error" :style="{ padding: '8px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: 'var(--text-xs)', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
      {{ errorCaptura || error }}
    </div>

    <Teleport to="body">
      <div v-if="modalPreviewVisible" :style="{ position: 'fixed', inset: '0', zIndex: '1000', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(980px, 96vw)', height: 'min(86vh, 920px)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-lg) var(--sp-xl)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">{{ label }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarPreview">
              <IconX :size="20" />
            </button>
          </div>
          <iframe :src="urlFinal" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>
    </Teleport>

    <!-- Modal de escaneo QR -->
    <Teleport to="body">
      <div v-if="qrModalVisible" :style="{ position: 'fixed', inset: '0', zIndex: '1000', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(360px, 92vw)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-xl)', gap: 'var(--sp-md)', position: 'relative' }">
          <button :style="{ position: 'absolute', top: 'var(--sp-sm)', right: 'var(--sp-sm)', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--color-bg-surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', padding: '0' }" @click="cancelarConPreview">
            <IconX :size="13" />
          </button>

          <div :style="{ marginTop: 'var(--sp-md)' }">
            <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)', textAlign: 'center', lineHeight: '1.05' }">
              Prepare su documento y escanee<br />este QR con su celular
            </div>
            <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textAlign: 'center', marginTop: '2px' }">
              Se capturará el frente y reverso de su documento de identificación.
            </div>
          </div>

          <div :style="{ padding: '10px', borderRadius: 'var(--r-lg)', border: '1px solid var(--color-border)', display: 'inline-flex', opacity: estado === 'capturando_movil' ? 0.35 : 1, transition: 'opacity var(--transition-fast)' }">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" :style="{ width: '160px', height: '160px', display: 'block' }" />
          </div>

          <!-- Progreso de captura: anverso / reverso -->
          <div :style="{ width: '100%' }">
            <div :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }">
              <span :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: urlFrente ? 'var(--color-success-text)' : 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: '3px' }">
                <IconCircleCheck v-if="urlFrente" :size="12" /> Frente
              </span>
              <span :style="{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: urlReverso ? 'var(--color-success-text)' : 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: '3px' }">
                Reverso <IconCircleCheck v-if="urlReverso" :size="12" />
              </span>
            </div>
            <div :style="{ height: '6px', borderRadius: 'var(--r-pill)', background: 'var(--color-border-light)', overflow: 'hidden' }">
              <div :style="{
                height: '100%', borderRadius: 'var(--r-pill)', background: 'var(--color-success)',
                width: (( (urlFrente ? 1 : 0) + (urlReverso ? 1 : 0) ) / 2 * 100) + '%',
                transition: 'width var(--transition-fast)',
              }" />
            </div>
          </div>

          <div v-if="estado === 'capturando_movil'" :style="{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-3)', fontSize: '11px', fontWeight: 'var(--fw-semibold)' }">
            <IconLoader2 :size="12" class="spin" /> Esperando fotografías…
          </div>
          <div :style="{ fontSize: '10px', color: 'var(--color-text-3)', textAlign: 'center' }">
            Al terminar, esta ventana se cerrará automáticamente.
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
