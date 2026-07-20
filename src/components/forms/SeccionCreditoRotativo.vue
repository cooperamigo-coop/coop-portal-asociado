<script setup>
import { ref, computed, watch } from 'vue'
import CampoMoneda from '@/components/forms/CampoMoneda.vue'
import CampoTexto from '@/components/forms/CampoTexto.vue'
import CampoSelect from '@/components/forms/CampoSelect.vue'
import PortalButton from '@/components/ui/PortalButton.vue'
import AlertaBanner from '@/components/ui/AlertaBanner.vue'
import { ENTIDADES_BANCARIAS } from '@/data/colombiaData.js'
import {
  RefreshCcw, ArrowLeft, CheckCircle2, Clock, Lock,
  Landmark, FileText, MailCheck,
} from 'lucide-vue-next'

const props = defineProps({
  info:      { type: Object,  default: null },
  enviando:  { type: Boolean, default: false },
  error:     { type: String,  default: null },
})
const emit = defineEmits(['activar', 'solicitar-desembolso', 'volver'])

const estado = computed(() => props.info?.estado ?? null)

const cupoDisponibleReal = computed(() => {
  const s = props.info?.saldo
  if (!s) return 0
  return Number(s.cupo_disponible) - Number(s.cupo_reservado)
})

function fmtCOP(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('es-CO')
}

