<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { IconChevronDown, IconSearch, IconX, IconCheck } from '@tabler/icons-vue'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  label:       { type: String, required: true },
  opciones:    { type: Array,  required: true }, // [{ value, label }]
  placeholder: { type: String, default: 'Seleccione' },
  required:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  clearable:   { type: Boolean, default: false },
  error:       { type: String,  default: null },
  helper:      { type: String,  default: null },
  limit:       { type: Number,  default: 10 },
})
const emit = defineEmits(['update:modelValue', 'blur'])

const abierto      = ref(false)
const busqueda     = ref('')
const inputRef     = ref(null)
const containerRef = ref(null)
const dropdownRef  = ref(null)

const dropdownStyle = ref({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '0',
  zIndex: '10000',
})

const floated = computed(() => abierto.value || !!props.modelValue)

const labelSeleccionado = computed(() => {
  if (!props.modelValue) return ''
  return props.opciones.find(o => o.value === props.modelValue)?.label ?? ''
})

const opcionesFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  const todas = q
    ? props.opciones.filter(o => o.label.toLowerCase().includes(q))
    : props.opciones
  return props.limit > 0 ? todas.slice(0, props.limit) : todas
})

function calcularPosicion() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const dropdownHeight = 300 

  let top = rect.bottom + 4
  if (top + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
    top = rect.top - dropdownHeight - 4
  }

  // Si el input es muy estrecho (como en el modal de dirección), 
  // le damos un ancho mínimo al dropdown para que no se vea "mocho"
  const minWidth = 220
  const width = Math.max(rect.width, minWidth)
  
  // Calculamos el left intentando que quede alineado a la izquierda del input,
  // pero si se sale por la derecha, lo empujamos hacia la izquierda.
  let left = rect.left
  if (left + width > viewportWidth - 20) {
    left = viewportWidth - width - 20
  }

  // Si aún así se sale por la izquierda, lo pegamos al borde
  if (left < 10) left = 10

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    zIndex: '10000',
  }
}

async function abrir() {
  if (props.disabled) return
  calcularPosicion()
  abierto.value = true
  busqueda.value = ''
  await nextTick()
  calcularPosicion()
  setTimeout(() => inputRef.value?.focus(), 50)
}

function cerrar() {
  abierto.value = false
  busqueda.value = ''
  emit('blur')
}

function seleccionar(opcion) {
  emit('update:modelValue', opcion.value)
  cerrar()
}

function limpiar(e) {
  e.stopPropagation()
  emit('update:modelValue', '')
}

function onKeydown(e) {
  if (e.key === 'Escape') cerrar()
  if (e.key === 'Enter' && opcionesFiltradas.value.length > 0) {
    seleccionar(opcionesFiltradas.value[0])
  }
}

function onClickFuera(e) {
  if (!abierto.value) return
  
  const clickEnContenedor = containerRef.value?.contains(e.target)
  const clickEnDropdown = dropdownRef.value?.contains(e.target)

  if (!clickEnContenedor && !clickEnDropdown) {
    cerrar()
  }
}

