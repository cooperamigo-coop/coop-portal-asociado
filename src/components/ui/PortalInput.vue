<script setup>
defineProps({
  label:       { type: String, default: null },
  modelValue:  { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'blur'])
</script>
<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
    <label v-if="label" :style="{
      fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)',
      color: 'var(--color-text-1)',
    }">
      {{ label }} <span v-if="required" :style="{ color: 'var(--color-error)' }">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :style="{
        padding: '10px 16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--r-pill)',
        fontSize: 'var(--text-base)',
        background: disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
        color: 'var(--color-text-1)',
        fontFamily: 'var(--font-body)',
        outline: 'none',
        transition: 'border-color var(--transition-fast)',
        width: '100%',
      }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
  </div>
</template>
