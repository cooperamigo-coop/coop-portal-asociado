<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }, // formato YYYY-MM-DD
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  minYear:    { type: Number, default: 1930 },
  maxYear:    { type: Number, default: new Date().getFullYear() },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const diaActual  = ref(1)
const mesActual  = ref(1)
const anioActual = ref(new Date().getFullYear() - 30)

const containerRef = ref(null)
const pickerRef    = ref(null)
const abierto      = ref(false)

const dropdownStyle = ref({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '0',
  zIndex: '9999',
})

function calcularPosicion() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const pickerHeight = 280 // Estimación de la altura del picker (cabecera + tambores)

  let top = rect.bottom + 4
  
  // Si no cabe abajo, abrir arriba
  if (top + pickerHeight > viewportHeight && rect.top > pickerHeight) {
    top = rect.top - pickerHeight - 4
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

function abrir() {
  calcularPosicion()
  abierto.value = true
}

function cerrar() {
  abierto.value = false
  emit('blur')
}

function onClickFuera(e) {
  if (!abierto.value) return
  const clickEnContenedor = containerRef.value?.contains(e.target)
  const clickEnPicker = pickerRef.value?.contains(e.target)
  if (!clickEnContenedor && !clickEnPicker) {
    cerrar()
  }
}

function actualizarPosicion() {
  if (!abierto.value) return
  calcularPosicion()
}

onMounted(() => {
  document.addEventListener('mousedown', onClickFuera)
  window.addEventListener('scroll', actualizarPosicion, true)
  window.addEventListener('resize', actualizarPosicion)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickFuera)
  window.removeEventListener('scroll', actualizarPosicion, true)
  window.removeEventListener('resize', actualizarPosicion)
})

watch(() => props.modelValue, (val) => {
  if (!val) return
  const [y, m, d] = val.split('-').map(Number)
  if (y) anioActual.value = y
  if (m) mesActual.value  = m
  if (d) diaActual.value  = d
}, { immediate: true })

const diasDelMes = computed(() => {
  const dias = new Date(anioActual.value, mesActual.value, 0).getDate()
  return Array.from({ length: dias }, (_, i) => i + 1)
})

const meses = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const anios = computed(() => {
  const arr = []
  for (let y = props.maxYear; y >= props.minYear; y--) arr.push(y)
  return arr
})

watch([mesActual, anioActual], () => {
  if (diaActual.value > diasDelMes.value.length) {
    diaActual.value = diasDelMes.value.length
  }
  emitirValor()
})
watch(diaActual, emitirValor)

function emitirValor() {
  const d = String(diaActual.value).padStart(2, '0')
  const m = String(mesActual.value).padStart(2, '0')
  const y = String(anioActual.value)
  emit('update:modelValue', `${y}-${m}-${d}`)
}

const refDias  = ref(null)
const refMeses = ref(null)
const refAnios = ref(null)

const ITEM_H = 40

function scrollAIndex(el, index) {
  if (!el) return
  el.scrollTop = index * ITEM_H
}

function onScrollDias(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  diaActual.value = diasDelMes.value[Math.min(idx, diasDelMes.value.length - 1)]
}
function onScrollMeses(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  mesActual.value = idx + 1
}
function onScrollAnios(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  anioActual.value = anios.value[idx] ?? anios.value[0]
}

onMounted(() => {
  const dIdx = diasDelMes.value.indexOf(diaActual.value)
  const mIdx = mesActual.value - 1
  const aIdx = anios.value.indexOf(anioActual.value)
  setTimeout(() => {
    scrollAIndex(refDias.value,  dIdx  >= 0 ? dIdx  : 0)
    scrollAIndex(refMeses.value, mIdx  >= 0 ? mIdx  : 0)
    scrollAIndex(refAnios.value, aIdx  >= 0 ? aIdx  : 0)
  }, 50)
})

const floated = computed(() => abierto.value || !!props.modelValue)

const valorFormateado = computed(() => {
  const d = String(diaActual.value).padStart(2, '0')
  const m = String(mesActual.value).padStart(2, '0')
  const y = String(anioActual.value)
  return `${d}/${m}/${y}`
})
</script>

