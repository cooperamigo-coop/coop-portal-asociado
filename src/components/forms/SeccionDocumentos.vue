<script setup>
import { ref, computed, watch } from 'vue'
import { IconUpload, IconCircleCheck, IconX, IconFileDescription, IconLoader2, IconRefresh, IconEye, IconUser, IconUsers } from '@tabler/icons-vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'
import { subirDocumentoSolicitud, obtenerMensajeErrorSubidaDocumento } from '@/services/documentos.service'

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
  'update:documentosCompletos',
])

// ── Helpers ────────────────────────────────────────────────
function seleccionarArchivo(refEl) { refEl?.click() }

function nombreCorto(nombre) {
  if (!nombre) return ''
  return nombre.length > 28 ? nombre.substring(0, 25) + '...' : nombre
}

// ── Estado de subidas (para banners PDF) ────────────────────
const estados = ref({})
const modalPreviewVisible = ref(false)
const modalPreviewUrl = ref('')
const modalPreviewTitulo = ref('')

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
    est.error = obtenerMensajeErrorSubidaDocumento(e)
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

function abrirPreview(url, titulo) {
  if (!url) return
  modalPreviewUrl.value = url
  modalPreviewTitulo.value = titulo || 'Documento'
  modalPreviewVisible.value = true
}

function cerrarPreview() {
  modalPreviewVisible.value = false
  modalPreviewUrl.value = ''
  modalPreviewTitulo.value = ''
}

// ── Docs adicionales por grupo ─────────────────────────────
const getDocCodeudor = (tipo) => {
  return {
    'empleado':      { label: 'Carta laboral', desc: 'Carta laboral vigente' },
    'independiente': { label: 'Certificado de ingresos', desc: 'Certificado de ingresos' },
    'pensionado':    { label: 'Últimas 2 colillas de pago', desc: 'Colillas de pago' },
    'estudiante':    { label: 'Certificado académico', desc: 'Certificado de estudios' },
    'cuidado_hogar': { label: 'Extractos bancarios', desc: 'Extractos bancarios de los últimos meses' },
  }[tipo] || null
}

const docsAdicionalesTitular = computed(() => {
  const items = []
  if (props.tipoTrabajador === 'empleado') {
    items.push({
      campo: 'doc_carta_laboral_solicitante_url',
      titulo: 'Carta laboral',
      descripcion: 'Cargue la carta laboral vigente en formato PDF',
    })
    items.push({
      campo: 'doc_colillas_pago_solicitante_url',
      titulo: 'Últimas 3 colillas de pago',
      descripcion: 'Cargue las últimas 3 colillas de pago en un solo PDF',
    })
  } else if (props.tipoTrabajador && props.tipoTrabajador !== 'cuidado_hogar') {
    const label = {
      'independiente': 'Certificado de ingresos',
      'pensionado':    'Últimas 2 colillas de pago',
      'estudiante':    'Certificado académico',
    }[props.tipoTrabajador] || 'Soporte de ingresos'
    items.push({
      campo: 'doc_soporte_ingresos_solicitante_url',
      titulo: label,
      descripcion: `Cargue su ${label.toLowerCase()} en formato PDF`,
    })
  }
  if (props.modalidadCredito === 'educativo') {
    items.push({
      campo: 'doc_liquidacion_matricula_url',
      titulo: 'Liquidación de matrícula',
      descripcion: 'Cargue el documento de matrícula oficial expedido por la institución',
    })
  }
  return items
})

const docsAdicionalesCod1 = computed(() => {
  if (props.numCodeudores < 1 || !props.laboralCod1?.tipo_trabajador_codeudor) return []
  const info = getDocCodeudor(props.laboralCod1.tipo_trabajador_codeudor)
  if (!info) return []
  return [{
    campo: 'doc_soporte_laboral_codeudor_url',
    titulo: info.label,
    descripcion: `Cargue el ${info.desc.toLowerCase()} del primer codeudor en PDF.`,
  }]
})

