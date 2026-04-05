<script setup>
import { IconBriefcase, IconBuildingStore, IconHeartHandshake, IconBook, IconHome } from '@tabler/icons-vue'

defineProps({
  modelValue: { type: String, default: '' },
  error:      { type: String, default: null },
})
defineEmits(['update:modelValue'])

const opciones = [
  { value: 'empleado',      label: 'Empleado',       icono: IconBriefcase      },
  { value: 'independiente', label: 'Independiente',   icono: IconBuildingStore  },
  { value: 'pensionado',    label: 'Pensionado',      icono: IconHeartHandshake },
  { value: 'estudiante',    label: 'Estudiante',      icono: IconBook           },
  { value: 'cuidado_hogar', label: 'Cuidado del hogar', icono: IconHome         },
]
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
    <label :style="{
      fontSize:   'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color:      error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      Situación laboral actual <span :style="{ color: 'var(--color-error)' }"> *</span>
    </label>

    <div :style="{
      display:   'flex',
      flexWrap:  'wrap',
      gap:       'var(--sp-sm)',
      marginTop: 'var(--sp-xs)',
    }">
      <div
        v-for="op in opciones"
        :key="op.value"
        :style="{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            'var(--sp-xs)',
          padding:        'var(--sp-md) var(--sp-lg)',
          borderRadius:   'var(--r-xl)',
          border:         modelValue === op.value
            ? '2px solid var(--color-primary)'
            : '1px solid var(--color-border)',
          background:     modelValue === op.value
            ? 'var(--color-primary-light)'
            : 'var(--color-bg-surface)',
          cursor:         'pointer',
          transition:     'all var(--transition-fast)',
          minWidth:       '100px',
        }"
        @click="$emit('update:modelValue', op.value)"
      >
        <component
          :is="op.icono"
          :size="22"
          :style="{
            color: modelValue === op.value
              ? 'var(--color-primary)'
              : 'var(--color-text-3)',
            transition: 'color var(--transition-fast)',
          }"
        />
        <span :style="{
          fontSize:   'var(--text-sm)',
          fontWeight: modelValue === op.value ? 'var(--fw-bold)' : 'var(--fw-medium)',
          color:      modelValue === op.value ? 'var(--color-primary)' : 'var(--color-text-2)',
          textAlign:  'center',
          lineHeight: '1.3',
        }">{{ op.label }}</span>
      </div>
    </div>

    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>