<template>
  <div ref="containerRef" class="fecha-wrapper">
    <!-- Trigger con label flotante integrada para alineación perfecta -->
    <div
      class="fecha-field"
      :class="{
        'fecha-field--floated':  floated,
        'fecha-field--open':     abierto,
        'fecha-field--error':    !!error,
      }"
      @click="abierto ? cerrar() : abrir()"
    >
      <!-- Valor seleccionado -->
      <span class="fecha-value" :class="{ 'fecha-value--empty': !modelValue }">
        {{ modelValue ? valorFormateado : '' }}
      </span>

      <!-- Label flotante -->
      <label
        class="fecha-label"
        :class="{
          'fecha-label--focused': abierto && !error,
          'fecha-label--error':   !!error,
        }"
      >
        {{ label }}<span v-if="required" class="fecha-required"> *</span>
      </label>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="fecha-chevron"
        :style="{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- Picker -->
    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div v-if="abierto" ref="pickerRef" :style="{
          ...dropdownStyle,
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--r-xl)',
          boxShadow:    'var(--shadow-modal)',
          overflow:     'hidden',
        }">
          <!-- Cabecera -->
          <div :style="{
            display:             'grid',
            gridTemplateColumns: '1fr 2fr 2fr',
            textAlign:           'center',
            padding:             'var(--sp-sm) 0',
            borderBottom:        '1px solid var(--color-border-light)',
            fontSize:            'var(--text-xs)',
            fontWeight:          'var(--fw-bold)',
            color:               'var(--color-text-3)',
            textTransform:       'uppercase',
            letterSpacing:       '0.06em',
          }">
            <span>Día</span>
            <span>Mes</span>
            <span>Año</span>
          </div>

          <!-- Tambores -->
          <div :style="{
            display:             'grid',
            gridTemplateColumns: '1fr 2fr 2fr',
            height:              '200px',
            position:            'relative',
          }">
            <!-- Franja de selección central -->
            <div :style="{
              position:     'absolute',
              top:          '50%',
              left:         'var(--sp-sm)',
              right:        'var(--sp-sm)',
              height:       `${ITEM_H}px`,
              transform:    'translateY(-50%)',
              background:   'var(--color-primary-light)',
              borderRadius: 'var(--r-md)',
              pointerEvents:'none',
              zIndex:       '1',
            }" />

            <!-- Columna Días -->
            <div
              ref="refDias"
              :style="{
                overflowY:     'scroll',
                height:        '100%',
                padding:       '80px 0',
                scrollbarWidth:'none',
                msOverflowStyle:'none',
              }"
              @scroll="onScrollDias"
            >
              <div
                v-for="d in diasDelMes"
                :key="d"
                :style="{
                  height:         `${ITEM_H}px`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       'var(--text-base)',
                  fontWeight:     diaActual === d ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          diaActual === d ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                }"
              >{{ String(d).padStart(2, '0') }}</div>
            </div>

            <!-- Columna Meses -->
            <div
              ref="refMeses"
              :style="{
                overflowY:     'scroll',
                height:        '100%',
                padding:       '80px 0',
                scrollbarWidth:'none',
                msOverflowStyle:'none',
              }"
              @scroll="onScrollMeses"
            >
              <div
                v-for="(m, idx) in meses"
                :key="m"
                :style="{
                  height:         `${ITEM_H}px`,
                  display:        'flex',
                  alignItems:     'center', 
                  justifyContent: 'center',
                  fontSize:       'var(--text-base)',
                  fontWeight:     mesActual === (idx + 1) ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          mesActual === (idx + 1) ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                }"
              >{{ m }}</div>
            </div>

            <!-- Columna Años -->
            <div
              ref="refAnios"
              :style="{
                overflowY:     'scroll',
                height:        '100%',
                padding:       '80px 0',
                scrollbarWidth:'none',
                msOverflowStyle:'none',
              }"
              @scroll="onScrollAnios"
            >
              <div
                v-for="a in anios"
                :key="a"
                :style="{
                  height:         `${ITEM_H}px`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       'var(--text-base)',
                  fontWeight:     anioActual === a ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          anioActual === a ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                }"
              >{{ a }}</div>
            </div>
          </div>

          <!-- Pie: Botón confirmar -->
          <div :style="{
            padding:      'var(--sp-md) var(--sp-lg)',
            borderTop:    '1px solid var(--color-border-light)',
            textAlign:    'right',
            background:   'var(--color-bg-surface)',
          }">
            <button
              :style="{
                padding:      '8px 20px',
                background:   'var(--color-primary)',
                color:        'white',
                border:       'none',
                borderRadius: 'var(--r-md)',
                fontSize:     'var(--text-sm)',
                fontWeight:   'var(--fw-bold)',
                cursor:       'pointer',
              }"
              @click="emitirValor(); cerrar()"
            >Confirmar</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Error -->
    <span v-if="error" class="fecha-msg fecha-msg--error">{{ error }}</span>
  </div>
</template>

<style scoped>
.fecha-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.fecha-field {
  position: relative;
  height: 54px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.fecha-field--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.fecha-field--error {
  border-color: var(--color-error) !important;
}

.fecha-value {
  font-size: var(--text-base);
  color: var(--color-text-1);
  font-family: var(--font-body);
}

.fecha-value--empty {
  color: transparent;
}

.fecha-chevron {
  color: var(--color-text-3);
  transition: transform var(--transition-fast);
  margin-left: auto;
}

/* ── Label flotante (Igual que CampoSelectBuscable y CampoTexto) ── */
.fecha-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-medium);
  color: var(--color-text-3);
  background: transparent;
  padding: 0 2px;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 40px);
  transition: all var(--transition-fast);
}

.fecha-field--floated .fecha-label {
  top: 0;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: var(--fw-semibold);
  background: var(--color-bg-card);
  padding: 0 3px;
}

.fecha-label--focused { color: var(--color-primary); }
.fecha-label--error   { color: var(--color-error-text); }
.fecha-required       { color: var(--color-primary); }

.fecha-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.fecha-msg--error { color: var(--color-error-text); }

/* Transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
