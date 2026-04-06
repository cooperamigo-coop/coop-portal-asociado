<script setup>
import { ref } from 'vue'
import { IconX, IconCircleCheck, IconCircleX, IconFileDescription, IconChevronsDown } from '@tabler/icons-vue'

const props = defineProps({
  visible:  { type: Boolean, default: false },
  aceptado: { type: Boolean, default: false },
})
const emit = defineEmits(['update:visible', 'aceptar', 'rechazar'])

const scrollCompletado  = ref(false)
const porcentajeScroll  = ref(0)

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

        <div :style="{
          position:      'relative',
          width:         '100%',
          maxWidth:      '640px',
          maxHeight:     '92vh',
          background:    'var(--color-bg-card)',
          borderRadius:  'var(--r-2xl)',
          boxShadow:     'var(--shadow-modal)',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }">

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
                <div :style="{
                  fontFamily:  'var(--font-display)',
                  fontWeight:  'var(--fw-extrabold)',
                  color:       'var(--color-text-1)',
                  fontSize:    'var(--text-lg)',
                }">Autorizaciones y declaraciones</div>
                <div :style="{
                  fontSize:   'var(--text-sm)',
                  color:      'var(--color-text-3)',
                  fontWeight: 'var(--fw-medium)',
                }">COOPERATIVA MULTIACTIVA LUIS AMIGÓ — Cooperamigó</div>
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
            Desplace hasta el final del texto para habilitar los botones
          </div>

          <!-- Texto legal — scrolleable -->
          <div
            :style="{
              flex:       '1',
              overflowY:  'auto',
              padding:    'var(--sp-2xl)',
              fontSize:   'var(--text-base)',
              color:      'var(--color-text-2)',
              fontWeight: 'var(--fw-medium)',
              lineHeight: '1.8',
            }"
            @scroll="onScroll"
          >
            <!-- Sección 1 -->
            <p :style="{
              fontWeight:   'var(--fw-bold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">
              AUTORIZACIÓN PARA LA UTILIZACIÓN DE LOS DATOS PERSONALES
              Y PARA COMPARTIR INFORMACIÓN CON ALIADOS COMERCIALES Y DE CONVENIOS
            </p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Autorizo(amos) de manera expresa a la COOPERATIVA MULTIACTIVA LUIS AMIGÓ, en adelante
              "Cooperamigó" o a quien represente sus derechos u ostente en el futuro sus calidades
              para utilizar los datos que he(mos) suministrado, que llegue(mos) a suministrar o que
              llegue(mos) a obtener lícitamente de centrales u operadores de información para:
              i) Evaluación y aprobación de producto(s) y/o servicio(s).
              ii) Desarrollo de la relación contractual correspondiente a producto(s) y/o servicio(s).
              iii) Envío de información de novedades o cambios en los producto(s) y/o servicio(s).
              iv) Envío de información sobre eventos y realización de actos de promoción y publicidad.
              v) Actualización de datos.
              Asimismo, autorizo(amos) que dichos datos sean compartidos con sus aliados comerciales
              de servicios y convenios, con el fin de que me(nos) puedan ser ofrecidos otros productos
              y servicios. Para todos los fines anteriores, autorizo(amos) el uso de mi(nuestro) e-mail,
              direcciones electrónicas, contactos, SMS, redes sociales o medios similares.
            </p>

            <!-- Sección 2 -->
            <p :style="{
              fontWeight:   'var(--fw-bold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">DECLARACIÓN DE INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              En cumplimiento de las disposiciones legales, Ley 1581 de 2012 y Decreto 1377 de 2013,
              declaro(amos) que he(mos) sido informado(s) de manera clara y expresa de las finalidades
              con que se recopilan mis(nuestros) datos, del derecho a conocer, actualizar, corregir o
              suprimir la información entregada, así como que la Política de Tratamiento de Datos
              Personales de Cooperamigó se encuentra disponible en la página web www.cooperamigo.com.
              Asimismo, he(mos) sido informado(s) que en el evento en que no desee(mos) recibir
              información comercial o publicitaria proveniente de Cooperamigó o sus aliados comerciales,
              podré(mos) manifestarlo a través de cualquiera de los siguientes canales:
              datospersonales@cooperamigo.com, www.cooperamigo.com y oficina principal Cooperamigó
              ubicada en la Calle 50 No. 67 – 129 en Medellín.
            </p>

            <!-- Sección 3 -->
            <p :style="{
              fontWeight:   'var(--fw-bold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">
              AUTORIZACIÓN PARA CONSULTA Y REPORTE A CENTRALES Y/U OPERADORES DE INFORMACIÓN
            </p>
            <p :style="{
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-3)',
              marginBottom: 'var(--sp-sm)',
              fontStyle:  'italic',
            }">
              (Ley 1266 de 2008 y demás normas que la complementen, modifiquen, adicionen o sustituyan)
            </p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Autorizo(amos) a Cooperamigó y/o a quien en el futuro ostente la calidad de acreedor de
              la(s) obligación(es) por mi(nosotros) contraída(s) con Cooperamigó para que con fines
              estadísticos, de control, supervisión, desarrollo de herramientas que prevengan el fraude
              y de conocimiento de mi comportamiento financiero y crediticio por parte de los usuarios
              de la información y de información comercial, reporte a las centrales de información
              financiera y crediticia que operan en Colombia el nacimiento, modificación, extinción y
              cumplimiento o incumplimiento de la(s) obligación(es) contraída(s) con Cooperamigó.
              La presente autorización incluye la posibilidad de ser consultado en las centrales de
              información, así como de obtener las referencias comerciales necesarias que permitan a
              Cooperamigó tener un conocimiento adecuado sobre mi comportamiento en el desarrollo de
              las relaciones financieras, comerciales y/o de servicios. Adicionalmente,
              autorizo(amos) a Cooperamigó para solicitar, consultar y obtener mi información
              financiera, datos de seguridad social y parafiscales y/o datos personales que se
              encuentren en centrales u operadores de información, con el fin de evaluar mi(nuestra)
              solicitud y realizar mi(nuestro) perfilamiento. Lo anterior, sin perjuicio del
              cumplimiento de la obligación que me asiste de actualizar anualmente mis(nuestros)
              datos personales. La presente autorización estará vigente mientras no la revoque mediante
              comunicación escrita dirigida a Cooperamigó.
            </p>

            <!-- Sección 4 -->
            <p :style="{
              fontWeight:   'var(--fw-bold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">DECLARACIÓN DE RECEPCIÓN DE INFORMACIÓN</p>
            <p :style="{ marginBottom: 'var(--sp-xl)' }">
              Declaro(amos) que he(mos) recibido oportunamente de Cooperamigó los documentos
              relacionados a esta solicitud y otros contratos y que tales documentos han estado a
              mi(nuestra) disposición para consulta, correcciones y/o actualizaciones por lo que
              toda la información es veraz.
            </p>

            <!-- Sección 5 -->
            <p :style="{
              fontWeight:   'var(--fw-bold)',
              color:        'var(--color-text-1)',
              marginBottom: 'var(--sp-sm)',
              fontSize:     'var(--text-base)',
            }">AUTORIZACIÓN USO DE DATOS SENSIBLES</p>
            <p :style="{ marginBottom: 'var(--sp-2xl)' }">
              Autorizo(amos) a Cooperamigó para que utilice mi huella con el fin de dar trámite a
              lo solicitado y/o autorizado en este documento. Así mismo, declaro(amos) que
              conozco(emos) y acepto(amos) que por medio de mi(nuestra) huella estoy(amos) otorgando
              mi(nuestro) consentimiento y aceptación para la realización de los procesos solicitados
              y/o autorizados en este documento. Conozco(emos) que la huella corresponde a un dato
              sensible y que no estoy(amos) obligado(s) a autorizar su tratamiento.
            </p>

            <!-- Mensaje final -->
            <div :style="{
              padding:      'var(--sp-lg)',
              borderRadius: 'var(--r-xl)',
              background:   scrollCompletado ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
              border:       `1px solid ${scrollCompletado ? 'var(--color-success)' : 'var(--color-border)'}`,
              textAlign:    'center',
              transition:   'all var(--transition-base)',
            }">
              <div :style="{
                fontSize:   'var(--text-base)',
                fontWeight: 'var(--fw-semibold)',
                color:      scrollCompletado ? 'var(--color-success-text)' : 'var(--color-text-3)',
              }">
                {{ scrollCompletado
                  ? '✓ Ha leído el documento completo. Puede proceder al rechazo o aceptación de las autorizaciones.'
                  : 'Continúe desplazando para leer el documento completo.' }}
              </div>
            </div>
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
              v-if="!scrollCompletado"
              :style="{
                fontSize:   'var(--text-sm)',
                color:      'var(--color-text-3)',
                fontWeight: 'var(--fw-medium)',
                flex:       '1',
              }"
            >
              Desplace para leer ({{ porcentajeScroll }}%)
            </span>

            <!-- Botón No acepto -->
            <button
              :disabled="!scrollCompletado"
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
                color:        scrollCompletado ? 'var(--color-error-text)' : 'var(--color-text-3)',
                cursor:       scrollCompletado ? 'pointer' : 'not-allowed',
                opacity:      scrollCompletado ? '1' : '0.45',
                transition:   'all var(--transition-base)',
              }"
              @click="rechazar()"
            >
              <IconCircleX :size="15" /> No acepto
            </button>

            <!-- Botón Acepto -->
            <button
              :disabled="!scrollCompletado"
              :style="{
                display:      'flex',
                alignItems:   'center',
                gap:          'var(--sp-sm)',
                padding:      'var(--sp-sm) var(--sp-xl)',
                borderRadius: 'var(--r-pill)',
                border:       'none',
                background:   scrollCompletado ? 'var(--color-primary)' : 'var(--color-bg-surface-alt)',
                fontFamily:   'var(--font-body)',
                fontSize:     'var(--text-base)',
                fontWeight:   'var(--fw-bold)',
                color:        scrollCompletado ? 'var(--color-text-on-primary)' : 'var(--color-text-3)',
                cursor:       scrollCompletado ? 'pointer' : 'not-allowed',
                boxShadow:    scrollCompletado ? 'var(--shadow-btn)' : 'none',
                transition:   'all var(--transition-base)',
              }"
              @click="aceptar()"
            >
              <IconCircleCheck :size="15" /> Acepto las autorizaciones
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
