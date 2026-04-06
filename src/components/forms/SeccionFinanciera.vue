<script setup>
import CampoMoneda from './CampoMoneda.vue'
import CampoTexto  from './CampoTexto.vue'

const props = defineProps({
  modelValue:       { type: Object,  required: true },
  errores:          { type: Object,  default: () => ({}) },
  titulo:           { type: String,  required: true },
  salarioBloqueado: { type: Boolean, default: false },
  tipoTrabajador:   { type: String,  default: '' },
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

function claveFuente() {
  return 'fuente_ingresos_codeudor' in props.modelValue
    ? 'fuente_ingresos_codeudor'
    : 'fuente_ingresos'
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
      <!-- Fuente de ingresos para cuidado del hogar -->
      <CampoTexto
        v-if="tipoTrabajador === 'cuidado_hogar'"
        :model-value="modelValue[claveFuente()]"
        label="Fuente de ingresos"
        placeholder="Ej: Apoyo familiar, arrendamiento, pensión de esposo/a..."
        required
        :error="errores[claveFuente()]"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar(claveFuente(), $event)"
      />

      <!-- Salario — oculto para cuidado_hogar -->
      <CampoMoneda
        v-if="tipoTrabajador !== 'cuidado_hogar'"
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
        label="Ingresos como independiente / otros ingresos"
        :error="errores[clave('ingresos_independiente')]"
        @update:model-value="actualizar(clave('ingresos_independiente'), $event)"
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
        tooltip="Cuánto pagas mensual en obligaciones con comercios, bancos, cooperativas u otras entidades."
        :error="errores[clave('obligaciones_financieras')]"
        @update:model-value="actualizar(clave('obligaciones_financieras'), $event)"
      />
    </div>
  </div>
</template>
