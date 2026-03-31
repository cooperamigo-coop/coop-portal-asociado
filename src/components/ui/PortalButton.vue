<script setup>
defineProps({
  variant: { type: String, default: 'primary',
    validator: v => ['primary', 'secondary', 'accent'].includes(v) },
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
  type:     { type: String, default: 'button' },
  full:     { type: Boolean, default: false },
})
const styles = {
  primary:   { background: 'var(--color-primary)',       color: 'var(--color-text-on-primary)', border: 'none',                          boxShadow: 'var(--shadow-btn)'    },
  secondary: { background: 'var(--color-primary-light)', color: 'var(--color-primary)',         border: '1px solid var(--color-border)', boxShadow: 'none'                 },
  accent:    { background: 'var(--color-accent)',        color: 'var(--color-text-1)',           border: 'none',                          boxShadow: 'var(--shadow-accent)' },
}
</script>
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :style="{
      ...styles[variant],
      width: full ? '100%' : 'auto',
      padding: 'var(--sp-sm) var(--sp-xl)',
      borderRadius: 'var(--r-pill)',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--fw-semibold)',
      fontFamily: 'var(--font-body)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? '0.6' : '1',
      transition: 'all var(--transition-base)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--sp-sm)',
    }"
  >
    <slot />
  </button>
</template>
