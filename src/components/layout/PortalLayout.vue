<script setup>
import PortalFooter from '@/components/layout/PortalFooter.vue'
</script>

<template>
  <div :style="{
    minHeight: '100dvh',
    background: 'var(--color-bg-app)',
    display: 'flex', flexDirection: 'column',
    position: 'relative',
  }" class="portal-root">

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
    color: var(--color-text-1) !important;
    opacity: 0.7;
  }

  .portal-main {
    padding: 60px 48px 40px;
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
  background: var(--color-text-2);
  border-radius: 1px;
}

.vb-vigilada {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: var(--fw-extrabold);
  letter-spacing: 0.18em;
  color: var(--color-text-2);
  text-align: center;
  line-height: 1.4;
}

.vb-nombre {
  display: flex;
  flex-direction: column;
  font-family: var(--font-display);
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: 0.04em;
  color: var(--color-text-2);
  line-height: 1.35;
}

.vb-nombre-line {
  display: block;
}

@media (max-width: 960px) {
  /* Badge lateral: oculto en mobile */
  .vigilada-badge { display: none; }

  .portal-main { padding: 8px 16px 20px; }
  .portal-main__inner { margin: auto; }
}
</style>
