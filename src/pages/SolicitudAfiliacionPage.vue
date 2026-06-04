<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
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
import ModalOtpEmail      from '@/components/forms/ModalOtpEmail.vue'
import SelectorFecha      from '@/components/forms/SelectorFecha.vue'
import ModalDireccion     from '@/components/forms/ModalDireccion.vue'
import SelectorDeptoMunicipio from '@/components/forms/SelectorDeptoMunicipio.vue'
import SelectorTipoTrabajador from '@/components/forms/SelectorTipoTrabajador.vue'
import SeccionFinanciera   from '@/components/forms/SeccionFinanciera.vue'
import CapturaDocumento from '@/components/forms/CapturaDocumento.vue'
import { useAfiliacion }  from '@/composables/useAfiliacion'
import { useBreakpoint }  from '@/composables/useBreakpoint'
import { subirDocumentoSolicitud, obtenerMensajeErrorSubidaDocumento } from '@/services/documentos.service'
import { IconCircleCheck, IconUserCheck, IconCheck, IconMapPin, IconX, IconUpload, IconEye, IconRefresh, IconFileDescription, IconLoader2, IconRotateClockwise2, IconHome, IconCar, IconShieldCheck, IconArrowRight } from '@tabler/icons-vue'
import { ENTIDADES_PENSIONES, TIPOS_CONTRATO } from '@/data/formularioCredito'

const router = useRouter()
const { isMobile } = useBreakpoint()

const opsPropiedadRaiz = [
  { value: 'Casa',            label: 'Casa'            },
  { value: 'Apartamento',     label: 'Apartamento'     },
  { value: 'Local Comercial', label: 'Local Comercial' },
  { value: 'Oficina',         label: 'Oficina'         },
  { value: 'Bodega',          label: 'Bodega'          },
  { value: 'Lote / Terreno',  label: 'Lote / Terreno'  },
]
const opsTipoProductoReferencia = [
  { value: 'Cta. Ahorros',    label: 'Cta. Ahorros'    },
  { value: 'Cta. Corriente',  label: 'Cta. Corriente'  },
  { value: 'CDT',             label: 'CDT'             },
  { value: 'Tarjeta Crédito', label: 'Tarjeta Crédito' },
  { value: 'Créditos',        label: 'Créditos'        },
]
const opsParentesco = [
  { value: 'Padre',         label: 'Padre'         },
  { value: 'Madre',         label: 'Madre'         },
  { value: 'Hijo(a)',       label: 'Hijo(a)'       },
  { value: 'Hermano(a)',    label: 'Hermano(a)'    },
  { value: 'Cónyuge',       label: 'Cónyuge'       },
  { value: 'Compañero(a)',  label: 'Compañero(a)'  },
  { value: 'Abuelo(a)',     label: 'Abuelo(a)'     },
  { value: 'Tío(a)',        label: 'Tío(a)'        },
  { value: 'Sobrino(a)',    label: 'Sobrino(a)'    },
  { value: 'Primo(a)',      label: 'Primo(a)'      },
  { value: 'Suegro(a)',     label: 'Suegro(a)'     },
  { value: 'Cuñado(a)',     label: 'Cuñado(a)'     },
  { value: 'Otro',          label: 'Otro'          },
]

const {
  paso, loading, error, solicitudCreada, asociadoExistente,
  erroresCampos, honeypot,
  emailInicial, errorEmail, borradorDisponible,
  tipoDocumentoInicial, numeroDocumentoInicial, errorNumeroDoc,
  aceptaAutorizacion, loadingVerificacion, mostrarModalYaAsociado,
  oficina, fechaSolicitud, tipoSolicitud,
  datosPersonales, datosLaborales,
  actividadIndependiente, datosFinancieros, activosPasivos,
  datosConyuge, referencias, declaraciones,
  documentos, firma,
  pasoValido, necesitaConyuge, esIndependiente,
  validarCampoActual, schemaPersonales,
  verificarYContinuar, restaurarBorrador, descartarBorrador,
  verificarCedula, irAPaso, enviarSolicitud,
} = useAfiliacion()

function normalizarStorageKey(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const documentosKey = computed(() => {
  const cedula = String(numeroDocumentoInicial.value || datosPersonales.value.cedula || '').trim()
  if (cedula) return `afiliacion_${normalizarStorageKey(cedula)}`
  const email = String(emailInicial.value || '').trim()
  if (email) return `afiliacion_${normalizarStorageKey(email)}`
  return 'afiliacion'
})

const soporteTitulo = computed(() =>
  datosLaborales.value.tipo_trabajador === 'empleado'
    ? 'Certificación laboral'
    : 'Certificación de ingresos'
)

const soporteDescripcion = computed(() =>
  datosLaborales.value.tipo_trabajador === 'empleado'
    ? 'Cargue su certificación laboral vigente en formato PDF'
    : 'Cargue su certificación de ingresos en formato PDF'
)

const soporteCargando = ref(false)
const soporteError = ref(null)
const modalSoporteVisible = ref(false)

async function onFileSoporte(e) {
  const archivo = e.target.files?.[0]
  e.target.value = ''
  if (!archivo) return
  soporteCargando.value = true
  soporteError.value = null
  try {
    const url = await subirDocumentoSolicitud(documentosKey.value, 'afiliacion_soporte_ingresos', archivo)
    documentos.value = { ...documentos.value, doc_soporte_ingresos_laboral_url: url }
  } catch (err) {
    soporteError.value = obtenerMensajeErrorSubidaDocumento(err)
  } finally {
    soporteCargando.value = false
  }
}

function quitarSoporte() {
  documentos.value = { ...documentos.value, doc_soporte_ingresos_laboral_url: '' }
  soporteError.value = null
}

function abrirSoporte() {
  if (!documentos.value.doc_soporte_ingresos_laboral_url) return
  modalSoporteVisible.value = true
}

function cerrarSoporte() {
  modalSoporteVisible.value = false
}

// ── Opciones ────────────────────────────────────────────────────────────────
const opsTipoDocVerificacion = [
  { value: 'cedula_ciudadania',  label: 'Cédula de ciudadanía'  },
  { value: 'cedula_extranjeria', label: 'Cédula de extranjería' },
]
const opsTipoDocumento = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
]
const opsEstadoCivil = [
  { value: 'Soltero',     label: 'Soltero(a)'   },
  { value: 'Casado',      label: 'Casado(a)'    },
  { value: 'Union Libre', label: 'Unión libre'  },
  { value: 'Viudo',       label: 'Viudo(a)'     },
  { value: 'Separado',    label: 'Separado(a)'  },
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
  { value: 'Primaria',          label: 'Primaria'                   },
  { value: 'Bachiller',         label: 'Bachiller'                  },
  { value: 'Tecnico Tecnologo', label: 'Técnico / Tecnológico'      },
  { value: 'Universitario',     label: 'Universitario / Pregrado'   },
  { value: 'Otro',              label: 'Especialización / Posgrado' },
]
const opsOcupacion = [
  { value: 'Empleado',      label: 'Empleado'      },
  { value: 'Jubilado',      label: 'Jubilado'      },
  { value: 'Pensionado',    label: 'Pensionado'    },
  { value: 'Independiente', label: 'Independiente' },
  { value: 'Otro',          label: 'Otro'          },
]
const opsTipoContrato = TIPOS_CONTRATO
const opsEntidadesPensiones = ENTIDADES_PENSIONES.map(e => ({ value: e, label: e }))
const opsInstitucionEducativa = [
  { value: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ', label: 'UNIVERSIDAD CATÓLICA LUIS AMIGÓ' },
]
const opsNivelEducativo = [
  { value: 'tecnico',         label: 'Técnico'                  },
  { value: 'tecnologico',     label: 'Tecnológico'              },
  { value: 'pregrado',        label: 'Pregrado / Universitario' },
  { value: 'especializacion', label: 'Especialización'          },
  { value: 'maestria',        label: 'Maestría'                 },
  { value: 'doctorado',       label: 'Doctorado'                },
]
const opsOficina = [
  { value: 'PRINCIPAL - MEDELLÍN', label: 'Principal — Medellín' },
]

const opsTipoSolicitud = [
  { value: 'afiliacion',          label: 'Afiliación' },
  { value: 'actualizacion_datos', label: 'Actualización de datos' },
]

const opsRH = [
  { value: 'A+',  label: 'A+'  }, { value: 'A-',  label: 'A-'  },
  { value: 'B+',  label: 'B+'  }, { value: 'B-',  label: 'B-'  },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+',  label: 'O+'  }, { value: 'O-',  label: 'O-'  },
]

const opsCanalesComunicacion = [
  { value: 'direccion_principal', label: 'Dirección principal' },
  { value: 'direccion_empresa',   label: 'Dirección empresa'   },
  { value: 'correo',              label: 'Correo electrónico'  },
  { value: 'sms',                 label: 'Mensajería SMS'      },
  { value: 'apps_web',            label: 'Aplicaciones o web'   },
  { value: 'llamada',             label: 'Llamada telefónica'   },
]

// ── Pasos del indicador (pasos 1-5, excluyendo 0 y 6) ──────────────────────
const pasos = computed(() => ([
  { label: 'Información general' },
  { label: 'Laboral y financiera' },
  { label: 'Cónyuge o', label2: necesitaConyuge ? 'compañero(a) permanente' : 'compañero(a) permanente — Omitido', headerJoin: true },
  { label: 'Referencias' },
  { label: 'Declaraciones y', label2: 'autorizaciones', noWrapLabel: true, headerJoin: true },
]))

// Estilos reutilizables
const estiloSeccionTitulo = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--fw-extrabold)',
  color: 'var(--color-text-1)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingBottom: 'var(--sp-sm)',
  borderBottom: '1px solid var(--color-border-card)',
  marginBottom: 'var(--sp-md)',
  marginTop: 'var(--sp-lg)',
}
const estiloSeccionTituloCentrado = (mobile) => ({
  ...estiloSeccionTitulo,
  textAlign: mobile ? 'center' : 'left',
})
const estiloSubtitulo = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--fw-extrabold)',
  color: 'var(--color-text-1)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingBottom: 'var(--sp-sm)',
  borderBottom: '1px solid var(--color-border-card)',
  marginBottom: 'var(--sp-md)',
  marginTop: 'var(--sp-lg)',
}
const estiloSubtituloCentrado = (mobile) => ({
  ...estiloSubtitulo,
  textAlign: mobile ? 'center' : 'left',
})
const estiloBloque = {
  background: 'var(--color-bg-card)',
  borderRadius: 'var(--r-md)',
  padding: 'var(--sp-lg)',
}
const grid2 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
  gap: 'var(--sp-lg)',
})
const grid3 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
  gap: 'var(--sp-lg)',
})
const grid4 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)',
  gap: 'var(--sp-lg)',
})
const grid3070 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '3fr 7fr',
  gap: 'var(--sp-lg)',
})
const gridFechaLugar = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 2fr',
  gap: 'var(--sp-lg)',
})
const grid207010 = (mobile) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? '1fr' : '15fr 60fr 25fr',
  gap: 'var(--sp-lg)',
})
const spanFull = { gridColumn: '1 / -1' }

const modalLugarNacimientoVisible = ref(false)
const tempLugarNacimiento = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })
const modalLugarExpedicionConyugeVisible = ref(false)
const tempLugarExpedicionConyuge = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })
const modalDireccionVisible = ref(false)
const modalDireccionNegocioVisible = ref(false)

