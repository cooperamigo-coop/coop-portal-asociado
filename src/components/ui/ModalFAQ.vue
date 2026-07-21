<script setup>
import { ref } from 'vue'
import { X, HelpCircle, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const faqs = [
  {
    pregunta: '¿Cómo me asocio a la Cooperativa?',
    respuesta: ''
  },
  {
    pregunta: '¿Cuáles son los requisitos para solicitar un crédito?',
    respuesta: ''
  },
  {
    pregunta: '¿Dónde puedo pagar mis obligaciones?',
    respuesta: ''
  },
  {
    pregunta: '¿Cómo actualizo mis datos personales?',
    respuesta: ''
  },
  {
    pregunta: '¿Cuánto tiempo tarda en aprobarse un crédito?',
    respuesta: ''
  }
]

const openIndex = ref(null)

function toggleFaq(index) {
  openIndex.value = openIndex.value === index ? null : index
}

function cerrar() {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-modal">
      <div v-if="visible" :style="{
        position: 'fixed', inset: '0', zIndex: '100',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }">
        <div :style="{
          position: 'absolute', inset: '0',
          background: 'rgba(23,43,54,0.55)',
          backdropFilter: 'blur(3px)',
        }" @click="cerrar()" />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-faq-title"
          :style="{
            position: 'relative', width: '100%', maxWidth: '800px',
            background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-modal)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }"
        >
          <!-- Header -->
          <div :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--sp-xl)',
            borderBottom: '1px solid var(--color-border-card)',
            background: '#f8f8f8',
            borderRadius: 'var(--r-md) var(--r-md) 0 0',
            flexShrink: '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <HelpCircle :size="18" style="color: white;" />
              </div>
              <div :style="{ lineHeight: '1.2' }">
                <div id="modal-faq-title" :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                  Preguntas frecuentes
                </div>
              </div>
            </div>
            <button :style="{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center',
            }" @click="cerrar()">
              <X :size="20" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Body (Accordion) -->
          <div :style="{ padding: 'var(--sp-xl)', overflowY: 'auto', flex: '1' }">
            <div class="faq-accordion">
              <div 
                v-for="(faq, index) in faqs" 
                :key="index"
                class="faq-item"
                :class="{ 'is-open': openIndex === index }"
              >
                <button class="faq-question" @click="toggleFaq(index)">
                  <span class="faq-question-text">{{ faq.pregunta }}</span>
                  <ChevronDown class="faq-chevron" :size="20" />
                </button>
                <div class="faq-answer-wrapper" :style="{ display: 'grid', gridTemplateRows: openIndex === index ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }">
                  <div :style="{ overflow: 'hidden' }">
                    <div class="faq-answer">
                      {{ faq.respuesta }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-modal-enter-active { transition: opacity 0.2s ease; }
.fade-modal-leave-active { transition: opacity 0.15s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to     { opacity: 0; }

.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--r-md);
  background: var(--color-bg-surface);
  overflow: hidden;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.faq-item.is-open {
  border-color: transparent;
  background-color: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-1);
  font-family: var(--font-body);
  font-weight: var(--fw-bold);
  font-size: 0.95rem;
}

.faq-question:hover {
  background-color: rgba(0,0,0,0.02);
}

.faq-question-text {
  padding-right: 16px;
}

.faq-chevron {
  flex-shrink: 0;
  color: var(--color-text-3);
  transition: transform var(--transition-base);
}

.faq-item.is-open .faq-chevron {
  transform: rotate(180deg);
  color: var(--color-primary);
}

.faq-answer-wrapper {
  /* Animation handled in inline styles */
}

.faq-answer {
  padding: 0 16px 16px 16px;
  color: var(--color-text-2);
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
