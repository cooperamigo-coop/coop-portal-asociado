<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout           from '@/components/layout/PortalLayout.vue'
import PortalButton           from '@/components/ui/PortalButton.vue'
import SelectorModalidad      from '@/components/forms/SelectorModalidad.vue'
import SelectorTipoTrabajador from '@/components/forms/SelectorTipoTrabajador.vue'
import SeccionPersona         from '@/components/forms/SeccionPersona.vue'
import SeccionFinanciera      from '@/components/forms/SeccionFinanciera.vue'
import SeccionPatrimonio      from '@/components/forms/SeccionPatrimonio.vue'
import CampoTexto             from '@/components/forms/CampoTexto.vue'
import CampoSelect            from '@/components/forms/CampoSelect.vue'
import CampoMoneda            from '@/components/forms/CampoMoneda.vue'
import CampoCheck             from '@/components/forms/CampoCheck.vue'
import CampoFecha             from '@/components/forms/CampoFecha.vue'
import {
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, Send,
  UserX, Mail, Phone, RotateCcw, Users, UserCheck,
} from 'lucide-vue-next'
import { useSolicitudCredito } from '@/composables/useSolicitudCredito'
import { TIPOS_CONTRATO, ENTIDADES_PENSIONES } from '@/data/formularioCredito'

const router = useRouter()

const {
  paso, loading, error, enviado,
  porcentaje, pasosActivos, pasoActual, esUltimoPaso,
  verificacion, verificado, loadingVerificacion, errorVerificacion,
  mostrarModalNoAsociado,
  tieneBorradorPrevio, borradorRecuperado,
  verificarYContinuar, onCorreoCambia,
  general, persona, laboral, financiera, patrimonio, cuenta,
  direccionEstructurada, tieneCodudor,
  personaCod, financieraCod, patrimonioCod,
  autorizaciones, firma,
  mostrarTipoOperacion, mostrarValorCredito,
  mostrarValorReestructura, mostrarValorDesembolso, mostrarCuentaDesembolso,
  salarioBloqueado, montoTotalOperacion,
  siguiente, anterior, irAPaso, enviar, formatMonto,
} = useSolicitudCredito()

const indexPasoActual = computed(() =>
  pasosActivos.value.findIndex(p => p.numero === paso.value) + 1
)

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

const opsNivelEducativo = [
  { value: 'tecnico',         label: 'Técnico'                  },
  { value: 'tecnologico',     label: 'Tecnológico'              },
  { value: 'pregrado',        label: 'Pregrado / Universitario' },
  { value: 'especializacion', label: 'Especialización'          },
  { value: 'maestria',        label: 'Maestría'                 },
  { value: 'doctorado',       label: 'Doctorado'                },
]

const opsEntidadesPensiones = ENTIDADES_PENSIONES.map(e => ({ value: e, label: e }))
const opsTipoContrato = TIPOS_CONTRATO

// ── Helpers de etiquetas para la pantalla de resumen ─────
const LABEL_MODALIDAD = { ordinario: 'Crédito ordinario', educativo: 'Crédito educativo' }
const LABEL_TIPO_OP   = {
  credito_nuevo:           'Crédito nuevo',
  reestructura:            'Reestructura',
  reestructura_desembolso: 'Reestructura con desembolso',
}
const LABEL_TIPO_DOC = {
  cedula_ciudadania:  'Cédula de ciudadanía',
  cedula_extranjeria: 'Cédula de extranjería',
  pasaporte:          'Pasaporte',
  otro:               'Otro',
}
const LABEL_TIPO_TRABAJADOR = {
  empleado:           'Empleado',
  independiente:      'Trabajador independiente',
  pensionado:         'Pensionado',
  estudiante:         'Estudiante',
  cuidado_hogar:      'Cuidado del hogar',
}
const LABEL_TIPO_CUENTA = { ahorros: 'Cuenta de ahorros', corriente: 'Cuenta corriente' }

function label(map, val) { return map[val] || val || '—' }

function actualizarGeneral(campo, valor) {
  general.value = { ...general.value, [campo]: valor }
}

