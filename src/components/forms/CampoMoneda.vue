<script setup>
import { ref, computed } from 'vue'
import TooltipInfo from '@/components/ui/TooltipInfo.vue'
import { IconLock } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label:      { type: String, default: null },
  required:   { type: Boolean, default: false },
  disabled:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  helper:     { type: String, default: null },
  sinLabel:   { type: Boolean, default: false },
  tooltip:    { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const focused = ref(false)
const hasValue = computed(() =>
  props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
)
const floated = computed(() => focused.value || hasValue.value)

const valorFormateado = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) return ''
  const num = Number(String(props.modelValue).replace(/\D/g, ''))
  return isNaN(num) ? '' : num.toLocaleString('es-CO')
})

function onKeydown(e) {
  const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End']
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
  }
}
function onInput(e) {
  const limpio = e.target.value.replace(/\D/g, '')
  emit('update:modelValue', limpio ? Number(limpio) : '')
}
function onFocus() { focused.value = true }
function onBlur()  { focused.value = false; emit('blur') }
</script>

<template>
  <div class="campo-wrapper">
    <div class="campo-field" :class="{ 'campo-field--floated': floated, 'campo-field--disabled': disabled }">
      <span class="campo-prefix">$</span>
      <input
        type="text"
        inputmode="numeric"
        :value="valorFormateado"
        :disabled="disabled"
        class="campo-input"
        :class="{
          'campo-input--error':    error,
          'campo-input--disabled': disabled,
          'campo-input--focused':  focused && !error,
        }"
        @keydown="onKeydown"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <label
        v-if="!sinLabel && label"
        class="campo-label"
        :class="{
          'campo-label--focused': focused && !error,
          'campo-label--error':   !!error,
        }"
      >
        <span>{{ label.replace(/\s*\*\s*$/, '') }}<span v-if="required" class="campo-required">*</span></span>
        <TooltipInfo v-if="tooltip" :texto="tooltip" />
      </label>

      <div v-if="disabled" class="campo-lock">
        <IconLock :size="16" />
      </div>
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
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-input);
  box-sizing: border-box;
  background: transparent;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

@media (max-width: 768px) {
  .campo-field {
    height: 44px;
    padding: 0 16px;
  }
}

.campo-field:focus-within:not(.campo-field--disabled) {
  border-color: var(--color-primary);
}

.campo-field--disabled {
  background: transparent;
  border-color: var(--color-border) !important;
  cursor: default;
}

.campo-field--disabled .campo-label,
.campo-field--disabled.campo-field--floated .campo-label {
  color: var(--color-text-3) !important;
  background: var(--bg-label, #ffffff);
  border-radius: 3px;
}

.campo-lock {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-3);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.campo-field--disabled:hover .campo-lock {
  opacity: 1;
}

/* ── Prefijo $ ── */
.campo-prefix {
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  color: var(--color-text-3);
  margin-right: 4px;
  user-select: none;
  flex-shrink: 0;
}

/* ── Input real ── */
.campo-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-base);
  font-family: var(--font-body);
  color: var(--color-text-1);
  padding: 0;
  margin: 0;
  min-width: 0;
}

.campo-input--disabled {
  color: var(--color-text-3) !important;
  cursor: default;
}

/* ── Label Outlined (igual a CampoTexto) ── */
.campo-label {
  position: absolute;
  left: 34px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  pointer-events: none;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 48px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    left var(--transition-fast),
    color var(--transition-fast);
}

.campo-field--floated .campo-label {
  top: 0;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-2);
  background: var(--bg-label, #ffffff);
  border-radius: 3px;
  padding: 0 4px;
  left: 12px;
}

.campo-label--focused { color: var(--color-primary) !important; }
.campo-label--error   { color: var(--color-error-text) !important; }
.campo-required       { color: var(--color-error); }

.campo-field:has(.campo-input--error) {
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 1px var(--color-error) !important;
}

.campo-msg {
  font-size: var(--text-xs);
  font-weight: var(--fw-medium);
  padding-left: 12px;
  padding-top: 2px;
}
.campo-msg--error  { color: var(--color-error-text); }
.campo-msg--helper { color: var(--color-text-3); }
</style>
