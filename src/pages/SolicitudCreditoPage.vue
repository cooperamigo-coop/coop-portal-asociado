<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout           from '@/components/layout/PortalLayout.vue'
import PortalButton           from '@/components/ui/PortalButton.vue'
import SelectorModalidad      from '@/components/forms/SelectorModalidad.vue'
import SelectorTipoTrabajador from '@/components/forms/SelectorTipoTrabajador.vue'
import SeccionPersona         from '@/components/forms/SeccionPersona.vue'
import SeccionFinanciera      from '@/components/forms/SeccionFinanciera.vue'
import SeccionPatrimonio      from '@/components/forms/SeccionPatrimonio.vue'
import CampoTexto             from '@/components/forms/CampoTexto.vue'
import CampoSelectBuscable    from '@/components/forms/CampoSelectBuscable.vue'
import CampoMoneda            from '@/components/forms/CampoMoneda.vue'
import CampoCheck             from '@/components/forms/CampoCheck.vue'
import CampoFecha             from '@/components/forms/CampoFecha.vue'
import ModalDireccion         from '@/components/forms/ModalDireccion.vue'
import SelectorDeptoMunicipio from '@/components/forms/SelectorDeptoMunicipio.vue'
import ModalAutorizaciones    from '@/components/forms/ModalAutorizaciones.vue'
import {
  CheckCircle,
  UserX, Mail, Phone, RotateCcw, Users, UserCheck, ScrollText,
} from 'lucide-vue-next'
import { useSolicitudCredito } from '@/composables/useSolicitudCredito'
import { useBreakpoint } from '@/composables/useBreakpoint'

const { isMobile } = useBreakpoint()
import { TIPOS_CONTRATO, ENTIDADES_PENSIONES } from '@/data/formularioCredito'
import { ENTIDADES_BANCARIAS } from '@/data/colombiaData.js'

const router = useRouter()

const {
  paso, loading, error, enviado,
  porcentaje, pasosActivos, pasoActual, esUltimoPaso,
  verificacion, verificado, loadingVerificacion, errorVerificacion,
  mostrarModalNoAsociado,
  tieneBorradorPrevio, borradorRecuperado,
  verificarYContinuar, onCorreoCambia,
  general, persona, laboral, financiera, patrimonio, cuenta,
  direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
  numCodudores,
  personaCod1, laboralCod1, financieraCod1, patrimonioCod1,
  personaCod2, laboralCod2, financieraCod2, patrimonioCod2,
  ubicacionResidencia, ubicacionExpedicion,
  ubicacionExpedicionCod1, ubicacionExpedicionCod2,
  ubicacionCod1, ubicacionCod2,
  autorizaciones, firma,
  mostrarTipoOperacion, mostrarValorCredito,
  mostrarValorReestructura, mostrarValorDesembolso, mostrarCuentaDesembolso,
  salarioBloqueado, montoTotalOperacion,
  siguiente, anterior, irAPaso, enviar, formatMonto,
} = useSolicitudCredito()

const modalAutorizacionesVisible = ref(false)
const aceptaCondiciones = ref(false)
const errorCorreo = ref(null)

function validarCorreo(valor) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  errorCorreo.value = valor && !re.test(valor) ? 'Ingrese un correo electrónico válido' : null
}

function onCorreoCambiaConValidacion(valor) {
  onCorreoCambia(valor)
  errorCorreo.value = null
}

function onCorreoBlur() {
  validarCorreo(verificacion.value.correo)
}

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
  { value: 'cedula_ciudadania',  label: 'C.C.' },
  { value: 'cedula_extranjeria', label: 'C.E.' },
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

const esEducativo = computed(() => general.value.modalidad_credito === 'educativo')
const maxPlazo    = computed(() => esEducativo.value ? 6 : 120)

// Clamp plazo si ya tenía un valor mayor cuando se cambia a educativo
watch(esEducativo, (educativo) => {
  if (educativo && Number(general.value.plazo_solicitado) > 6) {
    general.value = { ...general.value, plazo_solicitado: '6' }
  }
})

function actualizarPlazo(valor) {
  const num = Number(valor)
  if (valor !== '' && num > maxPlazo.value) {
    actualizarGeneral('plazo_solicitado', String(maxPlazo.value))
  } else {
    actualizarGeneral('plazo_solicitado', valor)
  }
}

function actualizarLaboral(campo, valor) {
  laboral.value = { ...laboral.value, [campo]: valor }
}

