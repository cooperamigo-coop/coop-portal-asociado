<script setup>
import { ref, watch, computed } from 'vue'
import { useCapturaDocumento } from '@/composables/useCapturaDocumento.js'
import { useBreakpoint } from '@/composables/useBreakpoint'
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
  progreso, crearSesionQR, cancelar,
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

function cancelarConPreview() {
  urlFinal.value = null
  qrModalVisible.value = false
  cancelar()
}

// ── Notificar al padre cuando el PDF final está listo ──────────────────────
async function onFinalizar() {
  try {
    const url = await finalizarConPdf(uploadKey.value, props.campo)
    urlFinal.value = url
    emit('completado', url)
  } catch (e) {
    console.error('Error al finalizar captura:', e)
    // NO llamar cancelar() aquí: eso borra el mensaje de error y las fotos ya
    // capturadas (urlFrente/urlReverso), dejando al usuario sin aviso y
    // obligado a repetir toda la captura. finalizarConPdf ya deja estado en
    // 'error' con su mensaje — el botón "Reintentar" reintenta solo el PDF.
  }
}

// Escuchar cambios de Realtime/Polling para cuando se capturan ambos lados
// (llega desde la pestaña de captura móvil, sea el mismo celular u otro escaneando el QR)
watch([urlFrente, urlReverso], ([f, r]) => {
  if (f && r && !urlFinal.value) {
    onFinalizar()
  }
})

async function onPdfSeleccionado(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  try {
    const url = await subirPdfDirecto(uploadKey.value, props.campo, archivo)
    urlFinal.value = url
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

// Crea la sesión de captura: en escritorio muestra el QR para escanear con el
// celular; en un celular no tiene sentido mostrar un QR para sí mismo, así que
// abre directamente la vista de cámara guiada (CapturaMovilPage) en una pestaña
// nueva — esta pestaña sigue viva y detecta la subida por realtime/polling igual
// que si otro dispositivo hubiera escaneado el QR.
async function iniciarCaptura() {
  // En iOS/Safari, window.open() solo funciona de forma síncrona dentro del
  // gesto de click — si se llama después de un await pierde el permiso y el
  // navegador lo bloquea. Por eso se abre la pestaña vacía ya mismo y se
  // navega una vez que la sesión (y su URL) estén listas.
  // Sin 'noopener' aquí: necesitamos la referencia para poder navegarla luego.
  // No hay riesgo de seguridad — la pestaña solo llegará a cargar nuestra
  // propia URL de captura, nunca contenido de terceros.
  const nuevaPestana = esMovil ? window.open('', '_blank') : null

  await crearSesionQR(props.solicitudId, props.campo)
  if (!token.value) {
    nuevaPestana?.close()
    return
  }
  emit('sesion-creada', { token: token.value, sesionId: sesionId.value })
  if (esMovil) {
    // La url_captura que arma la Edge Function usa el dominio de producción
    // configurado en el backend — no sirve para probar en local/LAN. Como la
    // ruta es siempre /captura-movil/:token dentro de esta misma app, se
    // reconstruye con el origen actual (funciona igual en local, LAN o prod).
    // "mismo=1" le indica a CapturaMovilPage que esta pestaña la abrió el propio
    // formulario (no un QR escaneado desde otro dispositivo) y que debe cerrarse
    // sola al terminar en vez de pedir "continúe en su computador".
    const url = `${window.location.origin}/captura-movil/${token.value}?mismo=1`
    if (nuevaPestana) nuevaPestana.location.href = url
    else window.open(url, '_blank', 'noopener')
  } else {
    qrModalVisible.value = true
  }
}

const textoEstado = computed(() => {
  if (urlFinal.value) return 'Documento cargado correctamente'
  if (['esperando_qr', 'capturando_movil'].includes(estado.value)) {
    return esMovil ? 'Tomando fotografías en la otra pestaña…' : 'Escaneo con celular en curso'
  }
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
        <button aria-label="Cargar un documento nuevo" :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success-text)', padding: 'var(--sp-xs)', display: 'flex' }" @click="cancelarConPreview">
          <IconRefresh :size="16" />
        </button>
      </div>

      <!-- El PDF falló pero las fotos ya capturadas siguen ahí: reintentar solo el armado del PDF -->
      <div v-else-if="estado === 'error' && urlFrente && urlReverso" :style="{ display: 'flex', gap: 'var(--sp-sm)' }">
        <button @click="onFinalizar" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)' }">
          <IconRefresh :size="14" /> Reintentar
        </button>
      </div>

      <div v-else-if="estado === 'idle' || estado === 'error'" :style="{ display: 'flex', gap: 'var(--sp-sm)' }">
        <!-- Botón PDF (oculto si sinPdf) -->
        <label v-if="!sinPdf" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)', flex: isMobile ? '1' : 'unset' }">
          <IconUpload :size="14" /> Subir PDF
          <input type="file" accept=".pdf" :style="{ display: 'none' }" @change="onPdfSeleccionado" />
        </label>
        <!-- Botón Cámara -->
        <button @click="iniciarCaptura" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)', flex: isMobile ? '1' : 'unset', minWidth: isMobile ? 'unset' : '170px' }">
          <IconCamera :size="14" /> Tomar fotografía
        </button>
      </div>

      <div v-else-if="estado === 'subiendo'" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
        <IconLoader2 :size="15" class="spin" /> <span :style="{ fontSize: 'var(--text-xs)' }">Procesando…</span>
      </div>

      <!-- Captura en curso (QR en desktop / pestaña de cámara en móvil; el detalle vive en el modal) -->
      <div v-else-if="['esperando_qr', 'capturando_movil'].includes(estado)" :style="{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', flexShrink: '0' }">
        <IconLoader2 :size="14" class="spin" />
        {{ esMovil
          ? (estado === 'capturando_movil' ? 'Esperando fotografías…' : 'Abriendo cámara…')
          : (estado === 'capturando_movil' ? 'Esperando fotografías…' : 'Escaneo en curso…') }}
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
            <button aria-label="Cerrar vista previa" :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarPreview">
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
          <button aria-label="Cancelar escaneo" :style="{ position: 'absolute', top: 'var(--sp-sm)', right: 'var(--sp-sm)', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--color-bg-surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', padding: '0' }" @click="cancelarConPreview">
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
