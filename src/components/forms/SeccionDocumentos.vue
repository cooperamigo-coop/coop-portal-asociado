<script setup>
import { ref, computed } from 'vue'
import { IconUpload, IconCheck, IconX, IconFileDescription, IconLoader2, IconRefresh } from '@tabler/icons-vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'
import { subirDocumentoSolicitud } from '@/services/documentos.service'

const props = defineProps({
  solicitudId:      { type: String, default: null },
  tipoTrabajador:   { type: String, default: '' },
  modalidadCredito: { type: String, default: '' },
  numCodeudores:    { type: Number, default: 0 },
  laboralCod1:      { type: Object, default: () => ({}) },
  laboralCod2:      { type: Object, default: () => ({}) },
  modelValue:       { type: Object, default: () => ({}) },
  titulo:           { type: String, default: 'Cargue de documentos' },
})

const emit = defineEmits([
  'update:modelValue',
  'sesion-creada',
])

// ── Helpers ────────────────────────────────────────────────
function seleccionarArchivo(refEl) { refEl?.click() }

function nombreCorto(nombre) {
  if (!nombre) return ''
  return nombre.length > 28 ? nombre.substring(0, 25) + '...' : nombre
}

// ── Estado de subidas (para banners PDF) ────────────────────
const estados = ref({}) // { campo: { cargando, url, nombre, error } }

function getEstado(campo) {
  if (!estados.value[campo]) {
    estados.value[campo] = { cargando: false, url: props.modelValue[campo] || null, nombre: null, error: null }
  }
  return estados.value[campo]
}

async function onFilePdf(e, campo) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return

  const est = getEstado(campo)
  if (!props.solicitudId) {
    est.error = 'La solicitud aún no está registrada.'
    return
  }

  est.cargando = true
  est.error    = null
  try {
    const url = await subirDocumentoSolicitud(props.solicitudId, campo, f)
    est.url    = url
    est.nombre = f.name
    emit('update:modelValue', { ...props.modelValue, [campo]: url })
  } catch (e) {
    est.error = 'No se pudo subir el archivo.'
    console.error(`[SeccionDocumentos] Error subiendo ${campo}:`, e)
  } finally {
    est.cargando = false
  }
}

function quitarArchivo(campo) {
  const est = getEstado(campo)
  est.url    = null
  est.nombre = null
  emit('update:modelValue', { ...props.modelValue, [campo]: '' })
}

