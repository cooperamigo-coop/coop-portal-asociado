<script setup>
import { useRouter } from 'vue-router'
import PortalLayout       from '@/components/layout/PortalLayout.vue'
import StepIndicator      from '@/components/ui/StepIndicator.vue'
import PortalButton        from '@/components/ui/PortalButton.vue'
import AlertaBanner        from '@/components/ui/AlertaBanner.vue'
import CampoTexto          from '@/components/forms/CampoTexto.vue'
import CampoSelect         from '@/components/forms/CampoSelect.vue'
import CampoSelectBuscable from '@/components/forms/CampoSelectBuscable.vue'
import { useAfiliacion }  from '@/composables/useAfiliacion'
import { useBreakpoint }  from '@/composables/useBreakpoint'
import { IconCircleCheck, IconUserCheck } from '@tabler/icons-vue'

const router = useRouter()

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  tipoDocumentoInicial, numeroDocumentoInicial, errorNumeroDoc,
  aceptaAutorizacion, loadingVerificacion, mostrarModalYaAsociado,
  datosPersonales, datosLaborales,
  pasoValido,
  validarCampoActual, schemaPersonales, schemaLaborales,
  verificarYContinuar, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud,
} = useAfiliacion()

const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'C.C.' },
  { value: 'cedula_extranjeria', label: 'C.E.' },
]

const opsTipoContrato = [
  { value: 'indefinido',  label: 'Término indefinido'     },
  { value: 'fijo',        label: 'Término fijo'           },
  { value: 'obra',        label: 'Obra o labor'           },
  { value: 'prestacion',  label: 'Prestación de servicios'},
]

const { isMobile } = useBreakpoint()

const pasos = [
  { label: 'Datos personales' },
  { label: 'Datos laborales' },
  { label: 'Confirmación' },
]
</script>

