<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconBriefcase, IconBuildingStore, IconHeartHandshake, IconBook, IconHome, IconChevronDown, IconCheck } from '@tabler/icons-vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import ServiceCard from '@/components/ui/ServiceCard.vue'

const { isMobile } = useBreakpoint()

const props = defineProps({
  modelValue: { type: String, default: '' },
  error:      { type: String, default: null },
  disabled:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const abierto = ref(false)
const containerRef = ref(null)
const dropdownRef = ref(null)

const dropdownStyle = ref({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '0',
  zIndex: '9999',
})

const opciones = [
  { value: 'empleado',      label: 'Empleado',       icono: IconBriefcase,       descripcion: 'Trabajador dependiente con contrato laboral activo.' },
  { value: 'independiente', label: 'Independiente',  icono: IconBuildingStore,   descripcion: 'Trabajador por cuenta propia o dueño de negocio.' },
  { value: 'pensionado',    label: 'Pensionado',     icono: IconHeartHandshake,  descripcion: 'Persona que recibe una mesada pensional.' },
  { value: 'estudiante',    label: 'Estudiante',     icono: IconBook,            descripcion: 'Persona dedicada a su formación académica.' },
  { value: 'cuidado_hogar', label: 'Cuidado Hogar',  icono: IconHome,            descripcion: 'Persona dedicada a las labores del hogar.' },
]

const labelSeleccionado = computed(() => {
  if (!props.modelValue) return ''
  return opciones.find(o => o.value === props.modelValue)?.label ?? ''
})

function calcularPosicion() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = Math.min(opciones.length * 50, 250)

  let top = rect.bottom + 4
  if (top + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
    top = rect.top - dropdownHeight - 4
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

function abrir() {
  if (props.disabled) return
  calcularPosicion()
  abierto.value = true
}

function cerrar() {
  abierto.value = false
  emit('blur')
}

function seleccionar(opcion) {
  emit('update:modelValue', opcion.value)
  cerrar()
}

function onClickFuera(e) {
  if (!abierto.value) return
  const clickEnContenedor = containerRef.value?.contains(e.target)
  const clickEnDropdown = dropdownRef.value?.contains(e.target)
  if (!clickEnContenedor && !clickEnDropdown) {
    cerrar()
  }
}

function actualizarPosicion() {
  if (!abierto.value) return
  calcularPosicion()
}

onMounted(() => {
  document.addEventListener('mousedown', onClickFuera)
  window.addEventListener('scroll', actualizarPosicion, true)
  window.addEventListener('resize', actualizarPosicion)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickFuera)
  window.removeEventListener('scroll', actualizarPosicion, true)
  window.removeEventListener('resize', actualizarPosicion)
})
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
    <div v-if="isMobile" ref="containerRef" class="campo-wrapper" :style="{ marginTop: 'var(--sp-xs)' }">
      <div 
        class="campo-field" 
        :class="{ 
          'campo-field--floated': !!modelValue || abierto,
          'campo-field--open': abierto,
          'campo-field--error': !!error,
        }"
        @click="abierto ? cerrar() : abrir()"
      >
        <div class="campo-select-trigger">
          <span class="campo-value" :class="{ 'campo-value--empty': !modelValue }">
            {{ labelSeleccionado }}
          </span>
          
          <IconChevronDown 
            :size="18" 
            class="campo-chevron" 
            :class="{ 'campo-chevron--open': abierto }" 
          />
        </div>

        <label class="campo-label">
          Situación laboral actual<span class="campo-required">*</span>
        </label>
      </div>

      <Teleport to="body">
        <Transition name="dropdown-fade">
          <div
            v-if="abierto"
            ref="dropdownRef"
            class="campo-dropdown"
            :style="dropdownStyle"
          >
            <div
              v-for="opcion in opciones"
              :key="opcion.value"
              class="campo-option"
              :class="{ 'campo-option--selected': modelValue === opcion.value }"
              @click="seleccionar(opcion)"
            >
              <span>{{ opcion.label }}</span>
              <IconCheck v-if="modelValue === opcion.value" :size="16" />
            </div>
          </div>
        </Transition>
      </Teleport>

      <span v-if="error" class="campo-msg campo-msg--error">{{ error }}</span>
    </div>

    <div v-else :style="{
      display:  'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap:      'var(--sp-sm)',
      marginTop:'var(--sp-xs)',
    }">
      <ServiceCard
        v-for="op in opciones"
        :key="op.value"
        :icon="op.icono"
        :title="op.label"
        :description="op.descripcion"
        :selected="modelValue === op.value"
        :show-action="false"
        clickable
        :style="{ padding: '16px' }"
        @click="$emit('update:modelValue', op.value)"
      />
    </div>

    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>

<style scoped>
.campo-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.campo-field {
  position: relative;
  height: 48px;
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--r-md);
  background: transparent;
  cursor: pointer;
  transition: border-bottom-color var(--transition-fast), box-shadow var(--transition-fast);
  display: flex;
  align-items: center;
  padding: 12px 10px 0 10px;
}

.campo-field--open {
  border-bottom-color: var(--color-primary);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

.campo-field--error {
  border-bottom-color: var(--color-error) !important;
  box-shadow: 0 1px 0 0 var(--color-error) !important;
}

.campo-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.campo-value {
  font-size: var(--text-base);
  color: var(--color-text-1);
  font-family: var(--font-body);
}

.campo-value--empty {
  color: transparent;
}

.campo-chevron {
  color: var(--color-text-3);
  transition: transform var(--transition-fast);
}

.campo-chevron--open {
  transform: rotate(180deg);
}

.campo-label {
  position: absolute;
  left: 10px;
  top: 30px;
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 32px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    font-weight var(--transition-fast),
    color var(--transition-fast);
}

.campo-field--floated .campo-label {
  top: 2px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: var(--fw-medium);
  background: transparent;
  padding: 0;
}

.campo-required { color: var(--color-error); }

.campo-dropdown {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-modal);
  overflow-y: auto;
  max-height: 250px;
  box-sizing: border-box;
}

.campo-option {
  padding: var(--sp-md) var(--sp-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-base);
  color: var(--color-text-1);
  transition: background var(--transition-fast);
}

.campo-option:hover {
  background: var(--color-bg-surface-alt);
}

.campo-option--selected {
  background: var(--color-bg-card);
  color: var(--color-primary);
  font-weight: var(--fw-bold);
}

.campo-msg { font-size: var(--text-xs); font-weight: var(--fw-medium); }
.campo-msg--error { color: var(--color-error-text); }

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
