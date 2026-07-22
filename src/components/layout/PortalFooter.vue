<template>
  <footer class="portal-footer">
    <div class="footer-top">
      <div class="footer-container footer-grid">
        
        <!-- Columna 1: Marca -->
        <div class="footer-col brand-col">
          <a href="/" class="footer-logo-link">
            <img src="@/assets/img/logo-principal.svg" alt="Cooperamigó" class="footer-logo-img" />
          </a>
          <p class="footer-tagline">
            Cooperativa Multiactiva Luis Amigó<br>
            NIT. 800.191.482-7
          </p>
        </div>

        <!-- Columna 2: Enlaces rápidos -->
        <div class="footer-col" :class="{ 'is-open': abierto.links }">
          <button type="button" class="footer-heading footer-heading--toggle" @click="toggle('links')">
            Enlaces rápidos
            <ChevronDown class="footer-chevron" :size="16" />
          </button>
          <ul class="footer-list">
            <li><router-link to="/" class="footer-link">Inicio</router-link></li>
            <li><a href="#" class="footer-link" @click.prevent="showFaqModal = true">Preguntas frecuentes</a></li>
            <li><a href="#" class="footer-link">Políticas y documentos</a></li>
          </ul>
        </div>

        <!-- Columna 3: Legal -->
        <div class="footer-col" :class="{ 'is-open': abierto.legal }">
          <button type="button" class="footer-heading footer-heading--toggle" @click="toggle('legal')">
            Legal
            <ChevronDown class="footer-chevron" :size="16" />
          </button>
          <ul class="footer-list">
            <li>
              <a href="https://cooperamigo.coop/aviso-privacidad" target="_blank" rel="noopener noreferrer" class="footer-link">
                Aviso de privacidad
              </a>
            </li>
            <li>
              <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" class="footer-link">
                Política de tratamiento de datos
              </a>
            </li>
            <li>
              <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" class="footer-link">
                Términos y condiciones
              </a>
            </li>
          </ul>
        </div>

        <!-- Columna 4: Contacto -->
        <div class="footer-col" :class="{ 'is-open': abierto.contacto }">
          <button type="button" class="footer-heading footer-heading--toggle" @click="toggle('contacto')">
            Contacto
            <ChevronDown class="footer-chevron" :size="16" />
          </button>
          <ul class="footer-list contact-list">
            <li>
              <a href="tel:+576043054070612" class="footer-link contact-item">
                <Phone class="contact-icon" />
                <span>(604) 305 407 0612</span>
              </a>
            </li>
            <li>
              <a href="mailto:info@cooperamigo.coop" class="footer-link contact-item">
                <Mail class="contact-icon" />
                <span>info@cooperamigo.coop</span>
              </a>
            </li>
            <li>
              <a href="https://maps.google.com/?q=Calle+50+65+-+42,+Oficina+120" target="_blank" rel="noopener noreferrer" class="footer-link contact-item">
                <MapPin class="contact-icon" />
                <span>Calle 50 65 - 42, Oficina 120</span>
              </a>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <!-- Bottom Bar (Dark) -->
    <div class="footer-bottom">
      <div class="footer-container bottom-container">
        
        <!-- Social -->
        <div class="footer-social">
          <span class="social-text">Síguenos</span>
          <div class="social-icons">
            <a href="#" aria-label="Facebook"><Facebook class="social-icon" /></a>
            <a href="#" aria-label="Instagram"><Instagram class="social-icon" /></a>
            <a href="#" aria-label="YouTube"><Youtube class="social-icon" /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin class="social-icon" /></a>
          </div>
        </div>

        <!-- Copy -->
        <div class="footer-copy">
          © 2026 Cooperativa Multiactiva Luis Amigó. All rights reserved.
        </div>

        <!-- Supersolidaria Placeholder -->
        <div class="footer-vigilado">
          <ShieldCheck class="vigilado-icon" />
          Vigilada Supersolidaria
        </div>

      </div>
    </div>

    <!-- Modal FAQ -->
    <ModalFAQ v-model:visible="showFaqModal" />
  </footer>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Mail, MapPin, Phone, Facebook, Instagram, Youtube, Linkedin, ShieldCheck, ChevronDown } from 'lucide-vue-next';
