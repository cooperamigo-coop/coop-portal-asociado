<script setup>
import { useRouter } from 'vue-router'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import PortalInput from '@/components/ui/PortalInput.vue'
import AlertaBanner from '@/components/ui/AlertaBanner.vue'
import { useCredito } from '@/composables/useCredito'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const { isMobile } = useBreakpoint()

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  datosPersonales, datosLaborales, datosCredito,
  cuotaEstimada, pasoValido,
  validarCampoActual, schemaPersonales, schemaLaborales, schemaCredito,
  verificarCedula, irAPaso, enviarSolicitud, reiniciar,
} = useCredito()

const pasos = [
  { label: 'Datos personales' },
  { label: 'Datos laborales' },
  { label: 'Crédito' },
  { label: 'Confirmación' },
]

const tiposCredito = [
  { value: 'consumo',    label: 'Consumo',    desc: 'Gastos personales o del hogar' },
  { value: 'vivienda',   label: 'Vivienda',   desc: 'Compra, mejora o reparación' },
  { value: 'educativo',  label: 'Educativo',  desc: 'Estudios propios o familiares' },
  { value: 'emergencia', label: 'Emergencia', desc: 'Necesidades urgentes' },
]

const plazos = [6, 12, 18, 24, 36, 48, 60]

function formatCOP(n) {
  if (!n) return ''
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}
</script>

