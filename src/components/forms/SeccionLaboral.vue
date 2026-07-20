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

    <div class="form-col">
      <!-- Cargo + Empresa: 2 cols en desktop, 1 col en móvil -->
      <div class="form-grid-2">
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
      </div>
      <!-- Tipo de contrato + Fecha de ingreso: siempre 50/50 -->
      <div class="form-grid-half">
        <CampoSelectBuscable
          :model-value="modelValue[clave('tipo_contrato')]"
          label="Tipo de contrato"
          :opciones="opsTipoContrato"
          required
          :error="errores[clave('tipo_contrato')]"
          @update:model-value="actualizar(clave('tipo_contrato'), $event)"
        />
        <CampoFecha
          :model-value="modelValue[clave('fecha_ingreso')]"
          label="Fecha de ingreso"
          required
          :error="errores[clave('fecha_ingreso')]"
          @update:model-value="actualizar(clave('fecha_ingreso'), $event)"
        />
      </div>
      <CampoTexto
        v-if="modelValue[clave('tipo_contrato')] === 'otro'"
        :model-value="modelValue[clave('tipo_contrato_otro')]"
        label="Especifique el tipo de contrato"
        placeholder="Describa el tipo de contrato"
        :error="errores[clave('tipo_contrato_otro')]"
        @update:model-value="actualizar(clave('tipo_contrato_otro'), $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}

.form-grid-half {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}
.form-grid-half > * { min-width: 0; }

.form-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

@media (max-width: 600px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
