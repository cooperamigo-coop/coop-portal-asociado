<script setup>
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconArrowRight, IconSearch, IconCreditCard, IconUserPlus, IconCircleCheck, IconClockHour4, IconWorld } from '@tabler/icons-vue'
import CampoTexto from '@/components/forms/CampoTexto.vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import { useEstadoProcesos } from '@/composables/useEstadoProcesos'

const router = useRouter()
const { cedula, correo, honeypot, cargando, error, resultado, consultar, reiniciar } = useEstadoProcesos()

// Solo se listan estados "en curso" — la RPC ya excluye los terminales
// (rechazado, desembolsado, archivado, finalizado, abandonado, anulado).
const ETIQUETAS_CREDITO = {
  radicado:        'Radicada',
  en_revision:     'En revisión',
  en_analisis:     'En análisis',
  en_aprobacion:   'En aprobación',
  aprobado:        'Aprobada',
  pendiente_firma: 'Pendiente de firma',
  firmado:         'Firmada — pendiente de desembolso',
  enviado:         'Enviada',
}

const ETIQUETAS_AFILIACION = {
  en_revision: 'En revisión',
  devuelto:    'Devuelta — requiere ajustes',
  aprobado:    'Aprobada',
  vo_sarlaft:  'En validación de cumplimiento',
}

const ESTADOS_POSITIVOS = ['aprobado', 'firmado']

function etiquetaEstado(proceso) {
  const mapa = proceso.tipo === 'credito' ? ETIQUETAS_CREDITO : ETIQUETAS_AFILIACION
  return mapa[proceso.estado] ?? proceso.estado.replace(/_/g, ' ')
}

function estiloEstado(proceso) {
  return ESTADOS_POSITIVOS.includes(proceso.estado) ? 'estado-pill--ok' : 'estado-pill--proceso'
}

function iconoEstado(proceso) {
  return ESTADOS_POSITIVOS.includes(proceso.estado) ? IconCircleCheck : IconClockHour4
}

function fmtFecha(v) {
  if (!v) return ''
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v))
}

function volverAFormulario() {
  reiniciar()
}
</script>

