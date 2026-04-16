<template>
  <footer class="portal-footer">
    <div class="footer-inner">

      <!-- Col 1: logo con enlace -->
      <div class="footer-col-logo">
        <a href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="footer-logo-link">
          <img src="/logo-principal.svg" alt="Cooperamigó" class="footer-logo" />
        </a>
      </div>

      <!-- Col 2: copyright + NIT + email (una línea en desktop) + vigilada mobile -->
      <div class="footer-col-copy">
        <!-- Desktop: una sola línea -->
        <p class="footer-info-row footer-info--desktop">
          © 2026 Cooperativa Multiactiva Luis Amigó
          <span class="footer-sep">·</span>
          NIT 800.191.482-7
          <span class="footer-sep">·</span>
          <span class="footer-email">info@cooperamigo.coop</span>
        </p>
        <p class="footer-info-row footer-info-tagline footer-info--desktop">
          Portal de trámites digitales para asociados Cooperamigó
        </p>
        <!-- Mobile: dos líneas -->
        <p class="footer-info-row footer-info--mobile">© 2026 COOPERATIVA MULTIACTIVA LUIS AMIGÓ - COOPERAMIGÓ</p>
        <p class="footer-info-row footer-info--mobile footer-nit-mobile">
          NIT 800.191.482-7
          <span class="footer-sep">·</span>
          <span class="footer-email">info@cooperamigo.coop</span>
        </p>
        <p class="footer-info-row footer-info-tagline footer-info--mobile">
          Portal de trámites digitales para asociados Cooperamigó
        </p>

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

        <div class="footer-vigilada-mobile">
          <div class="fvm-block">
            <span class="fvm-line"></span>
            <span class="fvm-vigilada">VIGILADA</span>
            <span class="fvm-line"></span>
          </div>
          <span class="fvm-nombre">SUPERSOLIDARIA</span>
        </div>
      </div>


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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-xl);
  max-width: 900px;
  margin: 0 auto;
}

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
  height: 26px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

@media (min-width: 961px) {
  .footer-logo {
    height: 38px;
  }
}

.footer-col-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

/* Línea de info genérica */
.footer-info-row {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.38);
  font-weight: var(--fw-medium);
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.footer-sep { opacity: 0.4; }

.footer-email {
  color: rgba(255, 255, 255, 0.38);
  text-decoration: none;
  font-weight: var(--fw-medium);
}
.footer-email:hover { color: rgba(255, 255, 255, 0.7); }

.footer-info-tagline {
  color: rgba(255, 255, 255, 0.38);
}

.footer-links {
  margin-top: 4px;
}

.footer-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-weight: var(--fw-medium);
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 0.9);
}

.text-mobile {
  display: none;
}

@media (max-width: 960px) {
  .text-desktop {
    display: none;
  }
  .text-mobile {
    display: inline;
  }

  .footer-info-tagline {
    line-height: 1.3;
  }
}

/* Mobile: ocultar versión desktop de las líneas */
.footer-info--mobile    { display: none; }
.footer-vigilada-mobile { display: none; }

.footer-col-spacer { /* balance visual */ }

@media (max-width: 960px) {
  .portal-footer { padding: 20px 24px; }
  .footer-inner   { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .footer-col-logo   { display: none; }
  .footer-col-spacer { display: none; }
  .footer-col-copy   { gap: 8px; align-items: center; text-align: center; }
  .footer-info--desktop { display: none; }
  .footer-info--mobile  { display: flex; }
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
