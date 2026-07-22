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
      titulo:      'Crédito Ordinario',
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
  <div class="selector-group">

    <!-- Encabezado -->
    <h2 class="selector-titulo">¿Qué tipo de crédito deseas?</h2>

    <!-- Stack de cards -->
    <div class="selector-stack">
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
/* ─── Stack de tipos de crédito (mismo estilo que "¿Qué deseas hacer?") ─── */
.selector-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-titulo {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0 0 16px;
  text-align: center;
}

.selector-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 961px) {
  .selector-group {
    max-width: 700px;
    margin: 0 auto;
  }

  .selector-stack {
    flex-direction: row;
    align-items: stretch;
  }

  .selector-stack > * {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 960px) {
  .selector-group {
    padding: 0 20px;
    box-sizing: border-box;
  }

  .selector-stack {
    flex-direction: row;
    align-items: stretch;
  }

  .selector-stack > * {
    flex: 1;
    min-width: 0;
  }

  .selector-titulo {
    font-size: var(--text-lg);
  }
}

/* ─── Botón continuar (solo móvil) ─── */
.selector-continuar-btn {
  display: none;
}

@media (max-width: 960px) {
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
    margin-top: 4px;
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
</style>
