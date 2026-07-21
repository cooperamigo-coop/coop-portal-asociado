<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { IconLock } from '@tabler/icons-vue'

const props = defineProps({
  modelValue:        { type: [String, Number], default: '' },
  label:             { type: String, required: true },
  placeholder:       { type: String, default: '' },
  type:              { type: String, default: 'text' },
  required:          { type: Boolean, default: false },
  disabled:          { type: Boolean, default: false },
  error:             { type: String, default: null },
  maxlength:         { type: Number, default: null },
  helper:            { type: String, default: null },
  soloNumeros:       { type: Boolean, default: false },
  uppercase:         { type: Boolean, default: false },
  // solo letras, espacios y guion — para nombres y apellidos
  soloLetras:        { type: Boolean, default: false },
  // letras, números, espacios, guion, punto, coma — para campos laborales
  soloTextoLaboral:  { type: Boolean, default: false },
  labelWrap:         { type: Boolean, default: false },
  max:               { type: Number, default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const uid     = `campo-${getCurrentInstance().uid}`
const focused = ref(false)
const hasValue = computed(() =>
  props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
)
const floated = computed(() => focused.value || hasValue.value)

function onInput(e) {
  let val = e.target.value
  if (props.soloNumeros) {
    val = val.replace(/\D/g, '')
    if (props.max !== null && val !== '') {
      val = String(Math.min(Number(val), props.max))
    }
    e.target.value = val
  }
  if (props.type === 'number' && props.max !== null && val !== '') {
    const capped = String(Math.min(Number(val), props.max))
    if (capped !== val) { val = capped; e.target.value = capped }
  }
  if (props.soloLetras) {
    val = val.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-]/g, '')
    e.target.value = val
  }
  if (props.soloTextoLaboral) {
    val = val.replace(/[*\[\]{}|^~#@$%!?;=+<>\\/"'`]/g, '')
    e.target.value = val
  }
  if (props.uppercase) {
    val = val.toUpperCase()
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
        :id="uid"
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :maxlength="maxlength"
        :inputmode="soloNumeros ? 'numeric' : undefined"
        class="campo-input"
        :class="{
          'campo-input--error':     error,
          'campo-input--disabled':  disabled,
          'campo-input--focused':   focused && !error,
          'campo-input--uppercase': uppercase,
          'campo-input--has-icon':  $slots['icon-right']
        }"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        :placeholder="floated ? placeholder : ''"
      />
      <label
        :for="uid"
        class="campo-label"
        :class="{
          'campo-label--focused': focused && !error,
          'campo-label--error':   !!error,
          'campo-label--wrap':    labelWrap,
        }"
      >
        {{ label.replace(/\s*\*\s*$/, '') }}<span v-if="required || label.includes('*')" class="campo-required">*</span>
      </label>

      <div v-if="$slots['icon-right']" class="campo-icon-right">
        <slot name="icon-right"></slot>
      </div>

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
}

/* ── Input Outlined ── */
.campo-input {
  display: block;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-input);
  font-size: var(--text-base);
  font-family: var(--font-body);
  background: transparent;
  color: var(--color-text-1);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  text-align: left;
}

.campo-input--has-icon {
  padding-right: 48px;
}

@media (max-width: 768px) {
  .campo-input {
    height: 44px;
    padding: 0 16px;
  }
}

/* Estado de foco */
.campo-input--focused  {
  border-color: var(--color-primary);
}

/* Estado de error */
.campo-input--error    { 
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 1px var(--color-error) !important;
}

/* Estado deshabilitado */
.campo-input--disabled {
  background: transparent;
  color: var(--color-text-3) !important;
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
.campo-input--uppercase { text-transform: uppercase; }

/* ── Label Outlined ── */
.campo-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
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
    color var(--transition-fast);
}

/* Label en múltiples líneas (para labels largos) */
.campo-label--wrap {
  white-space: normal;
  line-height: 1.2;
  max-width: none;
}

@media (max-width: 768px) {
  .campo-label {
    left: 16px;
  }
}

/* ── Flotado: Mueve el label hacia arriba cortando el borde ── */
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

/* ── Icono derecho ── */
.campo-icon-right {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ── Mensajes (Error / Helper) ── */
.campo-msg { 
  font-size: var(--text-xs); 
  font-weight: var(--fw-medium); 
  padding-left: 12px;
  padding-top: 2px; 
}
.campo-msg--error  { color: var(--color-error-text); }
.campo-msg--helper { color: var(--color-text-3); }
</style>
