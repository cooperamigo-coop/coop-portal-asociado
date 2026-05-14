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
    titulo:      'Crédito Ordinario/Consumo',
    descripcion: 'Para necesidades personales, vivienda, vehículo u otros destinos.',
    icono:       'CreditCard',
  },
  {
    value:       'educativo',
    titulo:      'Crédito Educativo',
    descripcion: 'Para estudios de pregrado/postgrado en la Universidad Católica Luis Amigó',
    icono:       'GraduationCap',
  },
]
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

    <!-- Encabezado -->
    <div class="selector-header" :style="{ marginBottom: 'var(--sp-sm)' }">
      <h2 :style="{
        fontFamily:   'var(--font-display)',
        fontSize:     'var(--text-2xl)',
        fontWeight:   'var(--fw-extrabold)',
        color:        'var(--color-text-1)',
        margin:       '0 0 var(--sp-xs)',
        lineHeight:   '1.1',
      }">Solicitud de crédito</h2>
      <p :style="{
        fontSize:   'var(--text-base)',
        color:      'var(--color-text-2)',
        fontWeight: 'var(--fw-regular)',
        lineHeight: '1.2',
        margin:     '0',
      }">¿Qué modalidad de crédito deseas solicitar?</p>
    </div>
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
          ? 'var(--color-bg-card)'
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
        borderRadius:   'var(--r-lg)',
        background:     modelValue === op.value
          ? 'var(--color-primary)'
          : 'var(--color-bg-card)',
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
          fontWeight: 'var(--fw-regular)',
          lineHeight: '1.2',
        }">{{ op.descripcion }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .selector-header {
    text-align: center;
  }

  .selector-header h2 {
    font-size: 18px;
  }

  .selector-header p {
    font-size: 12px;
  }
}
</style>
