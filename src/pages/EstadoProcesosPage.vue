<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconArrowRight, IconSearch, IconCreditCard, IconUserPlus, IconCircleCheck, IconClockHour4, IconInfoCircle, IconFileSearch } from '@tabler/icons-vue'
import CampoTexto from '@/components/forms/CampoTexto.vue'
import PortalFooter from '@/components/layout/PortalFooter.vue'
import { useEstadoProcesos } from '@/composables/useEstadoProcesos'

const router = useRouter()
const { cedula, correo, honeypot, cargando, error, resultado, consultar, reiniciar } = useEstadoProcesos()

const correoTocado = ref(false)
const errorCorreo = computed(() => {
  if (!correoTocado.value || !correo.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value) ? '' : 'Ingresa un correo electrónico válido.'
})

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

function capitalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

// ── Detalle expandible ──────────────────────────────────────────────────────
const procesoAbierto = ref(null)

function toggleProceso(i) {
  procesoAbierto.value = procesoAbierto.value === i ? null : i
}

const ORDEN_CREDITO = ['radicado', 'en_revision', 'en_analisis', 'en_aprobacion', 'aprobado', 'pendiente_firma', 'firmado', 'enviado']

function etapasProceso(proceso) {
  if (proceso.tipo === 'credito') {
    const idx = ORDEN_CREDITO.indexOf(proceso.estado)
    const analisisEfectuado = idx >= ORDEN_CREDITO.indexOf('en_aprobacion')
    const aprobada          = idx >= ORDEN_CREDITO.indexOf('aprobado')
    return [
      { label: 'Radicación',        fecha: proceso.radicado_en, completada: true },
      { label: 'Análisis efectuado', fecha: null, completada: analisisEfectuado },
      { label: 'Aprobación',        fecha: proceso.fecha_aprobacion, completada: aprobada },
      { label: 'Desembolso',        fecha: proceso.fecha_desembolso, completada: !!proceso.fecha_desembolso },
    ]
  }
  return [
    { label: 'Radicada',   fecha: proceso.radicado_en, completada: true },
    { label: 'En revisión', fecha: proceso.fecha_revision, completada: true },
    { label: 'Aprobada',   fecha: proceso.estado === 'aprobado' ? proceso.actualizado_en : null, completada: proceso.estado === 'aprobado' },
  ]
}

</script>

