<script setup>
import CampoMoneda    from './CampoMoneda.vue'
import CampoTexto     from './CampoTexto.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const { isMobile } = useBreakpoint()

const props = defineProps({
  modelValue:       { type: Object,  required: true },
  errores:          { type: Object,  default: () => ({}) },
  titulo:           { type: String,  default: '' },
  salarioBloqueado: { type: Boolean, default: false },
  tipoTrabajador:   { type: String,  default: '' },
  mostrarDependientes: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function clave(base) {
  if ((base + '_codeudor2') in props.modelValue) return base + '_codeudor2'
  if ((base + '_codeudor')  in props.modelValue) return base + '_codeudor'
  return base
}

function claveSalario() {
  if ('salario_codeudor2' in props.modelValue) return 'salario_codeudor2'
  if ('salario_codeudor'  in props.modelValue) return 'salario_codeudor'
  return 'salario_ingresos_fijos'
}

function claveFuente() {
  if ('fuente_ingresos_codeudor2' in props.modelValue) return 'fuente_ingresos_codeudor2'
  if ('fuente_ingresos_codeudor'  in props.modelValue) return 'fuente_ingresos_codeudor'
  return 'fuente_ingresos'
}
</script>

<template>
  <div>
    <div v-if="titulo" :style="{
      fontFamily:   'var(--font-display)',
      fontSize:     'var(--text-lg)',
      fontWeight:   'var(--fw-extrabold)',
      color:        'var(--color-text-1)',
      marginBottom: 'var(--sp-xl)',
    }">{{ titulo }}</div>

    <!-- ── Empleado: salario + otros ingresos / gastos x3 ── -->
    <template v-if="!tipoTrabajador || tipoTrabajador === 'empleado'">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap:                 'var(--sp-lg)',
        marginBottom:        'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[claveSalario()]"
          label="Salario / Ingresos fijos"
          required
          :error="errores[claveSalario()]"
          @update:model-value="actualizar(claveSalario(), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('ingresos_independiente')]"
          label="Ingresos como independiente/otros ingresos"
          :error="errores[clave('ingresos_independiente')]"
          @update:model-value="actualizar(clave('ingresos_independiente'), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('gastos_familiares')]"
          label="Gastos familiares"
          required
          :error="errores[clave('gastos_familiares')]"
          @update:model-value="actualizar(clave('gastos_familiares'), $event)"
        />
      </div>
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : mostrarDependientes ? '1fr 1fr 1fr' : '1fr 1fr',
        gap:                 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[clave('otros_gastos')]"
          label="Otros gastos"
          :error="errores[clave('otros_gastos')]"
          @update:model-value="actualizar(clave('otros_gastos'), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('obligaciones_financieras')]"
          label="Pago mensual de deudas"
          helper="¿Cuánto pagas por deudas cada mes?"
          :error="errores[clave('obligaciones_financieras')]"
          @update:model-value="actualizar(clave('obligaciones_financieras'), $event)"
        />
        <CampoTexto
          v-if="mostrarDependientes"
          :model-value="modelValue[clave('numero_dependientes')]"
          label="Personas a cargo"
          type="number"
          required
          placeholder="0"
          :error="errores[clave('numero_dependientes')]"
          @update:model-value="actualizar(clave('numero_dependientes'), $event)"
        />
      </div>
    </template>

    <!-- ── Independiente: ingresos + gastos / otros + obligaciones ── -->
    <template v-else-if="tipoTrabajador === 'independiente'">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap:                 'var(--sp-lg)',
        marginBottom:        'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[clave('ingresos_independiente')]"
          label="Ingresos como independiente"
          required
          :error="errores[clave('ingresos_independiente')]"
          @update:model-value="actualizar(clave('ingresos_independiente'), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('gastos_familiares')]"
          label="Gastos familiares"
          required
          :error="errores[clave('gastos_familiares')]"
          @update:model-value="actualizar(clave('gastos_familiares'), $event)"
        />
      </div>
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : mostrarDependientes ? '1fr 1fr 1fr' : '1fr 1fr',
        gap:                 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[clave('otros_gastos')]"
          label="Otros gastos"
          :error="errores[clave('otros_gastos')]"
          @update:model-value="actualizar(clave('otros_gastos'), $event)"
        />
        <CampoMoneda
          :model-value="modelValue[clave('obligaciones_financieras')]"
          label="Pago mensual de deudas"
          helper="¿Cuánto pagas por deudas cada mes?"
          :error="errores[clave('obligaciones_financieras')]"
          @update:model-value="actualizar(clave('obligaciones_financieras'), $event)"
        />
        <CampoTexto
          v-if="mostrarDependientes"
          :model-value="modelValue[clave('numero_dependientes')]"
          label="Personas a cargo"
          type="number"
          required
          placeholder="0"
          :error="errores[clave('numero_dependientes')]"
          @update:model-value="actualizar(clave('numero_dependientes'), $event)"
        />
      </div>
    </template>

    <!-- ── Pensionado: solo mesada pensional ── -->
    <template v-else-if="tipoTrabajador === 'pensionado'">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : mostrarDependientes ? '1fr 1fr' : '1fr',
        gap:                 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[clave('mesada_pensional')]"
          label="Valor mesada pensional"
          required
          :error="errores[clave('mesada_pensional')]"
          @update:model-value="actualizar(clave('mesada_pensional'), $event)"
        />
        <CampoTexto
          v-if="mostrarDependientes"
          :model-value="modelValue[clave('numero_dependientes')]"
          label="Personas a cargo"
          type="number"
          required
          placeholder="0"
          :error="errores[clave('numero_dependientes')]"
          @update:model-value="actualizar(clave('numero_dependientes'), $event)"
        />
      </div>
    </template>

    <!-- ── Estudiante: ingresos mensuales + fuente ── -->
    <template v-else-if="tipoTrabajador === 'estudiante'">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : mostrarDependientes ? '1fr 1fr 1fr' : '1fr 1fr',
        gap:                 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[claveSalario()]"
          label="Ingresos mensuales"
          required
          :error="errores[claveSalario()]"
          @update:model-value="actualizar(claveSalario(), $event)"
        />
        <CampoTexto
          :model-value="modelValue[claveFuente()]"
          label="Fuente de ingresos"
          placeholder="Ej: Apoyo familiar, beca, trabajo parcial..."
          required
          :error="errores[claveFuente()]"
          @update:model-value="actualizar(claveFuente(), $event ? $event.toUpperCase() : $event)"
        />
        <CampoTexto
          v-if="mostrarDependientes"
          :model-value="modelValue[clave('numero_dependientes')]"
          label="Personas a cargo"
          type="number"
          required
          placeholder="0"
          :error="errores[clave('numero_dependientes')]"
          @update:model-value="actualizar(clave('numero_dependientes'), $event)"
        />
      </div>
    </template>

    <!-- ── Cuidado del hogar: ingresos mensuales + fuente ── -->
    <template v-else-if="tipoTrabajador === 'cuidado_hogar'">
      <div :style="{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : mostrarDependientes ? '1fr 1fr 1fr' : '1fr 1fr',
        gap:                 'var(--sp-lg)',
      }">
        <CampoMoneda
          :model-value="modelValue[claveSalario()]"
          label="Ingresos mensuales"
          required
          :error="errores[claveSalario()]"
          @update:model-value="actualizar(claveSalario(), $event)"
        />
        <CampoTexto
          :model-value="modelValue[claveFuente()]"
          label="Fuente de ingresos"
          placeholder="Ej: Apoyo familiar, arrendamiento, pensión de esposo/a..."
          required
          :error="errores[claveFuente()]"
          @update:model-value="actualizar(claveFuente(), $event ? $event.toUpperCase() : $event)"
        />
        <CampoTexto
          v-if="mostrarDependientes"
          :model-value="modelValue[clave('numero_dependientes')]"
          label="Personas a cargo"
          type="number"
          required
          placeholder="0"
          :error="errores[clave('numero_dependientes')]"
          @update:model-value="actualizar(clave('numero_dependientes'), $event)"
        />
      </div>
    </template>

  </div>
</template>