// ── Documentos adicionales por tipo de trabajador ──────────
const docsAdicionales = computed(() => {
  const items = []

  // 1. Solicitante
  if (props.tipoTrabajador === 'empleado') {
    items.push({
      campo: 'doc_carta_laboral_solicitante_url',
      titulo: 'Carta laboral (Titular)',
      descripcion: 'Cargue la carta laboral vigente en formato PDF.',
    })
    items.push({
      campo: 'doc_colillas_pago_solicitante_url',
      titulo: 'Colillas de pago (Titular)',
      descripcion: 'Cargue las colillas de pago en un solo PDF.',
    })
  } else if (props.tipoTrabajador && props.tipoTrabajador !== 'cuidado_hogar') {
    const label = {
      'independiente': 'Certificado de ingresos',
      'pensionado':   'Últimas 2 colillas de pago',
      'estudiante':   'Certificado académico',
    }[props.tipoTrabajador] || 'Soporte de ingresos'

    items.push({
      campo: 'doc_soporte_ingresos_solicitante_url',
      titulo: `${label} (Titular)`,
      descripcion: `Cargue su ${label.toLowerCase()} en formato PDF.`,
    })
  }

  // Crédito educativo
  if (props.modalidadCredito === 'educativo') {
    items.push({
      campo: 'doc_liquidacion_matricula_url',
      titulo: 'Liquidación de matrícula',
      descripcion: 'Cargue el documento con el valor de la matrícula en PDF.',
    })
  }

  // 2. Codeudores
  const getDocCodeudor = (tipo) => {
    return {
      'empleado':      { label: 'Carta laboral', desc: 'Carta laboral vigente' },
      'independiente': { label: 'Certificado de ingresos', desc: 'Certificado de ingresos' },
      'pensionado':    { label: 'Últimas 2 colillas de pago', desc: 'Colillas de pago' },
      'estudiante':    { label: 'Certificado académico', desc: 'Certificado de estudios' },
      'cuidado_hogar': { label: 'Extractos bancarios', desc: 'Extractos bancarios de los últimos meses' },
    }[tipo] || null
  }

  if (props.numCodeudores >= 1 && props.laboralCod1?.tipo_trabajador_codeudor) {
    const info = getDocCodeudor(props.laboralCod1.tipo_trabajador_codeudor)
    if (info) {
      items.push({
        campo: 'doc_soporte_laboral_codeudor_url',
        titulo: `${info.label} (Codeudor 1)`,
        descripcion: `Cargue el ${info.desc.toLowerCase()} del primer codeudor en PDF.`,
      })
    }
  }

  if (props.numCodeudores >= 2 && props.laboralCod2?.tipo_trabajador_codeudor2) {
    const info = getDocCodeudor(props.laboralCod2.tipo_trabajador_codeudor2)
    if (info) {
      items.push({
        campo: 'doc_soporte_laboral_codeudor2_url',
        titulo: `${info.label} (Codeudor 2)`,
        descripcion: `Cargue el ${info.desc.toLowerCase()} del segundo codeudor en PDF.`,
      })
    }
  }

  return items
})
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

    <!-- Título sección -->
    <div v-if="titulo" :style="{
      fontFamily: 'var(--font-display)',
      fontSize:   'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color:      'var(--color-text-1)',
    }">{{ titulo }}</div>

    <!-- ── CÉDULAS ────────────────────────────────────────── -->
    <div :style="{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-lg)',
    }">
      <CapturaDocumento
        :solicitud-id="solicitudId"
        campo="doc_cedula_solicitante_url"
        label="Cédula del Titular"
        :required="true"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_solicitante_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />

      <CapturaDocumento
        v-if="numCodeudores >= 1"
        :solicitud-id="solicitudId"
        campo="doc_cedula_codeudor_url"
        label="Cédula del Codeudor 1"
        :required="true"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_codeudor_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />

      <CapturaDocumento
        v-if="numCodeudores >= 2"
        :solicitud-id="solicitudId"
        campo="doc_cedula_codeudor2_url"
        label="Cédula del Codeudor 2"
        :required="true"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_codeudor2_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />
    </div>

    <!-- ── OTROS DOCUMENTOS (PDF ÚNICAMENTE) ───────────────── -->
    <div v-for="doc in docsAdicionales" :key="doc.campo" :style="{
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <!-- Banner Compacto -->
      <div :style="{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-md)',
        padding:      'var(--sp-md) var(--sp-xl)',
        background:   getEstado(doc.campo).url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
      }">
        <div :style="{
          width: '36px', height: '36px', borderRadius: '50%',
          background:     getEstado(doc.campo).url ? 'var(--color-success)' : 'var(--color-impulso)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     '0',
        }">
          <IconCheck v-if="getEstado(doc.campo).url" :size="18" :style="{ color: '#fff' }" />
          <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
        </div>
        
        <div :style="{ flex: '1', minWidth: '0' }">
          <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
            {{ doc.titulo }}
            <span v-if="!getEstado(doc.campo).url" :style="{ marginLeft: 'var(--sp-sm)', fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 6px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase' }">Obligatorio</span>
          </div>
          <div :style="{ fontSize: 'var(--text-sm)', color: getEstado(doc.campo).url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
            {{ getEstado(doc.campo).url ? (getEstado(doc.campo).nombre || 'Documento cargado correctamente') : doc.descripcion }}
          </div>
        </div>

        <!-- Acciones -->
        <div v-if="getEstado(doc.campo).cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
          <IconLoader2 :size="16" class="spin" />
        </div>

        <div v-else-if="getEstado(doc.campo).url" :style="{ flexShrink: '0' }">
          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarArchivo(doc.campo)">
            <IconRefresh :size="16" />
          </button>
        </div>

        <div v-else :style="{ flexShrink: '0' }">
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
              padding: '6px 14px', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--color-border)', background: 'white',
              cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
            }"
            @click="seleccionarArchivo($refs[`ref_${doc.campo}`]?.[0])"
          >
            <IconUpload :size="14" />Subir PDF
          </button>
          <input :ref="`ref_${doc.campo}`" type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFilePdf($event, doc.campo)" />
        </div>
      </div>

      <!-- Error (si existe) -->
      <div v-if="getEstado(doc.campo).error" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
        {{ getEstado(doc.campo).error }}
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