const lugarNacimientoFormateado = computed(() => {
  const u = datosPersonales.value?.lugar_nacimiento_ubicacion
  if (!u?.municipio_nombre || !u?.depto_nombre) return datosPersonales.value?.lugar_nacimiento || ''
  return `${u.municipio_nombre} (${u.depto_nombre})`.toUpperCase()
})

const lugarExpedicionConyugeFormateado = computed(() => {
  const u = datosConyuge.value?.lugar_expedicion_ubicacion
  if (!u?.municipio_nombre || !u?.depto_nombre) return datosConyuge.value?.lugar_expedicion || ''
  return `${u.municipio_nombre} (${u.depto_nombre})`.toUpperCase()
})

const puedeGuardarLugarNacimiento = computed(() => {
  const u = tempLugarNacimiento.value
  return !!(u?.depto_codigo && u?.municipio_codigo)
})

const puedeGuardarLugarExpedicionConyuge = computed(() => {
  const u = tempLugarExpedicionConyuge.value
  return !!(u?.depto_codigo && u?.municipio_codigo)
})

const fechaSolicitudFormateada = computed(() => {
  const v = fechaSolicitud.value
  if (!v) return ''
  const [y, m, d] = String(v).split('-')
  if (!y || !m || !d) return String(v)
  return `${d}/${m}/${y}`
})

function abrirLugarNacimiento() {
  tempLugarNacimiento.value = { ...(datosPersonales.value?.lugar_nacimiento_ubicacion || {}) }
  modalLugarNacimientoVisible.value = true
}
function confirmarLugarNacimiento() {
  if (!puedeGuardarLugarNacimiento.value) return
  datosPersonales.value.lugar_nacimiento_ubicacion = { ...tempLugarNacimiento.value }
  datosPersonales.value.lugar_nacimiento = lugarNacimientoFormateado.value
  modalLugarNacimientoVisible.value = false
}

function abrirLugarExpedicionConyuge() {
  tempLugarExpedicionConyuge.value = { ...(datosConyuge.value?.lugar_expedicion_ubicacion || {}) }
  modalLugarExpedicionConyugeVisible.value = true
}
function confirmarLugarExpedicionConyuge() {
  if (!puedeGuardarLugarExpedicionConyuge.value) return
  datosConyuge.value.lugar_expedicion_ubicacion = { ...tempLugarExpedicionConyuge.value }
  datosConyuge.value.lugar_expedicion = lugarExpedicionConyugeFormateado.value
  modalLugarExpedicionConyugeVisible.value = false
}

function onConfirmarDireccion(preview) {
  datosPersonales.value.direccion = preview || datosPersonales.value.direccion
  const m = datosPersonales.value.direccion_residencia_modelo
  if (m?.barrio) datosPersonales.value.barrio = m.barrio
  if (m?.municipio_nombre) datosPersonales.value.ciudad = m.municipio_nombre
}

function onConfirmarDireccionNegocio(preview) {
  actividadIndependiente.value.direccion_negocio = preview || actividadIndependiente.value.direccion_negocio
}

function normalizarTextoUpper(v) {
  const raw = String(v ?? '')
  const cleaned = raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '').replace(/\s+/g, ' ').trim()
  return cleaned.toUpperCase()
}

function clampDigits(v, max) {
  const raw = String(v ?? '')
  const cleaned = raw.replace(/\D/g, '')
  if (!cleaned) return ''
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return ''
  return String(Math.min(Math.max(n, 1), max))
}

function toggleCanal(valor) {
  const arr = Array.isArray(datosPersonales.value.canales_comunicacion) ? [...datosPersonales.value.canales_comunicacion] : []
  const idx = arr.indexOf(valor)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(valor)
  datosPersonales.value.canales_comunicacion = arr
}

// ── Firma electrónica ────────────────────────────────────────────────────────
const firmaSolicitanteAplicada = computed(() => !!firma.value?.firma_hash)
const firmaCanvasRef = ref(null)
const firmaFileRef = ref(null)
const firmaArchivoNombre = ref('')
const _dibujandoFirma = ref(false)
const _firmaTrazoPrev = ref(null)
const _firmaCanvasCssHeight = 140
const firmaImagen = ref('')
const firmaMetodo = computed({
  get: () => firma.value?.firma_metodo ?? 'dibujar',
  set: (v) => { if (firma.value) firma.value.firma_metodo = v },
})

function _invalidarFirma() {
  if (!firma.value?.firma_hash) return
  firma.value.firma_hash = ''
  firma.value.firma_fecha_iso = ''
  firma.value.firma_nonce = ''
  firma.value.firma_user_agent = ''
  firma.value.firma_plataforma = ''
  firma.value.firma_idioma = ''
  firma.value.firma_timezone = ''
  firma.value.firma_resolucion = ''
  firma.value.firma_imagen_hash = ''
  firma.value.firma_transaccion_id = ''
  firma.value.firma_timestamp_servidor_iso = ''
  firma.value.firma_timestamp_servidor_unix = ''
  firma.value.firma_timestamp_fuente = ''
  firma.value.firma_ip_publica = ''
  firma.value.firma_dispositivo_tipo = ''
  firma.value.firma_sistema_operativo = ''
  firma.value.firma_navegador = ''
  firma.value.firma_geo_lat = ''
  firma.value.firma_geo_lon = ''
  firma.value.firma_geo_accuracy = ''
  firma.value.firma_doc_hash_sha256 = ''
  firma.value.firma_doc_hash_firmado_b64 = ''
  firma.value.firma_doc_firma_public_key_jwk = null
  firma.value.firma_doc_firma_alg = ''
}

function _canvasCtx() {
  const c = firmaCanvasRef.value
  if (!c) return null
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#111827'
  return ctx
}

function prepararCanvasFirma() {
  const c = firmaCanvasRef.value
  if (!c) return
  const rect = c.getBoundingClientRect()
  const cssW = Math.max(1, Math.round(rect.width))
  const cssH = Math.max(1, Math.round(rect.height || _firmaCanvasCssHeight))
  const dpr = window.devicePixelRatio || 1
  c.width = Math.round(cssW * dpr)
  c.height = Math.round(cssH * dpr)
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(12, cssH - 24)
  ctx.lineTo(cssW - 12, cssH - 24)
  ctx.stroke()
}

function _posEnCanvas(evt) {
  const c = firmaCanvasRef.value
  if (!c) return null
  const rect = c.getBoundingClientRect()
  const clientX = evt.touches?.[0]?.clientX ?? evt.clientX
  const clientY = evt.touches?.[0]?.clientY ?? evt.clientY
  const x = clientX - rect.left
  const y = clientY - rect.top
  return { x: Math.max(0, Math.min(rect.width, x)), y: Math.max(0, Math.min(rect.height, y)) }
}

function iniciarFirmaDibujo(evt) {
  if (firmaMetodo.value !== 'dibujar') return
  const p = _posEnCanvas(evt)
  const ctx = _canvasCtx()
  if (!p || !ctx) return
  if (ctx.lineWidth !== 2.2) {
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }
  _dibujandoFirma.value = true
  _firmaTrazoPrev.value = p
}

function moverFirmaDibujo(evt) {
  if (!_dibujandoFirma.value) return
  const p = _posEnCanvas(evt)
  const ctx = _canvasCtx()
  if (!p || !ctx || !_firmaTrazoPrev.value) return
  evt.preventDefault?.()
  ctx.beginPath()
  ctx.moveTo(_firmaTrazoPrev.value.x, _firmaTrazoPrev.value.y)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  _firmaTrazoPrev.value = p
}

function terminarFirmaDibujo() {
  if (!_dibujandoFirma.value) return
  _dibujandoFirma.value = false
  _firmaTrazoPrev.value = null
  const c = firmaCanvasRef.value
  if (!c) return
  const dataUrl = c.toDataURL('image/png')
  console.log('Firma terminada, dataUrl length:', dataUrl?.length)
  if (firma.value) {
    firma.value.firma_imagen_dataurl = dataUrl
    firmaImagen.value = dataUrl
  }
}

function limpiarFirmaDibujo() {
  const c = firmaCanvasRef.value
  if (!c) return
  prepararCanvasFirma()
  firmaImagen.value = ''
}

function _onResizeFirma() {
  if (!firma?.value) return
  if (firma.value.firma_metodo !== 'dibujar') return
  prepararCanvasFirma()
}

function prepararCanvasFirmaOnMount() {
  if (firmaMetodo.value === 'dibujar') {
    setTimeout(() => prepararCanvasFirma(), 100)
  }
}

