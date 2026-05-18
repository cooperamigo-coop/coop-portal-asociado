<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const token = computed(() => route.params.token)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const EF_BASE = `${SUPABASE_URL}/functions/v1/captura-documento`

// Estados: verificando|listo_frente|visor|previsualizando
//          listo_reverso|previsualizando2|completado
//          expirado|error|sin_camara
const fase        = ref('verificando')
const urlFrente   = ref(null)
const urlReverso  = ref(null)
const fotoBlob    = ref(null)
const fotoPreview = ref(null)
const errorMsg    = ref('')
const subiendo    = ref(false)

const videoRef  = ref(null)
const canvasRef = ref(null)
let stream = null

// Paso actual
const esReverso = computed(() => !!urlFrente.value)
const labelPaso = computed(() => esReverso.value ? 'Reverso' : 'Frente')

onMounted(async () => {
  console.log('[CapturaMovil] SUPABASE_URL:', SUPABASE_URL)
  console.log('[CapturaMovil] token:', token.value)
  try {
    const res  = await fetch(`${EF_BASE}/estado/${token.value}`)
    const data = await res.json()
    if (!res.ok || data.estado === 'expirado') { fase.value = 'expirado'; return }
    if (data.estado === 'completado') {
      urlFrente.value  = data.url_frente
      urlReverso.value = data.url_reverso
      fase.value = 'completado'; return
    }
    if (data.url_frente) { urlFrente.value = data.url_frente; fase.value = 'listo_reverso' }
    else fase.value = 'listo_frente'
  } catch { fase.value = 'error'; errorMsg.value = 'No se pudo verificar el enlace.' }
})

onUnmounted(detenerCamara)

function detenerCamara() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
}

async function abrirVisor() {
  errorMsg.value = ''
  fase.value = 'visor'
  await nextTick()
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    })
    if (videoRef.value) { videoRef.value.srcObject = stream; await videoRef.value.play() }
  } catch (e) {
    console.error('getUserMedia:', e)
    detenerCamara()
    fase.value = 'sin_camara'
  }
}

function capturar() {
  const video  = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  canvas.width  = video.videoWidth  || 1280
  canvas.height = video.videoHeight || 720
  canvas.getContext('2d').drawImage(video, 0, 0)

  // BUG 1: canvas.toBlob() es asíncrono con callback — envolver en Promise
  new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88)
  }).then((blob) => {
    if (!blob) {
      errorMsg.value = 'No se pudo capturar la foto. Intenta de nuevo.'
      fase.value = esReverso.value ? 'listo_reverso' : 'listo_frente'
      return
    }
    fotoBlob.value    = blob
    fotoPreview.value = URL.createObjectURL(blob)
    detenerCamara()
    fase.value = esReverso.value ? 'previsualizando2' : 'previsualizando'
  })
}

function onArchivoFallback(e) {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  fotoBlob.value    = archivo
  fotoPreview.value = URL.createObjectURL(archivo)
  fase.value = esReverso.value ? 'previsualizando2' : 'previsualizando'
}

function retomar() {
  fotoBlob.value    = null
  fotoPreview.value = null
  abrirVisor()
}