<template>
  <div class="estado-page">

    <!-- ── Topbar (igual a HomePage) ─────────────────────────── -->
    <header class="portal-topbar">
      <div class="topbar-desktop">
        <a href="https://cooperamigo.coop" target="_blank" rel="noopener noreferrer" class="topbar-visit">
          <IconWorld :size="14" /><span style="font-weight: var(--fw-regular)">Visítanos en </span><span style="font-weight: var(--fw-semibold)">www.cooperamigo.coop</span>
        </a>
      </div>
      <button class="topbar-back" aria-label="Volver" @click="resultado ? volverAFormulario() : router.push('/')">
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

    <main class="estado-main">

      <!-- Anillos decorativos (igual a HomePage) -->
      <div class="deco-ring deco-ring--primary" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-primary)" stroke-width="30" />
        </svg>
      </div>
      <div class="deco-ring deco-ring--accent" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-accent)" stroke-width="30" />
        </svg>
      </div>

      <div class="estado-content">

        <!-- ── Card única: el contenido interno cambia, la card nunca se destruye ── -->
        <div class="estado-card animate-in" :class="{ 'estado-card--resultado': resultado }">

          <!-- ── Formulario: cédula + correo ───────────────────── -->
          <template v-if="!resultado">
                  <div class="estado-header">
                    <h1 class="estado-title">Consultar estado de trámite</h1>
                    <p class="estado-subtitle">Consulta el estado de tu trámite ingresando tu número de identificación y el correo electrónico registrado en la solicitud.</p>
                  </div>

            <form class="estado-form" @submit.prevent="consultar">
              <div style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;">
                <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />
              </div>

              <CampoTexto
                v-model="cedula"
                label="Número de identificación"
                solo-numeros
                :maxlength="15"
                required
              />
              <CampoTexto
                v-model="correo"
                label="Correo electrónico"
                type="email"
                required
              />

              <p v-if="error" class="estado-error">{{ error }}</p>

              <button type="submit" class="btn-consultar" :disabled="cargando">
                <span>{{ cargando ? 'Consultando...' : 'Consultar estado' }}</span>
                <span class="btn-circle"><IconArrowRight :size="14" /></span>
              </button>
            </form>
          </template>

          <!-- ── Resultado ──────────────────────────────────────── -->
          <template v-else>
            <div class="estado-header">
              <h1 class="estado-title">
                {{ resultado.nombre ? `Saludos, ${resultado.nombre} ${resultado.apellido ?? ''}`.trim() : 'Tus procesos' }}
              </h1>
              <p v-if="resultado.procesos.length" class="estado-subtitle">Este es el estado actual de tus solicitudes en proceso.</p>
            </div>

            <div class="procesos-list">
              <div v-for="(proceso, i) in resultado.procesos" :key="i" class="proceso-row">
                <div class="proceso-icon" :class="proceso.tipo === 'credito' ? 'proceso-icon--credito' : 'proceso-icon--afiliacion'">
                  <component :is="proceso.tipo === 'credito' ? IconCreditCard : IconUserPlus" :size="20" />
                </div>
                <div class="proceso-content">
                  <div class="proceso-nombre">
                    {{ proceso.tipo === 'credito' ? 'Solicitud de crédito' : 'Solicitud de afiliación' }}
                  </div>
                  <div class="proceso-fecha">{{ fmtFecha(proceso.fecha) }}</div>
                </div>
                <div class="estado-pill" :class="estiloEstado(proceso)">
                  <component :is="iconoEstado(proceso)" :size="13" />
                  {{ etiquetaEstado(proceso) }}
                </div>
              </div>

              <div v-if="!resultado.procesos.length" class="sin-procesos-container">
                <div class="sin-procesos-icon">
                  <IconSearch :size="40" />
                </div>
                <p class="sin-procesos-title">No encontramos solicitudes activas</p>
                <p class="sin-procesos-text">Revisa que tu número de identificación y correo electrónico sean correctos. Si tienes dudas, contáctanos.</p>
              </div>
            </div>

            <button type="button" class="btn-volver-form" @click="router.push('/')">
              <IconArrowLeft :size="14" />
              Regresar a inicio
            </button>
          </template>

        </div>

      </div>
    </main>

    <!-- ── Footer (igual a HomePage) ─────────────────────── -->
    <PortalFooter class="footer--desktop-only" />

  </div>
</template>

<style scoped>
/* ─── Página: mismo fondo, mismo layout que HomePage ─── */
.estado-page {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-image: url('/imagen1.png');
  background-size: cover;
  background-position: center 60%;
  background-repeat: no-repeat;
  background-attachment: fixed;
  font-family: var(--font-body);
  position: relative;
  overflow: hidden;
}

@media (max-width: 960px) {
  .estado-page {
    background-position: 40% 50%;
    background-size: auto 130%;
  }
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
  gap: 8px;
}

.topbar-visit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-dark);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.topbar-visit:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.topbar-back {
  display: none;
}

@media (max-width: 960px) {
  .portal-topbar {
    position: relative;
    background: transparent;
    justify-content: flex-start;
    padding: 0 16px;
    height: 52px;
  }

  .topbar-desktop {
    display: none;
  }

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
}

/* ─── Badge VIGILADA lateral (solo desktop) ─── */
.vigilada-badge {
  position: fixed;
  top: 50%;
  left: 12px;
  z-index: 40;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: 0 0;
  white-space: nowrap;
  pointer-events: none;
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
  font-weight: var(--fw-regular);
  letter-spacing: 0.06em;
  color: var(--color-primary);
}


/* ─── Main ─── */
.estado-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  position: relative;
  z-index: 1;
}

@media (max-width: 960px) {
  .estado-main {
    justify-content: flex-end;
    align-items: stretch;
    padding: 0;
  }
}

@media (min-width: 961px) {
  .estado-main {
    align-items: flex-end;
    padding-right: 14%;
  }
}

