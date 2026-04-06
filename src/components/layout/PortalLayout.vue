<script setup>
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconWorld } from '@tabler/icons-vue'

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
          href="https://www.cooperamigo.com"
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
      <div class="portal-main__inner">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="portal-footer">
      <div class="footer-inner">

        <!-- Col 1: logo -->
        <div class="footer-col-logo">
          <img src="/logo-principal.svg" alt="Cooperamigó" class="footer-logo" />
        </div>

        <!-- Col 2: copyright + vigilada mobile -->
        <div class="footer-col-copy">
          <p class="footer-copy footer-copy--desktop">© 2026 Cooperativa Multiactiva Luis Amigó</p>
          <p class="footer-copy footer-copy--mobile">Copyright © 2026 Cooperativa Multiactiva Luis Amigó</p>
          <div class="footer-vigilada-mobile">
            <div class="fvm-block">
              <span class="fvm-line"></span>
              <span class="fvm-vigilada">VIGILADA</span>
              <span class="fvm-line"></span>
            </div>
            <span class="fvm-nombre">SUPERSOLIDARIA</span>
          </div>
        </div>

        <!-- Col 3: vacía (balance visual) -->
        <div class="footer-col-spacer"></div>

      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ─── Footer ─── */
.portal-footer {
  background: var(--color-primary);
  padding: 44px 48px;
  flex-shrink: 0;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
}

.footer-col-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.footer-logo {
  height: 26px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.footer-col-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-copy {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.38);
  font-weight: var(--fw-medium);
  margin: 0;
  text-align: center;
}

.footer-copy--mobile    { display: none; }
.footer-vigilada-mobile { display: none; }

.footer-col-spacer { }

/* ─── Main ───
   flex-direction: column + align-items: center centra horizontalmente el inner.
   El contenido siempre arranca desde arriba, nunca desborda por encima del topbar.
*/
.portal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px;
}

.portal-main__inner {
  width: 100%;
  max-width: 720px;
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

  .portal-footer { padding: 20px 24px; }
  .footer-inner   { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .footer-col-logo   { display: none; }
  .footer-col-spacer { display: none; }
  .footer-col-copy   { gap: 14px; }
  .footer-copy--desktop { display: none; }
  .footer-copy--mobile  { display: block; }
  .footer-vigilada-mobile {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fvm-block {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }
  .fvm-line {
    display: block;
    height: 1.5px;
    background: rgba(255, 255, 255, 0.35);
    border-radius: 1px;
  }
  .fvm-vigilada {
    font-size: 0.5rem;
    font-weight: var(--fw-extrabold);
    letter-spacing: 0.2em;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.5;
  }
  .fvm-nombre {
    font-size: 0.5rem;
    font-weight: var(--fw-semibold);
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.38);
  }
}
</style>
