<script setup>
import { ref, computed, watch } from 'vue'
import { VIAS_PRINCIPALES, DEPARTAMENTOS, getMunicipios } from '@/data/colombiaData.js'
import { IconMapPin, IconX, IconCheck } from '@tabler/icons-vue'
import PortalButton        from '@/components/ui/PortalButton.vue'
import CampoSelectBuscable from './CampoSelectBuscable.vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  visible:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:visible', 'confirmar'])

const local = ref({
  depto_codigo: '', depto_nombre: '',
  municipio_codigo: '', municipio_nombre: '',
  via_principal: '', numero_via: '', letra_via: '', bis: false,
  cuadrante_via: '', numero_cruce: '', letra_cruce: '', cuadrante_cruce: '',
  numero_placa: '', complemento: '', barrio: '',
  ...props.modelValue,
})

watch(() => props.modelValue, v => { local.value = { ...local.value, ...v } }, { deep: true })
watch(() => props.visible,    v => { if (v) local.value = { ...local.value, ...props.modelValue } })

const opcionesDeptos = computed(() =>
  DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))
)
const opcionesMunicipios = computed(() =>
  getMunicipios(local.value.depto_codigo || '')
    .map(m => ({ value: m.codigo, label: m.nombre }))
)
const opcionesCuadrante = [
  { value: '',      label: 'Sin cuadrante' },
  { value: 'Norte', label: 'Norte' },
  { value: 'Sur',   label: 'Sur' },
  { value: 'Este',  label: 'Este' },
  { value: 'Oeste', label: 'Oeste' },
]

function onDeptoChange(codigo) {
  local.value.depto_codigo   = codigo
  local.value.municipio_codigo = ''
  local.value.municipio_nombre = ''
  const depto = DEPARTAMENTOS.find(d => d.codigo === codigo)
  local.value.depto_nombre = depto?.nombre || ''
}
function onMunicipioChange(codigo) {
  local.value.municipio_codigo = codigo
  const muni = getMunicipios(local.value.depto_codigo).find(m => m.codigo === codigo)
  local.value.municipio_nombre = muni?.nombre || ''
}

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
  dir += ` - ${d.numero_placa || '?'}`
  if (d.cuadrante_cruce) dir += ` ${d.cuadrante_cruce}`
  if (d.complemento)     dir += `, ${d.complemento}`
  if (d.barrio)          dir += `, Barrio ${d.barrio}`
  return dir.toUpperCase()
})

function confirmar() {
  emit('update:modelValue', { ...local.value, texto: preview.value })
  emit('confirmar', preview.value)
  emit('update:visible', false)
}
function cerrar() { emit('update:visible', false) }

