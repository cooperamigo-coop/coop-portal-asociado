<script setup>
import { ref, computed, watch } from 'vue'
import { DEPARTAMENTOS, getMunicipios } from '@/data/colombiaData.js'
import { IconCalendar, IconX, IconCheck } from '@tabler/icons-vue'
import PortalButton        from '@/components/ui/PortalButton.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'
import SelectorFecha       from './SelectorFecha.vue'

const props = defineProps({
  visible:   { type: Boolean, default: false },
  fecha:     { type: String,  default: '' },
  ubicacion: {
    type: Object,
    default: () => ({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' }),
  },
})
const emit = defineEmits(['update:visible', 'update:fecha', 'update:ubicacion'])

const localFecha     = ref(props.fecha)
const localDepto     = ref(props.ubicacion?.depto_codigo     || '')
const localDeptoNom  = ref(props.ubicacion?.depto_nombre     || '')
const localMunicipio = ref(props.ubicacion?.municipio_codigo || '')
const localMuniNom   = ref(props.ubicacion?.municipio_nombre || '')

watch(() => props.visible, v => {
  if (v) {
    localFecha.value     = props.fecha
    localDepto.value     = props.ubicacion?.depto_codigo     || ''
    localDeptoNom.value  = props.ubicacion?.depto_nombre     || ''
    localMunicipio.value = props.ubicacion?.municipio_codigo || ''
    localMuniNom.value   = props.ubicacion?.municipio_nombre || ''
  }
})

const opcionesDeptos = computed(() =>
  DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))
)
const opcionesMunicipios = computed(() =>
  getMunicipios(localDepto.value || '').map(m => ({ value: m.codigo, label: m.nombre }))
)

function onDeptoChange(codigo) {
  localDepto.value     = codigo
  localMunicipio.value = ''
  localMuniNom.value   = ''
  const d = DEPARTAMENTOS.find(dep => dep.codigo === codigo)
  localDeptoNom.value  = d?.nombre || ''
}

function onMunicipioChange(codigo) {
  localMunicipio.value = codigo
  const m = getMunicipios(localDepto.value).find(m => m.codigo === codigo)
  localMuniNom.value   = m?.nombre || ''
}

const puedeConfirmar = computed(() =>
  !!localFecha.value && !!localDepto.value && !!localMunicipio.value
)

function confirmar() {
  emit('update:fecha', localFecha.value)
  emit('update:ubicacion', {
    depto_codigo:     localDepto.value,
    depto_nombre:     localDeptoNom.value,
    municipio_codigo: localMunicipio.value,
    municipio_nombre: localMuniNom.value,
  })
  emit('update:visible', false)
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

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-exp-title"
          :style="{
            position: 'relative', width: '100%', maxWidth: '500px',
            background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-modal)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }"
        >
          <!-- Header -->
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
                <IconCalendar :size="18" style="color: white;" />
              </div>
              <div>
                <div id="modal-exp-title" :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                  Expedición del documento
                </div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                  Fecha, departamento y ciudad
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
          <div :style="{ padding: 'var(--sp-2xl)', overflowY: 'auto', flex: '1', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
            <SelectorFecha
              :model-value="localFecha"
              label="Fecha de expedición"
              required
              :max-year="new Date().getFullYear()"
              :min-year="1950"
              @update:model-value="localFecha = $event"
            />

            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
              <CampoSelectBuscable
                :model-value="localDepto"
                label="Departamento"
                required
                :opciones="opcionesDeptos"
                placeholder="Seleccione"
                @update:model-value="onDeptoChange($event)"
              />
              <CampoSelectBuscable
                :model-value="localMunicipio"
                label="Ciudad / Municipio"
                required
                :disabled="!localDepto"
                :opciones="opcionesMunicipios"
                placeholder="Seleccione"
                @update:model-value="onMunicipioChange($event)"
              />
            </div>
          </div>

          <!-- Footer -->
          <div :style="{
            display: 'flex', gap: 'var(--sp-md)', justifyContent: 'flex-end',
            padding: 'var(--sp-lg) var(--sp-2xl)',
            borderTop: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            borderRadius: '0 0 var(--r-2xl) var(--r-2xl)',
            flexShrink: '0',
          }">
            <PortalButton variant="secondary" @click="cerrar()">Cancelar</PortalButton>
            <PortalButton variant="primary" :disabled="!puedeConfirmar" @click="confirmar()">
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
