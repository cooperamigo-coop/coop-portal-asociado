<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconCreditCard, IconUserPlus, IconUserMinus, IconClipboardList, IconFileText, IconArrowRight, IconArrowLeft, IconClock, IconSearch, IconPlugX } from '@tabler/icons-vue'
import { ShieldCheck, PiggyBank, FileBadge, MessageSquare, Gift, User, CheckCircle2 } from 'lucide-vue-next'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import ServiceCard from '@/components/ui/ServiceCard.vue'
import { PROXIMAMENTE as proximamente } from '@/config/flags'
import { esFueraDeHorarioAtencion } from '@/utils/horarioAtencion'

const router = useRouter()
const route = useRoute()
const paso = ref('pregunta') // 'pregunta' | 'asociado' | 'no-asociado'

// ── Horario hábil: lunes–viernes 08:00–17:00 hora Colombia (sin fines de semana ni festivos) ──
const ahora = ref(new Date())
let _timer

onMounted(() => {
  if (route.query.vista === 'no-asociado') paso.value = 'no-asociado'
  _timer = setInterval(() => { ahora.value = new Date() }, 60_000)
})

onUnmounted(() => clearInterval(_timer))

const fueraDeHorario = computed(() => esFueraDeHorarioAtencion(ahora.value))

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
    iconoColor: 'var(--color-text-2)',
  },
  {
    id: 'estado',
    icono: IconClipboardList,
    nombre: 'Consultar estado',
    descripcion: 'Revise el avance de sus solicitudes.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-2)',
  },
  {
    id: 'certificados',
    icono: IconFileText,
    nombre: 'Certificados',
    descripcion: 'Paz y salvo, deuda y estado de cuenta.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-2)',
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
   <div class="home-shell" :class="{ 'home-shell--landing': paso === 'pregunta' && !proximamente }">

    <!-- ── Topbar ─────────────────────────────────────────── -->
    <header v-if="!proximamente" class="portal-topbar">
      <!-- En pregunta va a cooperamigo.coop (oculto en móviles según solicitud), en otros pasos vuelve -->
      <a v-if="paso === 'pregunta'" href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="topbar-back" aria-label="Ir a Cooperamigo.coop">
        <IconArrowLeft :size="18" />
      </a>
      <button v-else class="topbar-back" @click="paso = 'pregunta'" aria-label="Volver">
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
        <span class="vb-nombre">
          <span class="vb-nombre-line">SUPERINTENDENCIA DE LA</span>
          <span class="vb-nombre-line">ECONOMÍA SOLIDARIA</span>
        </span>
      </div>
    </div>

    <!-- ── Contenido principal ─────────────────────────────── -->
    <main class="home-main" :class="{ 'home-main--centrado': proximamente }">

      <div class="home-content" :class="{ 'home-content--full': paso === 'pregunta' }">

        <!-- ── Vista: pregunta inicial ───────────────────────── -->
        <div v-if="paso === 'pregunta'" class="vista animate-in">
          <div class="new-hero-layout" v-if="!bloqueado">
            <div class="hero-split">
              <!-- Left Column: Text and Actions -->
              <div class="hero-left">
                <h1 class="hero-headline"><span class="highlight">Servicios Digitales</span></h1>
                <p class="hero-subheadline">Encuentra trámites, consultas y beneficios diseñados para ti, de forma fácil, rápida y segura.</p>
                
                <div class="hero-actions-grid">
                  <!-- Soy asociado -->
                  <button class="action-card action-card--primary" @click="paso = 'asociado'">
                    <div class="ac-icon"><User :size="24" /></div>
                    <div class="ac-content">
                      <h3 class="ac-title">Soy asociado</h3>
                      <p class="ac-desc">Accede a tus trámites y beneficios exclusivos</p>
                    </div>
                    <div class="ac-arrow"><IconArrowRight :size="20" /></div>
                  </button>
                  <!-- Quiero afiliarme -->
                  <button class="action-card action-card--secondary" @click="paso = 'no-asociado'">
                    <div class="ac-icon"><IconUserPlus :size="24" /></div>
                    <div class="ac-content">
                      <h3 class="ac-title">Quiero afiliarme</h3>
                      <p class="ac-desc">Únete a nuestra cooperativa y comienza a disfrutar</p>
                    </div>
                    <div class="ac-arrow"><IconArrowRight :size="20" /></div>
                  </button>
                  
                  <!-- Search Bar -->
                  <button class="search-bar-btn" @click="router.push('/estado-procesos')">
                    <IconSearch class="sb-icon" :size="20" />
                    <span class="sb-text">¿Ya tienes una solicitud? Consulta su estado aquí</span>
                    <div class="ac-arrow"><IconArrowRight :size="20" /></div>
                  </button>
                </div>
              </div>

              <!-- Right Column: Image and Floating Card -->
              <div class="hero-right">
                <div class="hero-image-wrapper">
                  <div class="deco-ring deco-ring--primary" aria-hidden="true">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-primary)" stroke-width="30" />
                    </svg>
                  </div>
                  <div class="deco-ring deco-ring--accent" aria-hidden="true">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-primary)" stroke-width="30" />
                    </svg>
                  </div>
                  <img src="/banner1.png" alt="Portal Cooperamigó" class="hero-banner" />
                </div>
              </div>
            </div>

            <!-- Services Grid -->
            <div class="services-section">
              <div class="services-container-white">
                <h2 class="section-title">Trámites y servicios destacados</h2>
                <div class="section-divider"></div>
                <div class="services-grid">
                  <ServiceCard
                    :icon="IconCreditCard"
                    title="Créditos"
                    description="Solicita, consulta o actualiza tus créditos de forma fácil."
                    clickable
                    @click="router.push('/solicitar-credito')"
                  />
                  <ServiceCard
                    :icon="PiggyBank"
                    title="Aportes sociales"
                    description="Consulta tus aportes sociales y consigna tus aportes."
                    clickable
                  />
                  <ServiceCard
                    :icon="FileBadge"
                    title="Certificaciones"
                    description="Solicita tus certificaciones de manera digital."
                    clickable
                  />
                  <ServiceCard
                    :icon="MessageSquare"
                    title="PQRS"
                    description="Radica peticiones, quejas, reclamos y sugerencias."
                    href="https://cooperamigo.coop/pqrsf"
                  />
                  <ServiceCard
                    :icon="Gift"
                    title="Beneficios"
                    description="Descubre convenios, descuentos y alianzas para ti."
                    clickable
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mantenimiento-full" v-else-if="proximamente">
            <h1 class="mantenimiento-title">Estamos offline.</h1>

            <svg class="svg-unplugged" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="cable-path" d="M -50 120 Q 150 120 200 160 T 380 100" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round"/>
              <g class="plug-left">
                <rect x="360" y="70" width="55" height="60" rx="16" fill="var(--color-bg-card)" stroke="var(--color-primary)" stroke-width="6" />
                <circle cx="395" cy="85" r="4" fill="var(--color-primary)" />
                <circle cx="395" cy="115" r="4" fill="var(--color-primary)" />
                <line x1="415" y1="85" x2="435" y2="85" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
                <line x1="415" y1="115" x2="435" y2="115" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
              </g>
              <path class="cable-path" d="M 850 120 Q 750 120 700 80 T 630 140 T 750 170 T 720 100 Q 600 100 540 100" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
              <g class="plug-right">
                <path d="M 525 70 h 20 a 30 30 0 0 1 0 60 h -20 a 16 16 0 0 1 -16 -16 v -28 a 16 16 0 0 1 16 -16 z" fill="var(--color-bg-card)" stroke="var(--color-primary)" stroke-width="6" />
                <circle cx="530" cy="85" r="4" fill="var(--color-primary)" />
                <circle cx="530" cy="115" r="4" fill="var(--color-primary)" />
              </g>
              <g class="sparks" stroke="var(--color-primary)" stroke-width="4" stroke-linecap="round">
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

          <div class="mantenimiento-full horario-full" v-else>
            <div class="horario-icon-wrap" aria-hidden="true">
              <div class="horario-icon-ring"></div>
              <IconClock class="horario-icon" :size="40" :stroke-width="1.75" />
            </div>

            <h1 class="mantenimiento-title mantenimiento-title--sm">Fuera de horario de atención</h1>

            <p class="mantenimiento-text">
              <strong>En este momento el portal no está disponible.</strong><br/>
              Nuestro horario de atención es de <strong>lunes a viernes, 8:00 a.m. a 5:00 p.m.</strong><br/>
              Vuelve a intentarlo dentro de este horario. ¡Gracias por tu paciencia!
            </p>

          </div>

        </div>

        <!-- ── Vista: servicios asociado ─────────────────────── -->
        <div v-else-if="paso === 'asociado'" class="vista animate-in">
          <div class="services-group">
          <h2 class="services-title">¿Qué deseas hacer?</h2>
          <div class="services-stack">
            <ServiceCard
              v-for="srv in SERVICIOS_ASOCIADO.filter(s => s.id === 'credito' || s.id === 'retiro')"
              :key="srv.id"
              :icon="srv.icono"
              :title="srv.nombre"
              :description="srv.descripcion"
              :clickable="srv.disponible"
              :soon="!srv.disponible"
              @click="router.push(srv.ruta)"
            />
          </div>
          </div>
        </div>

        <!-- ── Vista: no asociado ─────────────────────────────── -->
        <div v-else-if="paso === 'no-asociado'" class="vista animate-in">
          <div class="services-group">
          <h2 class="services-title">¿Qué deseas hacer?</h2>
          <div class="services-stack">
            <ServiceCard
              v-for="srv in SERVICIOS_NO_ASOCIADO"
              :key="srv.id"
              :icon="srv.icono"
              :title="srv.nombre"
              :description="srv.descripcion"
              clickable
              @click="router.push(srv.ruta)"
            />
          </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ── Footer (solo desktop) ─────────────────────────── -->
    <PortalFooter v-if="!proximamente" />

   </div>
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
}

