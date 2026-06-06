<template>
  <footer class="portal-footer">
    <div class="footer-inner">

      <!-- Col 2: copyright + NIT + email (una línea en desktop) -->
      <div class="footer-col-copy">
        <!-- Desktop: una sola línea -->
        <p class="footer-info-row footer-info--desktop">
          © 2026 Cooperativa Multiactiva Luis Amigó
          <span class="footer-sep">·</span>
          NIT 800.191.482-7
          <span class="footer-sep">·</span>
          <span class="footer-email">info@cooperamigo.coop</span>
        </p>
        <!-- Mobile: simplificado -->
        <div class="footer-mobile-copy">
          <p class="footer-info-row footer-info--mobile">© 2026 Cooperativa Multiactiva Luis Amigó</p>
          <p class="footer-info-row footer-info--mobile footer-info--tagline">Portal de servicios digitales. All rights reserved.</p>
        </div>

        <div class="footer-info-row footer-links">
          <a href="https://cooperamigo.coop/aviso-privacidad" target="_blank" rel="noopener noreferrer" class="footer-link">
            <span class="text-desktop">Aviso de privacidad</span>
            <span class="text-mobile">Privacidad</span>
          </a>
          <span class="footer-sep">·</span>
          <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" class="footer-link">
            <span class="text-desktop">Política de tratamiento de datos</span>
            <span class="text-mobile">Política Datos</span>
          </a>
          <span class="footer-sep">·</span>
          <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" class="footer-link">
            <span class="text-desktop">Términos y condiciones</span>
            <span class="text-mobile">Términos</span>
          </a>
        </div>
      </div>


    </div>
  </footer>
</template>

<style scoped>
.portal-footer {
  background: var(--color-primary);
  padding: 24px 48px;
  flex-shrink: 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-xl);
  max-width: 900px;
  margin: 0 auto;
}

.footer-col-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.footer-info-row {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.45);
  font-weight: var(--fw-medium);
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.footer-sep { opacity: 1; color: rgba(255, 255, 255, 0.45); }

.footer-email {
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  font-weight: var(--fw-medium);
}
.footer-email:hover { color: rgba(255, 255, 255, 0.8); }

.footer-info-tagline {
  color: rgba(255, 255, 255, 0.45);
}

.footer-links {
  margin-top: 4px;
}

.footer-link {
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  font-weight: var(--fw-medium);
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 0.8);
}

.text-mobile {
  display: none;
}

.footer-info--mobile { display: none; }

.footer-col-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.footer-logo-link {
  display: inline-flex;
  opacity: 0.9;
  transition: opacity 0.15s ease;
}
.footer-logo-link:hover { opacity: 1; }

.footer-logo {
  height: 24px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* ─── Mobile ─── */
@media (max-width: 960px) {
  .text-desktop { display: none; }
  .text-mobile  { display: inline; }

  .footer-info-tagline { line-height: 1.3; }

  .portal-footer {
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .footer-inner  { flex-direction: column; align-items: center; gap: 12px; }
  .footer-col-logo   { display: none; }
  .footer-col-copy   { gap: 4px; align-items: center; text-align: center; }
  .footer-info--desktop { display: none; }
  .footer-mobile-copy { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .footer-info--mobile { display: flex; font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); }
  .footer-links { margin-top: 2px; gap: 8px; }
  .footer-link  { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); }
}

/* ─── Desktop ─── */
@media (min-width: 961px) {
  .portal-footer {
    background: transparent;
  }

  .footer-inner {
    justify-content: flex-start;
    max-width: 100%;
  }

  .footer-col-copy {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    width: 100%;
  }

  .footer-info--desktop {
    flex-wrap: nowrap;
    justify-content: flex-start;
  }

  .footer-links {
    margin-top: 0;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }

  .footer-links::before {
    content: '·';
    opacity: 1;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.72rem;
  }

  .footer-logo { height: 34px; }
}
</style>
