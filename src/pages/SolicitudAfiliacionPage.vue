<script setup>
import { useRouter } from 'vue-router'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import PortalInput from '@/components/ui/PortalInput.vue'
import AlertaBanner from '@/components/ui/AlertaBanner.vue'
import { useAfiliacion } from '@/composables/useAfiliacion'
import { CheckCircle } from 'lucide-vue-next'

const router = useRouter()

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  datosPersonales, datosLaborales,
  pasoValido,
  verificarCedula, irAPaso, enviarSolicitud, reiniciar,
} = useAfiliacion()

const pasos = [
  { label: 'Datos personales' },
  { label: 'Datos laborales' },
  { label: 'Confirmación' },
]
</script>

<template>
  <PortalLayout>

    <!-- Paso 3: Éxito -->
    <div v-if="paso === 3" :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-2xl)',
      padding: 'var(--sp-2xl)',
      boxShadow: 'var(--shadow-card)',
      textAlign: 'center',
    }">
      <div :style="{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'var(--color-success-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--sp-xl)',
      }">
        <CheckCircle :size="36" :style="{ color: 'var(--color-success)' }" />
      </div>
      <div :style="{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
        color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)',
      }">¡Solicitud de afiliación enviada!</div>
      <div :style="{
        fontSize: 'var(--text-lg)', color: 'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
        maxWidth: '480px', margin: '0 auto var(--sp-xl)',
      }">
        Su solicitud está en proceso de revisión por el área de Bienestar Social.
        Le notificaremos por correo electrónico.
      </div>
      <div v-if="solicitudCreada" :style="{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-lg) var(--sp-xl)',
        marginBottom: 'var(--sp-xl)',
        display: 'inline-block',
      }">
        <div :style="{
          fontSize: 'var(--text-sm)', color: 'var(--color-text-3)',
          fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-xs)',
        }">Número de solicitud</div>
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-primary)', letterSpacing: '0.05em',
        }">{{ solicitudCreada.consecutivo ?? solicitudCreada.id }}</div>
      </div>
      <PortalButton variant="primary" @click="router.push('/')">Volver al inicio</PortalButton>
    </div>

    <!-- Pasos 1-2 -->
    <template v-else>
      <!-- Encabezado -->
      <div :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)',
        }">Solicitud de afiliación</div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)' }">
          Únase a la cooperativa y acceda a todos sus beneficios
        </div>
      </div>

      <StepIndicator :pasos="pasos" :actual="paso" />

      <div :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-2xl)',
        padding: 'var(--sp-2xl)',
        boxShadow: 'var(--shadow-card)',
      }">

        <!-- PASO 1: Datos personales -->
        <div v-if="paso === 1">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
            color: 'var(--color-text-1)', marginBottom: 'var(--sp-xl)',
          }">Datos personales</div>

          <AlertaBanner
            v-if="asociadoExistente"
            tipo="info"
            :mensaje="`Ya encontramos su registro: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
            :style="{ marginBottom: 'var(--sp-lg)' }"
          />

          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }">
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput
                label="Número de cédula"
                v-model="datosPersonales.cedula"
                placeholder="Ej. 1122334455"
                required
                @blur="verificarCedula"
              />
            </div>
            <PortalInput label="Nombres" v-model="datosPersonales.nombres" placeholder="Sus nombres" required :disabled="!!asociadoExistente" />
            <PortalInput label="Apellidos" v-model="datosPersonales.apellidos" placeholder="Sus apellidos" required :disabled="!!asociadoExistente" />
            <PortalInput
              label="Correo electrónico"
              v-model="datosPersonales.email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              :disabled="!!asociadoExistente"
            />
            <PortalInput label="Teléfono" v-model="datosPersonales.telefono" placeholder="3001234567" />
            <PortalInput label="Fecha de nacimiento" v-model="datosPersonales.fecha_nacimiento" type="date" />
            <PortalInput label="Ciudad" v-model="datosPersonales.ciudad" placeholder="Su ciudad" />
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput label="Dirección" v-model="datosPersonales.direccion" placeholder="Su dirección de residencia" />
            </div>
          </div>
        </div>

        <!-- PASO 2: Datos laborales -->
        <div v-if="paso === 2">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
            color: 'var(--color-text-1)', marginBottom: 'var(--sp-xl)',
          }">Datos laborales</div>

          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }">
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput label="Empresa" v-model="datosLaborales.empresa" placeholder="Nombre de la empresa" required />
            </div>
            <PortalInput label="Cargo" v-model="datosLaborales.cargo" placeholder="Su cargo actual" />
            <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
              <label :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                Tipo de contrato
              </label>
              <select
                v-model="datosLaborales.tipo_contrato"
                :style="{
                  padding: '10px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 'var(--text-base)',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text-1)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  width: '100%',
                }"
              >
                <option value="">Seleccionar...</option>
                <option value="indefinido">Indefinido</option>
                <option value="fijo">Término fijo</option>
                <option value="obra">Obra o labor</option>
                <option value="prestacion">Prestación de servicios</option>
              </select>
            </div>
            <PortalInput label="Salario mensual" v-model="datosLaborales.salario" type="number" placeholder="Ej. 3000000" required />
            <PortalInput label="Fecha de ingreso a la empresa" v-model="datosLaborales.fecha_ingreso_empresa" type="date" />
          </div>
        </div>

        <!-- Error general -->
        <AlertaBanner
          v-if="error"
          tipo="error"
          :mensaje="error"
          :style="{ marginTop: 'var(--sp-lg)' }"
        />

        <!-- Navegación -->
        <div :style="{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 'var(--sp-2xl)', gap: 'var(--sp-md)',
        }">
          <PortalButton
            variant="secondary"
            @click="paso > 1 ? irAPaso(paso - 1) : router.push('/')"
          >
            {{ paso === 1 ? 'Cancelar' : 'Anterior' }}
          </PortalButton>
          <PortalButton
            variant="primary"
            :disabled="!pasoValido"
            :loading="loading"
            @click="paso < 2 ? irAPaso(paso + 1) : enviarSolicitud()"
          >
            {{ paso === 2 ? (loading ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente' }}
          </PortalButton>
        </div>
      </div>
    </template>

  </PortalLayout>
</template>
