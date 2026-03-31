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
  primary:   { background: 'var(--color-primary)',  color: '#fff',                   border: 'none', boxShadow: 'var(--shadow-btn)'    },
  secondary: { background: 'transparent',            color: 'var(--color-text-2)',    border: '1px solid var(--color-border)', boxShadow: 'none' },
  accent:    { background: 'var(--color-accent)',    color: 'var(--color-text-1)',    border: 'none', boxShadow: 'var(--shadow-accent)' },
}
</script>
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :style="{
      ...styles[variant],
      width: full ? '100%' : 'auto',
      padding: '11px 24px',
      borderRadius: 'var(--r-pill)',
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--fw-bold)',
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
