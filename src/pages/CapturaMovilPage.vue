<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { consultarEstadoCaptura, subirFotoCaptura } from '@/services/captura.service'
import {
  Camera, CheckCircle, AlertCircle, RotateCcw,
} from 'lucide-vue-next'

const route = useRoute()
const token = computed(() => route.params.token)

// ── Estado del flujo ──────────────────────────────────────────────────────────
// verificando | listo | previsualizando | confirmado
// previsualizando2 | completado | expirado | error
const fase          = ref('verificando')
const errorMsg      = ref('')
const subiendo      = ref(false)

const fotoFrenteBlob     = ref(null)
const fotoFrentePreview  = ref(null)
const fotoReversoBlob    = ref(null)
const fotoReversoPreview = ref(null)
const urlFrente          = ref(null)
const urlReverso         = ref(null)

const inputCamaraFrente  = ref(null)
const inputCamaraReverso = ref(null)

// ── Verificar sesión al cargar ────────────────────────────────────────────────
onMounted(async () => {
  try {
    const data = await consultarEstadoCaptura(token.value)
    if (data.estado === 'expirado') { fase.value = 'expirado'; return }
    if (data.estado === 'completado') {
      urlFrente.value  = data.url_frente
      urlReverso.value = data.url_reverso
      fase.value = 'completado'; return
    }
    if (data.url_frente) {
      urlFrente.value = data.url_frente
      fase.value = 'confirmado'
    } else {
      fase.value = 'listo'
    }
  } catch {
    fase.value = 'error'
    errorMsg.value = 'No se pudo verificar el enlace. Intenta de nuevo.'
  }
})

// ── Cámara ────────────────────────────────────────────────────────────────────
function abrirCamaraFrente()  { inputCamaraFrente.value?.click() }
function abrirCamaraReverso() { inputCamaraReverso.value?.click() }

function onFotoFrente(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  fotoFrenteBlob.value    = archivo
  fotoFrentePreview.value = URL.createObjectURL(archivo)
  fase.value = 'previsualizando'
  e.target.value = ''
}

function onFotoReverso(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  fotoReversoBlob.value    = archivo
  fotoReversoPreview.value = URL.createObjectURL(archivo)
  fase.value = 'previsualizando2'
  e.target.value = ''
}

// ── Confirmar y subir ────────────────────────────────────────────────────────
async function confirmarFrente() {
  subiendo.value = true
  errorMsg.value = ''
  try {
    const data = await subirFotoCaptura(token.value, 'frente', fotoFrenteBlob.value)
    urlFrente.value = data.url
    fase.value = 'confirmado'
  } catch (e) {
    errorMsg.value = e.message || 'Error al subir la foto. Intenta de nuevo.'
    fase.value = 'previsualizando'
  } finally {
    subiendo.value = false
  }
}

async function confirmarReverso() {
  subiendo.value = true
  errorMsg.value = ''
  try {
    const data = await subirFotoCaptura(token.value, 'reverso', fotoReversoBlob.value)
    urlReverso.value = data.url
    fase.value = 'completado'
  } catch (e) {
    errorMsg.value = e.message || 'Error al subir la foto. Intenta de nuevo.'
    fase.value = 'previsualizando2'
  } finally {
    subiendo.value = false
  }
}

// ── Retomar foto ──────────────────────────────────────────────────────────────
function retomarFrente() {
  fotoFrenteBlob.value    = null
  fotoFrentePreview.value = null
  errorMsg.value          = ''
  fase.value = 'listo'
}

function retomarReverso() {
  fotoReversoBlob.value    = null
  fotoReversoPreview.value = null
  errorMsg.value           = ''
  fase.value = 'confirmado'
}
</script>