.home-shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
}

@media (min-width: 961px) {
  .home-shell--landing {
    background: var(--color-bg-card);
  }
}

@media (min-width: 961px) {
  .home-shell--landing .portal-topbar {
    position: static;
    height: auto;
    padding: 40px 40px 0;
    justify-content: flex-start;
  }

  .home-shell--landing .home-main {
    display: flex;
    padding: 0 40px 16px;
  }
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
  z-index: -1;
  opacity: 0.15;
}

/* Anillo primary: esquina inferior derecha */
.deco-ring--primary {
  width: 120%;
  height: 120%;
  bottom: -15%;
  right: -15%;
}

/* Anillo accent: esquina superior izquierda */
.deco-ring--accent {
  width: 90%;
  height: 90%;
  top: -10%;
  left: -10%;
}

@media (max-width: 960px) {
  .home-main {
    justify-content: flex-end;
    align-items: stretch;
    padding: 0;
  }

  .home-main--centrado {
    justify-content: center;
    align-items: center;
  }

  .home-shell--landing .home-main {
    justify-content: flex-start;
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
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.home-content--full {
  max-width: 1280px !important;
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
  background: var(--color-bg-card);
  border: 1px solid var(--color-bg-surface-alt);
  border-radius: 24px 24px 0 0;
  padding: 32px 24px 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
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
  color: var(--color-text-1);
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
    color: var(--color-text-1);
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
  color: var(--color-text-on-primary);
  box-shadow: 0 4px 14px rgba(23, 43, 54, 0.25);
}

.btn-opcion--primary .btn-circle {
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-on-primary);
}

.btn-opcion--primary:hover {
  background: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 43, 54, 0.3);
}