function actualizarLaboral(campo, valor) {
  laboral.value = { ...laboral.value, [campo]: valor }
}

function actualizarCuenta(campo, valor) {
  cuenta.value = { ...cuenta.value, [campo]: valor }
}
</script>

<template>
  <PortalLayout>

    <!-- ═══ PANTALLA DE ÉXITO ═══════════════════════════════ -->
    <div v-if="enviado" :style="{
      background:   'var(--color-bg-card)',
      border:       '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      padding:      '64px var(--sp-2xl)',
      boxShadow:    'var(--shadow-card)',
      textAlign:    'center',
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
        fontSize:   'var(--text-base)',
        color:      'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)',
        lineHeight: '1.7',
        maxWidth:   '480px',
        margin:     '0 auto var(--sp-2xl)',
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
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

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

          <CampoSelect
            v-model="verificacion.tipo_documento"
            label="Tipo de documento"
            required
            :opciones="opsTipoDocVerificacion"
          />

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

          <div v-if="errorVerificacion" :style="{
            background:   'var(--color-error-bg)',
            color:        'var(--color-error-text)',
            padding:      'var(--sp-md) var(--sp-lg)',
            borderRadius: 'var(--r-lg)',
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--fw-medium)',
          }">{{ errorVerificacion }}</div>

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

    <!-- ═══ FORMULARIO ACTIVO (13 pasos) ════════════════════ -->
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
          }">Paso {{ indexPasoActual }} de {{ pasosActivos.length }}</div>
        </div>
        <!-- Barra de progreso -->
        <div :style="{
          height:       '6px',
          background:   'var(--color-border)',
          borderRadius: 'var(--r-pill)',
          overflow:     'hidden',
        }">
          <div :style="{
            height:       '100%',
            width:        porcentaje + '%',
            background:   'var(--color-primary)',
            borderRadius: 'var(--r-pill)',
            transition:   'width 0.4s ease',
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

        <!-- ── PASO 1: Modalidad de crédito ─────────────────── -->
        <SelectorModalidad
          v-if="paso === 1"
          :model-value="general.modalidad_credito"
          @update:model-value="actualizarGeneral('modalidad_credito', $event)"
        />

        <!-- ── PASO 2: Datos de la solicitud ────────────────── -->
        <div v-if="paso === 2" :style="{
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
        }">
          <!-- Tipo de operación — solo para crédito ordinario -->
          <CampoSelect
            v-if="mostrarTipoOperacion"
            :model-value="general.tipo_operacion"
            label="Tipo de operación"
            required
            :opciones="opsTipoOperacion"
            @update:model-value="actualizarGeneral('tipo_operacion', $event)"
          />

          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }">
            <!-- Valor del crédito (nuevo o educativo) -->
            <CampoMoneda
              v-if="mostrarValorCredito"
              :model-value="general.valor_credito"
              label="Valor del crédito"
              required
              helper="Monto total solicitado"
              @update:model-value="actualizarGeneral('valor_credito', $event)"
            />

            <!-- Valor de reestructura -->
            <CampoMoneda
              v-if="mostrarValorReestructura"
              :model-value="general.valor_reestructura"
              label="Valor de la reestructura"
              required
              @update:model-value="actualizarGeneral('valor_reestructura', $event)"
            />

            <!-- Valor de desembolso adicional (reestructura + desembolso) -->
            <CampoMoneda
              v-if="mostrarValorDesembolso"
              :model-value="general.valor_desembolso"
              label="Valor del desembolso adicional"
              required
              @update:model-value="actualizarGeneral('valor_desembolso', $event)"
            />
          </div>

          <!-- Monto total (reestructura con desembolso) -->
          <div
            v-if="montoTotalOperacion"
            :style="{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-md)',
              padding:      'var(--sp-md) var(--sp-lg)',
              borderRadius: 'var(--r-lg)',
              background:   'var(--color-primary-light)',
              border:       '1px solid var(--color-border)',
            }"
          >
            <span :style="{
              fontSize:   'var(--text-sm)',
              color:      'var(--color-primary)',
              fontWeight: 'var(--fw-semibold)',
            }">Monto total de la operación:</span>
            <span :style="{
              fontSize:   'var(--text-base)',
              color:      'var(--color-primary)',
              fontWeight: 'var(--fw-extrabold)',
            }">{{ formatMonto(montoTotalOperacion) }}</span>
          </div>

          <!-- Destino y plazo -->
          <CampoTexto
            :model-value="general.destino_credito"
            label="Destino del crédito"
            placeholder="¿Para qué usará el crédito?"
            required
            @update:model-value="actualizarGeneral('destino_credito', $event)"
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
                :value="general.plazo_solicitado"
                type="number"
                min="1"
                max="120"
                placeholder="Ej: 24"
                :style="{
                  padding:      '9px 14px',
                  border:       '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)',
                  fontSize:     'var(--text-base)',
                  fontFamily:   'var(--font-body)',
                  background:   'var(--color-bg-surface)',
                  color:        'var(--color-text-1)',
                  outline:      'none',
                  width:        '120px',
                }"
                @input="actualizarGeneral('plazo_solicitado', $event.target.value)"
              />
              <span :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
              }">meses</span>
            </div>
          </div>
        </div>

        <!-- ── PASO 3: Datos personales solicitante ──────────── -->
        <SeccionPersona
          v-if="paso === 3"
          :model-value="persona"
          titulo="Información del solicitante"
          :bloquear-documento="true"
          :bloquear-correo="true"
          :direccion-estructurada="direccionEstructurada"
          @update:model-value="persona = $event"
          @update:direccion-estructurada="direccionEstructurada = $event"
        />

        <!-- ── PASO 4: Información laboral solicitante ───────── -->
        <div v-if="paso === 4" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <SelectorTipoTrabajador
            :model-value="laboral.tipo_trabajador"
            @update:model-value="actualizarLaboral('tipo_trabajador', $event)"
          />

          <!-- Campos dinámicos por tipo de trabajador -->
          <div
            v-if="laboral.tipo_trabajador"
            :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <!-- Empleado -->
            <template v-if="laboral.tipo_trabajador === 'empleado'">
              <CampoTexto
                :model-value="laboral.nombre_empresa"
                label="Nombre de la empresa"
                placeholder="Empresa donde trabaja"
                required
                @update:model-value="actualizarLaboral('nombre_empresa', $event)"
              />
              <CampoTexto
                :model-value="laboral.cargo_oficio"
                label="Cargo u oficio"
                placeholder="Ej: Contador, Docente"
                required
                @update:model-value="actualizarLaboral('cargo_oficio', $event)"
              />
              <CampoSelect
                :model-value="laboral.tipo_contrato"
                label="Tipo de contrato"
                required
                :opciones="opsTipoContrato"
                @update:model-value="actualizarLaboral('tipo_contrato', $event)"
              />
              <CampoTexto
                v-if="laboral.tipo_contrato === 'otro'"
                :model-value="laboral.tipo_contrato_otro"
                label="Especifique el tipo de contrato"
                placeholder="Describa el contrato"
                @update:model-value="actualizarLaboral('tipo_contrato_otro', $event)"
              />
              <CampoFecha
                :model-value="laboral.fecha_ingreso"
                label="Fecha de ingreso"
                required
                @update:model-value="actualizarLaboral('fecha_ingreso', $event)"
              />
            </template>

            <!-- Independiente -->
            <template v-if="laboral.tipo_trabajador === 'independiente'">
              <CampoTexto
                :model-value="laboral.actividad_comercial"
                label="Actividad comercial"
                placeholder="Ej: Comercio, Consultoría"
                required
                @update:model-value="actualizarLaboral('actividad_comercial', $event)"
              />
              <CampoTexto
                :model-value="laboral.ocupacion"
                label="Ocupación"
                placeholder="Ej: Diseñador freelance"
                required
                @update:model-value="actualizarLaboral('ocupacion', $event)"
              />
              <CampoFecha
                :model-value="laboral.fecha_inicio_actividad"
                label="Fecha de inicio de la actividad"
                required
                @update:model-value="actualizarLaboral('fecha_inicio_actividad', $event)"
              />
            </template>

            <!-- Pensionado -->
            <template v-if="laboral.tipo_trabajador === 'pensionado'">
              <CampoSelect
                :model-value="laboral.entidad_pagadora"
                label="Entidad pagadora"
                required
                :opciones="opsEntidadesPensiones"
                @update:model-value="actualizarLaboral('entidad_pagadora', $event)"
              />
            </template>

            <!-- Estudiante -->
            <template v-if="laboral.tipo_trabajador === 'estudiante'">
              <CampoTexto
                :model-value="laboral.institucion_educativa"
                label="Institución educativa"
                placeholder="Nombre de la institución"
                required
                @update:model-value="actualizarLaboral('institucion_educativa', $event)"
              />
              <CampoSelect
                :model-value="laboral.nivel_educativo"
                label="Nivel educativo"
                required
                :opciones="opsNivelEducativo"
                @update:model-value="actualizarLaboral('nivel_educativo', $event)"
              />
            </template>

            <!-- Cuidado del hogar -->
            <template v-if="laboral.tipo_trabajador === 'cuidado_hogar'">
              <CampoTexto
                :model-value="laboral.descripcion_ocupacion"
                label="Descripción de la ocupación"
                placeholder="Describa brevemente su actividad"
                required
                :style="{ gridColumn: '1 / -1' }"
                @update:model-value="actualizarLaboral('descripcion_ocupacion', $event)"
              />
            </template>
          </div>

          <!-- Dependientes — todos los tipos -->
          <div v-if="laboral.tipo_trabajador" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck
              :model-value="laboral.tiene_dependientes"
              label="Tengo personas a cargo (hijos, padres, etc.)"
              @update:model-value="actualizarLaboral('tiene_dependientes', $event)"
            />
            <CampoTexto
              v-if="laboral.tiene_dependientes"
              :model-value="laboral.numero_dependientes"
              label="Número de dependientes"
              placeholder="Ej: 2"
              type="number"
              :style="{ maxWidth: '200px' }"
              @update:model-value="actualizarLaboral('numero_dependientes', $event)"
            />
          </div>
        </div>

        <!-- ── PASO 5: Información financiera ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 5"
          :model-value="financiera"
          titulo="Información financiera"
          :salario-bloqueado="salarioBloqueado"
          @update:model-value="financiera = $event"
        />

        <!-- ── PASO 6: Patrimonio solicitante ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 6"
          :model-value="patrimonio"
          titulo="Patrimonio"
          tooltip-activos="Suma de todos sus bienes: inmuebles, vehículos, cuentas bancarias, inversiones y otros activos."
          tooltip-pasivos="Suma de todas sus deudas: créditos, tarjetas, hipotecas y demás obligaciones financieras."
          @update:model-value="patrimonio = $event"
        />

        <!-- ── PASO 7: Cuenta de desembolso (condicional) ─────── -->
        <div v-if="paso === 7" :style="{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)',
        }">
          <CampoSelect
            :model-value="cuenta.tipo_cuenta"
            label="Tipo de cuenta"
            required
            :opciones="opsTipoCuenta"
            @update:model-value="actualizarCuenta('tipo_cuenta', $event)"
          />
          <CampoTexto
            :model-value="cuenta.entidad_bancaria"
            label="Entidad bancaria"
            placeholder="Ej: Bancolombia, Davivienda"
            required
            @update:model-value="actualizarCuenta('entidad_bancaria', $event)"
          />
          <CampoTexto
            :model-value="cuenta.numero_cuenta"
            label="Número de cuenta"
            placeholder="Sin guiones ni espacios"
            required
            :style="{ gridColumn: '1 / -1' }"
            @update:model-value="actualizarCuenta('numero_cuenta', $event)"
          />
        </div>

        <!-- ── PASO 8: ¿Tiene codeudor? + Persona codeudor ─────── -->
        <div v-if="paso === 8" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <!-- Pregunta Sí / No -->
          <div>
            <div :style="{
              fontFamily:   'var(--font-display)',
              fontSize:     'var(--text-lg)',
              fontWeight:   'var(--fw-extrabold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-lg)',
            }">¿Desea agregar un codeudor a su solicitud?</div>

            <div :style="{ display: 'flex', gap: 'var(--sp-md)' }">
              <!-- Sí -->
              <div
                :style="{
                  flex:         '1',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--sp-md)',
                  padding:      'var(--sp-lg)',
                  borderRadius: 'var(--r-xl)',
                  border:       tieneCodudor === true
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  background:   tieneCodudor === true
                    ? 'var(--color-primary-light)'
                    : 'var(--color-bg-surface)',
                  cursor:       'pointer',
                  transition:   'all var(--transition-fast)',
                }"
                @click="tieneCodudor = true"
              >
                <UserCheck :size="22" :style="{
                  color: tieneCodudor === true ? 'var(--color-primary)' : 'var(--color-text-3)',
                }" />
                <div>
                  <div :style="{
                    fontWeight: 'var(--fw-bold)',
                    color:      tieneCodudor === true ? 'var(--color-primary)' : 'var(--color-text-1)',
                    fontSize:   'var(--text-base)',
                  }">Sí, agregar codeudor</div>
                  <div :style="{
                    fontSize:   'var(--text-sm)',
                    color:      'var(--color-text-3)',
                    fontWeight: 'var(--fw-medium)',
                  }">Puede mejorar las condiciones del crédito</div>
                </div>
              </div>

              <!-- No -->
              <div
                :style="{
                  flex:         '1',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--sp-md)',
                  padding:      'var(--sp-lg)',
                  borderRadius: 'var(--r-xl)',
                  border:       tieneCodudor === false
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  background:   tieneCodudor === false
                    ? 'var(--color-primary-light)'
                    : 'var(--color-bg-surface)',
                  cursor:       'pointer',
                  transition:   'all var(--transition-fast)',
                }"
                @click="tieneCodudor = false"
              >
                <Users :size="22" :style="{
                  color: tieneCodudor === false ? 'var(--color-primary)' : 'var(--color-text-3)',
                }" />
                <div>
                  <div :style="{
                    fontWeight: 'var(--fw-bold)',
                    color:      tieneCodudor === false ? 'var(--color-primary)' : 'var(--color-text-1)',
                    fontSize:   'var(--text-base)',
                  }">No, continuar solo</div>
                  <div :style="{
                    fontSize:   'var(--text-sm)',
                    color:      'var(--color-text-3)',
                    fontWeight: 'var(--fw-medium)',
                  }">Sin codeudor en la solicitud</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Información del codeudor — solo si respondió Sí -->
          <SeccionPersona
            v-if="tieneCodudor === true"
            :model-value="personaCod"
            titulo="Datos del codeudor"
            @update:model-value="personaCod = $event"
          />
        </div>

        <!-- ── PASO 9: Laboral codeudor ──────────────────────── -->
        <div v-if="paso === 9" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorTipoTrabajador
            :model-value="laboral.tipo_trabajador"
            @update:model-value="actualizarLaboral('tipo_trabajador', $event)"
          />

          <div
            v-if="laboral.tipo_trabajador"
            :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <template v-if="laboral.tipo_trabajador === 'empleado'">
              <CampoTexto
                :model-value="laboral.nombre_empresa"
                label="Nombre de la empresa"
                placeholder="Empresa donde trabaja"
                required
                @update:model-value="actualizarLaboral('nombre_empresa', $event)"
              />
              <CampoTexto
                :model-value="laboral.cargo_oficio"
                label="Cargo u oficio"
                placeholder="Ej: Contador, Docente"
                required
                @update:model-value="actualizarLaboral('cargo_oficio', $event)"
              />
              <CampoSelect
                :model-value="laboral.tipo_contrato"
                label="Tipo de contrato"
                required
                :opciones="opsTipoContrato"
                @update:model-value="actualizarLaboral('tipo_contrato', $event)"
              />
              <CampoFecha
                :model-value="laboral.fecha_ingreso"
                label="Fecha de ingreso"
                required
                @update:model-value="actualizarLaboral('fecha_ingreso', $event)"
              />
            </template>
            <template v-if="laboral.tipo_trabajador === 'independiente'">
              <CampoTexto
                :model-value="laboral.actividad_comercial"
                label="Actividad comercial"
                placeholder="Ej: Comercio, Consultoría"
                required
                @update:model-value="actualizarLaboral('actividad_comercial', $event)"
              />
              <CampoTexto
                :model-value="laboral.ocupacion"
                label="Ocupación"
                placeholder="Ej: Diseñador freelance"
                required
                @update:model-value="actualizarLaboral('ocupacion', $event)"
              />
            </template>
            <template v-if="laboral.tipo_trabajador === 'pensionado'">
              <CampoSelect
                :model-value="laboral.entidad_pagadora"
                label="Entidad pagadora"
                required
                :opciones="opsEntidadesPensiones"
                @update:model-value="actualizarLaboral('entidad_pagadora', $event)"
              />
            </template>
            <template v-if="laboral.tipo_trabajador === 'estudiante'">
              <CampoTexto
                :model-value="laboral.institucion_educativa"
                label="Institución educativa"
                placeholder="Nombre de la institución"
                required
                @update:model-value="actualizarLaboral('institucion_educativa', $event)"
              />
              <CampoSelect
                :model-value="laboral.nivel_educativo"
                label="Nivel educativo"
                required
                :opciones="opsNivelEducativo"
                @update:model-value="actualizarLaboral('nivel_educativo', $event)"
              />
            </template>
            <template v-if="laboral.tipo_trabajador === 'cuidado_hogar'">
              <CampoTexto
                :model-value="laboral.descripcion_ocupacion"
                label="Descripción de la ocupación"
                placeholder="Describa brevemente su actividad"
                required
                :style="{ gridColumn: '1 / -1' }"
                @update:model-value="actualizarLaboral('descripcion_ocupacion', $event)"
              />
            </template>
          </div>
        </div>

        <!-- ── PASO 10: Financiera codeudor ──────────────────── -->
        <SeccionFinanciera
          v-if="paso === 10"
          :model-value="financieraCod"
          titulo="Información financiera del codeudor"
          @update:model-value="financieraCod = $event"
        />

        <!-- ── PASO 11: Patrimonio codeudor ──────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 11"
          :model-value="patrimonioCod"
          titulo="Patrimonio del codeudor"
          tooltip-activos="Suma de todos los bienes del codeudor."
          tooltip-pasivos="Suma de todas las deudas del codeudor."
          @update:model-value="patrimonioCod = $event"
        />

        <!-- ── PASO 12: Autorizaciones ────────────────────────── -->
        <div v-if="paso === 12" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">

          <div :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-lg)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
            marginBottom: 'var(--sp-sm)',
          }">Autorizaciones y declaraciones</div>

          <div :style="{
            padding:      'var(--sp-lg)',
            borderRadius: 'var(--r-xl)',
            background:   'var(--color-bg-surface)',
            border:       '1px solid var(--color-border)',
            display:      'flex',
            flexDirection:'column',
            gap:          'var(--sp-lg)',
          }">
            <CampoCheck
              :model-value="autorizaciones.autorizacion_reporte_centrales"
              label="Autorizo a Cooperamigó a consultar y reportar mi información en centrales de riesgo (Datacrédito, TransUnión). *"
              @update:model-value="autorizaciones.autorizacion_reporte_centrales = $event"
            />
            <CampoCheck
              :model-value="autorizaciones.autorizacion_consulta_informacion"
              label="Autorizo la consulta de mi información financiera y crediticia para el estudio de esta solicitud."
              @update:model-value="autorizaciones.autorizacion_consulta_informacion = $event"
            />
            <CampoCheck
              :model-value="autorizaciones.autorizacion_tratamiento_datos"
              label="Autorizo el tratamiento de mis datos personales conforme a la política de privacidad de Cooperamigó. *"
              @update:model-value="autorizaciones.autorizacion_tratamiento_datos = $event"
            />
            <CampoCheck
              :model-value="autorizaciones.autorizacion_datos_sensibles"
              label="Autorizo el tratamiento de mis datos sensibles en los términos establecidos por la ley colombiana."
              @update:model-value="autorizaciones.autorizacion_datos_sensibles = $event"
            />
            <CampoCheck
              :model-value="autorizaciones.declaracion_veracidad_informacion"
              label="Declaro que toda la información suministrada en esta solicitud es veraz y comprobable. *"
              @update:model-value="autorizaciones.declaracion_veracidad_informacion = $event"
            />
          </div>

          <div :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-text-3)',
            fontWeight: 'var(--fw-medium)',
            lineHeight: '1.6',
          }">Los campos marcados con * son obligatorios para continuar.</div>
        </div>

        <!-- ── PASO 13: Confirmación y firma ─────────────────── -->
        <div v-if="paso === 13" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

          <!-- Título -->
          <div :style="{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-lg)',
            fontWeight:   'var(--fw-extrabold)',
            color:        'var(--color-text-1)',
          }">Revise su solicitud antes de firmar</div>

          <!-- ── Tarjeta resumen reutilizable ─────────────────── -->
          <!-- Solicitud -->
          <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Solicitud</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Modalidad</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_MODALIDAD, general.modalidad_credito) }}</div>
                </div>
                <div v-if="mostrarTipoOperacion" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de operación</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_OP, general.tipo_operacion) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: mostrarTipoOperacion ? '' : '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Monto solicitado</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--fw-extrabold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(general.valor_credito || general.valor_reestructura) || '—' }}</div>
                </div>
                <div v-if="mostrarValorDesembolso" :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Valor desembolso</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--fw-extrabold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(general.valor_desembolso) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Plazo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ general.plazo_solicitado ? general.plazo_solicitado + ' meses' : '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Destino</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ general.destino_credito || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos personales -->
          <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-dark)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Datos personales</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre completo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [persona.nombres, persona.apellidos].filter(Boolean).join(' ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, persona.tipo_documento) }} {{ persona.numero_identificacion }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo electrónico</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ persona.correo_electronico || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Fecha de nacimiento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ persona.fecha_nacimiento || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ciudad / Dpto.</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [persona.ciudad, persona.departamento].filter(Boolean).join(', ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Dirección</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ persona.direccion_residencia || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo de trabajador</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_TRABAJADOR, laboral.tipo_trabajador) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tiene dependientes</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ laboral.tiene_dependientes ? (laboral.numero_dependientes ? laboral.numero_dependientes + ' dependiente(s)' : 'Sí') : 'No' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Situación financiera -->
          <div :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-impulso)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Situación financiera y patrimonio</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Salario / Ingresos fijos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.salario_ingresos_fijos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Otros ingresos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.ingresos_independiente || financiera.otros_ingresos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Gastos familiares</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.gastos_familiares) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Obligaciones financieras</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financiera.obligaciones_financieras) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Total activos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(patrimonio.total_activos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Total pasivos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(patrimonio.total_pasivos) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Propiedad raíz</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ patrimonio.tiene_propiedad_raiz ? (formatMonto(patrimonio.valor_propiedad_raiz) || 'Sí') : 'No' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Vehículo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ patrimonio.tiene_vehiculo ? (formatMonto(patrimonio.valor_vehiculo) || 'Sí') : 'No' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuenta de desembolso (condicional) -->
          <div v-if="mostrarCuentaDesembolso" :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-dark)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Cuenta de desembolso</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Tipo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_CUENTA, cuenta.tipo_cuenta) }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Entidad bancaria</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.entidad_bancaria || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Número de cuenta</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ cuenta.numero_cuenta || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Codeudor (condicional) -->
          <div v-if="tieneCodudor" :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Codeudor</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [personaCod.nombres_codeudor, personaCod.apellidos_codeudor].filter(Boolean).join(' ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, personaCod.tipo_documento_codeudor) }} {{ personaCod.numero_identificacion_codeudor }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ingresos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financieraCod.salario_codeudor || financieraCod.ingresos_independiente_codeudor) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ personaCod.correo_codeudor || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Firma digital ─────────────────────────────────── -->
          <div :style="{
            borderRadius: 'var(--r-xl)',
            border:       '2px solid var(--color-accent)',
            overflow:     'hidden',
          }">
            <div :style="{
              padding:    'var(--sp-sm) var(--sp-lg)',
              background: 'var(--color-accent)',
              display:    'flex',
              alignItems: 'center',
              gap:        'var(--sp-xs)',
            }">
              <ShieldCheck :size="16" style="color: var(--color-dark);" />
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-dark)', textTransform: 'uppercase', letterSpacing: '0.07em' }">Firma digital</span>
            </div>
            <div :style="{
              padding:        'var(--sp-lg)',
              background:     'var(--color-bg-surface)',
              display:        'flex',
              flexDirection:  'column',
              gap:            'var(--sp-md)',
            }">
              <div :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-text-2)',
                lineHeight: '1.6',
              }">
                Al escribir su nombre completo confirma que ha revisado toda la información, que es veraz y que autoriza a
                <strong :style="{ color: 'var(--color-primary)' }">Cooperamigó</strong> a procesarla para el estudio de su solicitud.
              </div>
              <CampoTexto
                label="Nombre completo (firma)"
                placeholder="Escriba su nombre y apellidos tal como aparecen en su documento"
                :model-value="firma.nombre_firma"
                @update:model-value="firma.nombre_firma = $event"
              />
              <div :style="{
                fontSize:     'var(--text-xs)',
                color:        'var(--color-text-3)',
                fontWeight:   'var(--fw-medium)',
                lineHeight:   '1.6',
                paddingTop:   'var(--sp-xs)',
                borderTop:    '1px solid var(--color-border)',
              }">
                Un asesor de Cooperamigó se comunicará con usted en los próximos días hábiles para continuar con el proceso.
              </div>
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
        justifyContent: paso === pasosActivos[0]?.numero ? 'flex-end' : 'space-between',
        alignItems:     'center',
        gap:            'var(--sp-md)',
      }">
        <PortalButton
          v-if="paso !== pasosActivos[0]?.numero"
          variant="secondary"
          @click="anterior()"
        >
          <ArrowLeft :size="15" /> Anterior
        </PortalButton>
        <PortalButton
          v-if="!esUltimoPaso"
          variant="primary"
          :loading="loading"
          @click="siguiente()"
        >
          Continuar <ArrowRight :size="15" />
        </PortalButton>
        <PortalButton
          v-if="esUltimoPaso"
          variant="accent"
          :loading="loading"
          @click="enviar()"
        >
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
          v-for="p in pasosActivos"
          :key="p.numero"
          :style="{
            width:        paso === p.numero ? '24px' : '8px',
            height:       '8px',
            borderRadius: 'var(--r-pill)',
            background:   paso === p.numero
              ? 'var(--color-primary)'
              : paso > p.numero
                ? 'var(--color-success)'
                : 'var(--color-border)',
            transition:   'all var(--transition-base)',
            cursor:       paso > p.numero ? 'pointer' : 'default',
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

            <div :style="{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--color-warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--sp-xl)',
            }">
              <UserX :size="34" :style="{ color: 'var(--color-warning-text)' }" />
            </div>

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

            <div :style="{
              height:     '1px',
              background: 'var(--color-border)',
              margin:     'var(--sp-xl) 0',
            }" />

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

              <!-- WhatsApp -->
              <!-- TODO: Reemplazar con número real -->
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
                  background: 'var(--color-success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: '0',
                }">
                  <Mail :size="20" :style="{ color: 'var(--color-text-on-primary)' }" />
                </div>
                <div>
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">WhatsApp</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Atención inmediata</div>
                </div>
              </a>

              <!-- Correo -->
              <!-- TODO: Reemplazar con correo real -->
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
              <!-- TODO: Reemplazar con número real -->
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
              <PortalButton variant="primary" @click="router.push('/solicitar-afiliacion')">
                Solicitar afiliación
              </PortalButton>
            </div>

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
.fade-modal-leave-active { transition: opacity 0.15s ease; }
.fade-modal-enter-from,
.fade-modal-leave-to     { opacity: 0; }
</style>
