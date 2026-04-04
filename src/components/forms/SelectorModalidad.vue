<script setup>
import { CreditCard, GraduationCap } from 'lucide-vue-next'

defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const iconos = { CreditCard, GraduationCap }

const opciones = [
  {
    value:       'ordinario',
    titulo:      'Crédito ordinario',
    descripcion: 'Para necesidades personales, vivienda, vehículo u otros destinos. Permite reestructuración.',
    icono:       'CreditCard',
  },
  {
    value:       'educativo',
    titulo:      'Crédito educativo',
    descripcion: 'Para estudios propios o de un familiar directo. Aplican condiciones especiales.',
    icono:       'GraduationCap',
  },
]
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
    <div
      v-for="op in opciones"
      :key="op.value"
      :style="{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          'var(--sp-lg)',
        padding:      'var(--sp-xl)',
        borderRadius: 'var(--r-xl)',
        border:       modelValue === op.value
          ? '2px solid var(--color-primary)'
          : '1px solid var(--color-border)',
        background:   modelValue === op.value
          ? 'var(--color-primary-light)'
          : 'var(--color-bg-surface)',
        cursor:     'pointer',
        transition: 'all var(--transition-fast)',
      }"
      @click="$emit('update:modelValue', op.value)"
      @mouseenter="e => {
        if (modelValue !== op.value) {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }"
      @mouseleave="e => {
        if (modelValue !== op.value) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }"
    >
      <!-- Ícono -->
      <div :style="{
        width:          '52px',
        height:         '52px',
        borderRadius:   'var(--r-xl)',
        background:     modelValue === op.value
          ? 'var(--color-primary)'
          : 'var(--color-primary-light)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     '0',
        transition:     'background var(--transition-fast)',
      }">
        <component
          :is="iconos[op.icono]"
          :size="24"
          :style="{
            color: modelValue === op.value
              ? 'var(--color-text-on-primary)'
              : 'var(--color-primary)',
          }"
        />
      </div>

      <!-- Texto -->
      <div>
        <div :style="{
          fontFamily:   'var(--font-display)',
          fontSize:     'var(--text-md)',
          fontWeight:   'var(--fw-bold)',
          color:        'var(--color-text-1)',
          marginBottom: 'var(--sp-xs)',
        }">{{ op.titulo }}</div>
        <div :style="{
          fontSize:   'var(--text-base)',
          color:      'var(--color-text-2)',
          fontWeight: 'var(--fw-medium)',
          lineHeight: '1.6',
        }">{{ op.descripcion }}</div>
      </div>
    </div>
  </div>
</template>
