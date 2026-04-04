<script setup>
import CampoTexto  from './CampoTexto.vue'
import CampoSelect from './CampoSelect.vue'
import CampoFecha  from './CampoFecha.vue'

const props = defineProps({
  modelValue:    { type: Object, required: true },
  errores:       { type: Object, default: () => ({}) },
  titulo:        { type: String, required: true },
  emailRequerido:{ type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

const opsTipoDocumento = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
  { value: 'pasaporte',          label: 'Pasaporte'             },
  { value: 'otro',               label: 'Otro'                  },
]

const opsTipoPersona = [
  { value: 'empleado',      label: 'Empleado'      },
  { value: 'independiente', label: 'Independiente' },
  { value: 'pensionado',    label: 'Pensionado'    },
  { value: 'estudiante',    label: 'Estudiante'    },
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
      <CampoSelect
        :model-value="modelValue.tipo_documento ?? modelValue.tipo_documento_codeudor ?? ''"
        label="Tipo de documento"
        :opciones="opsTipoDocumento"
        required
        :error="errores.tipo_documento ?? errores.tipo_documento_codeudor"
        @update:model-value="actualizar(
          'tipo_documento' in modelValue ? 'tipo_documento' : 'tipo_documento_codeudor',
          $event
        )"
      />
      <CampoTexto
        :model-value="modelValue.numero_identificacion ?? modelValue.numero_identificacion_codeudor ?? ''"
        label="Número de identificación"
        placeholder="Ej: 1023456789"
        required
        :error="errores.numero_identificacion ?? errores.numero_identificacion_codeudor"
        @update:model-value="actualizar(
          'numero_identificacion' in modelValue ? 'numero_identificacion' : 'numero_identificacion_codeudor',
          $event
        )"
      />
      <CampoSelect
        :model-value="modelValue.tipo_persona ?? modelValue.tipo_persona_codeudor ?? ''"
        label="Tipo de persona"
        :opciones="opsTipoPersona"
        required
        :error="errores.tipo_persona ?? errores.tipo_persona_codeudor"
        @update:model-value="actualizar(
          'tipo_persona' in modelValue ? 'tipo_persona' : 'tipo_persona_codeudor',
          $event
        )"
      />
      <div />

      <CampoTexto
        :model-value="modelValue.nombres ?? modelValue.nombres_codeudor ?? ''"
        label="Nombres"
        placeholder="Nombres completos"
        required
        :error="errores.nombres ?? errores.nombres_codeudor"
        @update:model-value="actualizar(
          'nombres' in modelValue ? 'nombres' : 'nombres_codeudor',
          $event
        )"
      />
      <CampoTexto
        :model-value="modelValue.apellidos ?? modelValue.apellidos_codeudor ?? ''"
        label="Apellidos"
        placeholder="Apellidos completos"
        required
        :error="errores.apellidos ?? errores.apellidos_codeudor"
        @update:model-value="actualizar(
          'apellidos' in modelValue ? 'apellidos' : 'apellidos_codeudor',
          $event
        )"
      />

      <CampoTexto
        :model-value="modelValue.correo_electronico ?? modelValue.correo_codeudor ?? ''"
        label="Correo electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        :required="emailRequerido"
        :error="errores.correo_electronico ?? errores.correo_codeudor"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar(
          'correo_electronico' in modelValue ? 'correo_electronico' : 'correo_codeudor',
          $event
        )"
      />

      <CampoTexto
        :model-value="modelValue.direccion_residencia ?? modelValue.direccion_codeudor ?? ''"
        label="Dirección de residencia"
        placeholder="Calle, Carrera, Número"
        required
        :error="errores.direccion_residencia ?? errores.direccion_codeudor"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar(
          'direccion_residencia' in modelValue ? 'direccion_residencia' : 'direccion_codeudor',
          $event
        )"
      />

      <CampoTexto
        :model-value="modelValue.ciudad ?? modelValue.ciudad_codeudor ?? ''"
        label="Ciudad"
        placeholder="Ej: Bogotá, Medellín"
        required
        :error="errores.ciudad ?? errores.ciudad_codeudor"
        @update:model-value="actualizar(
          'ciudad' in modelValue ? 'ciudad' : 'ciudad_codeudor',
          $event
        )"
      />
      <CampoTexto
        :model-value="modelValue.departamento ?? modelValue.departamento_codeudor ?? ''"
        label="Departamento"
        placeholder="Ej: Cundinamarca"
        required
        :error="errores.departamento ?? errores.departamento_codeudor"
        @update:model-value="actualizar(
          'departamento' in modelValue ? 'departamento' : 'departamento_codeudor',
          $event
        )"
      />

      <CampoFecha
        :model-value="modelValue.fecha_nacimiento ?? modelValue.fecha_nacimiento_codeudor ?? ''"
        label="Fecha de nacimiento"
        required
        :error="errores.fecha_nacimiento ?? errores.fecha_nacimiento_codeudor"
        @update:model-value="actualizar(
          'fecha_nacimiento' in modelValue ? 'fecha_nacimiento' : 'fecha_nacimiento_codeudor',
          $event
        )"
      />
      <CampoFecha
        :model-value="modelValue.fecha_expedicion_documento ?? modelValue.fecha_expedicion_codeudor ?? ''"
        label="Fecha de expedición del documento"
        required
        :error="errores.fecha_expedicion_documento ?? errores.fecha_expedicion_codeudor"
        @update:model-value="actualizar(
          'fecha_expedicion_documento' in modelValue ? 'fecha_expedicion_documento' : 'fecha_expedicion_codeudor',
          $event
        )"
      />

      <CampoTexto
        :model-value="modelValue.ciudad_expedicion ?? modelValue.ciudad_expedicion_codeudor ?? ''"
        label="Ciudad de expedición"
        placeholder="Ciudad donde se expidió el documento"
        required
        :error="errores.ciudad_expedicion ?? errores.ciudad_expedicion_codeudor"
        @update:model-value="actualizar(
          'ciudad_expedicion' in modelValue ? 'ciudad_expedicion' : 'ciudad_expedicion_codeudor',
          $event
        )"
      />
    </div>
  </div>
</template>