// Actualizar posición si se hace scroll o resize mientras está abierto
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
  <div
    ref="containerRef"
    class="csb-wrapper"
  >
    <!-- Trigger con label flotante integrada -->
    <div
      class="csb-field"
      :class="{
        'csb-field--floated':  floated,
        'csb-field--open':     abierto,
        'csb-field--error':    !!error,
        'csb-field--disabled': disabled,
      }"
      @click="abierto ? cerrar() : abrir()"
    >
      <!-- Valor seleccionado -->
      <span class="csb-value" :class="{ 'csb-value--empty': !modelValue }">
        {{ labelSeleccionado }}
      </span>

      <!-- Label flotante -->
      <label
        class="csb-label"
        :class="{
          'csb-label--focused': abierto && !error,
          'csb-label--error':   !!error,
        }"
      >
        {{ label }}<span v-if="required" class="csb-required"> *</span>
      </label>

      <!-- Botón limpiar -->
      <button
        v-if="clearable && modelValue && !disabled"
        class="csb-clear"
        @click.stop="limpiar($event)"
      >
        <IconX :size="14" />
      </button>

      <IconChevronDown
        :size="16"
        class="csb-chevron"
        :class="{ 'csb-chevron--open': abierto }"
      />
    </div>

    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div
          v-if="abierto"
          ref="dropdownRef"
          class="csb-dropdown"
          :style="{
            ...dropdownStyle,
            boxSizing:    'border-box',
            background:   'var(--color-bg-card)',
            border:       '1px solid var(--color-border)',
            borderRadius: 'var(--r-md)',
            boxShadow:    'var(--shadow-modal)',
            overflow:     'hidden',
          }"
        >
          <!-- Buscador -->
          <div :style="{
            padding:      'var(--sp-sm)',
            borderBottom: '1px solid var(--color-border-light)',
            background:   'var(--color-bg-surface)',
            display:      'flex',
            alignItems:   'center',
            gap:          'var(--sp-sm)',
          }">
            <IconSearch :size="14" :style="{ color: 'var(--color-text-3)', flexShrink: '0' }" />
            <input
              ref="inputRef"
              v-model="busqueda"
              type="text"
              placeholder="Buscar..."
              :style="{
                flex:       '1',
                border:     'none',
                outline:    'none',
                background: 'transparent',
                fontSize:   'var(--text-base)',
                fontFamily: 'var(--font-body)',
                color:      'var(--color-text-1)',
              }"
              @keydown="onKeydown"
            />
          </div>

          <!-- Lista de opciones -->
          <div :style="{ maxHeight: '240px', overflowY: 'auto' }">
            <div
              v-if="opcionesFiltradas.length === 0"
              :style="{
                padding:    'var(--sp-xl)',
                textAlign:  'center',
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-3)',
                fontWeight: 'var(--fw-medium)',
              }"
            >Sin resultados</div>

            <div
              v-for="opcion in opcionesFiltradas"
              :key="opcion.value"
              :style="{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        'var(--sp-md) var(--sp-lg)',
                cursor:         'pointer',
                fontSize:       'var(--text-base)',
                fontWeight:     modelValue === opcion.value ? 'var(--fw-bold)' : 'var(--fw-medium)',
                color:          modelValue === opcion.value ? 'var(--color-primary)' : 'var(--color-text-1)',
                background:     modelValue === opcion.value ? 'var(--color-bg-card)' : 'transparent',
                transition:     'background var(--transition-fast)',
                borderBottom:   '1px solid var(--color-border-light)',
              }"
              @mouseenter="e => { if (modelValue !== opcion.value) e.currentTarget.style.background = 'var(--color-bg-surface)' }"
              @mouseleave="e => { if (modelValue !== opcion.value) e.currentTarget.style.background = 'transparent' }"
              @click="seleccionar(opcion)"
            >
              <span>{{ opcion.label }}</span>
              <IconCheck
                v-if="modelValue === opcion.value"
                :size="14"
                :style="{ color: 'var(--color-primary)', flexShrink: '0' }"
              />
            </div>
          </div>

          <!-- Contador si hay más resultados de los mostrados -->
          <div
            v-if="limit > 0 && busqueda && opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase())).length > limit"
            :style="{
              padding:    'var(--sp-sm) var(--sp-lg)',
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-3)',
              fontWeight: 'var(--fw-medium)',
              borderTop:  '1px solid var(--color-border-light)',
              textAlign:  'center',
            }"
          >
            Mostrando 10 de
            {{ opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase())).length }}
            resultados. Refine su búsqueda.
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Error / Helper -->
    <span v-if="error"       class="csb-msg csb-msg--error">{{ error }}</span>
    <span v-else-if="helper" class="csb-msg csb-msg--helper">{{ helper }}</span>
  </div>
</template>

<style scoped>
/* ── Wrapper ── */
.csb-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  position: relative;
}

/* ── Trigger / field (Estilo Minimalista) ── */
.csb-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  padding: 16px 12px 0 12px; /* Espacio superior para label y lateral suave */
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--r-md);
  background: transparent;
  cursor: pointer;
  user-select: none;
  transition: border-bottom-color var(--transition-fast), box-shadow var(--transition-fast);
  height: 54px;
  box-sizing: border-box;
}

.csb-field--open { 
  border-bottom-color: var(--color-primary); 
  box-shadow: 0 1px 0 0 var(--color-primary);
}

.csb-field--error { 
  border-bottom-color: var(--color-error) !important; 
  box-shadow: 0 1px 0 0 var(--color-error) !important;
}

.csb-field--disabled { 
  background: transparent; 
  border-bottom-style: dashed;
  cursor: not-allowed; 
}

/* ── Valor ── */
.csb-value {
  flex: 1;
  font-size: var(--text-base);
  font-family: var(--font-body);
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
.csb-value--empty { color: transparent; }

/* ── Label: en reposo actúa como placeholder dentro del trigger ── */
.csb-label {
  position: absolute;
  left: 12px;
  top: 35px; /* Alineado con el centro del área de texto */
  transform: translateY(-50%);
  font-size: var(--text-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-3);
  background: transparent;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 40px);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    font-weight var(--transition-fast),
    color var(--transition-fast);
}

/* ── Flotado: dentro del contenedor ── */
.csb-field--floated .csb-label {
  top: 4px;
  transform: translateY(0);
  font-size: 11px;
  font-weight: var(--fw-medium);
  background: transparent;
  padding: 0;
}

.csb-label--focused { color: var(--color-primary); }
.csb-label--error   { color: var(--color-error-text); }

.csb-required { color: var(--color-error); }

/* ── Botón limpiar ── */
.csb-clear {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--color-text-3);
  flex-shrink: 0;
}

/* ── Chevron ── */
.csb-chevron {
  color: var(--color-text-3);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}
.csb-chevron--open { transform: rotate(180deg); }

/* ── Mensajes error/helper ── */
.csb-msg {
  font-size: var(--text-xs);
  font-weight: var(--fw-medium);
  padding-top: 2px;
}
.csb-msg--error  { color: var(--color-error-text); }
.csb-msg--helper { color: var(--color-text-3); }

/* ── Dropdown ── */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity:   0;
  transform: translateY(-4px);
}
</style>
