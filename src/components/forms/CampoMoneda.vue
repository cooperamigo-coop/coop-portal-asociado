<script setup>
import { computed } from 'vue'
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
    <!-- Label interno (se oculta con sinLabel para usar label externo con slot) -->
    <label v-if="!sinLabel && label" :style="{
      display:    'inline-flex',
      alignItems: 'center',
      gap:        'var(--sp-xs)',
      fontSize:   'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color:      error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }"> *</span>
      <TooltipInfo v-if="tooltip" :texto="tooltip" />
    </label>

    <div :style="{ position: 'relative' }">
      <span :style="{
        position:      'absolute',
        left:          '12px',
        top:           '50%',
        transform:     'translateY(-50%)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--fw-semibold)',
        color:         'var(--color-text-3)',
        pointerEvents: 'none',
      }">$</span>
      <input
        type="text"
        inputmode="numeric"
        :value="valorFormateado"
        placeholder="0"
        :disabled="disabled"
        :style="{
          padding:      '9px 14px 9px 28px',
          border:       `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: 'var(--r-lg)',
          fontSize:     'var(--text-base)',
          fontFamily:   'var(--font-body)',
          background:   disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
          color:        disabled ? 'var(--color-text-3)' : 'var(--color-text-1)',
          outline:      'none',
          width:        '100%',
          cursor:       disabled ? 'not-allowed' : 'text',
        }"
        @input="onInput"
        @blur="$emit('blur')"
      />
    </div>

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
