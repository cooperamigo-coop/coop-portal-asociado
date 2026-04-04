<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  helper:     { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const valorFormateado = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) return ''
  const num = Number(String(props.modelValue).replace(/\D/g, ''))
  return isNaN(num) ? '' : num.toLocaleString('es-CO')
})

function onInput(e) {
  const limpio = e.target.value.replace(/\D/g, '')
  emit('update:modelValue', limpio ? Number(limpio) : '')
}
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
    <label :style="{
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }"> *</span>
    </label>
    <div :style="{ position: 'relative' }">
      <span :style="{
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--color-text-3)',
        pointerEvents: 'none',
      }">$</span>
      <input
        type="text"
        inputmode="numeric"
        :value="valorFormateado"
        placeholder="0"
        :style="{
          padding: '9px 14px 9px 28px',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: 'var(--r-lg)',
          fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-body)',
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-1)',
          outline: 'none',
          width: '100%',
        }"
        @input="onInput"
        @blur="$emit('blur')"
      />
    </div>
    <span v-if="error" :style="{
      fontSize: 'var(--text-xs)',
      color: 'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
    <span v-else-if="helper" :style="{
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-3)',
      fontWeight: 'var(--fw-medium)',
    }">{{ helper }}</span>
  </div>
</template>
