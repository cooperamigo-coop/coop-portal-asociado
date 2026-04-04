<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
<<<<<<< HEAD
import PortalLayout from '@/components/layout/PortalLayout.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import PortalInput from '@/components/ui/PortalInput.vue'
import AlertaBanner from '@/components/ui/AlertaBanner.vue'
import { useCredito } from '@/composables/useCredito'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { CheckCircle, Mail } from 'lucide-vue-next'
=======
import PortalLayout      from '@/components/layout/PortalLayout.vue'
import PortalButton      from '@/components/ui/PortalButton.vue'
import SeccionPersona    from '@/components/forms/SeccionPersona.vue'
import SeccionLaboral    from '@/components/forms/SeccionLaboral.vue'
import SeccionFinanciera from '@/components/forms/SeccionFinanciera.vue'
import SeccionPatrimonio from '@/components/forms/SeccionPatrimonio.vue'
import GrupoReferencia   from '@/components/forms/GrupoReferencia.vue'
import CampoTexto        from '@/components/forms/CampoTexto.vue'
import CampoSelect       from '@/components/forms/CampoSelect.vue'
import CampoMoneda       from '@/components/forms/CampoMoneda.vue'
import CampoFecha        from '@/components/forms/CampoFecha.vue'
import CampoCheck        from '@/components/forms/CampoCheck.vue'
import {
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, Send,
  UserX, MessageCircle, Mail, Phone, RotateCcw,
} from 'lucide-vue-next'
import { useSolicitudCredito } from '@/composables/useSolicitudCredito'
>>>>>>> 11ce3e8 (feat: new fields in the credit form)

const router = useRouter()

const {
<<<<<<< HEAD
  paso, loading, loadingEmail, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  datosPersonales, datosLaborales, datosCredito,
  cuotaEstimada, pasoValido,
  validarCampoActual, schemaPersonales, schemaLaborales, schemaCredito,
  confirmarEmail, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud, reiniciar,
} = useCredito()
=======
  paso, totalPasos, loading, error, enviado,
  porcentaje, pasos,
  verificacion, verificado, loadingVerificacion, errorVerificacion,
  asociadoVerificado, mostrarModalNoAsociado,
  tieneBorradorPrevio, borradorRecuperado,
  verificarYContinuar, onCorreoCambia,
  general, persona, laboral, financiera, patrimonio, cuenta,
  refFamiliar1, refFamiliar2, refPersonal1, refPersonal2,
  personaCod, laboralCod, financieraCod, patrimonioCod,
  refFamiliarCod1, refFamiliarCod2,
  refPersonalCod1, refPersonalCod2,
  autorizaciones,
  siguiente, anterior, irAPaso, enviar,
} = useSolicitudCredito()
>>>>>>> 11ce3e8 (feat: new fields in the credit form)

const pasoActual = computed(() => pasos.find(p => p.numero === paso.value))

const opsTipoOperacion = [
  { value: 'credito_nuevo',           label: 'Crédito nuevo'               },
  { value: 'reestructura',            label: 'Reestructura'                },
  { value: 'reestructura_desembolso', label: 'Reestructura con desembolso' },
]

const opsTipoCuenta = [
  { value: 'ahorros',   label: 'Cuenta de ahorros' },
  { value: 'corriente', label: 'Cuenta corriente'   },
]

const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
  { value: 'pasaporte',          label: 'Pasaporte'             },
  { value: 'otro',               label: 'Otro'                  },
]
</script>

<template>
  <PortalLayout>

<<<<<<< HEAD
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
        }">Solicitud de crédito</div>

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
            mensaje="Encontramos una solicitud de crédito guardada para este correo. ¿Deseas continuar donde lo dejaste?"
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

    <!-- PASO 4: Éxito -->
    <div v-else-if="paso === 4" :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-2xl)',
      padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
      boxShadow: 'var(--shadow-card)',
      textAlign: 'center',
=======
    <!-- ═══ PANTALLA DE ÉXITO ═══════════════════════════════ -->
    <div v-if="enviado" :style="{
      background:   'var(--color-bg-card)',
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      padding:      '64px var(--sp-2xl)',
      boxShadow:    'var(--shadow-card)',
      textAlign:    'center',
