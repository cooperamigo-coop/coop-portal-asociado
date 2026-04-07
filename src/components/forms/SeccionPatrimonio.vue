<script setup>
import CampoMoneda from './CampoMoneda.vue'
import { IconHome, IconCar, IconCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  errores:    { type: Object, default: () => ({}) },
  titulo:     { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

function togglePropiedad() {
  const nuevaVal = !props.modelValue[clave('tiene_propiedad_raiz')]
  const update = { ...props.modelValue, [clave('tiene_propiedad_raiz')]: nuevaVal }
  if (!nuevaVal) update[clave('valor_propiedad_raiz')] = ''
  emit('update:modelValue', update)
}

function toggleVehiculo() {
  const nuevaVal = !props.modelValue[clave('tiene_vehiculo')]
  const update = { ...props.modelValue, [clave('tiene_vehiculo')]: nuevaVal }
  if (!nuevaVal) update[clave('valor_vehiculo')] = ''
  emit('update:modelValue', update)
}
</script>

<template>
  <div>
    <div :style="{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color: 'var(--color-text-1)',
      marginBottom: 'var(--sp-xs)',
    }">{{ titulo }}</div>
    <div :style="{
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-3)',
      fontWeight: 'var(--fw-medium)',
      marginBottom: 'var(--sp-xl)',
    }">Seleccione los activos que posee actualmente.</div>

    <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

      <!-- Tarjeta: Propiedad raíz -->
      <div
        :style="{
          borderRadius: 'var(--r-xl)',
          border: modelValue[clave('tiene_propiedad_raiz')]
            ? '2px solid var(--color-primary)'
            : '1.5px solid var(--color-border)',
          background: modelValue[clave('tiene_propiedad_raiz')]
            ? 'var(--color-primary-light)'
            : 'var(--color-bg-surface)',
          transition: 'all var(--transition-base)',
          overflow: 'hidden',
        }"
      >
        <!-- Cabecera clicable -->
        <div
          :style="{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-lg)',
            padding: 'var(--sp-lg) var(--sp-xl)',
            cursor: 'pointer',
          }"
          @click="togglePropiedad()"
        >
          <!-- Ícono casa -->
          <div :style="{
            width: '52px', height: '52px', borderRadius: 'var(--r-xl)',
            background: modelValue[clave('tiene_propiedad_raiz')]
              ? 'var(--color-primary)'
              : 'var(--color-bg-surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: '0',
            transition: 'background var(--transition-base)',
          }">
            <IconHome
              :size="26"
              :style="{ color: modelValue[clave('tiene_propiedad_raiz')] ? '#fff' : 'var(--color-text-3)' }"
            />
          </div>

          <!-- Texto -->
          <div :style="{ flex: '1' }">
            <div :style="{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--fw-extrabold)',
              fontSize: 'var(--text-base)',
              color: modelValue[clave('tiene_propiedad_raiz')] ? 'var(--color-primary)' : 'var(--color-text-1)',
              marginBottom: '2px',
            }">Propiedad raíz</div>
            <div :style="{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-3)',
              fontWeight: 'var(--fw-medium)',
            }">Casa, apartamento, lote, finca, local, etc.</div>
          </div>

          <!-- Check -->
          <div :style="{
            width: '28px', height: '28px', borderRadius: '50%',
            border: modelValue[clave('tiene_propiedad_raiz')]
              ? 'none'
              : '2px solid var(--color-border)',
            background: modelValue[clave('tiene_propiedad_raiz')]
              ? 'var(--color-primary)'
              : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: '0',
            transition: 'all var(--transition-base)',
          }">
            <IconCheck v-if="modelValue[clave('tiene_propiedad_raiz')]" :size="16" style="color: #fff;" />
          </div>
        </div>

        <!-- Campo de valor (si está seleccionado) -->
        <div
          v-if="modelValue[clave('tiene_propiedad_raiz')]"
          :style="{
            padding: 'var(--sp-sm) var(--sp-xl) var(--sp-lg)',
            borderTop: '1px solid rgba(17,76,90,0.12)',
          }"
        >
          <CampoMoneda
            :model-value="modelValue[clave('valor_propiedad_raiz')]"
            label="Valor estimado de la propiedad"
            :error="errores[clave('valor_propiedad_raiz')]"
            @update:model-value="actualizar(clave('valor_propiedad_raiz'), $event)"
          />
        </div>
      </div>

      <!-- Tarjeta: Vehículo -->
      <div
        :style="{
          borderRadius: 'var(--r-xl)',
          border: modelValue[clave('tiene_vehiculo')]
            ? '2px solid var(--color-primary)'
            : '1.5px solid var(--color-border)',
          background: modelValue[clave('tiene_vehiculo')]
            ? 'var(--color-primary-light)'
            : 'var(--color-bg-surface)',
          transition: 'all var(--transition-base)',
          overflow: 'hidden',
        }"
      >
        <!-- Cabecera clicable -->
        <div
          :style="{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-lg)',
            padding: 'var(--sp-lg) var(--sp-xl)',
            cursor: 'pointer',
          }"
          @click="toggleVehiculo()"
        >
          <!-- Ícono carro -->
          <div :style="{
            width: '52px', height: '52px', borderRadius: 'var(--r-xl)',
            background: modelValue[clave('tiene_vehiculo')]
              ? 'var(--color-primary)'
              : 'var(--color-bg-surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: '0',
            transition: 'background var(--transition-base)',
          }">
            <IconCar
              :size="26"
              :style="{ color: modelValue[clave('tiene_vehiculo')] ? '#fff' : 'var(--color-text-3)' }"
            />
          </div>

          <!-- Texto -->
          <div :style="{ flex: '1' }">
            <div :style="{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--fw-extrabold)',
              fontSize: 'var(--text-base)',
              color: modelValue[clave('tiene_vehiculo')] ? 'var(--color-primary)' : 'var(--color-text-1)',
              marginBottom: '2px',
            }">Vehículo</div>
            <div :style="{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-3)',
              fontWeight: 'var(--fw-medium)',
            }">Carro, moto, camión, maquinaria, etc.</div>
          </div>

          <!-- Check -->
          <div :style="{
            width: '28px', height: '28px', borderRadius: '50%',
            border: modelValue[clave('tiene_vehiculo')]
              ? 'none'
              : '2px solid var(--color-border)',
            background: modelValue[clave('tiene_vehiculo')]
              ? 'var(--color-primary)'
              : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: '0',
            transition: 'all var(--transition-base)',
          }">
            <IconCheck v-if="modelValue[clave('tiene_vehiculo')]" :size="16" style="color: #fff;" />
          </div>
        </div>

        <!-- Campo de valor (si está seleccionado) -->
        <div
          v-if="modelValue[clave('tiene_vehiculo')]"
          :style="{
            padding: 'var(--sp-sm) var(--sp-xl) var(--sp-lg)',
            borderTop: '1px solid rgba(17,76,90,0.12)',
          }"
        >
          <CampoMoneda
            :model-value="modelValue[clave('valor_vehiculo')]"
            label="Valor estimado del vehículo"
            :error="errores[clave('valor_vehiculo')]"
            @update:model-value="actualizar(clave('valor_vehiculo'), $event)"
          />
        </div>
      </div>

      <!-- Nota cuando no selecciona nada -->
      <div
        v-if="!modelValue[clave('tiene_propiedad_raiz')] && !modelValue[clave('tiene_vehiculo')]"
        :style="{
          padding: 'var(--sp-md) var(--sp-lg)',
          borderRadius: 'var(--r-lg)',
          background: 'var(--color-bg-surface)',
          border: '1px dashed var(--color-border)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-3)',
          fontWeight: 'var(--fw-medium)',
          textAlign: 'center',
        }"
      >
        Si no posee ninguno de los anteriores, puede continuar sin seleccionar.
      </div>

    </div>
  </div>
</template>
