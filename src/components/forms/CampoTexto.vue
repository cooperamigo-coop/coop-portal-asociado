<script setup>
defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, required: true },
  placeholder: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  error:       { type: String, default: null },
  maxlength:   { type: Number, default: null },
  helper:      { type: String, default: null },
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
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :style="{
        padding: '9px 14px',
        border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
        borderRadius: 'var(--r-lg)',
        fontSize: 'var(--text-base)',
        fontFamily: 'var(--font-body)',
        background: disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
        color: 'var(--color-text-1)',
        outline: 'none',
        width: '100%',
        transition: 'border-color var(--transition-fast)',
      }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
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
