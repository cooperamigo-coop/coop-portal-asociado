<script setup>
import { ref, watch, nextTick } from 'vue'
import { IconX, IconCircleCheck, IconCircleX, IconFileDescription, IconChevronsDown } from '@tabler/icons-vue'

const props = defineProps({
  visible:  { type: Boolean, default: false },
  aceptado: { type: Boolean, default: false },
})
const emit = defineEmits(['update:visible', 'aceptar', 'rechazar'])

const scrollCompletado  = ref(false)
const porcentajeScroll  = ref(0)
const contenedorTexto = ref(null)

watch(() => props.visible, async (v) => {
  if (!v) return
  porcentajeScroll.value = 0
  scrollCompletado.value = !!props.aceptado
  await nextTick()
  if (contenedorTexto.value) contenedorTexto.value.scrollTop = 0
})

function onScroll(e) {
  const el = e.target
  const total = el.scrollHeight - el.clientHeight
  if (total <= 0) {
    scrollCompletado.value = true
    porcentajeScroll.value = 100
    return
  }
  const progreso = Math.round((el.scrollTop / total) * 100)
  porcentajeScroll.value = progreso
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
    scrollCompletado.value = true
    porcentajeScroll.value = 100
  } else {
    scrollCompletado.value = false
  }
}

function aceptar() {
  if (!scrollCompletado.value) return
  emit('aceptar')
  emit('update:visible', false)
}

function rechazar() {
  if (!scrollCompletado.value) return
  emit('rechazar')
  emit('update:visible', false)
}

