<script setup>
import CampoMoneda from './CampoMoneda.vue'

const props = defineProps({
  modelValue:      { type: Object, required: true },
  errores:         { type: Object, default: () => ({}) },
  titulo:          { type: String, required: true },
  salarioBloqueado:{ type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

function claveSalario() {
  return 'salario_codeudor' in props.modelValue
    ? 'salario_codeudor'
    : 'salario_ingresos_fijos'
}
</script>

<template>
  <div>
    <div :style="{
      fontFamily:   'var(--font-display)',
      fontSize:     'var(--text-lg)',
      fontWeight:   'var(--fw-extrabold)',
      color:        'var(--color-text-1)',
      marginBottom: 'var(--sp-xl)',
    }">{{ titulo }}</div>

    <div :style="{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      gap:                 'var(--sp-lg)',
    }">
      <!-- Salario — bloqueable para independientes -->
      <CampoMoneda
        :model-value="modelValue[claveSalario()]"
        label="Salario / Ingresos fijos"
        :required="!salarioBloqueado"
        :disabled="salarioBloqueado"
        :helper="salarioBloqueado ? 'No aplica para trabajadores independientes' : null"
        :error="errores[claveSalario()]"
        @update:model-value="actualizar(claveSalario(), $event)"
      />
      <CampoMoneda
        :model-value="modelValue[clave('ingresos_independiente')]"
        label="Ingresos como independiente"
        :error="errores[clave('ingresos_independiente')]"
        @update:model-value="actualizar(clave('ingresos_independiente'), $event)"
      />
      <CampoMoneda
        :model-value="modelValue[clave('otros_ingresos')]"
        label="Otros ingresos"
        :error="errores[clave('otros_ingresos')]"
        @update:model-value="actualizar(clave('otros_ingresos'), $event)"
      />
      <CampoMoneda
        :model-value="modelValue[clave('gastos_familiares')]"
        label="Gastos familiares"
        required
        :error="errores[clave('gastos_familiares')]"
        @update:model-value="actualizar(clave('gastos_familiares'), $event)"
      />
      <CampoMoneda
        :model-value="modelValue[clave('otros_gastos')]"
        label="Otros gastos"
        :error="errores[clave('otros_gastos')]"
        @update:model-value="actualizar(clave('otros_gastos'), $event)"
      />
      <CampoMoneda
        :model-value="modelValue[clave('obligaciones_financieras')]"
        label="Obligaciones financieras"
        :error="errores[clave('obligaciones_financieras')]"
        @update:model-value="actualizar(clave('obligaciones_financieras'), $event)"
      />
    </div>
  </div>
</template>
