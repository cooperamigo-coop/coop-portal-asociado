<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CreditCard, UserPlus, ClipboardList, FileText, ArrowRight, ArrowLeft, Clock } from 'lucide-vue-next'

const router = useRouter()
const paso = ref('pregunta') // 'pregunta' | 'asociado' | 'no-asociado'
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

const SERVICIOS_ASOCIADO = [
  {
    id: 'credito',
    icono: CreditCard,
    nombre: 'Solicitar crédito',
    descripcion: 'Consumo, educativo, vivienda o emergencia.',
    disponible: true,
    ruta: '/solicitar-credito',
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-primary)',
  },
  {
    id: 'estado',
    icono: ClipboardList,
    nombre: 'Consultar estado',
    descripcion: 'Revise el avance de sus solicitudes.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-3)',
  },
  {
    id: 'certificados',
    icono: FileText,
    nombre: 'Certificados',
    descripcion: 'Paz y salvo, deuda y estado de cuenta.',
    disponible: false,
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-text-3)',
  },
]

const SERVICIOS_NO_ASOCIADO = [
  {
    id: 'afiliacion',
    icono: UserPlus,
    nombre: 'Gestionar afiliación',
    descripcion: 'Haga parte de nuestra comunidad cooperativa.',
    disponible: true,
    ruta: '/solicitar-afiliacion',
    iconoBg: 'var(--color-bg-surface-alt)',
    iconoColor: 'var(--color-warning-text)',
  },
]
</script>

<template>
  <div class="home-page">

    <!-- ── Contenido principal ─────────────────────────────── -->
    <main class="home-main">
      <div class="home-content">

        <!-- ── Vista: pregunta inicial ───────────────────────── -->
        <div v-if="paso === 'pregunta'" class="vista animate-in">
          <img src="/favicon.svg" alt="Cooperamigó" class="hero-favicon" />
          <h1 class="hero-title">Le damos la bienvenida</h1>
          <p class="hero-question">¿Ya hace parte de nuestra cooperativa?</p>
          <div class="opciones">
            <button class="btn-opcion btn-opcion--primary" @click="paso = 'asociado'">
              Sí, soy asociado
            </button>
            <button class="btn-opcion btn-opcion--secondary" @click="paso = 'no-asociado'">
              No, no estoy afiliado
            </button>
          </div>
        </div>

        <!-- ── Vista: servicios asociado ─────────────────────── -->
        <div v-else-if="paso === 'asociado'" class="vista animate-in">
          <button class="btn-volver" @click="paso = 'pregunta'">
            <ArrowLeft :size="13" />
            Volver
          </button>
          <div class="services-list">
            <div
              v-for="srv in SERVICIOS_ASOCIADO"
              :key="srv.id"
              class="service-row"
              :class="srv.disponible ? 'service-row--on' : 'service-row--off'"
              @click="srv.disponible && router.push(srv.ruta)"
            >
              <div class="row-icon" :style="{ background: srv.iconoBg }">
                <component :is="srv.icono" :size="20" :style="{ color: srv.iconoColor }" />
              </div>
              <div class="row-content">
                <div class="row-name">{{ srv.nombre }}</div>
                <div class="row-desc">{{ srv.descripcion }}</div>
              </div>
              <div class="row-action">
                <span v-if="srv.disponible" class="row-arrow">
                  <ArrowRight :size="16" />
                </span>
                <span v-else class="row-soon">
                  <Clock :size="9" />
                  Próximamente
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Vista: no asociado ─────────────────────────────── -->
        <div v-else-if="paso === 'no-asociado'" class="vista animate-in">
          <button class="btn-volver" @click="paso = 'pregunta'">
            <ArrowLeft :size="13" />
            Volver
          </button>
          <div class="services-list">
            <div
              v-for="srv in SERVICIOS_NO_ASOCIADO"
              :key="srv.id"
              class="service-row service-row--on"
              @click="router.push(srv.ruta)"
            >
              <div class="row-icon" :style="{ background: srv.iconoBg }">
                <component :is="srv.icono" :size="20" :style="{ color: srv.iconoColor }" />
              </div>
              <div class="row-content">
                <div class="row-name">{{ srv.nombre }}</div>
                <div class="row-desc">{{ srv.descripcion }}</div>
              </div>
              <div class="row-action">
                <span class="row-arrow"><ArrowRight :size="16" /></span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ── Footer ─────────────────────────────────────────── -->
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
/* ─── Página ─── */
.home-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #ffffff;
  font-family: var(--font-body);
}

/* ─── Main ─── */
.home-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

@media (max-width: 767px) {
  .home-main {
    padding: 28px 32px;
  }
}

.home-content {
  width: 100%;
  max-width: 480px;
}

/* ─── Vista genérica ─── */
.vista {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* ─── Vista pregunta ─── */
.hero-favicon {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

.hero-question {
  font-size: var(--text-lg);
  font-weight: var(--fw-medium);
  color: var(--color-text-2);
  margin: 0;
  text-align: center;
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.btn-opcion {
  width: 100%;
  height: 48px;
  border-radius: var(--r-pill);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: all var(--transition-base);
  border: none;
  letter-spacing: 0.02em;
}

.btn-opcion--primary {
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: var(--shadow-btn);
}

.btn-opcion--primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-opcion--secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}

.btn-opcion--secondary:hover {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}

/* ─── Botón volver ─── */
.btn-volver {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  color: var(--color-text-2);
  padding: 0;
  align-self: flex-start;
  transition: color var(--transition-fast);
}

.btn-volver:hover {
  color: var(--color-primary);
}

/* ─── Lista de servicios ─── */
.services-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-card);
  border-radius: var(--r-xl);
  overflow: hidden;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  height: 72px;
  transition: background var(--transition-fast);
}

.service-row + .service-row {
  border-top: 1px solid var(--color-border-card);
}

.service-row--on {
  cursor: pointer;
}

.service-row--on:hover {
  background: var(--color-bg-surface);
}

.service-row--on:hover .row-arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

.service-row--off {
  cursor: default;
  opacity: 0.48;
}

.row-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--r-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-content {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  line-height: 1.3;
  margin-bottom: 2px;
}

.row-desc {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  font-weight: var(--fw-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-action { flex-shrink: 0; }

.row-arrow {
  display: flex;
  color: var(--color-text-3);
  transition: transform 0.2s ease, color 0.2s ease;
}

.row-soon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  color: var(--color-text-3);
  background: var(--color-bg-surface-alt);
  padding: 3px 9px;
  border-radius: var(--r-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ─── Footer ─── */
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

/* ─── Animación ─── */
.animate-in {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .portal-footer { padding: 20px 20px; }
  .footer-inner { flex-direction: column; gap: 16px; align-items: flex-start; }
  .footer-right { align-items: flex-start; }
  .footer-copy--full   { display: none; }
  .footer-copy--mobile { display: block; }
}
</style>
