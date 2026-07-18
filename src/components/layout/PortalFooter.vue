<template>
  <footer class="portal-footer">
    <div class="footer-inner">

      <!-- Col 1: Logo & Tagline -->
      <div class="footer-col-brand">
        <div class="footer-logo-container">
          <img src="@/assets/img/logo-principal.svg" alt="Cooperamigó" class="footer-logo-img" />
        </div>
        <p class="footer-tagline">Portal de servicios digitales</p>
      </div>

      <!-- Col 2: Legal Links -->
      <div class="footer-col-links">
        <span class="footer-heading">Legal</span>
        <a href="https://cooperamigo.coop/aviso-privacidad" target="_blank" rel="noopener noreferrer" class="footer-link">Aviso de privacidad</a>
        <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" class="footer-link">Política de tratamiento de datos</a>
        <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" class="footer-link">Términos y condiciones</a>
      </div>

      <!-- Col 3: Contact & Copy -->
      <div class="footer-col-contact">
        <span class="footer-heading">Contacto</span>
        <span class="footer-text">NIT 800.191.482-7</span>
        <a href="mailto:info@cooperamigo.coop" class="footer-email">info@cooperamigo.coop</a>
      </div>

    </div>
    
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Cooperativa Multiactiva Luis Amigó. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<style scoped>
.portal-footer {
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border-light);
  padding: 48px 48px 24px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--sp-xl);
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.footer-col-brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-logo-container {
  display: flex;
  align-items: center;
  user-select: none;
}

.footer-logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.footer-tagline {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  margin: 0;
}

.footer-heading {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin-bottom: 12px;
  display: block;
}

.footer-col-links,
.footer-col-contact {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-link,
.footer-text,
.footer-email {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-link:hover,
.footer-email:hover {
  color: var(--color-primary);
}

.footer-bottom {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.footer-copy {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  margin: 0;
}

/* ─── Mobile ─── */
@media (max-width: 960px) {
  .portal-footer {
    padding: 32px 24px 24px;
  }
  
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .footer-col-brand,
  .footer-col-links,
  .footer-col-contact {
    align-items: center;
    text-align: center;
  }
}
</style>
