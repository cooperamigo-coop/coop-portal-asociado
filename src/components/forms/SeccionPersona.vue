<script setup>
import { ref } from 'vue'
import CampoTexto            from './CampoTexto.vue'
import CampoSelect           from './CampoSelect.vue'
import CampoFecha            from './CampoFecha.vue'
import ModalDireccion        from './ModalDireccion.vue'
import SelectorDeptoMunicipio from './SelectorDeptoMunicipio.vue'
import PortalButton          from '@/components/ui/PortalButton.vue'
import { MapPin }            from 'lucide-vue-next'
import { TIPOS_DOCUMENTO }   from '@/data/formularioCredito'

const props = defineProps({
  modelValue:            { type: Object,  required: true },
  errores:               { type: Object,  default: () => ({}) },
  titulo:                { type: String,  required: true },
  // Bloquear doc/correo cuando vienen de la verificación previa
  bloquearDocumento:     { type: Boolean, default: false },
  bloquearCorreo:        { type: Boolean, default: false },
  // Objeto de dirección estructurada (solo para el solicitante; null = campo libre)
  direccionEstructurada: { type: Object,  default: null },
  // Ubicación de residencia (depto/municipio)
  ubicacion: {
    type: Object,
    default: () => ({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' }),
  },
  // Ubicación de expedición del documento
  ubicacionExpedicion: {
    type: Object,
    default: null,
  },
  // Mostrar selector de nivel educativo
  showNivelEducativo:    { type: Boolean, default: false },
})
const emit = defineEmits([
  'update:modelValue',
  'update:direccionEstructurada',
  'update:ubicacion',
  'update:ubicacionExpedicion',
])

const modalVisible = ref(false)

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

      <!-- Dirección: modal colombiano para solicitante, campo libre para codeudor -->
      <div :style="{ gridColumn: '1 / -1' }">
        <div v-if="direccionEstructurada !== null">
          <label :style="{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)' }">Dirección de residencia *</label>
          <div :style="{ display: 'flex', gap: 'var(--sp-sm)' }">
            <input
              :value="modelValue[clave('direccion_residencia')] || 'Sin ingresar'"
              readonly
              :style="{
                flex: '1', padding: '9px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-lg)',
                fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg-surface-alt)',
                color: modelValue[clave('direccion_residencia')] ? 'var(--color-text-1)' : 'var(--color-text-3)',
                cursor: 'pointer', outline: 'none',
              }"
              @click="modalVisible = true"
            />
            <PortalButton variant="secondary" @click="modalVisible = true">
              <MapPin :size="14" />
              {{ modelValue[clave('direccion_residencia')] ? 'Editar' : 'Ingresar' }}
            </PortalButton>
          </div>
        </div>
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

      <!-- ModalDireccion — solo para solicitante -->
      <ModalDireccion
        v-if="direccionEstructurada !== null"
        :model-value="direccionEstructurada"
        :visible="modalVisible"
        @update:model-value="actualizarDireccion($event)"
        @confirmar="actualizar(clave('direccion_residencia'), $event)"
        @update:visible="modalVisible = $event"
      />

      <!-- Ciudad y departamento via selector encadenado -->
      <div :style="{ gridColumn: '1 / -1' }">
        <SelectorDeptoMunicipio
          :model-value="ubicacion"
          :label-depto="clave('departamento') === 'departamento' ? 'Departamento de residencia' : 'Departamento'"
          :label-municipio="clave('ciudad') === 'ciudad' ? 'Municipio de residencia' : 'Municipio'"
          :required="true"
          @update:model-value="emit('update:ubicacion', $event)"
        />
      </div>

      <!-- Fecha de nacimiento -->
      <CampoFecha
        :model-value="modelValue[clave('fecha_nacimiento')]"
        label="Fecha de nacimiento"
        required
        :error="errores[clave('fecha_nacimiento')]"
        @update:model-value="actualizar(clave('fecha_nacimiento'), $event)"
      />

      <!-- Nivel educativo (solo solicitante) -->
      <CampoSelect
        v-if="showNivelEducativo"
        :model-value="modelValue.nivel_educativo_solicitante"
        label="Nivel educativo"
        required
        :opciones="[
          { value: 'ninguno',               label: 'Ninguno'                   },
          { value: 'primaria_incompleta',   label: 'Primaria incompleta'       },
          { value: 'primaria_completa',     label: 'Primaria completa'         },
          { value: 'secundaria_incompleta', label: 'Bachillerato incompleto'   },
          { value: 'secundaria_completa',   label: 'Bachillerato completo'     },
          { value: 'tecnico',               label: 'Técnico / Técnico laboral' },
          { value: 'tecnologo',             label: 'Tecnólogo'                 },
          { value: 'universitario',         label: 'Universitario / Pregrado'  },
          { value: 'especializacion',       label: 'Especialización'           },
          { value: 'maestria',              label: 'Maestría'                  },
          { value: 'doctorado',             label: 'Doctorado'                 },
        ]"
        @update:model-value="actualizar('nivel_educativo_solicitante', $event)"
      />

      <!-- Fecha expedición -->
      <CampoFecha
        :model-value="modelValue[clave('fecha_expedicion_documento')]"
        label="Fecha de expedición del documento"
        required
        :error="errores[clave('fecha_expedicion_documento')]"
        @update:model-value="actualizar(clave('fecha_expedicion_documento'), $event)"
      />

      <!-- Ciudad/municipio de expedición — selector encadenado si hay ubicacionExpedicion prop, texto libre si no -->
      <div v-if="ubicacionExpedicion !== null" :style="{ gridColumn: '1 / -1' }">
        <SelectorDeptoMunicipio
          :model-value="ubicacionExpedicion"
          label-depto="Departamento de expedición"
          label-municipio="Ciudad de expedición"
          :required="true"
          @update:model-value="emit('update:ubicacionExpedicion', $event)"
        />
      </div>
      <CampoTexto
        v-else
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
