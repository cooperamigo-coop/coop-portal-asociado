<script setup>
import CampoCheck  from './CampoCheck.vue'
import CampoMoneda from './CampoMoneda.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  errores:    { type: Object, default: () => ({}) },
  titulo:     { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

// Detecta si es codeudor por la presencia del campo con sufijo
function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}
</script>

<template>
  <div>
    <div :style="{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color: 'var(--color-text-1)',
      marginBottom: 'var(--sp-xl)',
    }">{{ titulo }}</div>

    <div :style="{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-lg)',
    }">
      <CampoCheck
        :model-value="modelValue[clave('tiene_propiedad_raiz')]"
        label="Tengo propiedad raíz (casa, apartamento, lote, etc.)"
        @update:model-value="actualizar(clave('tiene_propiedad_raiz'), $event)"
      />
      <CampoMoneda
        v-if="modelValue[clave('tiene_propiedad_raiz')]"
        :model-value="modelValue[clave('valor_propiedad_raiz')]"
        label="Valor estimado de la propiedad raíz"
        :error="errores[clave('valor_propiedad_raiz')]"
        @update:model-value="actualizar(clave('valor_propiedad_raiz'), $event)"
      />

      <CampoCheck
        :model-value="modelValue[clave('tiene_vehiculo')]"
        label="Tengo vehículo (carro, moto, etc.)"
        @update:model-value="actualizar(clave('tiene_vehiculo'), $event)"
      />
      <CampoMoneda
        v-if="modelValue[clave('tiene_vehiculo')]"
        :model-value="modelValue[clave('valor_vehiculo')]"
        label="Valor estimado del vehículo"
        :error="errores[clave('valor_vehiculo')]"
        @update:model-value="actualizar(clave('valor_vehiculo'), $event)"
      />

      <div :style="{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[clave('total_activos')]"
          label="Total activos"
          required
          :error="errores[clave('total_activos')]"
          @update:model-value="actualizar(clave('total_activos'), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('total_pasivos')]"
          label="Total pasivos"
          required
          :error="errores[clave('total_pasivos')]"
          @update:model-value="actualizar(clave('total_pasivos'), $event)"
        />
      </div>
    </div>
  </div>
</template>
