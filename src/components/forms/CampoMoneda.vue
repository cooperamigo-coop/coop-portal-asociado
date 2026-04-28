<script setup>
import { ref, computed } from 'vue'
import TooltipInfo from '@/components/ui/TooltipInfo.vue'

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
    <div class="campo-field" :class="{ 'campo-field--floated': floated }">
      
      <div 
        class="campo-input-container"
        :class="{
          'campo-input-container--focused': focused && !error,
          'campo-input-container--error':   error,
          'campo-input-container--disabled': disabled,
        }"
      >
        <span class="campo-prefix">$</span>
        <input
          type="text"
          inputmode="numeric"
          :value="valorFormateado"
          :disabled="disabled"
          class="campo-input"
          @keydown="onKeydown"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>

      <label
        v-if="!sinLabel && label"
        class="campo-label"
        :class="{
          'campo-label--focused': focused && !error,
          'campo-label--error':   !!error,
        }"
      >
        {{ label }}
        <span v-if="required" class="campo-required"> *</span>
        <TooltipInfo v-if="tooltip" :texto="tooltip" />
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

/* ── Contenedor del Input (Maneja la línea y el flex) ── */
.campo-input-container {
  display: flex;
  align-items: baseline; /* Alineación por la base de la fuente */
  width: 100%;
  height: 54px;
  padding: 22px 12px 6px 12px;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--r-md);
  box-sizing: border-box;
  background: transparent;
  transition: border-bottom-color var(--transition-fast), box-shadow var(--transition-fast);
}

.campo-input-container--focused {
  border-bottom-color: var(--color-primary);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

.campo-input-container--error {
  border-bottom-color: var(--color-error) !important;
  box-shadow: 0 1px 0 0 var(--color-error) !important;
}

.campo-input-container--disabled {
  border-bottom-style: dashed;
  cursor: not-allowed;
}

/* ── Prefijo $ ── */
.campo-prefix {
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  color: var(--color-text-3);
  margin-right: 4px;
  user-select: none;
}

/* ── Input Real ── */
.campo-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  font-family: var(--font-body);
  color: var(--color-text-1);
  padding: 0;
  margin: 0;
  line-height: 1; /* Para evitar saltos */
}

/* ── Label ── */
.campo-label {
  position: absolute;
  left: 28px; /* Ajustado para el $ */
  top: 35px;  /* Bajado para alinear con el centro óptico del área de texto */
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 32px);
  transition: all var(--transition-fast);
}

.campo-field--floated .campo-label {
  left: 12px;
  top: 4px;
  transform: translateY(0);
  font-size: 11px;
  font-weight: var(--fw-medium);
}

.campo-label--focused { color: var(--color-primary); }
.campo-label--error   { color: var(--color-error-text); }
.campo-required       { color: var(--color-error); }

.campo-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.campo-msg--error  { color: var(--color-error-text); }
.campo-msg--helper { color: var(--color-text-3); }
</style>