<template>
  <PortalLayout>

    <!-- Paso 4: Éxito -->
    <div v-if="paso === 4" :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-2xl)',
      padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
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
      }">¡Solicitud enviada con éxito!</div>
      <div :style="{
        fontSize: 'var(--text-lg)', color: 'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
        marginBottom: 'var(--sp-xl)',
      }">
        Su solicitud de crédito ha sido radicada y está siendo revisada
        por el área de Bienestar Social.
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
      <div :style="{ display: 'flex', gap: 'var(--sp-md)', justifyContent: 'center', flexWrap: 'wrap' }">
        <PortalButton variant="secondary" @click="reiniciar">Nueva solicitud</PortalButton>
        <PortalButton variant="primary" @click="router.push('/')">Volver al inicio</PortalButton>
      </div>
    </div>

    <!-- Pasos 1-3 -->
    <template v-else>
      <!-- Encabezado -->
      <div :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)',
        }">Solicitud de crédito</div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)' }">
          Complete los datos para radicar su solicitud
        </div>
      </div>

      <StepIndicator :pasos="pasos" :actual="paso" />

      <div :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-2xl)',
        padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
      }">

        <!-- Campo honeypot anti-bot — NO modificar este bloque -->
        <div
          aria-hidden="true"
          :style="{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: '0',
            pointerEvents: 'none',
          }"
        >
          <input
            v-model="honeypot"
            type="text"
            name="website"
            autocomplete="off"
            tabindex="-1"
          />
        </div>

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
            :mensaje="`Asociado encontrado: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
            :style="{ marginBottom: 'var(--sp-lg)' }"
          />

          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput
                label="Número de cédula"
                v-model="datosPersonales.cedula"
                placeholder="Ej. 1122334455"
                required
                :error="erroresCampos.cedula"
                @blur="() => {
                  validarCampoActual(schemaPersonales, 'cedula', datosPersonales.cedula)
                  verificarCedula()
                }"
              />
            </div>
            <PortalInput
              label="Nombres"
              v-model="datosPersonales.nombres"
              placeholder="Sus nombres"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.nombres"
              @blur="() => validarCampoActual(schemaPersonales, 'nombres', datosPersonales.nombres)"
            />
            <PortalInput
              label="Apellidos"
              v-model="datosPersonales.apellidos"
              placeholder="Sus apellidos"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.apellidos"
              @blur="() => validarCampoActual(schemaPersonales, 'apellidos', datosPersonales.apellidos)"
            />
            <PortalInput
              label="Correo electrónico"
              v-model="datosPersonales.email"
              type="email"
              placeholder="correo@ejemplo.com"
              :disabled="!!asociadoExistente"
              :error="erroresCampos.email"
              @blur="() => validarCampoActual(schemaPersonales, 'email', datosPersonales.email)"
            />
            <PortalInput
              label="Teléfono"
              v-model="datosPersonales.telefono"
              placeholder="3001234567"
              :error="erroresCampos.telefono"
              @blur="() => validarCampoActual(schemaPersonales, 'telefono', datosPersonales.telefono)"
            />
            <PortalInput
              label="Fecha de nacimiento"
              v-model="datosPersonales.fecha_nacimiento"
              type="date"
              :error="erroresCampos.fecha_nacimiento"
              @blur="() => validarCampoActual(schemaPersonales, 'fecha_nacimiento', datosPersonales.fecha_nacimiento)"
            />
            <PortalInput
              label="Ciudad"
              v-model="datosPersonales.ciudad"
              placeholder="Su ciudad"
              :error="erroresCampos.ciudad"
              @blur="() => validarCampoActual(schemaPersonales, 'ciudad', datosPersonales.ciudad)"
            />
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput
                label="Dirección"
                v-model="datosPersonales.direccion"
                placeholder="Su dirección de residencia"
                :error="erroresCampos.direccion"
                @blur="() => validarCampoActual(schemaPersonales, 'direccion', datosPersonales.direccion)"
              />
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

          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput
                label="Empresa"
                v-model="datosLaborales.empresa"
                placeholder="Nombre de la empresa"
                required
                :error="erroresCampos.empresa"
                @blur="() => validarCampoActual(schemaLaborales, 'empresa', datosLaborales.empresa)"
              />
            </div>
            <PortalInput
              label="Cargo"
              v-model="datosLaborales.cargo"
              placeholder="Su cargo actual"
              :error="erroresCampos.cargo"
              @blur="() => validarCampoActual(schemaLaborales, 'cargo', datosLaborales.cargo)"
            />
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
            <PortalInput
              label="Salario mensual"
              v-model="datosLaborales.salario"
              type="number"
              placeholder="Ej. 3000000"
              required
              :error="erroresCampos.salario"
              @blur="() => validarCampoActual(schemaLaborales, 'salario', datosLaborales.salario)"
            />
            <PortalInput
              label="Fecha de ingreso a la empresa"
              v-model="datosLaborales.fecha_ingreso_empresa"
              type="date"
              :error="erroresCampos.fecha_ingreso_empresa"
              @blur="() => validarCampoActual(schemaLaborales, 'fecha_ingreso_empresa', datosLaborales.fecha_ingreso_empresa)"
            />
          </div>
        </div>

        <!-- PASO 3: Datos del crédito -->
        <div v-if="paso === 3">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
            color: 'var(--color-text-1)', marginBottom: 'var(--sp-xl)',
          }">Información del crédito</div>

          <!-- Tipo de crédito -->
          <div :style="{ marginBottom: 'var(--sp-xl)' }">
            <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)' }">
              Tipo de crédito <span :style="{ color: 'var(--color-error)' }">*</span>
            </div>
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-md)' }">
              <div
                v-for="tipo in tiposCredito" :key="tipo.value"
                :style="{
                  padding: 'var(--sp-md) var(--sp-lg)',
                  border: datosCredito.tipo_credito === tipo.value
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)',
                  cursor: 'pointer',
                  background: datosCredito.tipo_credito === tipo.value
                    ? 'var(--color-primary-light)'
                    : 'var(--color-bg-surface)',
                  transition: 'all var(--transition-fast)',
                }"
                @click="datosCredito.tipo_credito = tipo.value"
              >
                <div :style="{
                  fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)',
                  color: datosCredito.tipo_credito === tipo.value ? 'var(--color-primary)' : 'var(--color-text-1)',
                  marginBottom: '2px',
                }">{{ tipo.label }}</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                  {{ tipo.desc }}
                </div>
              </div>
            </div>
          </div>

          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)' }">
            <PortalInput
              label="Monto solicitado (COP)"
              v-model="datosCredito.monto_solicitado"
              type="number"
              placeholder="Ej. 5000000"
              required
              :error="erroresCampos.monto_solicitado"
              @blur="() => validarCampoActual(schemaCredito, 'monto_solicitado', datosCredito.monto_solicitado)"
            />
            <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }">
              <label :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-1)' }">
                Plazo (meses) <span :style="{ color: 'var(--color-error)' }">*</span>
              </label>
              <select
                v-model="datosCredito.plazo_meses"
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
                <option v-for="p in plazos" :key="p" :value="p">{{ p }} meses</option>
              </select>
            </div>
            <div :style="{ gridColumn: '1 / -1' }">
              <PortalInput
                label="Destino del crédito"
                v-model="datosCredito.destino"
                placeholder="Describa para qué usará el crédito"
                :error="erroresCampos.destino"
                @blur="() => validarCampoActual(schemaCredito, 'destino', datosCredito.destino)"
              />
            </div>
          </div>

          <!-- Cuota estimada -->
          <div v-if="cuotaEstimada" :style="{
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-lg) var(--sp-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }">
            <div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-semibold)' }">
                Cuota mensual estimada
              </div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', marginTop: '2px' }">
                Tasa del 1.8% mensual · referencial
              </div>
            </div>
            <div :style="{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
              color: 'var(--color-primary)',
            }">{{ formatCOP(cuotaEstimada) }}</div>
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
            @click="paso < 3 ? irAPaso(paso + 1) : enviarSolicitud()"
          >
            {{ paso === 3 ? (loading ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente' }}
          </PortalButton>
        </div>
      </div>
    </template>

  </PortalLayout>
</template>