<template>
  <div :style="{
    minHeight:     '100dvh',
    background:    '#0f1923',
    display:       'flex',
    flexDirection: 'column',
    fontFamily:    'var(--font-body)',
    color:         '#fff',
    overflowX:     'hidden',
  }">

    <!-- Inputs de cámara ocultos -->
    <input ref="inputCamaraFrente"  type="file" accept="image/*" capture="environment"
      style="display:none" @change="onFotoFrente" />
    <input ref="inputCamaraReverso" type="file" accept="image/*" capture="environment"
      style="display:none" @change="onFotoReverso" />

    <!-- ══ HEADER ════════════════════════════════════════════════ -->
    <div :style="{
      padding:        '16px 20px 12px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      borderBottom:   '1px solid rgba(255,255,255,0.08)',
      flexShrink:     '0',
    }">
      <div :style="{ textAlign: 'center' }">
        <div :style="{
          fontFamily:    'var(--font-display)',
          fontWeight:    '800',
          fontSize:      '18px',
          letterSpacing: '-0.02em',
        }">
          Cooper<span :style="{ color: 'var(--color-accent)' }">amigó</span>
        </div>
        <div :style="{
          fontSize:      '11px',
          color:         'rgba(255,255,255,0.45)',
          fontWeight:    '500',
          marginTop:     '2px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }">Captura de documento</div>
      </div>
    </div>

    <!-- ══ VERIFICANDO ══════════════════════════════════════════ -->
    <div v-if="fase === 'verificando'" :style="{
      flex: '1', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px',
    }">
      <div class="spinner-ring" />
      <p :style="{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0' }">
        Verificando enlace...
      </p>
    </div>

    <!-- ══ ERROR / EXPIRADO ══════════════════════════════════════ -->
    <div v-else-if="fase === 'expirado' || fase === 'error'" :style="{
      flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px', padding: '32px',
    }">
      <div :style="{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'rgba(239,68,68,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }">
        <AlertCircle :size="30" :style="{ color: '#ef4444' }" />
      </div>
      <div :style="{ textAlign: 'center' }">
        <p :style="{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', margin: '0 0 8px' }">
          {{ fase === 'expirado' ? 'Enlace expirado' : 'Error de conexión' }}
        </p>
        <p :style="{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', margin: '0' }">
          {{ fase === 'expirado'
            ? 'Este enlace ya no es válido. Genera uno nuevo desde el formulario en tu computador.'
            : errorMsg }}
        </p>
      </div>
    </div>

    <!-- ══ LISTO — frente ════════════════════════════════════════ -->
    <div v-else-if="fase === 'listo'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: '28px',
    }">
      <!-- Indicador de pasos -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-accent)', color: '#172B36',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '13px',
        }">1</div>
        <span :style="{ fontWeight: '600', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }">de 2 fotos</span>
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '13px',
        }">2</div>
      </div>

      <!-- Ilustración -->
      <div :style="{
        width: '220px', height: '140px', borderRadius: '12px',
        border: '2px dashed rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px',
        background: 'rgba(255,255,255,0.04)',
      }">
        <span :style="{ fontSize: '36px', lineHeight: '1' }">🪪</span>
        <span :style="{
          fontSize: '11px', fontWeight: '600',
          color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }">Parte frontal</span>
      </div>

      <div :style="{ textAlign: 'center' }">
        <p :style="{
          fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }">Fotografía el frente<br/>de tu cédula</p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', margin: '0' }">
          Asegúrate de que haya buena luz<br/>y el texto sea completamente legible
        </p>
      </div>

      <button class="btn-primary" @click="abrirCamaraFrente">
        <Camera :size="20" />
        Tomar foto del frente
      </button>

      <label class="btn-galeria">
        o elige desde la galería
        <input type="file" accept="image/*" style="display:none" @change="onFotoFrente" />
      </label>
    </div>

    <!-- ══ PREVISUALIZANDO — frente ══════════════════════════════ -->
    <div v-else-if="fase === 'previsualizando'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
    }">
      <!-- Imagen a pantalla completa -->
      <div :style="{
        flex: '1', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }">
        <img :src="fotoFrentePreview" alt="Frente" :style="{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block',
        }" />
        <div class="badge-foto" :style="{ color: 'var(--color-accent)' }">FRENTE</div>
      </div>

      <!-- Acciones -->
      <div :style="{
        padding: '20px 24px', background: '#0f1923',
        display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: '0',
      }">
        <p :style="{
          textAlign: 'center', fontSize: '14px',
          color: 'rgba(255,255,255,0.6)', margin: '0 0 4px',
        }">¿El texto es legible y bien iluminado?</p>

        <button class="btn-primary" :disabled="subiendo" @click="confirmarFrente">
          <div v-if="subiendo" class="spinner-sm" />
          <CheckCircle v-else :size="18" />
          {{ subiendo ? 'Subiendo...' : 'Usar esta foto' }}
        </button>

        <button class="btn-secondary" :disabled="subiendo" @click="retomarFrente">
          <RotateCcw :size="16" />
          Tomar de nuevo
        </button>

        <div v-if="errorMsg" class="error-banner">
          <AlertCircle :size="14" style="flex-shrink:0" />
          {{ errorMsg }}
        </div>
      </div>
    </div>

    <!-- ══ CONFIRMADO — listo para reverso ══════════════════════ -->
    <div v-else-if="fase === 'confirmado'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: '28px',
    }">
      <!-- Progreso -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }">
          <CheckCircle :size="16" :style="{ color: '#fff' }" />
        </div>
        <div :style="{ width: '32px', height: '2px', background: 'rgba(255,255,255,0.2)' }" />
        <div :style="{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--color-accent)', color: '#172B36',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '13px',
        }">2</div>
      </div>

      <!-- Confirmación frente -->
      <div :style="{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '14px',
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
        width: '100%', maxWidth: '320px',
      }">
        <img
          v-if="fotoFrentePreview || urlFrente"
          :src="fotoFrentePreview || urlFrente"
          :style="{
            width: '52px', height: '36px', objectFit: 'cover',
            borderRadius: '6px', flexShrink: '0',
            border: '2px solid rgba(34,197,94,0.5)',
          }"
        />
        <div>
          <div :style="{ fontSize: '13px', fontWeight: '700', color: '#86efac' }">✓ Frente capturado</div>
          <div :style="{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }">Foto guardada correctamente</div>
        </div>
      </div>

      <!-- Ilustración reverso -->
      <div :style="{
        width: '220px', height: '140px', borderRadius: '12px',
        border: '2px dashed rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px',
        background: 'rgba(255,255,255,0.04)',
      }">
        <span :style="{ fontSize: '36px', lineHeight: '1' }">🪪</span>
        <span :style="{
          fontSize: '11px', fontWeight: '600',
          color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }">Parte trasera</span>
      </div>

      <div :style="{ textAlign: 'center' }">
        <p :style="{
          fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }">Ahora fotografía el reverso<br/>de tu cédula</p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', margin: '0' }">
          Voltea tu cédula y toma<br/>la foto de la parte de atrás
        </p>
      </div>

      <button class="btn-primary" @click="abrirCamaraReverso">
        <Camera :size="20" />
        Tomar foto del reverso
      </button>

      <label class="btn-galeria">
        o elige desde la galería
        <input type="file" accept="image/*" style="display:none" @change="onFotoReverso" />
      </label>
    </div>

    <!-- ══ PREVISUALIZANDO — reverso ══════════════════════════════ -->
    <div v-else-if="fase === 'previsualizando2'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
    }">
      <div :style="{
        flex: '1', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }">
        <img :src="fotoReversoPreview" alt="Reverso" :style="{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block',
        }" />
        <div class="badge-foto" :style="{ color: '#86efac' }">REVERSO</div>
      </div>

      <div :style="{
        padding: '20px 24px', background: '#0f1923',
        display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: '0',
      }">
        <p :style="{
          textAlign: 'center', fontSize: '14px',
          color: 'rgba(255,255,255,0.6)', margin: '0 0 4px',
        }">¿El texto es legible y bien iluminado?</p>

        <button class="btn-primary" :disabled="subiendo" @click="confirmarReverso">
          <div v-if="subiendo" class="spinner-sm" />
          <CheckCircle v-else :size="18" />
          {{ subiendo ? 'Subiendo...' : 'Usar esta foto' }}
        </button>

        <button class="btn-secondary" :disabled="subiendo" @click="retomarReverso">
          <RotateCcw :size="16" />
          Tomar de nuevo
        </button>

        <div v-if="errorMsg" class="error-banner">
          <AlertCircle :size="14" style="flex-shrink:0" />
          {{ errorMsg }}
        </div>
      </div>
    </div>

    <!-- ══ COMPLETADO ══════════════════════════════════════════════ -->
    <div v-else-if="fase === 'completado'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: '28px',
    }">
      <div :style="{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }">
        <CheckCircle :size="40" :style="{ color: '#22c55e' }" />
      </div>

      <div :style="{ textAlign: 'center' }">
        <p :style="{
          fontFamily: 'var(--font-display)', fontWeight: '800',
          fontSize: '24px', letterSpacing: '-0.03em', margin: '0 0 10px',
        }">¡Todo listo!</p>
        <p :style="{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', margin: '0' }">
          Ambas fotos se enviaron correctamente.<br/>
          Ya puedes cerrar esta ventana y continuar<br/>
          con tu solicitud en el computador.
        </p>
      </div>

      <!-- Miniaturas finales -->
      <div :style="{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', width: '100%', maxWidth: '300px',
      }">
        <div v-for="lado in [
          { nombre: 'Frente',  src: fotoFrentePreview  || urlFrente },
          { nombre: 'Reverso', src: fotoReversoPreview || urlReverso },
        ]" :key="lado.nombre">
          <div :style="{
            fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
          }">{{ lado.nombre }}</div>
          <img :src="lado.src" :alt="lado.nombre" :style="{
            width: '100%', borderRadius: '10px',
            border: '2px solid rgba(34,197,94,0.4)',
            aspectRatio: '3/2', objectFit: 'cover', display: 'block',
          }" />
        </div>
      </div>
    </div>

    <!-- ══ FOOTER ══════════════════════════════════════════════════ -->
    <div :style="{
      padding:    '12px 20px 20px',
      textAlign:  'center',
      fontSize:   '11px',
      color:      'rgba(255,255,255,0.2)',
      fontWeight: '500',
      flexShrink: '0',
    }">
      Cooperativa Multiactiva Luis Amigó · NIT 800.191.482-7
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

* { -webkit-tap-highlight-color: transparent; }

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0,0,0,0.25);
  border-top-color: #172B36;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.btn-primary {
  width: 100%;
  max-width: 320px;
  padding: 18px;
  border-radius: 16px;
  border: none;
  background: var(--color-accent);
  color: #172B36;
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 32px rgba(255,200,1,0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:disabled {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  cursor: not-allowed;
  box-shadow: none;
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-secondary {
  width: 100%;
  max-width: 320px;
  padding: 15px;
  border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s ease;
}
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary:active:not(:disabled) { background: rgba(255,255,255,0.1); }

.btn-galeria {
  color: rgba(255,255,255,0.35);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.badge-foto {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.error-banner {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #fca5a5;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
