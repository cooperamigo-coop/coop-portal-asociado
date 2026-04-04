<script setup>
import { ref, computed, watch } from 'vue'
import { DEPARTAMENTOS, getMunicipios } from '@/data/colombiaData.js'
import CampoSelect from './CampoSelect.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' }),
  },
  labelDepto:     { type: String,  default: 'Departamento' },
  labelMunicipio: { type: String,  default: 'Municipio'    },
  required:       { type: Boolean, default: false          },
})
const emit = defineEmits(['update:modelValue'])

const deptoSel = ref(props.modelValue?.depto_codigo ?? '')
const muniSel  = ref(props.modelValue?.municipio_codigo ?? '')

watch(() => props.modelValue, v => {
  deptoSel.value = v?.depto_codigo ?? ''
  muniSel.value  = v?.municipio_codigo ?? ''
}, { deep: true })

const opcionesDeptos = computed(() =>
  DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))
)
const opcionesMunis = computed(() =>
  getMunicipios(deptoSel.value).map(m => ({ value: m.codigo, label: m.nombre }))
)

function onDepto(codigo) {
  deptoSel.value = codigo
  muniSel.value  = ''
  const d = DEPARTAMENTOS.find(x => x.codigo === codigo)
  emit('update:modelValue', { depto_codigo: codigo, depto_nombre: d?.nombre ?? '', municipio_codigo: '', municipio_nombre: '' })
}
function onMuni(codigo) {
  muniSel.value = codigo
  const d = DEPARTAMENTOS.find(x => x.codigo === deptoSel.value)
  const m = getMunicipios(deptoSel.value).find(x => x.codigo === codigo)
  emit('update:modelValue', {
    depto_codigo:    deptoSel.value,
    depto_nombre:    d?.nombre ?? '',
    municipio_codigo: codigo,
    municipio_nombre: m?.nombre ?? '',
  })
}
</script>

<template>
  <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
    <CampoSelect
      :model-value="deptoSel"
      :label="labelDepto"
      :opciones="opcionesDeptos"
      :required="required"
      placeholder="Seleccione departamento"
      @update:model-value="onDepto($event)"
    />
    <CampoSelect
      :model-value="muniSel"
      :label="labelMunicipio"
      :opciones="opcionesMunis"
      :required="required"
      :disabled="!deptoSel"
      placeholder="Seleccione municipio"
      @update:model-value="onMuni($event)"
    />
  </div>
</template>
