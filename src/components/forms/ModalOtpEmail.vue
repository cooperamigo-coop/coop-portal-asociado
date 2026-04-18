<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { IconShieldCheck, IconX, IconRefresh, IconCircleCheck } from '@tabler/icons-vue'
import { enviarOtp, verificarOtp } from '@/services/otp.service'

const props = defineProps({
  email:    { type: String, required: true },
  contexto: { type: String, required: true }, // 'afiliacion' | 'credito'
})

const emit = defineEmits(['validado'])

// ── Estado ────────────────────────────────────────────────────────────────────
// fase: 'enviando' | 'ingresando' | 'verificando' | 'exito' | 'error_envio'
const fase          = ref('enviando')
const digitos       = ref(['', '', '', ''])
const mensajeError  = ref('')
const cooldown      = ref(0)   // segundos hasta poder reenviar
const sacudiendo    = ref(false)

const inputRefs = [ref(null), ref(null), ref(null), ref(null)]
let cooldownTimer = null

// ── Utilidades ────────────────────────────────────────────────────────────────

function enmascararEmail(email) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = user.slice(0, 2)
  const asteriscos = '*'.repeat(Math.max(2, user.length - 2))
  return `${visible}${asteriscos}@${domain}`
}

function iniciarCooldown() {
  cooldown.value = 60
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

function limpiarDigitos() {
  digitos.value = ['', '', '', '']
}

// ── Envío OTP ─────────────────────────────────────────────────────────────────

async function enviar() {
  fase.value = 'enviando'
  mensajeError.value = ''
  try {
    await enviarOtp(props.email, props.contexto)
    fase.value = 'ingresando'
    iniciarCooldown()
    await nextTick()
    inputRefs[0].value?.focus()
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('Demasiados')) {
      mensajeError.value = msg
      fase.value = 'ingresando'
      iniciarCooldown()
      await nextTick()
      inputRefs[0].value?.focus()
    } else {
      mensajeError.value = msg || 'No se pudo enviar el código. Verifica la dirección de correo.'
      fase.value = 'error_envio'
    }
  }
}

async function reenviar() {
  if (cooldown.value > 0) return
  limpiarDigitos()
  mensajeError.value = ''
  await enviar()
}

// ── Inputs OTP ────────────────────────────────────────────────────────────────

function onDigitoInput(i, e) {
  const val = e.target.value.replace(/\D/g, '').slice(-1)
  digitos.value[i] = val
  e.target.value = val

  if (val && i < 3) {
    inputRefs[i + 1].value?.focus()
  }
  if (i === 3 && val) {
    verificar()
  }
}

function onDigitoKeydown(i, e) {
  if (e.key === 'Backspace' && !digitos.value[i] && i > 0) {
    digitos.value[i - 1] = ''
    inputRefs[i - 1].value?.focus()
  }
  if (e.key === 'ArrowLeft' && i > 0) {
    inputRefs[i - 1].value?.focus()
  }
  if (e.key === 'ArrowRight' && i < 3) {
    inputRefs[i + 1].value?.focus()
  }
}

function onDigitoPaste(e) {
  e.preventDefault()
  const texto = (e.clipboardData || window.clipboardData).getData('text')
  const soloNum = texto.replace(/\D/g, '').slice(0, 4)
  soloNum.split('').forEach((d, i) => { digitos.value[i] = d })
  const ultimo = Math.min(soloNum.length, 3)
  inputRefs[ultimo].value?.focus()
  if (soloNum.length === 4) verificar()
}

// ── Verificación ──────────────────────────────────────────────────────────────

async function verificar() {
  const codigo = digitos.value.join('')
  if (codigo.length < 4) return

  fase.value = 'verificando'
  mensajeError.value = ''

  try {
    const res = await verificarOtp(props.email, codigo)
    if (res?.valid) {
      fase.value = 'exito'
      clearInterval(cooldownTimer)
      setTimeout(() => emit('validado'), 1600)
    } else {
      throw new Error('Respuesta inesperada del servidor')
    }
  } catch (err) {
    mensajeError.value = err?.message || 'Código incorrecto. Inténtalo de nuevo.'
    limpiarDigitos()
    fase.value = 'ingresando'
    sacudiendo.value = true
    setTimeout(() => { sacudiendo.value = false }, 500)
    await nextTick()
    inputRefs[0].value?.focus()
  }
}

