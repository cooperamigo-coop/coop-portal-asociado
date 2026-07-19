<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconCreditCard, IconUserPlus, IconUserMinus, IconClipboardList, IconFileText, IconArrowRight, IconArrowLeft, IconClock, IconWorld, IconSearch, IconCircleCheck, IconClockHour4, IconPlugX } from '@tabler/icons-vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import CampoTexto from '@/components/forms/CampoTexto.vue'
import { PROXIMAMENTE as proximamente } from '@/config/flags'
import { useEstadoProcesos } from '@/composables/useEstadoProcesos'

const router = useRouter()
const route = useRoute()
const paso = ref('pregunta') // 'pregunta' | 'asociado' | 'no-asociado' | 'estado'

const { cedula, correo, honeypot, cargando, error, resultado, consultar, reiniciar } = useEstadoProcesos()

const ETIQUETAS_CREDITO = {
  radicado:        'Radicada',
  en_revision:     'En revisión',
  en_analisis:     'En análisis',
  en_aprobacion:   'En aprobación',
  aprobado:        'Aprobada',
  pendiente_firma: 'Pendiente de firma',
  firmado:         'Firmada — pendiente de desembolso',
  enviado:         'Enviada',
}

const ETIQUETAS_AFILIACION = {
  en_revision: 'En revisión',
  devuelto:    'Devuelta — requiere ajustes',
  aprobado:    'Aprobada',
  vo_sarlaft:  'En validación de cumplimiento',
}

const ESTADOS_POSITIVOS = ['aprobado', 'firmado']

function etiquetaEstado(proceso) {
  const mapa = proceso.tipo === 'credito' ? ETIQUETAS_CREDITO : ETIQUETAS_AFILIACION
  return mapa[proceso.estado] ?? proceso.estado.replace(/_/g, ' ')
}

function estiloEstado(proceso) {
  return ESTADOS_POSITIVOS.includes(proceso.estado) ? 'estado-pill--ok' : 'estado-pill--proceso'
}

function iconoEstado(proceso) {
  return ESTADOS_POSITIVOS.includes(proceso.estado) ? IconCircleCheck : IconClockHour4
}

function fmtFecha(v) {
  if (!v) return ''
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v))
}

function volverDesdeEstado() {
  reiniciar()
  paso.value = 'pregunta'
}

function reiniciarConsulta() {
  reiniciar()
}

// ── Horario hábil: lunes–viernes 08:00–20:00 hora Colombia ──
const ahora = ref(new Date())
let _timer

onMounted(() => {
  if (route.query.vista === 'no-asociado') paso.value = 'no-asociado'
  _timer = setInterval(() => { ahora.value = new Date() }, 60_000)
})

onUnmounted(() => clearInterval(_timer))

const fueraDeHorario = computed(() => {
  if (import.meta.env.DEV) return false
  const bogota = new Date(ahora.value.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
  const dia  = bogota.getDay()  // 0=dom, 6=sáb
  const hora = bogota.getHours()
  if (dia === 0 || dia === 6) return true
  if (hora < 8 || hora >= 17) return true
  return false
})

const bloqueado = computed(() => proximamente || fueraDeHorario.value)


const SERVICIOS_ASOCIADO = [
  {
    id: 'credito',
    icono: IconCreditCard,
    nombre: 'Solicitar crédito',
    descripcion: 'Crédito ordinario o de consumo · Crédito educativo',
    disponible: true,
    ruta: '/solicitar-credito',
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-primary)',
  },
  {
    id: 'retiro',
    icono: IconUserMinus,
    nombre: 'Formalizar retiro',
    descripcion: 'Proceso de desvinculación de manera virtual',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-3)',
  },
  {
    id: 'estado',
    icono: IconClipboardList,
    nombre: 'Consultar estado',
    descripcion: 'Revise el avance de sus solicitudes.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-3)',
  },
  {
    id: 'certificados',
    icono: IconFileText,
    nombre: 'Certificados',
    descripcion: 'Paz y salvo, deuda y estado de cuenta.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-3)',
  },
]

const SERVICIOS_NO_ASOCIADO = [
  {
    id: 'afiliacion',
    icono: IconUserPlus,
    nombre: 'Gestionar afiliación',
    descripcion: 'Gestiona tu proceso de vinculación como asociado.',
    disponible: true,
    ruta: '/solicitar-afiliacion',
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-primary)',
  },
]
</script>

