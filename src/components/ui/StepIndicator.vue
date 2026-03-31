<script setup>
import { CheckCircle } from 'lucide-vue-next'
defineProps({
  pasos:   { type: Array, required: true },
  actual:  { type: Number, required: true },
})
</script>
<template>
  <div :style="{
    display: 'flex', alignItems: 'center',
    marginBottom: 'var(--sp-xl)',
  }">
    <template v-for="(p, i) in pasos" :key="i">
      <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
        <div :style="{
          width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: '0',
          background: actual > i + 1
            ? 'var(--color-success)' : actual === i + 1
            ? 'var(--color-primary)' : 'var(--color-bg-card)',
          border: actual > i + 1 || actual === i + 1
            ? 'none' : '1px solid var(--color-border)',
          transition: 'all var(--transition-base)',
        }">
          <CheckCircle v-if="actual > i + 1" :size="16" style="color: #fff" />
          <span v-else :style="{
            fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
            color: actual === i + 1 ? '#fff' : 'var(--color-text-3)',
          }">{{ i + 1 }}</span>
        </div>
        <span :style="{
          fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
          color: actual >= i + 1 ? 'var(--color-text-1)' : 'var(--color-text-3)',
          whiteSpace: 'nowrap',
        }">{{ p.label }}</span>
      </div>
      <div v-if="i < pasos.length - 1" :style="{
        flex: '1', height: '1px', margin: '0 var(--sp-md)',
        background: actual > i + 1 ? 'var(--color-success)' : 'var(--color-border)',
        transition: 'background var(--transition-base)',
        minWidth: '20px',
      }" />
    </template>
  </div>
</template>
