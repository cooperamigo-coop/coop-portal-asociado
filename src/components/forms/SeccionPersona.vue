<script setup>
import { ref, computed } from 'vue'
import CampoTexto          from './CampoTexto.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'
import SelectorFecha       from './SelectorFecha.vue'
import ModalDireccion      from './ModalDireccion.vue'
import { TIPOS_DOCUMENTO } from '@/data/formularioCredito'

const TIPOS_DOC_CODEUDOR = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]

const props = defineProps({
  modelValue:            { type: Object,  required: true },
  errores:               { type: Object,  default: () => ({}) },
  titulo:                { type: String,  default: '' },
  bloquearDocumento:     { type: Boolean, default: false },
  bloquearCorreo:        { type: Boolean, default: false },
  direccionEstructurada: { type: Object,  default: null },
  ubicacion: {
    type: Object,
    default: () => ({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' }),
  },
  showNivelEducativo: { type: Boolean, default: false },
  esCodeudor: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:direccionEstructurada',
  'update:ubicacion',
])

const modalDireccionVisible = ref(false)

const tiposDocOpciones = computed(() =>
  props.esCodeudor ? TIPOS_DOC_CODEUDOR : TIPOS_DOCUMENTO
)

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function actualizarDireccion(val) {
  const { depto_codigo, depto_nombre, municipio_codigo, municipio_nombre, ...direccionSolo } = val
  emit('update:direccionEstructurada', direccionSolo)
  if (depto_codigo) {
    emit('update:ubicacion', { depto_codigo, depto_nombre, municipio_codigo, municipio_nombre })
  }
}

function clave(base) {
  const sufijo2 = base + '_codeudor2'
  const sufijo1 = base + '_codeudor'
  const sufijoS = base + '_solicitante'
  if (sufijo2 in props.modelValue) return sufijo2
  if (sufijo1 in props.modelValue) return sufijo1
  if (sufijoS in props.modelValue) return sufijoS
  return base
}

function actualizarUpper(campo, valor) {
  actualizar(campo, valor ? valor.toUpperCase() : valor)
}

const textoResidencia = computed(() => {
  return props.modelValue[clave('direccion_residencia')] || ''
})

const nivelEducativoOpciones = [
  { value: 'Primaria',          label: 'Primaria / Bachillerato incompleto' },
  { value: 'Bachiller',         label: 'Bachiller'                          },
  { value: 'Tecnico Tecnologo', label: 'Técnico / Tecnológico'              },
  { value: 'Universitario',     label: 'Universitario / Pregrado'           },
  { value: 'Otro',              label: 'Especialización / Posgrado'         },
]
</script>

<template>
  <div>
    <div v-if="titulo" :style="{
      fontFamily:   'var(--font-display)',
      fontSize:     'var(--text-lg)',
      fontWeight:   'var(--fw-extrabold)',
      color:        'var(--color-text-1)',
      marginBottom: 'var(--sp-xl)',
    }">{{ titulo }}</div>

    <!-- Fila 1: tipo documento, número de documento y fecha expedición (3 columnas) -->
    <div :style="{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap:                 'var(--sp-lg)',
      marginBottom:        'var(--sp-lg)',
    }">
      <CampoSelectBuscable
        :model-value="modelValue[clave('tipo_documento')]"
        label="Tipo de documento"
        :opciones="tiposDocOpciones"
        required
        :disabled="bloquearDocumento"
        :error="errores[clave('tipo_documento')]"
        @update:model-value="actualizar(clave('tipo_documento'), $event)"
      />

      <CampoTexto
        :model-value="modelValue[clave('numero_identificacion')]"
        label="Número de documento"
        placeholder="Ej: 1023456789"
        required
        :maxlength="esCodeudor ? 10 : 15"
        :solo-numeros="esCodeudor"
        :disabled="bloquearDocumento"
        :helper="null"
        :error="errores[clave('numero_identificacion')]"
        @update:model-value="actualizar(clave('numero_identificacion'), $event)"
      />

      <SelectorFecha
        :model-value="modelValue[clave('fecha_expedicion_documento')]"
        label="Fecha expedición"
        required
        :error="errores[clave('fecha_expedicion_documento')]"
        :max-year="new Date().getFullYear()"
        :min-year="1950"
        @update:model-value="actualizar(clave('fecha_expedicion_documento'), $event)"
      />
    </div>

    <!-- Resto de campos en grid 2 columnas -->
    <div :style="{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      gap:                 'var(--sp-lg)',
    }">
      <!-- Nombres -->
      <CampoTexto
        :model-value="modelValue[clave('nombres')]"
        label="Nombres"
        placeholder="NOMBRES COMPLETOS"
        required
        solo-letras
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
        solo-letras
        :error="errores[clave('apellidos')]"
        @update:model-value="actualizar(clave('apellidos'), $event ? $event.toUpperCase() : $event)"
        @blur="actualizarUpper(clave('apellidos'), modelValue[clave('apellidos')])"
      />
    </div>

    <!-- Fila 3: Nivel educativo, Fecha nacimiento, Contacto (3 columnas) -->
    <div :style="{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap:                 'var(--sp-lg)',
      marginTop:           'var(--sp-lg)',
    }">
      <CampoSelectBuscable
        v-if="showNivelEducativo"
        :model-value="modelValue[clave('nivel_educativo')]"
        label="Nivel educativo"
        required
        :opciones="nivelEducativoOpciones"
        :error="errores[clave('nivel_educativo')]"
        @update:model-value="actualizar(clave('nivel_educativo'), $event)"
      />
      <div v-else />

      <SelectorFecha
        :model-value="modelValue[clave('fecha_nacimiento')]"
        label="Fecha nacimiento"
        required
        :error="errores[clave('fecha_nacimiento')]"
        :max-year="new Date().getFullYear() - 18"
        :min-year="1930"
        @update:model-value="actualizar(clave('fecha_nacimiento'), $event)"
      />

      <CampoTexto
        :model-value="modelValue[clave('celular')]"
        label="Teléfono de contacto"
        placeholder="Ej: 3101234567"
        required
        solo-numeros
        :maxlength="10"
        :error="errores[clave('celular')]"
        @update:model-value="actualizar(clave('celular'), $event)"
      />
    </div>

    <div :style="{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      gap:                 'var(--sp-lg)',
      marginTop:           'var(--sp-lg)',
    }">
      <!-- Correo electrónico -->
      <CampoTexto
        :model-value="modelValue[clave('correo_electronico')]"
        label="Correo electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        required
        :disabled="bloquearCorreo"
        :helper="null"
        :error="errores[clave('correo_electronico')]"
        @update:model-value="actualizar(clave('correo_electronico'), $event)"
      />

      <!-- Dirección residencia (al lado del correo) -->
      <div>
        <div v-if="direccionEstructurada !== null" :style="{ position: 'relative' }" @click="modalDireccionVisible = true">
          <input
            :value="textoResidencia"
            readonly
            placeholder="Diligenciar dirección"
            :style="{
              width: '100%', 
              padding: '22px 12px 6px 12px',
              height: '54px',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--text-base)', 
              fontFamily: 'var(--font-body)',
              background: 'transparent',
              color: 'var(--color-text-1)',
              textAlign: 'left',
              cursor: 'pointer', 
              outline: 'none', 
              boxSizing: 'border-box',
              transition: 'border-bottom-color var(--transition-fast), box-shadow var(--transition-fast)',
            }"
            class="direccion-trigger"
          />
          <label :style="{
            position: 'absolute', 
            left: '12px', 
            top: '4px',
            transform: 'translateY(0)',
            fontSize: '11px', 
            fontWeight: 'var(--fw-medium)',
            color: 'var(--color-text-3)',
            background: 'transparent', 
            padding: '0',
            pointerEvents: 'none', 
            whiteSpace: 'nowrap',
          }">
            Dirección residencia <span :style="{ color: 'var(--color-error)' }">*</span>
          </label>
        </div>
        <CampoTexto
          v-else
          :model-value="modelValue[clave('direccion_residencia')]"
          label="Dirección residencia"
          placeholder="Ej: Calle 45 # 23-18, Apto 301"
          required
          :error="errores[clave('direccion_residencia')]"
          @update:model-value="actualizar(clave('direccion_residencia'), $event ? $event.toUpperCase() : $event)"
        />
      </div>
    </div>

    <!-- ModalDireccion -->
    <ModalDireccion
      v-if="direccionEstructurada !== null"
      :model-value="direccionEstructurada"
      :visible="modalDireccionVisible"
      @update:model-value="actualizarDireccion($event)"
      @confirmar="actualizar(clave('direccion_residencia'), $event)"
      @update:visible="modalDireccionVisible = $event"
    />
  </div>
</template>

<style scoped>
.direccion-trigger:hover {
  border-bottom-color: var(--color-primary) !important;
  box-shadow: 0 1px 0 0 var(--color-primary);
}
</style>