<template>
  <div class="home-page">

    <!-- ── Topbar ─────────────────────────────────────────── -->
    <header v-if="!proximamente" class="portal-topbar">
      <!-- Desktop: Visitar sitio, izquierda -->
      <div class="topbar-desktop">
        <a href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="topbar-visit">
          <IconWorld :size="14" /><span style="font-weight: var(--fw-regular)">Visítanos en </span><span style="font-weight: var(--fw-semibold)">www.cooperamigo.coop</span>
        </a>
      </div>
      <!-- Mobile: flecha siempre visible; en pregunta va a cooperamigo.coop, en otros pasos vuelve -->
      <a v-if="paso === 'pregunta'" href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="topbar-back" aria-label="Ir a Cooperamigo.coop">
        <IconArrowLeft :size="18" />
      </a>
      <button v-else class="topbar-back" @click="paso === 'estado' ? volverDesdeEstado() : (paso = 'pregunta')" aria-label="Volver">
        <IconArrowLeft :size="18" />
      </button>
    </header>

    <!-- Badge VIGILADA lateral (solo desktop) -->
    <div class="vigilada-badge" aria-hidden="true">
      <div class="vb-inner">
        <div class="vb-block">
          <span class="vb-line"></span>
          <span class="vb-vigilada">VIGILADA</span>
          <span class="vb-line"></span>
        </div>
        <span class="vb-nombre">SUPERSOLIDARIA</span>
      </div>
    </div>

    <!-- ── Contenido principal ─────────────────────────────── -->
    <main class="home-main">

      <!-- Anillos decorativos -->
      <div class="deco-ring deco-ring--primary" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-primary)" stroke-width="30" />
        </svg>
      </div>
      <div class="deco-ring deco-ring--accent" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-accent)" stroke-width="30" />
        </svg>
      </div>

      <div class="home-content">

        <!-- ── Vista: pregunta inicial ───────────────────────── -->
        <div v-if="paso === 'pregunta'" class="vista animate-in">
          <div class="pregunta-layout" v-if="!proximamente">

            <!-- Columna izquierda vacía -->
            <div class="pregunta-spacer" aria-hidden="true"></div>

            <!-- Columna derecha: título + descripción + botones -->
            <div class="pregunta-card">
            <div class="pregunta-right">
              <img src="/logo-principal.svg" alt="Cooperamigó" class="hero-logo--mobile" />
              <h1 class="hero-title">¡Te damos la bienvenida!</h1>
              <p class="hero-question">Accede a los trámites digitales o inicia tu proceso de vinculación como asociado de la Cooperativa.</p>

              <div class="opciones">
                <button class="btn-opcion btn-opcion--primary" :class="{ 'btn-opcion--disabled': bloqueado }"
                  :disabled="bloqueado" @click="!bloqueado && (paso = 'asociado')">
                  <span>Soy asociado</span>
                  <span class="btn-circle"><IconArrowRight :size="14" /></span>
                </button>
                <button class="btn-opcion btn-opcion--secondary" :class="{ 'btn-opcion--disabled': bloqueado }"
                  :disabled="bloqueado" @click="!bloqueado && (paso = 'no-asociado')">
                  <span>Quiero afiliarme</span>
                  <span class="btn-circle"><IconArrowRight :size="14" /></span>
                </button>
              </div>

              <button class="btn-estado" @click="paso = 'estado'">
                <IconSearch :size="15" />
                <span>¿Ya tienes una solicitud? Consulta su estado aquí</span>
              </button>

              <p v-if="fueraDeHorario" class="horario-msg">
                <IconClock :size="13" style="display:inline;vertical-align:middle;margin-right:4px;" />
                Las solicitudes a través de este portal podrán gestionarse de <strong>lunes a viernes</strong>, entre las <strong>8:00 a. m.</strong> y las <strong>5:00 p. m.</strong>
              </p>
              <div class="card-footer-info">
                <p class="card-footer-copy">© 2026 Cooperativa Multiactiva Luis Amigó · NIT 800.191.482-7</p>
                <div class="card-footer-links">
                  <a href="https://cooperamigo.coop/aviso-privacidad" target="_blank" rel="noopener noreferrer">Aviso de privacidad</a>
                  <span>·</span>
                  <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer">Política de datos</a>
                  <span>·</span>
                  <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer">Términos y condiciones</a>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div class="mantenimiento-full" v-else>
            <h1 class="mantenimiento-title">Estamos offline.</h1>
            
            <svg class="svg-unplugged" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="cable-path" d="M -50 120 Q 150 120 200 160 T 380 100" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round"/>
              <g class="plug-left">
                <rect x="360" y="70" width="55" height="60" rx="16" fill="#ffffff" stroke="var(--color-primary)" stroke-width="6" />
                <circle cx="395" cy="85" r="4" fill="var(--color-primary)" />
                <circle cx="395" cy="115" r="4" fill="var(--color-primary)" />
                <line x1="415" y1="85" x2="435" y2="85" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
                <line x1="415" y1="115" x2="435" y2="115" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
              </g>
              <path class="cable-path" d="M 850 120 Q 750 120 700 80 T 630 140 T 750 170 T 720 100 Q 600 100 540 100" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
              <g class="plug-right">
                <path d="M 525 70 h 20 a 30 30 0 0 1 0 60 h -20 a 16 16 0 0 1 -16 -16 v -28 a 16 16 0 0 1 16 -16 z" fill="#ffffff" stroke="var(--color-primary)" stroke-width="6" />
                <circle cx="530" cy="85" r="4" fill="var(--color-primary)" />
                <circle cx="530" cy="115" r="4" fill="var(--color-primary)" />
              </g>
              <g class="sparks" stroke="var(--color-accent)" stroke-width="4" stroke-linecap="round">
                <line x1="475" y1="50" x2="470" y2="30" />
                <line x1="495" y1="60" x2="510" y2="45" />
                <line x1="455" y1="65" x2="440" y2="50" />
                <line x1="475" y1="150" x2="470" y2="170" />
                <line x1="495" y1="140" x2="510" y2="155" />
                <line x1="455" y1="135" x2="440" y2="150" />
              </g>
            </svg>

            <p class="mantenimiento-text">
              <strong>Saludos. Estamos en mantenimiento programado.</strong><br/>
              Estamos realizando mejoras en el portal para brindarte una mejor experiencia.<br/>Volveremos a estar en línea muy pronto. ¡Gracias por tu paciencia!
            </p>
            
            <div class="mantenimiento-footer">
               <a href="https://cooperamigo.coop/contacto" target="_blank" rel="noopener noreferrer">Soporte</a>
               <span class="mantenimiento-dot">·</span>
               <a href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer">Volver al sitio principal</a>
               <span class="mantenimiento-dot">·</span>
               <span class="mantenimiento-copy">© 2026 Cooperativa Multiactiva Luis Amigó</span>
            </div>
          </div>

        </div>

        <!-- ── Vista: servicios asociado ─────────────────────── -->
        <div v-else-if="paso === 'asociado'" class="vista animate-in">
          <div class="services-group">
          <button class="btn-volver" @click="paso = 'pregunta'">
            <IconArrowLeft :size="13" />
            Volver
          </button>
          <div class="services-list">
            <div v-for="srv in SERVICIOS_ASOCIADO.filter(s => s.id === 'credito' || s.id === 'retiro')" :key="srv.id"
              class="service-row" :class="srv.disponible ? 'service-row--on' : 'service-row--off'"
              @click="srv.disponible && router.push(srv.ruta)">
              <div class="row-icon" :style="{ background: srv.iconoBg }">
                <component :is="srv.icono" :size="20" :style="{ color: srv.iconoColor }" />
              </div>
              <div class="row-content">
                <div class="row-name">{{ srv.nombre }}</div>
                <div class="row-desc">{{ srv.descripcion }}</div>
              </div>
              <div class="row-action">
                <span v-if="srv.disponible" class="row-circle-arrow"><IconArrowRight :size="14" /></span>
                <span v-else class="row-soon">
                  <IconClock :size="9" />
                  Pronto
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- ── Vista: no asociado ─────────────────────────────── -->
        <div v-else-if="paso === 'no-asociado'" class="vista animate-in">
          <div class="services-group">
          <button class="btn-volver" @click="paso = 'pregunta'">
            <IconArrowLeft :size="13" />
            Volver
          </button>
          <div class="services-list">
            <div v-for="srv in SERVICIOS_NO_ASOCIADO" :key="srv.id" class="service-row service-row--on"
              @click="router.push(srv.ruta)">
              <div class="row-icon" :style="{ background: srv.iconoBg }">
                <component :is="srv.icono" :size="20" :style="{ color: srv.iconoColor }" />
              </div>
              <div class="row-content">
                <div class="row-name">{{ srv.nombre }}</div>
                <div class="row-desc">{{ srv.descripcion }}</div>
              </div>
              <div class="row-action">
                <span class="row-circle-arrow"><IconArrowRight :size="14" /></span>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- ── Vista: consulta de estado ─────────────────────── -->
        <div v-else-if="paso === 'estado'" class="vista animate-in">
          <div class="pregunta-layout">
            <div class="pregunta-spacer" aria-hidden="true"></div>
            <div class="estado-wrap">
              <div class="pregunta-card estado-card" :class="{ 'estado-card--resultado': resultado }">
              <div class="pregunta-right">

                <template v-if="!resultado">
                  <h1 class="hero-title">Consultar estado de trámite</h1>
                  <p class="hero-question">Ingresa tu número de identificación y el correo electrónico registrado en la solicitud.</p>

                  <form class="estado-form" @submit.prevent="consultar">
                    <div style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;">
                      <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />
                    </div>

                    <CampoTexto v-model="cedula" label="Número de identificación" solo-numeros :maxlength="15" required />
                    <CampoTexto v-model="correo" label="Correo electrónico" type="email" required />

                    <p v-if="error" class="estado-error">{{ error }}</p>

                    <button type="submit" class="btn-opcion btn-opcion--primary" :disabled="cargando">
                      <span>{{ cargando ? 'Consultando...' : 'Consultar estado' }}</span>
                      <span class="btn-circle"><IconArrowRight :size="14" /></span>
                    </button>
                  </form>

                  <div class="btn-volver-container">
                    <button class="btn-volver btn-volver--estado" @click="volverDesdeEstado">
                      <IconArrowLeft :size="13" />
                      Regresar a inicio
                    </button>
                  </div>
                </template>

                <template v-else>
                  <div class="estado-header">
                    <h1 class="hero-title">
                      {{ resultado.nombre ? `Saludos, ${resultado.nombre} ${resultado.apellido ?? ''}`.trim() : 'Tus procesos' }}
                    </h1>
                    <p v-if="resultado.procesos.length" class="hero-question">Este es el estado actual de tus solicitudes en proceso.</p>
                  </div>

                  <div class="procesos-list">
                    <div v-for="(proceso, i) in resultado.procesos" :key="i" class="proceso-row">
                      <div class="proceso-icon" :class="proceso.tipo === 'credito' ? 'proceso-icon--credito' : 'proceso-icon--afiliacion'">
                        <component :is="proceso.tipo === 'credito' ? IconCreditCard : IconUserPlus" :size="20" />
                      </div>
                      <div class="proceso-content">
                        <div class="proceso-nombre">
                          {{ proceso.tipo === 'credito' ? 'Solicitud de crédito' : 'Solicitud de afiliación' }}
                        </div>
                        <div class="proceso-fecha">{{ fmtFecha(proceso.fecha) }}</div>
                      </div>
                      <div class="estado-pill" :class="estiloEstado(proceso)">
                        <component :is="iconoEstado(proceso)" :size="13" />
                        {{ etiquetaEstado(proceso) }}
                      </div>
                    </div>

                    <div v-if="!resultado.procesos.length" class="sin-procesos-container">
                      <div class="sin-procesos-icon">
                        <IconSearch :size="40" />
                      </div>
                      <p class="sin-procesos-title">No encontramos solicitudes activas</p>
                      <p class="sin-procesos-text">Revisa que tu número de identificación y correo electrónico sean correctos. Si tienes dudas, contáctanos.</p>
                    </div>
                  </div>

                  <button type="button" class="btn-volver-form" @click="volverDesdeEstado">
                    <IconArrowLeft :size="14" />
                    Regresar a inicio
                  </button>
                </template>

              </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ── Footer (solo desktop) ─────────────────────────── -->
    <PortalFooter v-if="!proximamente" class="footer--desktop-only" />

  </div>
