<script setup>
import { ref } from 'vue'
import { X, CheckCircle, XCircle, ScrollText } from 'lucide-vue-next'
import PortalButton from '@/components/ui/PortalButton.vue'

defineProps({
  visible:  { type: Boolean, default: false },
  aceptado: { type: Boolean, default: false },
})
const emit = defineEmits(['update:visible', 'aceptar', 'rechazar'])

const scrolledToBottom = ref(false)

function onScroll(e) {
  const el = e.target
  if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
    scrolledToBottom.value = true
  }
}

function aceptar() { emit('aceptar'); emit('update:visible', false) }
function rechazar() { emit('rechazar'); emit('update:visible', false) }
function cerrar() { emit('update:visible', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-modal">
      <div v-if="visible" :style="{
        position: 'fixed', inset: '0', zIndex: '70',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }">
        <div :style="{ position: 'absolute', inset: '0', background: 'rgba(23,43,54,0.55)', backdropFilter: 'blur(3px)' }" @click="cerrar()" />

        <div :style="{
          position: 'relative', width: '100%', maxWidth: '680px',
          background: 'var(--color-bg-card)', borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        }">
          <!-- Header -->
          <div :style="{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--sp-xl) var(--sp-2xl)',
            borderBottom: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <ScrollText :size="18" style="color: white;" />
              </div>
              <div>
                <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">Autorizaciones y declaraciones</div>
                <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">Lea hasta el final para aceptar</div>
              </div>
            </div>
            <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center' }" @click="cerrar()">
              <X :size="20" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Cuerpo scrollable -->
          <div
            :style="{
              flex: '1', overflowY: 'auto', padding: 'var(--sp-2xl)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-2)',
              lineHeight: '1.7', fontWeight: 'var(--fw-medium)',
            }"
            @scroll="onScroll"
          >
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizo(amos) de manera expresa a la <strong>COOPERATIVA MULTIACTIVA LUIS AMIGÓ</strong>, en adelante <em>"Cooperamigó"</em>, con NIT 890.985.351-7, identificada ante el DANE con código 05001, y domiciliada en la ciudad de Medellín, Colombia, para que de conformidad con las normas vigentes sobre protección de datos personales, especialmente la Ley 1581 de 2012 y sus decretos reglamentarios, realice el tratamiento de mis datos personales.
            </p>

            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)', marginTop: 'var(--sp-lg)' }">I. AUTORIZACIÓN PARA LA UTILIZACIÓN DE LOS DATOS PERSONALES</p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizo a Cooperamigó para que recolecte, almacene, procese, use, circule, transmita, transfiera y en general trate mis datos personales contenidos en el presente formulario y los que en el futuro lleguen a conocer con ocasión de la relación contractual que se derive de la presente solicitud, con las siguientes finalidades: (a) evaluar mi solicitud de crédito; (b) verificar la información suministrada; (c) adelantar las gestiones de cobranza cuando sea pertinente; (d) enviar comunicaciones relacionadas con la gestión de mi crédito; (e) dar cumplimiento a disposiciones legales vigentes; (f) desarrollar actividades de mercadeo y publicidad de los productos y servicios de Cooperamigó; y (g) en general para el adecuado desarrollo del objeto social de la Cooperativa.
            </p>

            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)', marginTop: 'var(--sp-lg)' }">II. DECLARACIÓN DE INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Declaro bajo la gravedad del juramento que toda la información consignada en el presente formulario es veraz, comprobable y completa, que no he omitido ningún dato relevante para el estudio de la presente solicitud y que asumo plena responsabilidad por cualquier inexactitud u omisión en la información suministrada. Autorizo a Cooperamigó a verificar por los medios que considere pertinentes la veracidad de la información aquí registrada.
            </p>

            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)', marginTop: 'var(--sp-lg)' }">III. AUTORIZACIÓN PARA CONSULTA Y REPORTE A CENTRALES DE RIESGO</p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizo expresamente a Cooperamigó para que consulte mi comportamiento crediticio, financiero y comercial ante las centrales de información crediticia legalmente autorizadas en Colombia (Datacrédito/Experian, TransUnión, CIFIN y similares), así como para que reporte, actualice y rectifique la información que resulte de la relación contractual que se derive de la presente solicitud, de conformidad con lo dispuesto en la Ley 1266 de 2008 y demás normas concordantes.
            </p>

            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)', marginTop: 'var(--sp-lg)' }">IV. DECLARACIÓN DE RECEPCIÓN DE INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Declaro haber recibido por parte de Cooperamigó información completa, suficiente, clara y con suficiente antelación sobre las condiciones del crédito solicitado, incluyendo: tasa de interés efectiva anual, tasa de mora, plazo, cuota mensual estimada, seguros aplicables y cualquier otro costo asociado al crédito. Igualmente declaro conocer la política de protección de datos personales de Cooperamigó, la cual está disponible en las instalaciones de la Cooperativa y en su sitio web oficial.
            </p>

            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-xs)', marginTop: 'var(--sp-lg)' }">V. AUTORIZACIÓN USO DE DATOS SENSIBLES</p>
            <p :style="{ marginBottom: 'var(--sp-lg)' }">
              En caso de que para el trámite de la solicitud o de la relación crediticia derivada de ella sea necesario el tratamiento de datos sensibles (tales como datos biométricos, estado de salud u otros), autorizo expresamente a Cooperamigó para dicho tratamiento, de conformidad con el artículo 6° de la Ley 1581 de 2012. Entiendo que esta autorización es facultativa y que puedo revocarla en cualquier momento sin que ello afecte el estudio de mi solicitud, siempre que el tratamiento no sea necesario por disposición legal o contractual.
            </p>

            <!-- Indicador de scroll -->
            <div v-if="!scrolledToBottom" :style="{
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-3)',
              fontWeight: 'var(--fw-semibold)',
              padding: 'var(--sp-sm)',
              borderTop: '1px dashed var(--color-border)',
              marginTop: 'var(--sp-md)',
            }">
              ↓ Continúe leyendo para activar los botones
            </div>
          </div>

          <!-- Acciones fijas -->
          <div :style="{
            display: 'flex', gap: 'var(--sp-md)', justifyContent: 'flex-end',
            padding: 'var(--sp-lg) var(--sp-2xl)',
            borderTop: '1px solid var(--color-border-card)',
            background: 'var(--color-bg-surface)',
            flexShrink: '0',
          }">
            <PortalButton variant="secondary" :disabled="!scrolledToBottom" @click="rechazar()">
              <XCircle :size="15" /> No acepto
            </PortalButton>
            <PortalButton variant="primary" :disabled="!scrolledToBottom" @click="aceptar()">
              <CheckCircle :size="15" /> Aceptar autorizaciones
            </PortalButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
