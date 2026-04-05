<script setup>
import { useRouter } from 'vue-router'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import PortalInput from '@/components/ui/PortalInput.vue'
import AlertaBanner from '@/components/ui/AlertaBanner.vue'
import { useAfiliacion } from '@/composables/useAfiliacion'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { CheckCircle, Mail } from 'lucide-vue-next'

const router = useRouter()

const {
  paso, loading, loadingEmail, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  datosPersonales, datosLaborales,
  pasoValido,
  validarCampoActual, schemaPersonales, schemaLaborales,
  confirmarEmail, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud,
} = useAfiliacion()

const { isMobile } = useBreakpoint()

const pasos = [
  { label: 'Datos personales' },
  { label: 'Datos laborales' },
  { label: 'Confirmación' },
]
</script>

<template>
  <PortalLayout>

    <!-- PASO 0: Correo electrónico -->
    <div v-if="paso === 0" :style="{
      maxWidth: '480px',
      margin: '0 auto',
    }">
      <div :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-2xl)',
        padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
      }">
        <!-- Icono -->
        <div :style="{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--sp-xl)',
        }">
          <Mail :size="28" :style="{ color: 'var(--color-primary)' }" />
        </div>

        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)',
        }">Solicitud de afiliación</div>

        <div :style="{
          fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
          fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
          marginBottom: 'var(--sp-2xl)',
        }">
          Ingresa tu correo electrónico para comenzar.<br>
          Guardaremos tu progreso para que puedas retomar la solicitud en cualquier momento.
        </div>

        <!-- Estado: borrador encontrado -->
        <template v-if="borradorDisponible">
          <AlertaBanner
            tipo="info"
            mensaje="Encontramos una solicitud de afiliación guardada para este correo. ¿Deseas continuar donde lo dejaste?"
            :style="{ marginBottom: 'var(--sp-xl)', textAlign: 'left' }"
          />
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <PortalButton variant="primary" @click="restaurarBorrador">
              Continuar donde lo dejé
            </PortalButton>
            <PortalButton variant="secondary" @click="descartarBorrador">
              Iniciar solicitud nueva
            </PortalButton>
          </div>
        </template>

        <!-- Estado: ingresar email -->
        <template v-else>
          <div :style="{ textAlign: 'left', marginBottom: 'var(--sp-xl)' }">
            <PortalInput
              label="Correo electrónico"
              v-model="emailInicial"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              :error="errorEmail"
              @keyup.enter="confirmarEmail"
            />
          </div>
          <div :style="{
            display: 'flex', justifyContent: 'space-between',
            gap: 'var(--sp-md)',
          }">
            <PortalButton variant="secondary" @click="router.push('/')">
              Volver
            </PortalButton>
            <PortalButton
              variant="primary"
              :disabled="!pasoValido"
              :loading="loadingEmail"
              @click="confirmarEmail"
            >
              Continuar
            </PortalButton>
          </div>
        </template>
      </div>
    </div>

    <!-- PASO 3: Éxito -->
    <div v-else-if="paso === 3" :style="{
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

    <!-- PASOS 1–2 -->
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
            :mensaje="`Ya encontramos su registro: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
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
              :disabled="true"
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

        <!-- Error general -->
        <AlertaBanner
          v-if="error"
          tipo="error"
          :mensaje="error"
          :style="{ marginTop: 'var(--sp-lg)' }"
        />

        <!-- Navegación -->
        <div :style="{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          marginTop: 'var(--sp-2xl)', gap: 'var(--sp-md)',
        }">
          <PortalButton
            variant="secondary"
            :full="isMobile"
            @click="paso > 1 ? irAPaso(paso - 1) : router.push('/')"
          >
            {{ paso === 1 ? 'Cancelar' : 'Anterior' }}
          </PortalButton>
          <PortalButton
            variant="primary"
            :disabled="!pasoValido"
            :loading="loading"
            :full="isMobile"
            @click="paso < 2 ? irAPaso(paso + 1) : enviarSolicitud()"
          >
            {{ paso === 2 ? (loading ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente' }}
          </PortalButton>
        </div>
      </div>
    </template>

  </PortalLayout>
</template>