</template>

<style scoped>
/* ─── Página ─── */
.home-page {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--color-bg-app);
  font-family: var(--font-body);
  position: relative;
  overflow: hidden;
}


/* ─── Main ─── */
.home-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  position: relative;
  z-index: 1;
}

/* ─── Anillos decorativos ─── */
.deco-ring {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.18;
}

.deco-ring {
  display: none;
}

/* Anillo primary: esquina inferior derecha */
.deco-ring--primary {
  width: clamp(180px, 28vw, 360px);
  height: clamp(180px, 28vw, 360px);
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
}

/* Anillo accent: esquina superior izquierda */
.deco-ring--accent {
  width: clamp(140px, 22vw, 280px);
  height: clamp(140px, 22vw, 280px);
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  z-index: 2;
}

@media (max-width: 960px) {
  .home-main {
    justify-content: flex-end;
    align-items: stretch;
    padding: 0;
  }

  .home-content {
    width: 100%;
    max-width: 100%;
  }

  .home-page {
    background-position: 40% 50%;
    background-size: auto 130%;
  }
}

.home-content {
  width: 100%;
  max-width: 720px;
  position: relative;
  z-index: 1;
}


/* ─── Layout centrado ─── */
.pregunta-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.pregunta-spacer {
  display: none;
}

