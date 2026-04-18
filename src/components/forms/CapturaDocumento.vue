<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useCapturaDocumento } from '@/composables/useCapturaDocumento.js'
import PortalButton from '@/components/ui/PortalButton.vue'
import {
  IconCamera, IconUpload, IconQrcode, IconCircleCheck,
  IconRefresh, IconDeviceMobile, IconX, IconAlertCircle, IconClock, IconId, IconLoader2, IconEye
} from '@tabler/icons-vue'

const props = defineProps({
  solicitudId: { type: String, default: null },
  campo: { type: String, default: 'documento_identidad' },
  label: { type: String, default: 'Documento de identidad' },
  required: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['completado', 'sesion-creada'])

const {
  esMovil, estado, urlFrente, urlReverso,
  qrDataUrl, urlCaptura, sesionId, token,
  error: errorCaptura,
  progreso, crearSesionQR, subirFotoLocal, cancelar,
  finalizarConPdf, subirPdfDirecto,
} = useCapturaDocumento()

const urlFinal = ref(null)
const modalPreviewVisible = ref(false)

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
  cancelar()
}

onUnmounted(_revocarPreviews)

// ── Notificar al padre cuando el PDF final está listo ──────────────────────
async function onFinalizar() {
  try {
    const url = await finalizarConPdf(props.solicitudId, props.campo)
    urlFinal.value = url
    _revocarPreviews()
    emit('completado', url)
  } catch (e) {
    console.error('Error al finalizar captura:', e)
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
    const url = await subirPdfDirecto(props.solicitudId, props.campo, archivo)
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
  }
}

const LADOS = [
  { key: 'frente', label: 'Frente' },
  { key: 'reverso', label: 'Reverso' },
]
</script>

<template>
  <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }">
    <!-- Header/Banner Principal -->
    <div :style="{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-md)',
      padding: 'var(--sp-md) var(--sp-xl)',
      background: urlFinal ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
      borderBottom: (estado !== 'idle' && !urlFinal) ? '1px solid var(--color-border-card)' : 'none',
    }">
      <!-- Icono Izquierda -->
      <div :style="{
        width: '36px', height: '36px', borderRadius: '50%',
        background: urlFinal ? 'var(--color-success)' : 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
      }">
        <IconCircleCheck v-if="urlFinal" :size="18" :style="{ color: '#fff' }" />
        <IconId v-else :size="18" :style="{ color: '#fff' }" />
      </div>

      <!-- Texto Central -->
      <div :style="{ flex: '1', minWidth: '0' }">
        <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
          {{ label }}
          <span v-if="required" :style="{ color: 'var(--color-error)', marginLeft: '4px' }">*</span>
        </div>
        <div :style="{ fontSize: 'var(--text-sm)', color: urlFinal ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
          {{ urlFinal ? 'Documento cargado correctamente' : 'Suba un PDF o tome fotos de ambos lados' }}
        </div>
      </div>

      <!-- Acciones Derecha (Estado Idle o Completado) -->
      <div v-if="urlFinal" :style="{ flexShrink: '0' }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)' }">
          <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirPreview">
            <IconEye :size="13" /> Visualizar
          </button>
          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success-text)', padding: 'var(--sp-xs)', display: 'flex' }" @click="cancelarConPreview">
            <IconRefresh :size="16" />
          </button>
        </div>
      </div>

      <div v-else-if="estado === 'idle'" :style="{ display: 'flex', gap: 'var(--sp-sm)', flexShrink: '0' }">
        <!-- Botón PDF -->
        <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)' }">
          <IconUpload :size="14" /> PDF
          <input type="file" accept=".pdf" :style="{ display: 'none' }" @change="onPdfSeleccionado" />
        </label>
        <!-- Botón Cámara -->
        <button @click="esMovil ? null : iniciarQR()" :style="{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-primary)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">
          <IconCamera :size="14" /> {{ esMovil ? 'Fotos' : 'Celular' }}
        </button>
      </div>

      <div v-else-if="estado === 'subiendo'" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
        <IconLoader2 :size="15" class="spin" /> <span :style="{ fontSize: 'var(--text-xs)' }">Procesando…</span>
      </div>
    </div>

    <!-- ══ ÁREA EXPANDIDA (Solo cuando hay proceso activo) ════════════ -->
    <div v-if="!urlFinal && estado !== 'idle' && estado !== 'subiendo'" :style="{ padding: 'var(--sp-lg)', background: 'var(--color-bg-card)' }">
      
      <!-- Flujo QR/Móvil -->
      <div v-if="['esperando_qr', 'capturando_movil'].includes(estado)" :style="{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-lg)', alignItems: 'center' }">
        <div v-if="!esMovil && qrDataUrl" :style="{ flexShrink: '0', textAlign: 'center' }">
          <img :src="qrDataUrl" alt="QR" :style="{ width: '100px', height: '100px', borderRadius: 'var(--r-lg)', border: '2px solid var(--color-primary)' }" />
          <div :style="{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '4px' }">Escanee con el celular</div>
        </div>

        <div :style="{ flex: '1', minWidth: '180px' }">
          <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '8px' }">
            {{ estado === 'capturando_movil' ? 'Capturando fotos…' : 'Siga las instrucciones en su celular' }}
          </div>
          <div :style="{ display: 'flex', gap: 'var(--sp-sm)' }">
            <div v-for="lado in LADOS" :key="lado.key" :style="{ flex: '1', padding: '6px', borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', background: (lado.key === 'frente' ? urlFrente : urlReverso) ? 'var(--color-success-bg)' : 'var(--color-bg-surface)', textAlign: 'center' }">
              <IconCircleCheck v-if="(lado.key === 'frente' ? urlFrente : urlReverso)" :size="14" :style="{ color: 'var(--color-success)' }" />
              <div v-else :style="{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-3)' }">{{ lado.label }}</div>
            </div>
          </div>
        </div>

        <button :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: 'var(--sp-xs)' }" @click="cancelarConPreview">
          <IconX :size="18" />
        </button>
      </div>

      <!-- Fotos directas en móvil -->
      <div v-if="esMovil && estado === 'idle_movil' || (esMovil && !urlFinal)" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
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
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-sm) var(--sp-md)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">{{ label }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarPreview">
              <IconX :size="18" />
            </button>
          </div>
          <iframe :src="urlFinal" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
