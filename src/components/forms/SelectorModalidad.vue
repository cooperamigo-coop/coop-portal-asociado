<script setup>
import { CreditCard, GraduationCap } from 'lucide-vue-next'
import { IconCheck } from '@tabler/icons-vue'

defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const iconos = { CreditCard, GraduationCap }

const opciones = [
  {
    value:       'ordinario',
    titulo:      'Crédito Ordinario/Consumo',
    descripcion: 'Para necesidades personales, vivienda, vehículo u otros destinos.',
    icono:       'CreditCard',
  },
  {
    value:       'educativo',
    titulo:      'Crédito Educativo',
    descripcion: 'Para estudios de pregrado/postgrado en la Universidad Católica Luis Amigó',
    icono:       'GraduationCap',
  },
]
</script>

<template>
  <div class="selector-wrap">

    <!-- Encabezado -->
    <div class="selector-header">
      <h2 class="selector-titulo">Solicitud de crédito</h2>
      <p class="selector-subtitulo">¿Qué modalidad de crédito deseas solicitar?</p>
    </div>

    <!-- Grid de cards -->
    <div class="selector-grid">
      <div
        v-for="op in opciones"
        :key="op.value"
        class="modalidad-card"
        :class="{ 'modalidad-card--selected': modelValue === op.value }"
        @click="$emit('update:modelValue', op.value)"
      >
        <!-- Indicador de selección (esquina superior derecha) -->
        <div class="card-check" :class="{ 'card-check--active': modelValue === op.value }">
          <IconCheck v-if="modelValue === op.value" :size="11" />
        </div>

        <!-- Ícono -->
        <div class="card-icon" :class="{ 'card-icon--selected': modelValue === op.value }">
          <component :is="iconos[op.icono]" :size="26" />
        </div>

        <!-- Texto -->
        <div class="card-body">
          <div class="card-titulo">{{ op.titulo }}</div>
          <div class="card-desc">{{ op.descripcion }}</div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.selector-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2xl);
}

/* ─── Encabezado ─── */
.selector-header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.selector-titulo {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.1;
}

.selector-subtitulo {
  font-size: var(--text-base);
  color: var(--color-text-2);
  font-weight: var(--fw-regular);
  line-height: 1.3;
  margin: 0;
}

/* ─── Grid ─── */
.selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}

/* ─── Card ─── */
.modalidad-card {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
  gap: var(--sp-lg);
  padding: var(--sp-2xl) var(--sp-xl);
  border-radius: var(--r-xl);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-table);
}

.modalidad-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.modalidad-card--selected {
  border: 2px solid var(--color-primary);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

/* ─── Indicador check ─── */
.card-check {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.card-check--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
}

/* ─── Ícono ─── */
.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.card-icon--selected {
  background: var(--color-primary);
  color: #ffffff;
}

/* ─── Texto ─── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  flex: 1;
  min-width: 0;
}

.card-titulo {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  line-height: 1.3;
}

.card-desc {
  font-size: var(--text-sm);
  color: var(--color-text-3);
  font-weight: var(--fw-regular);
  line-height: 1.5;
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
  .selector-grid {
    grid-template-columns: 1fr;
  }

  .selector-header {
    text-align: left;
  }

  .selector-titulo {
    font-size: var(--text-lg);
  }

  .selector-subtitulo {
    font-size: var(--text-sm);
  }

  .modalidad-card {
    padding: var(--sp-xl);
  }

  .card-icon {
    width: 52px;
    height: 52px;
  }
}
</style>