/* ─── Anillos decorativos ─── */
.deco-ring {
  display: none;
}

/* ─── Contenido ─── */
.estado-content {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

@media (max-width: 960px) {
  .estado-content {
    max-width: 100%;
  }
}

@media (min-width: 961px) {
  .estado-content {
    max-width: 420px;
  }
}

.estado-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px 24px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
  width: 100%;
  box-sizing: border-box;
  gap: 6px;
}

.estado-card--resultado .procesos-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.estado-card--resultado .btn-volver-form {
  flex-shrink: 0;
  margin-top: auto;
}

@media (min-width: 961px) {
  .estado-card {
    border-radius: 24px;
    padding: 72px 40px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    min-height: unset;
    width: 420px;
    flex-shrink: 0;
  }
}

.estado-card--resultado {
  align-items: stretch;
}

@media (min-width: 961px) {
  .estado-card--resultado {
    justify-content: flex-start;
  }
}

.estado-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-dark);
  margin: 0;
  text-align: center;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.estado-subtitle {
  font-size: 16px;
  font-weight: var(--fw-regular);
  color: var(--color-text-2);
  margin: 0;
  text-align: center;
  line-height: 1.4;
  max-width: 380px;
}

.estado-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.estado-header .estado-subtitle {
  margin: 0;
  line-height: 1.4;
}

.estado-form {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.estado-error {
  font-size: var(--text-sm);
  color: var(--color-error-text);
  text-align: center;
  margin: 0;
}

.btn-consultar {
  width: 100%;
  height: 52px;
  border-radius: var(--r-pill);
  background: var(--color-primary);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  padding: 0 60px 0 36px;
  letter-spacing: 0.02em;
}

.btn-consultar:hover:not(:disabled) {
  background: var(--color-primary-dark, #0d3a45);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(17, 76, 90, 0.3);
}

.btn-consultar:hover:not(:disabled) .btn-circle {
  transform: translateY(-50%) translateX(3px);
  background: rgba(255, 255, 255, 0.3);
}

.btn-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transition: transform var(--transition-base);
}

@media (min-width: 961px) {
  .estado-title {
    font-size: 28px;
  }

  .estado-subtitle {
    font-size: 17px;
  }

  .btn-consultar {
    height: 60px;
    font-size: 15px;
  }
}

.btn-consultar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Resultado ─── */
.procesos-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 16px auto 20px;
  width: 100%;
  max-width: 380px;
}

.proceso-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--r-lg);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  width: 100%;
}

.proceso-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.proceso-icon--credito {
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
}

.proceso-icon--afiliacion {
  background: var(--color-bg-surface-alt);
  color: var(--color-accent-dark, var(--color-primary));
}

.proceso-content {
  flex: 1;
  min-width: 0;
}

.proceso-nombre {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.proceso-fecha {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  margin-top: 2px;
}

.estado-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  padding: 5px 10px;
  border-radius: var(--r-pill);
  white-space: nowrap;
  flex-shrink: 0;
}

.estado-pill--proceso {
  background: var(--color-bg-surface-alt);
  color: var(--color-text-2);
}

.estado-pill--ok {
  background: var(--color-success-bg, #e6f4ea);
  color: var(--color-success-text, #1e7a3d);
}

.sin-procesos-container {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}

.sin-procesos-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
  margin-bottom: 8px;
}

.sin-procesos-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0;
}

.sin-procesos-text {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.btn-volver-form {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  padding: 6px 12px;
}

.btn-volver-form:hover {
  text-decoration: underline;
}

/* ─── Footer ─── */
:deep(.footer-info-row),
:deep(.footer-sep),
:deep(.footer-email),
:deep(.footer-link) {
  color: var(--color-dark) !important;
  opacity: 0.7;
}

@media (max-width: 960px) {
  .footer--desktop-only {
    display: none;
  }

  .btn-consultar {
    justify-content: center;
    padding: 0 52px;
  }
}

/* ─── Animación ─── */
.animate-in {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
