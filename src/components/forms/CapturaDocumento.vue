<script setup>
import { watch } from 'vue'
import { useCapturaDocumento } from '@/composables/useCapturaDocumento.js'
import {
  IconCamera, IconUpload, IconQrcode, IconCircleCheck,
  IconRefresh, IconDeviceMobile, IconX, IconAlertCircle, IconClock,
} from '@tabler/icons-vue'

const props = defineProps({
  solicitudId: { type: String, default: null },
  campo:       { type: String, default: 'documento_identidad' },
  label:       { type: String, default: 'Documento de identidad' },
  required:    { type: Boolean, default: false },
  error:       { type: String, default: null },
})
const emit = defineEmits(['completado', 'sesion-creada'])

const {
  esMovil, estado, urlFrente, urlReverso,
  qrDataUrl, urlCaptura, sesionId, token,
  error: errorCaptura,
  progreso, crearSesionQR, subirFotoLocal, cancelar,
} = useCapturaDocumento()

// Notificar al padre cuando ambas fotos están listas
watch([urlFrente, urlReverso], ([f, r]) => {
  if (f && r) emit('completado', { frente: f, reverso: r })
})

function onArchivoSeleccionado(lado, e) {
  const archivo = e.target.files?.[0]
  if (archivo) subirFotoLocal(lado, archivo)
  e.target.value = ''
}

async function iniciarQR() {
  await crearSesionQR(props.solicitudId, props.campo)
  // Notificar al padre con el token para que pueda vincularlo cuando se guarde la solicitud
  if (token.value) {
    emit('sesion-creada', { token: token.value, sesionId: sesionId.value })
  }
}

function copiarLink() {
  navigator.clipboard?.writeText(urlCaptura.value)
}