const docsAdicionalesCod2 = computed(() => {
  if (props.numCodeudores < 2 || !props.laboralCod2?.tipo_trabajador_codeudor2) return []
  const info = getDocCodeudor(props.laboralCod2.tipo_trabajador_codeudor2)
  if (!info) return []
  return [{
    campo: 'doc_soporte_laboral_codeudor2_url',
    titulo: info.label,
    descripcion: `Cargue el ${info.desc.toLowerCase()} del segundo codeudor en PDF.`,
  }]
})

// ── Validación documentos obligatorios ─────────────────────
const todosObligatoriosCompletos = computed(() => {
  // Cédula titular
  if (!props.modelValue.doc_cedula_solicitante_url) return false
  // Docs adicionales titular (carta laboral, colillas, etc.)
  for (const doc of docsAdicionalesTitular.value) {
    if (!props.modelValue[doc.campo]) return false
  }
  // Codeudor 1
  if (props.numCodeudores >= 1) {
    if (!props.modelValue.doc_cedula_codeudor_url) return false
    for (const doc of docsAdicionalesCod1.value) {
      if (!props.modelValue[doc.campo]) return false
    }
  }
  // Codeudor 2
  if (props.numCodeudores >= 2) {
    if (!props.modelValue.doc_cedula_codeudor2_url) return false
    for (const doc of docsAdicionalesCod2.value) {
      if (!props.modelValue[doc.campo]) return false
    }
  }
  return true
})

