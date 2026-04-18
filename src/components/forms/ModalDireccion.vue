<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VIAS_PRINCIPALES, DEPARTAMENTOS, getMunicipios } from '@/data/colombiaData.js'
import { IconMapPin, IconX, IconCheck } from '@tabler/icons-vue'
import PortalButton        from '@/components/ui/PortalButton.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'
import CampoTexto          from './CampoTexto.vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  visible:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:visible', 'confirmar'])

const isMobile = ref(window.innerWidth < 640)
const handleResize = () => { isMobile.value = window.innerWidth < 640 }

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const local = ref({
  depto_codigo: '', depto_nombre: '',
  municipio_codigo: '', municipio_nombre: '',
  via_principal: '', numero_via: '', letra_via: '', bis: false, cuadrante_via: '',
  numero_cruce: '', letra_cruce: '', numero_placa: '', cuadrante_cruce: '',
  complemento: '', barrio: '',
})

watch(() => props.visible, (v) => {
  if (v) {
    local.value = {
      ...local.value,
      ...props.modelValue,
    }
  }
}, { immediate: true })

const opcionesDeptos = computed(() =>
  DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))
)
const opcionesMunicipios = computed(() =>
  getMunicipios(local.value.depto_codigo || '').map(m => ({ value: m.codigo, label: m.nombre }))
)
const opcionesCuadrante = [
  { value: 'NORTE', label: 'Norte' },
  { value: 'SUR',   label: 'Sur'   },
  { value: 'ESTE',  label: 'Este'  },
  { value: 'OESTE', label: 'Oeste' },
]

function onDeptoChange(codigo) {
  local.value.depto_codigo     = codigo
  local.value.municipio_codigo = ''
  local.value.municipio_nombre = ''
  const d = DEPARTAMENTOS.find(dep => dep.codigo === codigo)
  local.value.depto_nombre     = d?.nombre || ''
}

function onMunicipioChange(codigo) {
  local.value.municipio_codigo = codigo
  const m = getMunicipios(local.value.depto_codigo).find(m => m.codigo === codigo)
  local.value.municipio_nombre = m?.nombre || ''
}

watch(() => local.value.letra_via, (v) => { if (typeof v === 'string') local.value.letra_via = v.toUpperCase() })
watch(() => local.value.letra_cruce, (v) => { if (typeof v === 'string') local.value.letra_cruce = v.toUpperCase() })
watch(() => local.value.numero_placa, (v) => { if (typeof v === 'string') local.value.numero_placa = v.toUpperCase() })

const preview = computed(() => {
  const {
    via_principal, numero_via, letra_via, bis, cuadrante_via,
    numero_cruce, letra_cruce, numero_placa, cuadrante_cruce,
    complemento, barrio, municipio_nombre, depto_nombre
  } = local.value

  if (!via_principal || !numero_via || !numero_placa) return ''

  let s = `${via_principal} ${numero_via}`
  if (letra_via)     s += ` ${letra_via}`
  if (bis)           s += ' BIS'
  if (cuadrante_via) s += ` ${cuadrante_via}`
  s += ` # ${numero_cruce || ''}`
  if (letra_cruce)   s += ` ${letra_cruce}`
  s += ` - ${numero_placa}`
  if (cuadrante_cruce) s += ` ${cuadrante_cruce}`
  if (complemento)   s += `, ${complemento}`
  if (barrio)        s += `, ${barrio}`
  if (municipio_nombre) s += `, ${municipio_nombre}`
  if (depto_nombre)     s += ` (${depto_nombre})`

  return s.toUpperCase()
})

function confirmar() {
  emit('update:modelValue', { ...local.value })
  emit('confirmar', preview.value)
  cerrar()
}

