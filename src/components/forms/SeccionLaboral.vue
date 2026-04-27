<script setup>
import CampoTexto          from './CampoTexto.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'
import CampoFecha          from './CampoFecha.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  errores:    { type: Object, default: () => ({}) },
  titulo:     { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

// Detecta si el objeto es del codeudor por la presencia de campos con sufijo
function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

const opsTipoContrato = [
  { value: 'fijo',       label: 'Término fijo'     },
  { value: 'indefinido', label: 'Término indefinido'},
  { value: 'otro',       label: 'Otro'              },
]
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
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-lg)',
    }">
      <CampoTexto
        :model-value="modelValue[clave('cargo_oficio')]"
        label="Cargo u oficio"
        placeholder="Ej: Contador, Docente"
        required
        solo-texto-laboral
        :error="errores[clave('cargo_oficio')]"
        @update:model-value="actualizar(clave('cargo_oficio'), $event)"
      />
      <CampoTexto
        :model-value="modelValue[clave('nombre_empresa')]"
        label="Nombre de la empresa"
        placeholder="Empresa donde trabaja"
        required
        solo-texto-laboral
        :error="errores[clave('nombre_empresa')]"
        @update:model-value="actualizar(clave('nombre_empresa'), $event)"
      />
      <CampoSelectBuscable
        :model-value="modelValue[clave('tipo_contrato')]"
        label="Tipo de contrato"
        :opciones="opsTipoContrato"
        required
        :error="errores[clave('tipo_contrato')]"
        @update:model-value="actualizar(clave('tipo_contrato'), $event)"
      />
      <CampoTexto
        v-if="modelValue[clave('tipo_contrato')] === 'otro'"
        :model-value="modelValue[clave('tipo_contrato_otro')]"
        label="Especifique el tipo de contrato"
        placeholder="Describa el tipo de contrato"
        :error="errores[clave('tipo_contrato_otro')]"
        @update:model-value="actualizar(clave('tipo_contrato_otro'), $event)"
      />
      <div v-else />
      <CampoFecha
        :model-value="modelValue[clave('fecha_ingreso')]"
        label="Fecha de ingreso"
        required
        :error="errores[clave('fecha_ingreso')]"
        @update:model-value="actualizar(clave('fecha_ingreso'), $event)"
      />
    </div>
  </div>
</template>
