<script setup>
import { computed } from 'vue'
import { CreditCard, GraduationCap, RefreshCcw } from 'lucide-vue-next'
import { IconArrowRight } from '@tabler/icons-vue'
import ServiceCard from '@/components/ui/ServiceCard.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  // Solo se ofrece Crédito Rotativo a los asociados habilitados para el
  // producto (se verifica por cédula tras el paso de verificación)
  mostrarRotativo: { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'continuar'])

const iconos = { CreditCard, GraduationCap, RefreshCcw }

const opciones = computed(() => {
  const base = [
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
  if (props.mostrarRotativo) {
    base.push({
      value:       'rotativo',
      titulo:      'Crédito Rotativo',
      descripcion: 'Tu cupo pre-aprobado: actívalo o solicita desembolsos cuando lo necesites.',
      icono:       'RefreshCcw',
    })
  }
  return base
})
</script>

<template>
  <div class="selector-wrap">

    <!-- Encabezado -->
    <div class="selector-header">
      <h2 class="selector-titulo">Elige el tipo de crédito</h2>
    </div>

    <!-- Grid de cards -->
    <div class="selector-grid" :class="{ 'selector-grid--3': opciones.length === 3 }">
      <ServiceCard
        v-for="op in opciones"
        :key="op.value"
        :icon="iconos[op.icono]"
        :title="op.titulo"
        :description="op.descripcion"
        :selected="modelValue === op.value"
        action-label="Seleccionar"
        clickable
        @click="$emit('update:modelValue', op.value)"
      />
    </div>

    <!-- Botón continuar: solo visible en móvil cuando hay selección -->
    <Transition name="slide-up">
      <button v-if="modelValue" class="selector-continuar-btn" @click="$emit('continuar')">
        <span>Continuar</span>
        <span class="selector-continuar-circle"><IconArrowRight :size="14" /></span>
      </button>
    </Transition>

  </div>
</template>

<style scoped>
.selector-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--color-bg-card);
  border-radius: 20px;
  padding: 40px 32px;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .selector-wrap {
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (min-width: 860px) {
  .selector-wrap:has(.selector-grid--3) {
    max-width: 1020px;
  }
}

/* ─── Encabezado ─── */
.selector-header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  text-align: center;
}

.selector-titulo {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.1;
}

/* ─── Grid ─── */
.selector-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 600px) {
  .selector-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 860px) {
  .selector-grid--3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ─── Botón continuar (solo móvil) ─── */
.selector-continuar-btn {
  display: none;
}

@media (max-width: 600px) {
  .selector-continuar-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 52px;
    border-radius: var(--r-pill);
    background: var(--color-primary);
    color: #ffffff;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: var(--fw-semibold);
    padding: 0 8px 0 8px;
    box-shadow: var(--shadow-btn);
    transition: all var(--transition-base);
  }

  .selector-continuar-btn span:first-child {
    flex: 1;
    text-align: center;
  }

  .selector-continuar-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
  .selector-wrap {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
    padding: 28px 22px calc(32px + env(safe-area-inset-bottom, 0px));
    gap: var(--sp-lg);
  }

  .selector-grid {
    grid-template-columns: 1fr;
    gap: var(--sp-md);
  }

  .selector-header {
    text-align: center;
  }

  .selector-titulo {
    font-size: var(--text-lg);
  }
}
</style>
