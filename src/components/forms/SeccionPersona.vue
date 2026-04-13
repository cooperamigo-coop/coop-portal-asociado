<script setup>
import { ref, computed } from 'vue'
import CampoTexto              from './CampoTexto.vue'
import CampoSelectBuscable     from './CampoSelectBuscable.vue'
import SelectorFecha           from './SelectorFecha.vue'
import ModalDireccion          from './ModalDireccion.vue'
import ModalExpedicion         from './ModalExpedicion.vue'
import PortalButton            from '@/components/ui/PortalButton.vue'
import { IconMapPin, IconCalendar } from '@tabler/icons-vue'
import { TIPOS_DOCUMENTO }     from '@/data/formularioCredito'

const TIPOS_DOC_CODEUDOR = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]

const props = defineProps({
  modelValue:            { type: Object,  required: true },
  errores:               { type: Object,  default: () => ({}) },
  titulo:                { type: String,  required: true },
  bloquearDocumento:     { type: Boolean, default: false },
  bloquearCorreo:        { type: Boolean, default: false },
  // Objeto de dirección estructurada (modal) — null = campo libre de texto
  direccionEstructurada: { type: Object,  default: null },
  // Ubicación de residencia (depto/municipio) — viene del ModalDireccion
  ubicacion: {
    type: Object,
    default: () => ({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' }),
  },
  // Ubicación de expedición del documento
  ubicacionExpedicion: { type: Object, default: null },
  // Mostrar selector de nivel educativo
  showNivelEducativo: { type: Boolean, default: false },
  // true cuando el componente se usa para un codeudor (restringe tipos de doc)
  esCodeudor: { type: Boolean, default: false },
})
const emit = defineEmits([
  'update:modelValue',
  'update:direccionEstructurada',
  'update:ubicacion',
  'update:ubicacionExpedicion',
])

const modalDireccionVisible  = ref(false)
const modalExpedicionVisible = ref(false)

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

// Detecta si los campos son del codeudor (sufijo _codeudor o _codeudor2)
function clave(base) {
  const conSufijo = base + '_codeudor'
  return conSufijo in props.modelValue ? conSufijo : base
}

function actualizarUpper(campo, valor) {
  actualizar(campo, valor ? valor.toUpperCase() : valor)
}

// ── Texto de dirección con ubicación ────────────────────────────────────────
const textoResidencia = computed(() => {
  const dir   = props.modelValue[clave('direccion_residencia')] || ''
  const depto = props.ubicacion?.depto_nombre     || ''
  const muni  = props.ubicacion?.municipio_nombre || ''
  const partes = [dir, depto && muni ? `${depto}, ${muni}` : (depto || muni)].filter(Boolean)
  return partes.join(' · ')
})

// ── Texto de expedición ──────────────────────────────────────────────────────
const fechaExpedicionDisplay = computed(() => {
  const fecha = props.modelValue[clave('fecha_expedicion_documento')] || ''
  const depto = props.ubicacionExpedicion?.depto_nombre     || ''
  const muni  = props.ubicacionExpedicion?.municipio_nombre || ''
  if (!fecha && !depto) return ''
  let fechaFmt = fecha
  if (fecha && fecha.includes('-')) {
    const [y, m, d] = fecha.split('-')
    fechaFmt = `${d}/${m}/${y}`
  }
  const lugar = depto && muni ? `${depto}, ${muni}` : (depto || muni)
  return [fechaFmt, lugar].filter(Boolean).join(' — ')
})

function onConfirmarExpedicion(nuevaFecha, nuevaUbicacion) {
  actualizar(clave('fecha_expedicion_documento'), nuevaFecha)
  emit('update:ubicacionExpedicion', nuevaUbicacion)
}

const nivelEducativoOpciones = [
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
]
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
      <CampoSelectBuscable
        :model-value="modelValue[clave('tipo_documento')]"
        label="Tipo de documento"
        :opciones="tiposDocOpciones"
        required
        :disabled="bloquearDocumento"
        :error="errores[clave('tipo_documento')]"
        @update:model-value="actualizar(clave('tipo_documento'), $event)"
      />

      <!-- Número de identificación -->
      <CampoTexto
        :model-value="modelValue[clave('numero_identificacion')]"
        label="Número de documento"
        placeholder="Ej: 1023456789"
        required
        :disabled="bloquearDocumento"
        :helper="null"
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

      <!-- Nivel educativo — ancho completo, solo solicitante -->
      <CampoSelectBuscable
        v-if="showNivelEducativo"
        :model-value="modelValue.nivel_educativo_solicitante"
        label="Nivel educativo"
        required
        :opciones="nivelEducativoOpciones"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar('nivel_educativo_solicitante', $event)"
      />

      <!-- Correo electrónico — ancho completo -->
      <CampoTexto
        :model-value="modelValue[clave('correo_electronico')]"
        label="Correo electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        required
        :disabled="bloquearCorreo"
        :helper="null"
        :error="errores[clave('correo_electronico')]"
        :style="{ gridColumn: '1 / -1' }"
        @update:model-value="actualizar(clave('correo_electronico'), $event)"
      />

      <!-- Fecha de nacimiento -->
      <SelectorFecha
        :model-value="modelValue[clave('fecha_nacimiento')]"
        label="Fecha de nacimiento"
        required
        :error="errores[clave('fecha_nacimiento')]"
        :max-year="new Date().getFullYear() - 18"
        :min-year="1930"
        @update:model-value="actualizar(clave('fecha_nacimiento'), $event)"
      />

      <!-- Columna vacía para mantener el grid par -->
      <div v-if="!showNivelEducativo" />

      <!-- Dirección de residencia (modal colombiano o campo libre) -->
      <div :style="{ gridColumn: '1 / -1' }">
        <div v-if="direccionEstructurada !== null">
          <label :style="{
            display: 'block', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)',
            marginBottom: 'var(--sp-xs)',
          }">Dirección de residencia *</label>
          <input
            :value="textoResidencia || 'Sin ingresar'"
            readonly
            :style="{
              width: '100%', padding: '9px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-lg)',
              fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              background: 'var(--color-bg-surface-alt)',
              color: textoResidencia ? 'var(--color-text-1)' : 'var(--color-text-3)',
              cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
            }"
            @click="modalDireccionVisible = true"
          />
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

      <!-- ModalDireccion -->
      <ModalDireccion
        v-if="direccionEstructurada !== null"
        :model-value="direccionEstructurada"
        :visible="modalDireccionVisible"
        @update:model-value="actualizarDireccion($event)"
        @confirmar="actualizar(clave('direccion_residencia'), $event)"
        @update:visible="modalDireccionVisible = $event"
      />

      <!-- Fecha + lugar de expedición — campo display + modal -->
      <div :style="{ gridColumn: '1 / -1' }">
        <div v-if="ubicacionExpedicion !== null">
          <label :style="{
            display: 'block', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)',
            marginBottom: 'var(--sp-xs)',
          }">Fecha y lugar de expedición *</label>
          <input
            :value="fechaExpedicionDisplay || 'Sin ingresar'"
            readonly
            :style="{
              width: '100%', padding: '9px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-lg)',
              fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              background: 'var(--color-bg-surface-alt)',
              color: fechaExpedicionDisplay ? 'var(--color-text-1)' : 'var(--color-text-3)',
              cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
            }"
            @click="modalExpedicionVisible = true"
          />
        </div>

        <!-- Fallback: campos separados si no hay ubicacionExpedicion -->
        <template v-else>
          <SelectorFecha
            :model-value="modelValue[clave('fecha_expedicion_documento')]"
            label="Fecha de expedición del documento"
            required
            :error="errores[clave('fecha_expedicion_documento')]"
            :max-year="new Date().getFullYear()"
            :min-year="1950"
            @update:model-value="actualizar(clave('fecha_expedicion_documento'), $event)"
          />
          <div :style="{ marginTop: 'var(--sp-lg)' }">
            <CampoTexto
              :model-value="modelValue[clave('ciudad_expedicion')]"
              label="Ciudad de expedición"
              placeholder="BOGOTÁ"
              required
              :error="errores[clave('ciudad_expedicion')]"
              @update:model-value="actualizar(clave('ciudad_expedicion'), $event ? $event.toUpperCase() : $event)"
            />
          </div>
        </template>
      </div>

      <!-- ModalExpedicion -->
      <ModalExpedicion
        v-if="ubicacionExpedicion !== null"
        :visible="modalExpedicionVisible"
        :fecha="modelValue[clave('fecha_expedicion_documento')]"
        :ubicacion="ubicacionExpedicion"
        @update:visible="modalExpedicionVisible = $event"
        @update:fecha="actualizar(clave('fecha_expedicion_documento'), $event)"
        @update:ubicacion="emit('update:ubicacionExpedicion', $event)"
      />
    </div>
  </div>
</template>
