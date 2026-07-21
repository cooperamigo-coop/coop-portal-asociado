<script setup>
import { ref, computed } from 'vue'
import CampoTexto          from './CampoTexto.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'
import SelectorFecha       from './SelectorFecha.vue'
import ModalDireccion      from './ModalDireccion.vue'
import { TIPOS_DOCUMENTO } from '@/data/formularioCredito'
import { useBreakpoint }   from '@/composables/useBreakpoint'

const { isMobile } = useBreakpoint()

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

    <!-- ── DESKTOP ─────────────────────────────────────────────── -->
    <template v-if="!isMobile">
      <!-- Fila 1: tipo documento, número de documento y fecha expedición -->
      <div class="form-grid-3 mb-lg">
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
      <!-- Fila 2: nombres y apellidos -->
      <div class="form-grid-half">
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
      <!-- Fila 3: nivel educativo, fecha nacimiento, teléfono -->
      <div class="form-grid-3 mt-lg">
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
    </template>

    <!-- ── MÓVIL ──────────────────────────────────────────────── -->
    <template v-else>
      <!-- Tipo doc + Nro doc 70/30 -->
      <div class="form-grid-70-30 mb-lg">
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
      </div>
      <!-- Fecha expedición + Fecha nacimiento 50/50 -->
      <div class="form-grid-half mb-lg">
        <SelectorFecha
          :model-value="modelValue[clave('fecha_expedicion_documento')]"
          label="Fecha expedición"
          required
          :error="errores[clave('fecha_expedicion_documento')]"
          :max-year="new Date().getFullYear()"
          :min-year="1950"
          @update:model-value="actualizar(clave('fecha_expedicion_documento'), $event)"
        />
        <SelectorFecha
          :model-value="modelValue[clave('fecha_nacimiento')]"
          label="Fecha nacimiento"
          required
          :error="errores[clave('fecha_nacimiento')]"
          :max-year="new Date().getFullYear() - 18"
          :min-year="1930"
          @update:model-value="actualizar(clave('fecha_nacimiento'), $event)"
        />
      </div>
      <!-- Nombres + Apellidos 50/50 -->
      <div class="form-grid-half mb-lg">
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
      <!-- Nivel educativo (si aplica) -->
      <CampoSelectBuscable
        v-if="showNivelEducativo"
        :model-value="modelValue[clave('nivel_educativo')]"
        label="Nivel educativo"
        required
        :opciones="nivelEducativoOpciones"
        :error="errores[clave('nivel_educativo')]"
        class="mb-lg"
        @update:model-value="actualizar(clave('nivel_educativo'), $event)"
      />
      <!-- Teléfono -->
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
    </template>

    <div :class="isMobile ? 'form-col mt-lg' : 'form-grid-2 mt-lg'">
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
              padding: '0 16px',
              height: '48px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-input)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-body)',
              background: 'transparent',
              color: 'var(--color-text-1)',
              textAlign: 'left',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            }"
            class="direccion-trigger"
          />
          <label :style="{
            position: 'absolute',
            left: '12px',
            top: '0',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            fontWeight: 'var(--fw-regular)',
            color: 'var(--color-text-2)',
            background: 'var(--bg-label, #ffffff)',
            borderRadius: '3px',
            padding: '0 4px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }">
            Dirección residencia<span :style="{ color: 'var(--color-error)' }">*</span>
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
.form-grid-2,
.form-grid-3 {
  display: grid;
  gap: var(--sp-lg);
}

.form-grid-2 { grid-template-columns: 1fr 1fr; }
.form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

.form-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

/* 50/50 fijo en todas las pantallas, incluyendo móvil */
.form-grid-half {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}
.form-grid-half > * { min-width: 0; }

/* 70/30 para tipo documento y número */
.form-grid-70-30 {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: var(--sp-lg);
}
.form-grid-70-30 > * { min-width: 0; }

.mb-lg { margin-bottom: var(--sp-lg); }
.mt-lg { margin-top: var(--sp-lg); }

@media (max-width: 600px) {
  .form-grid-2,
  .form-grid-3,
  .form-grid-70-30 {
    grid-template-columns: 1fr;
  }
}

.direccion-trigger:hover {
  border-color: var(--color-primary) !important;
}
</style>