async function _sha256Hex(texto) {
  const data = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function _sha256HexBuffer(buf) {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function _base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function _mimeDesdeDataUrl(dataUrl) {
  const m = /^data:([^;]+);/i.exec(String(dataUrl || ''))
  return m?.[1] ? String(m[1]).toLowerCase() : ''
}

async function _convertirDataUrlAPng(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    i.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, img.naturalWidth || img.width || 1)
  canvas.height = Math.max(1, img.naturalHeight || img.height || 1)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

async function _normalizarImagenParaPdf(dataUrl) {
  const mime = _mimeDesdeDataUrl(dataUrl)
  if (mime === 'image/jpeg' || mime === 'image/jpg') return { dataUrl, tipo: 'JPEG' }
  if (mime === 'image/png') return { dataUrl, tipo: 'PNG' }
  const png = await _convertirDataUrlAPng(dataUrl)
  return { dataUrl: png, tipo: 'PNG' }
}

async function _obtenerTimestampServidor() {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 1200)
  try {
    const res = await fetch('/', { method: 'HEAD', cache: 'no-store', signal: ctrl.signal })
    const dateHeader = res.headers.get('date') || ''
    const d = dateHeader ? new Date(dateHeader) : null
    if (!d || Number.isNaN(d.getTime())) return null
    return { iso: d.toISOString(), unix: String(Math.floor(d.getTime() / 1000)), fuente: 'http-date' }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function _obtenerInfoDispositivo() {
  const ua = navigator.userAgent || ''
  const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const tipo = esMovil ? 'movil' : 'desktop'
  const os = /Windows NT/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Linux/i.test(ua) ? 'Linux' : ''
  const navegador = /Edg\//i.test(ua) ? 'Edge' : /OPR\//i.test(ua) ? 'Opera' : /Chrome\//i.test(ua) && !/Edg\//i.test(ua) ? 'Chrome' : /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'Safari' : /Firefox\//i.test(ua) ? 'Firefox' : ''
  return { tipo, os, navegador }
}

async function _obtenerIpPublica() {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 1200)
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
    if (!res.ok) return ''
    const data = await res.json()
    return String(data?.ip || '')
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

async function _firmarHashDocumento(hashHex) {
  const bytes = new Uint8Array(hashHex.match(/.{1,2}/g)?.map(h => parseInt(h, 16)) || [])
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  const firmaBin = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    bytes
  )
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  return {
    alg: 'ECDSA-P256-SHA256',
    firmaB64: _base64FromArrayBuffer(firmaBin),
    publicKeyJwk: publicJwk,
  }
}

async function aplicarFirmaSolicitante() {
  const nombre = (firma.value.nombre_firma || '').trim()
  if (!nombre) return
  if (!firmaImagen.value) return
  const ahora = new Date().toISOString()
  const nonce = crypto.randomUUID()
  const transaccionId = crypto.randomUUID()
  const resolucion = `${window.screen.width}x${window.screen.height}`
  const disp = _obtenerInfoDispositivo()
  const selloTiempo = await _obtenerTimestampServidor()
  const ip = await _obtenerIpPublica()
  const imgHash = await _sha256Hex(firmaImagen.value)
  const base = [
    datosPersonales.value.cedula || '',
    nombre,
    ahora,
    nonce,
    transaccionId,
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    resolucion,
    firmaMetodo.value,
    imgHash,
  ].join('|')
  const hash = await _sha256Hex(base)
  const nuevo = {
    ...firma.value,
    nombre_firma: nombre,
    firma_metodo: firmaMetodo.value,
    firma_tipografia: '',
    firma_imagen_dataurl: firmaImagen.value,
    firma_imagen_hash: imgHash,
    firma_hash: hash,
    firma_fecha_iso: ahora,
    firma_nonce: nonce,
    firma_transaccion_id: transaccionId,
    firma_timestamp_servidor_iso: selloTiempo?.iso || '',
    firma_timestamp_servidor_unix: selloTiempo?.unix || '',
    firma_timestamp_fuente: selloTiempo?.fuente || '',
    firma_ip_publica: ip || '',
    firma_user_agent: navigator.userAgent || '',
    firma_plataforma: navigator.platform || '',
    firma_idioma: navigator.language || '',
    firma_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    firma_resolucion: resolucion,
    firma_dispositivo_tipo: disp.tipo || '',
    firma_sistema_operativo: disp.os || '',
    firma_navegador: disp.navegador || '',
    firma_geo_lat: '',
    firma_geo_lon: '',
    firma_geo_accuracy: '',
    firma_doc_hash_sha256: '',
    firma_doc_hash_firmado_b64: '',
    firma_doc_firma_public_key_jwk: null,
    firma_doc_firma_alg: '',
  }
  firma.value = nuevo

  try {
    const blob = await _generarPdfFormalizadoBlob()
    const buf = await blob.arrayBuffer()
    const docHash = await _sha256HexBuffer(buf)
    let firmaDoc = null
    try {
      firmaDoc = await _firmarHashDocumento(docHash)
    } catch { firmaDoc = null }
    firma.value = {
      ...firma.value,
      firma_doc_hash_sha256: docHash,
      firma_doc_hash_firmado_b64: firmaDoc?.firmaB64 || '',
      firma_doc_firma_public_key_jwk: firmaDoc?.publicKeyJwk || null,
      firma_doc_firma_alg: firmaDoc?.alg || '',
    }
  } catch {}
}

async function firmarYEnviar() {
  if (!firma.value.nombre_firma || !firmaImagen.value) return
  if (!firmaSolicitanteAplicada.value) {
    await aplicarFirmaSolicitante()
  }
  await enviarSolicitud()
}

async function _generarPdfFormalizadoBlob() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const colorPrimary = { r: 17, g: 76, b: 90 }
  const colorText = { r: 17, g: 24, b: 39 }
  const headerH = 34
  doc.setFillColor(colorPrimary.r, colorPrimary.g, colorPrimary.b)
  doc.rect(0, 0, pageW, 6, 'F')
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 6, pageW, headerH - 6, 'F')
  doc.setTextColor(colorText.r, colorText.g, colorText.b)
  doc.setFontSize(13)
  doc.text('Solicitud de afiliación', 14, 16)
  doc.setFontSize(9)
  doc.text(`Fecha: ${formatearFecha(fechaSolicitud.value)}`, pageW - 14, 14, { align: 'right' })
  let y = headerH + 10
  const x = 14
  const cardW = pageW - (x * 2)
  const cardPad = 8
  const r = 3
  const setFill = (c) => doc.setFillColor(c.r, c.g, c.b)
  const setDraw = (c) => doc.setDrawColor(c.r, c.g, c.b)
  const setText = (c) => doc.setTextColor(c.r, c.g, c.b)
  const nuevaPagina = () => {
    doc.addPage()
    setFill(colorPrimary)
    doc.rect(0, 0, pageW, 6, 'F')
    setFill({ r: 255, g: 255, b: 255 })
    doc.rect(0, 6, pageW, headerH - 6, 'F')
    setDraw({ r: 220, g: 227, b: 233 })
    doc.line(0, headerH, pageW, headerH)
    setText(colorText)
    doc.setFontSize(13)
    doc.text('Solicitud de afiliación', 14, 16)
    doc.setFontSize(9)
    doc.text(`Fecha: ${formatearFecha(fechaSolicitud.value)}`, pageW - 14, 14, { align: 'right' })
    y = headerH + 10
  }
  const card = (titulo, items) => {
    const colGap = 10
    const colW = (cardW - colGap) / 2
    const rows = []
    for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1]])
    const labelSize = 7
    const valueSize = 9.2
    const labelLH = 3.4
    const valueLH = 4.2
    const rowHeights = rows.map(([izq, der]) => {
      const leftLines = izq ? doc.splitTextToSize(String(izq.label).toUpperCase(), colW - 2) : []
      const rightLines = der ? doc.splitTextToSize(String(der.label).toUpperCase(), colW - 2) : []
      const leftValueLines = izq ? doc.splitTextToSize(izq.value, colW - 2) : []
      const rightValueLines = der ? doc.splitTextToSize(der.value, colW - 2) : []
      const labelLines = Math.max(leftLines.length, rightLines.length, 1)
      const valueLines = Math.max(leftValueLines.length, rightValueLines.length, 1)
      return 3 + (labelLines * labelLH) + 1 + (valueLines * valueLH) + 5
    })
    const contentH = rowHeights.reduce((a, b) => a + b, 0)
    const alto = 10 + contentH + cardPad + 4
    if (y + alto > pageH - 16) nuevaPagina()
    setFill({ r: 255, g: 255, b: 255 })
    setDraw({ r: 220, g: 227, b: 233 })
    doc.roundedRect(x, y, cardW, alto, r, r, 'FD')
    setFill({ r: 245, g: 247, b: 250 })
    doc.roundedRect(x, y, cardW, 10, r, r, 'F')
    setText(colorText)
    doc.setFontSize(10)
    doc.text(titulo, x + cardPad, y + 7)
    doc.setFontSize(9.2)
    let yy = y + 16
    for (let i = 0; i < rows.length; i++) {
      const [izq, der] = rows[i]
      const rowH = rowHeights[i]
      if (izq) {
        doc.setFontSize(labelSize)
        setText({ r: 107, g: 114, b: 128 })
        const labelLines = doc.splitTextToSize(String(izq.label).toUpperCase(), colW - 2)
        for (let j = 0; j < labelLines.length; j++) doc.text(labelLines[j], x + cardPad, yy + (j * labelLH))
        doc.setFontSize(valueSize)
        setText(colorText)
        const lines = doc.splitTextToSize(izq.value, colW - 2)
        for (let j = 0; j < lines.length; j++) doc.text(lines[j], x + cardPad, yy + (labelLines.length * labelLH) + 1 + (j * valueLH))
      }
      if (der) {
        doc.setFontSize(labelSize)
        setText({ r: 107, g: 114, b: 128 })
        const labelLines = doc.splitTextToSize(String(der.label).toUpperCase(), colW - 2)
        for (let j = 0; j < labelLines.length; j++) doc.text(labelLines[j], x + cardPad + colW + colGap, yy + (j * labelLH))
        doc.setFontSize(valueSize)
        setText(colorText)
        const lines = doc.splitTextToSize(der.value, colW - 2)
        for (let j = 0; j < lines.length; j++) doc.text(lines[j], x + cardPad + colW + colGap, yy + (labelLines.length * labelLH) + 1 + (j * valueLH))
      }
      yy += rowH
    }
    y += alto + 8
  }
  const personalesItems = [
    { label: 'Nombre', value: `${datosPersonales.value.nombres} ${datosPersonales.value.apellidos}` || '—' },
    { label: 'Cédula', value: datosPersonales.value.cedula || '—' },
    { label: 'Email', value: datosPersonales.value.email || '—' },
    { label: 'Teléfono', value: datosPersonales.value.telefono || '—' },
    { label: 'Celular', value: datosPersonales.value.celular || '—' },
    { label: 'Dirección', value: datosPersonales.value.direccion || '—' },
  ]
  card('Información personal', personalesItems)
  const laboralesItems = [
    { label: 'Tipo trabajador', value: datosLaborales.value.tipo_trabajador || '—' },
    { label: 'Empresa', value: datosLaborales.value.nombre_empresa || '—' },
    { label: 'Cargo', value: datosLaborales.value.cargo_oficio || '—' },
    { label: 'Salario', value: datosFinancieros.value.salario_mensual ? `$${Number(datosFinancieros.value.salario_mensual).toLocaleString()}` : '—' },
  ]
  card('Información laboral', laboralesItems)
  const firmaCardItems = [
    { label: 'Nombre firmado', value: firma.value.nombre_firma || '' },
    { label: 'Fecha firma', value: formatearFecha(firma.value.firma_fecha_iso || new Date().toISOString()) },
    { label: 'Método', value: firma.value.firma_metodo || '' },
    { label: 'Hash firma', value: firma.value.firma_hash || '' },
    { label: 'IP pública', value: firma.value.firma_ip_publica || '—' },
  ]
  card('Evidencia de firma', firmaCardItems)
  const img = firma.value.firma_imagen_dataurl || ''
  if (img) {
    const imgW = cardW
    const imgH = 28
    if (y + imgH + 10 > pageH - 16) nuevaPagina()
    setDraw({ r: 220, g: 227, b: 233 })
    setFill({ r: 255, g: 255, b: 255 })
    doc.roundedRect(x, y, imgW, imgH, r, r, 'FD')
    try {
      const norm = await _normalizarImagenParaPdf(img)
      doc.addImage(norm.dataUrl, norm.tipo, x + 6, y + 6, imgW - 12, imgH - 12)
    } catch {
      setText({ r: 107, g: 114, b: 128 })
      doc.setFontSize(8)
      doc.text('Firma (imagen no soportada)', x + 6, y + 16)
      setText(colorText)
      doc.setFontSize(9)
    }
    y += imgH + 8
  }
  return doc.output('blob')
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function cargarFirmaImagen(evt) {
  const file = evt?.target?.files?.[0]
  if (evt?.target) evt.target.value = ''
  if (!file) return
  firmaArchivoNombre.value = file.name || ''
  const reader = new FileReader()
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onerror = () => reject(new Error('Error leyendo la imagen'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
  try {
    const norm = await _normalizarImagenParaPdf(dataUrl)
    firmaImagen.value = norm.dataUrl
  } catch {
    firmaImagen.value = dataUrl
  }
}

function seleccionarFirmaArchivo() {
  firmaFileRef.value?.click?.()
}

// ── OTP: validación de correo ────────────────────────────────────────────────
const emailValidado    = ref(false)
const mostrarModalOtp  = ref(false)
const bannerRecuperadoVisible = ref(false)
const continuarDespuesOtp = ref(false)

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function onRestaurarBorrador() {
  try {
    restaurarBorrador()
    bannerRecuperadoVisible.value = true
    setTimeout(() => {
      bannerRecuperadoVisible.value = false
    }, 5000)
  } catch {
    bannerRecuperadoVisible.value = false
  }
}

function onDocumentoAreaClick() {
  if (emailValidado.value) return
  const email = emailInicial.value.trim()
  if (!email || !RE_EMAIL.test(email)) return
  if (import.meta.env.DEV) {
    emailValidado.value = true
    return
  }
  if (import.meta.env.VITE_SKIP_OTP === 'true') {
    emailValidado.value = true
    return
  }
  mostrarModalOtp.value = true
}

async function onOtpValidado() {
  emailValidado.value   = true
  mostrarModalOtp.value = false
  if (continuarDespuesOtp.value) {
    continuarDespuesOtp.value = false
    await verificarYContinuar()
  }
}

async function onVerificarYContinuarClick() {
  if (import.meta.env.DEV) {
    emailValidado.value = true
    continuarDespuesOtp.value = false
    await verificarYContinuar()
    return
  }
  if (!pasoValido.value) return
  if (!emailValidado.value) {
    if (import.meta.env.VITE_SKIP_OTP === 'true') {
      emailValidado.value = true
      continuarDespuesOtp.value = false
      await verificarYContinuar()
      return
    }
    continuarDespuesOtp.value = true
    onDocumentoAreaClick()
    return
  }
  continuarDespuesOtp.value = false
  await verificarYContinuar()
}

// Lifecycle para canvas de firma
onMounted(() => {
  window.addEventListener('resize', _onResizeFirma)
  prepararCanvasFirmaOnMount()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', _onResizeFirma)
})
</script>

<template>
  <PortalLayout>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 0: Verificación inicial                                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="paso === 0" class="paso0-container">

      <div :style="{ marginBottom: '40px' }">
        <div class="step-greeting-title">
          <span class="greeting-hi">¡Saludos!</span> <span class="greeting-sub">Comencemos con tu solicitud</span>
        </div>
      </div>

      <!-- Borrador disponible -->
      <template v-if="borradorDisponible">
        <div :style="{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-p-light)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-xl)',
          marginBottom: 'var(--sp-xl)',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }">
          <div :style="{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-p-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sp-md)',
            color: 'var(--color-primary)'
          }">
            <IconRotateClockwise2 :size="24" />
          </div>
          <div :style="{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-lg)',
            marginBottom: '4px'
          }">¡Hola de nuevo!</div>
          <div :style="{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-2)',
            fontWeight: 'var(--fw-medium)',
            marginBottom: 'var(--sp-xl)',
            lineHeight: '1.5'
          }">
            Encontramos una solicitud que empezaste anteriormente.<br>
            <strong>¿Te gustaría retomar desde donde quedaste?</strong>
          </div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }">
            <PortalButton variant="primary" :full="true" @click="onRestaurarBorrador">
              Sí, continuar mi solicitud
            </PortalButton>
            <button 
              @click="descartarBorrador"
              :style="{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-3)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer',
                padding: 'var(--sp-sm)',
                textDecoration: 'underline'
              }"
            >
              No, prefiero empezar de cero
            </button>
          </div>
        </div>
      </template>

      <!-- Formulario de verificación -->
      <template v-else>
        <div class="paso0-layout">

          <!-- Columna izquierda: campos -->
          <div class="paso0-fields">
            <CampoTexto
              v-model="emailInicial"
              label="1. Correo electrónico"
              type="email"
              placeholder="su.correo@ejemplo.com"
              required
              :error="errorEmail"
              @keyup.enter="onVerificarYContinuarClick"
            />

            <CampoSelect
              v-model="tipoDocumentoInicial"
              label="2. Tipo de documento"
              required
              :opciones="opsTipoDocVerificacion"
              @click="onDocumentoAreaClick"
            />

            <CampoTexto
              v-model="numeroDocumentoInicial"
              label="3. Número de documento"
              placeholder="Sin puntos ni espacios"
              required
              solo-numeros
              :maxlength="15"
              :error="errorNumeroDoc"
              @click="onDocumentoAreaClick"
            />

            <!-- Badge: correo verificado -->
            <div v-if="emailValidado" :style="{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-md)',
              borderRadius: 'var(--r-md)',
              background: 'var(--color-success-bg)',
            }">
              <IconCircleCheck :size="15" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
              <span :style="{
                fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                color: 'var(--color-success)',
              }">Correo electrónico verificado</span>
            </div>
          </div>

          <!-- Divisor vertical -->
          <div class="paso0-divider" aria-hidden="true"></div>

          <!-- Columna derecha: autorización + botón -->
          <div class="paso0-auth">
            <label :style="{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-sm)', cursor: 'pointer' }">
              <input
                type="checkbox"
                v-model="aceptaAutorizacion"
                class="auth-checkbox"
                :style="{
                  marginTop: '3px', flexShrink: '0', cursor: 'pointer',
                  accentColor: 'var(--color-primary)', width: '15px', height: '15px',
                }"
              />
              <span :style="{
                fontSize: 'var(--text-xs)', color: 'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)', lineHeight: '1.7',
              }">
                Autorizo a Cooperamigó para tratar mis datos personales con la finalidad de gestionar mi proceso de afiliación, contactarme y suministrarme información relacionada con los servicios y beneficios de la cooperativa.
                Asimismo, autorizo, cuando sea necesario, la consulta de mi información en operadores de información y riesgo, con el fin de validar mis datos.
                Declaro que conozco mis derechos como titular de la información. Igualmente, manifiesto que he leído y acepto los
                <a href="https://cooperamigo.coop/terminos-condiciones" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">Términos y condiciones</a>
                y la
                <a href="https://cooperamigo.coop/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer" :style="{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)', textDecoration: 'underline' }">Política de tratamiento de datos personales</a>.
              </span>
            </label>

            <button
              class="paso0-verify-btn"
              :disabled="!aceptaAutorizacion || !!errorEmail || !emailValidado || loadingVerificacion"
              @click="onVerificarYContinuarClick"
            >
              <span v-if="loadingVerificacion" class="paso0-spinner" />
              <template v-else>
                <span>Verificar y continuar</span>
                <span class="paso0-btn-circle"><IconArrowRight :size="14" /></span>
              </template>
            </button>
          </div>

        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASO 6: Éxito                                                       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-else-if="paso === 6" :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-md)',
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
      <PortalButton variant="primary" @click="router.push('/')">Volver al inicio</PortalButton>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PASOS 1–6: Formulario principal                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <div :style="{ width: '100%', margin: '0 auto', paddingTop: isMobile ? '0' : 'var(--sp-xl)' }">

        <!-- Banner: datos recuperados -->
        <div v-if="bannerRecuperadoVisible" :style="{
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--sp-sm)',
          padding:      'var(--sp-md) var(--sp-lg)',
          borderRadius: 'var(--r-md)',
          background:   'var(--color-success-bg)',
          marginBottom: 'var(--sp-lg)',
        }">
          <IconCircleCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
          <span :style="{
            fontSize:   'var(--text-sm)',
            color:      'var(--color-success-text)',
            fontWeight: 'var(--fw-semibold)',
          }">Sus datos anteriores fueron recuperados. Continúa desde donde lo dejó.</span>
        </div>

      <div :style="{ marginBottom: isMobile ? 'var(--sp-md)' : 'var(--sp-xl)' }">
        <div :style="{
          fontSize: isMobile ? 'var(--text-xs)' : 'var(--text-sm)',
          color: 'var(--color-text-2)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '0.02em',
          marginBottom: 'var(--sp-2xs)',
          textAlign: isMobile ? 'center' : 'right',
        }">SAR FT 001 V. 1.0 30/12/2025</div>

        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-2xl)',
          fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)',
          marginBottom: '2px',
          lineHeight: '1.1',
          textAlign: isMobile ? 'center' : 'left',
        }">Formato único de afiliación y/o conocimiento del asociado.</div>
      </div>

      <div :style="{ marginTop: paso !== 1 ? '56px' : '0' }">
        <StepIndicator :pasos="pasos" :actual="paso" />
      </div>

      <div :style="{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
      }">

        <div :style="{
          padding: 'var(--sp-md) var(--sp-xl)',
          background: 'var(--color-primary)',
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--fw-bold)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-sm)',
        }">
          <IconUserCheck :size="20" />
          <template v-if="pasos[paso - 1]?.headerJoin && pasos[paso - 1]?.label2">
            <div :style="{ whiteSpace: 'nowrap' }">{{ `${pasos[paso - 1]?.label} ${pasos[paso - 1]?.label2}` }}</div>
          </template>
          <div v-else :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }">
            <div :style="{ whiteSpace: 'nowrap' }">{{ pasos[paso - 1]?.label }}</div>
            <div v-if="pasos[paso - 1]?.label2">{{ pasos[paso - 1]?.label2 }}</div>
          </div>
        </div>

        <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-xl)' }">

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

          <AlertaBanner
            v-if="asociadoExistente"
            tipo="info"
            :mensaje="`Registro encontrado: ${asociadoExistente.nombres} ${asociadoExistente.apellidos}. Los datos han sido pre-llenados.`"
            :style="{ marginBottom: 'var(--sp-lg)' }"
          />

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Datos generales</div>
              <div :style="grid3(isMobile)">
                <CampoTexto
                  :model-value="fechaSolicitudFormateada"
                  label="Fecha solicitud"
                  required
                  disabled
                />
                <CampoSelect
                  v-model="oficina"
                  label="Oficina"
                  :opciones="opsOficina"
                  required
                />
                <CampoSelect
                  v-model="tipoSolicitud"
                  label="Tipo de solicitud"
                  :opciones="opsTipoSolicitud"
                  required
                />
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Información personal</div>
              <div :style="grid3(isMobile)">
                <CampoSelect
                  v-model="datosPersonales.tipo_identificacion"
                  label="Tipo documento"
                  :opciones="opsTipoDocumento"
                  required
                  disabled
                />
                <CampoTexto
                  v-model="datosPersonales.cedula"
                  label="No. Documento"
                  placeholder="Sin puntos ni espacios"
                  required
                  solo-numeros
                  :maxlength="15"
                  disabled
                />
                <CampoTexto
                  :model-value="datosPersonales.nombres"
                  label="Nombres completos"
                  placeholder="NOMBRES"
                  required
                  :disabled="!!asociadoExistente"
                  :error="erroresCampos.nombres"
                  @update:model-value="datosPersonales.nombres = normalizarTextoUpper($event)"
                />
                <CampoTexto
                  :model-value="datosPersonales.apellidos"
                  label="Apellidos completos"
                  placeholder="APELLIDOS"
                  required
                  :disabled="!!asociadoExistente"
                  :error="erroresCampos.apellidos"
                  @update:model-value="datosPersonales.apellidos = normalizarTextoUpper($event)"
                />
                <CampoSelect
                  v-model="datosPersonales.nivel_academico"
                  label="Nivel académico"
                  :opciones="opsNivelAcademico"
                  required
                />
                <CampoTexto
                  :model-value="datosPersonales.titulo"
                  label="Título académico"
                  placeholder="Ej. INGENIERO, TÉCNICO, ADMINISTRADOR"
                  required
                  @update:model-value="datosPersonales.titulo = normalizarTextoUpper($event)"
                />
                <div :style="spanFull">
                  <div :style="gridFechaLugar(isMobile)">
                    <SelectorFecha
                      :model-value="datosPersonales.fecha_expedicion"
                      label="Fecha expedición"
                      required
                      :max-year="new Date().getFullYear()"
                      @update:model-value="datosPersonales.fecha_expedicion = $event"
                    />
                    <SelectorFecha
                      :model-value="datosPersonales.fecha_nacimiento"
                      label="Fecha nacimiento"
                      required
                      :error="erroresCampos.fecha_nacimiento"
                      :max-year="new Date().getFullYear()"
                      @update:model-value="datosPersonales.fecha_nacimiento = $event"
                    />
                    <div :style="{ position: 'relative' }">
                      <CampoTexto
                        :model-value="lugarNacimientoFormateado"
                        label="Lugar de nacimiento"
                        placeholder="Seleccione municipio y departamento"
                        required
                        disabled
                      />
                      <button
                        type="button"
                        :style="{
                          position: 'absolute',
                          inset: '0',
                          background: 'transparent',
                          border: 'none',
                          padding: '0',
                          cursor: 'pointer',
                        }"
                        @click="abrirLugarNacimiento"
                        aria-label="Seleccionar lugar de nacimiento"
                      />
                    </div>
                  </div>
                </div>
                <CampoTexto
                  v-if="datosPersonales.tipo_identificacion === 'CE'"
                  v-model="datosPersonales.nacionalidad"
                  label="Nacionalidad"
                  placeholder="Nacionalidad"
                  required
                />
                <div :style="spanFull">
                  <div :style="grid4(isMobile)">
                    <CampoSelect
                      v-model="datosPersonales.estado_civil"
                      label="Estado civil"
                      :opciones="opsEstadoCivil"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.tipo_vivienda"
                      label="Tipo de vivienda"
                      :opciones="opsTipoVivienda"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.genero"
                      label="Sexo"
                      :opciones="opsGenero"
                      required
                    />
                    <CampoSelect
                      v-model="datosPersonales.rh"
                      label="RH"
                      :opciones="opsRH"
                      required
                    />
                  </div>
                </div>
                <div :style="spanFull">
                  <div :style="grid3070(isMobile)">
                    <CampoTexto
                      :model-value="datosPersonales.personas_a_cargo"
                      label="No. Personas a cargo"
                      placeholder="0"
                      required
                      solo-numeros
                      @update:model-value="datosPersonales.personas_a_cargo = String($event ?? '').replace(/\\D/g, '')"
                    />
                    <CampoTexto
                      :model-value="datosPersonales.personas_economicamente_activas"
                      label="No. Personas económicamente activas en el núcleo familiar"
                      placeholder="0"
                      required
                      solo-numeros
                      :label-wrap="isMobile"
                      @update:model-value="datosPersonales.personas_economicamente_activas = String($event ?? '').replace(/\\D/g, '')"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Contacto y residencia</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <div :style="grid2(isMobile)">
                  <CampoTexto
                    :model-value="emailInicial"
                    label="Correo electrónico personal"
                    type="email"
                    disabled
                  />
                  <CampoTexto
                    v-model="datosPersonales.otro_email"
                    label="Correo electrónico alternativo"
                    type="email"
                    placeholder="correo.alternativo@ejemplo.com"
                  />
                </div>
                <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-lg)' }">
                  <CampoTexto
                    v-model="datosPersonales.telefono"
                    label="Teléfono"
                    placeholder="Ej. 6044456789"
                    solo-numeros
                    :maxlength="10"
                    required
                  />
                  <CampoTexto
                    v-model="datosPersonales.celular"
                    label="Celular"
                    placeholder="Ej. 3001234567"
                    solo-numeros
                    :maxlength="10"
                    required
                  />
                </div>
                <div :style="{ position: 'relative' }">
                  <CampoTexto
                    :model-value="datosPersonales.direccion"
                    label="Dirección de residencia"
                    placeholder="Seleccione la dirección"
                    required
                    disabled
                  />
                  <button
                    type="button"
                    :style="{
                      position: 'absolute',
                      inset: '0',
                      background: 'transparent',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                    }"
                    @click="modalDireccionVisible = true"
                    aria-label="Seleccionar dirección de residencia"
                  />
                </div>
                <div :style="grid2(isMobile)">
                  <CampoTexto
                    :model-value="datosPersonales.estrato"
                    label="Estrato"
                    placeholder="1 – 6"
                    required
                    solo-numeros
                    @update:model-value="datosPersonales.estrato = clampDigits($event, 6)"
                  />
                  <CampoTexto
                    :model-value="datosPersonales.tiempo_residencia_meses"
                    label="Tiempo en la residencia (meses)"
                    placeholder="Ej. 24"
                    required
                    solo-numeros
                    @update:model-value="datosPersonales.tiempo_residencia_meses = String($event ?? '').replace(/\\D/g, '')"
                  />
                </div>
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Canales de comunicación</div>
              <div :style="grid3(isMobile)">
                <CampoCheck
                  v-for="op in opsCanalesComunicacion"
                  :key="op.value"
                  :model-value="Array.isArray(datosPersonales.canales_comunicacion) && datosPersonales.canales_comunicacion.includes(op.value)"
                  :label="op.label"
                  @update:model-value="() => toggleCanal(op.value)"
                />
              </div>
            </div>

            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Exposición política y pública</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
                  <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)' }">
                    ¿Administra recursos públicos?
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-md)' }">
                    <CampoCheck
                      :model-value="datosPersonales.administra_recursos_publicos === true"
                      label="Sí"
                      @update:model-value="() => { datosPersonales.administra_recursos_publicos = true }"
                    />
                    <CampoCheck
                      :model-value="datosPersonales.administra_recursos_publicos === false"
                      label="No"
                      @update:model-value="() => { datosPersonales.administra_recursos_publicos = false }"
                    />
                  </div>
                </div>

                <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">
                  <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)' }">
                    ¿Es persona expuesta públicamente (PEP)?
                  </div>
                  <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-md)' }">
                    <CampoCheck
                      :model-value="datosPersonales.persona_expuesta_publicamente === true"
                      label="Sí"
                      @update:model-value="() => { datosPersonales.persona_expuesta_publicamente = true }"
                    />
                    <CampoCheck
                      :model-value="datosPersonales.persona_expuesta_publicamente === false"
                      label="No"
                      @update:model-value="() => { datosPersonales.persona_expuesta_publicamente = false }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Teleport to="body">
            <Transition name="fade-modal">
              <div v-if="modalLugarNacimientoVisible" :style="{
                position: 'fixed', inset: '0', zIndex: '75',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--sp-lg)',
              }">
                <div :style="{
                  position: 'absolute', inset: '0',
                  background: 'rgba(23,43,54,0.55)',
                  backdropFilter: 'blur(3px)',
                }" @click="modalLugarNacimientoVisible = false" />

                <div
                  role="dialog"
                  aria-modal="true"
                  :style="{
                    position: 'relative', width: '100%', maxWidth: '640px',
                    background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex', flexDirection: 'column',
                  }"
                >
                  <div :style="{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--sp-xl) var(--sp-2xl)',
                    borderBottom: '1px solid var(--color-border-card)',
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
                      <div :style="{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }">
                        <IconMapPin :size="18" style="color: white;" />
                      </div>
                      <div>
                        <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                          Lugar de nacimiento
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                          Seleccione departamento y municipio
                        </div>
                      </div>
                    </div>
                    <button :style="{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
                      display: 'flex', alignItems: 'center',
                    }" @click="modalLugarNacimientoVisible = false">
                      <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
                    </button>
                  </div>

                  <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)' }">
                    <SelectorDeptoMunicipio
                      :model-value="tempLugarNacimiento"
                      required
                      @update:model-value="tempLugarNacimiento = $event"
                    />
                  </div>

                  <div :style="{
                    padding: 'var(--sp-lg) var(--sp-2xl)',
                    borderTop: '1px solid var(--color-border-card)',
                    display: 'flex',
                    gap: 'var(--sp-md)',
                    justifyContent: 'flex-end',
                  }">
                    <PortalButton variant="secondary" @click="modalLugarNacimientoVisible = false">Cancelar</PortalButton>
                    <PortalButton variant="primary" :disabled="!puedeGuardarLugarNacimiento" @click="confirmarLugarNacimiento">Guardar</PortalButton>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>

          <ModalDireccion
            :model-value="datosPersonales.direccion_residencia_modelo"
            :visible="modalDireccionVisible"
            @update:model-value="datosPersonales.direccion_residencia_modelo = $event"
            @update:visible="modalDireccionVisible = $event"
            @confirmar="onConfirmarDireccion"
          />
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 2: Laboral y financiera                                -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 2">
          <div :style="estiloSeccionTituloCentrado(isMobile)">Laboral y financiera</div>

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <SelectorTipoTrabajador v-model="datosLaborales.tipo_trabajador" />
            </div>

            <template v-if="datosLaborales.tipo_trabajador === 'empleado'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid3(isMobile)">
                  <div :style="spanFull">
                    <CampoTexto
                      v-model="datosLaborales.nombre_empresa"
                      label="Nombre de la empresa"
                      placeholder="Empresa donde trabaja"
                      required
                      @update:model-value="datosLaborales.nombre_empresa = normalizarTextoUpper($event)"
                    />
                  </div>
                  <CampoTexto
                    v-model="datosLaborales.cargo_oficio"
                    label="Cargo u oficio"
                    placeholder="Ej. Contador, Docente"
                    required
                    @update:model-value="datosLaborales.cargo_oficio = normalizarTextoUpper($event)"
                  />
                  <CampoSelectBuscable
                    v-model="datosLaborales.tipo_contrato"
                    label="Tipo de contrato"
                    :opciones="opsTipoContrato"
                    required
                  />
                  <template v-if="datosLaborales.tipo_contrato === 'otro'">
                    <CampoTexto
                      v-model="datosLaborales.tipo_contrato_otro"
                      label="¿Cuál?"
                      placeholder="Describe el tipo de contrato"
                      required
                      @update:model-value="datosLaborales.tipo_contrato_otro = normalizarTextoUpper($event)"
                    />
                  </template>
                  <SelectorFecha
                    v-model="datosLaborales.fecha_ingreso"
                    label="Fecha de inicio"
                    required
                  />
                </div>
              </div>
            </template>

            <template v-if="esIndependiente">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Actividad económica independiente</div>
                <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                  <div :style="grid207010(isMobile)">
                    <CampoTexto
                      v-model="actividadIndependiente.ciiu_1"
                      label="Código CIIU"
                      required
                    />
                    <CampoTexto
                      v-model="actividadIndependiente.descripcion_actividad_1"
                      label="Descripción de actividad comercial"
                      required
                      @update:model-value="actividadIndependiente.descripcion_actividad_1 = normalizarTextoUpper($event)"
                    />
                    <SelectorFecha
                      v-model="actividadIndependiente.fecha_inicio_actividad_1"
                      label="Fecha de inicio"
                      required
                    />
                  </div>

                  <div :style="grid207010(isMobile)">
                    <CampoTexto
                      v-model="actividadIndependiente.ciiu_2"
                      label="Código CIIU"
                    />
                    <CampoTexto
                      v-model="actividadIndependiente.descripcion_actividad_2"
                      label="Descripción de actividad comercial"
                      @update:model-value="actividadIndependiente.descripcion_actividad_2 = normalizarTextoUpper($event)"
                    />
                    <SelectorFecha
                      v-model="actividadIndependiente.fecha_inicio_actividad_2"
                      label="Fecha de inicio"
                    />
                  </div>

                  <div :style="grid2(isMobile)">
                    <div :style="{ width: '100%' }">
                      <div :style="{ position: 'relative' }">
                        <CampoTexto
                          :model-value="actividadIndependiente.direccion_negocio"
                          label="Dirección del establecimiento"
                          required
                          disabled
                        />
                        <button
                          type="button"
                          :style="{
                            position: 'absolute',
                            inset: '0',
                            background: 'transparent',
                            border: 'none',
                            padding: '0',
                            cursor: 'pointer',
                          }"
                          @click="modalDireccionNegocioVisible = true"
                          aria-label="Seleccionar dirección del establecimiento"
                        />
                      </div>
                    </div>

                    <CampoTexto
                      v-model="actividadIndependiente.telefono_negocio"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      required
                      solo-numeros
                    />
                  </div>
                </div>
              </div>

              <ModalDireccion
                :model-value="actividadIndependiente.direccion_negocio_modelo"
                :visible="modalDireccionNegocioVisible"
                @update:model-value="actividadIndependiente.direccion_negocio_modelo = $event"
                @update:visible="modalDireccionNegocioVisible = $event"
                @confirmar="onConfirmarDireccionNegocio"
              />
            </template>

            <template v-if="datosLaborales.tipo_trabajador === 'pensionado'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid2(isMobile)">
                  <CampoSelectBuscable
                    v-model="datosLaborales.entidad_pagadora"
                    label="Entidad pagadora"
                    required
                    :opciones="opsEntidadesPensiones"
                  />
                </div>
              </div>
            </template>

            <template v-if="datosLaborales.tipo_trabajador === 'estudiante'">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información laboral</div>
                <div :style="grid2(isMobile)">
                  <CampoSelectBuscable
                    v-model="datosLaborales.institucion_educativa"
                    label="Institución educativa"
                    required
                    :opciones="opsInstitucionEducativa"
                  />
                  <CampoSelectBuscable
                    v-model="datosLaborales.nivel_educativo"
                    label="Nivel educativo"
                    required
                    :opciones="opsNivelEducativo"
                  />
                </div>
              </div>
            </template>

            <template v-if="datosLaborales.tipo_trabajador">
              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Información financiera</div>
                <SeccionFinanciera
                  v-model="datosFinancieros"
                  :tipo-trabajador="datosLaborales.tipo_trabajador"
                  :mostrar-dependientes="false"
                />
              </div>

              <!-- ── Propiedad Raíz ─────────────────── -->
              <div :style="{ ...estiloBloque, background: 'var(--color-bg-card)', padding: 'var(--sp-xl)', borderRadius: 'var(--r-xl)' }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }">
                  <div :style="{ width: '40px', height: '40px', borderRadius: 'var(--r-md)', background: 'var(--color-bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
                    <IconHome :size="20" :style="{ color: activosPasivos.tiene_propiedad_raiz ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
                  </div>
                  <div :style="{ flex: 1 }">
                    <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">Propiedad raíz</div>
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }">Casa, apartamento, lote, finca o local.</div>
                  </div>
                  <label :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', cursor: 'pointer', userSelect: 'none' }">
                    <input type="checkbox" :checked="activosPasivos.tiene_propiedad_raiz" :style="{ display: 'none' }" @change="activosPasivos.tiene_propiedad_raiz = !activosPasivos.tiene_propiedad_raiz" />
                    <span :style="{ width: '42px', height: '24px', borderRadius: '999px', background: activosPasivos.tiene_propiedad_raiz ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background var(--transition-fast)' }">
                      <span :style="{ position: 'absolute', top: '3px', left: activosPasivos.tiene_propiedad_raiz ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }" />
                    </span>
                    <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: activosPasivos.tiene_propiedad_raiz ? 'var(--color-primary)' : 'var(--color-text-3)' }">{{ activosPasivos.tiene_propiedad_raiz ? 'Sí' : 'No' }}</span>
                  </label>
                </div>

                <div v-if="activosPasivos.tiene_propiedad_raiz" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                  <!-- Fila 1: Tipo y Matrícula -->
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--sp-md)' }">
                    <CampoSelectBuscable
                      v-model="activosPasivos.tipo_propiedad_raiz"
                      label="Tipo de propiedad"
                      :opciones="opsPropiedadRaiz"
                      required
                    />
                    <CampoTexto
                      v-model="activosPasivos.matricula_inmobiliaria"
                      label="Matrícula inmobiliaria"
                      placeholder="Número de matrícula"
                    />
                  </div>

                  <!-- Fila 2: Hipoteca (40%) y Valor (60%) -->
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '4fr 6fr', gap: 'var(--sp-md)', alignItems: 'end' }">
                    <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                      <label :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '4px', marginLeft: '16px' }">
                        ¿Tiene hipoteca? <span :style="{ color: 'var(--color-error)' }">*</span>
                      </label>
                      <div :style="{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }">
                        <CampoCheck
                          :model-value="activosPasivos.tiene_hipoteca === true"
                          label="Sí"
                          :style="{ flex: 1, height: '48px', justifyContent: 'center' }"
                          @update:model-value="activosPasivos.tiene_hipoteca = true"
                        />
                        <CampoCheck
                          :model-value="activosPasivos.tiene_hipoteca === false"
                          label="No"
                          :style="{ flex: 1, height: '48px', justifyContent: 'center' }"
                          @update:model-value="activosPasivos.tiene_hipoteca = false"
                        />
                      </div>
                    </div>
                    <CampoMoneda
                      v-model="activosPasivos.valor_propiedad_raiz"
                      label="Valor comercial"
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- ── Vehículo ─────────────────── -->
              <div :style="{ ...estiloBloque, background: 'var(--color-bg-card)', padding: 'var(--sp-xl)', borderRadius: 'var(--r-xl)', marginTop: 'var(--sp-lg)' }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }">
                  <div :style="{ width: '40px', height: '40px', borderRadius: 'var(--r-md)', background: 'var(--color-bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }">
                    <IconCar :size="20" :style="{ color: activosPasivos.tiene_vehiculo ? 'var(--color-primary)' : 'var(--color-text-3)' }" />
                  </div>
                  <div :style="{ flex: 1 }">
                    <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">Vehículo</div>
                    <div :style="{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }">Carro, moto o maquinaria.</div>
                  </div>
                  <label :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', cursor: 'pointer', userSelect: 'none' }">
                    <input type="checkbox" :checked="activosPasivos.tiene_vehiculo" :style="{ display: 'none' }" @change="activosPasivos.tiene_vehiculo = !activosPasivos.tiene_vehiculo" />
                    <span :style="{ width: '42px', height: '24px', borderRadius: '999px', background: activosPasivos.tiene_vehiculo ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background var(--transition-fast)' }">
                      <span :style="{ position: 'absolute', top: '3px', left: activosPasivos.tiene_vehiculo ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left var(--transition-fast)' }" />
                    </span>
                    <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: activosPasivos.tiene_vehiculo ? 'var(--color-primary)' : 'var(--color-text-3)' }">{{ activosPasivos.tiene_vehiculo ? 'Sí' : 'No' }}</span>
                  </label>
                </div>

                <div v-if="activosPasivos.tiene_vehiculo" :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 'var(--sp-md)' }">
                    <CampoTexto v-model="activosPasivos.marca_vehiculo" label="Marca" placeholder="Ej. Chevrolet" required uppercase />
                    <CampoTexto v-model="activosPasivos.modelo_vehiculo" label="Modelo" placeholder="Modelo/año" required uppercase />
                    <CampoTexto v-model="activosPasivos.placa_vehiculo" label="Placa" placeholder="ABC 123" required uppercase />
                  </div>
                  
                  <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '4fr 6fr', gap: 'var(--sp-md)', alignItems: 'end' }">
                    <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                      <label :style="{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: '4px', marginLeft: '16px' }">
                        ¿Está pignorado? <span :style="{ color: 'var(--color-error)' }">*</span>
                      </label>
                      <div :style="{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }">
                        <CampoCheck
                          :model-value="activosPasivos.esta_pignorado === true"
                          label="Sí"
                          :style="{ flex: 1, height: '48px', justifyContent: 'center' }"
                          @update:model-value="activosPasivos.esta_pignorado = true"
                        />
                        <CampoCheck
                          :model-value="activosPasivos.esta_pignorado === false"
                          label="No"
                          :style="{ flex: 1, height: '48px', justifyContent: 'center' }"
                          @update:model-value="activosPasivos.esta_pignorado = false"
                        />
                      </div>
                    </div>
                    <CampoMoneda v-model="activosPasivos.valor_vehiculo" label="Valor comercial" required />
                  </div>
                </div>
              </div>

              <div :style="estiloBloque">
                <div :style="{ ...estiloSubtitulo, marginTop: '0' }">Otras deudas</div>
                <div :style="grid2(isMobile)">
                  <CampoMoneda v-model="activosPasivos.total_pasivos" label="Total pasivos (Deudas)" required />
                  <CampoMoneda v-model="activosPasivos.cuota_mensual_deudas" label="Total cuota mensual" helper="¿Cuánto pagas por deudas cada mes?" required />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 3: Cónyuge / Compañero                                  -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 3">

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div v-if="necesitaConyuge" :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Datos del cónyuge / compañero(a)</div>
              <div :style="grid3(isMobile)">
                <CampoSelect
                  v-model="datosConyuge.tipo_identificacion"
                  label="Tipo de identificación"
                  :opciones="opsTipoDocumento"
                  required
                />
                <CampoTexto
                  v-model="datosConyuge.numero_identificacion"
                  label="Número de identificación"
                  placeholder="Sin puntos ni espacios"
                  solo-numeros
                  :maxlength="10"
                  required
                />
                <SelectorFecha
                  :model-value="datosConyuge.fecha_expedicion"
                  label="Fecha expedición"
                  required
                  :max-year="new Date().getFullYear()"
                  @update:model-value="datosConyuge.fecha_expedicion = $event"
                />
              </div>

              <div :style="{ marginTop: 'var(--sp-lg)' }" />

              <div :style="grid3(isMobile)">
                <div :style="{ position: 'relative' }">
                  <CampoTexto
                    :model-value="lugarExpedicionConyugeFormateado"
                    label="Lugar de expedición"
                    placeholder="Seleccione municipio y departamento"
                    required
                    disabled
                  />
                  <button
                    type="button"
                    :style="{
                      position: 'absolute',
                      inset: '0',
                      background: 'transparent',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                    }"
                    @click="abrirLugarExpedicionConyuge"
                    aria-label="Seleccionar lugar de expedición"
                  />
                </div>
                <CampoTexto
                  v-model="datosConyuge.nacionalidad"
                  label="Nacionalidad"
                  placeholder="Ej. Colombiana"
                  required
                  uppercase
                />
                <CampoTexto
                  v-model="datosConyuge.telefono"
                  label="Teléfono"
                  placeholder="Contacto/teléfono"
                  solo-numeros
                  :maxlength="10"
                  required
                />
              </div>

              <div :style="{ marginTop: 'var(--sp-lg)' }" />

              <div :style="grid2(isMobile)">
                <CampoTexto
                  :model-value="datosConyuge.nombres"
                  label="Nombres completos"
                  placeholder="Nombres"
                  required
                  @update:model-value="datosConyuge.nombres = $event.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()"
                />
                <CampoTexto
                  :model-value="datosConyuge.apellidos"
                  label="Apellidos completos"
                  placeholder="Apellidos"
                  required
                  @update:model-value="datosConyuge.apellidos = $event.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()"
                />
              </div>
            </div>

            <div
              v-else
              :style="{
                background: 'var(--color-bg-card)',
                borderBottom: '1px solid var(--color-border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-xl)',
                textAlign: 'center',
                color: 'var(--color-text-2)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--fw-medium)',
              }"
            >
              Usted ha indicado que su estado civil es <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">{{ datosPersonales.estado_civil || 'No informado' }}</span>. Por lo tanto, puede omitir este paso y continuar.
            </div>
          </div>

          <Teleport to="body">
            <Transition name="fade-modal">
              <div v-if="modalLugarExpedicionConyugeVisible" :style="{
                position: 'fixed', inset: '0', zIndex: '75',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--sp-lg)',
              }">
                <div :style="{
                  position: 'absolute', inset: '0',
                  background: 'rgba(23,43,54,0.55)',
                  backdropFilter: 'blur(3px)',
                }" @click="modalLugarExpedicionConyugeVisible = false" />

                <div
                  role="dialog"
                  aria-modal="true"
                  :style="{
                    position: 'relative', width: '100%', maxWidth: '640px',
                    background: 'var(--color-bg-card)', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex', flexDirection: 'column',
                  }"
                >
                  <div :style="{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--sp-xl) var(--sp-2xl)',
                    borderBottom: '1px solid var(--color-border-card)',
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  }">
                    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }">
                      <div :style="{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }">
                        <IconMapPin :size="18" style="color: white;" />
                      </div>
                      <div>
                        <div :style="{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', color: 'var(--color-text-1)', fontSize: 'var(--text-lg)' }">
                          Lugar de expedición
                        </div>
                        <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', fontWeight: 'var(--fw-medium)' }">
                          Seleccione departamento y municipio
                        </div>
                      </div>
                    </div>
                    <button :style="{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)',
                      display: 'flex', alignItems: 'center',
                    }" @click="modalLugarExpedicionConyugeVisible = false">
                      <IconX :size="20" :style="{ color: 'var(--color-text-3)' }" />
                    </button>
                  </div>

                  <div :style="{ padding: isMobile ? 'var(--sp-lg)' : 'var(--sp-2xl)' }">
                    <SelectorDeptoMunicipio
                      :model-value="tempLugarExpedicionConyuge"
                      required
                      @update:model-value="tempLugarExpedicionConyuge = $event"
                    />
                  </div>

                  <div :style="{
                    padding: 'var(--sp-lg) var(--sp-2xl)',
                    borderTop: '1px solid var(--color-border-card)',
                    display: 'flex',
                    gap: 'var(--sp-md)',
                    justifyContent: 'flex-end',
                  }">
                    <PortalButton variant="secondary" @click="modalLugarExpedicionConyugeVisible = false">Cancelar</PortalButton>
                    <PortalButton variant="primary" :disabled="!puedeGuardarLugarExpedicionConyuge" @click="confirmarLugarExpedicionConyuge">Guardar</PortalButton>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 4: Referencias                                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 4">

          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }">
            <div :style="estiloBloque">
              <div :style="{ ...estiloSubtituloCentrado(isMobile), marginTop: '0' }">Referencias</div>

              <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }">
                <!-- Referencia Personal -->
                <div>
                  <div :style="{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--sp-md)',
                  }">Personal</div>
                  <div :style="{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 'var(--sp-lg)',
                    alignItems: 'start',
                  }">
                    <CampoTexto
                      v-model="referencias.personal.nombres"
                      label="Nombres completos"
                      placeholder="Nombre completo"
                      required
                      uppercase
                    />
                    <CampoTexto
                      v-model="referencias.personal.contacto"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      solo-numeros
                      :maxlength="10"
                      required
                    />
                  </div>
                </div>

                <!-- Referencia Familiar -->
                <div>
                  <div :style="{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--sp-md)',
                  }">Familiar</div>
                  <div :style="{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                    gap: 'var(--sp-lg)',
                    alignItems: 'start',
                  }">
                    <CampoTexto
                      v-model="referencias.familiar.nombres"
                      label="Nombres completos"
                      placeholder="Nombre completo"
                      required
                      uppercase
                    />
                    <CampoSelect
                      v-model="referencias.familiar.parentesco"
                      label="Parentesco"
                      :opciones="opsParentesco"
                      required
                    />
                    <CampoTexto
                      v-model="referencias.familiar.contacto"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      solo-numeros
                      :maxlength="10"
                      required
                    />
                  </div>
                </div>

                <!-- Referencia Financiera -->
                <div>
                  <div :style="{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--sp-md)',
                  }">Financiera</div>
                  <div :style="{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 'var(--sp-lg)',
                    alignItems: 'start',
                  }">
                    <CampoTexto
                      v-model="referencias.financiera.nombre_establecimiento"
                      label="Nombre establecimiento"
                      placeholder="Nombre comercial"
                      uppercase
                    />
                    <CampoSelect
                      v-model="referencias.financiera.tipo_producto"
                      label="Tipo producto"
                      :opciones="opsTipoProductoReferencia"
                    />
                  </div>
                  <div :style="{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
                    gap: 'var(--sp-lg)',
                    alignItems: 'start',
                    marginTop: 'var(--sp-lg)',
                  }">
                    <CampoTexto
                      v-model="referencias.financiera.numero_cuenta"
                      label="No. cuenta"
                      placeholder="Número"
                      solo-numeros
                      :maxlength="20"
                    />
                    <CampoTexto
                      v-model="referencias.financiera.contacto"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      solo-numeros
                      :maxlength="10"
                    />
                  </div>
                </div>

                <!-- Referencia Comercial -->
                <div>
                  <div :style="{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--sp-md)',
                  }">Comercial</div>
                  <div :style="{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 'var(--sp-lg)',
                    alignItems: 'start',
                  }">
                    <CampoTexto
                      v-model="referencias.comercial.nombre_establecimiento"
                      label="Nombre establecimiento"
                      placeholder="Nombre comercial"
                      uppercase
                    />
                    <CampoTexto
                      v-model="referencias.comercial.contacto"
                      label="Contacto"
                      placeholder="Ej. 3001234567"
                      solo-numeros
                      :maxlength="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────── -->
        <!-- PASO 5: Declaraciones + Texto legal                          -->
        <!-- ─────────────────────────────────────────────────────────── -->
        <div v-if="paso === 5">

          <!-- ── Texto legal ────────────────────────────────────────── -->
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-xl)',
            marginBottom: 'var(--sp-xl)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-2)',
            lineHeight: '1.7',
            textAlign: 'justify',
            textJustify: 'inter-word',
          }">
            <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)', textAlign: 'left' }">
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
              contempladas en el Código Penal Colombiano, en el Sistema de Administración del Riesgo de Lavado de Activo y Financiamiento del Terrorismo <strong>(SARLAFT)</strong> o en cualquier norma que lo modifique o adicione.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              De igual modo, autorizo a COOPERAMIGÓ para verificar y reportar a las entidades competentes toda la información suministrada, declarando ser verídica y legal.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              Autorizo a COOPERAMIGÓ para que, con fines de información, consulte y reporte lo que se refiera al comportamiento financiero, crediticio y comercial en las centrales de riesgo.
            </p>
            <p :style="{ marginBottom: 'var(--sp-md)' }">
              De igual manera autorizo a COOPERAMIGÓ para tratar mis datos personales de acuerdo con la política establecida de <strong>HABEAS DATA</strong> y para los fines relacionados con su objeto social y, en especial, para los fines legales, contractuales y comerciales descritos en la política de tratamiento de la información, publicada en la página web <strong>www.cooperamigo.coop</strong>.
            </p>
            <p>
              Si se presentan cambios en los datos consignados, me obligo a informarlos oportunamente a COOPERAMIGÓ
              y actualizar al menos una vez al año los datos plasmados en esta solicitud de afiliación para asociados.
            </p>
            <div :style="{ marginTop: 'var(--sp-lg)' }">
              <p :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)', textAlign: 'left' }">
                ACLARACIONES
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Autorizo a destruir los documentos anexos solicitados a la solicitud, si vencidos treinta (30) días desde la notificación de su rechazo o aplazamiento, no los hubiere reclamado.
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Manifiesto que al momento de tomar este servicio gozo de buen estado de salud y no presento ninguna enfermedad preexistente. Autorizo a cualquier institución médica que me haya atendido a suministrar mi historia clínica o a la compañía aseguradora que ella asigne.
              </p>
              <p :style="{ marginBottom: 'var(--sp-md)' }">
                Manifiesto que acataré las leyes, estatutos, normas y reglamentos que rigen la Cooperativa. De igual forma acataré las decisiones que, en desarrollo de sus actividades, dicten los organismos encargados de dirección, administración y control.
              </p>
            </div>
          </div>

          <div :style="estiloSubtituloCentrado(isMobile)">Documentos requeridos</div>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)', marginBottom: 'var(--sp-xl)' }">
            <CapturaDocumento
              :solicitud-id="null"
              :storage-key="documentosKey"
              campo="afiliacion_cedula"
              label="Cédula de ciudadanía"
              :required="true"
              :initial-url="documentos.doc_cedula_solicitante_url"
              @completado="documentos.doc_cedula_solicitante_url = $event"
            />

            <div :style="{ border: '1px solid var(--color-border-card)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }">
              <div :style="{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-md)',
                padding: 'var(--sp-md) var(--sp-xl)',
                background: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
              }">
                <div :style="{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success)' : 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
                }">
                  <IconCircleCheck v-if="documentos.doc_soporte_ingresos_laboral_url" :size="18" :style="{ color: '#fff' }" />
                  <IconFileDescription v-else :size="18" :style="{ color: '#fff' }" />
                </div>
                <div :style="{ flex: '1', minWidth: '0' }">
                  <div :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)', fontSize: 'var(--text-base)' }">
                    {{ soporteTitulo }}<span v-if="!documentos.doc_soporte_ingresos_laboral_url" :style="{ marginLeft: '4px', color: 'var(--color-error)' }">*</span>
                  </div>
                  <div :style="{ fontSize: 'var(--text-sm)', color: documentos.doc_soporte_ingresos_laboral_url ? 'var(--color-success-text)' : 'var(--color-text-3)', fontWeight: 'var(--fw-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                    {{ documentos.doc_soporte_ingresos_laboral_url ? 'Documento cargado correctamente' : soporteDescripcion }}
                  </div>
                </div>

                <div v-if="soporteCargando" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }">
                  <IconLoader2 :size="16" class="spin" />
                </div>
                <div v-else-if="documentos.doc_soporte_ingresos_laboral_url" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexShrink: '0' }">
                  <button :style="{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-success)', background: 'white', color: 'var(--color-success-text)', borderRadius: 'var(--r-pill)', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', fontWeight: 'var(--fw-bold)' }" @click="abrirSoporte">
                    <IconEye :size="13" /> Visualizar
                  </button>
                  <button :style="{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-xs)', display: 'flex', color: 'var(--color-success-text)' }" @click="quitarSoporte">
                    <IconRefresh :size="16" />
                  </button>
                </div>
                <div v-else :style="{ flexShrink: '0' }">
                  <label :style="{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
                    padding: '6px 14px', borderRadius: 'var(--r-pill)',
                    border: '1px solid var(--color-border)', background: 'white',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-2)',
                  }">
                    <IconUpload :size="14" />Subir PDF
                    <input type="file" accept=".pdf" :style="{ display: 'none' }" @change="onFileSoporte" />
                  </label>
                </div>
              </div>

              <div v-if="soporteError" :style="{ padding: '6px var(--sp-xl)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid var(--color-error)' }">
                {{ soporteError }}
              </div>
            </div>
          </div>

          <!-- ── Acompañamiento de asesor ─────────────────────── -->
          <div :style="estiloSubtituloCentrado(isMobile)">Acompañamiento de asesor</div>
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-lg)',
            marginBottom: 'var(--sp-xl)',
          }">
            <div :style="{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : (declaraciones.tuvo_asesoria === true ? '1fr 70px 70px 140px' : '1fr 70px 70px'), 
              gap: 'var(--sp-md)', 
              alignItems: 'center' 
            }">
              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-semibold)' }">
                ¿Tuvo acompañamiento de un asesor para diligenciar la solicitud? *
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.tuvo_asesoria === true"
                  label="Sí"
                  @update:model-value="(v) => { declaraciones.tuvo_asesoria = v ? true : null; if (!v) declaraciones.codigo_asesor = '' }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.tuvo_asesoria === false"
                  label="No"
                  @update:model-value="(v) => { declaraciones.tuvo_asesoria = v ? false : null; if (v) declaraciones.codigo_asesor = '' }"
                />
              </div>
              <div v-if="declaraciones.tuvo_asesoria === true" :style="{ minWidth: '0' }">
                <CampoTexto
                  v-model="declaraciones.codigo_asesor"
                  label="Código del asesor"
                  placeholder="00000"
                  required
                  solo-numeros
                  :maxlength="5"
                />
              </div>
            </div>
          </div>

          <!-- ── Sección 10: Declaraciones SARLAFT ─────────────────── -->
          <div :style="estiloSubtituloCentrado(isMobile)">Declaraciones adicionales</div>
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-lg)',
            marginBottom: 'var(--sp-xl)',
          }">
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                1. ¿Manejo o he manejado dineros públicos de la nación, departamento, municipio o algún ente descentralizado?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.maneja_dinero_publico === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.maneja_dinero_publico = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.maneja_dinero_publico === false"
                  label="No"
                  @update:model-value="() => { declaraciones.maneja_dinero_publico = false }"
                />
              </div>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                2. ¿Soy contratista con el estado, departamento, municipio o algún ente descentralizado?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_contratista_estado === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.es_contratista_estado = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_contratista_estado === false"
                  label="No"
                  @update:model-value="() => { declaraciones.es_contratista_estado = false }"
                />
              </div>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 110px 110px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                3. ¿Actualmente soy líder comunitario o miembro de alta jerarquía en algún partido político?
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_lider_politico === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.es_lider_politico = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.es_lider_politico === false"
                  label="No"
                  @update:model-value="() => { declaraciones.es_lider_politico = false }"
                />
              </div>
            </div>
          </div>

          <!-- ── Autorización tratamiento de datos ──────────────────── -->
          <div :style="{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-xl)',
            transition: 'all var(--transition-fast)',
          }">
            <div :style="{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 90px 90px', gap: 'var(--sp-md)', alignItems: 'center' }">
              <div :style="{ fontSize: 'var(--text-base)', color: 'var(--color-text-1)', fontWeight: 'var(--fw-extrabold)', minWidth: '0' }">
                Autorizo el tratamiento de mis datos personales. *
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.autoriza_tratamiento_datos === true"
                  label="Sí"
                  @update:model-value="() => { declaraciones.autoriza_tratamiento_datos = true }"
                />
              </div>
              <div :style="{ minWidth: '0' }">
                <CampoCheck
                  :model-value="declaraciones.autoriza_tratamiento_datos === false"
                  label="No"
                  @update:model-value="() => { declaraciones.autoriza_tratamiento_datos = false }"
                />
              </div>
            </div>
          </div>

          <!-- 6. Firma electrónica de la solicitud -->
          <div :style="{ borderRadius: 'var(--r-lg)', border: '2px solid var(--color-primary)', overflow: 'hidden', marginTop: 'var(--sp-xl)' }">
            <div :style="{ padding: '10px var(--sp-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }">
              <IconShieldCheck :size="18" style="color: white;" />
              <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'white' }">Firma electrónica de la solicitud</span>
            </div>
            <div :style="{ padding: 'var(--sp-xl)', background: 'white', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }">

              <div :style="{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: '1.65', background: 'var(--color-bg-surface)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)', border: '1px solid var(--color-border-light)' }">
                Al firmar, certifica que la información proporcionada es veraz y autoriza a <strong>Cooperamigó</strong> para realizar las validaciones correspondientes.
              </div>

              <CampoTexto
                label="Nombre completo del solicitante"
                placeholder="TAL CUAL APARECE EN SU CÉDULA"
                :model-value="firma.nombre_firma"
                @update:model-value="firma.nombre_firma = $event"
              />

              <div :style="{ display: 'flex', gap: '6px', flexWrap: 'wrap' }">
                <button type="button" @click="firmaMetodo = 'dibujar'" :style="{ padding: '6px 10px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (firmaMetodo === 'dibujar' ? 'var(--color-primary)' : 'var(--color-border)'), background: firmaMetodo === 'dibujar' ? 'rgba(17,76,90,0.08)' : 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: firmaMetodo === 'dibujar' ? 'var(--color-primary)' : 'var(--color-text-2)' }">Firmar en pantalla</button>
                <button type="button" @click="firmaMetodo = 'subir'" :style="{ padding: '6px 10px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (firmaMetodo === 'subir' ? 'var(--color-primary)' : 'var(--color-border)'), background: firmaMetodo === 'subir' ? 'rgba(17,76,90,0.08)' : 'white', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: firmaMetodo === 'subir' ? 'var(--color-primary)' : 'var(--color-text-2)' }">Cargar firma</button>
              </div>

              <div v-if="firmaMetodo === 'dibujar'" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ border: '1px solid var(--color-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'white' }">
                  <canvas
                    ref="firmaCanvasRef"
                    width="720"
                    height="220"
                    :style="{ width: '100%', height: '140px', touchAction: 'none', display: 'block', cursor: 'crosshair' }"
                    @mousedown="iniciarFirmaDibujo"
                    @mousemove="moverFirmaDibujo"
                    @mouseup="terminarFirmaDibujo"
                    @mouseleave="terminarFirmaDibujo"
                    @touchstart.prevent="iniciarFirmaDibujo"
                    @touchmove.prevent="moverFirmaDibujo"
                    @touchend="terminarFirmaDibujo"
                  />
                </div>
                <div :style="{ display: 'flex', justifyContent: 'flex-end' }">
                  <PortalButton variant="secondary" @click="limpiarFirmaDibujo()">Limpiar</PortalButton>
                </div>
              </div>

              <div v-if="firmaMetodo === 'subir'" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ border: '1px dashed var(--color-border)', borderRadius: 'var(--r-md)', padding: '10px 12px', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-md)', flexWrap: 'wrap' }">
                  <div :style="{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }">
                    <div :style="{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Archivo de firma</div>
                    <div :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: firmaArchivoNombre ? 'var(--color-text-1)' : 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '100%' : '340px' }">
                      {{ firmaArchivoNombre || 'Cargue un archivo .png o .jpg con fondo preferiblemente blanco' }}
                    </div>
                  </div>
                  <PortalButton variant="secondary" @click="seleccionarFirmaArchivo()">Seleccionar archivo</PortalButton>
                  <input ref="firmaFileRef" type="file" accept="image/png,image/jpeg" :style="{ display: 'none' }" @change="cargarFirmaImagen" />
                </div>
                <div v-if="firmaImagen" :style="{ border: '1px solid var(--color-border)', borderRadius: 'var(--r-md)', padding: '10px', background: 'white', display: 'flex', flexDirection: 'column', gap: '6px' }">
                  <div :style="{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-3)', textTransform: 'uppercase' }">Previsualización</div>
                  <img :src="firmaImagen" alt="Previsualización de firma" :style="{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }" />
                </div>
              </div>

              <div v-if="firmaSolicitanteAplicada" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-md)', borderRadius: 'var(--r-md)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }">
                <IconCircleCheck :size="16" :style="{ color: 'var(--color-success)', flexShrink: '0' }" />
                <span :style="{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-success-text)' }">Firma registrada el {{ formatearFecha(firma.firma_fecha_iso) }}</span>
              </div>

              <PortalButton
                variant="primary"
                :full="true"
                :loading="loading"
                :disabled="!firma?.nombre_firma || !firmaImagen"
                @click="firmarYEnviar()"
              >
                <IconShieldCheck :size="16" style="display:inline-block;vertical-align:middle;margin-right:6px;" />
                Firmar y enviar solicitud
              </PortalButton>
            </div>
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
            v-if="paso < 5"
            variant="primary"
            :disabled="!pasoValido"
            :loading="loading"
            :full="isMobile"
            @click="irAPaso(paso + 1)"
          >
            Siguiente
          </PortalButton>
        </div>
      </div>
    </div>
  </div>
