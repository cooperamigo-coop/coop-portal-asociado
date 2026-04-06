<script setup>
import { useRouter } from 'vue-router'
import PortalLayout       from '@/components/layout/PortalLayout.vue'
import StepIndicator      from '@/components/ui/StepIndicator.vue'
import PortalButton       from '@/components/ui/PortalButton.vue'
import AlertaBanner       from '@/components/ui/AlertaBanner.vue'
import CampoTexto         from '@/components/forms/CampoTexto.vue'
import CampoSelect        from '@/components/forms/CampoSelect.vue'
import CampoSelectBuscable from '@/components/forms/CampoSelectBuscable.vue'
import CampoMoneda        from '@/components/forms/CampoMoneda.vue'
import CampoCheck         from '@/components/forms/CampoCheck.vue'
import { useAfiliacion }  from '@/composables/useAfiliacion'
import { useBreakpoint }  from '@/composables/useBreakpoint'
import { IconCircleCheck, IconUserCheck } from '@tabler/icons-vue'

const router = useRouter()
const { isMobile } = useBreakpoint()

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  tipoDocumentoInicial, numeroDocumentoInicial, errorNumeroDoc,
  aceptaAutorizacion, loadingVerificacion, mostrarModalYaAsociado,
  oficina,
  datosPersonales, datosLaborales,
  actividadIndependiente, datosFinancieros, activosPasivos,
  datosConyuge, referencias, declaraciones,
  pasoValido, necesitaConyuge, esIndependiente,
  validarCampoActual, schemaPersonales,
  verificarYContinuar, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud,
} = useAfiliacion()

// ── Opciones ────────────────────────────────────────────────────────────────
const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'C.C.' },
  { value: 'cedula_extranjeria', label: 'C.E.' },
]
const opsTipoDocumento = [
  { value: 'CC', label: 'C.C. — Cédula de Ciudadanía' },
  { value: 'CE', label: 'C.E. — Cédula de Extranjería' },
]
const opsEstadoCivil = [
  { value: 'Soltero',     label: 'Soltero/a'     },
  { value: 'Casado',      label: 'Casado/a'       },
  { value: 'Separado',    label: 'Separado/a'     },
  { value: 'Viudo',       label: 'Viudo/a'        },
  { value: 'Union Libre', label: 'Unión Libre'    },
]
const opsTipoVivienda = [
  { value: 'Propia',    label: 'Propia'    },
  { value: 'Arrendada', label: 'Arrendada' },
  { value: 'Familiar',  label: 'Familiar'  },
]
const opsGenero = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino',  label: 'Femenino'  },
]
const opsNivelAcademico = [
  { value: 'Primaria',           label: 'Primaria'             },
  { value: 'Bachiller',          label: 'Bachiller'            },
  { value: 'Tecnico Tecnologo',  label: 'Técnico / Tecnólogo'  },
  { value: 'Universitario',      label: 'Universitario'        },
  { value: 'Otro',               label: 'Otro'                 },
]
const opsOcupacion = [
  { value: 'Empleado',      label: 'Empleado'      },
  { value: 'Jubilado',      label: 'Jubilado'      },
  { value: 'Pensionado',    label: 'Pensionado'    },
  { value: 'Independiente', label: 'Independiente' },
  { value: 'Otro',          label: 'Otro'          },
]
const opsTipoContrato = [
  { value: 'Termino Fijo',       label: 'Término Fijo'       },
  { value: 'Termino Indefinido', label: 'Término Indefinido' },
  { value: 'Otro',               label: 'Otro'               },
]
const opsOficina = [
  { value: 'PRINCIPAL - MEDELLÍN', label: 'Principal — Medellín' },
]

// ── Pasos del indicador (pasos 1-6, excluyendo 0 y 7) ──────────────────────
const pasos = [
  { label: 'Personal'      },
  { label: 'Laboral'       },
  { label: 'Finanzas'      },
  { label: 'Cónyuge'       },
  { label: 'Referencias'   },
  { label: 'Declaraciones' },
]