function cerrar() {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-modal">
      <div v-if="visible" :style="{
        position: 'fixed', inset: '0', zIndex: '80',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-lg)',
      }">
        <div :style="{
          position: 'absolute', inset: '0',
          background: 'rgba(23,43,54,0.55)',
          backdropFilter: 'blur(3px)',
        }" @click="cerrar()" />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-auto-title"
          :style="{
            position:      'relative',
            width:         '100%',
            maxWidth:      '640px',
            maxHeight:     '92vh',
            background:    'var(--color-bg-card)',
            borderRadius:  'var(--r-lg)',
            boxShadow:     'var(--shadow-modal)',
            display:       'flex',
            flexDirection: 'column',
            overflow:      'hidden',
          }"
        >

          <!-- Header fijo -->
          <div :style="{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        'var(--sp-xl) var(--sp-2xl)',
            borderBottom:   '1px solid var(--color-border-card)',
            background:     'var(--color-bg-surface)',
            flexShrink:     '0',
          }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
              <div :style="{
                width:          '40px', height: '40px',
                borderRadius:   '50%',
                background:     'var(--color-primary)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     '0',
              }">
                <IconFileDescription :size="20" :style="{ color: '#fff' }" />
              </div>
              <div>
                <div id="modal-auto-title" :style="{
                  fontFamily:  'var(--font-display)',
                  fontWeight:  'var(--fw-medium)',
                  color:       'var(--color-text-1)',
                  fontSize:    'var(--text-lg)',
                }">Autorizaciones y declaraciones</div>
                <div :style="{
                  fontSize:   'var(--text-sm)',
                  color:      'var(--color-text-3)',
                  fontWeight: 'var(--fw-medium)',
                }">Solicitud de crédito - Cooperativa Multiactiva Luis Amigó</div>
              </div>
            </div>
            <button :style="{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center',
            }" @click="cerrar()">
              <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
            </button>
          </div>

          <!-- Barra de progreso de lectura -->
          <div :style="{ height: '3px', background: 'var(--color-border)', flexShrink: '0' }">
            <div :style="{
              height:       '100%',
              width:        porcentajeScroll + '%',
              background:   scrollCompletado ? 'var(--color-success)' : 'var(--color-primary)',
              borderRadius: 'var(--r-pill)',
              transition:   'width 0.2s ease',
            }" />
          </div>

          <!-- Aviso de lectura obligatoria -->
          <div
            v-if="!scrollCompletado"
            :style="{
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-sm)',
              padding:      'var(--sp-sm) var(--sp-2xl)',
              background:   'var(--color-warning-bg)',
              borderBottom: '1px solid var(--color-border)',
              flexShrink:   '0',
              fontSize:     'var(--text-sm)',
              color:        'var(--color-warning-text)',
              fontWeight:   'var(--fw-semibold)',
            }"
          >
            <IconChevronsDown :size="14" :style="{ flexShrink: '0' }" />
            Lea el contenido con atención y desplace hasta el final para aprobar o rechazar
          </div>

          <!-- Texto legal — scrolleable -->
          <div
            :style="{
              flex:       '1',
              overflowY:  'auto',
              padding:    'var(--sp-2xl)',
              fontSize:   'var(--text-base)',
              color:      'var(--color-text-2)',
              fontWeight: 'var(--fw-regular)',
              lineHeight: '1.45',
            }"
            ref="contenedorTexto"
            @scroll="onScroll"
          >
            <!-- Sección 1 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">
              AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
            </p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Autorizo(amos) de manera previa, expresa e informada a la COOPERATIVA MULTIACTIVA LUIS AMIGÓ – COOPERAMIGÓ (en adelante, “Cooperamigó”), o a quien represente sus derechos, para recolectar, almacenar, usar, circular, actualizar y suprimir los datos personales que he(mos) suministrado, que llegue(mos) a suministrar o que sean obtenidos lícitamente de terceros, para las siguientes finalidades:
            </p>
            <p :style="{ marginBottom: 'var(--sp-xs)', marginLeft: 'var(--sp-xl)' }">a) Evaluar y gestionar solicitudes de productos y/o servicios.</p>
            <p :style="{ marginBottom: 'var(--sp-xs)', marginLeft: 'var(--sp-xl)' }">b) Celebrar, ejecutar y administrar la relación contractual.</p>
            <p :style="{ marginBottom: 'var(--sp-xs)', marginLeft: 'var(--sp-xl)' }">c) Informar sobre novedades, cambios o aspectos relacionados con los productos y/o servicios.</p>
            <p :style="{ marginBottom: 'var(--sp-xs)', marginLeft: 'var(--sp-xl)' }">d) Realizar actividades comerciales, de mercadeo, promoción y publicidad.</p>
            <p :style="{ marginBottom: 'var(--sp-md)', marginLeft: 'var(--sp-xl)' }">e) Actualizar y verificar la información.</p>

            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Igualmente, autorizo(amos) a Cooperamigó para compartir mis(nuestros) datos personales con aliados comerciales, proveedores y entidades vinculadas, para que me(nos) ofrezcan productos y servicios relacionados con su actividad.
            </p>

            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Para las finalidades descritas, autorizo(amos) el contacto a través de correo electrónico, mensajes de texto (SMS), llamadas telefónicas, aplicaciones de mensajería, redes sociales y demás medios electrónicos o digitales.
            </p>

            <!-- Sección 2 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">DECLARACIÓN SOBRE EL TRATAMIENTO DE LA INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Declaro(amos) que he(mos) sido informado(s) de manera clara, suficiente y comprensible acerca de las finalidades del tratamiento de mis(nuestros) datos personales, así como de los derechos que me(nos) asisten para conocer, actualizar, rectificar y suprimir dicha información, y para revocar la presente autorización cuando sea procedente.
            </p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Así mismo, conozco(emos) que puedo(emos) consultar la política de tratamiento de datos personales de Cooperamigó en su sitio web y que existen canales habilitados para la atención de consultas, solicitudes y reclamos.
            </p>

            <!-- Sección 3 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">
              AUTORIZACIÓN PARA CONSULTA Y REPORTE A CENTRALES DE INFORMACIÓN
            </p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Autorizo(amos) de manera expresa e irrevocable a Cooperamigó, o a quien en el futuro ostente la calidad de acreedor, para que consulte, solicite, obtenga, reporte, procese y divulgue información relacionada con mi(nuestro) comportamiento financiero, comercial y crediticio ante centrales de información y demás operadores de datos.
            </p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Esta autorización comprende el reporte del nacimiento, modificación, cumplimiento o incumplimiento de las obligaciones adquiridas, así como la consulta de información necesaria para la evaluación del riesgo, validación de datos, prevención del fraude y conocimiento del perfil financiero.
            </p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              La autorización se mantendrá vigente mientras subsista la relación contractual y durante el tiempo necesario para las finalidades aquí previstas, salvo revocatoria en los casos legalmente procedentes.
            </p>

            <!-- Sección 4 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">NOTIFICACIÓN A CODEUDORES</p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Declaro(amos) que, en caso de aprobación de la solicitud de crédito, los codeudores relacionados serán contactados a través de los medios suministrados, con el fin de adelantar el proceso de validación, aceptación y firma de los documentos correspondientes, incluyendo el pagaré, plan de pagos y demás soportes contractuales.
            </p>

            <!-- Sección 5 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">DECLARACIÓN DE VERACIDAD Y RECEPCIÓN DE INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Declaro(amos) bajo la gravedad de juramento que la información suministrada es veraz, completa y verificable, y que ha sido entregada de manera voluntaria.
            </p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Así mismo, manifiesto(amos) haber recibido, leído y comprendido los documentos relacionados con la presente solicitud, los cuales han estado disponibles para su revisión, aclaración y/o modificación.
            </p>

            <!-- Sección 6 -->
            <p :style="{
              fontWeight:   'var(--fw-medium)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS SENSIBLES</p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Autorizo(amos) de manera expresa el tratamiento de datos sensibles, en particular la captura y uso de la huella dactilar, con el propósito de validación de identidad, autenticación y gestión de los trámites relacionados con la presente solicitud.
            </p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Declaro(amos) que he(mos) sido informado(s) de que el suministro de datos sensibles es facultativo y que no estoy(amos) obligado(s) a autorizar su tratamiento. No obstante, entiendo(emos) que su no autorización puede limitar la ejecución de algunos procesos asociados a la solicitud.
            </p>
          </div>

          <!-- Footer con botones — siempre visible, fuera del scroll -->
          <div :style="{
            padding:        'var(--sp-xl) var(--sp-2xl)',
            borderTop:      '1px solid var(--color-border-card)',
            background:     'var(--color-bg-surface)',
            flexShrink:     '0',
            display:        'flex',
            gap:            'var(--sp-md)',
            justifyContent: 'flex-end',
            alignItems:     'center',
          }">
            <span
              v-if="!scrollCompletado && !aceptado"
              :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-text-3)',
                fontWeight: 'var(--fw-medium)',
                flex:       '1',
              }"
            >
              Desplace para leer ({{ porcentajeScroll }}%)
            </span>

            <button
              v-if="aceptado"
              :style="{
                display:      'flex',
                alignItems:   'center',
                gap:          'var(--sp-sm)',
                padding:      'var(--sp-sm) var(--sp-xl)',
                borderRadius: 'var(--r-pill)',
                border:       '1px solid var(--color-border)',
                background:   'transparent',
                fontFamily:   'var(--font-body)',
                fontSize:     'var(--text-base)',
                fontWeight:   'var(--fw-semibold)',
                color:        'var(--color-error-text)',
                cursor:       'pointer',
                transition:   'all var(--transition-base)',
              }"
              @click="rechazar()"
            >
              <IconCircleX :size="15" /> Retirar aceptación
            </button>

            <template v-else>
              <button
                :disabled="!scrollCompletado"
                :style="{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--sp-sm)',
                  padding:      'var(--sp-sm) var(--sp-xl)',
                  borderRadius: 'var(--r-pill)',
                  border:       scrollCompletado ? 'none' : '1px solid var(--color-border)',
                  background:   scrollCompletado ? 'var(--color-primary)' : 'transparent',
                  fontFamily:   'var(--font-body)',
                  fontSize:     'var(--text-base)',
                  fontWeight:   'var(--fw-bold)',
                  color:        scrollCompletado ? 'var(--color-text-on-primary)' : 'var(--color-text-3)',
                  cursor:       scrollCompletado ? 'pointer' : 'not-allowed',
                  boxShadow:    scrollCompletado ? 'var(--shadow-btn)' : 'none',
                  opacity:      scrollCompletado ? '1' : '0.45',
                  transition:   'all var(--transition-base)',
                }"
                @click="aceptar()"
              >
                <IconCircleCheck :size="15" /> Acepto las autorizaciones
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
