<script setup>
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconWorld } from '@tabler/icons-vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'

const router = useRouter()
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
  }">
    <!-- Topbar -->
    <header class="portal-topbar">
      <!-- Desktop: Inicio + Visitar sitio -->
      <div class="topbar-desktop">
        <RouterLink to="/" class="topbar-home">
          <IconArrowLeft :size="14" />
          Inicio
        </RouterLink>
        <span class="topbar-sep-v"></span>
        <a
          href="https://cooperamigo.coop"
          target="_blank"
          rel="noopener noreferrer"
          class="topbar-visit"
        ><IconWorld :size="14" />Visitar sitio</a>
      </div>
      <!-- Mobile: botón retroceso -->
      <button class="topbar-back" @click="router.push('/')" aria-label="Inicio">
        <IconArrowLeft :size="18" />
      </button>
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

    <!-- Contenido -->
    <main class="portal-main">

      <!-- Anillos decorativos permanentes -->
      <div class="deco-ring deco-ring--primary" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-primary)" stroke-width="30"/>
        </svg>
      </div>
      <div class="deco-ring deco-ring--accent" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-accent)" stroke-width="30"/>
        </svg>
      </div>

      <div class="portal-main__inner">
        <slot />
      </div>
    </main>

    <PortalFooter />
  </div>
</template>

<style scoped>

/* ─── Main ─── */
.portal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px;
  position: relative;
  overflow: hidden;
}

/* ─── Anillos decorativos ─── */
.deco-ring {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.14;
}

.deco-ring--primary {
  width: clamp(180px, 22vw, 340px);
  height: clamp(180px, 22vw, 340px);
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
}

.deco-ring--accent {
  width: clamp(140px, 17vw, 260px);
  height: clamp(140px, 17vw, 260px);
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
}

.portal-main__inner {
  width: 100%;
  max-width: 720px;
  position: relative;
  z-index: 1;
}

/* ─── Topbar ─── */
.portal-topbar {
  position: relative;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 32px;
  height: 44px;
  flex-shrink: 0;
}

.topbar-desktop {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-home {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-2);
  text-decoration: none;
  transition: color var(--transition-fast);
}
.topbar-home:hover { color: var(--color-text-1); }

.topbar-sep-v {
  width: 1px;
  height: 13px;
  background: var(--color-border);
  flex-shrink: 0;
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
.topbar-visit:hover { color: var(--color-primary-dark); text-decoration: underline; }

/* Mobile: ocultos en desktop */
.topbar-back { display: none; }
.topbar-logo { display: none; }

/* ─── Badge VIGILADA lateral (position fixed, solo desktop) ─── */
.vigilada-badge {
  position: fixed;
  top: 50%;
  left: 12px;
  z-index: 40;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: 0 0;
  white-space: nowrap;
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
  background: var(--color-text-3);
  border-radius: 1px;
}

.vb-vigilada {
  font-size: 0.56rem;
  font-weight: var(--fw-extrabold);
  letter-spacing: 0.2em;
  color: var(--color-text-2);
  text-align: center;
  line-height: 1.5;
}

.vb-nombre {
  font-size: 0.6rem;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.06em;
  color: var(--color-text-3);
}

@media (max-width: 960px) {
  .portal-topbar {
    background: var(--color-primary);
    justify-content: flex-start;
    padding: 0 16px;
    height: 52px;
  }

  /* Desktop elements: ocultos */
  .topbar-desktop { display: none; }

  /* Badge lateral: oculto en mobile */
  .vigilada-badge { display: none; }

  /* Flecha retroceso */
  .topbar-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-pill);
    color: rgba(255, 255, 255, 0.7);
    background: none;
    border: none;
    cursor: pointer;
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

  .portal-main { padding: 28px 20px; }
}
</style>
