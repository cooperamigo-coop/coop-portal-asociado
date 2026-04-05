<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Search, X, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  label:       { type: String, required: true },
  opciones:    { type: Array,  required: true }, // [{ value, label }]
  placeholder: { type: String, default: 'Seleccione...' },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  clearable:   { type: Boolean, default: false },
  error:       { type: String,  default: null },
  helper:      { type: String,  default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const abierto      = ref(false)
const busqueda     = ref('')
const inputRef     = ref(null)
const containerRef = ref(null)

const labelSeleccionado = computed(() => {
  if (!props.modelValue) return ''
  return props.opciones.find(o => o.value === props.modelValue)?.label ?? ''
})

const opcionesFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  const todas = q
    ? props.opciones.filter(o => o.label.toLowerCase().includes(q))
    : props.opciones
  return todas.slice(0, 10)
})

function abrir() {
  if (props.disabled) return
  abierto.value = true
  busqueda.value = ''
  setTimeout(() => inputRef.value?.focus(), 50)
}

function cerrar() {
  abierto.value = false
  busqueda.value = ''
  emit('blur')
}

function seleccionar(opcion) {
  emit('update:modelValue', opcion.value)
  cerrar()
}

function limpiar(e) {
  e.stopPropagation()
  emit('update:modelValue', '')
}

function onKeydown(e) {
  if (e.key === 'Escape') cerrar()
  if (e.key === 'Enter' && opcionesFiltradas.value.length > 0) {
    seleccionar(opcionesFiltradas.value[0])
  }
}

function onClickFuera(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    if (abierto.value) cerrar()
  }
}

onMounted(() => document.addEventListener('mousedown', onClickFuera))
onUnmounted(() => document.removeEventListener('mousedown', onClickFuera))
</script>

<template>
  <div
    ref="containerRef"
    :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)', position: 'relative' }"
  >
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
          : abierto
            ? 'var(--color-primary)'
            : 'var(--color-border)'}`,
        borderRadius:   'var(--r-lg)',
        background:     disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        transition:     'border-color var(--transition-fast)',
        userSelect:     'none',
        gap:            'var(--sp-sm)',
        outline:        abierto ? '3px solid var(--color-primary-light)' : 'none',
      }"
      @click="abierto ? cerrar() : abrir()"
    >
      <span :style="{
        fontSize:     'var(--text-base)',
        color:        modelValue ? 'var(--color-text-1)' : 'var(--color-text-3)',
        fontFamily:   'var(--font-body)',
        flex:         '1',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:   'nowrap',
      }">
        {{ labelSeleccionado || placeholder }}
      </span>

      <button
        v-if="clearable && modelValue && !disabled"
        :style="{
          background: 'none', border: 'none', padding: '0',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          color: 'var(--color-text-3)', flexShrink: '0',
        }"
        @click.stop="limpiar($event)"
      >
        <X :size="14" />
      </button>

      <ChevronDown
        :size="16"
        :style="{
          color:      'var(--color-text-3)',
          transition: 'transform var(--transition-fast)',
          transform:  abierto ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: '0',
        }"
      />
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown-fade">
      <div
        v-if="abierto"
        :style="{
          position:     'absolute',
          top:          'calc(100% + 4px)',
          left:         '0',
          minWidth:     '180px',
          zIndex:       '50',
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--r-xl)',
          boxShadow:    'var(--shadow-modal)',
          overflow:     'hidden',
        }"
      >
        <!-- Buscador -->
        <div :style="{
          padding:      'var(--sp-sm)',
          borderBottom: '1px solid var(--color-border-light)',
          background:   'var(--color-bg-surface)',
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--sp-sm)',
        }">
          <Search :size="14" :style="{ color: 'var(--color-text-3)', flexShrink: '0' }" />
          <input
            ref="inputRef"
            v-model="busqueda"
            type="text"
            placeholder="Buscar..."
            :style="{
              flex:       '1',
              border:     'none',
              outline:    'none',
              background: 'transparent',
              fontSize:   'var(--text-base)',
              fontFamily: 'var(--font-body)',
              color:      'var(--color-text-1)',
            }"
            @keydown="onKeydown"
          />
        </div>

        <!-- Lista de opciones -->
        <div :style="{ maxHeight: '240px', overflowY: 'auto' }">
          <div
            v-if="opcionesFiltradas.length === 0"
            :style="{
              padding:    'var(--sp-xl)',
              textAlign:  'center',
              fontSize:   'var(--text-base)',
              color:      'var(--color-text-3)',
              fontWeight: 'var(--fw-medium)',
            }"
          >Sin resultados</div>

          <div
            v-for="opcion in opcionesFiltradas"
            :key="opcion.value"
            :style="{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        'var(--sp-md) var(--sp-lg)',
              cursor:         'pointer',
              fontSize:       'var(--text-base)',
              fontWeight:     modelValue === opcion.value ? 'var(--fw-bold)' : 'var(--fw-medium)',
              color:          modelValue === opcion.value ? 'var(--color-primary)' : 'var(--color-text-1)',
              background:     modelValue === opcion.value ? 'var(--color-primary-light)' : 'transparent',
              transition:     'background var(--transition-fast)',
              borderBottom:   '1px solid var(--color-border-light)',
            }"
            @mouseenter="e => { if (modelValue !== opcion.value) e.currentTarget.style.background = 'var(--color-bg-surface)' }"
            @mouseleave="e => { if (modelValue !== opcion.value) e.currentTarget.style.background = 'transparent' }"
            @click="seleccionar(opcion)"
          >
            <span>{{ opcion.label }}</span>
            <Check
              v-if="modelValue === opcion.value"
              :size="14"
              :style="{ color: 'var(--color-primary)', flexShrink: '0' }"
            />
          </div>
        </div>

        <!-- Contador si hay más de 10 resultados -->
        <div
          v-if="busqueda && opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase())).length > 10"
          :style="{
            padding:    'var(--sp-sm) var(--sp-lg)',
            fontSize:   'var(--text-xs)',
            color:      'var(--color-text-3)',
            fontWeight: 'var(--fw-medium)',
            borderTop:  '1px solid var(--color-border-light)',
            textAlign:  'center',
          }"
        >
          Mostrando 10 de
          {{ opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase())).length }}
          resultados. Refine su búsqueda.
        </div>
      </div>
    </Transition>

    <!-- Error / Helper -->
    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
    <span v-else-if="helper" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-text-3)',
      fontWeight: 'var(--fw-medium)',
    }">{{ helper }}</span>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity:   0;
  transform: translateY(-4px);
}
</style>