function fmtFecha(v) {
  if (!v) return null
  return new Date(v).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Wizard de activación: cupo → cuenta → condiciones ───────────────────────
const subPaso = ref('cupo') // 'cupo' | 'cuenta' | 'condiciones'
const activacionEnviada = ref(false)
const errorLocal = ref(null)

// Paso 1 — Cupo. Slider en pasos de $50.000: con $100.000 el máximo no caería
// exacto partiendo de $1.750.000; con $50.000 ambos extremos son alcanzables.
const PASO_CUPO = 50000
const cupoMin = computed(() => Number(props.info?.cupo_minimo_global ?? 0))
const cupoMax = computed(() => Number(props.info?.cupo_maximo_autorizado ?? 0))
const cupoElegido = ref(0)

watch(cupoMin, (min) => {
  if (!cupoElegido.value && min) cupoElegido.value = min
}, { immediate: true })

const porcentajeSlider = computed(() => {
  if (cupoMax.value <= cupoMin.value) return 0
  return ((cupoElegido.value - cupoMin.value) / (cupoMax.value - cupoMin.value)) * 100
})

const rangoTexto = computed(() => {
  if (!props.info) return ''
  return `${fmtCOP(props.info.cupo_minimo_global)} y ${fmtCOP(props.info.cupo_maximo_autorizado)}`
})

// Paso 2 — Cuenta de desembolso (titularidad propia, cambio solo en oficina)
const banco           = ref('')
const tipoCuenta      = ref('')
const numeroCuenta    = ref('')
const confirmaCuenta  = ref('')
const aceptaTitularidad = ref(false)

const OPCIONES_TIPO_CUENTA = ['Cuenta de ahorros', 'Cuenta corriente']

const cuentaValida = computed(() =>
  banco.value &&
  tipoCuenta.value &&
  String(numeroCuenta.value).replace(/\D/g, '').length >= 6 &&
  numeroCuenta.value === confirmaCuenta.value &&
  aceptaTitularidad.value
)

const cuentasNoCoinciden = computed(() =>
  confirmaCuenta.value.length > 0 && numeroCuenta.value !== confirmaCuenta.value
)

// Paso 3 — Condiciones y firma
const aceptaCondiciones = ref(false)

function irACuenta() {
  errorLocal.value = null
  subPaso.value = 'cuenta'
}

function irACondiciones() {
  errorLocal.value = null
  subPaso.value = 'condiciones'
}

function firmarElectronicamente() {
  errorLocal.value = null
  emit('activar', Number(cupoElegido.value), {
    banco: banco.value,
    tipo: tipoCuenta.value === 'Cuenta corriente' ? 'corriente' : 'ahorros',
    numero: String(numeroCuenta.value).replace(/\D/g, ''),
  }, () => { activacionEnviada.value = true })
}

// ── Desembolso (producto activo) ─────────────────────────────────────────────
const montoDesembolso   = ref('')
const desembolsoEnviado = ref(false)

const tieneSolicitudEnTramite = computed(() =>
  (props.info?.movimientos ?? []).some(m =>
    m.tipo === 'desembolso' &&
    ['solicitado', 'en_aprobacion', 'aprobado', 'pendiente_registro_opa'].includes(m.estado)
  )
)

const cuentaRegistrada = computed(() => {
  const c = props.info?.cuenta_desembolso
  if (!c) return null
  const tipo = c.tipo === 'corriente' ? 'Cuenta corriente' : 'Cuenta de ahorros'
  return `${c.banco} · ${tipo} · ****${c.ultimos_digitos}`
})

function solicitarDesembolso() {
  errorLocal.value = null
  const monto = Number(montoDesembolso.value)
  if (!monto || monto <= 0) {
    errorLocal.value = 'Ingresa el monto que deseas solicitar'
    return
  }
  if (monto > cupoDisponibleReal.value) {
    errorLocal.value = `El monto supera tu cupo disponible (${fmtCOP(cupoDisponibleReal.value)})`
    return
  }
  emit('solicitar-desembolso', monto, () => {
    desembolsoEnviado.value = true
    montoDesembolso.value = ''
  })
}

const ESTADOS_MOV = {
  solicitado:             'En revisión',
  en_aprobacion:          'En aprobación',
  aprobado:               'Aprobado',
  pendiente_registro_opa: 'En proceso de desembolso',
  confirmado:             'Completado',
  rechazado:              'Rechazado',
}

const DOCUMENTOS_PRODUCTO = [
  'Contrato marco del Crédito Rotativo',
  'Pagaré y carta de instrucciones',
  'Autorización de desembolso a cuenta registrada',
]
</script>

<template>
  <div class="rotativo-wrap">

    <!-- Encabezado -->
    <div class="rotativo-header">
      <div class="rotativo-icono">
        <RefreshCcw :size="26" />
      </div>
      <h2 class="rotativo-titulo">Crédito Rotativo</h2>
      <p class="rotativo-subtitulo">
        Un cupo de crédito disponible cuando lo necesites: solicita desembolsos
        parciales y recupera tu cupo a medida que pagas.
      </p>
    </div>

    <!-- ═══ HABILITADO: wizard de activación ═══ -->
    <template v-if="estado === 'habilitado' && !activacionEnviada">

      <!-- Paso 1: cupo -->
      <template v-if="subPaso === 'cupo'">
        <AlertaBanner
          tipo="info"
          :mensaje="`¡Tienes un cupo aprobado! Elige el monto que deseas activar entre ${rangoTexto}. Solo falta legalizarlo con la firma de la documentación — una vez legalizado, solicitar desembolsos será mucho más rápido: sin papeleo adicional cada vez.`"
        />
        <div class="rotativo-slider-wrap">
          <div class="rotativo-slider-label">Cupo que deseas activar</div>
          <div class="rotativo-slider-valor">{{ fmtCOP(cupoElegido) }}</div>
          <input
            v-model.number="cupoElegido"
            type="range"
            class="rotativo-slider"
            :min="cupoMin"
            :max="cupoMax"
            :step="PASO_CUPO"
            :style="{ '--slider-pct': porcentajeSlider + '%' }"
          />
          <div class="rotativo-slider-extremos">
            <span>{{ fmtCOP(cupoMin) }}</span>
            <span>{{ fmtCOP(cupoMax) }}</span>
          </div>
        </div>
        <PortalButton variant="primary" full @click="irACuenta">
          Continuar
        </PortalButton>
      </template>

      <!-- Paso 2: cuenta de desembolso -->
      <template v-else-if="subPaso === 'cuenta'">
        <div class="rotativo-paso-titulo">
          <Landmark :size="18" />
          ¿A qué cuenta desembolsamos?
        </div>
        <AlertaBanner
          tipo="warning"
          mensaje="La cuenta debe estar a tu nombre (titularidad propia). Para cambiarla después deberás acercarte a una de nuestras oficinas."
        />
        <CampoSelect
          v-model="banco"
          label="Banco"
          :opciones="ENTIDADES_BANCARIAS"
          required
        />
        <CampoSelect
          v-model="tipoCuenta"
          label="Tipo de cuenta"
          :opciones="OPCIONES_TIPO_CUENTA"
          required
        />
        <CampoTexto
          v-model="numeroCuenta"
          label="Número de cuenta"
          solo-numeros
          :maxlength="20"
          required
        />
        <CampoTexto
          v-model="confirmaCuenta"
          label="Confirma el número de cuenta"
          solo-numeros
          :maxlength="20"
          required
          :error="cuentasNoCoinciden ? 'Los números no coinciden' : null"
        />
        <label class="rotativo-check">
          <input v-model="aceptaTitularidad" type="checkbox" />
          <span>
            Declaro que esta cuenta bancaria es de <strong>mi titularidad</strong> y autorizo
            a la cooperativa a realizar en ella los desembolsos de mi Crédito Rotativo.
          </span>
        </label>
        <div class="rotativo-paso-botones">
          <PortalButton variant="secondary" @click="subPaso = 'cupo'">Atrás</PortalButton>
          <PortalButton variant="primary" :disabled="!cuentaValida" @click="irACondiciones">
            Continuar
          </PortalButton>
        </div>
      </template>

      <!-- Paso 3: condiciones y firma -->
      <template v-else-if="subPaso === 'condiciones'">
        <div class="rotativo-paso-titulo">
          <FileText :size="18" />
          Condiciones y firma
        </div>

        <!-- Resumen -->
        <div class="rotativo-resumen">
          <div class="rotativo-resumen-fila">
            <span>Cupo a activar</span>
            <strong>{{ fmtCOP(cupoElegido) }}</strong>
          </div>
          <div class="rotativo-resumen-fila">
            <span>Cuenta de desembolso</span>
            <strong>{{ banco }} · ****{{ String(numeroCuenta).slice(-4) }}</strong>
          </div>
        </div>

        <!-- Condiciones generales -->
        <div class="rotativo-condiciones">
          <div class="rotativo-condiciones-titulo">Condiciones generales del producto</div>
          <ul class="rotativo-condiciones-lista">
            <li>Este es un contrato de apertura de crédito con <strong>disponibilidad rotatoria</strong>: los pagos de capital que realices vuelven a quedar disponibles dentro de tu cupo durante la vigencia del contrato.</li>
            <li>Cada desembolso es una utilización del mismo cupo (no un crédito nuevo), requiere aprobación de la cooperativa y se abona únicamente a tu cuenta registrada de titularidad propia.</li>
            <li>Cada utilización se rige por la tasa y condiciones vigentes al momento del desembolso, siempre dentro de los límites legales. Cualquier modificación de condiciones te será avisada previamente y podrás cancelar el producto sin penalidad pagando el saldo si no la aceptas.</li>
            <li>El cupo permanece vigente mientras conserves tu calidad de asociado; la cooperativa puede bloquearlo o reducirlo por mora u otras causales objetivas previstas en el reglamento, con aviso.</li>
            <li>Puedes realizar pagos anticipados o prepagos en cualquier momento, sin sanción.</li>
          </ul>
        </div>

        <!-- Documentos a firmar -->
        <div class="rotativo-condiciones">
          <div class="rotativo-condiciones-titulo">Documentos que firmarás electrónicamente</div>
          <ul class="rotativo-docs-lista">
            <li v-for="doc in DOCUMENTOS_PRODUCTO" :key="doc">
              <FileText :size="14" />
              {{ doc }}
            </li>
          </ul>
          <div class="rotativo-docs-nota">
            Los borradores de los documentos estarán disponibles aquí para tu lectura antes de la firma.
          </div>
        </div>

        <label class="rotativo-check">
          <input v-model="aceptaCondiciones" type="checkbox" />
          <span>
            He leído y <strong>acepto las condiciones del Crédito Rotativo</strong> y autorizo
            el envío de los documentos para firma electrónica a mi correo registrado.
          </span>
        </label>

        <AlertaBanner v-if="errorLocal || error" tipo="error" :mensaje="errorLocal || error" />

        <div class="rotativo-paso-botones">
          <PortalButton variant="secondary" @click="subPaso = 'cuenta'">Atrás</PortalButton>
          <PortalButton
            variant="primary"
            :disabled="!aceptaCondiciones"
            :loading="enviando"
            @click="firmarElectronicamente"
          >
            Firmar electrónicamente
          </PortalButton>
        </div>
      </template>
    </template>

    <!-- ═══ Activación enviada / pendiente firma ═══ -->
    <template v-else-if="estado === 'pendiente_firma' || activacionEnviada">
      <div class="rotativo-estado">
        <MailCheck :size="40" class="rotativo-estado-icono rotativo-estado-icono--ok" />
        <div class="rotativo-estado-titulo">¡Tu solicitud va en camino!</div>
        <div class="rotativo-estado-texto">
          A tu correo electrónico llegarán los enlaces para <strong>firmar electrónicamente</strong>
          los documentos del producto. Una vez firmados, el área de Crédito y Cartera de la
          cooperativa validará tu solicitud y te notificará cuando tu cupo esté activo y
          puedas solicitar desembolsos.
        </div>
      </div>
    </template>

    <!-- ═══ PENDIENTE CREACIÓN ═══ -->
    <template v-else-if="estado === 'pendiente_creacion_opa'">
      <div class="rotativo-estado">
        <Clock :size="40" class="rotativo-estado-icono" />
        <div class="rotativo-estado-titulo">Tu Crédito Rotativo está en proceso</div>
        <div class="rotativo-estado-texto">
          La documentación fue firmada y estamos creando tu producto.
          El área de Crédito y Cartera te notificará cuando el cupo quede activo.
        </div>
      </div>
    </template>

    <!-- ═══ ACTIVO: saldo + desembolsos ═══ -->
    <template v-else-if="estado === 'activo'">
      <div class="rotativo-stats">
        <div class="rotativo-stat">
          <div class="rotativo-stat-label">Cupo total</div>
          <div class="rotativo-stat-valor">{{ fmtCOP(info.saldo?.cupo_total) }}</div>
        </div>
        <div class="rotativo-stat rotativo-stat--destacado">
          <div class="rotativo-stat-label">Disponible</div>
          <div class="rotativo-stat-valor">{{ fmtCOP(cupoDisponibleReal) }}</div>
        </div>
        <div class="rotativo-stat">
          <div class="rotativo-stat-label">Saldo en uso</div>
          <div class="rotativo-stat-valor">{{ fmtCOP(info.saldo?.saldo_actual) }}</div>
        </div>
      </div>
      <div v-if="fmtFecha(info.saldo?.fecha_ultima_sincronizacion)" class="rotativo-sync">
        Información actualizada el {{ fmtFecha(info.saldo?.fecha_ultima_sincronizacion) }}
      </div>

      <template v-if="desembolsoEnviado">
        <AlertaBanner
          tipo="success"
          mensaje="Tu solicitud de desembolso fue enviada. Te notificaremos cuando sea aprobada y desembolsada a tu cuenta registrada."
        />
      </template>
      <template v-else-if="tieneSolicitudEnTramite">
        <AlertaBanner
          tipo="info"
          mensaje="Tienes una solicitud de desembolso en trámite. Podrás solicitar otra cuando finalice."
        />
      </template>
      <template v-else>
        <div class="rotativo-form-titulo">Solicitar un desembolso</div>
        <CampoMoneda
          v-model="montoDesembolso"
          label="Monto a solicitar"
          required
          :helper="`Hasta ${fmtCOP(cupoDisponibleReal)}`"
        />
        <div v-if="cuentaRegistrada" class="rotativo-cuenta-box">
          <Landmark :size="16" />
          <div>
            <div class="rotativo-cuenta-texto">Se desembolsará a: <strong>{{ cuentaRegistrada }}</strong></div>
            <div class="rotativo-cuenta-nota">¿Necesitas cambiar tu cuenta? Acércate a una de nuestras oficinas.</div>
          </div>
        </div>
        <AlertaBanner v-if="errorLocal || error" tipo="error" :mensaje="errorLocal || error" />
        <PortalButton variant="primary" full :loading="enviando" @click="solicitarDesembolso">
          Solicitar desembolso
        </PortalButton>
      </template>

      <!-- Movimientos -->
      <template v-if="(info.movimientos ?? []).length">
        <div class="rotativo-form-titulo">Últimos movimientos</div>
        <div class="rotativo-movs">
          <div v-for="(m, i) in info.movimientos" :key="i" class="rotativo-mov">
            <div class="rotativo-mov-info">
              <span class="rotativo-mov-tipo">{{ m.tipo === 'desembolso' ? 'Desembolso' : 'Pago' }}</span>
              <span class="rotativo-mov-fecha">{{ fmtFecha(m.fecha_solicitud || m.created_at) }}</span>
            </div>
            <div class="rotativo-mov-derecha">
              <span
                class="rotativo-mov-monto"
                :class="{ 'rotativo-mov-monto--pago': m.tipo === 'pago' }"
              >{{ m.tipo === 'pago' ? '+' : '−' }}{{ fmtCOP(m.monto) }}</span>
              <span class="rotativo-mov-estado">{{ ESTADOS_MOV[m.estado] ?? m.estado }}</span>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ═══ BLOQUEADO ═══ -->
    <template v-else-if="estado === 'bloqueado'">
      <div class="rotativo-estado">
        <Lock :size="40" class="rotativo-estado-icono rotativo-estado-icono--bloqueado" />
        <div class="rotativo-estado-titulo">Tu Crédito Rotativo está temporalmente bloqueado</div>
        <div class="rotativo-estado-texto">
          Por el momento no es posible solicitar nuevos desembolsos.
          Comunícate con la cooperativa para más información.
        </div>
      </div>
    </template>

    <!-- Volver -->
    <button class="rotativo-volver" @click="emit('volver')">
      <ArrowLeft :size="14" />
      Volver a los tipos de crédito
    </button>

  </div>
</template>

<style scoped>
.rotativo-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.rotativo-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
  text-align: center;
}

