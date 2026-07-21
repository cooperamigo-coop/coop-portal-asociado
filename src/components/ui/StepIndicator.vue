<script setup>
import { computed } from 'vue'
import { IconCircleCheck } from '@tabler/icons-vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const props = defineProps({
  pasos:    { type: Array, required: true },
  actual:   { type: Number, required: true },
  vertical: { type: Boolean, default: false },
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

  <!-- Desktop vertical: sidebar sticky -->
  <div v-else-if="vertical" class="step-vertical" role="list" aria-label="Progreso del formulario">
    <template v-for="(p, i) in pasos" :key="i">
      <div class="step-v-item" role="listitem" :aria-current="actual === i + 1 ? 'step' : undefined">
        <!-- Círculo + línea conectora -->
        <div class="step-v-track">
          <div class="step-v-circle" :class="{
            'step-v-circle--done':    actual > i + 1,
            'step-v-circle--active':  actual === i + 1,
            'step-v-circle--pending': actual < i + 1,
          }">
            <IconCircleCheck v-if="actual > i + 1" :size="14" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div v-if="i < pasos.length - 1" class="step-v-line" :class="{ 'step-v-line--done': actual > i + 1 }" />
        </div>
        <!-- Label -->
        <div class="step-v-label" :class="{
          'step-v-label--active':  actual === i + 1,
          'step-v-label--done':    actual > i + 1,
          'step-v-label--pending': actual < i + 1,
        }">
          <span v-if="actual === i + 1" class="step-v-aqui">¡Estás aquí!</span>
          {{ p.label }}<template v-if="p.label2"><br>{{ p.label2 }}</template>
        </div>
      </div>
    </template>
  </div>

  <!-- Desktop horizontal: indicador completo -->
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
        <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }">
          <span v-if="actual === i + 1" class="step-v-aqui">¡Estás aquí!</span>
          <span :style="{
            fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
            color: actual >= i + 1 ? 'var(--color-text-1)' : 'var(--color-text-3)',
            whiteSpace: p.noWrapLabel ? 'nowrap' : (p.label2 ? 'normal' : 'nowrap'),
            textAlign: 'left', lineHeight: '1.3',
          }">{{ p.label }}<template v-if="p.label2"><br>{{ p.label2 }}</template></span>
        </div>
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
/* ─── Vertical (sidebar desktop) ─── */
.step-vertical {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-v-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--sp-md);
}

.step-v-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-v-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  font-family: var(--font-body);
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.step-v-circle--done {
  background: var(--color-success);
  color: #ffffff;
  border: none;
}

.step-v-circle--active {
  background: var(--color-primary);
  color: #ffffff;
  border: none;
}

.step-v-circle--pending {
  background: var(--color-bg-card);
  color: var(--color-text-3);
  border: 1px solid var(--color-border);
}

.step-v-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: var(--color-border);
  border-radius: 1px;
  margin: 4px 0;
  transition: background var(--transition-base);
}

.step-v-line--done {
  background: var(--color-success);
}

.step-v-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 28px;
  padding: 4px 0 24px;
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  line-height: 1.3;
  transition: color var(--transition-base);
}

.step-v-label--active {
  color: var(--color-text-1);
  font-weight: var(--fw-bold);
}

.step-v-label--done {
  color: var(--color-text-3);
}

.step-v-label--pending {
  color: var(--color-text-3);
}

.step-v-aqui {
  display: block;
  color: #4d7480;
  font-size: var(--text-xs);
  font-weight: var(--fw-regular);
  margin-bottom: 2px;
}

/* ─── Mobile ─── */
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