.pregunta-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 420px;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .pregunta-layout {
    flex-direction: column;
    width: 100%;
    flex: 1;
  }

  .pregunta-right {
    width: 100%;
    flex: 1;
  }
}

@media (min-width: 961px) {
  .home-main {
    align-items: center;
    justify-content: center;
    padding: 0;
  }
}

@media (min-width: 1200px) {
  .home-content {
    max-width: 860px;
  }

  .pregunta-right {
    width: 420px;
  }
}


/* ─── Vista genérica ─── */
.vista {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* ─── Vista pregunta ─── */

.hero-favicon {
  width: auto;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}

@media (max-width: 960px) {
  .hero-favicon {
    height: 40px;
    margin-bottom: 4px;
  }
}

.hero-logo {
  height: 36px;
  object-fit: contain;
  align-self: flex-start;
}

.hero-logo--mobile {
  display: none;
}

@media (max-width: 960px) {
  .hero-logo--mobile {
    display: block;
    height: 32px;
    object-fit: contain;
    margin-bottom: 8px;
  }
}

.pregunta-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px 24px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 961px) {
  .pregunta-card {
    border-radius: 24px;
    padding: 72px 40px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    min-height: unset;
    width: auto;
  }
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-dark);
  margin: 0;
  text-align: center;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.hero-question {
  font-size: 16px;
  font-weight: var(--fw-regular);
  color: var(--color-text-2);
  margin: 0;
  text-align: center;
  line-height: 1.4;
  max-width: 380px;
}

