<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'accent'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
  type:     { type: String,  default: 'button' },
  full:     { type: Boolean, default: false },
  small:    { type: Boolean, default: false },
})

const estilos = {
  primary: {
    background: 'var(--color-primary)',
    color:      'var(--color-text-on-primary)',
    border:     'none',
    boxShadow:  'var(--shadow-btn)',
  },
  secondary: {
    background: 'transparent',
    color:      'var(--color-text-2)',
    border:     'none',
    boxShadow:  '0 0 0 1px rgba(23,43,54,0.2)',
  },
  accent: {
    background: 'var(--color-accent)',
    color:      'var(--color-text-1)',
    border:     'none',
    boxShadow:  'var(--shadow-accent)',
  },
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :style="{
      ...estilos[variant],
      width:          full ? '100%' : 'auto',
      height:         small ? '32px' : '36px',
      padding:        small ? '0 var(--sp-md)' : '0 var(--sp-xl)',
      borderRadius:   'var(--r-pill)',
      fontSize:       'var(--text-base)',
      fontWeight:     'var(--fw-semibold)',
      fontFamily:     'var(--font-body)',
      cursor:         disabled || loading ? 'not-allowed' : 'pointer',
      opacity:        disabled ? '0.55' : '1',
      transition:     'all var(--transition-base)',
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            'var(--sp-sm)',
      position:       'relative',
      minWidth:       loading ? '110px' : 'auto',
    }"
  >
    <!-- Spinner centrado — visible solo durante loading -->
    <span v-if="loading" class="portal-spinner-wrapper">
      <span
        class="portal-spinner"
        :class="`portal-spinner--${variant}`"
      />
    </span>

    <!-- Contenido — se oculta suavemente durante loading -->
    <span
      :style="{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        'var(--sp-sm)',
        opacity:    loading ? '0' : '1',
        transition: 'opacity 0.15s ease',
      }"
    >
      <slot />
    </span>
  </button>
</template>

<style scoped>
/* ─── Wrapper que centra el spinner dentro del botón ─ */
.portal-spinner-wrapper {
  position:        absolute;
  inset:           0;
  display:         flex;
  align-items:     center;
  justify-content: center;
}

/* ─── Spinner base ───────────────────────────────────── */
.portal-spinner {
  width:         18px;
  height:        18px;
  border-radius: 50%;
  border:        2.5px solid transparent;
  animation:     portalGirar 0.65s linear infinite;
  flex-shrink:   0;
}

/* ─── Color según variante ──────────────────────────── */
.portal-spinner--primary {
  border-top-color:   rgba(255, 255, 255, 0.9);
  border-right-color: rgba(255, 255, 255, 0.25);
}
.portal-spinner--secondary {
  border-top-color:   var(--color-primary);
  border-right-color: rgba(23, 43, 54, 0.15);
}
.portal-spinner--accent {
  border-top-color:   rgba(23, 43, 54, 0.8);
  border-right-color: rgba(23, 43, 54, 0.15);
}

/* ─── Animación de giro ─────────────────────────────── */
@keyframes portalGirar {
  to { transform: rotate(360deg); }
}

/* ─── Hover y active — solo cuando no está cargando ─── */
button:not(:disabled):hover {
  filter:    brightness(1.07);
  transform: translateY(-1px);
}
button:not(:disabled):active {
  transform: translateY(0px);
  filter:    brightness(0.96);
}
</style>
