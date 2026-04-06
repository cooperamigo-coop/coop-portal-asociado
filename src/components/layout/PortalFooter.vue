<template>
  <footer class="portal-footer">
    <div class="footer-inner">

      <!-- Col 1: logo -->
      <div class="footer-col-logo">
        <img src="/logo-principal.svg" alt="Cooperamigó" class="footer-logo" />
      </div>

      <!-- Col 2: copyright + NIT + vigilada mobile -->
      <div class="footer-col-copy">
        <p class="footer-copy footer-copy--desktop">© 2026 Cooperativa Multiactiva Luis Amigó</p>
        <p class="footer-copy footer-copy--mobile">Copyright © 2026 Cooperativa Multiactiva Luis Amigó</p>
        <div class="footer-nit">
          <span>NIT 800.191.482-7</span>
          <span class="footer-nit-sep">·</span>
          <a href="mailto:info@cooperamigo.com" class="footer-email">info@cooperamigo.com</a>
        </div>
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
</template>

<style scoped>
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
  gap: 8px;
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

.footer-nit {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--sp-sm);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.38);
  font-weight: var(--fw-medium);
}

.footer-nit-sep { opacity: 0.4; }

.footer-email {
  color: rgba(255, 255, 255, 0.38);
  text-decoration: none;
  font-weight: var(--fw-medium);
}
.footer-email:hover { color: rgba(255, 255, 255, 0.7); }

.footer-col-spacer { /* balance visual */ }

@media (max-width: 960px) {
  .portal-footer { padding: 20px 24px; }
  .footer-inner   { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .footer-col-logo   { display: none; }
  .footer-col-spacer { display: none; }
  .footer-col-copy   { gap: 10px; }
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
