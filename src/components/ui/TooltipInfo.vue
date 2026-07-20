<script setup>
import { ref } from 'vue'
import { IconInfoCircle } from '@tabler/icons-vue'

defineProps({
  texto:    { type: String, required: true },
  posicion: { type: String, default: 'top' },
})

const visible = ref(false)
</script>

<template>
  <span
    :style="{ position: 'relative', display: 'inline-flex' }"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <IconInfoCircle
      :size="14"
      :style="{ color: 'var(--color-text-3)', cursor: 'help', flexShrink: '0' }"
    />
    <Transition name="tooltip-fade">
      <div
        v-if="visible"
        :style="{
          position:      'absolute',
          [posicion === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
          left:          '50%',
          transform:     'translateX(-50%)',
          background:    'var(--color-text-1)',
          color:         'var(--color-text-on-primary)',
          fontSize:      'var(--text-xs)',
          fontWeight:    'var(--fw-medium)',
          lineHeight:    '1.5',
          padding:       'var(--sp-sm) var(--sp-md)',
          borderRadius:  'var(--r-lg)',
          width:         '240px',
          zIndex:        '100',
          boxShadow:     'var(--shadow-modal)',
          pointerEvents: 'none',
          textAlign:     'center',
        }"
      >
        {{ texto }}
        <div :style="{
          position:  'absolute',
          [posicion === 'top' ? 'bottom' : 'top']: '-5px',
          left:      '50%',
          transform: 'translateX(-50%)',
          width:     '0',
          height:    '0',
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          [posicion === 'top' ? 'borderTop' : 'borderBottom']:
            '5px solid var(--color-text-1)',
        }" />
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active { transition: opacity 0.15s ease; }
.tooltip-fade-enter-from,
.tooltip-fade-leave-to      { opacity: 0; }
</style>