>>>>>>> 11ce3e8 (feat: new fields in the credit form)
    }">
      <div :style="{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'var(--color-success-bg)',
        border: '2px solid var(--color-success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--sp-xl)',
      }">
        <CheckCircle :size="40" :style="{ color: 'var(--color-success)' }" />
      </div>
      <div :style="{
        fontFamily:   'var(--font-display)',
        fontSize:     'var(--text-xl)',
        fontWeight:   'var(--fw-extrabold)',
        color:        'var(--color-text-1)',
        marginBottom: 'var(--sp-md)',
      }">¡Solicitud enviada exitosamente!</div>
      <div :style="{
        fontSize:     'var(--text-base)',
        color:        'var(--color-text-2)',
        fontWeight:   'var(--fw-medium)',
        lineHeight:   '1.7',
        maxWidth:     '480px',
        margin:       '0 auto var(--sp-2xl)',
      }">
        Su solicitud de crédito fue radicada correctamente.
        Un asesor de Cooperamigó se comunicará con usted en
        los próximos días hábiles para continuar el proceso.
      </div>
      <PortalButton variant="primary" @click="router.push('/')">
        Volver al inicio
      </PortalButton>
    </div>

    <!-- ═══ PANTALLA PREVIA — Verificación de identidad ═════ -->
    <div v-else-if="!verificado">

      <!-- Card de verificación -->
      <div :style="{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-xl)',
        padding:      'var(--sp-2xl)',
        boxShadow:    'var(--shadow-card)',
        maxWidth:     '520px',
        margin:       '0 auto',
      }">

        <!-- Ícono y título -->
        <div :style="{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          textAlign:     'center',
          marginBottom:  'var(--sp-2xl)',
        }">
          <div :style="{
            width:          '64px',
            height:         '64px',
            borderRadius:   '50%',
            background:     'var(--color-primary-light)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            marginBottom:   'var(--sp-lg)',
          }">
            <ShieldCheck :size="30" :style="{ color: 'var(--color-primary)' }" />
          </div>
          <div :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-xl)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
            marginBottom: 'var(--sp-xs)',
          }">Verificación de identidad</div>
          <div :style="{
            fontSize:   'var(--text-base)',
            color:      'var(--color-text-2)',
            fontWeight: 'var(--fw-medium)',
            lineHeight: '1.6',
            maxWidth:   '380px',
          }">
            Para iniciar su solicitud necesitamos verificar
            que usted es asociado activo de Cooperamigó.
          </div>
        </div>

        <!-- Campos de verificación -->
        <div :style="{
          display:       'flex',
          flexDirection: 'column',
          gap:           'var(--sp-lg)',
        }">

          <!-- Correo con banner de borrador -->
          <div>
            <CampoTexto
              :model-value="verificacion.correo"
              label="Correo electrónico"
              type="email"
              placeholder="su.correo@ejemplo.com"
              required
              helper="Usaremos este correo para guardar su progreso automáticamente"
              @update:model-value="onCorreoCambia($event)"
            />
            <div
              v-if="tieneBorradorPrevio"
              :style="{
                display:      'flex',
                alignItems:   'center',
                gap:          'var(--sp-sm)',
                marginTop:    'var(--sp-sm)',
                padding:      'var(--sp-sm) var(--sp-md)',
                borderRadius: 'var(--r-lg)',
                background:   'var(--color-warning-bg)',
                border:       '1px solid var(--color-border)',
              }"
            >
              <RotateCcw :size="14" :style="{ color: 'var(--color-warning-text)', flexShrink: '0' }" />
              <span :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-warning-text)',
                fontWeight: 'var(--fw-semibold)',
              }">
                Encontramos una solicitud guardada para este correo.
                Al continuar, sus datos se recuperarán automáticamente.
              </span>
            </div>
          </div>

          <!-- Tipo de documento -->
          <CampoSelect
            v-model="verificacion.tipo_documento"
            label="Tipo de documento"
            required
            :opciones="opsTipoDocVerificacion"
          />

          <!-- Número de documento -->
          <CampoTexto
            v-model="verificacion.numero_documento"
            label="Número de documento"
            placeholder="Sin puntos ni espacios"
            required
            :helper="
              ['cedula_ciudadania','cedula_extranjeria'].includes(verificacion.tipo_documento)
                ? 'Verificaremos que es asociado activo de Cooperamigó'
                : null
            "
          />

          <!-- Error de verificación -->
          <div v-if="errorVerificacion" :style="{
            background:   'var(--color-error-bg)',
            color:        'var(--color-error-text)',
            padding:      'var(--sp-md) var(--sp-lg)',
            borderRadius: 'var(--r-lg)',
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--fw-medium)',
          }">{{ errorVerificacion }}</div>

          <!-- Botón continuar -->
          <PortalButton
            variant="primary"
            :loading="loadingVerificacion"
            :full="true"
            @click="verificarYContinuar()"
          >
            <ArrowRight :size="16" />
            Verificar y continuar
          </PortalButton>
        </div>
      </div>

      <!-- Banner borrador recuperado -->
      <div v-if="borradorRecuperado" :style="{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--sp-sm)',
        padding:      'var(--sp-md) var(--sp-lg)',
        borderRadius: 'var(--r-lg)',
        background:   'var(--color-success-bg)',
        border:       '1px solid var(--color-success)',
        maxWidth:     '520px',
        margin:       'var(--sp-lg) auto 0',
      }">
        <CheckCircle :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
        <span :style="{
          fontSize:   'var(--text-base)',
          color:      'var(--color-success-text)',
          fontWeight: 'var(--fw-semibold)',
        }">
          Sus datos anteriores fueron recuperados. Continúa desde donde lo dejó.
        </span>
      </div>
    </div>

