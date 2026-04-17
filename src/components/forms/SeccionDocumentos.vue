<script setup>
import { ref, computed } from 'vue'
import { IconUpload, IconCamera, IconCheck, IconX, IconFileDescription, IconLoader2 } from '@tabler/icons-vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'
import { subirDocumentoSolicitud } from '@/services/documentos.service'

const props = defineProps({
  tipoTrabajador:   { type: String, default: '' },
  modalidadCredito: { type: String, default: '' },
  solicitudId:      { type: String, default: null },
})

const emit = defineEmits([
  'completado-cedula',
  'sesion-creada',
  'url-soporte-laboral',
  'url-liquidacion-matricula',
])

// ── Helpers ────────────────────────────────────────────────
function seleccionarArchivo(refEl) { refEl?.click() }

function nombreCorto(nombre) {
  if (!nombre) return ''
  return nombre.length > 28 ? nombre.substring(0, 25) + '...' : nombre
}

// ── Subida genérica ────────────────────────────────────────
async function subirArchivo(archivo, tipo, estado, eventoEmit) {
  if (!props.solicitudId) {
    estado.error = 'La solicitud aún no está registrada. Intente de nuevo.'
    return
  }
  estado.cargando = true
  estado.error    = null
  try {
    const url = await subirDocumentoSolicitud(props.solicitudId, tipo, archivo)
    estado.url    = url
    estado.nombre = archivo.name
    emit(eventoEmit, url)
  } catch (e) {
    estado.error = 'No se pudo subir el archivo. Intente de nuevo.'
    console.error(`[SeccionDocumentos] Error subiendo ${tipo}:`, e)
  } finally {
    estado.cargando = false
  }
}

// ── Estado: soporte laboral ────────────────────────────────
const refSoporteUpload = ref(null)
const refSoporteCamera = ref(null)
const soporte = ref({ cargando: false, url: null, nombre: null, error: null })

async function onFileSoporte(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  await subirArchivo(f, 'soporte_laboral', soporte.value, 'url-soporte-laboral')
}
function quitarSoporte() {
  soporte.value = { cargando: false, url: null, nombre: null, error: null }
  emit('url-soporte-laboral', null)
}

// ── Estado: liquidación de matrícula ──────────────────────
const refMatriculaUpload = ref(null)
const refMatriculaCamera = ref(null)
const matricula = ref({ cargando: false, url: null, nombre: null, error: null })

async function onFileMatricula(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  await subirArchivo(f, 'liquidacion_matricula', matricula.value, 'url-liquidacion-matricula')
}
function quitarMatricula() {
  matricula.value = { cargando: false, url: null, nombre: null, error: null }
  emit('url-liquidacion-matricula', null)
}