// Estilos reutilizables
const estiloSeccionTitulo = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--fw-extrabold)',
  color: 'var(--color-text-1)',
  marginBottom: 'var(--sp-xl)',
}
const estiloSubtitulo = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--color-primary)',
  marginBottom: 'var(--sp-md)',
  marginTop: 'var(--sp-xl)',
  paddingBottom: 'var(--sp-xs)',
  borderBottom: '1px solid var(--color-border)',
}
const grid2 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
  gap: 'var(--sp-lg)',
})
const spanFull = { gridColumn: '1 / -1' }
</script>

<template>
  <PortalLayout>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 0: Verificación inicial                                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="paso === 0" :style="{ maxWidth: '380px', margin: '0 auto' }">

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

          <CampoTexto
            v-model="emailInicial"
            label="Correo electrónico"
            type="email"
            placeholder="su.correo@ejemplo.com"
            required
            :error="errorEmail"
            @keyup.enter="verificarYContinuar"
          />

          <div :style="{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-start' }">
            <div :style="{ flex: '0 0 90px' }">
              <CampoSelectBuscable
                v-model="tipoDocumentoInicial"
                label="Tipo"
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

          <label :style="{
            display: 'flex', alignItems: 'flex-start',
            gap: 'var(--sp-sm)', cursor: 'pointer',
          }">
            <input
              type="checkbox"
              v-model="aceptaAutorizacion"
              :style="{
                marginTop: '3px', flexShrink: '0', cursor: 'pointer',
                accentColor: 'var(--color-primary)', width: '15px', height: '15px',
              }"
            />
            <span :style="{
              fontSize: 'var(--text-xs)', color: 'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)', lineHeight: '1.7',
            }">
              Autorizo a la Cooperativa Multiactiva Luis Amigó para consultar mis datos
              ante operadores de información y riesgo, junto a los
              <a href="#" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }">Términos y condiciones</a>
              y
              <a href="#" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }">Política de privacidad</a>.
            </span>
          </label>

          <div :style="{
            display: 'flex', justifyContent: 'space-between',
            gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)',
          }">
            <PortalButton variant="secondary" @click="router.push('/')">Volver</PortalButton>
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

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 7: Éxito                                                       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-else-if="paso === 7" :style="{
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
        Su solicitud está en proceso de revisión. Le notificaremos por correo electrónico.
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

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASOS 1–6: Formulario principal                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
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

        <!-- Honeypot anti-bot — NO modificar -->
        <div aria-hidden="true" :style="{
          position: 'absolute', left: '-9999px',
          width: '1px', height: '1px', overflow: 'hidden',
          opacity: '0', pointerEvents: 'none',
        }">
          <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 1: Información General                                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 1">
          <div :style="estiloSeccionTitulo">Información personal</div>

          <AlertaBanner
            v-if="asociadoExistente"
            tipo="info"
            :mensaje="`Registro encontrado: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
            :style="{ marginBottom: 'var(--sp-lg)' }"
          />

          <!-- Encabezado: Oficina + Fecha -->
          <div :style="estiloSubtitulo">Encabezado de la solicitud</div>
          <div :style="grid2(isMobile)">
            <CampoSelect
              v-model="oficina"
              label="Oficina receptora"
              :opciones="opsOficina"
              required
            />
          </div>

          <!-- Identificación -->
          <div :style="estiloSubtitulo">Identificación</div>
          <div :style="grid2(isMobile)">
            <CampoSelect
              v-model="datosPersonales.tipo_identificacion"
              label="Tipo de identificación"
              :opciones="opsTipoDocumento"
              required
              :disabled="!!asociadoExistente"
            />
            <CampoTexto
              v-model="datosPersonales.cedula"
              label="Número de identificación"
              placeholder="Ej. 1122334455"
              required
              solo-numeros
              :disabled="!!asociadoExistente"
              :error="erroresCampos.cedula"
              @blur="() => {
                validarCampoActual(schemaPersonales, 'cedula', datosPersonales.cedula)
                verificarCedula()
              }"
            />
            <CampoTexto
              v-model="datosPersonales.nombres"
              label="Nombres"
              placeholder="SUS NOMBRES"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.nombres"
            />
            <CampoTexto
              v-model="datosPersonales.apellidos"
              label="Apellidos"
              placeholder="SUS APELLIDOS"
              required
              :disabled="!!asociadoExistente"
              :error="erroresCampos.apellidos"
            />
            <CampoTexto
              v-model="datosPersonales.fecha_expedicion"
              label="Fecha de expedición del documento"
              type="date"
            />
            <CampoTexto
              v-model="datosPersonales.lugar_nacimiento"
              label="Lugar de nacimiento"
              placeholder="Ciudad"
            />
            <CampoTexto
              v-model="datosPersonales.nacionalidad"
              label="Nacionalidad"
              placeholder="Colombiana"
            />
            <CampoTexto
              v-model="datosPersonales.fecha_nacimiento"
              label="Fecha de nacimiento"
              type="date"
              required
              :error="erroresCampos.fecha_nacimiento"
            />
          </div>

          <!-- Datos personales adicionales -->
          <div :style="estiloSubtitulo">Datos personales</div>
          <div :style="grid2(isMobile)">
            <CampoSelect
              v-model="datosPersonales.genero"
              label="Género"
              :opciones="opsGenero"
              required
            />
            <CampoSelect
              v-model="datosPersonales.estado_civil"
              label="Estado civil"
              :opciones="opsEstadoCivil"
              required
            />
            <CampoTexto
              v-model="datosPersonales.rh"
              label="RH (Grupo sanguíneo)"
              placeholder="Ej. O+"
            />
            <CampoTexto
              v-model="datosPersonales.titulo"
              label="Título"
              placeholder="Ej. Ingeniero, Licenciado"
            />
            <CampoSelect
              v-model="datosPersonales.nivel_academico"
              label="Nivel académico"
              :opciones="opsNivelAcademico"
            />
            <CampoTexto
              v-model="datosPersonales.personas_a_cargo"
              label="Personas a cargo"
              type="number"
              placeholder="0"
            />
            <CampoTexto
              v-model="datosPersonales.personas_economicamente_activas"
              label="Personas económicamente activas"
              type="number"
              placeholder="0"
            />
          </div>

          <!-- Contacto y residencia -->
          <div :style="estiloSubtitulo">Contacto y residencia</div>
          <div :style="grid2(isMobile)">
            <CampoTexto
              v-model="datosPersonales.telefono"
              label="Teléfono fijo"
              placeholder="Ej. 6044456789"
            />
            <CampoTexto
              v-model="datosPersonales.celular"
              label="Celular"
              placeholder="Ej. 3001234567"
            />
            <CampoTexto
              v-model="datosPersonales.email"
              label="Correo electrónico"
              type="email"
              :disabled="true"
              helper="Correo verificado al inicio"
            />
            <CampoTexto
              v-model="datosPersonales.otro_email"
              label="Otro correo (opcional)"
              type="email"
              placeholder="correo.alternativo@ejemplo.com"
            />
            <div :style="spanFull">
              <CampoTexto
                v-model="datosPersonales.direccion"
                label="Dirección de residencia"
                placeholder="Ej. Calle 45 # 23-18, Apto 301"
              />
            </div>
            <CampoTexto
              v-model="datosPersonales.barrio"
              label="Barrio"
              placeholder="Nombre del barrio"
            />
            <CampoTexto
              v-model="datosPersonales.ciudad"
              label="Ciudad"
              placeholder="Medellín"
            />
            <CampoTexto
              v-model="datosPersonales.estrato"
              label="Estrato"
              type="number"
              placeholder="1 – 6"
            />
            <CampoSelect
              v-model="datosPersonales.tipo_vivienda"
              label="Tipo de vivienda"
              :opciones="opsTipoVivienda"
            />
            <CampoTexto
              v-model="datosPersonales.tiempo_residencia_meses"
              label="Tiempo de residencia (meses)"
              type="number"
              placeholder="Ej. 24"
            />
          </div>

          <!-- PEP -->
          <div :style="{ ...estiloSubtitulo, marginTop: 'var(--sp-2xl)' }">
            Exposición política y pública
          </div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck
              v-model="datosPersonales.administra_recursos_publicos"
              label="Administro o he administrado recursos públicos"
            />
            <CampoCheck
              v-model="datosPersonales.persona_expuesta_publicamente"
              label="Soy una Persona Expuesta Públicamente (PEP)"
            />
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 2: Información Laboral + Actividad Independiente        -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 2">
          <div :style="estiloSeccionTitulo">Información laboral</div>

          <!-- Ocupación -->
          <div :style="estiloSubtitulo">Situación laboral actual</div>
          <div :style="grid2(isMobile)">
            <CampoSelect
              v-model="datosLaborales.ocupacion"
              label="Ocupación"
              :opciones="opsOcupacion"
              required
            />
          </div>

          <!-- Datos del empleador (si no es independiente) -->
          <template v-if="datosLaborales.ocupacion && datosLaborales.ocupacion !== 'Independiente'">
            <div :style="estiloSubtitulo">Datos del empleador</div>
            <div :style="grid2(isMobile)">
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosLaborales.empresa"
                  label="Nombre de la empresa"
                  placeholder="Empresa donde trabaja"
                />
              </div>
              <CampoTexto
                v-model="datosLaborales.cargo"
                label="Cargo u oficio"
                placeholder="Ej. Contador, Docente"
              />
              <CampoSelect
                v-model="datosLaborales.tipo_contrato"
                label="Tipo de contrato"
                :opciones="opsTipoContrato"
              />
              <CampoTexto
                v-model="datosLaborales.fecha_ingreso_empresa"
                label="Fecha de ingreso"
                type="date"
              />
              <CampoMoneda
                v-model="datosLaborales.salario"
                label="Salario básico mensual"
              />
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosLaborales.direccion_empresa"
                  label="Dirección de la empresa"
                  placeholder="Dirección completa"
                />
              </div>
              <CampoTexto
                v-model="datosLaborales.ciudad_empresa"
                label="Ciudad de la empresa"
                placeholder="Medellín"
              />
              <CampoTexto
                v-model="datosLaborales.telefono_empresa"
                label="Teléfono de la empresa"
                placeholder="Ej. 6044456789"
              />
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosLaborales.email_corporativo"
                  label="Correo corporativo"
                  type="email"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>
          </template>

          <!-- Actividad Independiente -->
          <template v-if="esIndependiente">
            <div :style="estiloSubtitulo">Actividad económica independiente</div>
            <div :style="grid2(isMobile)">
              <CampoTexto
                v-model="actividadIndependiente.ciiu_1"
                label="Código CIIU actividad 1"
                placeholder="Ej. 4711"
              />
              <CampoTexto
                v-model="actividadIndependiente.descripcion_actividad_1"
                label="Descripción actividad 1"
                placeholder="Describe la actividad principal"
              />
              <CampoTexto
                v-model="actividadIndependiente.fecha_inicio_actividad_1"
                label="Fecha de inicio actividad 1"
                type="date"
              />
              <CampoTexto
                v-model="actividadIndependiente.nombre_establecimiento"
                label="Nombre del establecimiento"
                placeholder="Nombre comercial"
              />
              <CampoTexto
                v-model="actividadIndependiente.ciiu_2"
                label="Código CIIU actividad 2"
                placeholder="Opcional"
              />
              <CampoTexto
                v-model="actividadIndependiente.descripcion_actividad_2"
                label="Descripción actividad 2"
                placeholder="Describe la actividad secundaria"
              />
              <CampoTexto
                v-model="actividadIndependiente.fecha_inicio_actividad_2"
                label="Fecha de inicio actividad 2"
                type="date"
              />
              <CampoTexto
                v-model="actividadIndependiente.fecha_constitucion"
                label="Fecha de constitución"
                type="date"
              />
              <CampoTexto
                v-model="actividadIndependiente.fecha_vigencia"
                label="Fecha de vigencia"
                type="date"
              />
              <div :style="spanFull">
                <CampoTexto
                  v-model="actividadIndependiente.direccion_negocio"
                  label="Dirección del negocio"
                  placeholder="Dirección completa"
                />
              </div>
              <CampoTexto
                v-model="actividadIndependiente.ciudad_negocio"
                label="Ciudad del negocio"
                placeholder="Medellín"
              />
              <CampoTexto
                v-model="actividadIndependiente.telefono_negocio"
                label="Teléfono del negocio"
                placeholder="Ej. 3001234567"
              />
              <CampoMoneda
                v-model="datosLaborales.salario"
                label="Ingresos mensuales promedio"
              />
            </div>
          </template>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 3: Info Financiera + Activos y Pasivos                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 3">
          <div :style="estiloSeccionTitulo">Información financiera y patrimonio</div>

          <!-- Ingresos y egresos -->
          <div :style="estiloSubtitulo">Ingresos y egresos mensuales</div>
          <div :style="grid2(isMobile)">
            <CampoMoneda
              v-model="datosFinancieros.gastos_familiares"
              label="Gastos familiares"
            />
            <CampoMoneda
              v-model="datosFinancieros.otros_ingresos"
              label="Otros ingresos"
            />
            <CampoMoneda
              v-model="datosFinancieros.cuotas_credito"
              label="Cuotas de crédito vigentes"
            />
            <CampoMoneda
              v-model="datosFinancieros.total_ingresos"
              label="Total ingresos"
            />
            <CampoMoneda
              v-model="datosFinancieros.total_egresos"
              label="Total egresos"
            />
          </div>

          <!-- Activos: Propiedad raíz -->
          <div :style="estiloSubtitulo">Propiedad raíz</div>
          <div :style="grid2(isMobile)">
            <CampoTexto
              v-model="activosPasivos.tipo_propiedad_raiz"
              label="Tipo de propiedad raíz"
              placeholder="Ej. Casa, Apartamento, Lote"
            />
            <CampoTexto
              v-model="activosPasivos.matricula_inmobiliaria"
              label="Matrícula inmobiliaria"
              placeholder="Número de matrícula"
            />
            <CampoMoneda
              v-model="activosPasivos.deuda_cooperativa"
              label="Deuda con la cooperativa"
            />
            <CampoMoneda
              v-model="activosPasivos.cuota_mensual_cooperativa"
              label="Cuota mensual cooperativa"
            />
            <CampoMoneda
              v-model="activosPasivos.valor_comercial_hipoteca"
              label="Valor comercial / hipoteca"
            />
            <CampoMoneda
              v-model="activosPasivos.deuda_otras_entidades"
              label="Deuda con otras entidades"
            />
            <CampoMoneda
              v-model="activosPasivos.cuota_mensual_otras_deudas"
              label="Cuota mensual otras deudas"
            />
          </div>

          <!-- Vehículo -->
          <div :style="estiloSubtitulo">Vehículo</div>
          <div :style="grid2(isMobile)">
            <CampoTexto
              v-model="activosPasivos.marca_vehiculo"
              label="Marca"
              placeholder="Ej. Chevrolet"
            />
            <CampoTexto
              v-model="activosPasivos.modelo_vehiculo"
              label="Modelo / Año"
              placeholder="Ej. Spark 2020"
            />
            <CampoTexto
              v-model="activosPasivos.placa_vehiculo"
              label="Placa"
              placeholder="ABC 123"
            />
            <CampoMoneda
              v-model="activosPasivos.valor_comercial_pignorado"
              label="Valor comercial / pignoraciones"
            />
          </div>

          <!-- Otras deudas -->
          <div :style="estiloSubtitulo">Otras deudas</div>
          <div :style="grid2(isMobile)">
            <CampoMoneda
              v-model="activosPasivos.otras_deudas"
              label="Otras deudas"
            />
            <CampoMoneda
              v-model="activosPasivos.cuota_mensual_otras_deudas_2"
              label="Cuota mensual otras deudas"
            />
            <CampoMoneda
              v-model="activosPasivos.total_pasivos"
              label="Total pasivos"
            />
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 4: Cónyuge / Compañero                                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 4">
          <div :style="estiloSeccionTitulo">Información del cónyuge o compañero/a</div>

          <!-- No aplica -->
          <template v-if="!necesitaConyuge">
            <div :style="{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-xl)',
              padding: 'var(--sp-xl)',
              textAlign: 'center',
              color: 'var(--color-text-2)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--fw-medium)',
            }">
              Esta sección aplica únicamente para personas casadas o en unión libre.
              Según el estado civil ingresado, puede continuar al siguiente paso.
            </div>
          </template>

          <!-- Aplica -->
          <template v-else>
            <div :style="estiloSubtitulo">Identificación</div>
            <div :style="grid2(isMobile)">
              <CampoSelect
                v-model="datosConyuge.tipo_identificacion"
                label="Tipo de identificación"
                :opciones="opsTipoDocumento"
              />
              <CampoTexto
                v-model="datosConyuge.numero_identificacion"
                label="Número de identificación"
                placeholder="Sin puntos ni espacios"
                solo-numeros
              />
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosConyuge.nombre"
                  label="Nombre completo"
                  placeholder="Nombres y apellidos"
                  required
                />
              </div>
              <CampoTexto
                v-model="datosConyuge.fecha_expedicion"
                label="Fecha de expedición"
                type="date"
              />
              <CampoTexto
                v-model="datosConyuge.fecha_nacimiento"
                label="Fecha de nacimiento"
                type="date"
              />
              <CampoTexto
                v-model="datosConyuge.lugar_nacimiento"
                label="Lugar de nacimiento"
                placeholder="Ciudad"
              />
              <CampoTexto
                v-model="datosConyuge.nacionalidad"
                label="Nacionalidad"
                placeholder="Colombiana"
              />
            </div>

            <div :style="estiloSubtitulo">Datos personales</div>
            <div :style="grid2(isMobile)">
              <CampoSelect
                v-model="datosConyuge.genero"
                label="Género"
                :opciones="opsGenero"
              />
              <CampoSelect
                v-model="datosConyuge.estado_civil"
                label="Estado civil"
                :opciones="opsEstadoCivil"
              />
              <CampoSelect
                v-model="datosConyuge.nivel_academico"
                label="Nivel académico"
                :opciones="opsNivelAcademico"
              />
              <CampoSelect
                v-model="datosConyuge.tipo_vivienda"
                label="Tipo de vivienda"
                :opciones="opsTipoVivienda"
              />
            </div>

            <div :style="estiloSubtitulo">Contacto y residencia</div>
            <div :style="grid2(isMobile)">
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosConyuge.direccion"
                  label="Dirección de residencia"
                  placeholder="Dirección completa"
                />
              </div>
              <CampoTexto
                v-model="datosConyuge.barrio"
                label="Barrio"
                placeholder="Nombre del barrio"
              />
              <CampoTexto
                v-model="datosConyuge.ciudad"
                label="Ciudad"
                placeholder="Medellín"
              />
              <CampoTexto
                v-model="datosConyuge.telefono"
                label="Teléfono"
                placeholder="Ej. 6044456789"
              />
              <CampoTexto
                v-model="datosConyuge.celular"
                label="Celular"
                placeholder="Ej. 3001234567"
              />
              <div :style="spanFull">
                <CampoTexto
                  v-model="datosConyuge.email"
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div :style="estiloSubtitulo">Información laboral</div>
            <div :style="grid2(isMobile)">
              <CampoSelect
                v-model="datosConyuge.ocupacion"
                label="Ocupación"
                :opciones="opsOcupacion"
              />
              <CampoTexto
                v-model="datosConyuge.empresa"
                label="Empresa"
                placeholder="Nombre de la empresa"
              />
              <CampoTexto
                v-model="datosConyuge.cargo"
                label="Cargo"
                placeholder="Cargo u oficio"
              />
              <CampoSelect
                v-model="datosConyuge.tipo_contrato"
                label="Tipo de contrato"
                :opciones="opsTipoContrato"
              />
              <CampoTexto
                v-model="datosConyuge.telefono_empresa"
                label="Teléfono empresa"
                placeholder="Ej. 6044456789"
              />
              <CampoMoneda
                v-model="datosConyuge.salario"
                label="Salario"
              />
            </div>
          </template>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 5: Referencias                                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 5">
          <div :style="estiloSeccionTitulo">Referencias</div>

          <!-- Referencia personal -->
          <div :style="estiloSubtitulo">Referencia personal</div>
          <div :style="grid2(isMobile)">
            <div :style="spanFull">
              <CampoTexto
                v-model="referencias.personal.nombre"
                label="Nombres y apellidos"
                placeholder="Nombre completo"
              />
            </div>
            <CampoTexto
              v-model="referencias.personal.contacto"
              label="Relación o cargo"
              placeholder="Ej. Amigo, Colega"
            />
            <CampoTexto
              v-model="referencias.personal.telefono"
              label="Teléfono de contacto"
              placeholder="Ej. 3001234567"
            />
          </div>

          <!-- Referencia familiar -->
          <div :style="estiloSubtitulo">Referencia familiar</div>
          <div :style="grid2(isMobile)">
            <div :style="spanFull">
              <CampoTexto
                v-model="referencias.familiar.nombre"
                label="Nombres y apellidos"
                placeholder="Nombre completo"
              />
            </div>
            <CampoTexto
              v-model="referencias.familiar.parentesco"
              label="Parentesco"
              placeholder="Ej. Hermano, Padre"
            />
            <CampoTexto
              v-model="referencias.familiar.contacto"
              label="Teléfono de contacto"
              placeholder="Ej. 3001234567"
            />
          </div>

          <!-- Referencia comercial -->
          <div :style="estiloSubtitulo">Referencia comercial</div>
          <div :style="grid2(isMobile)">
            <div :style="spanFull">
              <CampoTexto
                v-model="referencias.comercial.nombre_establecimiento"
                label="Nombre del establecimiento"
                placeholder="Nombre comercial"
              />
            </div>
            <CampoTexto
              v-model="referencias.comercial.nombre_contacto"
              label="Nombre del contacto"
              placeholder="Nombre completo"
            />
            <CampoTexto
              v-model="referencias.comercial.producto"
              label="Producto o servicio"
              placeholder="Ej. Cuenta de ahorros, Crédito"
            />
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 6: Declaraciones + Texto legal                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 6">
          <div :style="estiloSeccionTitulo">Declaraciones y autorizaciones</div>

          <!-- ── Texto legal ────────────────────────────────────────── -->
          <div :style="{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            marginBottom: 'var(--sp-xl)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-2)',
            lineHeight: '1.7',
          }">
            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)' }">
              DECLARACIÓN VOLUNTARIA DE ORIGEN DE FONDOS. CONSULTA, REPORTE Y TRATAMIENTO DE DATOS PERSONALES Y CENTRALES DE RIESGOS.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizamos voluntariamente a COOPERAMIGÓ para enviar y/o confirmar operaciones y transacciones
              que realicemos con dicha entidad y/o información sobre obligaciones crediticias y/o información
              de campañas comerciales realizadas por la cooperativa, a través de cualquier medio de comunicación.
              La información puede enviarse al teléfono celular y/o al correo electrónico reportado como de nuestro
              uso o propiedad. El costo de los mensajes enviados será asumido por COOPERAMIGÓ.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              En cumplimiento de las normas legales, declaro a COOPERAMIGÓ bajo la gravedad de juramento que
              los fondos y bienes que poseemos provienen de las actividades lícitas descritas en el presente
              formulario. Así mismo, declaro que no admitiré que terceros efectúen depósitos en mis cuentas con
              fondos de actividades ilícitas y no efectuaré transacciones destinadas a dichas actividades
              contempladas en el Código Penal Colombiano y en el <strong>SARLAFT</strong>.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              De igual manera autorizo a COOPERAMIGÓ para tratar mis datos personales de acuerdo con la política
              de <strong>HABEAS DATA</strong> y para los fines relacionados con su objeto social, publicada en
              la página web <strong>www.cooperamigo.com</strong>.
            </p>
            <p>
              Si se presentan cambios en los datos consignados, me obligo a informarlos oportunamente a COOPERAMIGÓ
              y actualizar al menos una vez al año los datos plasmados en esta solicitud.
            </p>
          </div>

          <!-- ── Sección 9: Declaración de asegurabilidad ──────────── -->
          <div :style="estiloSubtitulo">Declaración de asegurabilidad</div>
          <p :style="{
            fontSize: 'var(--text-sm)', color: 'var(--color-text-2)',
            lineHeight: '1.6', marginBottom: 'var(--sp-lg)',
          }">
            En el evento de solicitud de crédito, el solicitante debe adquirir un seguro para amparar en caso
            de muerte, invalidez, incapacidad total y permanente, el saldo de la deuda otorgada.
          </p>

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }">
            <CampoCheck
              v-model="declaraciones.invalidez_o_incapacidad"
              label="1. ¿Se le ha dictaminado alguna invalidez, incapacidad total y permanente o pérdida de la capacidad laboral?"
            />
            <p :style="{
              fontSize: 'var(--text-sm)', color: 'var(--color-text-2)',
              lineHeight: '1.6',
            }">
              2. ¿Usted presenta o ha presentado alguna vez alguna de las siguientes condiciones de salud?
            </p>
            <CampoCheck v-model="declaraciones.cancer"                      label="Cáncer" />
            <CampoCheck v-model="declaraciones.afecciones_cardiovasculares" label="Afecciones cardiovasculares" />
            <CampoCheck v-model="declaraciones.epoc"                        label="EPOC — Enfermedad Pulmonar Obstructiva Crónica" />
            <CampoCheck v-model="declaraciones.sida"                        label="SIDA" />
            <CampoCheck v-model="declaraciones.insuficiencia_renal"         label="Insuficiencia renal crónica" />
          </div>

          <!-- ── Sección 10: Declaraciones SARLAFT ─────────────────── -->
          <div :style="estiloSubtitulo">Declaraciones adicionales</div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }">
            <CampoCheck
              v-model="declaraciones.maneja_dinero_publico"
              label="1. ¿Manejo o he manejado dineros públicos de la nación, departamento, municipio o algún ente descentralizado?"
            />
            <CampoCheck
              v-model="declaraciones.es_contratista_estado"
              label="2. ¿Soy contratista con el estado, departamento, municipio o algún ente descentralizado?"
            />
            <CampoCheck
              v-model="declaraciones.es_lider_politico"
              label="3. ¿Actualmente soy líder comunitario o miembro de alta jerarquía en algún partido político?"
            />
          </div>

          <!-- ── Autorización tratamiento de datos ──────────────────── -->
          <div :style="{
            background: declaraciones.autoriza_tratamiento_datos
              ? 'var(--color-primary-light)'
              : 'var(--color-bg-surface)',
            border: `1px solid ${declaraciones.autoriza_tratamiento_datos ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            transition: 'all var(--transition-fast)',
          }">
            <CampoCheck
              v-model="declaraciones.autoriza_tratamiento_datos"
              label="Autorizo el tratamiento de mis datos personales de acuerdo con la política de HABEAS DATA de COOPERAMIGÓ. *"
              required
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

        <!-- ── Navegación ─────────────────────────────────────────────── -->
        <div :style="{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          marginTop: 'var(--sp-2xl)',
          gap: 'var(--sp-md)',
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
            @click="paso < 6 ? irAPaso(paso + 1) : enviarSolicitud()"
          >
            {{ paso === 6 ? (loading ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente' }}
          </PortalButton>
        </div>

      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL — Ya es asociado                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition :name="isMobile ? 'sheet-modal' : 'fade-modal'">
        <div
          v-if="mostrarModalYaAsociado"
          :style="{
            position: 'fixed', inset: '0', zIndex: '60',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : 'var(--sp-lg)',
          }"
        >
          <div :style="{
            position: 'absolute', inset: '0',
            background: 'rgba(23,43,54,0.5)',
            backdropFilter: 'blur(3px)',
          }" @click="mostrarModalYaAsociado = false" />

          <div :style="{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : '440px',
            background: 'var(--color-bg-card)',
            borderRadius: isMobile ? 'var(--r-2xl) var(--r-2xl) 0 0' : 'var(--r-2xl)',
            boxShadow: 'var(--shadow-modal)',
            padding: isMobile ? 'var(--sp-md) var(--sp-lg) var(--sp-2xl)' : 'var(--sp-2xl)',
          }">
            <div v-if="isMobile" :style="{
              width: '40px', height: '4px', borderRadius: 'var(--r-pill)',
              background: 'var(--color-border)', margin: '0 auto var(--sp-lg)',
            }" />
            <div :style="{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-lg)',
            }">
              <IconUserCheck :size="30" :style="{ color: 'var(--color-success)' }" />
            </div>
            <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }">
              <div :style="{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
                color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)',
              }">Ya eres asociado</div>
              <div :style="{
                fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
              }">
                El documento
                <strong :style="{ color: 'var(--color-text-1)' }">{{ numeroDocumentoInicial }}</strong>
                ya está registrado como asociado activo de Cooperamigó.
              </div>
            </div>
            <div :style="{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
              gap: 'var(--sp-sm)',
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