<template>
  <div class="estado-page">

    <!-- ── Topbar (igual a HomePage) ─────────────────────────── -->
    <header class="portal-topbar">
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
        <span class="vb-nombre">
          <span class="vb-nombre-line">SUPERINTENDENCIA DE LA</span>
          <span class="vb-nombre-line">ECONOMÍA SOLIDARIA</span>
        </span>
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

        <div v-if="!resultado" class="estado-header">
          <div class="estado-header-icon">
            <IconFileSearch :size="26" />
          </div>
          <h1 class="estado-title">Estado de trámites <span>(Realizados en línea)</span></h1>
          <p class="estado-subtitle">Consulta el estado de trámites realizados en línea a través de <strong>serviciosdigitales.cooperamigo.coop</strong></p>
        </div>

        <!-- ── Card única: el contenido interno cambia, la card nunca se destruye ── -->
        <div class="estado-card animate-in" :class="{ 'estado-card--resultado': resultado }">

          <!-- ── Formulario: cédula + correo ───────────────────── -->
          <template v-if="!resultado">
            <form class="estado-form" @submit.prevent="consultar">
              <div style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;">
                <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />
              </div>

              <div class="estado-form-row">
                <CampoTexto
                  v-model="cedula"
                  label="Número de identificación"
                  solo-numeros
                  :maxlength="10"
                  required
                  class="estado-campo-cedula"
                />
                <CampoTexto
                  v-model="correo"
                  label="Correo electrónico"
                  type="email"
                  required
                  class="estado-campo-correo"
                  :error="errorCorreo"
                  @blur="correoTocado = true"
                />

                <button type="submit" class="btn-consultar" :disabled="cargando">
                  <span>{{ cargando ? 'Consultando...' : 'Consultar estado' }}</span>
                  <span class="btn-circle"><IconArrowRight :size="14" /></span>
                </button>
              </div>

              <p v-if="error" class="estado-error">{{ error }}</p>

              <div class="estado-aviso">
                <IconInfoCircle :size="18" class="estado-aviso-icon" />
                <span>Ingresa los datos con los que realizaste tu trámite para consultar su estado.</span>
              </div>
            </form>
          </template>

          <!-- ── Resultado ──────────────────────────────────────── -->
          <template v-else>
            <div class="estado-header estado-header--resultado">
              <div class="estado-title-row">
                <button type="button" class="estado-volver-icon" aria-label="Regresar a inicio" @click="router.push('/')">
                  <IconArrowLeft :size="18" />
                </button>
                <h1 v-if="resultado.nombre" class="estado-title">Sr(a), <span class="estado-title-nombre">{{ capitalizar(`${resultado.nombre} ${resultado.apellido ?? ''}`.trim()) }}</span></h1>
                <h1 v-else class="estado-title">Tus procesos</h1>
              </div>
              <p v-if="resultado.procesos.length" class="estado-subtitle">A continuación, encontrará el estado actual de las solicitudes que se encuentran en trámite.</p>
            </div>

            <div class="procesos-list">
              <div v-for="(proceso, i) in resultado.procesos" :key="i" class="proceso-card" :class="{ 'proceso-card--abierta': procesoAbierto === i }">
                <button type="button" class="proceso-row" @click="toggleProceso(i)">
                  <div class="proceso-icon" :class="proceso.tipo === 'credito' ? 'proceso-icon--credito' : 'proceso-icon--afiliacion'">
                    <component :is="proceso.tipo === 'credito' ? IconCreditCard : IconUserPlus" :size="20" />
                  </div>
                  <div class="proceso-content">
                    <div class="proceso-nombre">
                      {{ proceso.tipo === 'credito' ? 'Solicitud de crédito' : 'Solicitud de afiliación' }}
                    </div>
                    <div class="proceso-fecha">Radicado el {{ fmtFecha(proceso.radicado_en || proceso.fecha) }}</div>
                  </div>
                  <div class="estado-pill" :class="estiloEstado(proceso)">
                    <component :is="iconoEstado(proceso)" :size="13" />
                    {{ etiquetaEstado(proceso) }}
                  </div>
                </button>

                <div v-if="procesoAbierto === i" class="proceso-detalle">
                  <div class="proceso-stepper">
                    <template v-for="(etapa, ei) in etapasProceso(proceso)" :key="ei">
                      <div class="proceso-step">
                        <div class="proceso-step-icon" :class="{ 'proceso-step-icon--done': etapa.completada }">
                          <IconCircleCheck v-if="etapa.completada" :size="16" />
                          <IconFileSearch v-else :size="16" />
                        </div>
                        <div class="proceso-step-texto">
                          <div class="proceso-step-label">{{ etapa.label }}</div>
                          <div class="proceso-step-fecha">{{ etapa.fecha ? fmtFecha(etapa.fecha) : (etapa.completada ? 'Completado' : 'Pendiente') }}</div>
                        </div>
                      </div>
                      <div v-if="ei < etapasProceso(proceso).length - 1" class="proceso-step-line" :class="{ 'proceso-step-line--done': etapa.completada }" />
                    </template>
                  </div>
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

            <div v-if="resultado.procesos.length" class="estado-aviso">
              <IconInfoCircle :size="18" class="estado-aviso-icon" />
              <span>Te notificaremos por correo electrónico cuando haya novedades sobre tu solicitud.</span>
            </div>
          </template>

        </div>

      </div>
    </main>

    <!-- ── Footer (igual a HomePage) ─────────────────────── -->
    <PortalFooter />

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
  background: var(--color-bg-app);
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
}

@media (max-width: 960px) {
  .portal-topbar {
    position: relative;
    background: transparent;
    justify-content: flex-start;
    padding: 0 16px;
    height: 52px;
  }

  .topbar-back:hover {
    color: var(--color-primary);
  }
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
  transition: opacity 0.2s;
}

.vigilada-badge:hover {
  opacity: 0.7;
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
  background: var(--color-primary);
  border-radius: 1px;
}

.vb-vigilada {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: var(--fw-bold);
  letter-spacing: 0.18em;
  color: var(--color-primary);
  text-align: center;
  line-height: 1.4;
}

.vb-nombre {
  display: flex;
  flex-direction: column;
  font-family: var(--font-display);
  font-size: 0.625rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.04em;
  color: var(--color-primary);
  line-height: 1.35;
}

.vb-nombre-line {
  display: block;
}

@media (max-width: 960px) {
  .vigilada-badge { display: none; }
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
    align-items: center;
    justify-content: center;
    padding: 0;
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

  .estado-content > .estado-header {
    padding: 0 24px;
    box-sizing: border-box;
  }

  .estado-content > .estado-header .estado-subtitle {
    margin-top: 12px;
  }
}

