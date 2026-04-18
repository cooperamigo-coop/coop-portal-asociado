<script setup>
import CampoMoneda from './CampoMoneda.vue'
import { IconHome, IconCar } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  errores:    { type: Object, default: () => ({}) },
  titulo:     { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

function setActivo(tipo, activo) {
  const update = { ...props.modelValue, [clave(tipo)]: activo }
  if (!activo) {
    if (tipo === 'tiene_propiedad_raiz') update[clave('valor_propiedad_raiz')] = ''
    if (tipo === 'tiene_vehiculo') update[clave('valor_vehiculo')] = ''
  }
  emit('update:modelValue', update)
}

function esActivo(tipo) {
  return !!props.modelValue[clave(tipo)]
}

function toggleActivo(tipo) {
  setActivo(tipo, !esActivo(tipo))
}
</script>

<template>
  <div>
    <div v-if="titulo" :style="{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color: 'var(--color-text-1)',
      marginBottom: 'var(--sp-xs)',
    }">{{ titulo }}</div>
    <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-md)' }">
      <div :style="{ borderRadius: 'var(--r-lg)', border: modelValue[clave('tiene_propiedad_raiz')] ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-bg-card)', padding: 'var(--sp-md)' }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-sm)' }">
          <div :style="{ width: '34px', height: '34px', borderRadius: 'var(--r-md)', background: 'var(--color-bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
            <IconHome :size="18" :style="{ color: 'var(--color-text-3)' }" />
          </div>
          <div :style="{ flex: 1 }">
            <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">Propiedad raíz</div>
            <div :style="{ fontSize: '12px', color: 'var(--color-text-3)' }">Casa, apartamento, lote, finca o local.</div>
          </div>
          <label :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', cursor: 'pointer', userSelect: 'none' }">
            <input type="checkbox" :checked="esActivo('tiene_propiedad_raiz')" :style="{ display: 'none' }" @change="toggleActivo('tiene_propiedad_raiz')" />
            <span :style="{ width: '36px', height: '20px', borderRadius: '999px', background: esActivo('tiene_propiedad_raiz') ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background var(--transition-fast)' }">
              <span :style="{ position: 'absolute', top: '2px', left: esActivo('tiene_propiedad_raiz') ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }" />
            </span>
            <span :style="{ fontSize: '12px', fontWeight: 'var(--fw-semibold)', color: esActivo('tiene_propiedad_raiz') ? 'var(--color-primary)' : 'var(--color-text-3)' }">{{ esActivo('tiene_propiedad_raiz') ? 'Sí' : 'No' }}</span>
          </label>
        </div>
        <div v-if="esActivo('tiene_propiedad_raiz')">
          <CampoMoneda :model-value="modelValue[clave('valor_propiedad_raiz')]" label="Valor estimado de la propiedad" :error="errores[clave('valor_propiedad_raiz')]" @update:model-value="actualizar(clave('valor_propiedad_raiz'), $event)" />
        </div>
      </div>

      <div :style="{ borderRadius: 'var(--r-lg)', border: modelValue[clave('tiene_vehiculo')] ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-bg-card)', padding: 'var(--sp-md)' }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-sm)' }">
          <div :style="{ width: '34px', height: '34px', borderRadius: 'var(--r-md)', background: 'var(--color-bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
            <IconCar :size="18" :style="{ color: 'var(--color-text-3)' }" />
          </div>
          <div :style="{ flex: 1 }">
            <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">Vehículo</div>
            <div :style="{ fontSize: '12px', color: 'var(--color-text-3)' }">Carro, moto, camión o maquinaria.</div>
          </div>
          <label :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', cursor: 'pointer', userSelect: 'none' }">
            <input type="checkbox" :checked="esActivo('tiene_vehiculo')" :style="{ display: 'none' }" @change="toggleActivo('tiene_vehiculo')" />
            <span :style="{ width: '36px', height: '20px', borderRadius: '999px', background: esActivo('tiene_vehiculo') ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background var(--transition-fast)' }">
              <span :style="{ position: 'absolute', top: '2px', left: esActivo('tiene_vehiculo') ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }" />
            </span>
            <span :style="{ fontSize: '12px', fontWeight: 'var(--fw-semibold)', color: esActivo('tiene_vehiculo') ? 'var(--color-primary)' : 'var(--color-text-3)' }">{{ esActivo('tiene_vehiculo') ? 'Sí' : 'No' }}</span>
          </label>
        </div>
        <div v-if="esActivo('tiene_vehiculo')">
          <CampoMoneda :model-value="modelValue[clave('valor_vehiculo')]" label="Valor estimado del vehículo" :error="errores[clave('valor_vehiculo')]" @update:model-value="actualizar(clave('valor_vehiculo'), $event)" />
        </div>
      </div>
    </div>

    <div
      v-if="!esActivo('tiene_propiedad_raiz') && !esActivo('tiene_vehiculo')"
      :style="{ marginTop: 'var(--sp-sm)', fontSize: '12px', color: 'var(--color-text-3)' }"
    >
      Si no posee ninguno, puede continuar sin seleccionar.
    </div>
  </div>
</template>
