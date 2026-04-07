<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { consultarEstadoCaptura, subirFotoCaptura } from '@/services/captura.service'
import { IconCamera, IconCircleCheck, IconAlertCircle, IconRefresh, IconX } from '@tabler/icons-vue'

const route = useRoute()
const token = route.params.token

// Estado: cargando | listo | subiendo | completado | error
const estado        = ref('cargando')
const sesionInfo    = ref(null)
const error         = ref(null)
const urlFrente     = ref(null)
const urlReverso    = ref(null)
const subiendoLado  = ref(null) // 'frente' | 'reverso'

const refFrenteInput  = ref(null)
const refReversoInput = ref(null)

onMounted(async () => {
  try {
    const data = await consultarEstadoCaptura(token)
    sesionInfo.value = data
    if (data.url_frente)  urlFrente.value  = data.url_frente
    if (data.url_reverso) urlReverso.value = data.url_reverso
    if (data.estado === 'completado') {
      estado.value = 'completado'
    } else {
      estado.value = 'listo'
    }
  } catch (e) {
    estado.value = 'error'
    error.value  = e.message
  }
})

function abrirCamara(lado) {
  if (lado === 'frente') refFrenteInput.value?.click()
  else refReversoInput.value?.click()
}

async function onFoto(e, lado) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  e.target.value = ''
  subiendoLado.value = lado
  estado.value = 'subiendo'
  error.value  = null
  try {
    const data = await subirFotoCaptura(token, lado, archivo)
    if (lado === 'frente') urlFrente.value  = data.url
    else                   urlReverso.value = data.url

    if (data.estado === 'completado') {
      estado.value = 'completado'
    } else {
      estado.value = 'listo'
    }
  } catch (e) {
    error.value  = e.message
    estado.value = 'listo'
  } finally {
    subiendoLado.value = null
  }
}

const ambosCompletos = () => urlFrente.value && urlReverso.value
</script>

<template>
  <div class="movil-page">

    <!-- Header -->
    <header class="movil-header">
      <img src="/favicon.svg" alt="Cooperamigó" class="movil-logo" />
      <span class="movil-header-title">Captura de documento</span>
    </header>

    <!-- ── Cargando ─────────────────────────────────────────── -->
    <div v-if="estado === 'cargando'" class="movil-center">
      <div class="spinner"></div>
      <p class="movil-hint">Verificando sesión…</p>
    </div>

    <!-- ── Error de sesión ─────────────────────────────────── -->
    <div v-else-if="estado === 'error'" class="movil-center">
      <div class="icon-wrap icon-wrap--error">
        <IconAlertCircle :size="40" />
      </div>
      <p class="movil-title">Sesión no válida</p>
      <p class="movil-hint">{{ error || 'El enlace ha expirado o no es válido. Vuelva al computador y genere un nuevo código QR.' }}</p>
    </div>

    <!-- ── Completado ──────────────────────────────────────── -->
    <div v-else-if="estado === 'completado'" class="movil-center">
      <div class="icon-wrap icon-wrap--ok">
        <IconCircleCheck :size="48" />
      </div>
      <p class="movil-title">¡Listo!</p>
      <p class="movil-hint">Ambas caras de su cédula fueron enviadas exitosamente. Puede cerrar esta ventana y continuar en el computador.</p>
    </div>

    <!-- ── Captura (listo | subiendo) ─────────────────────── -->
    <div v-else class="movil-body">

      <!-- Instrucción -->
      <p class="movil-instruccion">
        Tome una foto nítida de cada cara de su cédula de ciudadanía con buena iluminación.
      </p>

      <!-- Error parcial -->
      <div v-if="error" class="movil-error-banner">
        <IconAlertCircle :size="16" />
        {{ error }}
        <button class="movil-error-close" @click="error = null"><IconX :size="14" /></button>
      </div>

      <!-- Cara frontal -->
      <div class="movil-card" :class="urlFrente ? 'movil-card--ok' : ''">
        <div class="movil-card-header">
          <div class="movil-card-icon" :class="urlFrente ? 'movil-card-icon--ok' : 'movil-card-icon--pending'">
            <IconCircleCheck v-if="urlFrente" :size="20" />
            <span v-else class="movil-card-num">1</span>
          </div>
          <div class="movil-card-info">
            <div class="movil-card-title">Cara frontal</div>
            <div class="movil-card-sub">{{ urlFrente ? 'Foto recibida' : 'Foto de la parte delantera' }}</div>
          </div>
        </div>
        <img v-if="urlFrente" :src="urlFrente" alt="Cara frontal" class="movil-preview" />
        <button
          class="movil-btn"
          :class="urlFrente ? 'movil-btn--secondary' : 'movil-btn--primary'"
          :disabled="estado === 'subiendo'"
          @click="abrirCamara('frente')"
        >
          <template v-if="subiendoLado === 'frente'">
            <div class="spinner spinner--sm"></div> Subiendo…
          </template>
          <template v-else>
            <IconCamera :size="20" />
            {{ urlFrente ? 'Repetir foto frontal' : 'Fotografiar cara frontal' }}
          </template>
        </button>
      </div>

      <!-- Cara reverso -->
      <div class="movil-card" :class="urlReverso ? 'movil-card--ok' : ''">
        <div class="movil-card-header">
          <div class="movil-card-icon" :class="urlReverso ? 'movil-card-icon--ok' : 'movil-card-icon--pending'">
            <IconCircleCheck v-if="urlReverso" :size="20" />
            <span v-else class="movil-card-num">2</span>
          </div>
          <div class="movil-card-info">
            <div class="movil-card-title">Cara posterior</div>
            <div class="movil-card-sub">{{ urlReverso ? 'Foto recibida' : 'Foto de la parte trasera' }}</div>
          </div>
        </div>
        <img v-if="urlReverso" :src="urlReverso" alt="Cara posterior" class="movil-preview" />
        <button
          class="movil-btn"
          :class="urlReverso ? 'movil-btn--secondary' : 'movil-btn--primary'"
          :disabled="estado === 'subiendo' || !urlFrente"
          @click="abrirCamara('reverso')"
        >
          <template v-if="subiendoLado === 'reverso'">
            <div class="spinner spinner--sm"></div> Subiendo…
          </template>
          <template v-else>
            <IconCamera :size="20" />
            {{ urlReverso ? 'Repetir foto posterior' : 'Fotografiar cara posterior' }}
          </template>
        </button>
        <p v-if="!urlFrente" class="movil-hint-small">Complete primero la cara frontal</p>
      </div>

      <!-- Inputs ocultos -->
      <input ref="refFrenteInput"  type="file" accept="image/*" capture="environment" style="display:none" @change="e => onFoto(e, 'frente')" />
      <input ref="refReversoInput" type="file" accept="image/*" capture="environment" style="display:none" @change="e => onFoto(e, 'reverso')" />
    </div>

  </div>