<template>
  <PortalLayout>

    <!-- PASO 0: Verificación inicial -->
    <div v-if="paso === 0" :style="{ maxWidth: '380px', margin: '0 auto' }">

      <!-- Título -->
      <div :style="{ marginBottom: 'var(--sp-2xl)' }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-xl)',
          fontWeight: 'var(--fw-extrabold)',
          color:      'var(--color-text-1)',
        }">Comencemos con tu solicitud</div>
      </div>

      <!-- Borrador disponible -->
      <template v-if="borradorDisponible">
        <AlertaBanner
          tipo="info"
          mensaje="Encontramos una solicitud de afiliación guardada para este correo. ¿Deseas continuar donde lo dejaste?"
          :style="{ marginBottom: 'var(--sp-xl)' }"
        />
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
          <PortalButton variant="primary" :full="true" @click="restaurarBorrador">
            Continuar donde lo dejé
          </PortalButton>
          <PortalButton variant="secondary" :full="true" @click="descartarBorrador">
            Iniciar solicitud nueva
          </PortalButton>
        </div>
      </template>

      <!-- Formulario de verificación -->
      <template v-else>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

          <!-- Correo -->
          <CampoTexto
            v-model="emailInicial"
            label="Correo electrónico"
            type="email"
            placeholder="su.correo@ejemplo.com"
            required
            :error="errorEmail"
            @keyup.enter="verificarYContinuar"
          />

          <!-- Tipo doc + Número -->
          <div :style="{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-start' }">
            <div :style="{ flex: '0 0 90px' }">
              <CampoSelectBuscable
                v-model="tipoDocumentoInicial"
                label="Tipo de doc."
                required
                :opciones="opsTipoDocVerificacion"
              />
            </div>
            <div :style="{ flex: '1' }">
              <CampoTexto
                v-model="numeroDocumentoInicial"
                label="Número de documento"
                placeholder="Sin puntos ni espacios"
                required
                solo-numeros
                :error="errorNumeroDoc"
              />
            </div>
          </div>

          <!-- Autorización -->
          <label :style="{
            display:    'flex',
            alignItems: 'flex-start',
            gap:        'var(--sp-sm)',
            cursor:     'pointer',
          }">
            <input
              type="checkbox"
              v-model="aceptaAutorizacion"
              :style="{
                marginTop:   '3px',
                flexShrink:  '0',
                cursor:      'pointer',
                accentColor: 'var(--color-primary)',
                width:       '15px',
                height:      '15px',
              }"
            />
            <span :style="{
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)',
              lineHeight: '1.7',
            }">
              Autorizo a la Cooperativa Multiactiva Luis Amigó para que el número de celular
              y el correo electrónico sean tratados para contactarme y enviarme la información
              relacionada con la solicitud del producto; igualmente para que me consulten ante
              operadores de información y riesgo con el fin de verificar mi información personal,
              junto a los
              <a href="#" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }">Términos y condiciones</a>
              y
              <a href="#" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }">Política de privacidad</a>.
            </span>
          </label>

          <!-- Botones -->
          <div :style="{
            display:         'flex',
            justifyContent:  'space-between',
            gap:             'var(--sp-md)',
            marginTop:       'var(--sp-sm)',
          }">
            <PortalButton variant="secondary" @click="router.push('/')">
              Volver
            </PortalButton>
            <PortalButton
              variant="primary"
              :disabled="!pasoValido"
              :loading="loadingVerificacion"
              @click="verificarYContinuar"
            >
              Verificar y continuar
            </PortalButton>
          </div>

        </div>
      </template>
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
        <IconCircleCheck :size="36" :style="{ color: 'var(--color-success)' }" />
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
              <CampoTexto
                label="Número de cédula"
                v-model="datosPersonales.cedula"
                placeholder="Ej. 1122334455"
                required
                solo-numeros
                :error="erroresCampos.cedula"
                @blur="() => {
                  validarCampoActual(schemaPersonales, 'cedula', datosPersonales.cedula)
                  verificarCedula()
                }"
              />
            </div>
            <CampoTexto
              label="Nombres"
              v-model="datosPersonales.nombres"
              placeholder="Sus nombres"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.nombres"
              @blur="() => validarCampoActual(schemaPersonales, 'nombres', datosPersonales.nombres)"
            />
            <CampoTexto
              label="Apellidos"
              v-model="datosPersonales.apellidos"
              placeholder="Sus apellidos"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.apellidos"
              @blur="() => validarCampoActual(schemaPersonales, 'apellidos', datosPersonales.apellidos)"
            />
            <CampoTexto
              label="Correo electrónico"
              v-model="datosPersonales.email"
              type="email"
              placeholder="correo@ejemplo.com"
              :disabled="true"
            />
            <CampoTexto
              label="Teléfono"
              v-model="datosPersonales.telefono"
              placeholder="3001234567"
              :error="erroresCampos.telefono"
              @blur="() => validarCampoActual(schemaPersonales, 'telefono', datosPersonales.telefono)"
            />
            <CampoTexto
              label="Fecha de nacimiento"
              v-model="datosPersonales.fecha_nacimiento"
              type="date"
              :error="erroresCampos.fecha_nacimiento"
              @blur="() => validarCampoActual(schemaPersonales, 'fecha_nacimiento', datosPersonales.fecha_nacimiento)"
            />
            <CampoTexto
              label="Ciudad"
              v-model="datosPersonales.ciudad"
              placeholder="Su ciudad"
              :error="erroresCampos.ciudad"
              @blur="() => validarCampoActual(schemaPersonales, 'ciudad', datosPersonales.ciudad)"
            />
            <div :style="{ gridColumn: '1 / -1' }">
              <CampoTexto
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
              <CampoTexto
                label="Empresa"
                v-model="datosLaborales.empresa"
                placeholder="Nombre de la empresa"
                required
                :error="erroresCampos.empresa"
                @blur="() => validarCampoActual(schemaLaborales, 'empresa', datosLaborales.empresa)"
              />
            </div>
            <CampoTexto
              label="Cargo"
              v-model="datosLaborales.cargo"
              placeholder="Su cargo actual"
              :error="erroresCampos.cargo"
              @blur="() => validarCampoActual(schemaLaborales, 'cargo', datosLaborales.cargo)"
            />
            <CampoSelect
              label="Tipo de contrato"
              v-model="datosLaborales.tipo_contrato"
              :opciones="opsTipoContrato"
              placeholder="Seleccione..."
            />
            <CampoTexto
              label="Salario mensual"
              v-model="datosLaborales.salario"
              type="number"
              placeholder="Ej. 3000000"
              required
              :error="erroresCampos.salario"
              @blur="() => validarCampoActual(schemaLaborales, 'salario', datosLaborales.salario)"
            />
            <CampoTexto
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

    <!-- ═══ MODAL — Ya es asociado ══════════════════════════ -->
    <Teleport to="body">
      <Transition :name="isMobile ? 'sheet-modal' : 'fade-modal'">
        <div
          v-if="mostrarModalYaAsociado"
          :style="{
            position:       'fixed',
            inset:          '0',
            zIndex:         '60',
            display:        'flex',
            alignItems:     isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding:        isMobile ? '0' : 'var(--sp-lg)',
          }"
        >
          <div :style="{
            position:       'absolute',
            inset:          '0',
            background:     'rgba(23,43,54,0.5)',
            backdropFilter: 'blur(3px)',
          }" @click="mostrarModalYaAsociado = false" />

          <div :style="{
            position:     'relative',
            width:        '100%',
            maxWidth:     isMobile ? '100%' : '440px',
            background:   'var(--color-bg-card)',
            borderRadius: isMobile ? 'var(--r-2xl) var(--r-2xl) 0 0' : 'var(--r-2xl)',
            boxShadow:    'var(--shadow-modal)',
            padding:      isMobile ? 'var(--sp-md) var(--sp-lg) var(--sp-2xl)' : 'var(--sp-2xl)',
            animation:    isMobile
              ? 'entrarModalSheet 0.35s cubic-bezier(0.32,0.72,0,1) both'
              : 'entrarModal 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }">
            <div v-if="isMobile" :style="{
              width: '40px', height: '4px', borderRadius: 'var(--r-pill)',
              background: 'var(--color-border)', margin: '0 auto var(--sp-lg)',
            }" />

            <div :style="{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-lg)', flexShrink: '0',
            }">
              <IconUserCheck :size="30" :style="{ color: 'var(--color-success)' }" />
            </div>

            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily:   'var(--font-display)',
                fontSize:     'var(--text-lg)',
                fontWeight:   'var(--fw-extrabold)',
                color:        'var(--color-text-1)',
                marginBottom: 'var(--sp-sm)',
              }">Ya eres asociado</div>
              <div :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: '1.6',
              }">
                El documento
                <strong :style="{ color: 'var(--color-text-1)' }">{{ numeroDocumentoInicial }}</strong>
                ya está registrado como asociado activo de Cooperamigó.
                Si deseas solicitar un crédito, puedes hacerlo desde el portal.
              </div>
            </div>

            <div :style="{
              display:        'flex',
              flexDirection:  isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
              gap:            'var(--sp-sm)',
            }">
              <PortalButton variant="secondary" :full="isMobile" @click="mostrarModalYaAsociado = false">
                Volver
              </PortalButton>
              <PortalButton variant="primary" :full="isMobile" @click="router.push('/solicitar-credito')">
                Solicitar crédito
              </PortalButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
@keyframes entrarModal {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes entrarModalSheet {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.fade-modal-enter-active  { transition: opacity 0.2s ease; }
.fade-modal-leave-active  { transition: opacity 0.15s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to      { opacity: 0; }
.sheet-modal-enter-active { transition: opacity 0.3s ease; }
.sheet-modal-leave-active { transition: opacity 0.2s ease; }
.sheet-modal-enter-from,
.sheet-modal-leave-to     { opacity: 0; }
</style>
