<script setup>
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconWorld } from '@tabler/icons-vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'

const router = useRouter()
</script>

<template>
  <div :style="{
    minHeight: '100dvh',
    background: 'var(--color-bg-card)',
    backgroundImage: 'url(/imagen1.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex', flexDirection: 'column',
    position: 'relative',
    overflow: 'clip'
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
        ><IconWorld :size="14" />Cooperamigo.coop</a>
      </div>
      <!-- Mobile: botón retroceso -->
      <button class="topbar-back" @click="router.push('/')" aria-label="Inicio">
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

    <!-- Contenido -->
    <main class="portal-main">
      <div class="portal-main__spacer" aria-hidden="true"></div>
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
  justify-content: center;
  padding: 40px 32px;
  position: relative;
}

@media (min-width: 961px) {
  :deep(.footer-info-row),
  :deep(.footer-sep),
  :deep(.footer-email),
  :deep(.footer-link) {
    color: var(--color-dark) !important;
    opacity: 0.7;
  }

  .portal-main {
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    padding: 60px 48px 40px;
  }

  .portal-main__spacer {
    display: block;
    flex: 1;
    min-width: 0;
  }

  .portal-main__inner {
    width: 50%;
    flex-shrink: 0;
    margin: 0;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

/* ─── Anillos decorativos ─── */
.deco-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.deco-ring {
  position: absolute;
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
  z-index: 2;
}

.portal-main__spacer {
  display: none;
}

.portal-main__inner {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
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

/* ─── Badge VIGILADA lateral ─── */
.vigilada-badge {
  display: none;
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
  font-weight: var(--fw-medium);
  letter-spacing: 0.06em;
  color: var(--color-primary);
}

@media (max-width: 960px) {
  .portal-topbar {
    position: absolute;
    background: transparent;
    justify-content: flex-start;
    padding: 0 16px;
    height: 52px;
  }

  /* Desktop elements: ocultos */
  .topbar-desktop { display: none; }

  /* Badge lateral: oculto en mobile */
  .vigilada-badge { display: none; }

  /* Botón retroceso */
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

  .portal-main { padding: 28px 20px; }
  .portal-main__inner { margin: auto; }
}
</style>