const LADOS = [
  { key: 'frente',  label: 'Frente' },
  { key: 'reverso', label: 'Reverso' },
]
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">

    <!-- Label -->
    <label :style="{
      fontSize:   'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color:      error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      {{ label }}
      <span v-if="required" :style="{ color: 'var(--color-error)' }"> *</span>
    </label>

    <!-- ══ COMPLETADO ══════════════════════════════════════════════ -->
    <div v-if="(urlFrente && urlReverso)" :style="{
      border:       '2px solid var(--color-success)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <div :style="{
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--sp-sm)',
        padding:     'var(--sp-md) var(--sp-lg)',
        background:  'var(--color-success-bg)',
      }">
        <IconCircleCheck :size="18" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
        <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-success-text)', fontSize: 'var(--text-base)', flex: '1' }">
          Documento capturado correctamente
        </span>
        <button
          :style="{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', display: 'flex', padding: 'var(--sp-xs)' }"
          @click="cancelar"
        >
          <IconRefresh :size="14" />
        </button>
      </div>

      <!-- Miniaturas -->
      <div :style="{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 'var(--sp-sm)',
        padding:             'var(--sp-md)',
        background:          'var(--color-bg-surface)',
      }">
        <div v-for="lado in LADOS" :key="lado.key">
          <div :style="{
            fontSize:     'var(--text-xs)',
            fontWeight:   'var(--fw-bold)',
            color:        'var(--color-text-3)',
            textTransform:'uppercase',
            letterSpacing:'0.06em',
            marginBottom: 'var(--sp-xs)',
          }">{{ lado.label }}</div>
          <img
            :src="lado.key === 'frente' ? urlFrente : urlReverso"
            :alt="lado.label"
            :style="{
              width:        '100%',
              borderRadius: 'var(--r-lg)',
              border:       '1px solid var(--color-border)',
              aspectRatio:  '3/2',
              objectFit:    'cover',
              display:      'block',
            }"
          />
        </div>
      </div>
    </div>

    <!-- ══ IDLE — seleccionar método ══════════════════════════════ -->
    <div v-else-if="estado === 'idle'" :style="{
      border:       '1px solid var(--color-border)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <!-- Instrucción -->
      <div :style="{
        padding:      'var(--sp-md) var(--sp-lg)',
        background:   'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-light)',
        fontSize:     'var(--text-sm)',
        color:        'var(--color-text-2)',
        fontWeight:   'var(--fw-medium)',
        lineHeight:   '1.6',
      }">
        Necesitamos una foto de la cédula por ambas caras. Asegúrese de que sea legible y sin reflejos.
      </div>

      <div :style="{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">

        <!-- MÓVIL: botones de cámara directa -->
        <template v-if="esMovil">
          <div :style="{
            fontSize:      'var(--text-xs)',
            fontWeight:    'var(--fw-semibold)',
            color:         'var(--color-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display:       'flex',
            alignItems:    'center',
            gap:           'var(--sp-xs)',
          }">
            <IconCamera :size="12" /> Tomar foto con la cámara
          </div>

          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }">
            <label
              v-for="lado in LADOS"
              :key="lado.key"
              :style="{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            'var(--sp-sm)',
                padding:        'var(--sp-xl)',
                border:         `2px dashed var(--color-border)`,
                borderRadius:   'var(--r-xl)',
                background:     'var(--color-bg-surface)',
                cursor:         'pointer',
                transition:     'all var(--transition-fast)',
              }"
            >
              <IconCamera :size="28" :style="{ color: 'var(--color-primary)' }" />
              <span :style="{
                fontSize:   'var(--text-sm)',
                fontWeight: 'var(--fw-bold)',
                color:      'var(--color-text-1)',
                textAlign:  'center',
              }">{{ lado.label }}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                :style="{ display: 'none' }"
                @change="onArchivoSeleccionado(lado.key, $event)"
              />
            </label>
          </div>

          <!-- Separador -->
          <div :style="{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--sp-md)',
            color:      'var(--color-text-3)',
            fontSize:   'var(--text-xs)',
            fontWeight: 'var(--fw-semibold)',
          }">
            <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
            o también puede
            <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
          </div>
        </template>

        <!-- PC: opción QR (principal) -->
        <template v-if="!esMovil">
          <button
            :style="{
              display:     'flex',
              alignItems:  'center',
              gap:         'var(--sp-lg)',
              padding:     'var(--sp-lg)',
              border:      '2px solid var(--color-primary)',
              borderRadius:'var(--r-xl)',
              background:  'var(--color-primary-light)',
              cursor:      'pointer',
              textAlign:   'left',
              width:       '100%',
              transition:  'all var(--transition-fast)',
            }"
            @click="iniciarQR"
          >
            <div :style="{
              width:          '44px',
              height:         '44px',
              borderRadius:   'var(--r-lg)',
              background:     'var(--color-primary)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     '0',
            }">
              <IconDeviceMobile :size="22" :style="{ color: '#fff' }" />
            </div>
            <div :style="{ flex: '1', textAlign: 'left' }">
              <div :style="{
                fontWeight:   'var(--fw-bold)',
                color:        'var(--color-primary)',
                fontSize:     'var(--text-base)',
                marginBottom: '2px',
              }">Tomar fotos con el celular</div>
              <div :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
              }">
                Escanee el código QR y tome las fotos desde su celular.
                Aparecerán aquí automáticamente.
              </div>
            </div>
            <IconQrcode :size="24" :style="{ color: 'var(--color-primary)', flexShrink: '0' }" />
          </button>

          <!-- Separador -->
          <div :style="{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--sp-md)',
            color:      'var(--color-text-3)',
            fontSize:   'var(--text-xs)',
            fontWeight: 'var(--fw-semibold)',
          }">
            <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
            o subir archivos desde este dispositivo
            <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
          </div>
        </template>

        <!-- Subir archivo (ambos dispositivos) -->
        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }">
          <label
            v-for="lado in LADOS"
            :key="lado.key"
            :style="{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            'var(--sp-xs)',
              padding:        'var(--sp-lg)',
              border:         '1px dashed var(--color-border)',
              borderRadius:   'var(--r-lg)',
              background:     'var(--color-bg-surface)',
              cursor:         'pointer',
              fontSize:       'var(--text-sm)',
              color:          'var(--color-text-3)',
              fontWeight:     'var(--fw-medium)',
              transition:     'all var(--transition-fast)',
            }"
          >
            <IconUpload :size="18" />
            Subir {{ lado.label.toLowerCase() }}
            <input
              type="file"
              accept="image/*,application/pdf"
              :style="{ display: 'none' }"
              @change="onArchivoSeleccionado(lado.key, $event)"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- ══ GENERANDO QR ════════════════════════════════════════════ -->
    <div v-else-if="estado === 'generando'" :style="{
      padding:        'var(--sp-2xl)',
      textAlign:      'center',
      border:         '1px solid var(--color-border)',
      borderRadius:   'var(--r-xl)',
      color:          'var(--color-text-3)',
      fontWeight:     'var(--fw-medium)',
    }">
      <IconRefresh :size="24" class="spin" :style="{ margin: '0 auto var(--sp-md)', display: 'block', color: 'var(--color-primary)' }" />
      Generando código QR...
    </div>

    <!-- ══ ESPERANDO / CAPTURANDO ══════════════════════════════════ -->
    <div v-else-if="['esperando_qr','capturando_movil'].includes(estado)" :style="{
      border:       '1px solid var(--color-border)',
      borderRadius: 'var(--r-xl)',
      overflow:     'hidden',
    }">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: !esMovil ? '1fr 200px' : '1fr',
        gap:                 'var(--sp-xl)',
        padding:             'var(--sp-xl)',
        alignItems:          'start',
      }">
        <!-- Info + progreso -->
        <div>
          <div :style="{
            fontWeight:   'var(--fw-bold)',
            color:        'var(--color-text-1)',
            fontSize:     'var(--text-base)',
            marginBottom: 'var(--sp-sm)',
          }">
            <template v-if="estado === 'capturando_movil'">Capturando fotos desde el celular…</template>
            <template v-else-if="!esMovil">Escanea el código QR con tu celular</template>
            <template v-else>Enlace generado</template>
          </div>
          <div :style="{
            fontSize:     'var(--text-sm)',
            color:        'var(--color-text-2)',
            fontWeight:   'var(--fw-medium)',
            lineHeight:   '1.6',
            marginBottom: 'var(--sp-lg)',
            whiteSpace:   'pre-line',
          }">
            <template v-if="estado === 'capturando_movil'">
              El celular está tomando las fotos. Aparecerán aquí al terminar.
            </template>
            <template v-else-if="!esMovil">
              1. Abra la cámara de su celular{{ '\n' }}2. Apunte al código QR{{ '\n' }}3. Toque el enlace que aparece{{ '\n' }}4. Tome la foto del frente y del reverso
            </template>
            <template v-else>
              Abra el enlace en otro dispositivo o use los botones de cámara de abajo.
            </template>
          </div>

          <!-- Indicadores de progreso -->
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }">
            <div
              v-for="lado in LADOS"
              :key="lado.key"
              :style="{
                display:     'flex',
                alignItems:  'center',
                gap:         'var(--sp-sm)',
                padding:     'var(--sp-sm) var(--sp-md)',
                borderRadius:'var(--r-lg)',
                background:  (lado.key === 'frente' ? urlFrente : urlReverso)
                  ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
                border:      `1px solid ${(lado.key === 'frente' ? urlFrente : urlReverso)
                  ? 'var(--color-success)' : 'var(--color-border)'}`,
                transition:  'all 0.3s ease',
              }"
            >
              <IconCircleCheck
                v-if="(lado.key === 'frente' ? urlFrente : urlReverso)"
                :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }"
              />
              <div v-else :style="{
                width:       '16px',
                height:      '16px',
                borderRadius:'50%',
                border:      '2px solid var(--color-border)',
                flexShrink:  '0',
              }" />
              <span :style="{
                fontSize:   'var(--text-sm)',
                fontWeight: 'var(--fw-semibold)',
                color:      (lado.key === 'frente' ? urlFrente : urlReverso)
                  ? 'var(--color-success-text)' : 'var(--color-text-2)',
              }">
                {{ lado.label }} — {{ (lado.key === 'frente' ? urlFrente : urlReverso) ? 'Capturada ✓' : 'Pendiente' }}
              </span>
            </div>
          </div>

          <!-- Link copiable -->
          <div v-if="urlCaptura" :style="{
            padding:      'var(--sp-sm) var(--sp-md)',
            background:   'var(--color-bg-surface)',
            borderRadius: 'var(--r-lg)',
            border:       '1px solid var(--color-border)',
            display:      'flex',
            alignItems:   'center',
            gap:          'var(--sp-sm)',
            marginBottom: 'var(--sp-md)',
          }">
            <span :style="{
              flex:         '1',
              fontSize:     'var(--text-xs)',
              color:        'var(--color-text-3)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              fontFamily:   'monospace',
            }">{{ urlCaptura }}</span>
            <button
              :style="{
                background:   'none',
                border:       'none',
                cursor:       'pointer',
                padding:      'var(--sp-xs)',
                borderRadius: 'var(--r-sm)',
                color:        'var(--color-primary)',
                fontSize:     'var(--text-xs)',
                fontWeight:   'var(--fw-bold)',
                flexShrink:   '0',
              }"
              @click="copiarLink"
            >Copiar</button>
          </div>

          <!-- Cancelar -->
          <button
            :style="{
              background:  'none',
              border:      'none',
              cursor:      'pointer',
              color:       'var(--color-text-3)',
              fontSize:    'var(--text-sm)',
              fontWeight:  'var(--fw-medium)',
              display:     'flex',
              alignItems:  'center',
              gap:         'var(--sp-xs)',
              padding:     '0',
            }"
            @click="cancelar"
          >
            <IconX :size="13" /> Cancelar
          </button>
        </div>

        <!-- QR Image (solo en PC) -->
        <div v-if="!esMovil" :style="{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           'var(--sp-sm)',
        }">
          <!-- Skeleton mientras carga la URL de imagen -->
          <div v-if="!qrDataUrl" :style="{
            width:          '180px',
            height:         '180px',
            borderRadius:   'var(--r-xl)',
            border:         '2px dashed var(--color-border)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'var(--color-bg-surface)',
          }">
            <svg class="spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--color-border)" stroke-width="2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <img
            v-else
            :src="qrDataUrl"
            alt="Código QR"
            :style="{
              width:        '180px',
              height:       '180px',
              borderRadius: 'var(--r-xl)',
              border:       '3px solid var(--color-primary)',
              display:      'block',
            }"
          />
          <div :style="{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--sp-xs)',
            fontSize:   'var(--text-xs)',
            color:      'var(--color-text-3)',
            fontWeight: 'var(--fw-medium)',
          }">
            <IconClock :size="11" /> Válido 30 min
          </div>
        </div>
      </div>
    </div>

    <!-- ══ ERROR ══════════════════════════════════════════════════ -->
    <div v-else-if="estado === 'error'" :style="{
      display:      'flex',
      alignItems:   'center',
      gap:          'var(--sp-sm)',
      padding:      'var(--sp-md) var(--sp-lg)',
      background:   'var(--color-error-bg)',
      border:       '1px solid var(--color-error)',
      borderRadius: 'var(--r-lg)',
      fontSize:     'var(--text-sm)',
      color:        'var(--color-error-text)',
      fontWeight:   'var(--fw-medium)',
    }">
      <IconAlertCircle :size="15" :style="{ flexShrink: '0' }" />
      {{ errorCaptura }}
      <button
        :style="{
          marginLeft:  'auto',
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          color:       'var(--color-error-text)',
          fontWeight:  'var(--fw-bold)',
          fontSize:    'var(--text-sm)',
          padding:     '0',
        }"
        @click="cancelar"
      >Reintentar</button>
    </div>

    <!-- Error externo del formulario -->
    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