function actualizarCuenta(campo, valor) {
  cuenta.value = { ...cuenta.value, [campo]: valor }
}

function actualizarLaboralCod1(campo, valor) {
  laboralCod1.value = { ...laboralCod1.value, [campo]: valor }
}
function actualizarLaboralCod2(campo, valor) {
  laboralCod2.value = { ...laboralCod2.value, [campo]: valor }
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

      <!-- Aviso codeudores -->
      <div v-if="numCodudores > 0" :style="{
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--sp-xl)',
        marginTop: 'var(--sp-lg)',
        textAlign: 'left',
      }">
        <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', marginBottom: 'var(--sp-sm)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
          <Mail :size="16" /> Enlace de firma enviado al codeudor
        </div>
        <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', fontWeight: 'var(--fw-medium)', lineHeight: '1.6' }">
          Se enviará un enlace al correo del codeudor para que firme la solicitud.
          El proceso continúa una vez todos los codeudores hayan firmado.
        </div>
      </div>
    </div>

    <!-- ═══ PANTALLA PREVIA — Verificación de identidad ═════ -->
    <div v-else-if="!verificado">

      <div :style="{ maxWidth: '380px', margin: '0 auto' }">

        <!-- Título -->
        <div :style="{ marginBottom: 'var(--sp-2xl)' }">
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontSize:   'var(--text-xl)',
            fontWeight: 'var(--fw-extrabold)',
            color:      'var(--color-text-1)',
          }">Comencemos con algunos datos</div>
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
              :error="errorCorreo"
              @update:model-value="onCorreoCambiaConValidacion($event)"
              @blur="onCorreoBlur"
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

          <div :style="{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-start' }">
            <div :style="{ flex: '0 0 90px' }">
              <CampoSelectBuscable
                v-model="verificacion.tipo_documento"
                label="Tipo de doc."
                required
                :opciones="opsTipoDocVerificacion"
              />
            </div>
            <div :style="{ flex: '1' }">
              <CampoTexto
                v-model="verificacion.numero_documento"
                label="Número de documento"
                placeholder="Sin puntos ni espacios"
                required
                solo-numeros
              />
            </div>
          </div>

          <div v-if="errorVerificacion" :style="{
            background:   'var(--color-error-bg)',
            color:        'var(--color-error-text)',
            padding:      'var(--sp-md) var(--sp-lg)',
            borderRadius: 'var(--r-lg)',
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--fw-medium)',
          }">{{ errorVerificacion }}</div>

          <!-- Checkbox de aceptación -->
          <label :style="{
            display:    'flex',
            alignItems: 'flex-start',
            gap:        'var(--sp-sm)',
            cursor:     'pointer',
          }">
            <input
              v-model="aceptaCondiciones"
              type="checkbox"
              :style="{ marginTop: '3px', flexShrink: '0', accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }"
            />
            <span :style="{
              fontSize:   'var(--text-sm)',
              color:      'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)',
              lineHeight: '1.5',
            }">
              Autorizo a la Cooperativa Multiactiva Luis Amigó para que el número de celular y el correo electrónico sean tratados para contactarme y enviarme la información relacionada con la solicitud del producto; igualmente para que me consulten ante operadores de información y riesgo con el fin de verificar mi información personal, junto a los
              <span :style="{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }">Términos y condiciones</span>
              y
              <span :style="{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }">Política de privacidad</span>.
            </span>
          </label>

          <PortalButton
            variant="primary"
            :loading="loadingVerificacion"
            :disabled="!aceptaCondiciones || !!errorCorreo"
            :full="true"
            @click="verificarYContinuar()"
          >
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
        padding:      isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)',
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
          <CampoSelectBuscable
            v-if="mostrarTipoOperacion"
            :model-value="general.tipo_operacion"
            label="Tipo de operación"
            required
            :opciones="opsTipoOperacion"
            @update:model-value="actualizarGeneral('tipo_operacion', $event)"
          />

          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }">
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
                :max="maxPlazo"
                :placeholder="esEducativo ? '1 a 6' : 'Ej: 24'"
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
                @input="actualizarPlazo($event.target.value)"
              />
              <span :style="{
                fontSize:   'var(--text-base)',
                color:      'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)',
              }">meses</span>
            </div>
            <div
              v-if="esEducativo"
              :style="{
                fontSize:   'var(--text-xs)',
                color:      'var(--color-text-3)',
                marginTop:  'var(--sp-xs)',
                fontWeight: 'var(--fw-medium)',
              }"
            >Crédito educativo: máximo 6 meses</div>
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
          :ubicacion="ubicacionResidencia"
          :ubicacion-expedicion="ubicacionExpedicion"
          :show-nivel-educativo="true"
          @update:model-value="persona = $event"
          @update:direccion-estructurada="direccionEstructurada = $event"
          @update:ubicacion="ubicacionResidencia = $event"
          @update:ubicacion-expedicion="ubicacionExpedicion = $event"
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
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
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
              <CampoSelectBuscable
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
              <CampoSelectBuscable
                :model-value="laboral.entidad_pagadora"
                label="Entidad pagadora"
                required
                :opciones="opsEntidadesPensiones"
                :style="{ gridColumn: '1 / -1' }"
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
              <CampoSelectBuscable
                :model-value="laboral.nivel_educativo"
                label="Nivel educativo"
                required
                :opciones="opsNivelEducativo"
                @update:model-value="actualizarLaboral('nivel_educativo', $event)"
              />
            </template>

            <!-- Cuidado del hogar — sin campos adicionales -->
            <template v-if="laboral.tipo_trabajador === 'cuidado_hogar'">
              <!-- Sin campos adicionales para cuidado del hogar -->
            </template>
          </div>

          <!-- Dependientes — todos los tipos excepto cuidado_hogar -->
          <div v-if="laboral.tipo_trabajador && laboral.tipo_trabajador !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
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
          :tipo-trabajador="laboral.tipo_trabajador"
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
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)',
        }">
          <CampoSelectBuscable
            :model-value="cuenta.tipo_cuenta"
            label="Tipo de cuenta"
            required
            :opciones="opsTipoCuenta"
            @update:model-value="actualizarCuenta('tipo_cuenta', $event)"
          />
          <CampoSelectBuscable
            :model-value="cuenta.entidad_bancaria"
            label="Entidad bancaria"
            required
            :opciones="ENTIDADES_BANCARIAS.map(e => ({ value: e, label: e }))"
            placeholder="Seleccione su banco"
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

        <!-- ── PASO 8: Selección de codeudores ─────────────────── -->
        <div v-if="paso === 8" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)' }">
            ¿Desea agregar codeudores a su solicitud?
          </div>
          <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 'var(--sp-md)' }">
            <div
              v-for="opcion in [
                { num: 0, titulo: 'Sin codeudor',   desc: 'Continúo solo'          },
                { num: 1, titulo: '1 Codeudor',     desc: 'Añadir un codeudor'     },
                { num: 2, titulo: '2 Codeudores',   desc: 'Añadir dos codeudores'  },
              ]"
              :key="opcion.num"
              :style="{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--sp-sm)', padding: 'var(--sp-xl)',
                borderRadius: 'var(--r-xl)',
                border: numCodudores === opcion.num ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: numCodudores === opcion.num ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                cursor: 'pointer', transition: 'all var(--transition-fast)', textAlign: 'center',
              }"
              @click="numCodudores = opcion.num"
            >
              <UserCheck v-if="opcion.num === 1" :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
              <Users v-else :size="28" :style="{ color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
              <div :style="{ fontWeight: 'var(--fw-bold)', color: numCodudores === opcion.num ? 'var(--color-primary)' : 'var(--color-text-1)', fontSize: 'var(--text-base)' }">{{ opcion.titulo }}</div>
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">{{ opcion.desc }}</div>
            </div>
          </div>
        </div>

        <!-- ── PASO 9: Datos personales Codeudor 1 ──────────────── -->
        <SeccionPersona
          v-if="paso === 9"
          :model-value="personaCod1"
          titulo="Datos del codeudor 1"
          :direccion-estructurada="direccionEstructuradaCod1"
          :ubicacion="ubicacionCod1"
          :ubicacion-expedicion="ubicacionExpedicionCod1"
          @update:model-value="personaCod1 = $event"
          @update:direccion-estructurada="direccionEstructuradaCod1 = $event"
          @update:ubicacion="ubicacionCod1 = $event"
          @update:ubicacion-expedicion="ubicacionExpedicionCod1 = $event"
        />

        <!-- ── PASO 10: Laboral Codeudor 1 ───────────────────── -->
        <div v-if="paso === 10" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorTipoTrabajador
            :model-value="laboralCod1.tipo_trabajador_codeudor"
            @update:model-value="actualizarLaboralCod1('tipo_trabajador_codeudor', $event)"
          />
          <div
            v-if="laboralCod1.tipo_trabajador_codeudor"
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'empleado'">
              <CampoTexto :model-value="laboralCod1.nombre_empresa_codeudor" label="Nombre de la empresa" placeholder="Empresa donde trabaja" required @update:model-value="actualizarLaboralCod1('nombre_empresa_codeudor', $event)" />
              <CampoTexto :model-value="laboralCod1.cargo_oficio_codeudor" label="Cargo u oficio" placeholder="Ej: Contador, Docente" required @update:model-value="actualizarLaboralCod1('cargo_oficio_codeudor', $event)" />
              <CampoSelectBuscable :model-value="laboralCod1.tipo_contrato_codeudor" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod1('tipo_contrato_codeudor', $event)" />
              <CampoFecha :model-value="laboralCod1.fecha_ingreso_codeudor" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod1('fecha_ingreso_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'independiente'">
              <CampoTexto :model-value="laboralCod1.actividad_comercial_codeudor" label="Actividad comercial" placeholder="Ej: Comercio" required @update:model-value="actualizarLaboralCod1('actividad_comercial_codeudor', $event)" />
              <CampoTexto :model-value="laboralCod1.ocupacion_codeudor" label="Ocupación" placeholder="Ej: Diseñador freelance" required @update:model-value="actualizarLaboralCod1('ocupacion_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'pensionado'">
              <CampoSelectBuscable :model-value="laboralCod1.entidad_pagadora_codeudor" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" :style="{ gridColumn: '1 / -1' }" @update:model-value="actualizarLaboralCod1('entidad_pagadora_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'estudiante'">
              <CampoTexto :model-value="laboralCod1.institucion_educativa_codeudor" label="Institución educativa" placeholder="Nombre de la institución" required @update:model-value="actualizarLaboralCod1('institucion_educativa_codeudor', $event)" />
              <CampoSelectBuscable :model-value="laboralCod1.nivel_educativo_codeudor" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod1('nivel_educativo_codeudor', $event)" />
            </template>
            <template v-if="laboralCod1.tipo_trabajador_codeudor === 'cuidado_hogar'">
              <!-- Sin campos adicionales -->
            </template>
          </div>
          <div v-if="laboralCod1.tipo_trabajador_codeudor && laboralCod1.tipo_trabajador_codeudor !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck :model-value="laboralCod1.tiene_dependientes_codeudor" label="Tiene personas a cargo" @update:model-value="actualizarLaboralCod1('tiene_dependientes_codeudor', $event)" />
            <CampoTexto v-if="laboralCod1.tiene_dependientes_codeudor" :model-value="laboralCod1.numero_dependientes_codeudor" label="Número de dependientes" type="number" :style="{ maxWidth: '200px' }" @update:model-value="actualizarLaboralCod1('numero_dependientes_codeudor', $event)" />
          </div>
        </div>

        <!-- ── PASO 11: Financiera Codeudor 1 ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 11"
          :model-value="financieraCod1"
          titulo="Información financiera — Codeudor 1"
          :tipo-trabajador="laboralCod1.tipo_trabajador_codeudor"
          @update:model-value="financieraCod1 = $event"
        />

        <!-- ── PASO 12: Patrimonio Codeudor 1 ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 12"
          :model-value="patrimonioCod1"
          titulo="Patrimonio — Codeudor 1"
          tooltip-activos="Suma de todos los bienes del codeudor 1."
          tooltip-pasivos="Suma de todas las deudas del codeudor 1."
          @update:model-value="patrimonioCod1 = $event"
        />

        <!-- ── PASO 13: Datos personales Codeudor 2 ──────────── -->
        <SeccionPersona
          v-if="paso === 13"
          :model-value="personaCod2"
          titulo="Datos del codeudor 2"
          :direccion-estructurada="direccionEstructuradaCod2"
          :ubicacion="ubicacionCod2"
          :ubicacion-expedicion="ubicacionExpedicionCod2"
          @update:model-value="personaCod2 = $event"
          @update:direccion-estructurada="direccionEstructuradaCod2 = $event"
          @update:ubicacion="ubicacionCod2 = $event"
          @update:ubicacion-expedicion="ubicacionExpedicionCod2 = $event"
        />

        <!-- ── PASO 14: Laboral Codeudor 2 ───────────────────── -->
        <div v-if="paso === 14" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <SelectorTipoTrabajador
            :model-value="laboralCod2.tipo_trabajador_codeudor2"
            @update:model-value="actualizarLaboralCod2('tipo_trabajador_codeudor2', $event)"
          />
          <div
            v-if="laboralCod2.tipo_trabajador_codeudor2"
            :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-lg)' }"
          >
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'empleado'">
              <CampoTexto :model-value="laboralCod2.nombre_empresa_codeudor2" label="Nombre de la empresa" placeholder="Empresa donde trabaja" required @update:model-value="actualizarLaboralCod2('nombre_empresa_codeudor2', $event)" />
              <CampoTexto :model-value="laboralCod2.cargo_oficio_codeudor2" label="Cargo u oficio" placeholder="Ej: Contador, Docente" required @update:model-value="actualizarLaboralCod2('cargo_oficio_codeudor2', $event)" />
              <CampoSelectBuscable :model-value="laboralCod2.tipo_contrato_codeudor2" label="Tipo de contrato" required :opciones="opsTipoContrato" @update:model-value="actualizarLaboralCod2('tipo_contrato_codeudor2', $event)" />
              <CampoFecha :model-value="laboralCod2.fecha_ingreso_codeudor2" label="Fecha de ingreso" required @update:model-value="actualizarLaboralCod2('fecha_ingreso_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'independiente'">
              <CampoTexto :model-value="laboralCod2.actividad_comercial_codeudor2" label="Actividad comercial" placeholder="Ej: Comercio" required @update:model-value="actualizarLaboralCod2('actividad_comercial_codeudor2', $event)" />
              <CampoTexto :model-value="laboralCod2.ocupacion_codeudor2" label="Ocupación" placeholder="Ej: Diseñador freelance" required @update:model-value="actualizarLaboralCod2('ocupacion_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'pensionado'">
              <CampoSelectBuscable :model-value="laboralCod2.entidad_pagadora_codeudor2" label="Entidad pagadora" required :opciones="opsEntidadesPensiones" :style="{ gridColumn: '1 / -1' }" @update:model-value="actualizarLaboralCod2('entidad_pagadora_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'estudiante'">
              <CampoTexto :model-value="laboralCod2.institucion_educativa_codeudor2" label="Institución educativa" placeholder="Nombre de la institución" required @update:model-value="actualizarLaboralCod2('institucion_educativa_codeudor2', $event)" />
              <CampoSelectBuscable :model-value="laboralCod2.nivel_educativo_codeudor2" label="Nivel educativo" required :opciones="opsNivelEducativo" @update:model-value="actualizarLaboralCod2('nivel_educativo_codeudor2', $event)" />
            </template>
            <template v-if="laboralCod2.tipo_trabajador_codeudor2 === 'cuidado_hogar'">
              <!-- Sin campos adicionales -->
            </template>
          </div>
          <div v-if="laboralCod2.tipo_trabajador_codeudor2 && laboralCod2.tipo_trabajador_codeudor2 !== 'cuidado_hogar'" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
            <CampoCheck :model-value="laboralCod2.tiene_dependientes_codeudor2" label="Tiene personas a cargo" @update:model-value="actualizarLaboralCod2('tiene_dependientes_codeudor2', $event)" />
            <CampoTexto v-if="laboralCod2.tiene_dependientes_codeudor2" :model-value="laboralCod2.numero_dependientes_codeudor2" label="Número de dependientes" type="number" :style="{ maxWidth: '200px' }" @update:model-value="actualizarLaboralCod2('numero_dependientes_codeudor2', $event)" />
          </div>
        </div>

        <!-- ── PASO 15: Financiera Codeudor 2 ────────────────── -->
        <SeccionFinanciera
          v-if="paso === 15"
          :model-value="financieraCod2"
          titulo="Información financiera — Codeudor 2"
          :tipo-trabajador="laboralCod2.tipo_trabajador_codeudor2"
          @update:model-value="financieraCod2 = $event"
        />

        <!-- ── PASO 16: Patrimonio Codeudor 2 ────────────────── -->
        <SeccionPatrimonio
          v-if="paso === 16"
          :model-value="patrimonioCod2"
          titulo="Patrimonio — Codeudor 2"
          tooltip-activos="Suma de todos los bienes del codeudor 2."
          tooltip-pasivos="Suma de todas las deudas del codeudor 2."
          @update:model-value="patrimonioCod2 = $event"
        />

        <!-- ── PASO 17: Autorizaciones ────────────────────────── -->
        <div v-if="paso === 17" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
          <div :style="{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)' }">Autorizaciones y declaraciones legales</div>

          <div :style="{
            border: '1px solid var(--color-border-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            background: 'var(--color-bg-card)',
            boxShadow: 'var(--shadow-card)',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-md)' }">
              <div>
                <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)' }">Autorizaciones y declaraciones legales</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', fontWeight: 'var(--fw-medium)' }">Debe leer y aceptar los términos para continuar.</div>
              </div>
              <div :style="{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
                padding: 'var(--sp-sm) var(--sp-lg)',
                borderRadius: 'var(--r-pill)',
                background: autorizaciones.autorizacion_aceptada ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
                border: autorizaciones.autorizacion_aceptada ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
              }">
                <CheckCircle v-if="autorizaciones.autorizacion_aceptada" :size="16" :style="{ color: 'var(--color-success)' }" />
                <span :style="{
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
                  color: autorizaciones.autorizacion_aceptada ? 'var(--color-success-text)' : 'var(--color-text-3)',
                }">{{ autorizaciones.autorizacion_aceptada ? 'Aceptadas' : 'Pendiente' }}</span>
              </div>
            </div>

            <PortalButton
              variant="primary"
              :full="true"
              :style="{ marginTop: 'var(--sp-lg)' }"
              @click="modalAutorizacionesVisible = true"
            >
              <ScrollText :size="15" />
              {{ autorizaciones.autorizacion_aceptada ? 'Revisar autorizaciones' : 'Leer y aceptar autorizaciones' }}
            </PortalButton>
          </div>

          <ModalAutorizaciones
            v-model:visible="modalAutorizacionesVisible"
            :aceptado="autorizaciones.autorizacion_aceptada"
            @aceptar="autorizaciones.autorizacion_aceptada = true"
            @rechazar="autorizaciones.autorizacion_aceptada = false"
          />
        </div>

        <!-- ── PASO 18: Confirmación y firma ─────────────────── -->
        <div v-if="paso === 18" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">

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
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
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
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
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
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
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
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }">
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

          <!-- Codeudor 1 (condicional) -->
          <div v-if="numCodudores >= 1" :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Codeudor 1</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [personaCod1.nombres_codeudor, personaCod1.apellidos_codeudor].filter(Boolean).join(' ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, personaCod1.tipo_documento_codeudor) }} {{ personaCod1.numero_identificacion_codeudor }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ingresos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financieraCod1.salario_codeudor || financieraCod1.ingresos_independiente_codeudor) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ personaCod1.correo_codeudor || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Codeudor 2 (condicional) -->
          <div v-if="numCodudores >= 2" :style="{ borderRadius: 'var(--r-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }">
            <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center' }">
              <span :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }">Codeudor 2</span>
            </div>
            <div :style="{ background: 'var(--color-bg-surface)' }">
              <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }">
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Nombre</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ [personaCod2.nombres_codeudor2, personaCod2.apellidos_codeudor2].filter(Boolean).join(' ') || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Documento</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ label(LABEL_TIPO_DOC, personaCod2.tipo_documento_codeudor2) }} {{ personaCod2.numero_identificacion_codeudor2 }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Ingresos</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ formatMonto(financieraCod2.salario_codeudor2 || financieraCod2.ingresos_independiente_codeudor2) || '—' }}</div>
                </div>
                <div :style="{ padding: 'var(--sp-sm) var(--sp-lg)', borderLeft: '1px solid var(--color-border)' }">
                  <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.06em' }">Correo</div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)', marginTop: 'var(--sp-2xs)' }">{{ personaCod2.correo_codeudor2 || '—' }}</div>
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
        flexDirection:  isMobile ? 'column-reverse' : 'row',
        justifyContent: (!isMobile && paso === pasosActivos[0]?.numero) ? 'flex-end' : 'space-between',
        alignItems:     'stretch',
        gap:            'var(--sp-md)',
      }">
        <PortalButton
          v-if="paso !== pasosActivos[0]?.numero"
          variant="secondary"
          :full="isMobile"
          @click="anterior()"
        >
          Anterior
        </PortalButton>
        <PortalButton
          v-if="!esUltimoPaso"
          variant="primary"
          :loading="loading"
          :disabled="paso === 17 && !autorizaciones.autorizacion_aceptada"
          :full="isMobile"
          @click="siguiente()"
        >
          Continuar
        </PortalButton>
        <PortalButton
          v-if="esUltimoPaso"
          variant="accent"
          :loading="loading"
          :full="isMobile"
          @click="enviar()"
        >
          Enviar solicitud
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
