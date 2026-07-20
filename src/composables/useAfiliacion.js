import { ref, computed } from 'vue'
import {
  buscarAsociadoPorCedula,
  crearAsociadoAfiliacion,
  crearSolicitudAfiliacion,
} from '@/services/afiliacion.service'
import { supabase } from '@/services/supabase'
import {
  buscarBorrador,
  guardarBorrador,
  eliminarBorrador,
} from '@/services/progreso.service'
import {
  schemaPersonales,
  validarCampo,
} from '@/schemas/portal.schemas'
import {
  sanitizarObjeto,
  envioDemasiadorapido,
  registrarInicioFormulario,
  verificarRateLimit,
  registrarIntento,
} from '@/utils/seguridad'
import { subirDocumentoSolicitud } from '@/services/documentos.service'

export function useAfiliacion() {
  const hoyIso = () => new Date().toISOString().slice(0, 10)
  const conTimeout = (promesa, ms, etiqueta = 'operación') => {
    return Promise.race([
      promesa,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout en ${etiqueta}`)), ms)
      }),
    ])
  }
  const paso = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const solicitudCreada = ref(null)
  const asociadoExistente = ref(null)
  const erroresCampos = ref({})
  const honeypot = ref('')

  // ── Paso 0: Verificación ──────────────────────────────────────────────────
  const emailInicial = ref('')
  const errorEmail = ref('')
  const borradorDisponible = ref(null)
  const tipoDocumentoInicial = ref('')
  const numeroDocumentoInicial = ref('')
  const errorNumeroDoc = ref('')
  const aceptaAutorizacion = ref(false)
  const loadingVerificacion = ref(false)
  const mostrarModalYaAsociado = ref(false)

  // ── Sección 1+2: Información Personal ────────────────────────────────────
  const datosPersonales = ref({
    tipo_identificacion: 'CC',
    cedula: '',
    nombres: '',
    apellidos: '',
    email: '',
    fecha_expedicion: '',
    nacionalidad: 'Colombiana',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    rh: '',
    titulo: '',
    personas_a_cargo: '',
    personas_economicamente_activas: '',
    telefono: '',
    celular: '',
    otro_email: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    estrato: '',
    tiempo_residencia_meses: '',
    estado_civil: '',
    tipo_vivienda: '',
    genero: '',
    nivel_academico: '',
    canales_comunicacion: [],
    administra_recursos_publicos: null,
    persona_expuesta_publicamente: null,
    lugar_nacimiento_ubicacion: { depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' },
    direccion_residencia_modelo: {
      depto_codigo: '', depto_nombre: '',
      municipio_codigo: '', municipio_nombre: '',
      via_principal: '', numero_via: '', letra_via: '', bis: false, cuadrante_via: '',
      numero_cruce: '', letra_cruce: '', numero_placa: '', cuadrante_cruce: '',
      complemento: '', barrio: '',
    },
  })

  // ── Sección 3: Información Laboral y Financiera ───────────────────────────
  const datosLaborales = ref({
    tipo_trabajador: '',

    nombre_empresa: '',
    cargo_oficio: '',
    tipo_contrato: '',
    tipo_contrato_otro: '',
    fecha_ingreso: '',

    entidad_pagadora: '',

    institucion_educativa: '',
    nivel_educativo: '',
  })

  // ── Sección 4: Actividad Independiente ────────────────────────────────────
  const actividadIndependiente = ref({
    ciiu_1: '',
    descripcion_actividad_1: '',
    fecha_inicio_actividad_1: '',
    ciiu_2: '',
    descripcion_actividad_2: '',
    fecha_inicio_actividad_2: '',
    direccion_negocio: '',
    telefono_negocio: '',
    direccion_negocio_modelo: {
      depto_codigo: '', depto_nombre: '',
      municipio_codigo: '', municipio_nombre: '',
      via_principal: '', numero_via: '', letra_via: '', bis: false, cuadrante_via: '',
      numero_cruce: '', letra_cruce: '', numero_placa: '', cuadrante_cruce: '',
      complemento: '', barrio: '',
    },
  })

  // ── Sección 5: Información Financiera ─────────────────────────────────────
  const datosFinancieros = ref({
    salario_ingresos_fijos: '',
    ingresos_independiente: '',
    gastos_familiares: '',
    otros_gastos: '',
    obligaciones_financieras: '',
    fuente_ingresos: '',
    mesada_pensional: '',
  })

  // ── Sección 6: Activos y Pasivos ──────────────────────────────────────────
  const activosPasivos = ref({
    tiene_propiedad_raiz: false,
    tipo_propiedad_raiz: '',
    matricula_inmobiliaria: '',
    tiene_hipoteca: null,
    valor_propiedad_raiz: '',
    
    tiene_vehiculo: false,
    marca_vehiculo: '',
    modelo_vehiculo: '',
    placa_vehiculo: '',
    esta_pignorado: null,
    valor_vehiculo: '',
    
    total_pasivos: '',
    cuota_mensual_deudas: '',
  })

  // ── Sección 7: Cónyuge / Compañero ───────────────────────────────────────
  const datosConyuge = ref({
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    nombres: '',
    apellidos: '',
    fecha_expedicion: '',
    lugar_expedicion: '',
    lugar_expedicion_ubicacion: null,
    nacionalidad: '',
    telefono: '',
  })

  // ── Sección 8: Referencias ────────────────────────────────────────────────
  const referencias = ref({
    personal:   { nombres: '', contacto: '' },
    familiar:   { nombres: '', contacto: '', parentesco: '' },
    financiera: { nombre_establecimiento: '', contacto: '', tipo_producto: '', numero_cuenta: '' },
    comercial:  { nombre_establecimiento: '', contacto: '' },
  })

  // ── Secciones 9 y 10: Declaraciones ──────────────────────────────────────
  const declaraciones = ref({
    maneja_dinero_publico: null,
    es_contratista_estado: null,
    es_lider_politico: null,
    autoriza_tratamiento_datos: null,
    fecha_autorizacion_datos: null,
    tuvo_asesoria: null,
    codigo_asesor: '',
  })

  const documentos = ref({
    doc_cedula_solicitante_url: '',
    doc_soporte_ingresos_laboral_url: '',
  })

  // ── Firma electrónica ──────────────────────────────────────────────────────
  const firma = ref({
    nombre_firma: '',
    firma_metodo: 'dibujar',
    firma_imagen_dataurl: '',
    firma_hash: '',
    firma_fecha_iso: '',
    firma_nonce: '',
    firma_user_agent: '',
    firma_plataforma: '',
    firma_idioma: '',
    firma_timezone: '',
    firma_resolucion: '',
    firma_imagen_hash: '',
    firma_transaccion_id: '',
    firma_timestamp_servidor_iso: '',
    firma_timestamp_servidor_unix: '',
    firma_timestamp_fuente: '',
    firma_ip_publica: '',
    firma_dispositivo_tipo: '',
    firma_sistema_operativo: '',
    firma_navegador: '',
    firma_geo_lat: '',
    firma_geo_lon: '',
    firma_geo_accuracy: '',
    firma_doc_hash_sha256: '',
    firma_doc_hash_firmado_b64: '',
    firma_doc_firma_public_key_jwk: null,
    firma_doc_firma_alg: '',
  })

  // Sección 1 encabezado
  const oficina = ref('PRINCIPAL - MEDELLÍN')
  const fechaSolicitud = ref(hoyIso())
  const tipoSolicitud = ref('afiliacion')

  registrarInicioFormulario('afiliacion')

  // ── Computed ──────────────────────────────────────────────────────────────
  const necesitaConyuge = computed(() => {
    const v = datosPersonales.value.estado_civil
    return ['Casado', 'Union Libre', 'Separado'].includes(v)
  })

  const vinculoConyuge = computed(() => {
    const v = datosPersonales.value.estado_civil
    if (v === 'Union Libre') return 'companero_permanente'
    if (v === 'Casado' || v === 'Separado') return 'conyuge'
    return ''
  })

  const esIndependiente = computed(() =>
    datosLaborales.value.tipo_trabajador === 'independiente'
  )

  const skipBloqueosLocal = computed(() => {
    if (!import.meta.env.DEV) return false
    try {
      const qs = new URLSearchParams(window.location.search)
      if (qs.get('skipValidacion') === '1') return true
      return window.localStorage.getItem('AFILIACION_SKIP_VALIDACION') === '1'
    } catch {
      return false
    }
  })

  const pasoValido = computed(() => {
    if (skipBloqueosLocal.value && paso.value !== 0) return true
    if (paso.value === 0) {
      const email = emailInicial.value.trim()
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      return !!(
        emailOk &&
        !errorEmail.value &&
        tipoDocumentoInicial.value &&
        numeroDocumentoInicial.value.trim().length >= 5 &&
        aceptaAutorizacion.value
      )
    }
    if (paso.value === 1) {
      const dp = datosPersonales.value
      const otroEmail = (dp.otro_email || '').trim().toLowerCase()
      const emailPrincipal = (emailInicial.value || '').trim().toLowerCase()
      if (otroEmail && otroEmail === emailPrincipal) return false
      return !!(
        fechaSolicitud.value &&
        oficina.value &&
        tipoSolicitud.value &&
        dp.cedula &&
        dp.nombres &&
        dp.apellidos &&
        dp.estado_civil &&
        dp.genero &&
        dp.fecha_nacimiento &&
        dp.fecha_expedicion &&
        dp.lugar_nacimiento &&
        dp.tipo_vivienda &&
        dp.rh &&
        dp.nivel_academico &&
        dp.personas_a_cargo !== '' &&
        dp.personas_economicamente_activas !== '' &&
        dp.direccion &&
        dp.estrato !== '' &&
        dp.tiempo_residencia_meses !== '' &&
        dp.celular &&
        dp.administra_recursos_publicos !== null &&
        dp.persona_expuesta_publicamente !== null &&
        Array.isArray(dp.canales_comunicacion) &&
        dp.canales_comunicacion.length > 0
      )
    }
    if (paso.value === 2) {
      const dl = datosLaborales.value
      const df = datosFinancieros.value
      if (!dl.tipo_trabajador) return false

      const ap = activosPasivos.value
      const activosOk = (
        (!ap.tiene_propiedad_raiz || (ap.tipo_propiedad_raiz && ap.tiene_hipoteca !== null && ap.valor_propiedad_raiz !== '')) &&
        (!ap.tiene_vehiculo || (ap.marca_vehiculo && ap.modelo_vehiculo && ap.esta_pignorado !== null && ap.valor_vehiculo !== '')) &&
        (ap.total_pasivos !== '' && ap.cuota_mensual_deudas !== '')
      )

      if (dl.tipo_trabajador === 'empleado') {
        const tipoContratoOk = dl.tipo_contrato && (dl.tipo_contrato !== 'otro' || dl.tipo_contrato_otro)
        const laboralOk = !!(dl.nombre_empresa && dl.cargo_oficio && tipoContratoOk && dl.fecha_ingreso)
        const financieroOk = df.salario_ingresos_fijos !== '' && df.gastos_familiares !== ''
        return laboralOk && financieroOk && activosOk
      }

      if (dl.tipo_trabajador === 'independiente') {
        const ai = actividadIndependiente.value
        const actividad2Parcial = !!(ai.ciiu_2 || ai.descripcion_actividad_2 || ai.fecha_inicio_actividad_2)
        const actividad2Ok = !actividad2Parcial || !!(ai.ciiu_2 && ai.descripcion_actividad_2 && ai.fecha_inicio_actividad_2)
        const laboralOk = !!(
          ai.ciiu_1 &&
          ai.descripcion_actividad_1 &&
          ai.fecha_inicio_actividad_1 &&
          ai.direccion_negocio &&
          ai.telefono_negocio
        ) && actividad2Ok
        const financieroOk = df.ingresos_independiente !== '' && df.gastos_familiares !== ''
        return laboralOk && financieroOk && activosOk
      }

      if (dl.tipo_trabajador === 'pensionado') {
        const laboralOk = !!dl.entidad_pagadora
        const financieroOk = df.mesada_pensional !== ''
        return laboralOk && financieroOk && activosOk
      }

      if (dl.tipo_trabajador === 'estudiante') {
        const laboralOk = !!(dl.institucion_educativa && dl.nivel_educativo)
        const financieroOk = df.salario_ingresos_fijos !== '' && !!df.fuente_ingresos
        return laboralOk && financieroOk && activosOk
      }

      if (dl.tipo_trabajador === 'cuidado_hogar') {
        const financieroOk = df.salario_ingresos_fijos !== '' && !!df.fuente_ingresos
        return financieroOk && activosOk
      }

      return false
    }
    if (paso.value === 3) {
      if (!necesitaConyuge.value) return true
      const dc = datosConyuge.value
      return !!(
        dc.tipo_identificacion &&
        dc.numero_identificacion &&
        dc.nombres &&
        dc.apellidos &&
        dc.fecha_expedicion &&
        dc.lugar_expedicion &&
        dc.nacionalidad &&
        dc.telefono
      )
    }
    if (paso.value === 4) {
      const r = referencias.value
      const filled = (v) => String(v ?? '').trim().length > 0
      return (
        filled(r.personal?.nombres) &&
        filled(r.personal?.contacto) &&
        filled(r.familiar?.nombres) &&
        filled(r.familiar?.parentesco) &&
        filled(r.familiar?.contacto)
      )
    }
    if (paso.value === 5) {
      const d = declaraciones.value
      const asesoriaValida = d.tuvo_asesoria === false || (d.tuvo_asesoria === true && String(d.codigo_asesor).length === 5)
      const skipDocs = import.meta.env.VITE_SKIP_DOCS === 'true'
      return (
        d.maneja_dinero_publico !== null &&
        d.es_contratista_estado !== null &&
        d.es_lider_politico !== null &&
        d.autoriza_tratamiento_datos === true &&
        asesoriaValida &&
        (skipDocs || String(documentos.value.doc_cedula_solicitante_url || '').trim().length > 0) &&
        (skipDocs || String(documentos.value.doc_soporte_ingresos_laboral_url || '').trim().length > 0)
      )
    }
    return true
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  function validarCampoActual(schema, campo, valor) {
    const errorMsg = validarCampo(schema, campo, valor)
    if (errorMsg) {
      erroresCampos.value = { ...erroresCampos.value, [campo]: errorMsg }
    } else {
      const copia = { ...erroresCampos.value }
      delete copia[campo]
      erroresCampos.value = copia
    }
  }

  // ── Paso 0: Verificación ──────────────────────────────────────────────────
  async function verificarYContinuar() {
    errorEmail.value = ''
    errorNumeroDoc.value = ''

    const email  = emailInicial.value.trim()
    const numDoc = numeroDocumentoInicial.value.trim()

    if (!email) { errorEmail.value = 'El correo electrónico es requerido'; return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEmail.value = 'Correo electrónico inválido'; return }
    const errCedula = validarCampo(schemaPersonales, 'cedula', numDoc)
    if (errCedula) { errorNumeroDoc.value = errCedula; return }

    loadingVerificacion.value = true
    await Promise.resolve()
    try {
      const existente = await conTimeout(
        buscarAsociadoPorCedula(numDoc),
        12000,
        'verificación de asociado'
      )
      if (existente) {
        mostrarModalYaAsociado.value = true
        return
      }
      const borrador = await conTimeout(
        buscarBorrador(email, 'afiliacion'),
        12000,
        'búsqueda de borrador'
      )
      const b = Array.isArray(borrador)
        ? (borrador.find(x => x && typeof x === 'object') ?? null)
        : (borrador && typeof borrador === 'object' ? borrador : null)

      if (b) {
        borradorDisponible.value = b
        return
      }

      borradorDisponible.value = null
      _prepararPaso1(email, numDoc)
    } catch {
      _prepararPaso1(email, numDoc)
    } finally {
      loadingVerificacion.value = false
    }
  }

  function _prepararPaso1(email, numDoc) {
    datosPersonales.value.email  = email
    datosPersonales.value.cedula = numDoc
    datosPersonales.value.tipo_identificacion =
      tipoDocumentoInicial.value === 'cedula_ciudadania' ? 'CC' : 'CE'
    paso.value = 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Borrador ──────────────────────────────────────────────────────────────
  function restaurarBorrador() {
    try {
      const raw = borradorDisponible.value
      const b = Array.isArray(raw) ? raw[0] : raw
      if (!b) return

      let d = b.datos ?? b.data ?? null
      if (typeof d === 'string') {
        try { d = JSON.parse(d) } catch { d = null }
      }
      d = d && typeof d === 'object' ? d : {}

      if (d.datosPersonales)        datosPersonales.value        = { ...datosPersonales.value,        ...d.datosPersonales }
      if (d.datosLaborales)         datosLaborales.value         = { ...datosLaborales.value,         ...d.datosLaborales }
      if (d.actividadIndependiente) actividadIndependiente.value = { ...actividadIndependiente.value, ...d.actividadIndependiente }
      if (d.datosFinancieros)       datosFinancieros.value       = { ...datosFinancieros.value,       ...d.datosFinancieros }
      if (d.activosPasivos)         activosPasivos.value         = { ...activosPasivos.value,         ...d.activosPasivos }
      if (d.datosConyuge)           datosConyuge.value           = { ...datosConyuge.value,           ...d.datosConyuge }
      if (d.referencias) {
        const r = d.referencias
        referencias.value = { ...referencias.value, ...r }
        if (r?.personal && typeof r.personal === 'object') {
          if (!referencias.value.personal.nombres && r.personal.nombre) referencias.value.personal.nombres = r.personal.nombre
          if (!referencias.value.personal.contacto && (r.personal.telefono || r.personal.contacto)) referencias.value.personal.contacto = r.personal.telefono || r.personal.contacto
        }
        if (r?.familiar && typeof r.familiar === 'object') {
          if (!referencias.value.familiar.nombres && r.familiar.nombre) referencias.value.familiar.nombres = r.familiar.nombre
          if (!referencias.value.familiar.contacto && (r.familiar.telefono || r.familiar.contacto)) referencias.value.familiar.contacto = r.familiar.telefono || r.familiar.contacto
          if (!referencias.value.familiar.parentesco && r.familiar.parentesco) referencias.value.familiar.parentesco = r.familiar.parentesco
        }
        if (r?.comercial && typeof r.comercial === 'object') {
          if (!referencias.value.comercial.nombre_establecimiento && r.comercial.nombre_establecimiento) referencias.value.comercial.nombre_establecimiento = r.comercial.nombre_establecimiento
          if (!referencias.value.comercial.contacto && (r.comercial.nombre_contacto || r.comercial.contacto)) referencias.value.comercial.contacto = r.comercial.nombre_contacto || r.comercial.contacto
        }
      }
      if (d.declaraciones)          declaraciones.value          = { ...declaraciones.value,          ...d.declaraciones }
      if (d.documentos)            documentos.value             = { ...documentos.value,             ...d.documentos }
      if (d.oficina)                oficina.value                = d.oficina
      if (d.fechaSolicitud)         fechaSolicitud.value         = d.fechaSolicitud
      if (d.tipoSolicitud)          tipoSolicitud.value          = d.tipoSolicitud

      if (b.email && !emailInicial.value.trim()) {
        emailInicial.value = String(b.email || '').trim()
      }

      datosPersonales.value.email = emailInicial.value.trim()
      datosPersonales.value.cedula = numeroDocumentoInicial.value.trim() || datosPersonales.value.cedula
      datosPersonales.value.tipo_identificacion =
        tipoDocumentoInicial.value === 'cedula_ciudadania' ? 'CC' : 'CE'

      if (!datosLaborales.value.tipo_trabajador) {
        const o = d?.datosLaborales?.ocupacion
        const map = {
          Empleado: 'empleado',
          Independiente: 'independiente',
          Pensionado: 'pensionado',
          Jubilado: 'pensionado',
        }
        if (o && map[o]) datosLaborales.value.tipo_trabajador = map[o]
      }
      if (datosLaborales.value.tipo_trabajador === 'empleado') {
        if (!datosLaborales.value.nombre_empresa && d?.datosLaborales?.empresa) datosLaborales.value.nombre_empresa = d.datosLaborales.empresa
        if (!datosLaborales.value.cargo_oficio && d?.datosLaborales?.cargo) datosLaborales.value.cargo_oficio = d.datosLaborales.cargo
        if (!datosLaborales.value.fecha_ingreso && d?.datosLaborales?.fecha_ingreso_empresa) datosLaborales.value.fecha_ingreso = d.datosLaborales.fecha_ingreso_empresa
      }
      if (datosLaborales.value.tipo_trabajador === 'pensionado' && !datosLaborales.value.entidad_pagadora && d?.datosLaborales?.entidad_pagadora) {
        datosLaborales.value.entidad_pagadora = d.datosLaborales.entidad_pagadora
      }
      if (!datosFinancieros.value.salario_ingresos_fijos && d?.datosLaborales?.salario) {
        datosFinancieros.value.salario_ingresos_fijos = d.datosLaborales.salario
      }
      if (!datosFinancieros.value.gastos_familiares && d?.datosFinancieros?.gastos_familiares) {
        datosFinancieros.value.gastos_familiares = d.datosFinancieros.gastos_familiares
      }
      if (!datosFinancieros.value.ingresos_independiente && d?.datosFinancieros?.otros_ingresos) {
        datosFinancieros.value.ingresos_independiente = d.datosFinancieros.otros_ingresos
      }
      if (!datosFinancieros.value.obligaciones_financieras && d?.datosFinancieros?.cuotas_credito) {
        datosFinancieros.value.obligaciones_financieras = d.datosFinancieros.cuotas_credito
      }

      borradorDisponible.value = null
      paso.value = b.paso_actual ?? b.paso ?? 1
      error.value = null
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      borradorDisponible.value = null
    }
  }

  function descartarBorrador() {
    datosPersonales.value.email  = emailInicial.value.trim()
    datosPersonales.value.cedula = numeroDocumentoInicial.value.trim()
    datosPersonales.value.tipo_identificacion =
      tipoDocumentoInicial.value === 'cedula_ciudadania' ? 'CC' : 'CE'
    borradorDisponible.value = null
    paso.value = 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function _guardarProgreso(pasoActual) {
    if (!emailInicial.value.trim()) return
    try {
      await guardarBorrador(emailInicial.value, 'afiliacion', pasoActual, {
        datosPersonales:        datosPersonales.value,
        datosLaborales:         datosLaborales.value,
        actividadIndependiente: actividadIndependiente.value,
        datosFinancieros:       datosFinancieros.value,
        activosPasivos:         activosPasivos.value,
        datosConyuge:           datosConyuge.value,
        referencias:            referencias.value,
        declaraciones:          declaraciones.value,
        documentos:             documentos.value,
        oficina:                oficina.value,
        fechaSolicitud:         fechaSolicitud.value,
        tipoSolicitud:          tipoSolicitud.value,
      })
    } catch {
      // silencioso — no interrumpir el flujo
    }
  }

  // ── Verificar cédula en paso 1 ────────────────────────────────────────────
  async function verificarCedula() {
    const cedula = datosPersonales.value.cedula
    const errorCedula = validarCampo(schemaPersonales, 'cedula', cedula)
    if (errorCedula) {
      erroresCampos.value = { ...erroresCampos.value, cedula: errorCedula }
      return
    }
    const copia = { ...erroresCampos.value }
    delete copia.cedula
    erroresCampos.value = copia
    if (cedula.length < 5) return
    try {
      const existente = await buscarAsociadoPorCedula(cedula)
      asociadoExistente.value = existente ?? null
      if (existente) {
        datosPersonales.value.nombres   = existente.nombres
        datosPersonales.value.apellidos = existente.apellidos
        if (!datosPersonales.value.titulo && existente.titulo) {
          datosPersonales.value.titulo = existente.titulo
        }
      }
    } catch {
      asociadoExistente.value = null
    }
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  function irAPaso(n) {
    if (n > paso.value) {
      _guardarProgreso(n)
    }
    paso.value = n
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Enviar solicitud ──────────────────────────────────────────────────────
  async function enviarSolicitud() {
    error.value = null

    if (honeypot.value !== '') return

    if (envioDemasiadorapido('afiliacion', 8)) {
      error.value = 'Por favor complete el formulario con atención.'
      return
    }

    if (!declaraciones.value.autoriza_tratamiento_datos) {
      error.value = 'Debe autorizar el tratamiento de sus datos personales para continuar.'
      return
    }

    const skipDocs = import.meta.env.VITE_SKIP_DOCS === 'true'
    if (!skipDocs && !String(documentos.value.doc_cedula_solicitante_url || '').trim()) {
      error.value = 'Debe cargar la cédula de ciudadanía para continuar.'
      return
    }
    if (!skipDocs && !String(documentos.value.doc_soporte_ingresos_laboral_url || '').trim()) {
      error.value = 'Debe cargar la certificación laboral o la certificación de ingresos para continuar.'
      return
    }

    const dp = datosPersonales.value
    if (!dp.nombres || dp.nombres.trim().length < 2) {
      error.value = 'El campo Nombres es muy corto. Ingrese el nombre completo.'
      return
    }
    if (!dp.apellidos || dp.apellidos.trim().length < 3) {
      error.value = 'El campo Apellidos es muy corto. Ingrese los apellidos completos.'
      return
    }

    const permitido = await verificarRateLimit(supabase, dp.cedula, 'afiliacion')
    if (!permitido) {
      error.value = 'Ha alcanzado el límite de solicitudes para este documento. Intente después de 24 horas.'
      return
    }

    loading.value = true
    try {
      let asociadoId

      if (asociadoExistente.value) {
        asociadoId = asociadoExistente.value.id
      } else {
        const dl = datosLaborales.value
        const df = datosFinancieros.value

        const tipoContratoFinal = dl.tipo_contrato === 'otro'
          ? (dl.tipo_contrato_otro || null)
          : (dl.tipo_contrato || null)

        const salarioLegacy = (() => {
          if (dl.tipo_trabajador === 'pensionado') return df.mesada_pensional !== '' ? Number(df.mesada_pensional) : null
          if (dl.tipo_trabajador === 'independiente') return df.ingresos_independiente !== '' ? Number(df.ingresos_independiente) : null
          return df.salario_ingresos_fijos !== '' ? Number(df.salario_ingresos_fijos) : null
        })()

        const datosAsociado = sanitizarObjeto({
          // Personal
          tipo_identificacion:             dp.tipo_identificacion,
          cedula:                          dp.cedula,
          nombres:                         dp.nombres,
          apellidos:                       dp.apellidos,
          email:                           emailInicial.value.trim(),
          fecha_expedicion:                dp.fecha_expedicion     || null,
          nacionalidad:                    dp.nacionalidad         || null,
          fecha_nacimiento:                dp.fecha_nacimiento     || null,
          lugar_nacimiento:                dp.lugar_nacimiento     || null,
          rh:                              dp.rh                   || null,
          titulo:                          dp.titulo               || null,
          personas_a_cargo:                dp.personas_a_cargo !== '' ? Number(dp.personas_a_cargo) : null,
          personas_economicamente_activas: dp.personas_economicamente_activas !== '' ? Number(dp.personas_economicamente_activas) : null,
          telefono:                        dp.telefono             || null,
          celular:                         dp.celular              || null,
          otro_email:                      dp.otro_email           || null,
          direccion:                       dp.direccion            || null,
          barrio:                          dp.barrio               || null,
          ciudad:                          dp.ciudad               || null,
          estrato:                         dp.estrato !== '' ? Number(dp.estrato) : null,
          tiempo_residencia_meses:         dp.tiempo_residencia_meses !== '' ? Number(dp.tiempo_residencia_meses) : null,
          estado_civil:                    dp.estado_civil         || null,
          tipo_vivienda:                   dp.tipo_vivienda        || null,
          genero:                          dp.genero               || null,
          nivel_academico:                 dp.nivel_academico      || null,
          administra_recursos_publicos:    dp.administra_recursos_publicos === true,
          persona_expuesta_publicamente:   dp.persona_expuesta_publicamente === true,
          // Laboral (nuevo + legacy)
          tipo_trabajador:                 dl.tipo_trabajador || null,
          empresa:                         dl.tipo_trabajador === 'empleado' ? (dl.nombre_empresa || null) : null,
          cargo:                           dl.tipo_trabajador === 'empleado' ? (dl.cargo_oficio || null) : null,
          tipo_contrato:                   dl.tipo_trabajador === 'empleado' ? tipoContratoFinal : null,
          fecha_ingreso_empresa:           dl.tipo_trabajador === 'empleado' ? (dl.fecha_ingreso || null) : null,
          entidad_pagadora:                dl.tipo_trabajador === 'pensionado' ? (dl.entidad_pagadora || null) : null,
          institucion_educativa:           dl.tipo_trabajador === 'estudiante' ? (dl.institucion_educativa || null) : null,
          nivel_educativo:                 dl.tipo_trabajador === 'estudiante' ? (dl.nivel_educativo || null) : null,
          // Financiero (nuevo + legacy)
          salario_ingresos_fijos:          df.salario_ingresos_fijos !== '' ? Number(df.salario_ingresos_fijos) : null,
          ingresos_independiente:          df.ingresos_independiente !== '' ? Number(df.ingresos_independiente) : null,
          gastos_familiares:               df.gastos_familiares !== '' ? Number(df.gastos_familiares) : null,
          otros_gastos:                    df.otros_gastos !== '' ? Number(df.otros_gastos) : null,
          obligaciones_financieras:        df.obligaciones_financieras !== '' ? Number(df.obligaciones_financieras) : null,
          fuente_ingresos:                 df.fuente_ingresos || null,
          mesada_pensional:                df.mesada_pensional !== '' ? Number(df.mesada_pensional) : null,
          salario:                         salarioLegacy,
          otros_ingresos:                  df.ingresos_independiente !== '' ? Number(df.ingresos_independiente) : null,
          cuotas_credito:                  df.obligaciones_financieras !== '' ? Number(df.obligaciones_financieras) : null,
          // JSONB
          actividad_independiente:         esIndependiente.value
            ? {
              ciiu_1: actividadIndependiente.value.ciiu_1,
              descripcion_actividad_1: actividadIndependiente.value.descripcion_actividad_1,
              fecha_inicio_actividad_1: actividadIndependiente.value.fecha_inicio_actividad_1,
              ciiu_2: actividadIndependiente.value.ciiu_2,
              descripcion_actividad_2: actividadIndependiente.value.descripcion_actividad_2,
              fecha_inicio_actividad_2: actividadIndependiente.value.fecha_inicio_actividad_2,
              direccion_negocio: actividadIndependiente.value.direccion_negocio,
              telefono_negocio: actividadIndependiente.value.telefono_negocio,
              direccion_negocio_modelo: actividadIndependiente.value.direccion_negocio_modelo,
            }
            : null,
          activos_pasivos:                 activosPasivos.value,
        info_conyuge:                    necesitaConyuge.value ? {
          vinculo: vinculoConyuge.value,
          tipo_identificacion: datosConyuge.value.tipo_identificacion,
          numero_identificacion: datosConyuge.value.numero_identificacion,
          nombres: datosConyuge.value.nombres,
          apellidos: datosConyuge.value.apellidos,
          fecha_expedicion: datosConyuge.value.fecha_expedicion,
          lugar_expedicion: datosConyuge.value.lugar_expedicion,
          lugar_expedicion_ubicacion: datosConyuge.value.lugar_expedicion_ubicacion,
          nacionalidad: datosConyuge.value.nacionalidad,
          telefono: datosConyuge.value.telefono,
        } : null,
          referencias:                     referencias.value,
        })
        const nuevo = await crearAsociadoAfiliacion(datosAsociado)
        asociadoId = nuevo.id
      }

      const dpSnap = datosPersonales.value
      const dlSnap = datosLaborales.value
      const dfSnap = datosFinancieros.value
      const dc = declaraciones.value

      const solicitud = await crearSolicitudAfiliacion({
        asociado_id: asociadoId,
        oficina:     oficina.value,
        fecha_solicitud: fechaSolicitud.value || null,
        tipo_solicitud:  tipoSolicitud.value || null,
        canales_comunicacion: (Array.isArray(dpSnap.canales_comunicacion) && dpSnap.canales_comunicacion.length)
          ? dpSnap.canales_comunicacion
          : null,
        // Snapshot personal
        telefono:                        dpSnap.telefono || null,
        email:                           emailInicial.value.trim() || null,
        ciudad:                          dpSnap.ciudad || null,
        direccion:                       dpSnap.direccion || null,
        tipo_identificacion:             dpSnap.tipo_identificacion,
        fecha_expedicion:                dpSnap.fecha_expedicion || null,
        lugar_expedicion:                dpSnap.lugar_expedicion || null,
        lugar_expedicion_ubicacion:      dpSnap.lugar_expedicion_ubicacion || null,
        nacionalidad:                    dpSnap.nacionalidad || null,
        lugar_nacimiento:                dpSnap.lugar_nacimiento || null,
        rh:                              dpSnap.rh || null,
        titulo:                          dpSnap.titulo || null,
        personas_a_cargo:                dpSnap.personas_a_cargo !== '' ? Number(dpSnap.personas_a_cargo) : null,
        personas_economicamente_activas: dpSnap.personas_economicamente_activas !== '' ? Number(dpSnap.personas_economicamente_activas) : null,
        barrio:                          dpSnap.barrio || null,
        estrato:                         dpSnap.estrato !== '' ? Number(dpSnap.estrato) : null,
        tiempo_residencia_meses:         dpSnap.tiempo_residencia_meses !== '' ? Number(dpSnap.tiempo_residencia_meses) : null,
        celular:                         dpSnap.celular || null,
        otro_email:                      dpSnap.otro_email || null,
        estado_civil:                    dpSnap.estado_civil || null,
        tipo_vivienda:                   dpSnap.tipo_vivienda || null,
        genero:                          dpSnap.genero || null,
        nivel_academico:                 dpSnap.nivel_academico || null,
        administra_recursos_publicos:    dpSnap.administra_recursos_publicos === true,
        persona_expuesta_publicamente:   dpSnap.persona_expuesta_publicamente === true,
        // Snapshot laboral
        tipo_trabajador:                 dlSnap.tipo_trabajador || null,
        empresa:                         dlSnap.tipo_trabajador === 'empleado' ? (dlSnap.nombre_empresa || null) : null,
        cargo:                           dlSnap.tipo_trabajador === 'empleado' ? (dlSnap.cargo_oficio || null) : null,
        tipo_contrato:                   dlSnap.tipo_trabajador === 'empleado'
          ? (dlSnap.tipo_contrato === 'otro' ? (dlSnap.tipo_contrato_otro || null) : (dlSnap.tipo_contrato || null))
          : null,
        fecha_ingreso:                   dlSnap.tipo_trabajador === 'empleado' ? (dlSnap.fecha_ingreso || null) : null,
        entidad_pagadora:                dlSnap.tipo_trabajador === 'pensionado' ? (dlSnap.entidad_pagadora || null) : null,
        institucion_educativa:           dlSnap.tipo_trabajador === 'estudiante' ? (dlSnap.institucion_educativa || null) : null,
        nivel_educativo:                 dlSnap.tipo_trabajador === 'estudiante' ? (dlSnap.nivel_educativo || null) : null,
        // Snapshot financiero
        salario_ingresos_fijos:          dfSnap.salario_ingresos_fijos !== '' ? Number(dfSnap.salario_ingresos_fijos) : null,
        ingresos_independiente:          dfSnap.ingresos_independiente !== '' ? Number(dfSnap.ingresos_independiente) : null,
        gastos_familiares:               dfSnap.gastos_familiares !== '' ? Number(dfSnap.gastos_familiares) : null,
        otros_gastos:                    dfSnap.otros_gastos !== '' ? Number(dfSnap.otros_gastos) : null,
        obligaciones_financieras:        dfSnap.obligaciones_financieras !== '' ? Number(dfSnap.obligaciones_financieras) : null,
        fuente_ingresos:                 dfSnap.fuente_ingresos || null,
        mesada_pensional:                dfSnap.mesada_pensional !== '' ? Number(dfSnap.mesada_pensional) : null,
        // JSONB
        actividad_independiente:         esIndependiente.value
          ? {
            ciiu_1: actividadIndependiente.value.ciiu_1,
            descripcion_actividad_1: actividadIndependiente.value.descripcion_actividad_1,
            fecha_inicio_actividad_1: actividadIndependiente.value.fecha_inicio_actividad_1,
            ciiu_2: actividadIndependiente.value.ciiu_2,
            descripcion_actividad_2: actividadIndependiente.value.descripcion_actividad_2,
            fecha_inicio_actividad_2: actividadIndependiente.value.fecha_inicio_actividad_2,
            direccion_negocio: actividadIndependiente.value.direccion_negocio,
            telefono_negocio: actividadIndependiente.value.telefono_negocio,
            direccion_negocio_modelo: actividadIndependiente.value.direccion_negocio_modelo,
          }
          : null,
        activos_pasivos:                 activosPasivos.value,
        info_conyuge:                    necesitaConyuge.value ? {
          vinculo: vinculoConyuge.value,
          tipo_identificacion: datosConyuge.value.tipo_identificacion,
          numero_identificacion: datosConyuge.value.numero_identificacion,
          nombres: datosConyuge.value.nombres,
          apellidos: datosConyuge.value.apellidos,
          fecha_expedicion: datosConyuge.value.fecha_expedicion,
          lugar_expedicion: datosConyuge.value.lugar_expedicion,
          lugar_expedicion_ubicacion: datosConyuge.value.lugar_expedicion_ubicacion,
          nacionalidad: datosConyuge.value.nacionalidad,
          telefono: datosConyuge.value.telefono,
        } : null,
        referencias:                     referencias.value,
        // Declaraciones SARLAFT
        maneja_dinero_publico:            dc.maneja_dinero_publico === true,
        es_contratista_estado:            dc.es_contratista_estado === true,
        es_lider_politico:                dc.es_lider_politico === true,
        autoriza_tratamiento_datos:       dc.autoriza_tratamiento_datos === true,
        fecha_autorizacion_datos:         dc.autoriza_tratamiento_datos === true ? (dc.fecha_autorizacion_datos || new Date().toISOString()) : null,
        tuvo_acompanamiento_asesor:       dc.tuvo_asesoria === true,
        codigo_asesor:                    dc.tuvo_asesoria === true ? dc.codigo_asesor : null,
        // Firma electrónica del solicitante
        ...(firma.value?.firma_imagen_dataurl ? {
          firmas: {
            firma_solicitante:        firma.value.firma_imagen_dataurl,
            nombre_firma:             firma.value.nombre_firma || '',
            firma_metodo:             firma.value.firma_metodo || '',
            firma_hash:               firma.value.firma_hash || '',
            firma_fecha_iso:          firma.value.firma_fecha_iso || '',
            firma_ip_publica:         firma.value.firma_ip_publica || '',
            firma_transaccion_id:     firma.value.firma_transaccion_id || '',
            firma_doc_hash_sha256:    firma.value.firma_doc_hash_sha256 || '',
          },
        } : {}),
        // URLs de documentos cargados por el asociado
        ...(documentos.value.doc_cedula_solicitante_url
          ? { doc_cedula_url: documentos.value.doc_cedula_solicitante_url }
          : {}),
        ...(documentos.value.doc_soporte_ingresos_laboral_url
          ? { doc_soporte_ingresos_url: documentos.value.doc_soporte_ingresos_laboral_url }
          : {}),
      })

      await registrarIntento(supabase, datosPersonales.value.cedula, 'afiliacion')
      await eliminarBorrador(emailInicial.value, 'afiliacion').catch(() => {})

      solicitudCreada.value = solicitud
      paso.value = 6
    } catch (e) {
      const msg = e?.message || e?.error_description || String(e) || ''
      const code = e?.code || e?.status || ''
      console.error('[enviarSolicitud] Error:', { code, msg, raw: e })
      if (msg.includes('duplicate') || msg.includes('unique') || code === '23505') {
        error.value = 'Ya existe una solicitud de afiliación para este documento.'
      } else if (msg.includes('chk_apellidos_longitud')) {
        error.value = 'El campo Apellidos no cumple el largo mínimo requerido. Por favor revíselo.'
      } else if (msg.includes('chk_nombres_longitud')) {
        error.value = 'El campo Nombres no cumple el largo mínimo requerido. Por favor revíselo.'
      } else if (msg.includes('violates check constraint') || code === '23514') {
        const constraint = msg.match(/constraint "([^"]+)"/)?.[1] || ''
        error.value = constraint
          ? `Dato inválido (${constraint}). Revise los campos del formulario.`
          : 'Uno o más valores están fuera del rango permitido.'
      } else if (msg.includes('violates not-null constraint') || code === '23502') {
        const col = msg.match(/column "([^"]+)"/)?.[1] || ''
        error.value = col
          ? `El campo "${col}" es requerido pero llegó vacío.`
          : 'Falta un campo requerido. Revise el formulario.'
      } else if (msg.includes('value too long') || code === '22001') {
        const col = msg.match(/type "([^"]+)"/)?.[1] || ''
        error.value = col
          ? `El campo "${col}" excede el largo máximo permitido.`
          : 'Un valor ingresado es demasiado largo.'
      } else if (msg.includes('invalid input syntax') || code === '22P02') {
        error.value = 'Un campo tiene un formato inválido. Revise fechas y números.'
      } else if (code === '42501' || msg.includes('permission denied')) {
        error.value = 'Sin permisos para enviar la solicitud. Contacte al administrador.'
      } else if (msg) {
        error.value = `Error al enviar: ${msg}`
      } else {
        error.value = 'Error desconocido al enviar la solicitud. Intente nuevamente.'
      }
    } finally {
      loading.value = false
    }
  }

  // ── Reiniciar ─────────────────────────────────────────────────────────────
  function reiniciar() {
    paso.value = 0
    emailInicial.value = ''
    errorEmail.value = ''
    borradorDisponible.value = null
    tipoDocumentoInicial.value = 'cedula_ciudadania'
    numeroDocumentoInicial.value = ''
    errorNumeroDoc.value = ''
    aceptaAutorizacion.value = false
    loadingVerificacion.value = false
    mostrarModalYaAsociado.value = false
    loading.value = false
    error.value = null
    solicitudCreada.value = null
    asociadoExistente.value = null
    erroresCampos.value = {}
    honeypot.value = ''
    oficina.value = 'PRINCIPAL - MEDELLÍN'
    fechaSolicitud.value = hoyIso()
    tipoSolicitud.value = 'afiliacion'
    registrarInicioFormulario('afiliacion')

    datosPersonales.value = {
      tipo_identificacion: 'CC',
      cedula: '',
      nombres: '',
      apellidos: '',
      email: '',
      fecha_expedicion: '',
      nacionalidad: 'Colombiana',
      fecha_nacimiento: '',
      lugar_nacimiento: '',
      rh: '',
      titulo: '',
      personas_a_cargo: '',
      personas_economicamente_activas: '',
      telefono: '',
      celular: '',
      otro_email: '',
      direccion: '',
      barrio: '',
      ciudad: '',
      estrato: '',
      tiempo_residencia_meses: '',
      estado_civil: '',
      tipo_vivienda: '',
      genero: '',
      nivel_academico: '',
      canales_comunicacion: [],
      administra_recursos_publicos: null,
      persona_expuesta_publicamente: null,
      lugar_nacimiento_ubicacion: { depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' },
      direccion_residencia_modelo: {
        depto_codigo: '', depto_nombre: '',
        municipio_codigo: '', municipio_nombre: '',
        via_principal: '', numero_via: '', letra_via: '', bis: false, cuadrante_via: '',
        numero_cruce: '', letra_cruce: '', numero_placa: '', cuadrante_cruce: '',
        complemento: '', barrio: '',
      },
    }
    datosLaborales.value = {
      tipo_trabajador: '',
      nombre_empresa: '',
      cargo_oficio: '',
      tipo_contrato: '',
      tipo_contrato_otro: '',
      fecha_ingreso: '',
      entidad_pagadora: '',
      institucion_educativa: '',
      nivel_educativo: '',
    }
    actividadIndependiente.value = {
      ciiu_1: '', descripcion_actividad_1: '', fecha_inicio_actividad_1: '',
      ciiu_2: '', descripcion_actividad_2: '',
      fecha_inicio_actividad_2: '',
      direccion_negocio: '', telefono_negocio: '',
      direccion_negocio_modelo: {
        depto_codigo: '', depto_nombre: '',
        municipio_codigo: '', municipio_nombre: '',
        via_principal: '', numero_via: '', letra_via: '', bis: false, cuadrante_via: '',
        numero_cruce: '', letra_cruce: '', numero_placa: '', cuadrante_cruce: '',
        complemento: '', barrio: '',
      },
    }
    datosFinancieros.value = {
      salario_ingresos_fijos: '',
      ingresos_independiente: '',
      gastos_familiares: '',
      otros_gastos: '',
      obligaciones_financieras: '',
      fuente_ingresos: '',
      mesada_pensional: '',
    }
    activosPasivos.value = {
      tiene_propiedad_raiz: false,
      tipo_propiedad_raiz: '',
      matricula_inmobiliaria: '',
      tiene_hipoteca: null,
      valor_propiedad_raiz: '',
      tiene_vehiculo: false,
      marca_vehiculo: '',
      modelo_vehiculo: '',
      placa_vehiculo: '',
      esta_pignorado: null,
      valor_vehiculo: '',
      total_pasivos: '',
      cuota_mensual_deudas: '',
    }
    datosConyuge.value = {
      tipo_identificacion: 'CC',
      numero_identificacion: '',
      nombres: '',
      apellidos: '',
      fecha_expedicion: '',
      lugar_expedicion: '',
      lugar_expedicion_ubicacion: null,
      nacionalidad: '',
      telefono: '',
    }
    referencias.value = {
      personal:   { nombres: '', contacto: '' },
      familiar:   { nombres: '', contacto: '', parentesco: '' },
      financiera: { nombre_establecimiento: '', contacto: '', tipo_producto: '', numero_cuenta: '' },
      comercial:  { nombre_establecimiento: '', contacto: '' },
    }
    declaraciones.value = {
      maneja_dinero_publico: null,
      es_contratista_estado: null,
      es_lider_politico: null,
      autoriza_tratamiento_datos: null,
      fecha_autorizacion_datos: null,
      tuvo_asesoria: null,
      codigo_asesor: '',
    }
    documentos.value = {
      doc_cedula_solicitante_url: '',
      doc_soporte_ingresos_laboral_url: '',
    }
  }

  return {
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
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
