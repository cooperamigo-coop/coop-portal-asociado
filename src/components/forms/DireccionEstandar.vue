<script setup>
import { computed } from 'vue'
import { VIAS_PRINCIPALES, CUADRANTES } from '@/data/formularioCredito'

const props = defineProps({
  modelValue: { type: Object, required: true },
  error:      { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

const opsVia = VIAS_PRINCIPALES.map(v => ({ value: v, label: v }))
const opsCuadrante = [
  { value: '', label: '—' },
  ...CUADRANTES.map(c => ({ value: c, label: c })),
]

// Vista previa en tiempo real
const vistaPrevia = computed(() => {
  const m = props.modelValue
  if (!m.via_principal && !m.numero_via) return ''
  let dir = m.via_principal || ''
  if (m.numero_via)      dir += ` ${m.numero_via}`
  if (m.letra_via)       dir += m.letra_via.toUpperCase()
  if (m.bis)             dir += ' BIS'
  if (m.cuadrante_via)   dir += ` ${m.cuadrante_via}`
  dir += ' #'
  if (m.numero_cruce)    dir += ` ${m.numero_cruce}`
  if (m.letra_cruce)     dir += m.letra_cruce.toUpperCase()
  if (m.cuadrante_cruce) dir += ` ${m.cuadrante_cruce}`
  dir += ' -'
  if (m.numero_placa)    dir += ` ${m.numero_placa}`
  if (m.complemento)     dir += `, ${m.complemento}`
  if (m.barrio)          dir += `, ${m.barrio}`
  return dir.trim().toUpperCase()
})

const estiloInput = {
  padding:      '8px 10px',
  border:       '1px solid var(--color-border)',
  borderRadius: 'var(--r-lg)',
  fontSize:     'var(--text-base)',
  fontFamily:   'var(--font-body)',
  background:   'var(--color-bg-surface)',
  color:        'var(--color-text-1)',
  outline:      'none',
  width:        '100%',
}

const estiloSelect = {
  ...estiloInput,
  cursor: 'pointer',
}
</script>

<template>
  <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }">
    <label :style="{
      fontSize:   'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color:      error ? 'var(--color-error-text)' : 'var(--color-text-1)',
    }">
      Dirección de residencia <span :style="{ color: 'var(--color-error)' }"> *</span>
    </label>

    <!-- Fila 1: Vía principal -->
    <div :style="{ display: 'flex', gap: 'var(--sp-xs)', flexWrap: 'wrap', alignItems: 'center' }">
      <select
        :value="modelValue.via_principal"
        :style="{ ...estiloSelect, width: '130px', flexShrink: '0' }"
        @change="actualizar('via_principal', $event.target.value)"
      >
        <option value="">Vía</option>
        <option v-for="op in opsVia" :key="op.value" :value="op.value">{{ op.label }}</option>
      </select>

      <input
        type="text"
        :value="modelValue.numero_via"
        placeholder="Nº"
        :style="{ ...estiloInput, width: '70px', flexShrink: '0' }"
        @input="actualizar('numero_via', $event.target.value)"
      />
      <input
        type="text"
        :value="modelValue.letra_via"
        placeholder="Letra"
        maxlength="2"
        :style="{ ...estiloInput, width: '60px', flexShrink: '0' }"
        @input="actualizar('letra_via', $event.target.value)"
      />

      <!-- BIS -->
      <label :style="{
        display:    'flex',
        alignItems: 'center',
        gap:        'var(--sp-xs)',
        fontSize:   'var(--text-sm)',
        fontWeight: 'var(--fw-medium)',
        color:      'var(--color-text-2)',
        cursor:     'pointer',
        flexShrink: '0',
      }">
        <input
          type="checkbox"
          :checked="modelValue.bis"
          @change="actualizar('bis', $event.target.checked)"
        />
        BIS
      </label>

      <select
        :value="modelValue.cuadrante_via"
        :style="{ ...estiloSelect, width: '90px', flexShrink: '0' }"
        @change="actualizar('cuadrante_via', $event.target.value)"
      >
        <option v-for="op in opsCuadrante" :key="op.value" :value="op.value">{{ op.label }}</option>
      </select>

      <!-- Separador # -->
      <span :style="{
        fontSize:   'var(--text-lg)',
        fontWeight: 'var(--fw-bold)',
        color:      'var(--color-text-3)',
        flexShrink: '0',
      }">#</span>

      <input
        type="text"
        :value="modelValue.numero_cruce"
        placeholder="Nº"
        :style="{ ...estiloInput, width: '70px', flexShrink: '0' }"
        @input="actualizar('numero_cruce', $event.target.value)"
      />
      <input
        type="text"
        :value="modelValue.letra_cruce"
        placeholder="Letra"
        maxlength="2"
        :style="{ ...estiloInput, width: '60px', flexShrink: '0' }"
        @input="actualizar('letra_cruce', $event.target.value)"
      />

      <span :style="{
        fontSize:   'var(--text-base)',
        fontWeight: 'var(--fw-bold)',
        color:      'var(--color-text-3)',
        flexShrink: '0',
      }">–</span>

      <input
        type="text"
        :value="modelValue.numero_placa"
        placeholder="Placa"
        :style="{ ...estiloInput, width: '70px', flexShrink: '0' }"
        @input="actualizar('numero_placa', $event.target.value)"
      />

      <select
        :value="modelValue.cuadrante_cruce"
        :style="{ ...estiloSelect, width: '90px', flexShrink: '0' }"
        @change="actualizar('cuadrante_cruce', $event.target.value)"
      >
        <option v-for="op in opsCuadrante" :key="op.value" :value="op.value">{{ op.label }}</option>
      </select>
    </div>

    <!-- Fila 2: Complemento y barrio -->
    <div :style="{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }">
      <div :style="{ flex: '1', minWidth: '160px' }">
        <input
          type="text"
          :value="modelValue.complemento"
          placeholder="Complemento (Apto, Casa, Of...)"
          :style="estiloInput"
          @input="actualizar('complemento', $event.target.value)"
        />
      </div>
      <div :style="{ flex: '1', minWidth: '140px' }">
        <input
          type="text"
          :value="modelValue.barrio"
          placeholder="Barrio / Vereda"
          :style="estiloInput"
          @input="actualizar('barrio', $event.target.value)"
        />
      </div>
    </div>

    <!-- Vista previa -->
    <div v-if="vistaPrevia" :style="{
      padding:      'var(--sp-sm) var(--sp-md)',
      borderRadius: 'var(--r-lg)',
      background:   'var(--color-primary-light)',
      border:       '1px solid var(--color-border)',
      fontSize:     'var(--text-sm)',
      fontWeight:   'var(--fw-bold)',
      color:        'var(--color-primary)',
      letterSpacing:'0.03em',
    }">
      {{ vistaPrevia }}
    </div>

    <span v-if="error" :style="{
      fontSize:   'var(--text-xs)',
      color:      'var(--color-error-text)',
      fontWeight: 'var(--fw-medium)',
    }">{{ error }}</span>
  </div>
</template>
