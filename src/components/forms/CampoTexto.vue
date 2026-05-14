<script setup>
import { ref, computed, getCurrentInstance } from 'vue'

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
    e.target.value = val
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
        }"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
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

/* ── Input Minimalista (Solo línea inferior con puntas curvas) ── */
.campo-input {
  display: block;
  width: 100%;
  height: 54px;
  padding: 22px 12px 6px 12px; /* Acomoda el texto y da un margen lateral suave */
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--r-md); /* Curvatura para que la línea suba en las puntas */
  font-size: var(--text-base);
  font-family: var(--font-body);
  background: transparent;
  color: var(--color-text-1);
  outline: none;
  box-sizing: border-box;
  transition: border-bottom-color var(--transition-fast), box-shadow var(--transition-fast);
  text-align: left;
}

@media (max-width: 768px) {
  .campo-input {
    height: 48px;
    padding: 18px 10px 4px 10px;
  }
}

/* Estado de foco: Transición suave, línea reforzada */
.campo-input--focused  { 
  border-bottom-color: var(--color-primary);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

/* Estado de error */
.campo-input--error    { 
  border-bottom-color: var(--color-error) !important;
  box-shadow: 0 1px 0 0 var(--color-error) !important;
}

/* Estado deshabilitado */
.campo-input--disabled {
  background: transparent;
  color: var(--color-text-3);
  border-bottom-style: dashed;
  cursor: not-allowed;
}
.campo-input--uppercase { text-transform: uppercase; }

/* ── Label Minimalista ── */
.campo-label {
  position: absolute;
  left: 12px; /* Alineado con el padding del texto */
  top: 35px; /* Alineado con el centro óptico del área de texto */
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 16px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    font-weight var(--transition-fast),
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
    left: 10px;
    top: 30px;
  }
}

/* ── Flotado: Mueve el label hacia arriba dentro del contenedor ── */
.campo-field--floated .campo-label {
  top: 4px; /* Sube pero se mantiene dentro del area del field */
  transform: translateY(0);
  font-size: 11px;
  font-weight: var(--fw-medium);
  background: transparent;
  padding: 0;
}

@media (max-width: 768px) {
  .campo-field--floated .campo-label {
    top: 2px;
    font-size: 10px;
  }
}

.campo-label--focused { color: var(--color-primary); }
.campo-label--error   { color: var(--color-error-text); }
.campo-required       { color: var(--color-error); }

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
