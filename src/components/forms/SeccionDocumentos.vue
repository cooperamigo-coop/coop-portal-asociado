<script setup>
import { ref, computed } from 'vue'
import { IconUpload, IconCamera, IconCheck, IconX, IconFileDescription } from '@tabler/icons-vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'

const props = defineProps({
  tipoTrabajador: { type: String, default: '' },
  solicitudId:    { type: String, default: null },
})

const emit = defineEmits(['completado-cedula', 'sesion-creada'])

// ── Documento adicional ───────────────────────────────────
const adjuntoPrincipal = ref(null)
const refAdjuntoUpload = ref(null)
const refAdjuntoCamera = ref(null)

function seleccionarArchivo(refEl) { refEl?.click() }

function onFileAdjunto(e) {
  const f = e.target.files?.[0]
  if (f) adjuntoPrincipal.value = f
  e.target.value = ''
}
function quitarAdjunto() { adjuntoPrincipal.value = null }

function nombreCorto(f) {
  if (!f) return ''
  return f.name.length > 28 ? f.name.substring(0, 25) + '...' : f.name
}

const infoAdicional = computed(() => {
  switch (props.tipoTrabajador) {
    case 'empleado':
      return {
        titulo:      'Carta laboral + últimas 3 colillas de pago',
        descripcion: 'Puede adjuntar un PDF con ambos documentos o tomar fotos de cada uno.',
        accept:      '.pdf,image/*',
        requerido:   true,
      }
    case 'independiente':
      return {
        titulo:      'Soporte de ingresos como independiente',
        descripcion: 'Extracto bancario, declaración de renta, contrato o cualquier documento que respalde sus ingresos.',
        accept:      '.pdf,image/*',
        requerido:   true,
      }
    case 'pensionado':
      return {
        titulo:      'Últimas 3 colillas de pago',
        descripcion: 'Puede adjuntar un PDF con las 3 colillas o tomar fotos de cada una.',
        accept:      '.pdf,image/*',
        requerido:   true,
      }
    case 'estudiante':
      return {
        titulo:      'Certificado de estudios vigente',
        descripcion: 'Documento expedido por la institución educativa que acredite su matrícula activa.',
        accept:      '.pdf,image/*',
        requerido:   true,
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

    <!-- ── Documento adicional (según tipo trabajador) ──────── -->
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
            <span v-if="infoAdicional.requerido" :style="{
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
        <div v-if="adjuntoPrincipal" :style="{
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
            {{ nombreCorto(adjuntoPrincipal) }}
          </span>
          <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="quitarAdjunto">
            <IconX :size="16" :style="{ color: 'var(--color-success-text)' }" />
          </button>
        </div>
        <div v-else :style="{ display: 'flex', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
          <button
            :style="{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-sm)',
              padding:      'var(--sp-sm) var(--sp-xl)',
              borderRadius: 'var(--r-pill)',
              border:       '1px solid var(--color-border)',
              background:   'var(--color-bg-surface)',
              cursor:       'pointer',
              fontSize:     'var(--text-base)',
              fontFamily:   'var(--font-body)',
              fontWeight:   'var(--fw-semibold)',
              color:        'var(--color-text-2)',
            }"
            @click="seleccionarArchivo(refAdjuntoUpload)"
          >
            <IconUpload :size="15" />Subir archivo
          </button>
          <button
            :style="{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-sm)',
              padding:      'var(--sp-sm) var(--sp-xl)',
              borderRadius: 'var(--r-pill)',
              border:       '1px solid var(--color-primary)',
              background:   'var(--color-primary-light)',
              cursor:       'pointer',
              fontSize:     'var(--text-base)',
              fontFamily:   'var(--font-body)',
              fontWeight:   'var(--fw-semibold)',
              color:        'var(--color-primary)',
            }"
            @click="seleccionarArchivo(refAdjuntoCamera)"
          >
            <IconCamera :size="15" />Tomar fotos
          </button>
        </div>
        <input ref="refAdjuntoUpload" type="file" :accept="infoAdicional.accept" :style="{ display: 'none' }" @change="onFileAdjunto" />
        <input ref="refAdjuntoCamera" type="file" accept="image/*" capture="environment" :style="{ display: 'none' }" @change="onFileAdjunto" />
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
