<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconCreditCard, IconUserPlus, IconUserMinus, IconClipboardList, IconFileText, IconArrowRight, IconArrowLeft, IconClock, IconWorld } from '@tabler/icons-vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import { PROXIMAMENTE as proximamente } from '@/config/flags'

const router = useRouter()
const route = useRoute()
const paso = ref('pregunta') // 'pregunta' | 'asociado' | 'no-asociado'

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
    <header class="portal-topbar">
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
          <div class="pregunta-layout">

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

              <p v-if="proximamente" class="proximamente-msg">
                Pronto habilitaremos el acceso digital para nuestros asociados. ¡Estamos trabajando en ello!
              </p>

              <p v-if="fueraDeHorario && !proximamente" class="horario-msg">
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

      </div>
    </main>

    <!-- ── Footer (solo desktop) ─────────────────────────── -->
    <PortalFooter class="footer--desktop-only" />

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
  background-image: url('/imagen1.png');
  background-size: cover;
  background-position: center 60%;
  background-repeat: no-repeat;
  background-attachment: fixed;
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


/* ─── Layout dos columnas: izquierda vacía, derecha con contenido ─── */
.pregunta-layout {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}

.pregunta-spacer {
  flex: 1;
}

.pregunta-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 420px;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .pregunta-layout {
    flex-direction: column;
    width: 100%;
    flex: 1;
  }

  .pregunta-spacer {
    display: none;
  }

  .pregunta-right {
    width: 100%;
    flex: 1;
  }
}

@media (min-width: 961px) {
  .home-main {
    align-items: flex-end;
    padding-right: 14%;
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
  font-size: var(--text-2xl);
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
    font-size: 32px;
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
  font-weight: var(--fw-medium);
  color: var(--color-text-3);
  text-align: center;
  margin: 0;
  padding: var(--sp-sm) var(--sp-md);
  background: var(--color-bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  width: 100%;
  max-width: 320px;
  line-height: 1.5;
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