.btn-opcion--primary:hover .btn-circle {
  transform: translateY(-50%) translateX(3px);
  background: rgba(255, 255, 255, 0.3);
}

.btn-opcion--secondary {
  background: var(--color-bg-card);
  color: var(--color-primary);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  border: 1.5px solid var(--color-bg-surface-alt);
}

.btn-opcion--secondary .btn-circle {
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
}

.btn-opcion--secondary:hover {
  background: var(--color-bg-card);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.btn-opcion--secondary:hover .btn-circle {
  transform: translateY(-50%) translateX(3px);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.btn-opcion--disabled,
.btn-opcion--disabled:hover {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none;
  background: var(--color-bg-surface-alt);
  color: var(--color-text-2);
  border-color: var(--color-bg-surface-alt);
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
  background: var(--color-bg-surface-alt);
  color: var(--color-text-2);
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
  color: var(--color-text-2);
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
  max-width: 100%;
  text-align: center;
  padding: 40px 32px;
  box-sizing: border-box;
}

.mantenimiento-title {
  font-family: var(--font-display);
  font-size: clamp(26px, 8vw, 56px);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.mantenimiento-text {
  font-size: clamp(14px, 3.6vw, 17px);
  color: var(--color-text-2);
  max-width: 600px;
  width: 100%;
  margin: 0 auto 32px;
  line-height: 1.6;
  box-sizing: border-box;
}

.mantenimiento-footer {
  display: flex;
  gap: 8px 16px;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  flex-wrap: wrap;
  max-width: 100%;
}

@media (max-width: 480px) {
  .mantenimiento-full {
    padding: 32px 20px;
  }

  .mantenimiento-text {
    margin-bottom: 24px;
  }

  .mantenimiento-footer {
    font-size: 12px;
    gap: 6px 10px;
  }

  .mantenimiento-dot {
    display: none;
  }

  .mantenimiento-footer a,
  .mantenimiento-copy {
    flex-basis: 100%;
    text-align: center;
  }
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

/* --- Horario (fuera de horario) --- */
.mantenimiento-title--sm {
  font-size: clamp(22px, 6vw, 38px);
}

.horario-icon-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.horario-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--r-pill);
  background: var(--color-bg-surface-alt);
  opacity: 1;
}

.horario-icon {
  position: relative;
  color: var(--color-primary);
  animation: horario-tick 2.4s ease-in-out infinite;
  transform-origin: 50% 50%;
}

@keyframes horario-tick {
  0%, 92%, 100% { transform: rotate(0deg); }
  94% { transform: rotate(-8deg); }
  96% { transform: rotate(8deg); }
  98% { transform: rotate(-4deg); }
}

.horario-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--r-pill);
  background: var(--color-bg-surface);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  margin: 0 auto 28px;
}

