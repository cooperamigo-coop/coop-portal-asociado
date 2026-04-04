<script setup>
import { ref, computed, watch } from 'vue'
import { VIAS_PRINCIPALES } from '@/data/colombiaData.js'
import { MapPin, X, Check } from 'lucide-vue-next'
import PortalButton          from '@/components/ui/PortalButton.vue'
import CampoSelectBuscable   from './CampoSelectBuscable.vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  visible:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:visible', 'confirmar'])

const local = ref({
  via_principal: '', numero_via: '', letra_via: '', bis: false,
  cuadrante_via: '', numero_cruce: '', letra_cruce: '', cuadrante_cruce: '',
  numero_placa: '', complemento: '', barrio: '',
  ...props.modelValue,
})

watch(() => props.modelValue, v => { local.value = { ...local.value, ...v } }, { deep: true })
watch(() => props.visible, v => {
  if (v) local.value = { ...local.value, ...props.modelValue }
})

const preview = computed(() => {
  const d = local.value
  if (!d.via_principal || !d.numero_via) return ''
  let dir = `${d.via_principal} ${d.numero_via}`
  if (d.letra_via)       dir += d.letra_via.toUpperCase()
  if (d.bis)             dir += ' BIS'
  if (d.cuadrante_via)   dir += ` ${d.cuadrante_via}`
  dir += ' #'
  if (d.numero_cruce)    dir += ` ${d.numero_cruce}`
  if (d.letra_cruce)     dir += d.letra_cruce.toUpperCase()
  dir += ` - ${d.numero_placa || '0'}`
  if (d.cuadrante_cruce) dir += ` ${d.cuadrante_cruce}`
  if (d.complemento)     dir += `, ${d.complemento}`
  if (d.barrio)          dir += `, Barrio ${d.barrio}`
  return dir.toUpperCase()
})

function confirmar() {
  emit('update:modelValue', { ...local.value })
  emit('confirmar', preview.value)
  emit('update:visible', false)
}
function cerrar() { emit('update:visible', false) }

