<script setup>
defineProps({
  tipo:     { type: String, default: 'info',
    validator: v => ['info', 'success', 'error', 'warning'].includes(v) },
  mensaje:  { type: String, required: true },
})
const colores = {
  info:    { bg: 'var(--color-info-bg)',    text: 'var(--color-info-text)',    border: 'var(--color-border)'  },
  success: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', border: 'var(--color-success)' },
  error:   { bg: 'var(--color-error-bg)',   text: 'var(--color-error-text)',   border: 'var(--color-error)'   },
  warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', border: 'var(--color-border)'  },
}
</script>
<template>
  <div :style="{
    background: colores[tipo].bg,
    border: '1px solid ' + colores[tipo].border,
    color: colores[tipo].text,
    padding: 'var(--sp-md) var(--sp-lg)',
    borderRadius: 'var(--r-lg)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-semibold)',
    lineHeight: '1.5',
  }">
    {{ mensaje }}
  </div>
</template>
