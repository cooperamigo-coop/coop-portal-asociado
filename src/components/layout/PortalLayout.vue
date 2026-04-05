<script setup>
import { ref, onMounted } from 'vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const { isMobile } = useBreakpoint()

const ipUsuario = ref(null)
const d = new Date()
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const fechaHoy = `${String(d.getDate()).padStart(2,'0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`

onMounted(async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    ipUsuario.value = data.ip
  } catch {
    ipUsuario.value = null
  }
})
</script>

<template>
  <div :style="{
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
  }">
    <!-- Contenido -->
    <main class="portal-main">
      <div class="portal-main__inner">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="portal-footer">
      <div class="footer-inner">

        <!-- Izquierda: logo + copyright + vigilado -->
        <div class="footer-left">
          <img src="/logo-principal.svg" alt="Cooperamigó" class="footer-logo" />
          <p class="footer-copy footer-copy--full">© 2026 Cooperativa Multiactiva Luis Amigó</p>
          <p class="footer-copy footer-copy--mobile">© 2026 Cooperamigó</p>
          <div class="vigilado">
            <div class="vg-block">
              <span class="vg-line"></span>
              <span class="vg-vigilada">VIGILADA</span>
              <span class="vg-line"></span>
            </div>
            <span class="vg-nombre">SUPERSOLIDARIA</span>
          </div>
        </div>

        <!-- Derecha: IP + fecha -->
        <div class="footer-right">
          <div class="fst-item">
            <span class="fst-text">Dirección IP</span>
            <span class="fst-text">{{ ipUsuario || '···' }}</span>
          </div>
          <div class="fst-item">
            <span class="fst-text">Fecha actual</span>
            <span class="fst-text">{{ fechaHoy }}</span>
          </div>
        </div>

      </div>
    </footer>
  </div>
</template>

<style scoped>
.portal-footer {
  background: var(--color-primary);
  padding: 28px 48px;
  flex-shrink: 0;
}

.footer-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.footer-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.footer-logo {
  height: 26px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.footer-copy {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.38);
  font-weight: var(--fw-medium);
  margin: 0;
}

.footer-copy--mobile { display: none; }

.vigilado {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.vg-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.vg-line {
  display: block;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 1px;
}

.vg-vigilada {
  font-size: 0.56rem;
  font-weight: var(--fw-extrabold);
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  line-height: 1.5;
}

.vg-nombre {
  font-size: 0.6rem;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.45);
}

.footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.fst-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.fst-text {
  font-size: 0.68rem;
  font-weight: var(--fw-medium);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
}

.portal-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

.portal-main__inner {
  width: 100%;
  max-width: 720px;
}

@media (max-width: 767px) {
  .portal-main {
    padding: 28px 32px;
  }
}

@media (max-width: 960px) {
  .portal-footer { padding: 20px 20px; }
  .footer-inner { flex-direction: column; gap: 16px; align-items: flex-start; }
  .footer-right { align-items: flex-start; }
  .footer-copy--full   { display: none; }
  .footer-copy--mobile { display: block; }
}
</style>