.rotativo-icono {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-bg-surface-alt);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--sp-xs);
}

.rotativo-titulo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.1;
}

.rotativo-subtitulo {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  line-height: 1.4;
  margin: 0;
}

.rotativo-paso-titulo {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.rotativo-paso-botones {
  display: flex;
  gap: var(--sp-sm);
  justify-content: space-between;
}

.rotativo-paso-botones > :last-child {
  flex: 1;
}

.rotativo-resumen {
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.rotativo-resumen-fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-sm) var(--sp-md);
  font-size: var(--text-sm);
  color: var(--color-text-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.rotativo-resumen-fila:last-child { border-bottom: none; }

.rotativo-resumen-fila strong {
  color: var(--color-text-1);
  font-weight: var(--fw-bold);
  text-align: right;
}

.rotativo-condiciones {
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--color-bg-card);
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.rotativo-condiciones-titulo {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.rotativo-condiciones-lista {
  margin: 0;
  padding-left: var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  font-size: var(--text-sm);
  color: var(--color-text-2);
  line-height: 1.45;
}

.rotativo-docs-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.rotativo-docs-lista li {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  font-size: var(--text-sm);
  color: var(--color-text-2);
}

.rotativo-docs-lista li svg { color: var(--color-primary); flex-shrink: 0; }

.rotativo-docs-nota {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  line-height: 1.4;
}

.rotativo-cuenta-box {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-sm);
  padding: var(--sp-md);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  background: var(--color-bg-surface-alt);
}

.rotativo-cuenta-box svg { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }

.rotativo-cuenta-texto {
  font-size: var(--text-sm);
  color: var(--color-text-1);
}

.rotativo-cuenta-nota {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  margin-top: 2px;
}

.rotativo-slider-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  padding: var(--sp-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  background: var(--color-bg-card);
}

.rotativo-slider-label {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-2);
}

.rotativo-slider-valor {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-primary);
  text-align: center;
  line-height: 1.1;
}

