<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  label:       { type: String, required: true },
  opciones:    { type: Array,  required: true },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  error:       { type: String, default: null },
  placeholder: { type: String, default: 'Seleccione...' },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const focused  = ref(false)
const hasValue = computed(() => !!props.modelValue)
const floated  = computed(() => focused.value || hasValue.value)

function onFocus() { focused.value = true }
function onBlur()  { focused.value = false; emit('blur') }
</script>

<template>
  <div class="campo-wrapper">
    <div class="campo-field" :class="{ 'campo-field--floated': floated }">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="campo-select"
        :class="{
          'campo-select--error':    error,
          'campo-select--disabled': disabled,
          'campo-select--focused':  focused && !error,
        }"
        @change="$emit('update:modelValue', $event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      >
        <!-- Opción vacía invisible para que el select no muestre texto cuando no hay valor -->
        <option value="" disabled hidden></option>
        <option
          v-for="op in opciones"
          :key="op.value"
          :value="op.value"
        >{{ op.label }}</option>
      </select>

      <label
        class="campo-label"
        :class="{
          'campo-label--focused': focused && !error,
          'campo-label--error':   !!error,
        }"
      >
        {{ label }}<span v-if="required" class="campo-required"> *</span>
      </label>
    </div>
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
}

/* ── Select ── */
.campo-select {
  display: block;
  width: 100%;
  padding: 12px 36px 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  font-size: var(--text-base);
  font-family: var(--font-body);
  background: var(--color-bg-card);
  color: var(--color-text-1);
  outline: none;
  box-sizing: border-box;
  cursor: pointer;
  appearance: none;
  /* Flecha nativa personalizada */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238AACB4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: border-color var(--transition-fast);
}

/* Oculta el texto cuando está vacío para que el label actúe de placeholder */
.campo-select:not(:focus)[value=""] { color: transparent; }

.campo-select--focused { border-color: var(--color-primary); }
.campo-select--error   { border-color: var(--color-error) !important; }
.campo-select--disabled {
  background-color: var(--color-bg-surface-alt);
  color: var(--color-text-3);
  cursor: not-allowed;
}

/* ── Label: en reposo actúa como placeholder dentro del select ── */
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
  max-width: calc(100% - 50px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    font-weight var(--transition-fast),
    color var(--transition-fast),
    background var(--transition-fast),
    padding var(--transition-fast);
}

/* ── Flotado: incrustado sobre el borde superior ── */
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
.campo-required       { color: var(--color-error); }

.campo-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.campo-msg--error { color: var(--color-error-text); }
</style>
