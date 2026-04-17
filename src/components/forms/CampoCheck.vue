<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div
    :style="{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-sm)',
      padding: 'var(--sp-md)',
      borderRadius: 'var(--r-md)',
      border: `1px solid ${error
        ? 'var(--color-error)'
        : modelValue
          ? 'var(--color-primary)'
          : 'var(--color-border)'}`,
      background: modelValue
        ? 'var(--color-primary-light)'
        : 'var(--color-bg-surface)',
      transition: 'all var(--transition-fast)',
      cursor: 'pointer',
    }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div :style="{
      width: '18px', height: '18px',
      borderRadius: 'var(--r-sm)',
      border: `2px solid ${modelValue ? 'var(--color-primary)' : 'var(--color-border)'}`,
      background: modelValue ? 'var(--color-primary)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: '0', marginTop: '1px',
      transition: 'all var(--transition-fast)',
    }">
      <svg v-if="modelValue" width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span :style="{
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--color-text-1)',
      lineHeight: '1.5',
      flex: '1',
    }">
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }"> *</span>
    </span>
  </div>
</template>
