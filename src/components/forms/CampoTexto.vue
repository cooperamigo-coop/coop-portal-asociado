<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue:   { type: [String, Number], default: '' },
  label:        { type: String, required: true },
  placeholder:  { type: String, default: '' },
  type:         { type: String, default: 'text' },
  required:     { type: Boolean, default: false },
  disabled:     { type: Boolean, default: false },
  error:        { type: String, default: null },
  maxlength:    { type: Number, default: null },
  helper:       { type: String, default: null },
  soloNumeros:  { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const focused = ref(false)
const hasValue = computed(() =>
  props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
)
const floated = computed(() => focused.value || hasValue.value)

function onInput(e) {
  let val = e.target.value
  if (props.soloNumeros) {
    val = val.replace(/\D/g, '')
    e.target.value = val
  }
  emit('update:modelValue', val)
}
function onFocus() { focused.value = true }
function onBlur()  { focused.value = false; emit('blur') }
</script>

<template>
  <div class="campo-wrapper">
    <div class="campo-field" :class="{ 'campo-field--floated': floated, 'campo-field--disabled': disabled }">
      <input
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :maxlength="maxlength"
        :inputmode="soloNumeros ? 'numeric' : undefined"
        class="campo-input"
        :class="{
          'campo-input--error':    error,
          'campo-input--disabled': disabled,
          'campo-input--focused':  focused && !error,
        }"
        @input="onInput"
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
    <span v-if="error"       class="campo-msg campo-msg--error">{{ error }}</span>
    <span v-else-if="helper" class="campo-msg campo-msg--helper">{{ helper }}</span>
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

/* ── Input ── */
.campo-input {
  display: block;
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  font-size: var(--text-base);
  font-family: var(--font-body);
  background: var(--color-bg-card);
  color: var(--color-text-1);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
  text-align: left;
}

.campo-input--focused  { border-color: var(--color-primary); }
.campo-input--error    { border-color: var(--color-error) !important; }
.campo-input--disabled {
  background: var(--color-bg-card);
  color: var(--color-text-3);
  cursor: not-allowed;
}

/* ── Label — arranca dentro del input como placeholder ── */
.campo-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-medium);
  color: var(--color-text-3);
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
    color var(--transition-fast);
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

/* ── Mensajes ── */
.campo-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.campo-msg--error  { color: var(--color-error-text); }
.campo-msg--helper { color: var(--color-text-3); }
</style>