function cerrar() { emit('update:visible', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-modal">
      <div v-if="visible" :style="{
        position: 'fixed', inset: '0', zIndex: '75',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }">
        <div :style="{
          position: 'absolute', inset: '0',
          background: 'rgba(23,43,54,0.55)',
          backdropFilter: 'blur(3px)',
        }" @click="cerrar()" />

        <div :style="{
          position: 'relative', width: '100%', maxWidth: '640px',
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-modal)',
          maxHeight: '95vh', display: 'flex', flexDirection: 'column',
        }">
          <!-- Header (Copiado de ModalExpedicion para homogeneidad) -->
          <div :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--sp-xl) var(--sp-2xl)',
            borderBottom: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--r-md) var(--r-md) 0 0',
            flexShrink: '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <IconMapPin :size="18" style="color: white;" />
              </div>
              <div>
                <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                  Ingresar dirección
                </div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                  Estructure su dirección de forma estándar
                </div>
              </div>
            </div>
            <button :style="{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center',
            }" @click="cerrar()">
              <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Contenido -->
          <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)', overflowY: 'auto', flex: '1', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
            
            <!-- Depto y Ciudad -->
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-md)' }">
              <CampoSelectBuscable
                :model-value="local.depto_codigo"
                label="Departamento"
                required
                :opciones="opcionesDeptos"
                @update:model-value="onDeptoChange($event)"
              />
              <CampoSelectBuscable
                :model-value="local.municipio_codigo"
                label="Ciudad / Municipio"
                required
                :disabled="!local.depto_codigo"
                :opciones="opcionesMunicipios"
                @update:model-value="onMunicipioChange($event)"
              />
            </div>

            <!-- Estructura Dirección (Bloque visual) -->
            <div :style="{
              background: 'var(--color-bg-card)',
              padding: 'var(--sp-lg)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--color-border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-lg)'
            }">
              <!-- Fila 1: Vía principal, Número, Letra, Cuadrante -->
              <div :style="{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1.5fr',
                gap: 'var(--sp-md)',
                alignItems: 'start'
              }">
                <div :style="{ gridColumn: isMobile ? 'span 2' : 'auto' }">
                  <CampoSelectBuscable
                    v-model="local.via_principal"
                    label="Vía principal"
                    required
                    :opciones="VIAS_PRINCIPALES.map(v => ({ value: v, label: v }))"
                  />
                </div>
                <CampoTexto v-model="local.numero_via" label="Número" required placeholder="45" />
                <CampoTexto v-model="local.letra_via" label="Letra" placeholder="A" />
                <CampoSelectBuscable v-model="local.cuadrante_via" label="Cuadrante" :opciones="opcionesCuadrante" />
              </div>

              <!-- Separador # -->
              <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
                <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
                <div :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-primary)' }">#</div>
                <div :style="{ flex: '1', height: '1px', background: 'var(--color-border-light)' }" />
              </div>

              <!-- Fila 2: Cruce, Letra, Placa, Cuadrante -->
              <div :style="{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1.5fr', 
                gap: 'var(--sp-md)', 
                alignItems: 'start' 
              }">
                <CampoTexto v-model="local.numero_cruce" label="Cruce" placeholder="23" />
                <CampoTexto v-model="local.letra_cruce" label="Letra" placeholder="B" />
                <CampoTexto v-model="local.numero_placa" label="Placa" required placeholder="18" />
                <CampoSelectBuscable v-model="local.cuadrante_cruce" label="Cuadrante" :opciones="opcionesCuadrante" />
              </div>
            </div>

            <!-- Complemento y Barrio -->
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
              <CampoTexto v-model="local.complemento" label="Complemento" placeholder="Ej: Apto 301" />
              <CampoTexto v-model="local.barrio" label="Barrio" placeholder="Nombre del barrio" />
            </div>

            <!-- Preview -->
            <div v-if="preview" :style="{
              background:   'var(--color-bg-card)',
              borderRadius: 'var(--r-md)',
              padding:      'var(--sp-lg)',
              border:       '1px dashed var(--color-primary)',
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-md)'
            }">
              <IconCheck :size="20" :style="{ color: 'var(--color-primary)' }" />
              <div :style="{ flex: '1' }">
                <div :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Dirección generada</div>
                <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">{{ preview }}</div>
              </div>
            </div>
          </div>

          <!-- Footer (Copiado de ModalExpedicion para homogeneidad) -->
          <div :style="{
            display: 'flex', gap: 'var(--sp-md)', justifyContent: 'flex-end',
            padding: 'var(--sp-lg) var(--sp-2xl)',
            borderTop: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            borderRadius: '0 0 var(--r-md) var(--r-md)',
            flexShrink: '0',
          }">
            <PortalButton variant="secondary" @click="cerrar()">Cancelar</PortalButton>
            <PortalButton variant="primary" :disabled="!preview" @click="confirmar()">
              <IconCheck :size="15" /> Confirmar
            </PortalButton>
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
</style>
