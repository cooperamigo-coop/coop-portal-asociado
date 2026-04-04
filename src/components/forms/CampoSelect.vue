<script setup>
defineProps({
  modelValue:  { type: String, default: '' },
  label:       { type: String, required: true },
  opciones:    { type: Array,  required: true }, // [{ value, label }]
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  error:       { type: String, default: null },
  placeholder: { type: String, default: 'Seleccione...' },
})
defineEmits(['update:modelValue', 'blur'])
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
    <select
      :value="modelValue"
      :disabled="disabled"
      :style="{
        padding: '9px 14px',
        border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
        borderRadius: 'var(--r-lg)',
        fontSize: 'var(--text-base)',
        fontFamily: 'var(--font-body)',
        background: disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
        color: modelValue ? 'var(--color-text-1)' : 'var(--color-text-3)',
        outline: 'none',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color var(--transition-fast)',
      }"
      @change="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="op in opciones"
        :key="op.value"
        :value="op.value"
        :style="{ color: 'var(--color-text-1)' }"
      >{{ op.label }}</option>
    </select>
    <span v-if="error" :style="{
      fontSize: 'var(--text-xs)',
      color: 'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>
