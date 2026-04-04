import { ref, computed } from 'vue'
import {
  crearBorrador,
  actualizarBorrador,
  enviarSolicitud,
  verificarAsociado,
} from '@/services/solicitudCredito.service'
import { sanitizarObjeto } from '@/utils/seguridad'
import {
  guardarBorradorLocal,
  recuperarBorradorLocal,
  limpiarBorradorLocal,
  tieneBorrador,
} from '@/utils/borrador'
import { PASOS_FORMULARIO } from '@/data/formularioCredito'

export function useSolicitudCredito() {
  const paso          = ref(1)
  const loading       = ref(false)
  const error         = ref(null)
  const solicitudId   = ref(null)
  const enviado       = ref(false)
  const erroresCampos = ref({})

  // ── Paso previo: verificación ─────────────────────────────
  const verificacion = ref({
    correo:           '',
    tipo_documento:   'cedula_ciudadania',
    numero_documento: '',
  })
  const verificado             = ref(false)
  const loadingVerificacion    = ref(false)
  const errorVerificacion      = ref(null)
  const asociadoVerificado     = ref(null)
  const mostrarModalNoAsociado = ref(false)
  const tieneBorradorPrevio    = ref(false)
  const borradorRecuperado     = ref(false)

  // ── Sección 1-2: Solicitud ────────────────────────────────
  const general = ref({
    modalidad_credito:  '',   // 'ordinario' | 'educativo'
    tipo_operacion:     '',   // solo si ordinario
    valor_credito:      '',   // crédito nuevo o educativo
    valor_reestructura: '',   // reestructura o reestructura_desembolso
    valor_desembolso:   '',   // solo reestructura_desembolso
    destino_credito:    '',
    plazo_solicitado:   '',
  })

  // ── Sección 3: Datos personales solicitante ───────────────
  const persona = ref({
    tipo_documento:             '',
    numero_identificacion:      '',
    nombres:                    '',
    apellidos:                  '',
    correo_electronico:         '',
    direccion_residencia:       '',
    ciudad:                     '',
    departamento:               '',
    fecha_nacimiento:           '',
    fecha_expedicion_documento: '',
    ciudad_expedicion:          '',
  })

  // Dirección estructurada (solo solicitante)
  const direccionEstructurada = ref({
    via_principal:   '',
    numero_via:      '',
    letra_via:       '',
    bis:             false,
    cuadrante_via:   '',
    numero_cruce:    '',
    letra_cruce:     '',
    cuadrante_cruce: '',
    numero_placa:    '',
    complemento:     '',
    barrio:          '',
  })

  // ── Sección 4: Laboral solicitante ────────────────────────
  const laboral = ref({
    tipo_trabajador:          '',
    // Empleado
    nombre_empresa:           '',
    fecha_ingreso:            '',
    tipo_contrato:            '',
    tipo_contrato_otro:       '',
    cargo_oficio:             '',
    // Independiente
    actividad_comercial:      '',
    fecha_inicio_actividad:   '',
    ocupacion:                '',
    // Pensionado
    entidad_pagadora:         '',
    // Estudiante
    institucion_educativa:    '',
    nivel_educativo:          '',
    // Cuidado del hogar
    descripcion_ocupacion:    '',
    // Todos
    tiene_dependientes:       false,
    numero_dependientes:      '',
  })

  // ── Sección 5: Financiera solicitante ─────────────────────
  const financiera = ref({
    salario_ingresos_fijos:   '',
    ingresos_independiente:   '',
    otros_ingresos:           '',
    gastos_familiares:        '',
    otros_gastos:             '',
    obligaciones_financieras: '',
  })

  // ── Sección 6: Patrimonio solicitante ─────────────────────
  const patrimonio = ref({
    tiene_propiedad_raiz: false,
    valor_propiedad_raiz: '',
    tiene_vehiculo:       false,
    valor_vehiculo:       '',
    total_activos:        '',
    total_pasivos:        '',
  })

  // ── Sección 7: Cuenta de desembolso ──────────────────────
  const cuenta = ref({
    tipo_cuenta:      '',
    entidad_bancaria: '',
    numero_cuenta:    '',
  })

  // ── Sección 8-11: Codeudor ────────────────────────────────
  const tieneCodudor = ref(null) // null = sin responder, true/false = respondido

  const personaCod = ref({
    tipo_documento_codeudor:             '',
    numero_identificacion_codeudor:      '',
    nombres_codeudor:                    '',
    apellidos_codeudor:                  '',
    correo_codeudor:                     '',
    direccion_codeudor:                  '',
    ciudad_codeudor:                     '',
    departamento_codeudor:               '',
    fecha_nacimiento_codeudor:           '',
    fecha_expedicion_codeudor:           '',
    ciudad_expedicion_codeudor:          '',
  })

  const financieraCod = ref({
    salario_codeudor:                  '',
    ingresos_independiente_codeudor:   '',
    otros_ingresos_codeudor:           '',
    gastos_familiares_codeudor:        '',
    otros_gastos_codeudor:             '',
    obligaciones_financieras_codeudor: '',
  })

  const patrimonioCod = ref({
    tiene_propiedad_raiz_codeudor: false,
    valor_propiedad_raiz_codeudor: '',
    tiene_vehiculo_codeudor:       false,
    valor_vehiculo_codeudor:       '',
    total_activos_codeudor:        '',
    total_pasivos_codeudor:        '',
  })

  // ── Sección 12: Autorizaciones ────────────────────────────
  const autorizaciones = ref({
    autorizacion_reporte_centrales:    false,
    autorizacion_consulta_informacion: false,
    autorizacion_tratamiento_datos:    false,
    autorizacion_datos_sensibles:      false,
    declaracion_veracidad_informacion: false,
  })

  // ── Sección 13: Firma ─────────────────────────────────────
  const firma = ref({
    nombre_firma: '',
  })

  // ── Computeds condicionales ───────────────────────────────
  const mostrarTipoOperacion = computed(() =>
    general.value.modalidad_credito === 'ordinario'
  )

  const mostrarValorCredito = computed(() =>
    general.value.modalidad_credito === 'educativo' ||
    general.value.tipo_operacion === 'credito_nuevo' ||
    (general.value.modalidad_credito === 'ordinario' && !general.value.tipo_operacion)
  )

  const mostrarValorReestructura = computed(() =>
    ['reestructura', 'reestructura_desembolso'].includes(general.value.tipo_operacion)
  )

  const mostrarValorDesembolso = computed(() =>
    general.value.tipo_operacion === 'reestructura_desembolso'
  )

  const mostrarCuentaDesembolso = computed(() =>
    general.value.tipo_operacion !== 'reestructura'
  )

  const salarioBloqueado = computed(() =>
    laboral.value.tipo_trabajador === 'independiente'
  )

  const montoTotalOperacion = computed(() => {
    if (general.value.tipo_operacion !== 'reestructura_desembolso') return null
    const r = Number(general.value.valor_reestructura) || 0
    const d = Number(general.value.valor_desembolso)   || 0
    return r + d > 0 ? r + d : null
  })

  // Pasos activos según condiciones
  const pasosActivos = computed(() =>
    PASOS_FORMULARIO.filter(p => {
      if (p.numero === 7)  return mostrarCuentaDesembolso.value
      if ([9, 10, 11].includes(p.numero)) return tieneCodudor.value === true
      return true
    })
  )

  const totalPasosActivos = computed(() => pasosActivos.value.length)

  const porcentaje = computed(() => {
    const idx = pasosActivos.value.findIndex(p => p.numero === paso.value)
    if (idx < 0 || pasosActivos.value.length <= 1) return 0
    return Math.round((idx / (pasosActivos.value.length - 1)) * 100)
  })

  // Paso actual dentro de los activos
  const pasoActual = computed(() =>
    pasosActivos.value.find(p => p.numero === paso.value)
  )

  // ── Dirección → texto ─────────────────────────────────────
  function construirDireccion() {
    const m = direccionEstructurada.value
    if (!m.via_principal && !m.numero_via) return ''
    let dir = m.via_principal || ''
    if (m.numero_via)      dir += ` ${m.numero_via}`
    if (m.letra_via)       dir += m.letra_via
    if (m.bis)             dir += ' BIS'
    if (m.cuadrante_via)   dir += ` ${m.cuadrante_via}`
    dir += ' #'
    if (m.numero_cruce)    dir += ` ${m.numero_cruce}`
    if (m.letra_cruce)     dir += m.letra_cruce
    if (m.cuadrante_cruce) dir += ` ${m.cuadrante_cruce}`
    dir += ' -'
    if (m.numero_placa)    dir += ` ${m.numero_placa}`
    if (m.complemento)     dir += `, ${m.complemento}`
    if (m.barrio)          dir += `, ${m.barrio}`
    return dir.trim().toUpperCase()
  }

  // ── Verificación previa ───────────────────────────────────
  async function verificarYContinuar() {
    errorVerificacion.value = null

    if (!verificacion.value.correo ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificacion.value.correo)) {
      errorVerificacion.value = 'Ingrese un correo electrónico válido.'
      return
    }
    if (!verificacion.value.numero_documento ||
        verificacion.value.numero_documento.length < 5) {
      errorVerificacion.value = 'Ingrese un número de documento válido.'
      return
    }

    loadingVerificacion.value = true
    try {
      const tiposQueVerifican = ['cedula_ciudadania', 'cedula_extranjeria']
      const debeVerificar = tiposQueVerifican.includes(verificacion.value.tipo_documento)

      if (debeVerificar) {
        const resultado = await verificarAsociado(
          verificacion.value.numero_documento,
          verificacion.value.tipo_documento
        )
        if (!resultado.existe) {
          mostrarModalNoAsociado.value = true
          return
        }
        asociadoVerificado.value = resultado
      }

      persona.value.numero_identificacion = verificacion.value.numero_documento
      persona.value.tipo_documento        = verificacion.value.tipo_documento
      persona.value.correo_electronico    = verificacion.value.correo

      const borrador = recuperarBorradorLocal(verificacion.value.correo)
      if (borrador) {
        if (borrador.general)               general.value               = { ...general.value,    ...borrador.general }
        if (borrador.persona)               persona.value               = { ...persona.value,    ...borrador.persona }
        if (borrador.laboral)               laboral.value               = { ...laboral.value,    ...borrador.laboral }
        if (borrador.financiera)            financiera.value            = { ...financiera.value, ...borrador.financiera }
        if (borrador.patrimonio)            patrimonio.value            = { ...patrimonio.value, ...borrador.patrimonio }
        if (borrador.cuenta)                cuenta.value                = { ...cuenta.value,     ...borrador.cuenta }
        if (borrador.direccionEstructurada) direccionEstructurada.value = { ...direccionEstructurada.value, ...borrador.direccionEstructurada }
        if (borrador.tieneCodudor !== undefined) tieneCodudor.value    = borrador.tieneCodudor
        // Restaurar paso; validar que esté en los pasos activos (con el estado ya restaurado)
        const pasoRestaurado = borrador.paso
        const enActivos = PASOS_FORMULARIO.filter(p => {
          if (p.numero === 7)              return general.value.tipo_operacion !== 'reestructura'
          if ([9, 10, 11].includes(p.numero)) return tieneCodudor.value === true
          return true
        }).some(p => p.numero === pasoRestaurado)
        paso.value = enActivos ? pasoRestaurado : 1
        borradorRecuperado.value = true
      }

      verificado.value = true
    } catch (e) {
      errorVerificacion.value = 'Error al verificar el documento. Intente nuevamente.'
      console.error(e)
    } finally {
      loadingVerificacion.value = false
    }
  }

  function onCorreoCambia(correo) {
    verificacion.value.correo = correo
    tieneBorradorPrevio.value = tieneBorrador(correo)
  }

  // ── Aplanar para BD ───────────────────────────────────────
  function aplanarDatos() {
    return {
      // Fecha de solicitud — automática
      fecha_solicitud: new Date().toISOString().split('T')[0],
      // Solicitud
      ...general.value,
      tiene_codeudor: tieneCodudor.value === true,
      // Persona (dirección construida desde campos estructurados)
      ...persona.value,
      direccion_residencia: construirDireccion() || persona.value.direccion_residencia,
      // Laboral
      ...laboral.value,
      // Financiera (sin ahorros)
      ...financiera.value,
      // Patrimonio
      ...patrimonio.value,
      // Cuenta
      ...cuenta.value,
      // Codeudor (solo si aplica)
      ...(tieneCodudor.value ? personaCod.value    : {}),
      ...(tieneCodudor.value ? financieraCod.value : {}),
      ...(tieneCodudor.value ? patrimonioCod.value : {}),
      // Autorizaciones
      ...autorizaciones.value,
      // Firma
      ...firma.value,
      paso_actual: paso.value,
    }
  }

  // ── Guardar: localStorage + Supabase ─────────────────────
  async function guardarPaso() {
    try {
      if (verificacion.value.correo) {
        guardarBorradorLocal(verificacion.value.correo, {
          general,              persona,       laboral,
          financiera,           patrimonio,    cuenta,
          direccionEstructurada,
          tieneCodudor: tieneCodudor.value,
          paso: paso.value,
        })
      }
      const datos = sanitizarObjeto(aplanarDatos())
      if (!solicitudId.value) {
        const nuevo = await crearBorrador(datos)
        solicitudId.value = nuevo.id
      } else {
        await actualizarBorrador(solicitudId.value, datos)
      }
    } catch (e) {
      console.error('Error guardando borrador:', e)
    }
  }

  // ── Navegación ────────────────────────────────────────────
  function pasoSiguienteNumero() {
    const activos = pasosActivos.value
    const idx = activos.findIndex(p => p.numero === paso.value)
    return idx < activos.length - 1 ? activos[idx + 1].numero : null
  }

  function pasoAnteriorNumero() {
    const activos = pasosActivos.value
    const idx = activos.findIndex(p => p.numero === paso.value)
    return idx > 0 ? activos[idx - 1].numero : null
  }

  async function siguiente() {
    error.value = null
    loading.value = true
    try {
      await guardarPaso()
      const sig = pasoSiguienteNumero()
      if (sig) {
        paso.value = sig
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } finally {
      loading.value = false
    }
  }

  function anterior() {
    const ant = pasoAnteriorNumero()
    if (ant) {
      paso.value = ant
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function irAPaso(n) {
    if (pasosActivos.value.some(p => p.numero === n)) {
      paso.value = n
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const esUltimoPaso = computed(() => {
    const activos = pasosActivos.value
    return activos.length > 0 && activos[activos.length - 1].numero === paso.value
  })

  // ── Envío final ───────────────────────────────────────────
  async function enviar() {
    if (!autorizaciones.value.autorizacion_reporte_centrales ||
        !autorizaciones.value.autorizacion_tratamiento_datos  ||
        !autorizaciones.value.declaracion_veracidad_informacion) {
      error.value = 'Debe aceptar todas las autorizaciones obligatorias para continuar.'
      return
    }
    if (!firma.value.nombre_firma.trim()) {
      error.value = 'Debe escribir su nombre completo para firmar la solicitud.'
      return
    }
    loading.value = true
    error.value = null
    try {
      await guardarPaso()
      await enviarSolicitud(solicitudId.value)
      limpiarBorradorLocal(verificacion.value.correo)
      enviado.value = true
    } catch (e) {
      error.value = 'Error al enviar la solicitud. Intente nuevamente.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // ── Helper formato moneda ─────────────────────────────────
  function formatMonto(n) {
    if (!n) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(n)
  }

  return {
    paso, loading, error, enviado,
    solicitudId, erroresCampos,
    porcentaje, pasosActivos, pasoActual, esUltimoPaso,
    // Verificación
    verificacion, verificado, loadingVerificacion, errorVerificacion,
    asociadoVerificado, mostrarModalNoAsociado,
    tieneBorradorPrevio, borradorRecuperado,
    verificarYContinuar, onCorreoCambia,
    // Estado
    general, persona, laboral, financiera, patrimonio, cuenta,
    direccionEstructurada, tieneCodudor,
    personaCod, financieraCod, patrimonioCod,
    autorizaciones, firma,
    // Computeds
    mostrarTipoOperacion, mostrarValorCredito,
    mostrarValorReestructura, mostrarValorDesembolso,
    mostrarCuentaDesembolso, salarioBloqueado,
    montoTotalOperacion,
    // Acciones
    siguiente, anterior, irAPaso, enviar, guardarPaso, formatMonto,
  }
}
