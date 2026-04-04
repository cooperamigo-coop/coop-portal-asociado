<script setup>
import CampoTexto       from './CampoTexto.vue'
import CampoSelect      from './CampoSelect.vue'
import CampoFecha       from './CampoFecha.vue'
import DireccionEstandar from './DireccionEstandar.vue'
import { TIPOS_DOCUMENTO } from '@/data/formularioCredito'

const props = defineProps({
  modelValue:           { type: Object, required: true },
  errores:              { type: Object, default: () => ({}) },
  titulo:               { type: String, required: true },
  // Bloquear doc/correo cuando vienen de la verificación previa
  bloquearDocumento:    { type: Boolean, default: false },
  bloquearCorreo:       { type: Boolean, default: false },
  // Objeto de dirección estructurada (solo para el solicitante)
  direccionEstructurada:{ type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'update:direccionEstructurada'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function actualizarDireccion(val) {
  emit('update:direccionEstructurada', val)
}

// Detecta si los campos son del codeudor
function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

function actualizarUpper(campo, valor) {
  actualizar(campo, valor ? valor.toUpperCase() : valor)
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
      <!-- Tipo de documento -->
      <CampoSelect
        :model-value="modelValue[clave('tipo_documento')]"
        label="Tipo de documento"
        :opciones="TIPOS_DOCUMENTO"
        required
        :disabled="bloquearDocumento"
        :error="errores[clave('tipo_documento')]"
        @update:model-value="actualizar(clave('tipo_documento'), $event)"
      />

      <!-- Número de identificación — bloqueado tras verificación -->
      <CampoTexto
        :model-value="modelValue[clave('numero_identificacion')]"
        label="Número de documento"
        placeholder="Ej: 1023456789"
        required
        :disabled="bloquearDocumento"
        :helper="bloquearDocumento ? 'Verificado al inicio' : null"
        :error="errores[clave('numero_identificacion')]"
        @update:model-value="actualizar(clave('numero_identificacion'), $event)"
      />

      <!-- Nombres -->
      <CampoTexto
        :model-value="modelValue[clave('nombres')]"
        label="Nombres"
        placeholder="NOMBRES COMPLETOS"
        required
        :error="errores[clave('nombres')]"
        @update:model-value="actualizar(clave('nombres'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('nombres'), modelValue[clave('nombres')])"
      />

      <!-- Apellidos -->
      <CampoTexto
        :model-value="modelValue[clave('apellidos')]"
        label="Apellidos"
        placeholder="APELLIDOS COMPLETOS"
        required
        :error="errores[clave('apellidos')]"
        @update:model-value="actualizar(clave('apellidos'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('apellidos'), modelValue[clave('apellidos')])"
      />

      <!-- Correo electrónico — bloqueado tras verificación -->
      <CampoTexto
        :model-value="modelValue[clave('correo_electronico')]"
        label="Correo electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        required
        :disabled="bloquearCorreo"
        :helper="bloquearCorreo ? 'Ingresado al inicio del proceso' : null"
        :error="errores[clave('correo_electronico')]"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar(clave('correo_electronico'), $event)"
      />

      <!-- Dirección: estándar colombiana para solicitante, texto libre para codeudor -->
      <div :style="{ gridColumn: '1 / -1' }">
        <DireccionEstandar
          v-if="direccionEstructurada !== null"
          :model-value="direccionEstructurada"
          :error="errores[clave('direccion_residencia')]"
          @update:model-value="actualizarDireccion($event)"
        />
        <CampoTexto
          v-else
          :model-value="modelValue[clave('direccion_residencia')]"
          label="Dirección de residencia"
          placeholder="Ej: Calle 45 # 23-18, Apto 301"
          required
          :error="errores[clave('direccion_residencia')]"
          @update:model-value="actualizar(clave('direccion_residencia'), $event ? $event.toUpperCase() : $event)"
        />
      </div>

      <!-- Ciudad -->
      <CampoTexto
        :model-value="modelValue[clave('ciudad')]"
        label="Ciudad"
        placeholder="BOGOTÁ"
        required
        :error="errores[clave('ciudad')]"
        @update:model-value="actualizar(clave('ciudad'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('ciudad'), modelValue[clave('ciudad')])"
      />

      <!-- Departamento -->
      <CampoTexto
        :model-value="modelValue[clave('departamento')]"
        label="Departamento"
        placeholder="CUNDINAMARCA"
        required
        :error="errores[clave('departamento')]"
        @update:model-value="actualizar(clave('departamento'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('departamento'), modelValue[clave('departamento')])"
      />

      <!-- Fecha de nacimiento -->
      <CampoFecha
        :model-value="modelValue[clave('fecha_nacimiento')]"
        label="Fecha de nacimiento"
        required
        :error="errores[clave('fecha_nacimiento')]"
        @update:model-value="actualizar(clave('fecha_nacimiento'), $event)"
      />

      <!-- Fecha expedición -->
      <CampoFecha
        :model-value="modelValue[clave('fecha_expedicion_documento')]"
        label="Fecha de expedición del documento"
        required
        :error="errores[clave('fecha_expedicion_documento')]"
        @update:model-value="actualizar(clave('fecha_expedicion_documento'), $event)"
      />

      <!-- Ciudad expedición -->
      <CampoTexto
        :model-value="modelValue[clave('ciudad_expedicion')]"
        label="Ciudad de expedición"
        placeholder="BOGOTÁ"
        required
        :error="errores[clave('ciudad_expedicion')]"
        @update:model-value="actualizar(clave('ciudad_expedicion'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('ciudad_expedicion'), modelValue[clave('ciudad_expedicion')])"
      />
    </div>
  </div>
</template>
