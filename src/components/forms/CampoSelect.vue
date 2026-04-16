<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconChevronDown, IconCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  label:       { type: String, required: true },
  opciones:    { type: Array,  required: true },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  error:       { type: String, default: null },
  placeholder: { type: String, default: 'Seleccione' },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const abierto      = ref(false)
const containerRef = ref(null)
const dropdownRef  = ref(null)

const dropdownStyle = ref({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '0',
  zIndex: '9999',
})

const hasValue = computed(() => !!props.modelValue)
const floated  = computed(() => abierto.value || hasValue.value)

const labelSeleccionado = computed(() => {
  if (!props.modelValue) return ''
  return props.opciones.find(o => o.value === props.modelValue)?.label ?? ''
})

function calcularPosicion() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = Math.min(props.opciones.length * 50, 250)

  let top = rect.bottom + 4
  if (top + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
    top = rect.top - dropdownHeight - 4
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
  if (props.disabled) return
  calcularPosicion()
  abierto.value = true
}

function cerrar() {
  abierto.value = false
  emit('blur')
}

function seleccionar(opcion) {
  emit('update:modelValue', opcion.value)
  cerrar()
}

function onClickFuera(e) {
  if (!abierto.value) return
  const clickEnContenedor = containerRef.value?.contains(e.target)
  const clickEnDropdown = dropdownRef.value?.contains(e.target)
  if (!clickEnContenedor && !clickEnDropdown) {
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
</script>

<template>
  <div ref="containerRef" class="campo-wrapper">
    <div 
      class="campo-field" 
      :class="{ 
        'campo-field--floated': floated,
        'campo-field--open': abierto,
        'campo-field--error': !!error,
        'campo-field--disabled': disabled 
      }"
      @click="abierto ? cerrar() : abrir()"
    >
      <div class="campo-select-trigger">
        <span class="campo-value" :class="{ 'campo-value--empty': !modelValue }">
          {{ labelSeleccionado }}
        </span>
        
        <IconChevronDown 
          :size="18" 
          class="campo-chevron" 
          :class="{ 'campo-chevron--open': abierto }" 
        />
      </div>

      <label
        class="campo-label"
        :class="{
          'campo-label--focused': abierto && !error,
          'campo-label--error':   !!error,
        }"
      >
        {{ label }}<span v-if="required" class="campo-required"> *</span>
      </label>
    </div>

    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div
          v-if="abierto"
          ref="dropdownRef"
          class="campo-dropdown"
          :style="dropdownStyle"
        >
          <div
            v-for="opcion in opciones"
            :key="opcion.value"
            class="campo-option"
            :class="{ 'campo-option--selected': modelValue === opcion.value }"
            @click="seleccionar(opcion)"
          >
            <span>{{ opcion.label }}</span>
            <IconCheck v-if="modelValue === opcion.value" :size="16" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <span v-if="error" class="campo-msg campo-msg--error">{{ error }}</span>
  </div>
</template>

<style scoped>
.campo-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.campo-field {
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
}

.campo-field--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.campo-field--error {
  border-color: var(--color-error) !important;
}

.campo-field--disabled {
  background-color: var(--color-bg-surface-alt);
  cursor: not-allowed;
}

.campo-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.campo-value {
  font-size: var(--text-base);
  color: var(--color-text-1);
  font-family: var(--font-body);
}

.campo-value--empty {
  color: transparent;
}

.campo-chevron {
  color: var(--color-text-3);
  transition: transform var(--transition-fast);
}

.campo-chevron--open {
  transform: rotate(180deg);
}

/* ── Label ── */
.campo-label {
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

.campo-field--floated .campo-label {
  top: 0;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: var(--fw-semibold);
  background: var(--color-bg-card);
  padding: 0 3px;
}

.campo-label--focused { color: var(--color-primary); }
.campo-label--error   { color: var(--color-error-text); }
.campo-required       { color: var(--color-primary); }

/* ── Dropdown ── */
.campo-dropdown {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-modal);
  overflow-y: auto;
  max-height: 250px;
  box-sizing: border-box;
}

.campo-option {
  padding: var(--sp-md) var(--sp-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-base);
  color: var(--color-text-1);
  transition: background var(--transition-fast);
}

.campo-option:hover {
  background: var(--color-bg-surface-alt);
}

.campo-option--selected {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--fw-bold);
}

.campo-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.campo-msg--error { color: var(--color-error-text); }

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
