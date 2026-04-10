<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  min:        { type: String, default: null },
  max:        { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const focused  = ref(false)
// En date inputs siempre hay texto nativo (dd/mm/aaaa), así que flotamos
// en cuanto el usuario hace focus para evitar superposición con ese texto.
const hasValue = computed(() => !!props.modelValue)
const floated  = computed(() => focused.value || hasValue.value)

function onFocus() { focused.value = true }
function onBlur()  { focused.value = false; emit('blur') }
</script>

<template>
  <div class="campo-wrapper">
    <div class="campo-field" :class="{ 'campo-field--floated': floated }">
      <input
        type="date"
        :value="modelValue"
        :min="min"
        :max="max"
        class="campo-input"
        :class="{
          'campo-input--error':   error,
          'campo-input--focused': focused && !error,
        }"
        @change="$emit('update:modelValue', $event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      />
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

/* ── Input fecha ── */
.campo-input {
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  font-size: var(--text-base);
  font-family: var(--font-body);
  background: var(--color-bg-card);
  color: var(--color-text-1);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.campo-input--focused { border-color: var(--color-primary); }
.campo-input--error   { border-color: var(--color-error) !important; }

/* ── Label: en reposo actúa como placeholder ── */
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
  max-width: calc(100% - 28px);
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
