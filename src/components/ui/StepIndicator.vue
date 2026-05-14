<script setup>
import { computed } from 'vue'
import { IconCircleCheck } from '@tabler/icons-vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const props = defineProps({
  pasos:   { type: Array, required: true },
  actual:  { type: Number, required: true },
})

const { isMobile } = useBreakpoint()

const pasoActualLabel = computed(() => {
  const p = props.pasos[props.actual - 1]
  return p ? (p.label + (p.label2 ? ' ' + p.label2 : '')) : ''
})
</script>

<template>
  <!-- Móvil: texto compacto "Paso X de Y · Nombre" -->
  <div v-if="isMobile" class="step-mobile" :aria-label="`Paso ${actual} de ${pasos.length}`">
    <div class="step-mobile-bar">
      <div
        class="step-mobile-progress"
        :style="{ width: `${(actual / pasos.length) * 100}%` }"
      />
    </div>
    <div class="step-mobile-label">
      <span class="step-mobile-count">Paso {{ actual }} de {{ pasos.length }}</span>
      <span class="step-mobile-name">{{ pasoActualLabel }}</span>
    </div>
  </div>

  <!-- Desktop: indicador completo -->
  <div
    v-else
    role="list"
    aria-label="Progreso del formulario"
    :style="{ display: 'flex', alignItems: 'center', marginBottom: 'var(--sp-xl)' }"
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
        <span :style="{
          fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
          color: actual >= i + 1 ? 'var(--color-text-1)' : 'var(--color-text-3)',
          whiteSpace: p.noWrapLabel ? 'nowrap' : (p.label2 ? 'normal' : 'nowrap'),
          textAlign: 'left', lineHeight: '1.3',
        }">{{ p.label }}<template v-if="p.label2"><br>{{ p.label2 }}</template></span>
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

<style scoped>
.step-mobile {
  margin-bottom: var(--sp-xl);
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.step-mobile-bar {
  width: 100%;
  height: 3px;
  background: var(--color-border-card);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: var(--sp-sm);
}

.step-mobile-progress {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width var(--transition-base);
}

.step-mobile-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-mobile-count {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
  font-family: var(--font-display);
}

.step-mobile-name {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  font-weight: var(--fw-medium);
}
</style>