import ModalFAQ from '@/components/ui/ModalFAQ.vue';

const abierto = reactive({ links: false, legal: false, contacto: false });
const showFaqModal = ref(false);

function toggle(seccion) {
  const estabaAbierto = abierto[seccion];
  
  Object.keys(abierto).forEach(key => {
    abierto[key] = false;
  });
  
  if (!estabaAbierto) {
    abierto[seccion] = true;
  }
}
</script>

<style scoped>
.portal-footer {
  width: 100%;
  flex-shrink: 0;
  background-color: var(--color-bg-card);
  border-top: 1px solid var(--color-border-light);
}

.footer-top {
  padding: 22px 0 40px;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (max-width: 639px) {
  .footer-top {
    padding-bottom: 8px;
  }

  .footer-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .brand-col {
    grid-column: 1 / -1;
    margin-bottom: 16px;
    align-items: center;
    text-align: center;
  }

  .footer-logo-img {
    height: 28px;
  }

  .footer-tagline {
    max-width: 320px;
  }

  .footer-col:not(.brand-col) {
    display: contents;
  }

  .footer-col:not(.brand-col) .footer-heading {
    grid-row: 2;
    margin: 0;
    padding: 8px 0;
    font-size: 0.75rem;
    line-height: 1.2;
    align-items: center;
    justify-content: center;
  }

  .footer-col:not(.brand-col):not(.is-open) .footer-list {
    display: none;
  }

  .footer-col:not(.brand-col) .footer-list {
    grid-column: 1 / -1;
    margin-top: 8px;
    padding-bottom: 18px;
    align-items: center;
  }

  .footer-chevron {
    display: none;
  }

  .footer-col.is-open .footer-chevron {
    transform: rotate(180deg);
  }

  .footer-list {
    gap: 12px;
    align-items: center;
  }

  .footer-link,
  .footer-text,
  .contact-item {
    font-size: 0.8rem;
    word-break: normal;
    text-align: center;
  }

  .contact-item {
    align-items: center;
    justify-content: center;
    flex-direction: row;
    gap: 8px;
  }

  .contact-icon {
    width: 16px;
    height: 16px;
    margin: 0;
  }
}

@media (min-width: 640px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
  }
}

.brand-col {
  display: flex;
  flex-direction: column;
}

.footer-logo-link {
  display: inline-block;
  margin-bottom: 20px;
}

.footer-logo-img {
  height: 36px;
  width: auto;
}

.footer-tagline {
  font-size: 0.85rem;
  color: var(--color-text-2);
  line-height: 1.6;
  margin: 0;
  max-width: 280px;
}

.footer-heading {
  font-size: 0.85rem;
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.footer-heading--toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.footer-chevron {
  display: none;
  color: currentColor;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.footer-link,
.footer-text {
  font-size: 0.8rem;
  color: var(--color-text-2);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--color-primary);
}

.contact-list {
  gap: 10px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-item span {
  color: inherit;
}

.contact-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  flex-shrink: 0;
}

/* Bottom Bar */
.footer-bottom {
  background-color: var(--color-primary);
  padding: 16px 0;
}

.bottom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

@media (min-width: 1024px) {
  .bottom-container {
    flex-direction: row;
    justify-content: space-between;
  }
}

.footer-social {
  display: flex;
  align-items: center;
  gap: 12px;
}

.social-text {
  font-size: 0.8rem;
  color: var(--color-text-on-primary);
  font-weight: var(--fw-semibold);
}

.social-icons {
  display: flex;
  gap: 12px;
}

.social-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-on-primary);
  transition: opacity var(--transition-fast);
}

.social-icon:hover {
  opacity: 0.8;
}

.footer-copy {
  font-size: 0.7rem;
  color: var(--color-text-on-primary);
  opacity: 0.9;
  text-align: center;
  white-space: nowrap;
}

.footer-vigilado {
  font-size: 0.75rem;
  font-weight: var(--fw-bold);
  color: var(--color-text-on-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.vigilado-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