</template>

    <!-- Modal OTP -->
    <ModalOtpEmail
      v-if="mostrarModalOtp"
      :email="emailInicial"
      contexto="afiliacion"
      @validado="onOtpValidado"
    />

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
            borderRadius: isMobile ? 'var(--r-md) var(--r-md) 0 0' : 'var(--r-md)',
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
              }">¡Ya haces parte de Cooperamigó!</div>
              <div :style="{
                fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
                fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
              }">
                El documento <strong :style="{ color: 'var(--color-text-1)' }">{{ numeroDocumentoInicial }}</strong> ya está vinculado como asociado activo de nuestra Cooperativa.
                <br><br>
                Puedes comunicarte al correo electrónico <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">bienestarsocial@cooperamigo.coop</span> o al contacto <span :style="{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }">304 455 0161</span> para obtener más información.
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

    <Teleport to="body">
      <div v-if="modalSoporteVisible" :style="{ position: 'fixed', inset: '0', zIndex: '1000', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }">
        <div :style="{ width: 'min(980px, 96vw)', height: 'min(86vh, 920px)', background: 'white', borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-lg) var(--sp-xl)', borderBottom: '1px solid var(--color-border)' }">
            <div :style="{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-1)' }">{{ soporteTitulo }}</div>
            <button :style="{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }" @click="cerrarSoporte">
              <IconX :size="20" />
            </button>
          </div>
          <iframe :src="documentos.doc_soporte_ingresos_laboral_url" title="Vista previa del documento" :style="{ width: '100%', height: '100%', border: 'none', background: '#f5f5f5' }" />
        </div>
      </div>
    </Teleport>

  </PortalLayout>