const inputStyle = {
  padding: '9px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-lg)',
  fontSize: 'var(--text-base)',
  fontFamily: 'var(--font-body)',
  background: 'var(--color-bg-surface)',
  color: 'var(--color-text-1)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--color-text-1)',
  marginBottom: 'var(--sp-xs)',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-modal">
      <div v-if="visible" :style="{
        position: 'fixed', inset: '0', zIndex: '70',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }">
        <div :style="{
          position: 'absolute', inset: '0',
          background: 'rgba(23,43,54,0.55)',
          backdropFilter: 'blur(3px)',
        }" @click="cerrar()" />

        <div :style="{
          position: 'relative', width: '100%', maxWidth: '580px',
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }">
          <!-- Header -->
          <div :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--sp-xl) var(--sp-2xl)',
            borderBottom: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <MapPin :size="18" style="color: white;" />
              </div>
              <div>
                <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">Ingresar dirección</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Formato estándar colombiano</div>
              </div>
            </div>
            <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center' }" @click="cerrar()">
              <X :size="20" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Contenido scrollable -->
          <div :style="{ padding: 'var(--sp-2xl)', overflowY: 'auto', flex: '1' }">

            <!-- Fila 1: Vía # número letra BIS cuadrante -->
            <div :style="{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)', flexWrap: 'wrap' }">
              <div :style="{ flex: '0 0 150px' }">
                <CampoSelectBuscable
                  :model-value="local.via_principal"
                  label="Tipo de vía *"
                  :opciones="VIAS_PRINCIPALES.map(v => ({ value: v, label: v }))"
                  placeholder="Tipo de vía"
                  @update:model-value="local.via_principal = $event"
                />
              </div>
              <div :style="{ flex: '0 0 70px' }">
                <label :style="labelStyle">Número *</label>
                <input v-model="local.numero_via" placeholder="45" :style="inputStyle" />
              </div>
              <div :style="{ flex: '0 0 55px' }">
                <label :style="labelStyle">Letra</label>
                <input v-model="local.letra_via" placeholder="A" maxlength="2" :style="{ ...inputStyle, textTransform: 'uppercase' }" />
              </div>
              <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', paddingBottom: '9px' }">
                <input type="checkbox" v-model="local.bis" id="dir-bis" :style="{ cursor: 'pointer', width: '16px', height: '16px' }" />
                <label for="dir-bis" :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)', cursor: 'pointer' }">BIS</label>
              </div>
              <div :style="{ flex: '0 0 110px' }">
                <CampoSelectBuscable
                  :model-value="local.cuadrante_via"
                  label="Cuadrante"
                  :opciones="[
                    { value: '', label: 'Sin cuadrante' },
                    { value: 'Norte', label: 'Norte' },
                    { value: 'Sur', label: 'Sur' },
                    { value: 'Este', label: 'Este' },
                    { value: 'Oeste', label: 'Oeste' },
                  ]"
                  placeholder="-"
                  @update:model-value="local.cuadrante_via = $event"
                />
              </div>
            </div>

            <!-- Separador # -->
            <div :style="{ textAlign: 'center', fontSize: '22px', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-primary)', margin: 'var(--sp-xs) 0' }">#</div>

            <!-- Fila 2: Cruce letra - placa cuadrante -->
            <div :style="{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)', flexWrap: 'wrap' }">
              <div :style="{ flex: '0 0 70px' }">
                <label :style="labelStyle">Cruce</label>
                <input v-model="local.numero_cruce" placeholder="23" :style="inputStyle" />
              </div>
              <div :style="{ flex: '0 0 55px' }">
                <label :style="labelStyle">Letra</label>
                <input v-model="local.letra_cruce" placeholder="B" maxlength="2" :style="{ ...inputStyle, textTransform: 'uppercase' }" />
              </div>
              <div :style="{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-primary)', paddingBottom: '9px' }">-</div>
              <div :style="{ flex: '0 0 70px' }">
                <label :style="labelStyle">Placa *</label>
                <input v-model="local.numero_placa" placeholder="18" :style="inputStyle" />
              </div>
              <div :style="{ flex: '0 0 110px' }">
                <CampoSelectBuscable
                  :model-value="local.cuadrante_cruce"
                  label="Cuadrante"
                  :opciones="[
                    { value: '', label: 'Sin cuadrante' },
                    { value: 'Norte', label: 'Norte' },
                    { value: 'Sur', label: 'Sur' },
                    { value: 'Este', label: 'Este' },
                    { value: 'Oeste', label: 'Oeste' },
                  ]"
                  placeholder="-"
                  @update:model-value="local.cuadrante_cruce = $event"
                />
              </div>
            </div>

            <!-- Complemento y barrio -->
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }">
              <div>
                <label :style="labelStyle">Complemento</label>
                <input v-model="local.complemento" placeholder="Apto 301, Casa 5..." :style="{ ...inputStyle, padding: '9px 14px' }" />
              </div>
              <div>
                <label :style="labelStyle">Barrio</label>
                <input v-model="local.barrio" placeholder="El Poblado" :style="{ ...inputStyle, padding: '9px 14px' }" />
              </div>
            </div>

            <!-- Vista previa -->
            <div v-if="preview" :style="{
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-xl)',
              padding: 'var(--sp-lg)',
              marginBottom: 'var(--sp-xl)',
            }">
              <div :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-xs)' }">Vista previa</div>
              <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', fontSize: 'var(--text-base)' }">{{ preview }}</div>
            </div>
          </div>

          <!-- Acciones fijas -->
          <div :style="{
            display: 'flex', gap: 'var(--sp-md)', justifyContent: 'flex-end',
            padding: 'var(--sp-lg) var(--sp-2xl)',
            borderTop: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <PortalButton variant="secondary" @click="cerrar()">Cancelar</PortalButton>
            <PortalButton variant="primary" :disabled="!preview" @click="confirmar()">
              <Check :size="15" /> Confirmar dirección
            </PortalButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