async function confirmar() {
  if (!fotoBlob.value) {
    errorMsg.value = 'No hay foto para enviar. Toma una foto primero.'
    return
  }
  subiendo.value = true
  errorMsg.value = ''

  const lado = esReverso.value ? 'reverso' : 'frente'

  try {
    const fd = new FormData()
    fd.append('lado', lado)
    fd.append('foto', fotoBlob.value, `${lado}.jpg`)

    console.log(`[confirmar] Enviando ${lado}, tamaño: ${fotoBlob.value.size} bytes`)

    const res = await fetch(`${EF_BASE}/subir/${token.value}`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body:    fd,
    })

    console.log(`[confirmar] Respuesta: ${res.status}`)

    // BUG 2: leer siempre el body, incluso en errores
    const data = await res.json()
    console.log('[confirmar] Data:', JSON.stringify(data))

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`)
    }

    // Éxito — limpiar foto
    fotoBlob.value    = null
    fotoPreview.value = null

    if (lado === 'frente') {
      urlFrente.value = data.url
      // iOS Safari: getUserMedia requiere gesto directo; no llamar abrirVisor() aquí
      fase.value = 'listo_reverso'
    } else {
      urlReverso.value = data.url
      fase.value = 'completado'
    }
  } catch (e) {
    console.error('[confirmar] Error:', e.message)
    errorMsg.value = e.message || 'Error al enviar la foto. Intenta de nuevo.'
    // NO cambiar fase — quedarse en previsualizando para poder reintentar
  } finally {
    subiendo.value = false  // SIEMPRE desbloquear el botón
  }
}
</script>

<template>
  <div :style="{
    position:'fixed', inset:'0', background:'#0d1117',
    display:'flex', flexDirection:'column',
    fontFamily:'system-ui,-apple-system,sans-serif',
    color:'#fff', overflow:'hidden', userSelect:'none',
  }">

    <!-- HEADER -->
    <div v-if="fase !== 'visor'" :style="{
      padding:'14px 20px 10px', display:'flex',
      alignItems:'center', justifyContent:'space-between', flexShrink:'0',
    }">
      <div>
        <img src="/logo-principal.svg" :style="{ height:'26px', filter:'brightness(0) invert(1)', display:'block' }" alt="Cooperamigó"/>
        <div :style="{
          fontSize:'10px', color:'rgba(255,255,255,0.35)',
          fontWeight:'600', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:'4px',
        }">Captura de cédula</div>
      </div>
      <div v-if="['listo_frente','listo_reverso'].includes(fase)"
        :style="{ display:'flex', alignItems:'center', gap:'5px' }">
        <div v-for="n in 2" :key="n" :style="{
          width: n === (esReverso ? 2 : 1) ? '20px' : '8px',
          height:'8px', borderRadius:'4px',
          background: n === (esReverso ? 2 : 1) ? '#FFC801'
            : n < (esReverso ? 2 : 1) ? '#22c55e' : 'rgba(255,255,255,0.15)',
          transition:'all 0.3s ease',
        }"/>
      </div>
    </div>

    <!-- VERIFICANDO -->
    <div v-if="fase==='verificando'" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'14px',
    }">
      <div :style="{
        width:'38px', height:'38px', borderRadius:'50%',
        border:'3px solid rgba(255,255,255,0.1)',
        borderTopColor:'#FFC801', animation:'spin 0.7s linear infinite',
      }"/>
      <p :style="{ color:'rgba(255,255,255,0.4)', fontSize:'14px', fontWeight:'500' }">
        Verificando enlace...
      </p>
    </div>

    <!-- EXPIRADO -->
    <div v-else-if="fase==='expirado'" :style="{
      flex:'1', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'32px', gap:'18px', textAlign:'center',
    }">
      <div :style="{ fontSize:'52px' }">⏱️</div>
      <p :style="{ fontSize:'20px', fontWeight:'800' }">Enlace expirado</p>
      <p :style="{ color:'rgba(255,255,255,0.4)', fontSize:'14px', lineHeight:'1.6' }">
        Genera un nuevo código QR<br/>desde el formulario en tu computador.
      </p>
    </div>

    <!-- ERROR -->
    <div v-else-if="fase==='error'" :style="{
      flex:'1', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'32px', gap:'18px', textAlign:'center',
    }">
      <div :style="{ fontSize:'52px' }">⚠️</div>
      <p :style="{ fontSize:'18px', fontWeight:'700' }">Algo salió mal</p>
      <p :style="{ color:'rgba(255,255,255,0.4)', fontSize:'14px' }">{{ errorMsg }}</p>
    </div>

    <!-- LISTO FRENTE / REVERSO -->
    <div v-else-if="['listo_frente','listo_reverso'].includes(fase)" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'space-between',
      padding:'20px 28px 40px',
    }">
      <!-- Texto -->
      <div :style="{ textAlign:'center', paddingTop:'8px' }">
        <p :style="{
          fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em',
          textTransform:'uppercase', marginBottom:'10px',
          color: esReverso ? '#86efac' : '#FFC801',
        }">{{ esReverso ? '✓ Frente listo · Paso 2 de 2' : 'Paso 1 de 2' }}</p>
        <h1 :style="{
          fontSize:'26px', fontWeight:'800',
          letterSpacing:'-0.03em', lineHeight:'1.25', marginBottom:'10px',
        }">
          {{ esReverso ? 'Ahora fotografía' : 'Fotografía' }}<br/>
          <span :style="{ color:'rgba(255,255,255,0.45)' }">
            el {{ esReverso ? 'reverso' : 'frente' }} de tu cédula
          </span>
        </h1>
        <p :style="{
          color:'rgba(255,255,255,0.4)', fontSize:'13px',
          lineHeight:'1.6', fontWeight:'500',
        }">
          Ubica la cédula dentro del recuadro.<br/>
          Asegúrate que el texto sea legible.
        </p>
      </div>

      <!-- Ilustración cédula -->
      <div :style="{ position:'relative', width:'260px' }">
        <div :style="{
          width:'100%', paddingBottom:'63%', borderRadius:'14px',
          background: esReverso
            ? 'linear-gradient(135deg,#162230 0%,#1e2d3d 100%)'
            : 'linear-gradient(135deg,#1e2d3d 0%,#162230 100%)',
          border:'2px solid rgba(255,255,255,0.1)',
          position:'relative', overflow:'hidden',
          boxShadow:'0 24px 60px rgba(0,0,0,0.6)',
        }">
          <div :style="{
            position:'absolute', inset:'0', padding:'14px',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }">
            <div v-if="!esReverso" :style="{ display:'flex', gap:'10px', alignItems:'center' }">
              <div :style="{
                width:'36px', height:'44px', borderRadius:'5px',
                background:'rgba(255,200,1,0.12)',
                border:'1px solid rgba(255,200,1,0.18)',
                flexShrink:'0',
              }"/>
              <div :style="{ flex:'1' }">
                <div v-for="w in ['55%','80%','40%']" :key="w" :style="{
                  height:'6px', borderRadius:'3px',
                  background:'rgba(255,255,255,0.12)',
                  marginBottom:'5px', width:w,
                }"/>
              </div>
            </div>
            <div v-else :style="{
              display:'flex', alignItems:'center', justifyContent:'center',
              height:'100%', opacity:'0.3', fontSize:'32px',
            }">🔄</div>
            <div>
              <div v-for="w in ['70%','90%','50%']" :key="w" :style="{
                height:'5px', borderRadius:'3px',
                background:'rgba(255,255,255,0.07)',
                marginBottom:'4px', width:w,
              }"/>
            </div>
          </div>
        </div>
        <!-- Esquinas decorativas -->
        <div v-for="(s,i) in [
          {top:'-5px',left:'-5px',borderTop:'3px solid #FFC801',borderLeft:'3px solid #FFC801'},
          {top:'-5px',right:'-5px',borderTop:'3px solid #FFC801',borderRight:'3px solid #FFC801'},
          {bottom:'-5px',left:'-5px',borderBottom:'3px solid #FFC801',borderLeft:'3px solid #FFC801'},
          {bottom:'-5px',right:'-5px',borderBottom:'3px solid #FFC801',borderRight:'3px solid #FFC801'},
        ]" :key="i" :style="{
          position:'absolute', width:'18px', height:'18px', borderRadius:'2px', ...s,
        }"/>
      </div>

      <!-- Botones -->
      <div :style="{ width:'100%', display:'flex', flexDirection:'column', gap:'12px', alignItems:'center' }">
        <button :style="{
          width:'100%', padding:'17px', borderRadius:'16px',
          border:'none', background:'#FFC801', color:'#0d1117',
          fontFamily:'inherit', fontWeight:'800', fontSize:'16px',
          cursor:'pointer', display:'flex', alignItems:'center',
          justifyContent:'center', gap:'10px',
          boxShadow:'0 6px 28px rgba(255,200,1,0.4)',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
          letterSpacing:'-0.01em',
        }" @click="abrirVisor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Abrir cámara
        </button>
        <label :style="{
          color:'rgba(255,255,255,0.28)', fontSize:'13px', fontWeight:'500',
          cursor:'pointer', paddingBottom:'3px',
          borderBottom:'1px solid rgba(255,255,255,0.12)',
        }">
          o elige desde la galería
          <input type="file" accept="image/*" style="display:none" @change="onArchivoFallback"/>
        </label>
      </div>
    </div>

    <!-- VISOR DE CÁMARA -->
    <div v-else-if="fase==='visor'" :style="{
      position:'absolute', inset:'0', background:'#000',
    }">
      <video ref="videoRef" autoplay playsinline muted :style="{
        position:'absolute', inset:'0', width:'100%', height:'100%', objectFit:'cover',
      }"/>

      <!-- Silueta de cédula + overlay oscuro -->
      <div :style="{ position:'absolute', inset:'0', pointerEvents:'none' }">

        <!-- Marco con proporción real de cédula colombiana (85.6 × 54 mm = 1.585:1) -->
        <!-- box-shadow cubre toda la pantalla fuera del recuadro sin franjas adicionales -->
        <div :style="{
          position:'absolute',
          top:'40%', left:'50%',
          transform:'translate(-50%, -50%)',
          width:'84%',
          aspectRatio:'1.585',
          borderRadius:'10px',
          boxShadow:'0 0 0 9999px rgba(0,0,0,0.7)',
          border:'1.5px solid rgba(255,255,255,0.18)',
          overflow:'hidden',
        }">

          <!-- Esquinas amarillas -->
          <div :style="{ position:'absolute', top:'-1px', left:'-1px', width:'24px', height:'24px', borderTop:'3px solid #FFC801', borderLeft:'3px solid #FFC801', borderRadius:'4px 0 0 0', zIndex:2 }"/>
          <div :style="{ position:'absolute', top:'-1px', right:'-1px', width:'24px', height:'24px', borderTop:'3px solid #FFC801', borderRight:'3px solid #FFC801', borderRadius:'0 4px 0 0', zIndex:2 }"/>
          <div :style="{ position:'absolute', bottom:'-1px', left:'-1px', width:'24px', height:'24px', borderBottom:'3px solid #FFC801', borderLeft:'3px solid #FFC801', borderRadius:'0 0 0 4px', zIndex:2 }"/>
          <div :style="{ position:'absolute', bottom:'-1px', right:'-1px', width:'24px', height:'24px', borderBottom:'3px solid #FFC801', borderRight:'3px solid #FFC801', borderRadius:'0 0 4px 0', zIndex:2 }"/>

          <!-- Silueta FRENTE de cédula colombiana -->
          <div v-if="!esReverso" :style="{
            position:'absolute', inset:'0',
            display:'flex', flexDirection:'column',
            padding:'9% 7% 7%', gap:'7%',
          }">
            <!-- Cabecera: escudo + nombre institución -->
            <div :style="{ display:'flex', alignItems:'center', gap:'4%' }">
              <div :style="{
                width:'11%', aspectRatio:'1',
                borderRadius:'50%',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                flexShrink:0,
              }"/>
              <div :style="{ flex:1, display:'flex', flexDirection:'column', gap:'4px' }">
                <div :style="{ height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.1)', width:'60%' }"/>
                <div :style="{ height:'3px', borderRadius:'2px', background:'rgba(255,255,255,0.06)', width:'40%' }"/>
              </div>
            </div>
            <!-- Cuerpo: foto + datos -->
            <div :style="{ flex:1, display:'flex', gap:'6%' }">
              <!-- Foto -->
              <div :style="{
                width:'27%', flexShrink:0,
                borderRadius:'4px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
              }"/>
              <!-- Líneas de datos -->
              <div :style="{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-around', paddingTop:'3%' }">
                <div v-for="(w, i) in ['82%','65%','72%','50%']" :key="i" :style="{
                  height:'5px', borderRadius:'2px',
                  background:'rgba(255,255,255,0.09)', width:w,
                }"/>
              </div>
            </div>
            <!-- Zona MRZ inferior -->
            <div :style="{ display:'flex', flexDirection:'column', gap:'3px' }">
              <div v-for="n in 2" :key="n" :style="{ height:'4px', borderRadius:'1px', background:'rgba(255,255,255,0.05)', width:'100%' }"/>
            </div>
          </div>

          <!-- Silueta REVERSO de cédula colombiana -->
          <div v-else :style="{
            position:'absolute', inset:'0',
            display:'flex', flexDirection:'column',
            justifyContent:'space-between',
            padding:'9% 7% 8%',
          }">
            <!-- Chip + datos -->
            <div :style="{ display:'flex', gap:'5%', alignItems:'center' }">
              <div :style="{
                width:'17%', aspectRatio:'1.3',
                borderRadius:'3px',
                background:'rgba(255,200,1,0.06)',
                border:'1px solid rgba(255,200,1,0.14)',
                flexShrink:0,
              }"/>
              <div :style="{ flex:1, display:'flex', flexDirection:'column', gap:'5px' }">
                <div v-for="w in ['75%','55%']" :key="w" :style="{ height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.08)', width:w }"/>
              </div>
            </div>
            <!-- Código de barras -->
            <div :style="{ display:'flex', gap:'2px', height:'16%', alignItems:'stretch' }">
              <div v-for="n in 22" :key="n" :style="{
                flex:n%5===0?2:1,
                background:'rgba(255,255,255,0.07)',
                borderRadius:'1px',
              }"/>
            </div>
            <!-- MRZ -->
            <div :style="{ display:'flex', flexDirection:'column', gap:'3px' }">
              <div v-for="n in 3" :key="n" :style="{ height:'4px', borderRadius:'1px', background:'rgba(255,255,255,0.06)', width:'100%' }"/>
            </div>
          </div>

          <!-- Línea de escaneo animada -->
          <div class="scan-line" :style="{
            position:'absolute', left:'0', right:'0', height:'2px',
            background:'linear-gradient(90deg,transparent 0%,rgba(255,200,1,0.55) 20%,rgba(255,200,1,0.9) 50%,rgba(255,200,1,0.55) 80%,transparent 100%)',
            boxShadow:'0 0 8px rgba(255,200,1,0.35)',
          }"/>
        </div>

        <!-- Etiqueta instrucción sobre el marco -->
        <div :style="{ position:'absolute', top:'18%', left:'0', right:'0', textAlign:'center' }">
          <span :style="{
            background:'rgba(0,0,0,0.6)', WebkitBackdropFilter:'blur(10px)',
            backdropFilter:'blur(10px)', borderRadius:'20px', padding:'7px 18px',
            fontSize:'13px', fontWeight:'700', color:'#fff',
            letterSpacing:'0.01em', display:'inline-block',
          }">{{ esReverso ? 'Reverso' : 'Frente' }} · Centra la cédula</span>
        </div>

        <!-- Hint debajo del marco -->
        <div :style="{ position:'absolute', top:'58%', left:'0', right:'0', textAlign:'center' }">
          <p :style="{
            fontSize:'12px', fontWeight:'500',
            color:'rgba(255,255,255,0.38)', letterSpacing:'0.01em', margin:0,
          }">Mantén la cédula plana y sin reflejos</p>
        </div>
      </div>

      <!-- Botón disparador con safe-area para iOS -->
      <div :style="{
        position:'absolute', bottom:'0', left:'0', right:'0',
        paddingTop:'20px',
        paddingBottom:'max(44px, env(safe-area-inset-bottom, 44px))',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)',
      }">
        <button :style="{
          width:'76px', height:'76px', borderRadius:'50%',
          border:'4px solid rgba(255,255,255,0.85)',
          background:'rgba(255,255,255,0.15)',
          cursor:'pointer', display:'flex',
          alignItems:'center', justifyContent:'center',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
          transition:'transform 0.1s ease',
        }"
          @click="capturar"
          @touchstart.passive="e => e.currentTarget.style.transform='scale(0.9)'"
          @touchend.passive="e => e.currentTarget.style.transform='scale(1)'"
        >
          <div :style="{ width:'56px', height:'56px', borderRadius:'50%', background:'#fff' }"/>
        </button>
      </div>

      <canvas ref="canvasRef" style="display:none"/>

      <!-- Cancelar con safe-area-inset-top para notch iOS -->
      <button :style="{
        position:'absolute',
        top:'max(12px, env(safe-area-inset-top, 12px))',
        left:'14px',
        background:'rgba(0,0,0,0.5)', WebkitBackdropFilter:'blur(8px)',
        backdropFilter:'blur(8px)',
        border:'none', borderRadius:'10px', color:'rgba(255,255,255,0.8)',
        padding:'8px 14px', fontSize:'13px', fontWeight:'600',
        cursor:'pointer', WebkitTapHighlightColor:'transparent',
      }" @click="detenerCamara(); fase = esReverso ? 'listo_reverso' : 'listo_frente'">
        ✕ Cancelar
      </button>
    </div>

    <!-- SIN CÁMARA -->
    <div v-else-if="fase==='sin_camara'" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'32px', gap:'20px', textAlign:'center',
    }">
      <div :style="{ fontSize:'48px' }">📷</div>
      <p :style="{ fontSize:'17px', fontWeight:'700' }">Cámara no disponible</p>
      <p :style="{ color:'rgba(255,255,255,0.4)', fontSize:'13px', lineHeight:'1.6' }">
        Tu navegador no pudo acceder a la cámara.<br/>Sube la foto desde tu galería.
      </p>
      <label :style="{
        padding:'16px 32px', borderRadius:'14px',
        background:'#FFC801', color:'#0d1117',
        fontWeight:'800', fontSize:'15px', cursor:'pointer',
      }">
        📁 Elegir desde galería
        <input type="file" accept="image/*" style="display:none" @change="onArchivoFallback"/>
      </label>
    </div>

    <!-- PREVISUALIZANDO frente o reverso -->
    <div v-else-if="['previsualizando','previsualizando2'].includes(fase)" :style="{
      position:'absolute', inset:'0', background:'#000',
    }">
      <!-- Foto ocupa toda la pantalla -->
      <img :src="fotoPreview" :style="{
        position:'absolute', inset:'0',
        width:'100%', height:'100%', objectFit:'cover', display:'block',
      }"/>

      <!-- Badge FRENTE / REVERSO -->
      <div :style="{
        position:'absolute', top:'max(14px, env(safe-area-inset-top, 14px))', left:'14px',
        background:'rgba(0,0,0,0.55)', WebkitBackdropFilter:'blur(8px)', backdropFilter:'blur(8px)',
        borderRadius:'8px', padding:'5px 12px',
        fontSize:'11px', fontWeight:'800',
        color: fase==='previsualizando' ? '#FFC801' : '#86efac',
        textTransform:'uppercase', letterSpacing:'0.08em',
      }">
        {{ fase==='previsualizando' ? 'FRENTE' : 'REVERSO' }}
      </div>

      <!-- Panel acciones sticky sobre la foto -->
      <div :style="{
        position:'absolute', bottom:'0', left:'0', right:'0',
        paddingTop:'40px',
        paddingBottom:'max(28px, env(safe-area-inset-bottom, 28px))',
        paddingLeft:'20px', paddingRight:'20px',
        background:'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.97) 100%)',
        display:'flex', flexDirection:'column', gap:'10px',
      }">
        <p :style="{
          textAlign:'center', fontSize:'13px',
          color:'rgba(255,255,255,0.6)', fontWeight:'500', marginBottom:'2px',
        }">¿El texto es claro y legible?</p>

        <button :disabled="subiendo" :style="{
          padding:'15px', borderRadius:'14px', border:'none',
          background: subiendo ? 'rgba(255,200,1,0.3)' : '#FFC801',
          color: subiendo ? 'rgba(255,200,1,0.5)' : '#0d1117',
          fontFamily:'inherit', fontWeight:'800', fontSize:'15px',
          cursor: subiendo ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          WebkitTapHighlightColor:'transparent',
        }" @click="confirmar">
          <div v-if="subiendo" :style="{
            width:'16px', height:'16px', borderRadius:'50%',
            border:'2.5px solid rgba(0,0,0,0.2)',
            borderTopColor:'#0d1117', animation:'spin 0.7s linear infinite',
          }"/>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ subiendo ? 'Enviando...' : 'Sí, usar esta foto' }}
        </button>

        <button :disabled="subiendo" :style="{
          padding:'13px', borderRadius:'14px',
          border:'1.5px solid rgba(255,255,255,0.15)',
          background:'rgba(255,255,255,0.08)',
          color: subiendo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
          fontFamily:'inherit', fontWeight:'600', fontSize:'14px',
          cursor: subiendo ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          WebkitTapHighlightColor:'transparent',
        }" @click="retomar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.36"/>
          </svg>
          Tomar de nuevo
        </button>

        <div v-if="errorMsg" :style="{
          padding:'10px 14px', borderRadius:'10px',
          background:'rgba(239,68,68,0.15)',
          border:'1px solid rgba(239,68,68,0.3)',
          color:'#fca5a5', fontSize:'13px', fontWeight:'500',
          display:'flex', alignItems:'center', gap:'8px',
        }">⚠️ {{ errorMsg }}</div>
      </div>
    </div>

    <!-- COMPLETADO -->
    <div v-else-if="fase==='completado'" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'32px 28px', gap:'26px', textAlign:'center',
    }">
      <div :style="{
        width:'80px', height:'80px', borderRadius:'50%',
        background:'rgba(34,197,94,0.1)',
        border:'2px solid rgba(34,197,94,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'40px',
      }">✅</div>
      <div>
        <p :style="{
          fontSize:'26px', fontWeight:'800',
          letterSpacing:'-0.03em', marginBottom:'10px',
        }">¡Todo listo!</p>
        <p :style="{ color:'rgba(255,255,255,0.4)', fontSize:'14px', lineHeight:'1.7' }">
          Ambas fotos fueron enviadas.<br/>
          Cierra esta ventana y continúa<br/>
          <strong :style="{ color:'rgba(255,255,255,0.7)' }">en tu computador.</strong>
        </p>
      </div>
      <div :style="{
        display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:'10px', width:'100%', maxWidth:'260px',
      }">
        <div v-for="(url, nombre) in { Frente: urlFrente, Reverso: urlReverso }" :key="nombre">
          <p :style="{
            fontSize:'10px', fontWeight:'700', textTransform:'uppercase',
            letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', marginBottom:'5px',
          }">{{ nombre }}</p>
          <img :src="url" :alt="nombre" :style="{
            width:'100%', borderRadius:'10px',
            border:'2px solid rgba(34,197,94,0.25)',
            aspectRatio:'1.585', objectFit:'cover', display:'block',
          }"/>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="fase !== 'visor'" :style="{
      flexShrink:'0', textAlign:'center',
      padding:'10px', fontSize:'10px',
      color:'rgba(255,255,255,0.15)', fontWeight:'500',
    }">
      COOPERATIVA MULTIACTIVA LUIS AMIGÓ - COOPERAMIGÓ · NIT 800.191.482-7
    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes scan {
  0%, 100% { top: 6%; }
  50% { top: 88%; }
}
.scan-line { animation: scan 2.4s ease-in-out infinite; }
* { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
video { transform: scaleX(1); }
</style>