/* --- SVG Illustration --- */
.svg-unplugged {
  width: 100%;
  max-width: 700px;
  height: auto;
  margin: 24px auto;
  display: block;
  overflow: visible;
}

@media (max-width: 480px) {
  .svg-unplugged {
    margin: 16px auto;
  }
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

/* ─── Stack de servicios (asociado / no-asociado) ─── */
.services-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.services-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0 0 16px;
  text-align: center;
}

.services-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 961px) {
  .services-group {
    max-width: 700px;
    margin: 0 auto;
  }

  .services-stack {
    flex-direction: row;
    align-items: stretch;
  }

  .services-stack > * {
    flex: 1;
  }
}

@media (max-width: 960px) {
  .services-group {
    padding: 0 20px;
    margin-bottom: 32px;
    box-sizing: border-box;
  }

  .services-stack {
    flex-direction: row;
    align-items: stretch;
  }

  .services-stack > * {
    flex: 1;
    min-width: 0;
  }
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
  color: var(--color-primary);
  text-decoration: underline;
}

@media (min-width: 961px) {
  .topbar-visit {
    color: var(--color-text-1);
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

/* ─── Badge VIGILADA lateral ─── */
.vigilada-badge {
  position: fixed;
  top: 50%;
  left: 32px;
  z-index: 900;
  display: flex;
  align-items: center;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: left top;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.vigilada-badge:hover {
  opacity: 0.7;
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
  height: 1.5px;
  background: var(--color-primary);
  border-radius: 1px;
}

.vb-vigilada {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: var(--fw-bold);
  letter-spacing: 0.18em;
  color: var(--color-primary);
  text-align: center;
  line-height: 1.4;
}

.vb-nombre {
  display: flex;
  flex-direction: column;
  font-family: var(--font-display);
  font-size: 0.625rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.04em;
  color: var(--color-primary);
  line-height: 1.35;
}

.vb-nombre-line {
  display: block;
}

:deep(.footer-info-row),
:deep(.footer-sep),
:deep(.footer-email),
:deep(.footer-link) {
  color: var(--color-text-1) !important;
  opacity: 0.7;
}

.card-footer-info {
  display: none;
}

@media (max-width: 960px) {
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
    color: var(--color-text-2);
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
    color: var(--color-text-2);
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

  .home-shell--landing .portal-topbar {
    display: none;
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
    background: var(--color-bg-app);
    color: var(--color-primary);
  }

  a.topbar-back {
    display: none !important;
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
/* ─── New Hero Layout ─── */
.new-hero-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  gap: 12px;
  padding: 0;
  position: relative;
}

.hero-split {
  display: flex;
  align-items: center;
  gap: 40px;
  width: 100%;
}

.hero-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-headline {
  font-family: var(--font-display);
  font-size: 2.8rem;
  line-height: 0.98;
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
}

.hero-headline .highlight {
  color: var(--color-primary);
}

.hero-subheadline {
  font-size: 1rem;
  color: var(--color-text-2);
  line-height: 1.4;
  margin: 0;
  max-width: 640px;
}

.hero-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
  position: relative;
  overflow: hidden;
}

.action-card--primary {
  background: var(--color-bg-surface-alt);
  color: var(--color-text-1);
}

.action-card--primary:hover {
  transform: translateY(-2px);
  background: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.action-card--secondary {
  background: var(--color-bg-surface-alt);
  color: var(--color-text-1);
  border: none;
}

.action-card--secondary:hover {
  transform: translateY(-2px);
  background: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.ac-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-card--primary .ac-icon {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.action-card--secondary .ac-icon {
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
}

.ac-content {
  flex: 1;
}

.ac-title {
  font-size: 1.1rem;
  font-weight: var(--fw-bold);
  margin: 0;
  line-height: 1.1;
}

.ac-desc {
  font-size: 0.8rem;
  color: var(--color-text-2);
  margin: 2px 0 0 0;
  line-height: 1.25;
}

.ac-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
  transition: transform 0.3s;
  flex-shrink: 0;
}

.action-card--primary .ac-arrow {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.action-card:hover .ac-arrow {
  transform: translateX(4px);
}

.search-bar-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 16px;
  border-radius: 18px;
  border: none;
  background: var(--color-bg-surface-alt);
  color: var(--color-text-2);
  font-size: 0.95rem;
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: all 0.3s;
  grid-column: 1 / -1;
}

.search-bar-btn:hover {
  transform: translateY(-2px);
  background: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.sb-icon {
  color: var(--color-primary);
  background: var(--color-bg-surface-alt);
  border-radius: 50%;
  padding: 6px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sb-text {
  flex: 1;
  text-align: left;
  font-size: 0.8rem;
  font-weight: var(--fw-regular);
}

.search-bar-btn:hover .ac-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

.hero-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: relative;
}

.hero-image-wrapper {
  position: relative;
  width: 100%;
  max-width: 560px;
}

.hero-banner {
  width: 100%;
  height: auto;
  max-height: 280px;
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(23,43,54,0.1);
  object-fit: cover;
}

.services-section {
  width: 100%;
  margin-top: 40px;
}

.services-container-white {
  background: none;
  padding: 0;
  width: 100%;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 1.1rem;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0;
}

.section-divider {
  width: 32px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  width: 100%;
  margin-top: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .services-container-white {
    padding: 32px;
  }
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1180px) {
  .hero-split {
    flex-direction: column;
  }
  .hero-right {
    justify-content: center;
  }
  .hero-actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .hero-split {
    padding: 32px 20px 0;
  }
  .hero-left {
    align-items: center;
  }
  .hero-actions-grid, .search-bar-btn {
    width: 100%;
    max-width: 400px;
  }
  .hero-actions-grid {
    gap: 12px;
  }
  .services-container-white {
    padding: 24px 16px;
    border-radius: 24px;
  }
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-headline {
    font-size: 2.2rem;
    text-align: center;
  }
  .hero-subheadline {
    text-align: center;
    max-width: none;
  }
}

@media (max-width: 600px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
