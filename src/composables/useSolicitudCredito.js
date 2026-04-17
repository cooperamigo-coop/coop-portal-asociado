import { ref, computed, watch, toRaw } from 'vue'
import {
  crearBorrador,
  actualizarBorrador,
  enviarSolicitud,
  verificarAsociado,
} from '@/services/solicitudCredito.service'
import { actualizarCamposAsociado, buscarAsociadoPorCedula } from '@/services/afiliacion.service'
import { sanitizarObjeto } from '@/utils/seguridad'
import {
  guardarBorradorLocal,
  recuperarBorradorLocal,
  limpiarBorradorLocal,
  tieneBorrador,
  obtenerFechaBorrador,
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
    tipo_documento:   '',
    numero_documento: '',
  })
  const verificado             = ref(false)
  const loadingVerificacion    = ref(false)
  const errorVerificacion      = ref(null)
  const asociadoVerificado     = ref(null)
  const mostrarModalNoAsociado = ref(false)
  const tieneBorradorPrevio    = ref(false)
  const borradorRecuperado     = ref(false)
  const mostrarOpcionBorrador  = ref(false)
  const fechaBorrador          = ref(null)
  const ultimoGuardado         = ref(null)

  // Borrador temporal hasta que el usuario elija continuar o empezar de nuevo
  let _borradorTemp  = null
  let _debounceTimer = null

  // ── Sección 1-2: Solicitud ────────────────────────────────
  const general = ref({
    modalidad_credito:    '',
    tipo_operacion:       '',
    valor_credito:        '',
    valor_reestructura:   '',
    valor_desembolso:     '',
    destino_credito:      '',
    tipo_estudio:         '',
    denominacion_carrera: '',
    plazo_solicitado:     '',
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
    fecha_nacimiento:            '',
    fecha_expedicion_documento:  '',
    nivel_educativo_solicitante: '',
  })

  // Dirección estructurada solicitante
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

  // Dirección estructurada codeudores
  const direccionEstructuradaCod1 = ref({
    via_principal: '', numero_via: '', letra_via: '', bis: false,
    cuadrante_via: '', numero_cruce: '', letra_cruce: '', cuadrante_cruce: '',
    numero_placa: '', complemento: '', barrio: '',
  })
  const direccionEstructuradaCod2 = ref({
    via_principal: '', numero_via: '', letra_via: '', bis: false,
    cuadrante_via: '', numero_cruce: '', letra_cruce: '', cuadrante_cruce: '',
    numero_placa: '', complemento: '', barrio: '',
  })

  // ── Ubicaciones (departamento/municipio) ──────────────────
  const ubicacionResidencia = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })

  // ── Sección 4: Laboral solicitante ────────────────────────
  const laboral = ref({
    tipo_trabajador:        '',
    nombre_empresa:         '',
    fecha_ingreso:          '',
    tipo_contrato:          '',
    tipo_contrato_otro:     '',
    cargo_oficio:           '',
    actividad_comercial:    '',
    fecha_inicio_actividad: '',
    ocupacion:              '',
    entidad_pagadora:       '',
    institucion_educativa:  '',
    nivel_educativo:        '',
    tiene_dependientes:     false,
    numero_dependientes:    '',
  })

  // ── Sección 5: Financiera solicitante ─────────────────────
  const financiera = ref({
    salario_ingresos_fijos:   '',
    ingresos_independiente:   '',
    gastos_familiares:        '',
    otros_gastos:             '',
    obligaciones_financieras: '',
    fuente_ingresos:          '',
    mesada_pensional:         '',
  })

  // ── Sección 6: Patrimonio solicitante ─────────────────────
  const patrimonio = ref({
    tiene_propiedad_raiz: false,
    valor_propiedad_raiz: '',
    tiene_vehiculo:       false,
    valor_vehiculo:       '',
  })

  // ── Sección 7: Cuenta de desembolso ──────────────────────
  const cuenta = ref({
    tipo_cuenta:           '',
    entidad_bancaria:      '',
    entidad_bancaria_otro: '',
    numero_cuenta:         '',
    cuenta_tercero:        false,
    nombre_tercero:        '',
    tipo_doc_tercero:      '',
    numero_doc_tercero:    '',
  })

  // ── Sección 8: Número de codeudores ──────────────────────
  const numCodudores = ref(0) // 0, 1 o 2

  // ── Codeudor 1 ────────────────────────────────────────────
  const personaCod1 = ref({
    tipo_documento_codeudor:            '',
    numero_identificacion_codeudor:     '',
    nombres_codeudor:                   '',
    apellidos_codeudor:                 '',
    correo_codeudor:                    '',
    direccion_codeudor:                 '',
    fecha_nacimiento_codeudor:          '',
    fecha_expedicion_codeudor:          '',
  })
  const laboralCod1 = ref({
    tipo_trabajador_codeudor:            '',
    nombre_empresa_codeudor:             '',
    fecha_ingreso_codeudor:              '',
    tipo_contrato_codeudor:              '',
    cargo_oficio_codeudor:               '',
    actividad_comercial_codeudor:        '',
    fecha_inicio_actividad_codeudor:     '',
    ocupacion_codeudor:                  '',
    entidad_pagadora_codeudor:           '',
    institucion_educativa_codeudor:      '',
    nivel_educativo_codeudor:            '',
    tiene_dependientes_codeudor:         false,
    numero_dependientes_codeudor:        '',
  })
  const financieraCod1 = ref({
    salario_codeudor:                  '',
    ingresos_independiente_codeudor:   '',
    gastos_familiares_codeudor:        '',
    otros_gastos_codeudor:             '',
    obligaciones_financieras_codeudor: '',
    fuente_ingresos_codeudor:          '',
    mesada_pensional_codeudor:         '',
  })
  const patrimonioCod1 = ref({
    tiene_propiedad_raiz_codeudor: false,
    valor_propiedad_raiz_codeudor: '',
    tiene_vehiculo_codeudor:       false,
    valor_vehiculo_codeudor:       '',
  })
  const ubicacionCod1 = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })

  // ── Codeudor 2 ────────────────────────────────────────────
  const personaCod2 = ref({
    tipo_documento_codeudor2:            '',
    numero_identificacion_codeudor2:     '',
    nombres_codeudor2:                   '',
    apellidos_codeudor2:                 '',
    correo_codeudor2:                    '',
    direccion_codeudor2:                 '',
    fecha_nacimiento_codeudor2:          '',
    fecha_expedicion_codeudor2:          '',
  })
  const laboralCod2 = ref({
    tipo_trabajador_codeudor2:            '',
    nombre_empresa_codeudor2:             '',
    fecha_ingreso_codeudor2:              '',
    tipo_contrato_codeudor2:              '',
    cargo_oficio_codeudor2:               '',
    actividad_comercial_codeudor2:        '',
    fecha_inicio_actividad_codeudor2:     '',
    ocupacion_codeudor2:                  '',
    entidad_pagadora_codeudor2:           '',
    institucion_educativa_codeudor2:      '',
    nivel_educativo_codeudor2:            '',
    tiene_dependientes_codeudor2:         false,
    numero_dependientes_codeudor2:        '',
  })
  const financieraCod2 = ref({
    salario_codeudor2:                  '',
    ingresos_independiente_codeudor2:   '',
    gastos_familiares_codeudor2:        '',
    otros_gastos_codeudor2:             '',
    obligaciones_financieras_codeudor2: '',
    fuente_ingresos_codeudor2:          '',
    mesada_pensional_codeudor2:         '',
  })
  const patrimonioCod2 = ref({
    tiene_propiedad_raiz_codeudor2: false,
    valor_propiedad_raiz_codeudor2: '',
    tiene_vehiculo_codeudor2:       false,
    valor_vehiculo_codeudor2:       '',
  })
  const ubicacionCod2 = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })

  // ── Sección autorizaciones ────────────────────────────────
  const autorizaciones = ref({
    autorizacion_aceptada: false,
  })

  // ── Documentos capturados ─────────────────────────────────
  const documentos = ref({
    doc_cedula_frente_url:                 '',
    doc_cedula_reverso_url:                '',
    doc_soporte_laboral_url:               '',
    doc_liquidacion_matricula_url:         '',
    doc_carta_autorizacion_tercero_url:    '',
    doc_certificacion_bancaria_tercero_url:'',
  })

  // ── Sección firma ─────────────────────────────────────────
  const firma = ref({
    nombre_firma: '',
  })

  // ── Computeds condicionales ───────────────────────────────
  const mostrarTipoOperacion = computed(() =>
    general.value.modalidad_credito === 'ordinario'
  )

  const mostrarValorCredito = computed(() =>
    general.value.modalidad_credito === 'educativo' ||
    general.value.tipo_operacion === 'credito_nuevo'
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

  // Pasos activos según el nuevo diseño de "formulario completo"
  const pasosActivos = computed(() => [
    { numero: 1, titulo: 'Modalidad de crédito',        seccion: 'Solicitud'    },
    { numero: 2, titulo: 'Información de la solicitud', seccion: 'Formulario'   },
    { numero: 3, titulo: 'Codeudores',                  seccion: 'Codeudores'   },
    { numero: 4, titulo: 'Documentos y autorización',   seccion: 'Documentos'   },
    { numero: 5, titulo: 'Revisión y firma',             seccion: 'Legal'        },
  ])

  const totalPasosActivos = computed(() => pasosActivos.value.length)

  const porcentaje = computed(() => {
    const idx = pasosActivos.value.findIndex(p => p.numero === paso.value)
    if (idx < 0 || pasosActivos.value.length <= 1) return 0
    return Math.round((idx / (pasosActivos.value.length - 1)) * 100)
  })

  const pasoActual = computed(() =>
    pasosActivos.value.find(p => p.numero === paso.value) || pasosActivos.value[0]
  )

  // ── Validación paso 2: campos * ───────────────────────────
  const pasoSolicitudValido = computed(() => {
    const d = general.value
    const esOrdinario  = d.modalidad_credito === 'ordinario'
    const esEducativo  = d.modalidad_credito === 'educativo'
    const tipoOp       = d.tipo_operacion

    if (esOrdinario && !tipoOp) return false

    const esReest      = ['reestructura', 'reestructura_desembolso'].includes(tipoOp)
    const esReestDesem = tipoOp === 'reestructura_desembolso'
    const esCreditoNew = tipoOp === 'credito_nuevo'

    const necesitaValorCredito = esEducativo || esCreditoNew || (esOrdinario && !tipoOp)
    const necesitaReestructura = esReest
    const necesitaDesembolso   = esReestDesem

    if (necesitaValorCredito && !d.valor_credito) return false
    if (necesitaReestructura  && !d.valor_reestructura) return false
    if (necesitaDesembolso    && !d.valor_desembolso) return false
    if (esEducativo) {
      if (!d.tipo_estudio || !d.denominacion_carrera) return false
    } else {
      if (!d.destino_credito) return false
    }
    if (!d.plazo_solicitado) return false
    const maxPlazo = esEducativo ? 6 : esOrdinario ? 60 : 120
    if (Number(d.plazo_solicitado) > maxPlazo) return false
    return true
  })

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

  // ── Restaurar borrador guardado ───────────────────────────
  function _aplicarBorrador(borrador) {
    if (borrador.general)               general.value               = { ...general.value,    ...borrador.general }
    if (borrador.persona)               persona.value               = { ...persona.value,    ...borrador.persona }
    if (borrador.laboral)               laboral.value               = { ...laboral.value,    ...borrador.laboral }
    if (borrador.financiera)            financiera.value            = { ...financiera.value, ...borrador.financiera }
    if (borrador.patrimonio)            patrimonio.value            = { ...patrimonio.value, ...borrador.patrimonio }
    if (borrador.cuenta)                cuenta.value                = { ...cuenta.value,     ...borrador.cuenta }
    if (borrador.direccionEstructurada)
      direccionEstructurada.value     = { ...direccionEstructurada.value,     ...borrador.direccionEstructurada     }
    if (borrador.direccionEstructuradaCod1)
      direccionEstructuradaCod1.value = { ...direccionEstructuradaCod1.value, ...borrador.direccionEstructuradaCod1 }
    if (borrador.direccionEstructuradaCod2)
      direccionEstructuradaCod2.value = { ...direccionEstructuradaCod2.value, ...borrador.direccionEstructuradaCod2 }
    if (borrador.numCodudores !== undefined) numCodudores.value = borrador.numCodudores
    if (borrador.personaCod1)    personaCod1.value    = { ...personaCod1.value,    ...borrador.personaCod1    }
    if (borrador.laboralCod1)    laboralCod1.value    = { ...laboralCod1.value,    ...borrador.laboralCod1    }
    if (borrador.financieraCod1) financieraCod1.value = { ...financieraCod1.value, ...borrador.financieraCod1 }
    if (borrador.patrimonioCod1) patrimonioCod1.value = { ...patrimonioCod1.value, ...borrador.patrimonioCod1 }
    if (borrador.personaCod2)    personaCod2.value    = { ...personaCod2.value,    ...borrador.personaCod2    }
    if (borrador.laboralCod2)    laboralCod2.value    = { ...laboralCod2.value,    ...borrador.laboralCod2    }
    if (borrador.financieraCod2) financieraCod2.value = { ...financieraCod2.value, ...borrador.financieraCod2 }
    if (borrador.patrimonioCod2) patrimonioCod2.value = { ...patrimonioCod2.value, ...borrador.patrimonioCod2 }
    if (borrador.ubicacionResidencia)
      ubicacionResidencia.value = { ...ubicacionResidencia.value, ...borrador.ubicacionResidencia }
    if (borrador.ubicacionCod1) ubicacionCod1.value = { ...ubicacionCod1.value, ...borrador.ubicacionCod1 }
    if (borrador.ubicacionCod2) ubicacionCod2.value = { ...ubicacionCod2.value, ...borrador.ubicacionCod2 }
    if (borrador.autorizaciones) autorizaciones.value = { ...autorizaciones.value, ...borrador.autorizaciones }
    if (borrador.firma)          firma.value          = { ...firma.value, ...borrador.firma }

    // Navegar al paso guardado
    const pasoGuardado = borrador.paso
    const enActivos = PASOS_FORMULARIO.filter(p => {
      if (p.numero === 7)                       return general.value.tipo_operacion !== 'reestructura'
      if ([9, 10, 11, 12].includes(p.numero))  return numCodudores.value >= 1
      if ([13, 14, 15, 16].includes(p.numero)) return numCodudores.value >= 2
      return true
    }).some(p => p.numero === pasoGuardado)
    paso.value = enActivos ? pasoGuardado : 1
  }

  function continuarConBorrador() {
    if (_borradorTemp) {
      _aplicarBorrador(_borradorTemp)
      _borradorTemp = null
    }
    mostrarOpcionBorrador.value = false
    borradorRecuperado.value    = true
    // Ocultar mensaje de recuperación después de 5 segundos
    setTimeout(() => {
      borradorRecuperado.value = false
    }, 5000)
  }

  function empezarDeNuevo() {
    limpiarBorradorLocal(verificacion.value.correo)
    _borradorTemp = null
    mostrarOpcionBorrador.value = false
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
        // Fetch del registro completo para tener el id y poder sincronizar campos
        try {
          const registroCompleto = await buscarAsociadoPorCedula(verificacion.value.numero_documento)
          asociadoVerificado.value = registroCompleto ?? resultado
        } catch {
          asociadoVerificado.value = resultado
        }
      }

      persona.value.numero_identificacion = verificacion.value.numero_documento
      persona.value.tipo_documento        = verificacion.value.tipo_documento
      persona.value.correo_electronico    = verificacion.value.correo

      const borrador = recuperarBorradorLocal(verificacion.value.correo)
      if (borrador) {
        _borradorTemp = borrador
        fechaBorrador.value = obtenerFechaBorrador(verificacion.value.correo)
        mostrarOpcionBorrador.value = true
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
      fecha_solicitud: new Date().toISOString().split('T')[0],
      ...general.value,
      num_codeudores: numCodudores.value,
      tiene_codeudor: numCodudores.value > 0,
      // Persona solicitante (excluir campos eliminados que puedan venir de borradores viejos)
      ...(({ ciudad_expedicion: _ce, ...p }) => p)(persona.value),
      direccion_residencia: construirDireccion() || persona.value.direccion_residencia,
      departamento:         ubicacionResidencia.value.depto_nombre,
      ciudad:               ubicacionResidencia.value.municipio_nombre,
      departamento_codigo:  ubicacionResidencia.value.depto_codigo,
      municipio_codigo:     ubicacionResidencia.value.municipio_codigo,
      // Laboral, financiera, patrimonio, cuenta
      ...laboral.value,
      ...financiera.value,
      ...patrimonio.value,
      // Cuenta: excluir entidad_bancaria_otro (campo UI), resolver valor real
      ...(({ entidad_bancaria_otro, ...c }) => ({
        ...c,
        entidad_bancaria: cuenta.value.entidad_bancaria === 'otro'
          ? (cuenta.value.entidad_bancaria_otro || null)
          : cuenta.value.entidad_bancaria,
      }))(cuenta.value),
      // Codeudor 1
      ...(numCodudores.value >= 1 ? (({ ciudad_expedicion_codeudor: _ce, ...p }) => p)(personaCod1.value) : {}),
      ...(numCodudores.value >= 1 ? laboralCod1.value   : {}),
      ...(numCodudores.value >= 1 ? financieraCod1.value : {}),
      ...(numCodudores.value >= 1 ? patrimonioCod1.value : {}),
      ...(numCodudores.value >= 1 ? {
        ciudad_codeudor:       ubicacionCod1.value.municipio_nombre,
        departamento_codeudor: ubicacionCod1.value.depto_nombre,
      } : {}),
      // Codeudor 2
      ...(numCodudores.value >= 2 ? (({ ciudad_expedicion_codeudor2: _ce, ...p }) => p)(personaCod2.value) : {}),
      ...(numCodudores.value >= 2 ? laboralCod2.value   : {}),
      ...(numCodudores.value >= 2 ? financieraCod2.value : {}),
      ...(numCodudores.value >= 2 ? patrimonioCod2.value : {}),
      ...(numCodudores.value >= 2 ? {
        ciudad_codeudor2:       ubicacionCod2.value.municipio_nombre,
        departamento_codeudor2: ubicacionCod2.value.depto_nombre,
      } : {}),
      // Documentos capturados
      ...documentos.value,
      // Autorizaciones
      ...autorizaciones.value,
      // Firma
      ...firma.value,
      paso_actual: paso.value,
    }
  }

  // ── Helper: construir snapshot plano (sin Proxies Vue) ───────────────────
  function _snapshotBorrador() {
    return {
      general:                  toRaw(general.value),
      persona:                  toRaw(persona.value),
      laboral:                  toRaw(laboral.value),
      financiera:               toRaw(financiera.value),
      patrimonio:               toRaw(patrimonio.value),
      cuenta:                   toRaw(cuenta.value),
      direccionEstructurada:    toRaw(direccionEstructurada.value),
      direccionEstructuradaCod1:toRaw(direccionEstructuradaCod1.value),
      direccionEstructuradaCod2:toRaw(direccionEstructuradaCod2.value),
      numCodudores:             numCodudores.value,
      personaCod1:              toRaw(personaCod1.value),
      laboralCod1:              toRaw(laboralCod1.value),
      financieraCod1:           toRaw(financieraCod1.value),
      patrimonioCod1:           toRaw(patrimonioCod1.value),
      personaCod2:              toRaw(personaCod2.value),
      laboralCod2:              toRaw(laboralCod2.value),
      financieraCod2:           toRaw(financieraCod2.value),
      patrimonioCod2:           toRaw(patrimonioCod2.value),
      ubicacionResidencia:      toRaw(ubicacionResidencia.value),
      ubicacionCod1:            toRaw(ubicacionCod1.value),
      ubicacionCod2:            toRaw(ubicacionCod2.value),
      autorizaciones:           toRaw(autorizaciones.value),
      firma:                    toRaw(firma.value),
      paso:                     paso.value,
    }
  }

  // ── Sincronización de campos con tabla asociados ──────────────
  let _syncTimer = null

  async function _sincronizarCampoAsociado(columnaAsociado, nuevoValor) {
    if (!asociadoVerificado.value?.id || !nuevoValor) return
    const valorActual = asociadoVerificado.value[columnaAsociado]
    if (valorActual === nuevoValor) return
    try {
      await actualizarCamposAsociado(asociadoVerificado.value.id, { [columnaAsociado]: nuevoValor })
      asociadoVerificado.value = { ...asociadoVerificado.value, [columnaAsociado]: nuevoValor }
    } catch (e) {
      console.warn('[SolicitudCredito] No se pudo sincronizar campo:', columnaAsociado, e)
    }
  }

  function _syncDebounced(columnaAsociado, nuevoValor) {
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => _sincronizarCampoAsociado(columnaAsociado, nuevoValor), 800)
  }

  // persona
  watch(() => persona.value.nombres,                     v => _syncDebounced('nombres', v))
  watch(() => persona.value.apellidos,                   v => _syncDebounced('apellidos', v))
  watch(() => persona.value.correo_electronico,          v => _syncDebounced('email', v))
  watch(() => persona.value.tipo_documento,              v => _sincronizarCampoAsociado('tipo_identificacion', v))
  watch(() => persona.value.nivel_educativo_solicitante, v => _sincronizarCampoAsociado('nivel_academico', v))
  watch(() => persona.value.fecha_nacimiento,            v => _sincronizarCampoAsociado('fecha_nacimiento', v))
  watch(() => persona.value.fecha_expedicion_documento,  v => _sincronizarCampoAsociado('fecha_expedicion', v))
  watch(() => persona.value.direccion_residencia,        v => _syncDebounced('direccion', v))

  // ubicación de residencia — municipio → ciudad
  watch(() => ubicacionResidencia.value.municipio_nombre, v => _syncDebounced('ciudad', v))

  // dirección estructurada
  watch(() => direccionEstructurada.value.barrio,        v => _syncDebounced('barrio', v))

  // laboral
  watch(() => laboral.value.nombre_empresa,              v => _syncDebounced('empresa', v))
  watch(() => laboral.value.cargo_oficio,                v => _syncDebounced('cargo', v))
  watch(() => laboral.value.ocupacion,                   v => _syncDebounced('ocupacion', v))
  watch(() => laboral.value.tipo_contrato,               v => _sincronizarCampoAsociado('tipo_contrato', v))
  watch(() => laboral.value.fecha_ingreso,               v => _sincronizarCampoAsociado('fecha_ingreso_empresa', v))

  // laboral — limpiar campos al cambiar tipo de trabajador
  watch(() => laboral.value.tipo_trabajador, (nuevo, anterior) => {
    if (!anterior || anterior === nuevo) return
    // Resetear todos los campos específicos del tipo anterior
    laboral.value.nombre_empresa         = ''
    laboral.value.cargo_oficio           = ''
    laboral.value.tipo_contrato          = ''
    laboral.value.fecha_ingreso          = ''
    laboral.value.actividad_comercial    = ''
    laboral.value.ocupacion              = ''
    laboral.value.fecha_inicio_actividad = ''
    laboral.value.entidad_pagadora       = ''
    laboral.value.institucion_educativa  = ''
    laboral.value.nivel_educativo        = ''
    laboral.value.numero_dependientes    = ''
    // Resetear también los campos financieros asociados al tipo
    financiera.value.salario_ingresos_fijos   = ''
    financiera.value.ingresos_independiente   = ''
    financiera.value.gastos_familiares        = ''
    financiera.value.otros_gastos             = ''
    financiera.value.obligaciones_financieras = ''
    financiera.value.fuente_ingresos          = ''
    financiera.value.mesada_pensional         = ''
  })

  // laboral — personas a cargo
  watch(() => laboral.value.numero_dependientes, v => {
    _sincronizarCampoAsociado('personas_a_cargo', v ? Number(v) : 0)
  })

  // laboral — actividad independiente (jsonb)
  watch(laboral, l => {
    if (l.tipo_trabajador !== 'independiente') return
    const actividad = {
      actividad_comercial:    l.actividad_comercial    || null,
      ocupacion:              l.ocupacion              || null,
      fecha_inicio_actividad: l.fecha_inicio_actividad || null,
    }
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => _sincronizarCampoAsociado('actividad_independiente', actividad), 800)
  }, { deep: true })

  // financiera — campos individuales
  watch(() => financiera.value.salario_ingresos_fijos,   v => _syncDebounced('salario', v))
  watch(() => financiera.value.gastos_familiares,        v => _syncDebounced('gastos_familiares', v))
  watch(() => financiera.value.ingresos_independiente,   v => _syncDebounced('otros_ingresos', v))
  watch(() => financiera.value.obligaciones_financieras, v => _syncDebounced('cuotas_credito', v))

  // financiera — totales calculados
  watch(financiera, f => {
    const totalIngresos = (Number(f.salario_ingresos_fijos) || 0) + (Number(f.ingresos_independiente) || 0)
    const totalEgresos  = (Number(f.gastos_familiares) || 0) + (Number(f.otros_gastos) || 0) + (Number(f.obligaciones_financieras) || 0)
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => {
      if (totalIngresos) _sincronizarCampoAsociado('total_ingresos', totalIngresos)
      if (totalEgresos)  _sincronizarCampoAsociado('total_egresos', totalEgresos)
    }, 800)
  }, { deep: true })

  // patrimonio → activos_pasivos (jsonb)
  watch(patrimonio, p => {
    const activos = {
      tiene_propiedad_raiz: p.tiene_propiedad_raiz,
      valor_propiedad_raiz: Number(p.valor_propiedad_raiz) || 0,
      tiene_vehiculo:       p.tiene_vehiculo,
      valor_vehiculo:       Number(p.valor_vehiculo) || 0,
    }
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => _sincronizarCampoAsociado('activos_pasivos', activos), 800)
  }, { deep: true })

  // ── Auto-guardado en localStorage mientras el usuario escribe ─
  watch(
    [general, persona, laboral, financiera, patrimonio, cuenta,
     numCodudores, direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
     ubicacionResidencia,
     personaCod1, laboralCod1, financieraCod1, patrimonioCod1, ubicacionCod1,
     personaCod2, laboralCod2, financieraCod2, patrimonioCod2, ubicacionCod2,
     autorizaciones, firma, paso],
    () => {
      if (!verificado.value || !verificacion.value.correo) return
      clearTimeout(_debounceTimer)
      _debounceTimer = setTimeout(() => {
        guardarBorradorLocal(verificacion.value.correo, _snapshotBorrador())
        ultimoGuardado.value = new Date()
      }, 800)
    },
    { deep: true }
  )

  // ── Guardar: localStorage + Supabase ─────────────────────
  async function guardarPaso() {
    try {
      if (verificacion.value.correo) {
        guardarBorradorLocal(verificacion.value.correo, _snapshotBorrador())
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

  const esUltimoPaso = computed(() => paso.value === 5)

  // ── Token helper ──────────────────────────────────────────
  function generarToken() {
    return crypto.randomUUID().replace(/-/g, '')
  }

  // ── Envío final ───────────────────────────────────────────
  async function enviar() {
    if (!autorizaciones.value.autorizacion_aceptada) {
      error.value = 'Debe aceptar las autorizaciones para continuar.'
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
      const datos = sanitizarObjeto(aplanarDatos())
      // Tokens de firma para codeudores
      if (numCodudores.value >= 1) {
        datos.token_firma_codeudor1  = generarToken()
        datos.correo_envio_codeudor1 = personaCod1.value.correo_codeudor
        // TODO: Enviar email al codeudor con el enlace:
        // https://portal.cooperamigo.com/firma-codeudor?token={datos.token_firma_codeudor1}
      }
      if (numCodudores.value >= 2) {
        datos.token_firma_codeudor2  = generarToken()
        datos.correo_envio_codeudor2 = personaCod2.value.correo_codeudor2
        // TODO: Enviar email al codeudor 2
      }
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
    mostrarOpcionBorrador, fechaBorrador, ultimoGuardado,
    verificarYContinuar, onCorreoCambia,
    continuarConBorrador, empezarDeNuevo,
    // Estado
    general, persona, laboral, financiera, patrimonio, cuenta,
    direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
    numCodudores,
    personaCod1, laboralCod1, financieraCod1, patrimonioCod1,
    personaCod2, laboralCod2, financieraCod2, patrimonioCod2,
    ubicacionResidencia,
    ubicacionCod1, ubicacionCod2,
    autorizaciones, firma,
    documentos,
    // Computeds
    mostrarTipoOperacion, mostrarValorCredito,
    mostrarValorReestructura, mostrarValorDesembolso,
    mostrarCuentaDesembolso, salarioBloqueado,
    montoTotalOperacion, pasoSolicitudValido,
    // Acciones
    siguiente, anterior, irAPaso, enviar, guardarPaso, formatMonto,
  }
}