.rotativo-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: var(--r-pill);
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) var(--slider-pct),
    var(--color-bg-surface-alt) var(--slider-pct),
    var(--color-bg-surface-alt) 100%
  );
  outline: none;
  cursor: pointer;
}

.rotativo-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-bg-card);
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-btn);
  cursor: grab;
  transition: transform var(--transition-fast);
}

.rotativo-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

.rotativo-slider::-moz-range-thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-bg-card);
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-btn);
  cursor: grab;
}

.rotativo-slider-extremos {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-text-3);
}

.rotativo-check {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-sm);
  font-size: var(--text-sm);
  color: var(--color-text-2);
  line-height: 1.4;
  cursor: pointer;
}

.rotativo-check input {
  margin-top: 3px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.rotativo-estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-sm);
  text-align: center;
  padding: var(--sp-xl) 0;
}

.rotativo-estado-icono { color: var(--color-info); }
.rotativo-estado-icono--ok { color: var(--color-success); }
.rotativo-estado-icono--bloqueado { color: var(--color-error); }

.rotativo-estado-titulo {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.rotativo-estado-texto {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  line-height: 1.5;
}

.rotativo-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-sm);
}

.rotativo-stat {
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: var(--sp-md);
  text-align: center;
  background: var(--color-bg-card);
}

