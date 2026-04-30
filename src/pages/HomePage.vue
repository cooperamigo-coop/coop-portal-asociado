<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconCreditCard, IconUserPlus, IconUserMinus, IconClipboardList, IconFileText, IconArrowRight, IconArrowLeft, IconClock, IconWorld } from '@tabler/icons-vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import { PROXIMAMENTE as proximamente } from '@/config/flags'

const router = useRouter()
const route = useRoute()
const paso = ref('pregunta') // 'pregunta' | 'asociado' | 'no-asociado'

<<<<<<< HEAD
// Cambiar a true para bloquear el acceso con el mensaje "Pronto habilitaremos..."
const proximamente = false

=======
>>>>>>> 60754856f017f930abc74a45e4e397f3c97fae12
onMounted(() => {
  if (route.query.vista === 'no-asociado') paso.value = 'no-asociado'
})


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
    descripcion: 'Inicie su proceso de desvinculación de manera virtual',
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
          <IconWorld :size="14" />Cooperamigo.coop
        </a>
      </div>
      <!-- Mobile: link a cooperamigo.coop -->
      <a href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="topbar-back"
        aria-label="Visitar cooperamigo.coop">
        <IconArrowLeft :size="18" />
      </a>
      <!-- Mobile: logo centrado blanco -->
      <img src="/logo-principal.svg" alt="Cooperamigó" class="topbar-logo" />
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
          <img src="/favicon.svg" alt="Cooperamigó" class="hero-favicon" />
          <h1 class="hero-title">¡Te damos la bienvenida!</h1>
          <p class="hero-question">¿Ya haces parte de Cooperamigó?<br>Accede a los trámites digitales o inicia tu
            proceso de vinculación como asociado de la Cooperativa.</p>
          <div class="opciones">
            <button class="btn-opcion btn-opcion--primary" :class="{ 'btn-opcion--disabled': proximamente }"
              :disabled="proximamente" @click="!proximamente && (paso = 'asociado')">
              Soy asociado
            </button>
            <button class="btn-opcion btn-opcion--secondary" :class="{ 'btn-opcion--disabled': proximamente }"
              :disabled="proximamente" @click="!proximamente && (paso = 'no-asociado')">
              Quiero afiliarme
            </button>
          </div>
          <p v-if="proximamente" class="proximamente-msg">
            Pronto habilitaremos el acceso digital para nuestros asociados. ¡Estamos trabajando en ello!
          </p>
        </div>

        <!-- ── Vista: servicios asociado ─────────────────────── -->
        <div v-else-if="paso === 'asociado'" class="vista animate-in">
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
                <span v-if="srv.disponible" class="row-arrow">
                  <IconArrowRight :size="16" />
                </span>
                <span v-else class="row-soon">
                  <IconClock :size="9" />
                  Próximamente
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Vista: no asociado ─────────────────────────────── -->
        <div v-else-if="paso === 'no-asociado'" class="vista animate-in">
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
                <span class="row-arrow">
                  <IconArrowRight :size="16" />
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ── Footer ─────────────────────────────────────────── -->
    <PortalFooter />

  </div>
</template>

<style scoped>
/* ─── Página ─── */
.home-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: white;
  font-family: var(--font-body);
  position: relative;
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
  overflow: hidden;
}

/* ─── Anillos decorativos ─── */
.deco-ring {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.18;
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
}

@media (max-width: 767px) {
  .home-main {
    padding: 28px 32px;
  }
}

.home-content {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
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
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

.hero-question {
  font-size: 16px;
  font-weight: var(--fw-regular);
  color: var(--color-text-2);
  margin: 0;
  text-align: center;
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.btn-opcion {
  width: 100%;
  height: 48px;
  border-radius: var(--r-pill);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
  letter-spacing: 0.02em;
}

.btn-opcion--primary {
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: var(--shadow-btn);
}

.btn-opcion--primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-opcion--secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}

.btn-opcion--secondary:hover {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
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
  background: var(--color-bg-surface);
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
  background: var(--color-bg-card);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* ─── Lista de servicios ─── */
.services-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-card);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  height: 72px;
  transition: background var(--transition-fast);
}

.service-row+.service-row {
  border-top: 1px solid var(--color-border-card);
}

.service-row--on {
  cursor: pointer;
}

.service-row--on:hover {
  background: var(--color-bg-surface);
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-action {
  flex-shrink: 0;
}

.row-arrow {
  display: flex;
  color: var(--color-text-3);
  transition: transform 0.2s ease, color 0.2s ease;
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

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .portal-topbar {
    position: relative;
    background: var(--color-primary);
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

  /* Flecha: link a cooperamigo.com */
  .topbar-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .topbar-back:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  /* Logo blanco centrado */
  .topbar-logo {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    height: 24px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  /* Main ocupa toda la pantalla → footer queda fuera del viewport (hay que hacer scroll) */
  .home-main {
    min-height: calc(100vh - 52px);
    align-items: center;
  }
}
</style>
