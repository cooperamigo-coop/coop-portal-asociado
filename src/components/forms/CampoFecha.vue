<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, required: true },
  required:   { type: Boolean, default: false },
  error:      { type: String, default: null },
  min:        { type: String, default: null },
  max:        { type: String, default: null },
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
    <input
      type="date"
      :value="modelValue"
      :min="min"
      :max="max"
      :style="{
        padding: '9px 14px',
        border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
        borderRadius: 'var(--r-lg)',
        fontSize: 'var(--text-base)',
        fontFamily: 'var(--font-body)',
        background: 'var(--color-bg-surface)',
        color: 'var(--color-text-1)',
        outline: 'none',
        width: '100%',
      }"
      @change="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
    <span v-if="error" :style="{
      fontSize: 'var(--text-xs)',
      color: 'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>