.rotativo-stat--destacado {
  border-color: var(--color-primary);
  background: var(--color-bg-surface-alt);
}

.rotativo-stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rotativo-stat-valor {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  margin-top: 2px;
  white-space: nowrap;
}

.rotativo-sync {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  text-align: center;
}

.rotativo-form-titulo {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin-top: var(--sp-sm);
}

.rotativo-movs {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.rotativo-mov {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-sm);
  padding: var(--sp-sm) var(--sp-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.rotativo-mov:last-child { border-bottom: none; }

.rotativo-mov-info {
  display: flex;
  flex-direction: column;
}

.rotativo-mov-tipo {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-1);
}

.rotativo-mov-fecha {
  font-size: var(--text-xs);
  color: var(--color-text-3);
}

.rotativo-mov-derecha {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rotativo-mov-monto {
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
}

.rotativo-mov-monto--pago { color: var(--color-success-text); }

.rotativo-mov-estado {
  font-size: var(--text-xs);
  color: var(--color-text-3);
}

.rotativo-volver {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-xs);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-3);
  padding: var(--sp-sm);
}

.rotativo-volver:hover { color: var(--color-text-1); }

@media (max-width: 600px) {
  .rotativo-wrap {
    padding: 28px 22px;
  }
  .rotativo-stats {
    grid-template-columns: 1fr;
  }
}
</style>
