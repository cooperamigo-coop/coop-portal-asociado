<script setup>
import { IconCircleCheck } from '@tabler/icons-vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
defineProps({
  pasos:   { type: Array, required: true },
  actual:  { type: Number, required: true },
})
const { isMobile } = useBreakpoint()
</script>
<template>
  <div
    role="list"
    aria-label="Progreso del formulario"
    :style="{
      display: 'flex', alignItems: 'center',
      marginBottom: 'var(--sp-xl)',
    }"
  >
    <template v-for="(p, i) in pasos" :key="i">
      <div
        role="listitem"
        :aria-label="`Paso ${i + 1}: ${p.label}${p.label2 ? ' ' + p.label2 : ''}`"
        :aria-current="actual === i + 1 ? 'step' : undefined"
        :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }"
      >
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
          <IconCircleCheck v-if="actual > i + 1" :size="16" :style="{ color: 'var(--color-text-on-primary)' }" />
          <span v-else :style="{
            fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
            color: actual === i + 1 ? 'var(--color-text-on-primary)' : 'var(--color-text-3)',
          }">{{ i + 1 }}</span>
        </div>
        <span v-if="!isMobile" :style="{
          fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
          color: actual >= i + 1 ? 'var(--color-text-1)' : 'var(--color-text-3)',
          whiteSpace: p.noWrapLabel ? 'nowrap' : (p.label2 ? 'normal' : 'nowrap'),
          textAlign: 'left',
          lineHeight: '1.3',
        }">{{ p.label }}<template v-if="p.label2"><br>{{ p.label2 }}</template></span>
      </div>
      <div v-if="i < pasos.length - 1" :style="{
        flex: '1', height: '1px', margin: '0 var(--sp-md)',
        background: actual > i + 1 ? 'var(--color-success)' : 'var(--color-border)',
        transition: 'background var(--transition-base)',
        minWidth: isMobile ? '12px' : '20px',
      }" />
    </template>
  </div>
</template>