@media (min-width: 961px) {
  .pregunta-right {
    align-items: center;
    width: 420px;
  }

  .hero-title {
    color: var(--color-dark);
    font-size: 28px;
    text-align: center;
  }

  .hero-question {
    color: var(--color-text-2);
    text-align: center;
    font-size: 17px;
  }

  .pregunta-right .opciones {
    align-self: center;
  }

  .pregunta-right .btn-opcion {
    height: 60px;
    font-size: 15px;
  }
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 380px;
}

.btn-opcion {
  width: 100%;
  height: 52px;
  border-radius: var(--r-pill);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  padding: 0 52px 0 36px;
}

.btn-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform var(--transition-base);
}

.btn-opcion--primary {
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(17, 76, 90, 0.25);
}

.btn-opcion--primary .btn-circle {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-opcion--primary:hover {
  background: var(--color-primary-dark, #0d3a45);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(17, 76, 90, 0.3);
}

.btn-opcion--primary:hover .btn-circle {
  transform: translateY(-50%) translateX(3px);
  background: rgba(255, 255, 255, 0.3);
}

.btn-opcion--secondary {
  background: #ffffff;
  color: var(--color-primary);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  border: 1.5px solid var(--color-p-light);
}

.btn-opcion--secondary .btn-circle {
  background: var(--color-p-light);
  color: var(--color-primary);
}

.btn-opcion--secondary:hover {
  background: #ffffff;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.btn-opcion--secondary:hover .btn-circle {
  transform: translateY(-50%) translateX(3px);
  background: var(--color-primary);
  color: #ffffff;
}

.btn-opcion--disabled,
.btn-opcion--disabled:hover {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none;
  background: var(--color-bg-surface-alt);
  color: var(--color-text-3);
  border-color: var(--color-border);
  box-shadow: none;
}

.btn-num {
  font-style: normal;
  opacity: 0.5;
  font-weight: var(--fw-medium);
  margin-right: 2px;
}

.btn-opcion--disabled .btn-circle,
.btn-opcion--disabled:hover .btn-circle {
  background: var(--color-border);
  color: var(--color-text-3);
  transform: translateY(-50%);
}

.btn-estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  max-width: 380px;
  margin-top: 4px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-2);
  transition: color var(--transition-fast);
}

