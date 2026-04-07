<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const token = computed(() => route.params.token)
const EF    = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captura-documento`

// ── Estados del flujo ──────────────────────────────────────────────────────
// verificando → listo_frente → visor → previsualizando
// → listo_reverso → visor → previsualizando2 → completado
// También: expirado | error | sin_camara
const fase = ref('verificando')

const urlFrente   = ref(null)
const urlReverso  = ref(null)
const fotoBlob    = ref(null)
const fotoPreview = ref(null)
const errorMsg    = ref('')
const subiendo    = ref(false)

const videoRef  = ref(null)
const canvasRef = ref(null)

let stream = null

// ── Verificar sesión ───────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res  = await fetch(`${EF}/estado/${token.value}`)
    const data = await res.json()
    if (!res.ok || data.estado === 'expirado') { fase.value = 'expirado'; return }
    if (data.estado === 'completado') {
      urlFrente.value  = data.url_frente
      urlReverso.value = data.url_reverso
      fase.value = 'completado'; return
    }
    if (data.url_frente) {
      urlFrente.value = data.url_frente
      fase.value = 'listo_reverso'
    } else {
      fase.value = 'listo_frente'
    }
  } catch {
    fase.value = 'error'
    errorMsg.value = 'No se pudo verificar el enlace.'
  }
})

onUnmounted(detenerCamara)

function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

// ── Abrir visor de cámara ──────────────────────────────────────────────────
async function abrirVisor() {
  errorMsg.value = ''
  fase.value = 'visor'
  await nextTick()
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
  } catch (e) {
    console.error('getUserMedia error:', e)
    detenerCamara()
    fase.value = 'sin_camara'
  }
}

// ── Capturar foto desde el visor ──────────────────────────────────────────
function capturar() {
  const video  = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  canvas.toBlob((blob) => {
    fotoBlob.value    = blob
    fotoPreview.value = URL.createObjectURL(blob)
    detenerCamara()
    fase.value = urlFrente.value ? 'previsualizando2' : 'previsualizando'
  }, 'image/jpeg', 0.92)
}

// ── Fallback galería ───────────────────────────────────────────────────────
function onArchivoFallback(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  fotoBlob.value    = archivo
  fotoPreview.value = URL.createObjectURL(archivo)
  fase.value = urlFrente.value ? 'previsualizando2' : 'previsualizando'
  e.target.value = ''
}

// ── Retomar foto ───────────────────────────────────────────────────────────
function retomar() {
  fotoBlob.value    = null
  fotoPreview.value = null
  errorMsg.value    = ''
  abrirVisor()
}

// ── Cancelar visor ─────────────────────────────────────────────────────────
function cancelarVisor() {
  detenerCamara()
  fase.value = urlFrente.value ? 'listo_reverso' : 'listo_frente'
}

// ── Confirmar y subir ──────────────────────────────────────────────────────
async function confirmar() {
  if (!fotoBlob.value) return
  subiendo.value = true
  errorMsg.value = ''
  const lado = urlFrente.value ? 'reverso' : 'frente'
  try {
    const fd = new FormData()
    fd.append('lado', lado)
    fd.append('foto', fotoBlob.value, `${lado}.jpg`)
    const res  = await fetch(`${EF}/subir/${token.value}`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
    if (lado === 'frente') {
      urlFrente.value = data.url
      fase.value = 'listo_reverso'
    } else {
      urlReverso.value = data.url
      fase.value = 'completado'
    }
    fotoBlob.value    = null
    fotoPreview.value = null
  } catch (e) {
    errorMsg.value = e.message || 'Error al enviar la foto'
  } finally {
    subiendo.value = false
  }
}

const labelPaso  = computed(() => !urlFrente.value ? 'Frente de la cédula' : 'Reverso de la cédula')
const numeroPaso = computed(() => !urlFrente.value ? 1 : 2)
</script>

<template>
  <div :style="{
    position:      'fixed',
    inset:         '0',
    background:    '#0d1117',
    display:       'flex',
    flexDirection: 'column',
    fontFamily:    'system-ui, -apple-system, sans-serif',
    color:         '#fff',
    overflow:      'hidden',
    userSelect:    'none',
  }">

    <!-- ══ HEADER ════════════════════════════════════════════════ -->
    <div :style="{
      padding:        '14px 20px 10px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      flexShrink:     '0',
      zIndex:         '10',
    }">
      <div>
        <div :style="{
          fontSize:      '17px',
          fontWeight:    '800',
          letterSpacing: '-0.03em',
          lineHeight:    '1',
        }">
          Cooper<span :style="{ color: '#FFC801' }">amigó</span>
        </div>
        <div :style="{
          fontSize:      '10px',
          color:         'rgba(255,255,255,0.4)',
          fontWeight:    '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginTop:     '2px',
        }">Captura de documento</div>
      </div>

      <!-- Indicador de paso -->
      <div v-if="['listo_frente','listo_reverso','visor','previsualizando','previsualizando2'].includes(fase)"
        :style="{ display: 'flex', alignItems: 'center', gap: '6px' }">
        <div v-for="n in 2" :key="n" :style="{
          width:        n === numeroPaso ? '20px' : '8px',
          height:       '8px',
          borderRadius: '4px',
          background:   n === numeroPaso ? '#FFC801'
            : n < numeroPaso ? '#22c55e' : 'rgba(255,255,255,0.15)',
          transition:   'all 0.3s ease',
        }" />
      </div>
    </div>

    <!-- ══ VERIFICANDO ════════════════════════════════════════════ -->
    <div v-if="fase === 'verificando'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '14px',
    }">
      <div :style="{
        width: '36px', height: '36px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#FFC801', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }" />
      <p :style="{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '500', margin: '0' }">
        Verificando enlace...
      </p>
    </div>

    <!-- ══ EXPIRADO ═══════════════════════════════════════════════ -->
    <div v-else-if="fase === 'expirado'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px', gap: '20px', textAlign: 'center',
    }">
      <div :style="{ fontSize: '48px', lineHeight: '1' }">⏱️</div>
      <div>
        <p :style="{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }">Enlace expirado</p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.6', margin: '0' }">
          Genera un nuevo código QR<br/>desde el formulario en tu computador.
        </p>
      </div>
    </div>

    <!-- ══ ERROR ══════════════════════════════════════════════════ -->
    <div v-else-if="fase === 'error'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px', gap: '20px', textAlign: 'center',
    }">
      <div :style="{ fontSize: '48px' }">⚠️</div>
      <div>
        <p :style="{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }">Algo salió mal</p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0' }">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- ══ LISTO (frente o reverso) ══════════════════════════════ -->
    <div v-else-if="['listo_frente','listo_reverso'].includes(fase)" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 28px 36px',
    }">
      <!-- Texto -->
      <div :style="{ textAlign: 'center', paddingTop: '8px' }">
        <p :style="{
          fontSize: '11px', fontWeight: '700',
          color: fase === 'listo_reverso' ? '#86efac' : '#FFC801',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          margin: '0 0 10px',
        }">
          {{ fase === 'listo_reverso' ? '✓ Frente capturado · Paso 2 de 2' : 'Paso 1 de 2' }}
        </p>
        <h1 :style="{
          fontSize: '26px', fontWeight: '800',
          letterSpacing: '-0.03em', lineHeight: '1.2',
          margin: '0 0 10px',
        }">
          {{ fase === 'listo_reverso' ? 'Ahora el reverso' : 'Fotografía el frente' }}<br/>
          <span :style="{ color: 'rgba(255,255,255,0.5)' }">de tu cédula</span>
        </h1>
        <p :style="{
          color: 'rgba(255,255,255,0.45)', fontSize: '13px',
          lineHeight: '1.6', fontWeight: '500', margin: '0',
        }">
          Ubica tu cédula dentro del recuadro<br/>y asegúrate que el texto sea legible
        </p>
      </div>

      <!-- Ilustración cédula -->
      <div :style="{ width: '260px', position: 'relative' }">
        <div :style="{
          width: '100%', paddingBottom: '63%',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #1e2d3d 0%, #162230 100%)',
          border: '2px solid rgba(255,255,255,0.12)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }">
          <div :style="{
            position: 'absolute', inset: '0', padding: '16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }">
            <div :style="{ display: 'flex', gap: '10px', alignItems: 'center' }">
              <div :style="{
                width: '40px', height: '40px', borderRadius: '6px',
                background: 'rgba(255,200,1,0.15)', border: '1px solid rgba(255,200,1,0.2)',
                flexShrink: '0',
              }"/>
              <div :style="{ flex: '1' }">
                <div :style="{ height:'8px', borderRadius:'4px', background:'rgba(255,255,255,0.15)', marginBottom:'6px', width:'60%' }"/>
                <div :style="{ height:'6px', borderRadius:'3px', background:'rgba(255,255,255,0.08)', width:'80%' }"/>
              </div>
            </div>
            <div>
              <div v-for="w in ['70%','90%','50%']" :key="w" :style="{
                height:'5px', borderRadius:'3px',
                background:'rgba(255,255,255,0.08)',
                marginBottom:'5px', width: w,
              }"/>
            </div>
          </div>
          <div v-if="fase === 'listo_reverso'" :style="{
            position:'absolute', inset:'0',
            background:'rgba(34,197,94,0.08)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }">
            <span :style="{ fontSize:'28px', opacity:'0.6' }">↩️</span>
          </div>
        </div>
        <!-- Esquinas target -->
        <div v-for="(s,i) in [
          { top:'-4px',  left:'-4px',  borderTop:'3px solid #FFC801', borderLeft:'3px solid #FFC801' },
          { top:'-4px',  right:'-4px', borderTop:'3px solid #FFC801', borderRight:'3px solid #FFC801' },
          { bottom:'-4px', left:'-4px',  borderBottom:'3px solid #FFC801', borderLeft:'3px solid #FFC801' },
          { bottom:'-4px', right:'-4px', borderBottom:'3px solid #FFC801', borderRight:'3px solid #FFC801' },
        ]" :key="i" :style="{
          position:'absolute', width:'18px', height:'18px', borderRadius:'2px', ...s,
        }"/>
      </div>

      <!-- CTA -->
      <div :style="{
        width: '100%', display: 'flex',
        flexDirection: 'column', gap: '12px', alignItems: 'center',
      }">
        <button :style="{
          width: '100%', padding: '17px', borderRadius: '16px', border: 'none',
          background: '#FFC801', color: '#0d1117',
          fontFamily: 'inherit', fontWeight: '800', fontSize: '16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px', letterSpacing: '-0.01em',
          boxShadow: '0 4px 24px rgba(255,200,1,0.35)',
          WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        }" @click="abrirVisor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Abrir cámara
        </button>

        <label :style="{
          color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '500',
          cursor: 'pointer', paddingBottom: '4px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }">
          Elegir de la galería
          <input type="file" accept="image/*" style="display:none" @change="onArchivoFallback" />
        </label>
      </div>
    </div>

    <!-- ══ VISOR DE CÁMARA ════════════════════════════════════════ -->
    <div v-else-if="fase === 'visor'" :style="{
      flex: '1', position: 'relative', overflow: 'hidden', background: '#000',
    }">
      <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        :style="{
          position: 'absolute', inset: '0',
          width: '100%', height: '100%', objectFit: 'cover',
        }"
      />

      <!-- Overlay con máscara del documento -->
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" :style="{
        position: 'absolute', inset: '0',
        width: '100%', height: '100%', pointerEvents: 'none',
      }">
        <defs>
          <mask id="doc-mask">
            <rect width="100" height="100" fill="white"/>
            <rect x="8" y="23.5" width="84" height="53" rx="1.5" fill="black"/>
          </mask>
        </defs>
        <rect width="100" height="100" fill="rgba(0,0,0,0.62)" mask="url(#doc-mask)"/>
      </svg>

      <!-- Marco del recuadro con esquinas -->
      <div :style="{
        position: 'absolute', left: '8%', right: '8%',
        top: '23.5%', height: '53%',
        borderRadius: '3px', pointerEvents: 'none',
      }">
        <div v-for="(s,i) in [
          { top:0, left:0,   borderTop:'3px solid #FFC801', borderLeft:'3px solid #FFC801' },
          { top:0, right:0,  borderTop:'3px solid #FFC801', borderRight:'3px solid #FFC801' },
          { bottom:0, left:0,  borderBottom:'3px solid #FFC801', borderLeft:'3px solid #FFC801' },
          { bottom:0, right:0, borderBottom:'3px solid #FFC801', borderRight:'3px solid #FFC801' },
        ]" :key="i" :style="{
          position: 'absolute', width: '22px', height: '22px', borderRadius: '2px', ...s,
        }"/>
      </div>

      <!-- Instrucción superior -->
      <div :style="{
        position: 'absolute', top: '15%', left: '0', right: '0',
        textAlign: 'center', pointerEvents: 'none',
      }">
        <span :style="{
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          borderRadius: '20px', padding: '6px 16px',
          fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.02em',
        }">{{ labelPaso }} · Centra el documento</span>
      </div>

      <!-- Indicador de paso inferior -->
      <div :style="{
        position: 'absolute', bottom: '22%', left: '0', right: '0',
        textAlign: 'center', pointerEvents: 'none',
      }">
        <span :style="{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }">
          Paso {{ numeroPaso }} de 2
        </span>
      </div>

      <!-- Botón capturar -->
      <div :style="{
        position: 'absolute', bottom: '0', left: '0', right: '0',
        padding: '20px 0 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
      }">
        <button :style="{
          width: '72px', height: '72px', borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.9)',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
          transition: 'transform 0.1s ease',
        }"
          @click="capturar"
          @touchstart.passive="e => e.currentTarget.style.transform='scale(0.92)'"
          @touchend.passive="e => e.currentTarget.style.transform='scale(1)'"
        >
          <div :style="{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff' }"/>
        </button>
      </div>

      <canvas ref="canvasRef" style="display:none"/>

      <!-- Botón cancelar -->
      <button :style="{
        position: 'absolute', top: '14px', left: '16px',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        border: 'none', borderRadius: '10px',
        color: 'rgba(255,255,255,0.8)', padding: '8px 14px',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }" @click="cancelarVisor">
        ✕ Cancelar
      </button>
    </div>

    <!-- ══ SIN CÁMARA (fallback) ══════════════════════════════════ -->
    <div v-else-if="fase === 'sin_camara'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px', gap: '20px', textAlign: 'center',
    }">
      <div :style="{ fontSize: '40px' }">📷</div>
      <div>
        <p :style="{ fontSize: '17px', fontWeight: '700', margin: '0 0 8px' }">Cámara no disponible</p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', margin: '0' }">
          Puedes subir la foto desde tu galería
        </p>
      </div>
      <label :style="{
        padding: '16px 32px', borderRadius: '14px',
        background: '#FFC801', color: '#0d1117',
        fontWeight: '800', fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '8px',
      }">
        📁 Elegir foto
        <input type="file" accept="image/*" style="display:none" @change="onArchivoFallback" />
      </label>
    </div>

    <!-- ══ PREVISUALIZANDO (frente o reverso) ════════════════════ -->
    <div v-else-if="['previsualizando','previsualizando2'].includes(fase)" :style="{
      flex: '1', display: 'flex', flexDirection: 'column', background: '#000',
    }">
      <div :style="{
        flex: '1', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }">
        <img :src="fotoPreview" :style="{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block',
        }" />
        <div :style="{
          position: 'absolute', top: '14px', left: '14px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: '8px', padding: '5px 12px',
          fontSize: '11px', fontWeight: '800',
          color: fase === 'previsualizando' ? '#FFC801' : '#86efac',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }">
          {{ fase === 'previsualizando' ? 'FRENTE' : 'REVERSO' }}
        </div>
      </div>

      <div :style="{
        flexShrink: '0', padding: '16px 20px 32px',
        background: 'linear-gradient(to bottom, #111827, #0d1117)',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }">
        <p :style="{
          textAlign: 'center', fontSize: '13px',
          color: 'rgba(255,255,255,0.55)', fontWeight: '500', margin: '0 0 2px',
        }">¿El texto es claro y legible?</p>

        <button :disabled="subiendo" :style="{
          padding: '15px', borderRadius: '14px', border: 'none',
          background: subiendo ? 'rgba(255,200,1,0.3)' : '#FFC801',
          color: subiendo ? 'rgba(255,200,1,0.6)' : '#0d1117',
          fontFamily: 'inherit', fontWeight: '800', fontSize: '15px',
          cursor: subiendo ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          WebkitTapHighlightColor: 'transparent',
        }" @click="confirmar">
          <div v-if="subiendo" :style="{
            width:'16px', height:'16px',
            border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#0d1117',
            borderRadius:'50%', animation:'spin 0.7s linear infinite',
          }"/>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ subiendo ? 'Enviando...' : 'Sí, usar esta foto' }}
        </button>

        <button :disabled="subiendo" :style="{
          padding: '13px', borderRadius: '14px',
          border: '1.5px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          color: subiendo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
          fontFamily: 'inherit', fontWeight: '600', fontSize: '14px',
          cursor: subiendo ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          WebkitTapHighlightColor: 'transparent',
        }" @click="retomar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.36"/>
          </svg>
          Tomar de nuevo
        </button>

        <div v-if="errorMsg" :style="{
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5', fontSize: '13px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px',
        }">
          ⚠️ {{ errorMsg }}
        </div>
      </div>
    </div>

    <!-- ══ COMPLETADO ═════════════════════════════════════════════ -->
    <div v-else-if="fase === 'completado'" :style="{
      flex: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 28px', gap: '28px', textAlign: 'center',
    }">
      <div :style="{
        width: '76px', height: '76px', borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '36px',
      }">✅</div>

      <div>
        <p :style="{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px' }">
          ¡Todo listo!
        </p>
        <p :style="{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.7', margin: '0' }">
          Ambas fotos fueron enviadas.<br/>
          Cierra esta ventana y continúa<br/>
          <strong :style="{ color: 'rgba(255,255,255,0.7)' }">en tu computador.</strong>
        </p>
      </div>

      <div :style="{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', width: '100%', maxWidth: '280px',
      }">
        <div v-for="lado in [
          { nombre: 'Frente',  url: urlFrente },
          { nombre: 'Reverso', url: urlReverso },
        ]" :key="lado.nombre">
          <p :style="{
            fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px',
          }">{{ lado.nombre }}</p>
          <img :src="lado.url" :alt="lado.nombre" :style="{
            width: '100%', borderRadius: '10px',
            border: '2px solid rgba(34,197,94,0.3)',
            aspectRatio: '1.585', objectFit: 'cover', display: 'block',
          }" />
        </div>
      </div>
    </div>

    <!-- ══ FOOTER ═════════════════════════════════════════════════ -->
    <div :style="{
      flexShrink: '0', textAlign: 'center', padding: '10px',
      fontSize: '10px', color: 'rgba(255,255,255,0.15)', fontWeight: '500',
    }">
      Cooperativa Multiactiva Luis Amigó · NIT 800.191.482-7
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
</style>