<<<<<<< HEAD
    <!-- PASOS 1–3 -->
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
=======
    <!-- ═══ FORMULARIO ACTIVO (17 pasos) ════════════════════ -->
    <div v-else>

      <!-- Encabezado con progreso -->
      <div :style="{ marginBottom: 'var(--sp-xl)' }">
        <div :style="{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-end',
          marginBottom:   'var(--sp-sm)',
        }">
          <div>
            <div :style="{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           'var(--sp-xs)',
              padding:       '2px 12px',
              borderRadius:  'var(--r-pill)',
              background:    'var(--color-primary-light)',
              color:         'var(--color-primary)',
              fontSize:      'var(--text-xs)',
              fontWeight:    'var(--fw-bold)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom:  'var(--sp-xs)',
            }">{{ pasoActual?.seccion }}</div>
>>>>>>> 11ce3e8 (feat: new fields in the credit form)
            <div :style="{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-xl)',
              fontWeight: 'var(--fw-extrabold)',
              color:      'var(--color-text-1)',
            }">{{ pasoActual?.titulo }}</div>
          </div>
          <div :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-3)',
            fontWeight: 'var(--fw-semibold)',
          }">Paso {{ paso }} de {{ totalPasos }}</div>
        </div>
        <!-- Barra de progreso -->
        <div :style="{
          height:       '6px',
          background:   'var(--color-border)',
          borderRadius: 'var(--r-pill)',
          overflow:     'hidden',
        }">
          <div :style="{
            height:     '100%',
            width:      porcentaje + '%',
            background: 'var(--color-primary)',
            borderRadius: 'var(--r-pill)',
            transition: 'width 0.4s ease',
          }" />
        </div>
      </div>

      <!-- Contenido del paso -->
      <div :style="{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-xl)',
        padding:      'var(--sp-2xl)',
        boxShadow:    'var(--shadow-card)',
        marginBottom: 'var(--sp-lg)',
      }">

        <!-- PASO 1: Datos generales -->
        <div v-if="paso === 1" :style="{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--sp-lg)',
        }">
          <CampoFecha
            v-model="general.fecha_solicitud"
            label="Fecha de solicitud"
            required
          />
          <CampoMoneda
            v-model="general.valor_credito"
            label="Valor del crédito solicitado"
            required
            helper="Entre $500.000 y $500.000.000"
          />
          <CampoSelect
            v-model="general.tipo_operacion"
            label="Tipo de operación"
            :opciones="opsTipoOperacion"
            required
            :style="{ gridColumn: '1 / -1' }"
          />
          <template v-if="general.tipo_operacion && general.tipo_operacion !== 'credito_nuevo'">
            <CampoMoneda
              v-model="general.monto_reestructura"
              label="Monto de reestructura"
            />
            <div />
          </template>
          <CampoTexto
            v-model="general.destino_credito"
            label="Destino del crédito"
            placeholder="¿Para qué usará el crédito?"
            required
            :style="{ gridColumn: '1 / -1' }"
          />
          <div>
            <label :style="{
              fontSize:     'var(--text-sm)',
              fontWeight:   'var(--fw-semibold)',
              color:        'var(--color-text-1)',
              display:      'block',
              marginBottom: 'var(--sp-xs)',
            }">Plazo solicitado *</label>
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <input
                v-model.number="general.plazo_solicitado"
                type="number" min="1" max="120"
                placeholder="Ej: 24"
                :style="{
                  padding:     '9px 14px',
                  border:      '1px solid var(--color-border)',
                  borderRadius:'var(--r-lg)',
                  fontSize:    'var(--text-base)',
                  fontFamily:  'var(--font-body)',
                  background:  'var(--color-bg-surface)',
                  color:       'var(--color-text-1)',
                  outline:     'none',
                  width:       '120px',
                }"
              />
              <span :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
              }">meses</span>
            </div>
          </div>
          <div :style="{ display: 'flex', alignItems: 'center' }">
            <CampoCheck
              v-model="general.credito_educativo"
              label="Es un crédito educativo"
            />
          </div>
        </div>

        <!-- PASO 2: Datos personales solicitante -->
        <SeccionPersona
          v-if="paso === 2"
          v-model="persona"
          titulo="Información del solicitante"
        />

        <!-- PASO 3: Laboral solicitante -->
        <SeccionLaboral
          v-if="paso === 3"
          v-model="laboral"
          titulo="Información laboral"
        />

        <!-- PASO 4: Financiera solicitante -->
        <SeccionFinanciera
          v-if="paso === 4"
          v-model="financiera"
          titulo="Información financiera"
        />

        <!-- PASO 5: Patrimonio solicitante -->
        <SeccionPatrimonio
          v-if="paso === 5"
          v-model="patrimonio"
          titulo="Patrimonio"
        />

        <!-- PASO 6: Cuenta de desembolso -->
        <div v-if="paso === 6" :style="{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--sp-lg)',
        }">
          <CampoSelect
            v-model="cuenta.tipo_cuenta"
            label="Tipo de cuenta"
            :opciones="opsTipoCuenta"
            required
          />
          <CampoTexto
            v-model="cuenta.entidad_bancaria"
            label="Entidad bancaria"
            placeholder="Ej: Bancolombia, Davivienda"
            required
          />
          <CampoTexto
            v-model="cuenta.numero_cuenta"
            label="Número de cuenta"
            placeholder="Solo números"
            required
            :style="{ gridColumn: '1 / -1' }"
          />
        </div>

        <!-- PASO 7: Referencias familiares solicitante -->
        <div v-if="paso === 7" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <GrupoReferencia v-model="refFamiliar1" titulo="Referencia familiar" tipo="familiar" :numero="1" />
          <GrupoReferencia v-model="refFamiliar2" titulo="Referencia familiar" tipo="familiar" :numero="2" />
        </div>

        <!-- PASO 8: Referencias personales solicitante -->
        <div v-if="paso === 8" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <GrupoReferencia v-model="refPersonal1" titulo="Referencia personal" tipo="personal" :numero="1" />
          <GrupoReferencia v-model="refPersonal2" titulo="Referencia personal" tipo="personal" :numero="2" />
        </div>

        <!-- PASO 9: Datos personales codeudor (mismo componente) -->
        <SeccionPersona
          v-if="paso === 9"
          v-model="personaCod"
          titulo="Información del codeudor"
        />

        <!-- PASO 10: Laboral codeudor -->
        <SeccionLaboral
          v-if="paso === 10"
          v-model="laboralCod"
          titulo="Información laboral del codeudor"
        />

        <!-- PASO 11: Financiera codeudor -->
        <SeccionFinanciera
          v-if="paso === 11"
          v-model="financieraCod"
          titulo="Información financiera del codeudor"
          :sin-ahorros="true"
        />

        <!-- PASO 12: Patrimonio codeudor -->
        <SeccionPatrimonio
          v-if="paso === 12"
          v-model="patrimonioCod"
          titulo="Patrimonio del codeudor"
        />

        <!-- PASO 13: Referencias familiares codeudor -->
        <div v-if="paso === 13" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <GrupoReferencia v-model="refFamiliarCod1" titulo="Referencia familiar codeudor" tipo="familiar" :numero="1" />
          <GrupoReferencia v-model="refFamiliarCod2" titulo="Referencia familiar codeudor" tipo="familiar" :numero="2" />
        </div>

        <!-- PASO 14: Referencias personales codeudor -->
        <div v-if="paso === 14" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <GrupoReferencia v-model="refPersonalCod1" titulo="Referencia personal codeudor" tipo="personal" :numero="1" />
          <GrupoReferencia v-model="refPersonalCod2" titulo="Referencia personal codeudor" tipo="personal" :numero="2" />
        </div>

        <!-- PASO 15: Datos operativos -->
        <div v-if="paso === 15" :style="{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--sp-lg)',
        }">
          <CampoTexto v-model="general.numero_comprobante" label="Número de comprobante" placeholder="Opcional" />
          <CampoTexto v-model="general.numero_pagare"      label="Número de pagaré"      placeholder="Opcional" />
        </div>

        <!-- PASO 16: Autorizaciones -->
        <div v-if="paso === 16" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)',
        }">
          <div :style="{
            fontSize:     'var(--text-base)',
            color:        'var(--color-text-2)',
            fontWeight:   'var(--fw-medium)',
            lineHeight:   '1.6',
            marginBottom: 'var(--sp-md)',
            padding:      'var(--sp-lg)',
            background:   'var(--color-bg-surface)',
            borderRadius: 'var(--r-lg)',
            border:       '1px solid var(--color-border)',
          }">
            Lea cuidadosamente cada autorización antes de aceptarla.
            Los campos marcados con * son obligatorios para procesar su solicitud.
          </div>
          <CampoCheck v-model="autorizaciones.autorizacion_reporte_centrales"
            label="Autorizo a Cooperamigó para reportar mi información a las centrales de riesgo y consultar mis hábitos de pago *"
            required />
          <CampoCheck v-model="autorizaciones.autorizacion_consulta_informacion"
            label="Autorizo la consulta de mi información en bases de datos públicas y privadas para verificar mi capacidad crediticia" />
          <CampoCheck v-model="autorizaciones.autorizacion_tratamiento_datos"
            label="Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la política de privacidad de Cooperamigó *"
            required />
          <CampoCheck v-model="autorizaciones.autorizacion_datos_sensibles"
            label="Autorizo el tratamiento de mis datos sensibles (huella dactilar) para los procesos de verificación de identidad" />
          <CampoCheck v-model="autorizaciones.declaracion_veracidad_informacion"
            label="Declaro bajo la gravedad de juramento que toda la información suministrada en este formulario es veraz y verificable *"
            required />
        </div>

        <!-- PASO 17: Firmas -->
        <div v-if="paso === 17" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)',
        }">
          <div :style="{
            padding:      'var(--sp-lg)',
            background:   'var(--color-info-bg)',
            borderRadius: 'var(--r-lg)',
            border:       '1px solid var(--color-border)',
            fontSize:     'var(--text-base)',
            color:        'var(--color-info-text)',
            fontWeight:   'var(--fw-medium)',
            lineHeight:   '1.6',
          }">
            Complete los datos de firma. La firma digital se realizará
            durante el proceso presencial con el asesor de Cooperamigó.
          </div>

          <div :style="{
            border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)', background: 'var(--color-bg-surface)',
          }">
            <div :style="{
              fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)',
              marginBottom: 'var(--sp-lg)', fontSize: 'var(--text-base)',
            }">Datos del solicitante para firma</div>
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
              <CampoTexto v-model="general.nombre_firma_solicitante" label="Nombre completo" placeholder="Nombre para la firma" />
              <CampoTexto v-model="general.cc_firma_solicitante"     label="Número de cédula" placeholder="CC del solicitante" />
            </div>
          </div>

          <div :style="{
            border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)', background: 'var(--color-bg-surface)',
          }">
            <div :style="{
              fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)',
              marginBottom: 'var(--sp-lg)', fontSize: 'var(--text-base)',
            }">Datos del codeudor para firma</div>
            <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }">
              <CampoTexto v-model="general.nombre_codeudor_1" label="Nombre completo" placeholder="Nombre del codeudor" />
              <CampoTexto v-model="general.cc_codeudor_1"     label="Número de cédula" placeholder="CC del codeudor" />
            </div>
          </div>
        </div>

      </div>

      <!-- Error general -->
      <div v-if="error" :style="{
        background:   'var(--color-error-bg)',
        color:        'var(--color-error-text)',
        padding:      'var(--sp-md) var(--sp-lg)',
        borderRadius: 'var(--r-lg)',
        fontSize:     'var(--text-base)',
        fontWeight:   'var(--fw-medium)',
        marginBottom: 'var(--sp-lg)',
      }">{{ error }}</div>

      <!-- Navegación -->
      <div :style="{
        display:        'flex',
        justifyContent: paso === 1 ? 'flex-end' : 'space-between',
        alignItems:     'center',
        gap:            'var(--sp-md)',
      }">
        <PortalButton v-if="paso > 1" variant="secondary" @click="anterior()">
          <ArrowLeft :size="15" /> Anterior
        </PortalButton>
        <PortalButton v-if="paso < 17" variant="primary" :loading="loading" @click="siguiente()">
          Continuar <ArrowRight :size="15" />
        </PortalButton>
        <PortalButton v-if="paso === 17" variant="accent" :loading="loading" @click="enviar()">
          <Send :size="15" /> Enviar solicitud
        </PortalButton>
      </div>

      <!-- Dots de navegación -->
      <div :style="{
        display:        'flex',
        justifyContent: 'center',
        gap:            'var(--sp-xs)',
        marginTop:      'var(--sp-xl)',
        flexWrap:       'wrap',
      }">
        <div
          v-for="p in pasos"
          :key="p.numero"
          :style="{
            width:      paso === p.numero ? '24px' : '8px',
            height:     '8px',
            borderRadius: 'var(--r-pill)',
            background: paso === p.numero
              ? 'var(--color-primary)'
              : paso > p.numero
                ? 'var(--color-success)'
                : 'var(--color-border)',
            transition: 'all var(--transition-base)',
            cursor:     paso > p.numero ? 'pointer' : 'default',
          }"
          @click="paso > p.numero && irAPaso(p.numero)"
        />
      </div>

    </div>

    <!-- ═══ MODAL — Asociado no encontrado ══════════════════ -->
    <Teleport to="body">
      <Transition name="fade-modal">
        <div
          v-if="mostrarModalNoAsociado"
          :style="{
            position:       'fixed',
            inset:          '0',
            zIndex:         '60',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        'var(--sp-lg)',
          }"
        >
          <!-- Backdrop -->
          <div :style="{
            position:       'absolute',
            inset:          '0',
            background:     'rgba(23,43,54,0.5)',
            backdropFilter: 'blur(3px)',
          }" @click="mostrarModalNoAsociado = false" />

          <!-- Card del modal -->
          <div :style="{
            position:     'relative',
            width:        '100%',
            maxWidth:     '480px',
            background:   'var(--color-bg-card)',
            borderRadius: 'var(--r-2xl)',
            boxShadow:    'var(--shadow-modal)',
            padding:      'var(--sp-2xl)',
            animation:    'entrarModal 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }">

            <!-- Ícono -->
            <div :style="{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--color-warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-xl)',
            }">
              <UserX :size="34" :style="{ color: 'var(--color-warning-text)' }" />
            </div>

            <!-- Texto -->
            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily:   'var(--font-display)',
                fontSize:     'var(--text-lg)',
                fontWeight:   'var(--fw-extrabold)',
                color:        'var(--color-text-1)',
                marginBottom: 'var(--sp-md)',
              }">Documento no encontrado</div>
              <div :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: '1.7',
              }">
                El documento
                <strong :style="{ color: 'var(--color-text-1)' }">
                  {{ verificacion.numero_documento }}
                </strong>
                no está registrado como asociado activo de Cooperamigó.
              </div>
              <div :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: '1.7',
                marginTop:  'var(--sp-sm)',
              }">
                Para solicitar un crédito debe ser asociado.
                Contáctenos y con gusto le orientamos en el proceso de afiliación.
              </div>
            </div>

            <!-- Separador -->
            <div :style="{
              height:     '1px',
              background: 'var(--color-border)',
              margin:     'var(--sp-xl) 0',
            }" />

            <!-- Canales de contacto -->
            <div :style="{
              display:       'flex',
              flexDirection: 'column',
              gap:           'var(--sp-md)',
              marginBottom:  'var(--sp-xl)',
            }">
              <div :style="{
                fontSize:      'var(--text-sm)',
                fontWeight:    'var(--fw-bold)',
                color:         'var(--color-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom:  'var(--sp-xs)',
              }">Canales de atención</div>

              <!-- TODO: Reemplazar con datos reales de contacto -->

              <!-- WhatsApp -->
              <a
                href="https://wa.me/57XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                :style="{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            'var(--sp-md)',
                  padding:        'var(--sp-md) var(--sp-lg)',
                  borderRadius:   'var(--r-xl)',
                  background:     'var(--color-bg-surface)',
                  border:         '1px solid var(--color-border)',
                  textDecoration: 'none',
                  transition:     'all var(--transition-fast)',
                  cursor:         'pointer',
                }"
                @mouseenter="e => {
                  e.currentTarget.style.background = 'var(--color-primary-light)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                }"
                @mouseleave="e => {
                  e.currentTarget.style.background = 'var(--color-bg-surface)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }"
              >
                <div :style="{
                  width: '40px', height: '40px', borderRadius: 'var(--r-lg)',
                  background: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: '0',
                }">
                  <MessageCircle :size="20" :style="{ color: '#fff' }" />
                </div>
                <div>
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">WhatsApp</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Atención inmediata · Lun–Vie 8am–5pm</div>
                </div>
              </a>

              <!-- Correo electrónico -->
              <!-- TODO: Reemplazar info@cooperamigo.com con el correo real -->
              <a
                href="mailto:info@cooperamigo.com"
                :style="{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            'var(--sp-md)',
                  padding:        'var(--sp-md) var(--sp-lg)',
                  borderRadius:   'var(--r-xl)',
                  background:     'var(--color-bg-surface)',
                  border:         '1px solid var(--color-border)',
                  textDecoration: 'none',
                  transition:     'all var(--transition-fast)',
                  cursor:         'pointer',
                }"
                @mouseenter="e => {
                  e.currentTarget.style.background = 'var(--color-primary-light)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                }"
                @mouseleave="e => {
                  e.currentTarget.style.background = 'var(--color-bg-surface)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }"
              >
                <div :style="{
                  width: '40px', height: '40px', borderRadius: 'var(--r-lg)',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: '0',
                }">
                  <Mail :size="20" :style="{ color: 'var(--color-text-on-primary)' }" />
                </div>
                <div>
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">info@cooperamigo.com</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Respuesta en 24 horas hábiles</div>
                </div>
              </a>

              <!-- Teléfono -->
              <!-- TODO: Reemplazar +57XXXXXXXXXX con el número real -->
              <a
                href="tel:+57XXXXXXXXXX"
                :style="{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            'var(--sp-md)',
                  padding:        'var(--sp-md) var(--sp-lg)',
                  borderRadius:   'var(--r-xl)',
                  background:     'var(--color-bg-surface)',
                  border:         '1px solid var(--color-border)',
                  textDecoration: 'none',
                  transition:     'all var(--transition-fast)',
                  cursor:         'pointer',
                }"
                @mouseenter="e => {
                  e.currentTarget.style.background = 'var(--color-primary-light)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                }"
                @mouseleave="e => {
                  e.currentTarget.style.background = 'var(--color-bg-surface)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }"
              >
                <div :style="{
                  width: '40px', height: '40px', borderRadius: 'var(--r-lg)',
                  background: 'var(--color-impulso)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: '0',
                }">
                  <Phone :size="20" :style="{ color: '#fff' }" />
                </div>
                <div>
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">+57 XXX XXX XXXX</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Línea directa de atención</div>
                </div>
              </a>
            </div>

            <!-- Opción afiliarse -->
            <div :style="{
              padding:      'var(--sp-lg)',
              borderRadius: 'var(--r-xl)',
              background:   'var(--color-primary-light)',
              border:       '1px solid var(--color-border)',
              textAlign:    'center',
              marginBottom: 'var(--sp-xl)',
            }">
              <div :style="{
                fontSize:     'var(--text-base)',
                color:        'var(--color-primary)',
                fontWeight:   'var(--fw-semibold)',
                marginBottom: 'var(--sp-sm)',
              }">¿Aún no es asociado?</div>
              <PortalButton
                variant="primary"
                @click="router.push('/solicitar-afiliacion')"
              >
                Solicitar afiliación
              </PortalButton>
            </div>

            <!-- Botón cerrar -->
            <PortalButton
              variant="secondary"
              :full="true"
              @click="mostrarModalNoAsociado = false"
            >
              Volver e intentar con otro documento
            </PortalButton>

          </div>
        </div>
      </Transition>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes entrarModal {
  from {
    opacity:   0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity:   1;
    transform: translateY(0) scale(1);
  }
}
.fade-modal-enter-active { transition: opacity 0.2s ease; }
.fade-modal-leave-active { transition: opacity 0.25s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to     { opacity: 0; }
</style>