const inputStyle = {
  padding:      '9px 10px',
  border:       '1px solid var(--color-border)',
  borderRadius: 'var(--r-lg)',
  fontSize:     'var(--text-base)',
  fontFamily:   'var(--font-body)',
  background:   'var(--color-bg-card)',
  color:        'var(--color-text-1)',
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
}
const labelStyle = {
  display:      'block',
  fontSize:     'var(--text-sm)',
  fontWeight:   'var(--fw-semibold)',
  color:        'var(--color-text-2)',
  marginBottom: 'var(--sp-xs)',
}
const sectionLabel = {
  fontSize:      'var(--text-xs)',
  fontWeight:    'var(--fw-bold)',
  color:         'var(--color-text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom:  'var(--sp-md)',
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
        <!-- Backdrop -->
        <div :style="{
          position: 'absolute', inset: '0',
          background: 'rgba(23,43,54,0.55)',
          backdropFilter: 'blur(3px)',
        }" @click="cerrar()" />

        <!-- Modal -->
        <div :style="{
          position: 'relative', width: '100%', maxWidth: '540px',
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }">

          <!-- Header -->
          <div :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--sp-lg) var(--sp-xl)',
            borderBottom: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <IconMapPin :size="16" style="color:white" />
              </div>
              <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-md)' }">
                Ingresar dirección
              </div>
            </div>
            <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', borderRadius: 'var(--r-md)' }" @click="cerrar()">
              <IconX :size="18" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Contenido scrollable -->
          <div :style="{ padding: 'var(--sp-xl)', overflowY: 'auto', flex: '1', display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

            <!-- Departamento y municipio -->
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
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

            <!-- Dirección -->
            <div>
              <div :style="sectionLabel">Dirección</div>

              <!-- Parte 1: Tipo vía Nº Letra BIS Cuadrante -->
              <div :style="{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto 1.5fr', gap: 'var(--sp-sm)', alignItems: 'end', marginBottom: 'var(--sp-sm)' }">
                <div>
                  <label :style="labelStyle">Tipo de vía <span :style="{ color: 'var(--color-error)' }">*</span></label>
                  <CampoSelectBuscable
                    :model-value="local.via_principal"
                    label="Tipo de vía"
                    :opciones="VIAS_PRINCIPALES.map(v => ({ value: v, label: v }))"
                    @update:model-value="local.via_principal = $event"
                  />
                </div>
                <div>
                  <label :style="labelStyle">Número <span :style="{ color: 'var(--color-error)' }">*</span></label>
                  <input v-model="local.numero_via" placeholder="45" :style="inputStyle" />
                </div>
                <div>
                  <label :style="labelStyle">Letra</label>
                  <input v-model="local.letra_via" placeholder="A" maxlength="2" :style="{ ...inputStyle, textTransform: 'uppercase', textAlign: 'center' }" />
                </div>
                <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-xs)' }">
                  <label :style="labelStyle">BIS</label>
                  <div
                    :style="{
                      width: '44px', height: '38px',
                      border: local.bis ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--r-lg)',
                      background: local.bis ? 'var(--color-primary)' : 'var(--color-bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all var(--transition-fast)',
                    }"
                    @click="local.bis = !local.bis"
                  >
                    <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: local.bis ? 'white' : 'var(--color-text-3)' }">BIS</span>
                  </div>
                </div>
                <div>
                  <label :style="labelStyle">Cuadrante</label>
                  <CampoSelectBuscable
                    :model-value="local.cuadrante_via"
                    label="Cuadrante"
                    :opciones="opcionesCuadrante"
                    @update:model-value="local.cuadrante_via = $event"
                  />
                </div>
              </div>

              <!-- Separador # -->
              <div :style="{ textAlign: 'center', fontSize: '20px', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-primary)', margin: 'var(--sp-xs) 0' }">#</div>

              <!-- Parte 2: Cruce Letra - Placa Cuadrante -->
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr 1.5fr', gap: 'var(--sp-sm)', alignItems: 'end' }">
                <div>
                  <label :style="labelStyle">Cruce</label>
                  <input v-model="local.numero_cruce" placeholder="23" :style="inputStyle" />
                </div>
                <div>
                  <label :style="labelStyle">Letra</label>
                  <input v-model="local.letra_cruce" placeholder="B" maxlength="2" :style="{ ...inputStyle, textTransform: 'uppercase', textAlign: 'center' }" />
                </div>
                <div :style="{ fontSize: '18px', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', paddingBottom: '10px' }">—</div>
                <div>
                  <label :style="labelStyle">Placa <span :style="{ color: 'var(--color-error)' }">*</span></label>
                  <input v-model="local.numero_placa" placeholder="18" :style="inputStyle" />
                </div>
                <div>
                  <label :style="labelStyle">Cuadrante</label>
                  <CampoSelectBuscable
                    :model-value="local.cuadrante_cruce"
                    label="Cuadrante"
                    :opciones="opcionesCuadrante"
                    @update:model-value="local.cuadrante_cruce = $event"
                  />
                </div>
              </div>
            </div>

            <!-- Complemento y barrio -->
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
              <div>
                <label :style="labelStyle">Complemento</label>
                <input v-model="local.complemento" placeholder="Apto 301, Casa 5…" :style="inputStyle" />
              </div>
              <div>
                <label :style="labelStyle">Barrio</label>
                <input v-model="local.barrio" placeholder="El Poblado" :style="{ ...inputStyle, textTransform: 'uppercase' }" />
              </div>
            </div>

            <!-- Vista previa -->
            <div v-if="preview" :style="{
              background:   'var(--color-primary-light)',
              borderRadius: 'var(--r-xl)',
              padding:      'var(--sp-md) var(--sp-lg)',
            }">
              <div :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-xs)' }">Vista previa</div>
              <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', fontSize: 'var(--text-base)' }">{{ preview }}</div>
            </div>

          </div>

          <!-- Acciones -->
          <div :style="{
            display: 'flex', gap: 'var(--sp-md)', justifyContent: 'flex-end',
            padding: 'var(--sp-md) var(--sp-xl)',
            borderTop: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <PortalButton variant="secondary" small @click="cerrar()">Cancelar</PortalButton>
            <PortalButton variant="primary" small :disabled="!preview" @click="confirmar()">
              <IconCheck :size="14" /> Confirmar dirección
            </PortalButton>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
