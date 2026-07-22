<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const token = computed(() => route.params.token)
// Esta pestaña la abrió el propio formulario en el mismo celular (no un QR
// escaneado desde otro dispositivo) — al terminar debe cerrarse sola en vez
// de pedir "continúe en su computador".
const esMismoDispositivo = computed(() => route.query.mismo === '1')

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

// Marco guía: se dibuja vertical mientras el celular está en vertical, para que la
// persona lo gire físicamente (no es una rotación por software/CSS ni bloquea nada).
// Al rotar el celular de verdad, el navegador reacomoda el viewport y el marco pasa
// a horizontal automáticamente.
const esPortrait = ref(window.innerHeight >= window.innerWidth)
function onResize() { esPortrait.value = window.innerHeight >= window.innerWidth }
window.addEventListener('resize', onResize)
onUnmounted(() => window.removeEventListener('resize', onResize))

// Paso actual
const esReverso = computed(() => !!urlFrente.value)
const labelPaso = computed(() => esReverso.value ? 'Reverso' : 'Frente')

async function verificarEnlace() {
  fase.value = 'verificando'
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
}

onMounted(verificarEnlace)

onUnmounted(detenerCamara)

function detenerCamara() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
}

async function abrirVisor() {
  errorMsg.value = ''
  fase.value = 'visor'
  await nextTick()

  // Si ya hay una cámara activa (p.ej. venimos de fotografiar el frente), la
  // reutilizamos en lugar de pedir permiso/stream de nuevo — así se pasa
  // directo al reverso sin volver a mostrar "Abrir cámara".
  if (stream) {
    if (videoRef.value) { videoRef.value.srcObject = stream; await videoRef.value.play() }
    return
  }

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

// Debe coincidir con el marco guía dibujado sobre el <video> (ver template, fase==='visor').
// En vertical el marco se dibuja vertical (para invitar a girar el celular); en
// horizontal (tras el giro físico) se dibuja horizontal, como la cédula real.
const GUIA_PCT_LANDSCAPE = 0.94  // % del ancho, cuando el celular ya está horizontal
const GUIA_PCT_PORTRAIT  = 0.68  // % del alto, mientras el celular sigue vertical
const GUIA_ASPECTO   = 1.585     // aspectRatio cédula colombiana
const GUIA_TOP_PCT   = 0.44      // top: 44% (centro vertical del marco)

function capturar() {
  const video  = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  const videoW = video.videoWidth  || 1280
  const videoH = video.videoHeight || 720
  const vpW = window.innerWidth
  const vpH = window.innerHeight
  const portrait = vpH >= vpW

  // El <video> se muestra con object-fit: cover — replicar ese mismo escalado
  // para saber qué región del video real corresponde al marco guía en pantalla.
  const scale = Math.max(vpW / videoW, vpH / videoH)
  const offsetX = (videoW * scale - vpW) / 2
  const offsetY = (videoH * scale - vpH) / 2

  let guiaAnchoPantalla, guiaAltoPantalla
  if (portrait) {
    guiaAltoPantalla  = vpH * GUIA_PCT_PORTRAIT
    guiaAnchoPantalla = guiaAltoPantalla / GUIA_ASPECTO
  } else {
    guiaAnchoPantalla = vpW * GUIA_PCT_LANDSCAPE
    guiaAltoPantalla  = guiaAnchoPantalla / GUIA_ASPECTO
  }
  const guiaLeftPantalla  = (vpW - guiaAnchoPantalla) / 2
  const guiaTopPantalla   = vpH * GUIA_TOP_PCT - guiaAltoPantalla / 2

  // Clamp por seguridad: el marco guía nunca debería salirse del video real,
  // pero si el navegador reporta dimensiones inusuales evitamos un crop inválido.
  const sx = Math.max(0, Math.min(videoW - 1, (guiaLeftPantalla + offsetX) / scale))
  const sy = Math.max(0, Math.min(videoH - 1, (guiaTopPantalla  + offsetY) / scale))
  const sw = Math.max(1, Math.min(videoW - sx, guiaAnchoPantalla / scale))
  const sh = Math.max(1, Math.min(videoH - sy, guiaAltoPantalla  / scale))

  canvas.width  = Math.round(sw)
  canvas.height = Math.round(sh)
  canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  // BUG 1: canvas.toBlob() es asíncrono con callback — envolver en Promise
  new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88)
  }).then((blob) => {
    if (!blob) {
      errorMsg.value = 'No se pudo capturar la foto. Inténtelo de nuevo.'
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
    errorMsg.value = 'No hay foto para enviar. Tome una foto primero.'
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
    errorMsg.value = e.message || 'Error al enviar la foto. Inténtelo de nuevo.'
    // NO cambiar fase — quedarse en previsualizando para poder reintentar
  } finally {
    subiendo.value = false  // SIEMPRE desbloquear el botón
  }
}

// Si esta pestaña la abrió el propio formulario en el mismo celular, se
// cierra sola al terminar — el formulario ya está escuchando el resultado
// por realtime/polling en la pestaña original.
watch(fase, (v) => {
  if (v === 'completado' && esMismoDispositivo.value) {
    setTimeout(cerrarPestana, 1400)
  }
})

function cerrarPestana() {
  // window.close() a secas lo bloquean varios navegadores (sobre todo Safari
  // iOS) si no reconocen la pestaña como "abierta por script" — reclamarla
  // primero con window.open('', '_self') es el workaround estándar para eso.
  try { window.open('', '_self') } catch { /* noop */ }
  window.close()
}
</script>

<template>
  <div :style="{
    position:'fixed', inset:'0', background:'var(--color-bg-card)',
    display:'flex', flexDirection:'column',
    fontFamily:'var(--font-body)',
    color:'var(--color-text-1)', overflow:'hidden', userSelect:'none',
  }">


    <!-- VERIFICANDO -->
    <div v-if="fase==='verificando'" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'14px',
    }">
      <div :style="{
        width:'38px', height:'38px', borderRadius:'50%',
        border:'3px solid var(--color-border)',
        borderTopColor:'var(--color-primary)', animation:'spin 0.7s linear infinite',
      }"/>
      <p :style="{ color:'var(--color-text-3)', fontSize:'14px', fontWeight:'500' }">
        Verificando enlace...
      </p>
    </div>

    <!-- EXPIRADO -->
    <div v-else-if="fase==='expirado'" :style="{
      flex:'1', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'32px', gap:'18px', textAlign:'center',
    }">
      <div :style="{
        width:'64px', height:'64px', borderRadius:'50%',
        background:'var(--color-bg-surface-alt)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      </div>
      <p :style="{ fontSize:'22px', fontWeight:'800', color:'var(--color-primary)', margin:'0' }">Enlace expirado</p>
      <p :style="{ color:'var(--color-text-3)', fontSize:'14px', lineHeight:'1.6', margin:'0' }">
        Genere un nuevo código QR<br/>en su computador.
      </p>
    </div>

    <!-- ERROR -->
    <div v-else-if="fase==='error'" :style="{
      flex:'1', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'32px', gap:'18px', textAlign:'center',
    }">
      <div :style="{
        width:'64px', height:'64px', borderRadius:'50%',
        background:'var(--color-bg-surface-alt)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.36 3.94 2.72 17.4A1.5 1.5 0 0 0 4 19.7h16a1.5 1.5 0 0 0 1.3-2.3L13.64 3.94a1.5 1.5 0 0 0-2.6 0Z"/><path d="M12 16h.01"/></svg>
      </div>
      <p :style="{ fontSize:'22px', fontWeight:'800', color:'var(--color-primary)', margin:'0' }">Algo salió mal</p>
      <p :style="{ color:'var(--color-text-3)', fontSize:'14px', margin:'0' }">{{ errorMsg }}</p>
      <button :style="{
        padding:'13px 28px', borderRadius:'999px', border:'none',
        background:'var(--color-primary)', color:'#fff',
        fontFamily:'inherit', fontWeight:'800', fontSize:'15px', cursor:'pointer',
        WebkitTapHighlightColor:'transparent',
      }" @click="verificarEnlace">
        Reintentar
      </button>
    </div>

    <!-- LISTO FRENTE / REVERSO -->
    <div v-else-if="['listo_frente','listo_reverso'].includes(fase)" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', overflow:'auto',
      padding:'0 24px 28px',
    }">
      <!-- Texto -->
      <div :style="{ textAlign:'center', marginBottom:'20px' }">
        <h1 :style="{
          fontSize:'22px', fontWeight:'800', color:'var(--color-primary)',
          letterSpacing:'-0.02em', margin:'0 0 2px',
        }">
          Fotografía {{ esReverso ? 'del reverso' : 'del frente' }} de su cédula
        </h1>
        <p :style="{
          color:'var(--color-text-3)', fontSize:'13px',
          lineHeight:'1.5', fontWeight:'500', margin:'0',
        }">
          Ubique la cédula dentro del recuadro. Asegúrese que el texto sea legible.
        </p>
      </div>

      <!-- Marco guía con ilustración -->
      <div :style="{
        width:'100%', maxWidth:'400px',
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:'28px',
      }">
        <div :style="{
          position:'relative', width:'100%', aspectRatio:'1.3',
          background:'var(--color-bg-surface-alt)', borderRadius:'20px',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'24px', boxSizing:'border-box',
        }">
          <!-- Marco punteado -->
          <div :style="{
            position:'absolute', inset:'22px',
            border:'2px dashed var(--color-border)', borderRadius:'14px',
          }"/>
          <!-- Esquinas -->
          <div v-for="(s,i) in [
            {top:'22px',left:'22px',borderTop:'3px solid var(--color-primary)',borderLeft:'3px solid var(--color-primary)',borderRadius:'14px 0 0 0'},
            {top:'22px',right:'22px',borderTop:'3px solid var(--color-primary)',borderRight:'3px solid var(--color-primary)',borderRadius:'0 14px 0 0'},
            {bottom:'22px',left:'22px',borderBottom:'3px solid var(--color-primary)',borderLeft:'3px solid var(--color-primary)',borderRadius:'0 0 0 14px'},
            {bottom:'22px',right:'22px',borderBottom:'3px solid var(--color-primary)',borderRight:'3px solid var(--color-primary)',borderRadius:'0 0 14px 0'},
          ]" :key="i" :style="{ position:'absolute', width:'26px', height:'26px', ...s }"/>

          <!-- Tarjeta ilustrativa: silueta de cédula colombiana -->
          <div class="illustrative-card" :style="{
            width:'72%', aspectRatio:'1.585', background:'#fff',
            borderRadius:'10px', border:'1px solid var(--color-border)',
            boxShadow:'0 8px 24px rgba(17,76,90,0.08)',
            display:'flex', flexDirection:'column', padding:'10px 14px', gap:'8px',
            boxSizing:'border-box',
          }">
            <template v-if="!esReverso">
              <!-- Encabezado: bandera + "REPÚBLICA DE COLOMBIA" -->
              <div :style="{ display:'flex', alignItems:'center', gap:'6px' }">
                <div :style="{ width:'16px', height:'11px', borderRadius:'2px', flexShrink:'0', overflow:'hidden', display:'flex', flexDirection:'column' }">
                  <div :style="{ flex:'2', background:'#FFC801' }"/>
                  <div :style="{ flex:'1', background:'var(--color-border)' }"/>
                  <div :style="{ flex:'1', background:'var(--color-border)' }"/>
                </div>
                <div class="shimmer-bar" :style="{ height:'7px', borderRadius:'2px', width:'62%' }"/>
              </div>
              <!-- Cuerpo: foto + datos -->
              <div :style="{ flex:'1', display:'flex', gap:'10px' }">
                <div :style="{
                  width:'26%', borderRadius:'4px', flexShrink:'0',
                  background:'var(--color-border-light)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div :style="{ flex:'1', display:'flex', flexDirection:'column', justifyContent:'center', gap:'6px' }">
                  <div v-for="w in ['40%','80%','35%','65%']" :key="w" class="shimmer-bar" :style="{ height:'4px', borderRadius:'2px', width:w }"/>
                </div>
              </div>
              <!-- Pie: fecha/lugar de expedición -->
              <div v-for="w in ['55%','30%']" :key="w" class="shimmer-bar" :style="{ height:'4px', borderRadius:'2px', width:w }"/>
            </template>
            <template v-else>
              <!-- Encabezado: código + QR -->
              <div :style="{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px' }">
                <div :style="{ display:'flex', flexDirection:'column', gap:'5px', paddingTop:'2px', flex:'1' }">
                  <div v-for="w in ['70%','45%']" :key="w" class="shimmer-bar" :style="{ height:'4px', borderRadius:'2px', width:w }"/>
                </div>
                <div :style="{
                  width:'30%', aspectRatio:'1', flexShrink:'0', borderRadius:'3px',
                  background:'var(--color-border-light)', display:'grid',
                  gridTemplateColumns:'repeat(4, 1fr)', gridTemplateRows:'repeat(4, 1fr)', gap:'2px', padding:'4px',
                }">
                  <div v-for="n in 16" :key="n" :style="{ background: [0,1,3,4,6,9,11,12,14,15].includes(n-1) ? 'var(--color-border)' : 'transparent', borderRadius:'1px' }"/>
                </div>
              </div>
              <!-- Código de barras -->
              <div :style="{ display:'flex', gap:'2px', height:'22%', alignItems:'stretch' }">
                <div v-for="n in 22" :key="n" class="shimmer-bar" :style="{ flex:n%5===0?2:1, borderRadius:'1px' }"/>
              </div>
              <!-- MRZ -->
              <div :style="{ flex:'1', display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:'4px' }">
                <div v-for="n in 3" :key="n" class="shimmer-bar" :style="{ height:'4px', borderRadius:'1px', width:'100%' }"/>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div :style="{ width:'100%', maxWidth:'360px', display:'flex', flexDirection:'column', gap:'14px', flexShrink:'0' }">
        <button :style="{
          width:'100%', padding:'16px', borderRadius:'999px',
          border:'none', background:'var(--color-primary)', color:'#fff',
          fontFamily:'inherit', fontWeight:'800', fontSize:'15px',
          cursor:'pointer', display:'flex', alignItems:'center',
          justifyContent:'center', gap:'10px',
          WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
          letterSpacing:'-0.01em',
        }" @click="abrirVisor">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Abrir cámara
        </button>

        <div :style="{ display:'flex', alignItems:'center', gap:'10px' }">
          <div :style="{ flex:'1', height:'1px', background:'var(--color-border)' }"/>
          <span :style="{ fontSize:'12px', color:'var(--color-text-3)', fontWeight:'600' }">o</span>
          <div :style="{ flex:'1', height:'1px', background:'var(--color-border)' }"/>
        </div>

        <label :style="{
          width:'100%', padding:'15px', borderRadius:'999px',
          border:'none', background:'var(--color-bg-surface-alt)',
          color:'var(--color-text-2)',
          fontWeight:'700', fontSize:'14px',
          cursor:'pointer', display:'flex', alignItems:'center',
          justifyContent:'center', gap:'8px',
          WebkitTapHighlightColor:'transparent', boxSizing:'border-box',
        }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          Seleccionar desde la galería
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
          top:'44%', left:'50%',
          transform:'translate(-50%, -50%)',
          ...(esPortrait
            ? { height:'68%', width:'auto' }
            : { width:'94%', height:'auto' }),
          aspectRatio: esPortrait ? '0.631' : '1.585',
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

          <!-- Rota la silueta 90° cuando el marco está vertical, para que la cédula -->
          <!-- (que siempre es horizontal) se vea correctamente orientada dentro del marco. -->
          <div :style="{ position:'absolute', inset:'0', containerType:'size' }">
          <div :style="{
            position:'absolute', top:'50%', left:'50%',
            width:  esPortrait ? '100cqh' : '100cqw',
            height: esPortrait ? '100cqw' : '100cqh',
            transform: esPortrait ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)',
          }">
          <!-- Silueta FRENTE de cédula colombiana -->
          <div v-if="!esReverso" :style="{
            position:'absolute', inset:'0',
            display:'flex', flexDirection:'column',
            padding:'9% 7% 7%', gap:'6%',
          }">
            <!-- Cabecera: bandera + "REPÚBLICA DE COLOMBIA" -->
            <div :style="{ display:'flex', alignItems:'center', gap:'4%' }">
              <div :style="{
                width:'12%', aspectRatio:'1.55', borderRadius:'2px', flexShrink:0,
                overflow:'hidden', display:'flex', flexDirection:'column',
              }">
                <div :style="{ flex:'2', background:'rgba(255,200,1,0.35)' }"/>
                <div :style="{ flex:'1', background:'rgba(255,255,255,0.18)' }"/>
                <div :style="{ flex:'1', background:'rgba(255,255,255,0.18)' }"/>
              </div>
              <div :style="{ height:'5px', borderRadius:'2px', background:'rgba(255,255,255,0.14)', width:'60%' }"/>
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
                <div v-for="(w, i) in ['40%','82%','35%','65%']" :key="i" :style="{
                  height:'5px', borderRadius:'2px',
                  background:'rgba(255,255,255,0.09)', width:w,
                }"/>
              </div>
            </div>
            <!-- Pie: fecha/lugar de expedición -->
            <div :style="{ display:'flex', flexDirection:'column', gap:'4px' }">
              <div :style="{ height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.07)', width:'55%' }"/>
              <div :style="{ height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.05)', width:'30%' }"/>
            </div>
          </div>

          <!-- Silueta REVERSO de cédula colombiana -->
          <div v-else :style="{
            position:'absolute', inset:'0',
            display:'flex', flexDirection:'column',
            justifyContent:'space-between',
            padding:'9% 7% 8%',
          }">
            <!-- Código + QR -->
            <div :style="{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'5%' }">
              <div :style="{ flex:1, display:'flex', flexDirection:'column', gap:'5px', paddingTop:'2%' }">
                <div v-for="w in ['65%','42%']" :key="w" :style="{ height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.08)', width:w }"/>
              </div>
              <div :style="{
                width:'22%', aspectRatio:'1', flexShrink:0, borderRadius:'3px',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gridTemplateRows:'repeat(4, 1fr)', gap:'2px', padding:'8%',
              }">
                <div v-for="n in 16" :key="n" :style="{ background: [0,1,3,4,6,9,11,12,14,15].includes(n-1) ? 'rgba(255,255,255,0.28)' : 'transparent', borderRadius:'1px' }"/>
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
        <div :style="{ position:'absolute', top:'max(3%, env(safe-area-inset-top, 3%))', left:'0', right:'0', textAlign:'center' }">
          <span :style="{
            background:'#fff', borderRadius:'999px', padding:'7px 18px',
            fontSize:'13px', fontWeight:'700', color:'var(--color-primary)',
            letterSpacing:'0.01em', display:'inline-block',
            boxShadow:'0 2px 10px rgba(0,0,0,0.25)',
          }">{{ esReverso ? 'Reverso del documento' : 'Frente del documento' }}</span>
        </div>

      </div>

      <!-- Botón disparador con safe-area para iOS -->
      <div :style="{
        position:'absolute', bottom:'0', left:'0', right:'0',
        paddingTop:'20px',
        paddingBottom:'max(44px, env(safe-area-inset-bottom, 44px))',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px',
        background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)',
      }">
        <button aria-label="Tomar fotografía" :style="{
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
      <button aria-label="Cerrar cámara" :style="{
        position:'absolute',
        top:'max(12px, env(safe-area-inset-top, 12px))',
        right:'14px',
        width:'34px', height:'34px', borderRadius:'50%',
        background:'rgba(0,0,0,0.5)', WebkitBackdropFilter:'blur(8px)',
        backdropFilter:'blur(8px)',
        border:'none', color:'rgba(255,255,255,0.8)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', WebkitTapHighlightColor:'transparent',
      }" @click="detenerCamara(); fase = esReverso ? 'listo_reverso' : 'listo_frente'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- SIN CÁMARA -->
    <div v-else-if="fase==='sin_camara'" :style="{
      flex:'1', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'32px', gap:'20px', textAlign:'center',
    }">
      <div :style="{
        width:'64px', height:'64px', borderRadius:'50%',
        background:'var(--color-bg-surface-alt)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3l18 18"/>
          <path d="M9 4h2l1.5 2H17a2 2 0 0 1 2 2v8.5M17.5 19H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h.5"/>
          <path d="M9.17 15.17a3 3 0 1 0 4.24-4.24"/>
        </svg>
      </div>
      <p :style="{ fontSize:'22px', fontWeight:'800', color:'var(--color-primary)', margin:'0' }">Cámara no disponible</p>
      <p :style="{ color:'var(--color-text-3)', fontSize:'13px', lineHeight:'1.6', margin:'0' }">
        Su navegador no pudo acceder a la cámara.<br/>Suba la foto desde su galería.
      </p>
      <label :style="{
        padding:'15px 32px', borderRadius:'999px',
        background:'var(--color-primary)', color:'#fff',
        fontWeight:'800', fontSize:'15px', cursor:'pointer',
        display:'flex', alignItems:'center', gap:'8px',
        WebkitTapHighlightColor:'transparent',
      }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        Elegir desde galería
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
        background:'#fff', borderRadius:'999px', padding:'5px 12px',
        fontSize:'11px', fontWeight:'800',
        color:'var(--color-primary)',
        textTransform:'uppercase', letterSpacing:'0.08em',
        boxShadow:'0 2px 10px rgba(0,0,0,0.25)',
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
          padding:'15px', borderRadius:'999px', border:'none',
          background: subiendo ? 'rgba(17,76,90,0.4)' : 'var(--color-primary)',
          color: subiendo ? 'rgba(255,255,255,0.5)' : '#fff',
          fontFamily:'inherit', fontWeight:'800', fontSize:'15px',
          cursor: subiendo ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          WebkitTapHighlightColor:'transparent',
        }" @click="confirmar">
          <div v-if="subiendo" :style="{
            width:'16px', height:'16px', borderRadius:'50%',
            border:'2.5px solid rgba(255,255,255,0.3)',
            borderTopColor:'#fff', animation:'spin 0.7s linear infinite',
          }"/>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ subiendo ? 'Enviando...' : 'Sí, usar esta foto' }}
        </button>

        <button :disabled="subiendo" :style="{
          padding:'13px', borderRadius:'999px',
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
      padding:'32px 28px', gap:'20px', textAlign:'center',
    }">
      <div :style="{
        width:'64px', height:'64px', borderRadius:'50%',
        background:'var(--color-bg-surface-alt)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <p :style="{
          fontSize:'22px', fontWeight:'800', color:'var(--color-primary)', margin:'0 0 6px',
        }">¡Todo listo!</p>
        <p :style="{ color:'var(--color-text-3)', fontSize:'14px', lineHeight:'1.6', margin:'0' }">
          Ambas fotos fueron enviadas.<br/>
          <template v-if="esMismoDispositivo">Volviendo a su solicitud…</template>
          <template v-else>Cierre esta ventana y continúe en su computador.</template>
        </p>
      </div>

      <div :style="{
        width:'100%', maxWidth:'260px', display:'flex', flexDirection:'column', gap:'8px',
        background:'var(--color-bg-surface-alt)', borderRadius:'14px', padding:'14px 18px',
      }">
        <div v-for="nombre in ['Frente', 'Reverso']" :key="nombre" :style="{
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }">
          <span :style="{ fontSize:'13px', fontWeight:'600', color:'var(--color-text-1)' }">{{ nombre }} del documento</span>
          <span :style="{
            width:'18px', height:'18px', borderRadius:'50%',
            background:'var(--color-primary)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:'0',
          }">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </div>
      </div>

      <button v-if="esMismoDispositivo" :style="{
        padding:'13px 28px', borderRadius:'999px', border:'none',
        background:'var(--color-primary)', color:'#fff',
        fontFamily:'inherit', fontWeight:'800', fontSize:'14px',
        cursor:'pointer', WebkitTapHighlightColor:'transparent',
      }" @click="cerrarPestana">
        Volver al formulario
      </button>
    </div>

    <!-- Footer -->
    <div v-if="fase !== 'visor'" :style="{
      flexShrink:'0', textAlign:'center',
      padding:'10px', fontSize:'11px',
      color:'var(--color-text-3)', fontWeight:'500',
    }">
      Cooperativa Multiactiva Luis Amigó NIT. 800.191.482-7 · www.cooperamigo.coop<br/>
      © 2026. Todos los derechos reservados.
    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rotateHint {
  0%, 100% { transform: rotate(0deg); }
  50%      { transform: rotate(-90deg); }
}
.rotate-hint { animation: rotateHint 1.6s ease-in-out infinite; }
@keyframes scan {
  0%, 100% { top: 6%; }
  50% { top: 88%; }
}
.scan-line { animation: scan 2.4s ease-in-out infinite; }
* { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
video { transform: scaleX(1); }

@keyframes cardBreathe {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(17,76,90,0.08); }
  50%      { transform: scale(1.02); box-shadow: 0 12px 30px rgba(17,76,90,0.12); }
}
.illustrative-card { animation: cardBreathe 2.6s ease-in-out infinite; }

@keyframes shimmerBar {
  0%   { background-position: -120px 0; }
  100% { background-position: 120px 0; }
}
.shimmer-bar {
  background-image: linear-gradient(90deg, var(--color-border-light) 25%, #eef1f0 50%, var(--color-border-light) 75%);
  background-size: 200px 100%;
  animation: shimmerBar 1.6s linear infinite;
}
</style>