@media (min-width: 961px) {
  .estado-content {
    max-width: 960px;
  }
}

.estado-card {
  background: var(--color-bg-card);
  border: none;
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  gap: 6px;
}

.estado-card--resultado .procesos-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

@media (min-width: 961px) {
  .estado-card {
    padding: 48px;
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
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
  text-align: center;
  line-height: 1.1;
}

.estado-title span {
  font-size: 1.6rem;
  font-weight: 700;
}

@media (max-width: 960px) {
  .estado-title {
    line-height: 1;
  }

  .estado-title span {
    display: block;
    margin-top: 2px;
  }
}

.estado-title .estado-title-nombre {
  font-size: 2.2rem;
  font-weight: 700;
}

.estado-subtitle {
  font-size: 16px;
  font-weight: var(--fw-regular);
  color: var(--color-text-2);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}

.estado-subtitle strong {
  font-size: 1.05rem;
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.estado-aviso {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  color: var(--color-text-3);
  font-size: var(--text-sm);
  text-align: center;
}

@media (max-width: 960px) {
  .estado-aviso {
    align-items: flex-start;
    text-align: left;
  }

  .estado-aviso-icon {
    margin-top: 2px;
  }
}

.estado-aviso-icon {
  flex-shrink: 0;
}

.estado-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  margin-bottom: 0;
}

.estado-header-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  margin-bottom: 32px;
  flex-shrink: 0;
}

@media (min-width: 961px) {
  .estado-header-icon {
    margin-bottom: 48px;
  }
}

.estado-header .estado-subtitle {
  margin: 0;
  line-height: 1.4;
}

.estado-header--resultado {
  align-items: flex-start;
}

.estado-header--resultado .estado-title,
.estado-header--resultado .estado-subtitle {
  text-align: left;
}

.estado-header--resultado .estado-subtitle {
  margin-left: 54px;
}

.estado-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.estado-volver-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.estado-volver-icon:hover {
  background: var(--color-border);
}

.estado-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 0;
}

.estado-form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

@media (min-width: 961px) {
  .estado-form-row {
    flex-direction: row;
    align-items: flex-end;
    gap: 12px;
  }

  .estado-form-row :deep(.campo-wrapper) {
    flex: 1;
    min-width: 0;
  }

  .estado-form-row :deep(.estado-campo-cedula) {
    flex: 0.75;
  }

  .estado-form-row :deep(.estado-campo-correo) {
    flex: 1.25;
  }
}

.estado-error {
  font-size: var(--text-sm);
  color: var(--color-error-text);
  text-align: center;
  margin: 0;
}

.btn-consultar {
  width: 100%;
  height: 48px;
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
  padding: 0 52px 0 28px;
  letter-spacing: 0.02em;
}

.btn-consultar:hover:not(:disabled) {
  background: var(--color-primary-dark, #0d3a45);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 43, 54, 0.3);
}

@media (min-width: 961px) {
  .btn-consultar {
    width: auto;
    flex-shrink: 0;
  }
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

.btn-consultar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Resultado ─── */
.procesos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px auto 20px;
  width: 100%;
}

.proceso-card {
  width: 100%;
  border-radius: var(--r-lg);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.proceso-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.proceso-detalle {
  padding: 0 20px 20px;
  animation: fadeInUp 0.3s ease;
}

.proceso-stepper {
  display: flex;
  align-items: flex-start;
  padding: 12px 8px 20px;
}

.proceso-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 110px;
  text-align: center;
}

.proceso-step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-alt);
  color: var(--color-text-3);
}

.proceso-step-icon--done {
  background: var(--color-success);
  color: #fff;
}

.proceso-step-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.proceso-step-label {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  line-height: 1.2;
}

.proceso-step-fecha {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  line-height: 1.2;
}

.proceso-step-line {
  flex: 1;
  height: 2px;
  background: var(--color-border);
  margin-top: 16px;
  min-width: 12px;
}

.proceso-step-line--done {
  background: var(--color-success);
}

.proceso-datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.proceso-dato-label {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.proceso-dato-valor {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
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
  line-height: 1.2;
}

.proceso-fecha {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  line-height: 1.2;
  margin-top: 0;
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

/* ─── Footer ─── */
:deep(.footer-info-row),
:deep(.footer-sep),
:deep(.footer-email),
:deep(.footer-link) {
  color: var(--color-text-1) !important;
  opacity: 0.7;
}

@media (max-width: 960px) {
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