</template>

<style scoped>
.movil-page {
  min-height: 100dvh;
  background: var(--color-dark);
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
}

/* Header */
.movil-header {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-lg) var(--sp-xl);
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.movil-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.movil-header-title {
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.02em;
}

/* Centro (estado cargando / error / completado) */
.movil-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sp-2xl) var(--sp-xl);
  gap: var(--sp-lg);
  text-align: center;
}

.movil-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--fw-extrabold);
  color: #ffffff;
  margin: 0;
}
.movil-hint {
  font-size: var(--text-base);
  color: rgba(255,255,255,0.6);
  margin: 0;
  line-height: 1.6;
  max-width: 320px;
}

/* Íconos de estado */
.icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrap--ok    { background: var(--color-success); color: #ffffff; }
.icon-wrap--error { background: var(--color-error);   color: #ffffff; }

/* Body captura */
.movil-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  padding: var(--sp-xl);
  overflow-y: auto;
}

.movil-instruccion {
  font-size: var(--text-sm);
  color: rgba(255,255,255,0.55);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}

/* Error banner */
.movil-error-banner {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--r-xl);
  font-size: var(--text-sm);
  color: var(--color-error);
  font-weight: var(--fw-semibold);
}
.movil-error-close {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  margin-left: auto;
  color: var(--color-error);
  padding: 0;
}

/* Tarjetas */
.movil-card {
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: var(--r-2xl);
  padding: var(--sp-xl);
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  transition: border-color 0.2s;
}
.movil-card--ok {
  border-color: var(--color-success);
  background: rgba(var(--color-success-rgb, 39,174,96), 0.08);
}

.movil-card-header {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
}
.movil-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: var(--fw-bold);
}
.movil-card-icon--ok      { background: var(--color-success); color: #ffffff; }
.movil-card-icon--pending { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); }
.movil-card-num { font-size: var(--text-base); }

.movil-card-title {
  font-weight: var(--fw-bold);
  font-size: var(--text-base);
  color: #ffffff;
}
.movil-card-sub {
  font-size: var(--text-sm);
  color: rgba(255,255,255,0.5);
}

/* Miniatura */
.movil-preview {
  width: 100%;
  border-radius: var(--r-xl);
  object-fit: cover;
  max-height: 160px;
}

/* Botones de captura */
.movil-btn {
  width: 100%;
  height: 56px;
  border-radius: var(--r-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  cursor: pointer;
  border: none;
  transition: opacity 0.2s, transform 0.1s;
  letter-spacing: 0.02em;
}
.movil-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.movil-btn:active:not(:disabled) {
  transform: scale(0.98);
}
.movil-btn--primary {
  background: var(--color-primary);
  color: #ffffff;
}
.movil-btn--secondary {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85);
  border: 1.5px solid rgba(255,255,255,0.2);
}

.movil-hint-small {
  font-size: var(--text-xs);
  color: rgba(255,255,255,0.35);
  margin: 0;
  text-align: center;
}

/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner--sm {
  width: 18px;
  height: 18px;
  border-width: 2px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