</template>

<style scoped>
.auth-checkbox {
  appearance: none;
  -webkit-appearance: none;
  border: 1.5px solid var(--color-border-card);
  border-radius: 4px;
  background: #fff;
  position: relative;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.auth-checkbox:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.auth-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 1px;
  width: 5px;
  height: 8px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

@keyframes entrarModal {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.step-greeting-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--fw-extrabold);
  color: var(--color-text-1);
  line-height: 1.2;
  text-align: center;
}

.greeting-hi {
  color: var(--color-text-1);
}

.greeting-sub {
  color: var(--color-text-1);
  font-weight: var(--fw-medium);
}

@media (max-width: 480px) {
  .step-greeting-title {
    font-size: var(--text-lg);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .greeting-sub {
    white-space: nowrap;
  }
}

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
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ─── Paso 0: layout ─── */
.paso0-container {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.paso0-layout {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  padding: 0 var(--sp-xl);
}

.paso0-fields {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

.paso0-divider {
  display: none;
}

.paso0-auth {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

.paso0-verify-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 44px;
  border-radius: var(--r-pill);
  background: var(--color-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--fw-semibold);
  padding: 0 8px 0 28px;
  box-shadow: var(--shadow-btn);
  transition: all var(--transition-base);
}

.paso0-verify-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.paso0-verify-btn:not(:disabled):hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.paso0-verify-btn:not(:disabled):hover .paso0-btn-circle {
  transform: translateX(2px);
}

.paso0-btn-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.paso0-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.9);
  border-right-color: rgba(255, 255, 255, 0.25);
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .paso0-container {
    max-width: 780px;
  }

  .paso0-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
    padding: 0;
  }

  .paso0-fields {
    flex: 1;
    padding-right: 40px;
  }

  .paso0-divider {
    display: block;
    width: 1px;
    align-self: stretch;
    background: var(--color-border);
    flex-shrink: 0;
  }

  .paso0-auth {
    flex: 1;
    padding-left: 40px;
    justify-content: space-between;
  }

  .paso0-verify-btn {
    width: 260px;
    margin-left: calc(15px + var(--sp-sm));
  }
}
</style>