.btn-estado:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.horario-msg {
  width: 100%;
  text-align: center;
  font-size: 13px;
  font-weight: var(--fw-medium);
  color: var(--color-text-3);
  margin-top: 8px;
  line-height: 1.5;
  max-width: 320px;
  opacity: 0.8;
}

.proximamente-msg {
  font-size: var(--text-sm);
  line-height: 1.5;
}

/* --- Mantenimiento Full --- */
.mantenimiento-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
  padding: 40px 0;
}

.mantenimiento-title {
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 56px);
  font-weight: var(--fw-extrabold);
  color: var(--color-dark);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.mantenimiento-text {
  font-size: clamp(15px, 2vw, 17px);
  color: var(--color-text-2);
  max-width: 600px;
  margin: 0 auto 40px;
  line-height: 1.6;
}

.mantenimiento-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
  font-size: 14px;
  font-weight: var(--fw-semibold);
  flex-wrap: wrap;
}

.mantenimiento-footer a {
  color: var(--color-text-2);
  text-decoration: none;
  transition: color 0.2s;
}

.mantenimiento-footer a:hover {
  color: var(--color-primary);
}

.mantenimiento-dot {
  opacity: 0.4;
}

.mantenimiento-copy {
  opacity: 0.6;
}

/* --- SVG Illustration --- */
.svg-unplugged {
  width: 100%;
  max-width: 700px;
  height: auto;
  margin: 32px auto;
  display: block;
  overflow: visible;
}

@keyframes float-left {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-4px) rotate(-1deg); }
}
@keyframes float-right {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(4px) rotate(1deg); }
}
@keyframes spark-flicker {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(0.8); }
}

.plug-left { animation: float-left 3s ease-in-out infinite; transform-origin: 380px 100px; }
.plug-right { animation: float-right 3s ease-in-out infinite; transform-origin: 530px 100px; }
.sparks { animation: spark-flicker 0.4s infinite alternate; transform-origin: 475px 100px; }
.cable-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-cable 1.5s ease-out forwards;
}

@keyframes draw-cable {
  to { stroke-dashoffset: 0; }
}

/* ─── Vista estado ─── */
.estado-card__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--r-lg);
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.estado-form {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.estado-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.estado-error {
  font-size: var(--text-sm);
  color: var(--color-error-text);
  text-align: center;
  margin: 0;
}

.btn-volver-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.procesos-list {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 4px auto;
  overflow-y: auto;
}

.proceso-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--r-lg);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  width: 100%;
}

.proceso-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.proceso-icon--credito {
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
}

.proceso-icon--afiliacion {
  background: var(--color-bg-surface-alt);
  color: var(--color-accent-dark, var(--color-primary));
}

.proceso-content {
  flex: 1;
  min-width: 0;
}

.proceso-nombre {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.proceso-fecha {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  margin-top: 2px;
}

.estado-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  padding: 5px 10px;
  border-radius: var(--r-pill);
  white-space: nowrap;
  flex-shrink: 0;
}

.estado-pill--proceso {
  background: var(--color-bg-surface-alt);
  color: var(--color-text-2);
}

.estado-pill--ok {
  background: var(--color-success-bg, #e6f4ea);
  color: var(--color-success-text, #1e7a3d);
}

.sin-procesos-container {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}

.sin-procesos-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
  margin-bottom: 8px;
}

.sin-procesos-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0;
}

