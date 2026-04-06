<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }, // formato YYYY-MM-DD
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  minYear:    { type: Number, default: 1930 },
  maxYear:    { type: Number, default: new Date().getFullYear() },
})
const emit = defineEmits(['update:modelValue'])

const diaActual  = ref(1)
const mesActual  = ref(1)
const anioActual = ref(new Date().getFullYear() - 30)

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

const valorFormateado = computed(() => {
  const d = String(diaActual.value).padStart(2, '0')
  const m = String(mesActual.value).padStart(2, '0')
  const y = String(anioActual.value)
  return `${d}/${m}/${y}`
})

const abierto = ref(false)
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
    <!-- Label -->
    <label :style="{
      fontSize:   'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color:      error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }"> *</span>
    </label>

    <!-- Trigger -->
    <div
      :style="{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '9px 14px',
        border:         `1px solid ${error
          ? 'var(--color-error)'
          : abierto ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius:   'var(--r-lg)',
        background:     'var(--color-bg-surface)',
        cursor:         'pointer',
        userSelect:     'none',
        outline:        abierto ? '3px solid var(--color-primary-light)' : 'none',
        transition:     'border-color var(--transition-fast)',
      }"
      @click="abierto = !abierto"
    >
      <span :style="{
        fontSize:   'var(--text-base)',
        fontFamily: 'var(--font-body)',
        color:      modelValue ? 'var(--color-text-1)' : 'var(--color-text-3)',
      }">
        {{ modelValue ? valorFormateado : 'DD / MM / YYYY' }}
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        :style="{ transition: 'transform var(--transition-fast)', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: '0' }">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- Picker -->
    <Transition name="dropdown-fade">
      <div v-if="abierto" :style="{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--r-xl)',
        boxShadow:    'var(--shadow-modal)',
        overflow:     'hidden',
        marginTop:    '4px',
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
              scrollSnapType:'y mandatory',
              height:        '200px',
              paddingTop:    `${200/2 - ITEM_H/2}px`,
              paddingBottom: `${200/2 - ITEM_H/2}px`,
              scrollbarWidth:'none',
              position:      'relative',
              zIndex:        '2',
            }"
            @scroll="onScrollDias"
          >
            <div
              v-for="dia in diasDelMes"
              :key="dia"
              :style="{
                height:         `${ITEM_H}px`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                scrollSnapAlign:'center',
                fontSize:       diaActual === dia ? 'var(--text-lg)' : 'var(--text-base)',
                fontWeight:     diaActual === dia ? 'var(--fw-extrabold)' : 'var(--fw-medium)',
                color:          diaActual === dia ? 'var(--color-primary)' : 'var(--color-text-2)',
                transition:     'all 0.15s ease',
              }"
            >{{ String(dia).padStart(2, '0') }}</div>
          </div>

          <!-- Columna Meses -->
          <div
            ref="refMeses"
            :style="{
              overflowY:     'scroll',
              scrollSnapType:'y mandatory',
              height:        '200px',
              paddingTop:    `${200/2 - ITEM_H/2}px`,
              paddingBottom: `${200/2 - ITEM_H/2}px`,
              scrollbarWidth:'none',
              position:      'relative',
              zIndex:        '2',
              borderLeft:    '1px solid var(--color-border-light)',
            }"
            @scroll="onScrollMeses"
          >
            <div
              v-for="(mes, idx) in meses"
              :key="mes"
              :style="{
                height:         `${ITEM_H}px`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                scrollSnapAlign:'center',
                fontSize:       mesActual === idx+1 ? 'var(--text-lg)' : 'var(--text-base)',
                fontWeight:     mesActual === idx+1 ? 'var(--fw-extrabold)' : 'var(--fw-medium)',
                color:          mesActual === idx+1 ? 'var(--color-primary)' : 'var(--color-text-2)',
                transition:     'all 0.15s ease',
              }"
            >{{ mes }}</div>
          </div>

          <!-- Columna Años -->
          <div
            ref="refAnios"
            :style="{
              overflowY:     'scroll',
              scrollSnapType:'y mandatory',
              height:        '200px',
              paddingTop:    `${200/2 - ITEM_H/2}px`,
              paddingBottom: `${200/2 - ITEM_H/2}px`,
              scrollbarWidth:'none',
              position:      'relative',
              zIndex:        '2',
              borderLeft:    '1px solid var(--color-border-light)',
            }"
            @scroll="onScrollAnios"
          >
            <div
              v-for="anio in anios"
              :key="anio"
              :style="{
                height:         `${ITEM_H}px`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                scrollSnapAlign:'center',
                fontSize:       anioActual === anio ? 'var(--text-lg)' : 'var(--text-base)',
                fontWeight:     anioActual === anio ? 'var(--fw-extrabold)' : 'var(--fw-medium)',
                color:          anioActual === anio ? 'var(--color-primary)' : 'var(--color-text-2)',
                transition:     'all 0.15s ease',
              }"
            >{{ anio }}</div>
          </div>
        </div>

        <!-- Footer con botón Confirmar -->
        <div :style="{
          padding:        'var(--sp-md) var(--sp-lg)',
          borderTop:      '1px solid var(--color-border-light)',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
        }">
          <span :style="{
            fontSize:   'var(--text-base)',
            fontWeight: 'var(--fw-bold)',
            color:      'var(--color-primary)',
            fontFamily: 'var(--font-display)',
          }">{{ valorFormateado }}</span>
          <button
            :style="{
              padding:      'var(--sp-sm) var(--sp-xl)',
              borderRadius: 'var(--r-pill)',
              border:       'none',
              background:   'var(--color-primary)',
              color:        'var(--color-text-on-primary)',
              fontFamily:   'var(--font-body)',
              fontWeight:   'var(--fw-bold)',
              fontSize:     'var(--text-base)',
              cursor:       'pointer',
            }"
            @click="emitirValor(); abierto = false"
          >Confirmar</button>
        </div>
      </div>
    </Transition>

    <!-- Error -->
    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>

<style scoped>
div::-webkit-scrollbar { display: none; }

.dropdown-fade-enter-active,
.dropdown-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-fade-enter-from,
.dropdown-fade-leave-to    { opacity: 0; transform: translateY(-4px); }
</style>
