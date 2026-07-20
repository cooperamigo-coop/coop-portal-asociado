<script setup>
import CampoTexto from './CampoTexto.vue'

const props = defineProps({
  titulo:     { type: String, required: true },
  tipo:       { type: String, default: 'familiar' }, // 'familiar' | 'personal'
  modelValue: { type: Object, required: true },
  errores:    { type: Object, default: () => ({}) },
  numero:     { type: Number, default: 1 },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}
</script>

<template>
  <div :style="{
    border: '1px solid var(--color-border-card)',
    borderRadius: 'var(--r-xl)',
    padding: 'var(--sp-xl)',
    background: 'var(--color-bg-surface)',
  }">
    <div :style="{
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--color-text-1)',
      marginBottom: 'var(--sp-lg)',
      display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
    }">
      <span :style="{
        width: '24px', height: '24px', borderRadius: '50%',
        background: 'var(--color-primary)',
        color: 'var(--color-text-on-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
        flexShrink: '0',
      }">{{ numero }}</span>
      {{ titulo }}
    </div>

    <div :style="{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-md)',
    }">
      <CampoTexto
        :model-value="modelValue.nombres_apellidos"
        label="Nombres y apellidos"
        placeholder="Nombre completo"
        :required="numero === 1"
        :error="errores.nombres_apellidos"
        @update:model-value="actualizar('nombres_apellidos', $event)"
      />
      <CampoTexto
        :model-value="modelValue[tipo === 'familiar' ? 'parentesco' : 'relacion']"
        :label="tipo === 'familiar' ? 'Parentesco' : 'Relación'"
        :placeholder="tipo === 'familiar' ? 'Ej: Hermano, Padre' : 'Ej: Amigo, Colega'"
        :required="numero === 1"
        :error="tipo === 'familiar' ? errores.parentesco : errores.relacion"
        @update:model-value="actualizar(
          tipo === 'familiar' ? 'parentesco' : 'relacion', $event
        )"
      />
      <CampoTexto
        :model-value="modelValue.profesion_oficio"
        label="Profesión u oficio"
        placeholder="Ej: Docente, Comerciante"
        :error="errores.profesion_oficio"
        @update:model-value="actualizar('profesion_oficio', $event)"
      />
      <CampoTexto
        :model-value="modelValue.contacto"
        label="Teléfono de contacto"
        placeholder="3xx xxx xxxx"
        :required="numero === 1"
        :error="errores.contacto"
        @update:model-value="actualizar('contacto', $event)"
      />
    </div>
  </div>
</template>
