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

export function useAfiliacion() {
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
    administra_recursos_publicos: false,
    persona_expuesta_publicamente: false,
  })

  // ── Sección 3: Información Laboral ────────────────────────────────────────
  const datosLaborales = ref({
    ocupacion: '',
    empresa: '',
    cargo: '',
    tipo_contrato: '',
    fecha_ingreso_empresa: '',
    direccion_empresa: '',
    ciudad_empresa: '',
    telefono_empresa: '',
    email_corporativo: '',
    salario: '',
  })

  // ── Sección 4: Actividad Independiente ────────────────────────────────────
  const actividadIndependiente = ref({
    ciiu_1: '',
    descripcion_actividad_1: '',
    fecha_inicio_actividad_1: '',
    nombre_establecimiento: '',
    ciiu_2: '',
    descripcion_actividad_2: '',
    fecha_inicio_actividad_2: '',
    fecha_constitucion: '',
    fecha_vigencia: '',
    direccion_negocio: '',
    ciudad_negocio: '',
    telefono_negocio: '',
  })

  // ── Sección 5: Información Financiera ─────────────────────────────────────
  const datosFinancieros = ref({
    gastos_familiares: '',
    otros_ingresos: '',
    cuotas_credito: '',
    total_ingresos: '',
    total_egresos: '',
  })

  // ── Sección 6: Activos y Pasivos ──────────────────────────────────────────
  const activosPasivos = ref({
    tipo_propiedad_raiz: '',
    matricula_inmobiliaria: '',
    deuda_cooperativa: '',
    cuota_mensual_cooperativa: '',
    valor_comercial_hipoteca: '',
    deuda_otras_entidades: '',
    cuota_mensual_otras_deudas: '',
    marca_vehiculo: '',
    modelo_vehiculo: '',
    placa_vehiculo: '',
    otras_deudas: '',
    cuota_mensual_otras_deudas_2: '',
    valor_comercial_pignorado: '',
    total_pasivos: '',
  })

  // ── Sección 7: Cónyuge / Compañero ───────────────────────────────────────
  const datosConyuge = ref({
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    nombre: '',
    fecha_expedicion: '',
    nacionalidad: 'Colombiana',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    telefono: '',
    celular: '',
    email: '',
    estado_civil: '',
    tipo_vivienda: '',
    genero: '',
    nivel_academico: '',
    ocupacion: '',
    empresa: '',
    cargo: '',
    tipo_contrato: '',
    telefono_empresa: '',
    salario: '',
  })

  // ── Sección 8: Referencias ────────────────────────────────────────────────
  const referencias = ref({
    personal:  { nombre: '', contacto: '', telefono: '' },
    familiar:  { nombre: '', contacto: '', parentesco: '' },
    comercial: { nombre_establecimiento: '', nombre_contacto: '', producto: '' },
  })

  // ── Secciones 9 y 10: Declaraciones ──────────────────────────────────────
  const declaraciones = ref({
    invalidez_o_incapacidad: false,
    cancer: false,
    afecciones_cardiovasculares: false,
    epoc: false,
    sida: false,
    insuficiencia_renal: false,
    maneja_dinero_publico: false,
    es_contratista_estado: false,
    es_lider_politico: false,
    autoriza_tratamiento_datos: false,
  })

  // Sección 1 encabezado
  const oficina = ref('PRINCIPAL - MEDELLÍN')

  registrarInicioFormulario('afiliacion')

  // ── Computed ──────────────────────────────────────────────────────────────
  const necesitaConyuge = computed(() =>
    ['Casado', 'Union Libre'].includes(datosPersonales.value.estado_civil)
  )

  const esIndependiente = computed(() =>
    datosLaborales.value.ocupacion === 'Independiente'
  )

  const pasoValido = computed(() => {
    if (paso.value === 0) {
      return !!(
        emailInicial.value.trim() &&
        !errorEmail.value &&
        tipoDocumentoInicial.value &&
        numeroDocumentoInicial.value.trim().length >= 5 &&
        aceptaAutorizacion.value
      )
    }
    if (paso.value === 1) {
      const dp = datosPersonales.value
      return !!(
        dp.cedula &&
        dp.nombres &&
        dp.apellidos &&
        dp.estado_civil &&
        dp.genero &&
        dp.fecha_nacimiento
      )
    }
    if (paso.value === 2) {
      return !!datosLaborales.value.ocupacion
    }
    if (paso.value === 3) {
      return true
    }
    if (paso.value === 4) {
      if (!necesitaConyuge.value) return true
      return !!datosConyuge.value.nombre
    }
    if (paso.value === 5) {
      return true
    }
    if (paso.value === 6) {
      return declaraciones.value.autoriza_tratamiento_datos
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
    try {
      const existente = await buscarAsociadoPorCedula(numDoc)
      if (existente) {
        mostrarModalYaAsociado.value = true
        return
      }
      const borrador = await buscarBorrador(email, 'afiliacion')
      if (borrador) {
        borradorDisponible.value = borrador
      } else {
        _prepararPaso1(email, numDoc)
      }
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
    const b = borradorDisponible.value
    if (!b) return
    const d = b.datos
    if (d.datosPersonales)        datosPersonales.value        = { ...datosPersonales.value,        ...d.datosPersonales }
    if (d.datosLaborales)         datosLaborales.value         = { ...datosLaborales.value,         ...d.datosLaborales }
    if (d.actividadIndependiente) actividadIndependiente.value = { ...actividadIndependiente.value, ...d.actividadIndependiente }
    if (d.datosFinancieros)       datosFinancieros.value       = { ...datosFinancieros.value,       ...d.datosFinancieros }
    if (d.activosPasivos)         activosPasivos.value         = { ...activosPasivos.value,         ...d.activosPasivos }
    if (d.datosConyuge)           datosConyuge.value           = { ...datosConyuge.value,           ...d.datosConyuge }
    if (d.referencias)            referencias.value            = { ...referencias.value,            ...d.referencias }
    if (d.declaraciones)          declaraciones.value          = { ...declaraciones.value,          ...d.declaraciones }
    if (d.oficina)                oficina.value                = d.oficina
    borradorDisponible.value = null
    paso.value = b.paso_actual ?? 1
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        oficina:                oficina.value,
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
      }
    } catch {
      asociadoExistente.value = null
    }
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  function irAPaso(n) {
    // Saltar cónyuge si no aplica
    if (n === 4 && !necesitaConyuge.value) {
      n = n > paso.value ? 5 : 3
    }
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

    const permitido = await verificarRateLimit(supabase, datosPersonales.value.cedula, 'afiliacion')
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
        const dp = datosPersonales.value
        const dl = datosLaborales.value
        const df = datosFinancieros.value

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
          administra_recursos_publicos:    dp.administra_recursos_publicos,
          persona_expuesta_publicamente:   dp.persona_expuesta_publicamente,
          // Laboral
          ocupacion:                       dl.ocupacion            || null,
          empresa:                         dl.empresa              || null,
          cargo:                           dl.cargo                || null,
          tipo_contrato:                   dl.tipo_contrato        || null,
          fecha_ingreso_empresa:           dl.fecha_ingreso_empresa || null,
          direccion_empresa:               dl.direccion_empresa    || null,
          ciudad_empresa:                  dl.ciudad_empresa       || null,
          telefono_empresa:                dl.telefono_empresa     || null,
          email_corporativo:               dl.email_corporativo    || null,
          salario:                         dl.salario !== '' ? Number(dl.salario) : null,
          // Financiero
          gastos_familiares:               df.gastos_familiares !== '' ? Number(df.gastos_familiares) : null,
          otros_ingresos:                  df.otros_ingresos !== '' ? Number(df.otros_ingresos) : null,
          cuotas_credito:                  df.cuotas_credito !== '' ? Number(df.cuotas_credito) : null,
          total_ingresos:                  df.total_ingresos !== '' ? Number(df.total_ingresos) : null,
          total_egresos:                   df.total_egresos !== '' ? Number(df.total_egresos) : null,
          // JSONB
          actividad_independiente:         esIndependiente.value ? actividadIndependiente.value : null,
          activos_pasivos:                 activosPasivos.value,
          info_conyuge:                    necesitaConyuge.value ? datosConyuge.value : null,
          referencias:                     referencias.value,
        })
        const nuevo = await crearAsociadoAfiliacion(datosAsociado)
        asociadoId = nuevo.id
      }

      const dp = datosPersonales.value
      const dl = datosLaborales.value
      const df = datosFinancieros.value
      const dc = declaraciones.value

      const solicitud = await crearSolicitudAfiliacion({
        asociado_id: asociadoId,
        oficina:     oficina.value,
        // Snapshot personal
        tipo_identificacion:             dp.tipo_identificacion,
        fecha_expedicion:                dp.fecha_expedicion || null,
        nacionalidad:                    dp.nacionalidad || null,
        lugar_nacimiento:                dp.lugar_nacimiento || null,
        rh:                              dp.rh || null,
        titulo:                          dp.titulo || null,
        personas_a_cargo:                dp.personas_a_cargo !== '' ? Number(dp.personas_a_cargo) : null,
        personas_economicamente_activas: dp.personas_economicamente_activas !== '' ? Number(dp.personas_economicamente_activas) : null,
        barrio:                          dp.barrio || null,
        estrato:                         dp.estrato !== '' ? Number(dp.estrato) : null,
        tiempo_residencia_meses:         dp.tiempo_residencia_meses !== '' ? Number(dp.tiempo_residencia_meses) : null,
        celular:                         dp.celular || null,
        otro_email:                      dp.otro_email || null,
        estado_civil:                    dp.estado_civil || null,
        tipo_vivienda:                   dp.tipo_vivienda || null,
        genero:                          dp.genero || null,
        nivel_academico:                 dp.nivel_academico || null,
        administra_recursos_publicos:    dp.administra_recursos_publicos,
        persona_expuesta_publicamente:   dp.persona_expuesta_publicamente,
        // Snapshot laboral
        ocupacion:                       dl.ocupacion || null,
        direccion_empresa:               dl.direccion_empresa || null,
        ciudad_empresa:                  dl.ciudad_empresa || null,
        telefono_empresa:                dl.telefono_empresa || null,
        email_corporativo:               dl.email_corporativo || null,
        // Snapshot financiero
        salario_basico:                  dl.salario !== '' ? Number(dl.salario) : null,
        gastos_familiares:               df.gastos_familiares !== '' ? Number(df.gastos_familiares) : null,
        otros_ingresos:                  df.otros_ingresos !== '' ? Number(df.otros_ingresos) : null,
        cuotas_credito:                  df.cuotas_credito !== '' ? Number(df.cuotas_credito) : null,
        total_ingresos:                  df.total_ingresos !== '' ? Number(df.total_ingresos) : null,
        total_egresos:                   df.total_egresos !== '' ? Number(df.total_egresos) : null,
        // JSONB
        actividad_independiente:         esIndependiente.value ? actividadIndependiente.value : null,
        activos_pasivos:                 activosPasivos.value,
        info_conyuge:                    necesitaConyuge.value ? datosConyuge.value : null,
        referencias:                     referencias.value,
        // Declaraciones asegurabilidad
        decl_invalidez_incapacidad:       dc.invalidez_o_incapacidad,
        decl_cancer:                      dc.cancer,
        decl_afecciones_cardiovasculares: dc.afecciones_cardiovasculares,
        decl_epoc:                        dc.epoc,
        decl_sida:                        dc.sida,
        decl_insuficiencia_renal:         dc.insuficiencia_renal,
        // Declaraciones SARLAFT
        maneja_dinero_publico:            dc.maneja_dinero_publico,
        es_contratista_estado:            dc.es_contratista_estado,
        es_lider_politico:                dc.es_lider_politico,
        autoriza_tratamiento_datos:       dc.autoriza_tratamiento_datos,
      })

      await registrarIntento(supabase, datosPersonales.value.cedula, 'afiliacion')
      await eliminarBorrador(emailInicial.value, 'afiliacion').catch(() => {})

      solicitudCreada.value = solicitud
      paso.value = 7
    } catch (e) {
      if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
        error.value = 'Ya existe una solicitud de afiliación para este documento.'
      } else if (e.message?.includes('violates check constraint')) {
        error.value = 'Uno o más valores están fuera del rango permitido.'
      } else {
        error.value = 'Error al enviar la solicitud. Intente nuevamente.'
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
    registrarInicioFormulario('afiliacion')

    datosPersonales.value = {
      tipo_identificacion: 'CC', cedula: '', nombres: '', apellidos: '', email: '',
      fecha_expedicion: '', nacionalidad: 'Colombiana', fecha_nacimiento: '',
      lugar_nacimiento: '', rh: '', titulo: '',
      personas_a_cargo: '', personas_economicamente_activas: '',
      telefono: '', celular: '', otro_email: '',
      direccion: '', barrio: '', ciudad: '',
      estrato: '', tiempo_residencia_meses: '',
      estado_civil: '', tipo_vivienda: '', genero: '', nivel_academico: '',
      administra_recursos_publicos: false, persona_expuesta_publicamente: false,
    }
    datosLaborales.value = {
      ocupacion: '', empresa: '', cargo: '', tipo_contrato: '',
      fecha_ingreso_empresa: '', direccion_empresa: '',
      ciudad_empresa: '', telefono_empresa: '', email_corporativo: '', salario: '',
    }
    actividadIndependiente.value = {
      ciiu_1: '', descripcion_actividad_1: '', fecha_inicio_actividad_1: '',
      nombre_establecimiento: '', ciiu_2: '', descripcion_actividad_2: '',
      fecha_inicio_actividad_2: '', fecha_constitucion: '', fecha_vigencia: '',
      direccion_negocio: '', ciudad_negocio: '', telefono_negocio: '',
    }
    datosFinancieros.value = {
      gastos_familiares: '', otros_ingresos: '', cuotas_credito: '',
      total_ingresos: '', total_egresos: '',
    }
    activosPasivos.value = {
      tipo_propiedad_raiz: '', matricula_inmobiliaria: '',
      deuda_cooperativa: '', cuota_mensual_cooperativa: '',
      valor_comercial_hipoteca: '', deuda_otras_entidades: '',
      cuota_mensual_otras_deudas: '', marca_vehiculo: '',
      modelo_vehiculo: '', placa_vehiculo: '',
      otras_deudas: '', cuota_mensual_otras_deudas_2: '',
      valor_comercial_pignorado: '', total_pasivos: '',
    }
    datosConyuge.value = {
      tipo_identificacion: 'CC', numero_identificacion: '',
      nombre: '', fecha_expedicion: '', nacionalidad: 'Colombiana',
      fecha_nacimiento: '', lugar_nacimiento: '',
      direccion: '', barrio: '', ciudad: '',
      telefono: '', celular: '', email: '',
      estado_civil: '', tipo_vivienda: '', genero: '', nivel_academico: '',
      ocupacion: '', empresa: '', cargo: '', tipo_contrato: '',
      telefono_empresa: '', salario: '',
    }
    referencias.value = {
      personal:  { nombre: '', contacto: '', telefono: '' },
      familiar:  { nombre: '', contacto: '', parentesco: '' },
      comercial: { nombre_establecimiento: '', nombre_contacto: '', producto: '' },
    }
    declaraciones.value = {
      invalidez_o_incapacidad: false, cancer: false,
      afecciones_cardiovasculares: false, epoc: false,
      sida: false, insuficiencia_renal: false,
      maneja_dinero_publico: false, es_contratista_estado: false,
      es_lider_politico: false, autoriza_tratamiento_datos: false,
    }
  }

  return {
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
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