watch(todosObligatoriosCompletos, (val) => emit('update:documentosCompletos', val), { immediate: true })
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2xl)' }">

    <!-- Título sección -->
    <div v-if="titulo" :style="{
      fontFamily: 'var(--font-display)',
      fontSize:   'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color:      'var(--color-text-1)',
    }">{{ titulo }}</div>

    <!-- ══ TITULAR ══════════════════════════════════════════ -->
    <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

      <!-- Encabezado grupo -->
      <div :style="{
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--sp-sm)',
        paddingBottom: 'var(--sp-sm)',
        borderBottom: '2px solid var(--color-primary)',
      }">
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: '0',
        }">
          <IconUser :size="14" :style="{ color: 'var(--color-text-on-primary)' }" />
        </div>
        <span :style="{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-base)',
          fontWeight: 'var(--fw-extrabold)',
          color:      'var(--color-primary)',
        }">Documentos del titular</span>
      </div>

      <!-- Cédula del titular -->
      <CapturaDocumento
        :solicitud-id="solicitudId"
        campo="doc_cedula_solicitante_url"
        label="Cédula del titular"
        :required="true"
        :initial-url="modelValue.doc_cedula_solicitante_url"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_solicitante_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />

      <!-- Docs adicionales del titular -->
      <template v-for="doc in docsAdicionalesTitular" :key="doc.campo">
        <div :style="{
          border:       '1px solid var(--color-border-card)',
          borderRadius: 'var(--r-lg)',
          overflow:     'hidden',
        }">
          <div :style="{
            display:    'flex', alignItems: 'center', gap: 'var(--sp-md)',
            padding:    'var(--sp-md) var(--sp-xl)',
            background: getEstado(doc.campo).url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
          }">
            <div :style="{
              width: '36px', height: '36px', borderRadius: '50%',
              background:     getEstado(doc.campo).url ? 'var(--color-success)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
            }">
              <IconCircleCheck v-if="getEstado(doc.campo).url" :size="18" :style="{ color: '#fff' }" />
              <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
            </div>
            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                {{ doc.titulo }}
                <span v-if="!getEstado(doc.campo).url" :style="{ marginLeft: 'var(--sp-sm)', fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 6px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase' }">Obligatorio</span>
              </div>
              <div :style="{ fontSize: 'var(--text-sm)', color: getEstado(doc.campo).url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                {{ getEstado(doc.campo).url ? 'Documento cargado correctamente' : doc.descripcion }}
              </div>
            </div>
            <div v-if="getEstado(doc.campo).cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
              <IconLoader2 :size="16" class="spin" />
            </div>
            <div v-else-if="getEstado(doc.campo).url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
              <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirPreview(getEstado(doc.campo).url, doc.titulo)">
                <IconEye :size="13" /> Visualizar
              </button>
              <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarArchivo(doc.campo)">
                <IconRefresh :size="16" />
              </button>
            </div>
            <div v-else :style="{ flexShrink: '0' }">
              <button :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
                padding: '6px 14px', borderRadius: 'var(--r-pill)',
                border: '1px solid var(--color-border)', background: 'white',
                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
              }" @click="seleccionarArchivo($refs[`ref_${doc.campo}`]?.[0])">
                <IconUpload :size="14" />Subir PDF
              </button>
              <input :ref="`ref_${doc.campo}`" type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFilePdf($event, doc.campo)" />
            </div>
          </div>
          <div v-if="getEstado(doc.campo).error" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
            {{ getEstado(doc.campo).error }}
          </div>
        </div>
      </template>
    </div>

    <!-- ══ CODEUDOR 1 ════════════════════════════════════════ -->
    <div v-if="numCodeudores >= 1" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

      <div :style="{
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--sp-sm)',
        paddingBottom: 'var(--sp-sm)',
        borderBottom: '2px solid var(--color-accent)',
      }">
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: '0',
        }">
          <IconUsers :size="14" :style="{ color: 'var(--color-dark)' }" />
        </div>
        <span :style="{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-base)',
          fontWeight: 'var(--fw-extrabold)',
          color:      'var(--color-text-1)',
        }">Codeudor 1</span>
      </div>

      <CapturaDocumento
        :solicitud-id="solicitudId"
        campo="doc_cedula_codeudor_url"
        label="Cédula del Codeudor 1"
        :required="true"
        :initial-url="modelValue.doc_cedula_codeudor_url"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_codeudor_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />

      <template v-for="doc in docsAdicionalesCod1" :key="doc.campo">
        <div :style="{
          border:       '1px solid var(--color-border-card)',
          borderRadius: 'var(--r-lg)',
          overflow:     'hidden',
        }">
          <div :style="{
            display:    'flex', alignItems: 'center', gap: 'var(--sp-md)',
            padding:    'var(--sp-md) var(--sp-xl)',
            background: getEstado(doc.campo).url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
          }">
            <div :style="{
              width: '36px', height: '36px', borderRadius: '50%',
              background:     getEstado(doc.campo).url ? 'var(--color-success)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
            }">
              <IconCircleCheck v-if="getEstado(doc.campo).url" :size="18" :style="{ color: '#fff' }" />
              <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
            </div>
            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                {{ doc.titulo }}
                <span v-if="!getEstado(doc.campo).url" :style="{ marginLeft: 'var(--sp-sm)', fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 6px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase' }">Obligatorio</span>
              </div>
              <div :style="{ fontSize: 'var(--text-sm)', color: getEstado(doc.campo).url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                {{ getEstado(doc.campo).url ? 'Documento cargado correctamente' : doc.descripcion }}
              </div>
            </div>
            <div v-if="getEstado(doc.campo).cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
              <IconLoader2 :size="16" class="spin" />
            </div>
            <div v-else-if="getEstado(doc.campo).url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
              <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirPreview(getEstado(doc.campo).url, doc.titulo)">
                <IconEye :size="13" /> Visualizar
              </button>
              <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarArchivo(doc.campo)">
                <IconRefresh :size="16" />
              </button>
            </div>
            <div v-else :style="{ flexShrink: '0' }">
              <button :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
                padding: '6px 14px', borderRadius: 'var(--r-pill)',
                border: '1px solid var(--color-border)', background: 'white',
                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
              }" @click="seleccionarArchivo($refs[`ref_${doc.campo}`]?.[0])">
                <IconUpload :size="14" />Subir PDF
              </button>
              <input :ref="`ref_${doc.campo}`" type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFilePdf($event, doc.campo)" />
            </div>
          </div>
          <div v-if="getEstado(doc.campo).error" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
            {{ getEstado(doc.campo).error }}
          </div>
        </div>
      </template>
    </div>

    <!-- ══ CODEUDOR 2 ════════════════════════════════════════ -->
    <div v-if="numCodeudores >= 2" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

      <div :style="{
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--sp-sm)',
        paddingBottom: 'var(--sp-sm)',
        borderBottom: '2px solid var(--color-impulso)',
      }">
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-impulso)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: '0',
        }">
          <IconUsers :size="14" :style="{ color: 'var(--color-text-on-primary)' }" />
        </div>
        <span :style="{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-base)',
          fontWeight: 'var(--fw-extrabold)',
          color:      'var(--color-text-1)',
        }">Codeudor 2</span>
      </div>

      <CapturaDocumento
        :solicitud-id="solicitudId"
        campo="doc_cedula_codeudor2_url"
        label="Cédula del Codeudor 2"
        :required="true"
        :initial-url="modelValue.doc_cedula_codeudor2_url"
        @completado="emit('update:modelValue', { ...modelValue, doc_cedula_codeudor2_url: $event })"
        @sesion-creada="emit('sesion-creada', $event)"
      />

      <template v-for="doc in docsAdicionalesCod2" :key="doc.campo">
        <div :style="{
          border:       '1px solid var(--color-border-card)',
          borderRadius: 'var(--r-lg)',
          overflow:     'hidden',
        }">
          <div :style="{
            display:    'flex', alignItems: 'center', gap: 'var(--sp-md)',
            padding:    'var(--sp-md) var(--sp-xl)',
            background: getEstado(doc.campo).url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
          }">
            <div :style="{
              width: '36px', height: '36px', borderRadius: '50%',
              background:     getEstado(doc.campo).url ? 'var(--color-success)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
            }">
              <IconCircleCheck v-if="getEstado(doc.campo).url" :size="18" :style="{ color: '#fff' }" />
              <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
            </div>
            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                {{ doc.titulo }}
                <span v-if="!getEstado(doc.campo).url" :style="{ marginLeft: 'var(--sp-sm)', fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '1px 6px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase' }">Obligatorio</span>
              </div>
              <div :style="{ fontSize: 'var(--text-sm)', color: getEstado(doc.campo).url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                {{ getEstado(doc.campo).url ? 'Documento cargado correctamente' : doc.descripcion }}
              </div>
            </div>
            <div v-if="getEstado(doc.campo).cargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
              <IconLoader2 :size="16" class="spin" />
            </div>
            <div v-else-if="getEstado(doc.campo).url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
              <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirPreview(getEstado(doc.campo).url, doc.titulo)">
                <IconEye :size="13" /> Visualizar
              </button>
              <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarArchivo(doc.campo)">
                <IconRefresh :size="16" />
              </button>
            </div>
            <div v-else :style="{ flexShrink: '0' }">
              <button :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
                padding: '6px 14px', borderRadius: 'var(--r-pill)',
                border: '1px solid var(--color-border)', background: 'white',
                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
              }" @click="seleccionarArchivo($refs[`ref_${doc.campo}`]?.[0])">
                <IconUpload :size="14" />Subir PDF
              </button>
              <input :ref="`ref_${doc.campo}`" type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFilePdf($event, doc.campo)" />
            </div>
          </div>
          <div v-if="getEstado(doc.campo).error" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
            {{ getEstado(doc.campo).error }}
          </div>
        </div>
      </template>
    </div>

    <!-- Modal preview -->
    <Teleport to="body">
      <div v-if="modalPreviewVisible" :style="{ position: 'fixed', inset: '0', zIndex: '1000', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(980px, 96vw)', height: 'min(86vh, 920px)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-lg) var(--sp-xl)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ modalPreviewTitulo }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarPreview">
              <IconX :size="20" />
            </button>
          </div>
          <iframe :src="modalPreviewUrl" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