// ── Info dinámica del soporte laboral ─────────────────────
const infoAdicional = computed(() => {
  switch (props.tipoTrabajador) {
    case 'empleado':
      return {
        titulo:      'Carta laboral + últimas 3 colillas de pago',
        descripcion: 'Puede adjuntar un PDF con ambos documentos o tomar fotos de cada uno.',
        accept:      '.pdf,image/*',
      }
    case 'independiente':
      return {
        titulo:      'Soporte de ingresos como independiente',
        descripcion: 'Extracto bancario, declaración de renta, contrato o cualquier documento que respalde sus ingresos.',
        accept:      '.pdf,image/*',
      }
    case 'pensionado':
      return {
        titulo:      'Últimas 3 colillas de pago',
        descripcion: 'Puede adjuntar un PDF con las 3 colillas o tomar fotos de cada una.',
        accept:      '.pdf,image/*',
      }
    case 'estudiante':
      return {
        titulo:      'Certificado de estudios vigente',
        descripcion: 'Documento expedido por la institución educativa que acredite su matrícula activa.',
        accept:      '.pdf,image/*',
      }
    default:
      return null
  }
})
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

    <!-- Título sección -->
    <div :style="{
      fontFamily: 'var(--font-display)',
      fontSize:   'var(--text-lg)',
      fontWeight: 'var(--fw-extrabold)',
      color:      'var(--color-text-1)',
    }">Cargue de documentos</div>

    <!-- ── Cédula de ciudadanía (captura QR + cámara) ─────── -->
    <CapturaDocumento
      :solicitud-id="solicitudId"
      campo="documento_identidad"
      label="Cédula de ciudadanía"
      :required="true"
      @completado="emit('completado-cedula', $event)"
      @sesion-creada="emit('sesion-creada', $event)"
    />

    <!-- ── Soporte laboral (según tipo trabajador) ─────────── -->
    <div v-if="infoAdicional" :style="{
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <!-- Header -->
      <div :style="{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-md)',
        padding:      'var(--sp-md) var(--sp-xl)',
        background:   'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-card)',
      }">
        <div :style="{
          width: '36px', height: '36px', borderRadius: '50%',
          background:     'var(--color-impulso)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     '0',
        }">
          <IconFileDescription :size="18" :style="{ color: '#fff' }" />
        </div>
        <div>
          <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
            {{ infoAdicional.titulo }}
            <span :style="{
              marginLeft:    'var(--sp-sm)',
              fontSize:      'var(--text-xs)',
              fontWeight:    'var(--fw-bold)',
              color:         'var(--color-error)',
              background:    'var(--color-error-bg)',
              padding:       '1px 8px',
              borderRadius:  'var(--r-pill)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }">Obligatorio</span>
          </div>
          <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
            {{ infoAdicional.descripcion }}
          </div>
        </div>
      </div>

      <!-- Cuerpo -->
      <div :style="{ padding: 'var(--sp-xl)', background: 'var(--color-bg-card)' }">

        <!-- Subiendo -->
        <div v-if="soporte.cargando" :style="{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
          color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
        }">
          <IconLoader2 :size="16" :style="{ animation: 'spin 1s linear infinite' }" />
          Subiendo archivo…
        </div>

        <!-- Éxito -->
        <div v-else-if="soporte.url" :style="{
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--sp-sm)',
          padding:      'var(--sp-md) var(--sp-lg)',
          borderRadius: 'var(--r-lg)',
          background:   'var(--color-success-bg)',
          border:       '1px solid var(--color-success)',
        }">
          <IconCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
          <span :style="{ fontSize: 'var(--text-base)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
            {{ nombreCorto(soporte.nombre) }}
          </span>
          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="quitarSoporte">
            <IconX :size="16" :style="{ color: 'var(--color-success-text)' }" />
          </button>
        </div>

        <!-- Error -->
        <div v-else-if="soporte.error" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)',
        }">
          <div :style="{
            padding: 'var(--sp-sm) var(--sp-lg)', borderRadius: 'var(--r-lg)',
            background: 'var(--color-error-bg)', border: '1px solid var(--color-error)',
            fontSize: 'var(--text-sm)', color: 'var(--color-error)', fontWeight: 'var(--fw-semibold)',
          }">{{ soporte.error }}</div>
          <div :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
            <button
              :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
                cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)',
              }"
              @click="seleccionarArchivo(refSoporteUpload)"
            >
              <IconUpload :size="15" />Reintentar
            </button>
          </div>
        </div>

        <!-- Default: botones de carga -->
        <div v-else :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
              cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)',
            }"
            @click="seleccionarArchivo(refSoporteUpload)"
          >
            <IconUpload :size="15" />Subir archivo
          </button>
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)',
              cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary)',
            }"
            @click="seleccionarArchivo(refSoporteCamera)"
          >
            <IconCamera :size="15" />Tomar fotos
          </button>
        </div>

        <input ref="refSoporteUpload" type="file" :accept="infoAdicional.accept" :style="{ display: 'none' }" @change="onFileSoporte" />
        <input ref="refSoporteCamera" type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onFileSoporte" />
      </div>
    </div>

    <!-- ── Liquidación de matrícula (solo crédito educativo) ── -->
    <div v-if="modalidadCredito === 'educativo'" :style="{
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <!-- Header -->
      <div :style="{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-md)',
        padding:      'var(--sp-md) var(--sp-xl)',
        background:   'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-card)',
      }">
        <div :style="{
          width: '36px', height: '36px', borderRadius: '50%',
          background:     'var(--color-primary)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     '0',
        }">
          <IconFileDescription :size="18" :style="{ color: '#fff' }" />
        </div>
        <div>
          <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
            Liquidación de matrícula
            <span :style="{
              marginLeft:    'var(--sp-sm)',
              fontSize:      'var(--text-xs)',
              fontWeight:    'var(--fw-bold)',
              color:         'var(--color-error)',
              background:    'var(--color-error-bg)',
              padding:       '1px 8px',
              borderRadius:  'var(--r-pill)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }">Obligatorio</span>
          </div>
          <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
            Documento expedido por la institución educativa con el valor de la matrícula a financiar.
          </div>
        </div>
      </div>

      <!-- Cuerpo -->
      <div :style="{ padding: 'var(--sp-xl)', background: 'var(--color-bg-card)' }">

        <!-- Subiendo -->
        <div v-if="matricula.cargando" :style="{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
          color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
        }">
          <IconLoader2 :size="16" :style="{ animation: 'spin 1s linear infinite' }" />
          Subiendo archivo…
        </div>

        <!-- Éxito -->
        <div v-else-if="matricula.url" :style="{
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--sp-sm)',
          padding:      'var(--sp-md) var(--sp-lg)',
          borderRadius: 'var(--r-lg)',
          background:   'var(--color-success-bg)',
          border:       '1px solid var(--color-success)',
        }">
          <IconCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
          <span :style="{ fontSize: 'var(--text-base)', color: 'var(--color-success-text)', fontWeight: 'var(--fw-semibold)', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
            {{ nombreCorto(matricula.nombre) }}
          </span>
          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="quitarMatricula">
            <IconX :size="16" :style="{ color: 'var(--color-success-text)' }" />
          </button>
        </div>

        <!-- Error -->
        <div v-else-if="matricula.error" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)',
        }">
          <div :style="{
            padding: 'var(--sp-sm) var(--sp-lg)', borderRadius: 'var(--r-lg)',
            background: 'var(--color-error-bg)', border: '1px solid var(--color-error)',
            fontSize: 'var(--text-sm)', color: 'var(--color-error)', fontWeight: 'var(--fw-semibold)',
          }">{{ matricula.error }}</div>
          <div :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
            <button
              :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
                cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)',
              }"
              @click="seleccionarArchivo(refMatriculaUpload)"
            >
              <IconUpload :size="15" />Reintentar
            </button>
          </div>
        </div>

        <!-- Default: botones de carga -->
        <div v-else :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
              cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-2)',
            }"
            @click="seleccionarArchivo(refMatriculaUpload)"
          >
            <IconUpload :size="15" />Subir archivo
          </button>
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-xl)', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)',
              cursor: 'pointer', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary)',
            }"
            @click="seleccionarArchivo(refMatriculaCamera)"
          >
            <IconCamera :size="15" />Tomar fotos
          </button>
        </div>

        <input ref="refMatriculaUpload" type="file" accept=".pdf,image/*" :style="{ display: 'none' }" @change="onFileMatricula" />
        <input ref="refMatriculaCamera" type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onFileMatricula" />
      </div>
    </div>

    <!-- Aviso si no hay documentos adicionales (cuidado del hogar) -->
    <div v-if="tipoTrabajador === 'cuidado_hogar'" :style="{
      padding:      'var(--sp-lg)',
      borderRadius: 'var(--r-xl)',
      background:   'var(--color-primary-light)',
      border:       '1px solid var(--color-border)',
      fontSize:     'var(--text-sm)',
      color:        'var(--color-primary)',
      fontWeight:   'var(--fw-semibold)',
    }">
      Para su tipo de actividad solo se requiere la cédula de ciudadanía.
    </div>

  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