.sin-procesos-text {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.btn-volver-form {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  padding: 6px 12px;
}

.btn-volver-form:hover {
  text-decoration: underline;
}

.estado-card--resultado .pregunta-right {
  align-items: stretch;
}

.estado-card--resultado .procesos-list {
  flex: 1;
  min-height: 0;
}

.estado-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

button.btn-volver--estado {
  display: none;
}

@media (min-width: 961px) {
  button.btn-volver--estado {
    display: inline-flex;
  }

  .estado-wrap {
    width: auto;
  }
}

/* ─── Botón volver ─── */
.btn-volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--r-pill);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-2);
  padding: 6px var(--sp-md);
  align-self: flex-start;
  transition: all var(--transition-fast);
}

.btn-volver:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--color-primary);
}

/* ─── Lista de servicios ─── */
.services-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.services-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 961px) {
  .services-group {
    max-width: 500px;
    margin-left: auto;
  }

  .services-list {
    border-radius: 24px;
  }
}

.service-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  min-height: 72px;
  transition: background var(--transition-fast);
}

.service-row+.service-row {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.service-row--on {
  cursor: pointer;
}

.service-row--on:hover {
  background: rgba(255, 255, 255, 0.5);
}

.service-row--on:hover .row-arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

.service-row--off {
  cursor: default;
  opacity: 0.48;
}

.row-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--r-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-content {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  line-height: 1.3;
  margin-bottom: 2px;
}

.row-desc {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  font-weight: var(--fw-regular);
  line-height: 1.4;
  margin-top: 2px;
}

.row-action {
  flex-shrink: 0;
}

.row-arrow {
  display: flex;
  color: var(--color-text-3);
  transition: transform 0.2s ease, color 0.2s ease;
}

.row-circle-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.service-row--on:hover .row-circle-arrow {
  transform: translateX(2px);
}

.row-soon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  color: var(--color-text-3);
  background: var(--color-bg-surface-alt);
  padding: 3px 9px;
  border-radius: var(--r-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ─── Animación ─── */
.animate-in {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Topbar ─── */
.portal-topbar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 20;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 32px;
  height: 44px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.topbar-desktop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-visit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.topbar-visit:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

@media (min-width: 961px) {
  .topbar-visit {
    color: var(--color-dark);
  }

  .topbar-visit:hover {
    color: var(--color-primary);
  }
}

/* Mobile: ocultos en desktop */
.topbar-back {
  display: none;
}

.topbar-logo {
  display: none;
}

/* ─── Badge VIGILADA lateral (position fixed, solo desktop) ─── */
.vigilada-badge {
  position: fixed;
  top: 50%;
  left: 12px;
  z-index: 40;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: 0 0;
  white-space: nowrap;
  pointer-events: none;
}

.vb-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vb-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.vb-line {
  display: block;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

.vb-vigilada {
  font-size: 0.62rem;
  font-weight: var(--fw-extrabold);
  letter-spacing: 0.2em;
  color: var(--color-primary);
  text-align: center;
  line-height: 1.5;
}

.vb-nombre {
  font-size: 0.66rem;
  font-weight: var(--fw-regular);
  letter-spacing: 0.06em;
  color: var(--color-primary);
}

@media (min-width: 961px) {
  .vigilada-badge {
    display: none;
  }
}

:deep(.footer-info-row),
:deep(.footer-sep),
:deep(.footer-email),
:deep(.footer-link) {
  color: var(--color-dark) !important;
  opacity: 0.7;
}

.card-footer-info {
  display: none;
}

@media (max-width: 960px) {
  .footer--desktop-only {
    display: none;
  }

  .card-footer-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .card-footer-copy {
    font-size: 0.6rem;
    color: var(--color-text-3);
    text-align: center;
    line-height: 1.5;
    margin: 0;
  }

  .card-footer-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.6rem;
    color: var(--color-text-3);
  }

  .card-footer-links a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--fw-medium);
  }

  .card-footer-links span {
    opacity: 0.4;
  }
}

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .portal-topbar {
    position: relative;
    background: transparent;
    justify-content: flex-start;
    padding: 0 16px;
    height: 52px;
  }

  /* Desktop elements: ocultos */
  .topbar-desktop {
    display: none;
  }

  .vigilada-badge {
    display: none;
  }

  /* Botón volver */
  .topbar-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-text-2);
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .topbar-back:hover {
    background: var(--color-bg-surface);
    color: var(--color-primary);
  }

  .home-main {
    align-items: center;
  }

  .btn-opcion {
    justify-content: center;
    padding: 0 52px;
  }

  .pregunta-card {
    min-height: auto;
  }
}
</style>
