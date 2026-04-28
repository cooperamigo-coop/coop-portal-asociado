<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

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

// Estado temporal mientras el picker está abierto para evitar "peleas" con modelValue
const tempDia  = ref(1)
const tempMes  = ref(1)
const tempAnio = ref(new Date().getFullYear() - 30)

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
  
  const pickerHeight = 340 // Altura real con botones
  const pickerWidth  = Math.max(280, rect.width) // Mínimo 280px para que no se vea "mocho"

  let top  = rect.bottom + 4
  let left = rect.left

  // Ajuste horizontal si se sale por la derecha
  if (left + pickerWidth > window.innerWidth) {
    left = window.innerWidth - pickerWidth - 16
  }
  // Si sigue siendo menor a 0, lo dejamos en un margen pequeño
  if (left < 16) left = 16

  // Si no cabe abajo, abrir arriba
  if (top + pickerHeight > viewportHeight && rect.top > pickerHeight) {
    top = rect.top - pickerHeight - 4
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${pickerWidth}px`,
    zIndex: '9999',
  }
}

async function abrir() {
  // Al abrir, sincronizamos el estado temporal con el valor actual
  if (props.modelValue) {
    const [y, m, d] = props.modelValue.split('-').map(Number)
    tempAnio.value = y
    tempMes.value  = m
    tempDia.value  = d
  } else {
    tempAnio.value = new Date().getFullYear() - 30
    tempMes.value  = 1
    tempDia.value  = 1
  }

  calcularPosicion()
  abierto.value = true
  await nextTick()
  calcularPosicion()

  // Posicionar scrolls después de que el DOM se actualice
  setTimeout(sincronizarScrolls, 50)
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
  const dias = new Date(tempAnio.value, tempMes.value, 0).getDate()
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

// Solo emitimos el valor cuando el usuario pulsa "Confirmar"
function emitirValor() {
  const d = String(tempDia.value).padStart(2, '0')
  const m = String(tempMes.value).padStart(2, '0')
  const y = String(tempAnio.value)
  emit('update:modelValue', `${y}-${m}-${d}`)
  cerrar()
}

const refDias  = ref(null)
const refMeses = ref(null)
const refAnios = ref(null)

const ITEM_H = 40

function scrollAIndex(el, index) {
  if (!el) return
  el.scrollTop = index * ITEM_H
}

function sincronizarScrolls() {
  const dIdx = diasDelMes.value.indexOf(tempDia.value)
  const mIdx = tempMes.value - 1
  const aIdx = anios.value.indexOf(tempAnio.value)
  
  scrollAIndex(refDias.value,  dIdx  >= 0 ? dIdx  : 0)
  scrollAIndex(refMeses.value, mIdx  >= 0 ? mIdx  : 0)
  scrollAIndex(refAnios.value, aIdx  >= 0 ? aIdx  : 0)
}

function onScrollDias(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  const val = diasDelMes.value[Math.min(idx, diasDelMes.value.length - 1)]
  if (val) tempDia.value = val
}

function onScrollMeses(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  const val = Math.min(idx + 1, 12)
  if (val !== tempMes.value) {
    tempMes.value = val
    // Si al cambiar de mes el día actual excede los días del nuevo mes, ajustamos
    setTimeout(() => {
      if (tempDia.value > diasDelMes.value.length) {
        tempDia.value = diasDelMes.value.length
        scrollAIndex(refDias.value, tempDia.value - 1)
      }
    }, 10)
  }
}

function onScrollAnios(e) {
  const idx = Math.round(e.target.scrollTop / ITEM_H)
  const val = anios.value[idx] ?? anios.value[0]
  if (val !== tempAnio.value) {
    tempAnio.value = val
  }
}

const floated = computed(() => abierto.value || !!props.modelValue)

const valorFormateado = computed(() => {
  // Mientras está abierto, mostramos lo que se está seleccionando en el picker
  const d = String(abierto.value ? tempDia.value : diaActual.value).padStart(2, '0')
  const m = String(abierto.value ? tempMes.value : mesActual.value).padStart(2, '0')
  const y = String(abierto.value ? tempAnio.value : anioActual.value)
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
      <span class="fecha-value" :class="{ 'fecha-value--empty': !modelValue && !abierto }">
        {{ (modelValue || abierto) ? valorFormateado : '' }}
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
          borderRadius: 'var(--r-md)',
          boxShadow:    'var(--shadow-modal)',
          overflow:     'hidden',
        }">
          <!-- Cabecera -->
          <div :style="{
            display:             'grid',
            gridTemplateColumns: '0.8fr 1.2fr 1fr',
            textAlign:           'center',
            padding:             'var(--sp-md) 0',
            borderBottom:        '1px solid var(--color-border-light)',
            fontSize:            '11px',
            fontWeight:          'var(--fw-extrabold)',
            color:               'var(--color-text-3)',
            textTransform:       'uppercase',
            letterSpacing:       '0.1em',
            background:          'var(--color-bg-surface-alt)',
          }">
            <span>Día</span>
            <span>Mes</span>
            <span>Año</span>
          </div>

          <!-- Tambores -->
          <div :style="{
            display:             'grid',
            gridTemplateColumns: '0.8fr 1.2fr 1fr',
            height:              '210px',
            position:            'relative',
            background:          'var(--color-bg-card)',
          }">
            <!-- Franja de selección central (Detrás de los números) -->
            <div :style="{
              position:     'absolute',
              top:          '50%',
              left:         'var(--sp-sm)',
              right:        'var(--sp-sm)',
              height:       `${ITEM_H}px`,
              transform:    'translateY(-50%)',
              background:   'var(--color-bg-surface-alt)',
              borderRadius: 'var(--r-md)',
              pointerEvents:'none',
              zIndex:       '0',
            }" />

            <!-- Columna Días -->
            <div
              ref="refDias"
              class="drum-column"
              :style="{
                overflowY:      'scroll',
                height:         '100%',
                padding:        '80px 0',
                scrollbarWidth: 'none',
                msOverflowStyle:'none',
                position:       'relative',
                zIndex:         '1',
                scrollSnapType: 'y mandatory',
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
                  fontWeight:     tempDia === d ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          tempDia === d ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                  scrollSnapAlign:'center',
                }"
              >{{ String(d).padStart(2, '0') }}</div>
            </div>

            <!-- Columna Meses -->
            <div
              ref="refMeses"
              class="drum-column"
              :style="{
                overflowY:      'scroll',
                height:         '100%',
                padding:        '80px 0',
                scrollbarWidth: 'none',
                msOverflowStyle:'none',
                position:       'relative',
                zIndex:         '1',
                scrollSnapType: 'y mandatory',
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
                  fontWeight:     tempMes === (idx + 1) ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          tempMes === (idx + 1) ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                  scrollSnapAlign:'center',
                }"
              >{{ m }}</div>
            </div>

            <!-- Columna Años -->
            <div
              ref="refAnios"
              class="drum-column"
              :style="{
                overflowY:      'scroll',
                height:         '100%',
                padding:        '80px 0',
                scrollbarWidth: 'none',
                msOverflowStyle:'none',
                position:       'relative',
                zIndex:         '1',
                scrollSnapType: 'y mandatory',
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
                  fontWeight:     tempAnio === a ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  color:          tempAnio === a ? 'var(--color-primary)' : 'var(--color-text-2)',
                  transition:     'color 0.2s',
                  scrollSnapAlign:'center',
                }"
              >{{ a }}</div>
            </div>

            <!-- Degradados de desvanecimiento superior e inferior -->
            <div :style="{
              position: 'absolute',
              inset: '0',
              pointerEvents: 'none',
              zIndex: '2',
              background: 'linear-gradient(to bottom, var(--color-bg-card) 0%, transparent 25%, transparent 75%, var(--color-bg-card) 100%)',
            }" />
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
              @click="emitirValor()"
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
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--r-md);
  background: transparent;
  cursor: pointer;
  transition: border-bottom-color var(--transition-fast), box-shadow var(--transition-fast);
  display: flex;
  align-items: center;
  padding: 16px 12px 0 12px; /* Espacio superior para label y lateral suave */
  box-sizing: border-box;
}

.fecha-field--open {
  border-bottom-color: var(--color-primary);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

.fecha-field--error {
  border-bottom-color: var(--color-error) !important;
  box-shadow: 0 1px 0 0 var(--color-error) !important;
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

/* ── Label flotante ── */
.fecha-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  background: transparent;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 32px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    font-weight var(--transition-fast),
    color var(--transition-fast);
}

.fecha-field--floated .fecha-label {
  top: 4px;
  transform: translateY(0);
  font-size: 11px;
  font-weight: var(--fw-medium);
  background: transparent;
  padding: 0;
}

.fecha-label--focused { color: var(--color-primary); }
.fecha-label--error   { color: var(--color-error-text); }
.fecha-required       { color: var(--color-error); }

.fecha-msg { 
  font-size: var(--text-xs); 
  font-weight: var(--fw-medium); 
  padding-top: 2px;
}
.fecha-msg--error { color: var(--color-error-text); }

/* Ocultar scrollbars en los tambores */
.drum-column::-webkit-scrollbar {
  display: none;
}
.drum-column {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

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