// ── Ciclo de vida ─────────────────────────────────────────────────────────────

onMounted(enviar)

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

// Bloquear scroll del body mientras el modal está abierto
onMounted(() => { document.body.style.overflow = 'hidden' })
onUnmounted(() => { document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div :style="{
      position: 'fixed', inset: '0', zIndex: '1000',
      background: 'rgba(23, 43, 54, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }">

      <!-- Card -->
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verificación de correo electrónico"
        :style="{
          background:   'var(--color-bg-card)',
          borderRadius: 'var(--r-md)',
          boxShadow:    'var(--shadow-modal)',
          border:       '1px solid var(--color-border-card)',
          width:        '100%',
          maxWidth:     '400px',
          padding:      'var(--sp-2xl)',
          position:     'relative',
        }"
      >

        <!-- ── ESTADO: enviando ──────────────────────────────────────────── -->
        <div v-if="fase === 'enviando'" :style="{ textAlign: 'center', padding: 'var(--sp-xl) 0' }">
          <div class="otp-spinner" :style="{ margin: '0 auto var(--sp-lg)' }" />
          <p :style="{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--text-base)',
            fontWeight: 'var(--fw-semibold)',
            color:      'var(--color-text-2)',
          }">Enviando código de verificación...</p>
        </div>

        <!-- ── ESTADO: error de envío ───────────────────────────────────── -->
        <div v-else-if="fase === 'error_envio'" :style="{ textAlign: 'center' }">
          <div :style="{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--color-error-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--sp-lg)',
          }">
            <IconX :size="28" :style="{ color: 'var(--color-error-text)' }" />
          </div>
          <p :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--fw-bold)',
            color:        'var(--color-text-1)',
            marginBottom: 'var(--sp-sm)',
          }">No se pudo enviar el código</p>
          <p :style="{
            fontSize:     'var(--text-sm)',
            color:        'var(--color-error-text)',
            lineHeight:   '1.5',
            marginBottom: 'var(--sp-xl)',
          }">{{ mensajeError }}</p>
          <button
            :style="{
              background:   'var(--color-primary)',
              color:        '#fff',
              border:       'none',
              borderRadius: 'var(--r-md)',
              padding:      'var(--sp-md) var(--sp-xl)',
              fontSize:     'var(--text-base)',
              fontWeight:   'var(--fw-semibold)',
              cursor:       'pointer',
              fontFamily:   'var(--font-body)',
            }"
            @click="enviar"
          >
            Reintentar
          </button>
        </div>

        <!-- ── ESTADO: éxito ────────────────────────────────────────────── -->
        <div v-else-if="fase === 'exito'" :style="{ textAlign: 'center', padding: 'var(--sp-xl) 0' }">
          <div class="otp-exito-icono" :style="{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--color-success-bg)',
            border: '2px solid var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--sp-lg)',
          }">
            <IconCircleCheck :size="40" :style="{ color: 'var(--color-success)' }" />
          </div>
          <p :style="{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--text-lg)',
            fontWeight: 'var(--fw-extrabold)',
            color:      'var(--color-success)',
            marginBottom: 'var(--sp-xs)',
          }">¡Correo verificado!</p>
          <p :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-3)',
            fontWeight: 'var(--fw-medium)',
          }">Continuando con tu solicitud...</p>
        </div>

        <!-- ── ESTADO: ingresando / verificando ─────────────────────────── -->
        <template v-else>
          <!-- Ícono -->
          <div :style="{
            width: '48px', height: '48px', borderRadius: 'var(--r-xl)',
            background: 'var(--color-bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--sp-lg)',
          }">
            <IconShieldCheck :size="24" :style="{ color: 'var(--color-primary)' }" />
          </div>

          <!-- Título -->
          <p :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-lg)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
            marginBottom: 'var(--sp-sm)',
          }">Verifica tu correo</p>

          <!-- Subtítulo -->
          <p :style="{
            fontSize:     'var(--text-sm)',
            color:        'var(--color-text-2)',
            fontWeight:   'var(--fw-medium)',
            lineHeight:   '1.6',
            marginBottom: 'var(--sp-xl)',
          }">
            Hemos enviado un código de 4 dígitos a
            <strong :style="{ color: 'var(--color-text-1)', display: 'block', marginTop: '2px' }">
              {{ enmascararEmail(email) }}
            </strong>
          </p>

          <!-- Inputs OTP -->
          <div
            :class="{ 'otp-sacudir': sacudiendo }"
            :style="{
              display: 'flex', justifyContent: 'center',
              gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)',
            }"
          >
            <input
              v-for="(_, i) in digitos"
              :key="i"
              :ref="el => { inputRefs[i].value = el }"
              :value="digitos[i]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="one-time-code"
              :disabled="fase === 'verificando'"
              class="otp-input"
              :class="{ 'otp-input--filled': digitos[i], 'otp-input--error': !!mensajeError }"
              @input="onDigitoInput(i, $event)"
              @keydown="onDigitoKeydown(i, $event)"
              @paste="i === 0 ? onDigitoPaste($event) : null"
              @focus="$event.target.select()"
            />
          </div>

          <!-- Verificando: spinner inline -->
          <div v-if="fase === 'verificando'" :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)',
          }">
            <div class="otp-spinner-sm" />
            <span :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
              Verificando...
            </span>
          </div>

          <!-- Error -->
          <p
            v-if="mensajeError && fase !== 'verificando'"
            :style="{
              fontSize:     'var(--text-sm)',
              color:        'var(--color-error-text)',
              fontWeight:   'var(--fw-medium)',
              textAlign:    'center',
              marginBottom: 'var(--sp-lg)',
              lineHeight:   '1.5',
            }"
          >{{ mensajeError }}</p>

          <!-- Reenviar -->
          <p :style="{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }">
            ¿No recibiste el código?
            <button
              :disabled="cooldown > 0 || fase === 'verificando'"
              :style="{
                background: 'none',
                border: 'none',
                padding: '0 0 0 var(--sp-xs)',
                cursor: cooldown > 0 ? 'default' : 'pointer',
                color: cooldown > 0 ? 'var(--color-text-3)' : 'var(--color-primary)',
                fontWeight: 'var(--fw-semibold)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-body)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }"
              @click="reenviar"
            >
              <IconRefresh :size="13" />
              {{ cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código' }}
            </button>
          </p>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Spinner grande ── */
.otp-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: otp-spin 0.8s linear infinite;
}

/* ── Spinner pequeño inline ── */
.otp-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: otp-spin 0.8s linear infinite;
}

@keyframes otp-spin {
  to { transform: rotate(360deg); }
}

/* ── Inputs OTP ── */
.otp-input {
  width: 56px;
  height: 64px;
  text-align: center;
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  font-family: var(--font-display);
  color: var(--color-text-1);
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--r-md);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  caret-color: transparent;
}

.otp-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  background: var(--color-bg-card);
}

.otp-input--filled {
  border-color: var(--color-primary);
  background: var(--color-bg-card);
  color: var(--color-primary);
}

.otp-input--error {
  border-color: var(--color-error) !important;
  box-shadow: none !important;
}

.otp-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Animación sacudida en error ── */
.otp-sacudir {
  animation: otp-shake 0.45s ease;
}

@keyframes otp-shake {
  0%  { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(6px); }
  45% { transform: translateX(-5px); }
  60% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
  100%{ transform: translateX(0); }
}

/* ── Icono de éxito con escala ── */
.otp-exito-icono {
  animation: otp-scale-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes otp-scale-in {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
</style>
