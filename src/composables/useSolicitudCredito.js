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
    modalidad_credito:  '',
    tipo_operacion:     '',
    valor_credito:      '',
    valor_reestructura: '',
    valor_desembolso:   '',
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
  const ubicacionExpedicion = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })

  // Ubicación de expedición para codeudores
  const ubicacionExpedicionCod1 = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })
  const ubicacionExpedicionCod2 = ref({ depto_codigo: '', depto_nombre: '', municipio_codigo: '', municipio_nombre: '' })

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
    ciudad_expedicion_codeudor:         '',
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
    descripcion_ocupacion_codeudor:      '',
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
    ciudad_expedicion_codeudor2:         '',
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
    descripcion_ocupacion_codeudor2:      '',
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
    doc_cedula_frente_url: '',
    doc_cedula_reverso_url: '',
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
      if (p.numero === 7)                        return mostrarCuentaDesembolso.value
      if ([9, 10, 11, 12].includes(p.numero))   return numCodudores.value >= 1
      if ([13, 14, 15, 16].includes(p.numero))  return numCodudores.value >= 2
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
    if (!d.destino_credito) return false
    if (!d.plazo_solicitado) return false
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
        if (borrador.direccionEstructurada)     direccionEstructurada.value     = { ...direccionEstructurada.value,     ...borrador.direccionEstructurada     }
        if (borrador.direccionEstructuradaCod1) direccionEstructuradaCod1.value = { ...direccionEstructuradaCod1.value, ...borrador.direccionEstructuradaCod1 }
        if (borrador.direccionEstructuradaCod2) direccionEstructuradaCod2.value = { ...direccionEstructuradaCod2.value, ...borrador.direccionEstructuradaCod2 }
        if (borrador.numCodudores !== undefined) numCodudores.value = borrador.numCodudores
        if (borrador.personaCod1)    personaCod1.value    = { ...personaCod1.value,    ...borrador.personaCod1    }
        if (borrador.laboralCod1)    laboralCod1.value    = { ...laboralCod1.value,    ...borrador.laboralCod1    }
        if (borrador.financieraCod1) financieraCod1.value = { ...financieraCod1.value, ...borrador.financieraCod1 }
        if (borrador.patrimonioCod1) patrimonioCod1.value = { ...patrimonioCod1.value, ...borrador.patrimonioCod1 }
        if (borrador.personaCod2)    personaCod2.value    = { ...personaCod2.value,    ...borrador.personaCod2    }
        if (borrador.laboralCod2)    laboralCod2.value    = { ...laboralCod2.value,    ...borrador.laboralCod2    }
        if (borrador.financieraCod2) financieraCod2.value = { ...financieraCod2.value, ...borrador.financieraCod2 }
        if (borrador.patrimonioCod2) patrimonioCod2.value = { ...patrimonioCod2.value, ...borrador.patrimonioCod2 }
        if (borrador.ubicacionResidencia)    ubicacionResidencia.value    = { ...ubicacionResidencia.value,    ...borrador.ubicacionResidencia    }
        if (borrador.ubicacionExpedicion)    ubicacionExpedicion.value    = { ...ubicacionExpedicion.value,    ...borrador.ubicacionExpedicion    }
        if (borrador.ubicacionExpedicionCod1) ubicacionExpedicionCod1.value = { ...ubicacionExpedicionCod1.value, ...borrador.ubicacionExpedicionCod1 }
        if (borrador.ubicacionExpedicionCod2) ubicacionExpedicionCod2.value = { ...ubicacionExpedicionCod2.value, ...borrador.ubicacionExpedicionCod2 }
        if (borrador.ubicacionCod1) ubicacionCod1.value = { ...ubicacionCod1.value, ...borrador.ubicacionCod1 }
        if (borrador.ubicacionCod2) ubicacionCod2.value = { ...ubicacionCod2.value, ...borrador.ubicacionCod2 }
        if (borrador.autorizaciones) autorizaciones.value = { ...autorizaciones.value, ...borrador.autorizaciones }
        if (borrador.firma)          firma.value          = { ...firma.value, ...borrador.firma }

        // Restaurar paso; validar que esté en los pasos activos
        const pasoRestaurado = borrador.paso
        const enActivos = PASOS_FORMULARIO.filter(p => {
          if (p.numero === 7)                       return general.value.tipo_operacion !== 'reestructura'
          if ([9, 10, 11, 12].includes(p.numero))  return numCodudores.value >= 1
          if ([13, 14, 15, 16].includes(p.numero)) return numCodudores.value >= 2
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
      fecha_solicitud: new Date().toISOString().split('T')[0],
      ...general.value,
      num_codeudores: numCodudores.value,
      tiene_codeudor: numCodudores.value > 0,
      // Persona solicitante
      ...persona.value,
      direccion_residencia: construirDireccion() || persona.value.direccion_residencia,
      departamento:         ubicacionResidencia.value.depto_nombre,
      ciudad:               ubicacionResidencia.value.municipio_nombre,
      departamento_codigo:  ubicacionResidencia.value.depto_codigo,
      municipio_codigo:     ubicacionResidencia.value.municipio_codigo,
      ciudad_expedicion:    ubicacionExpedicion.value.municipio_nombre,
      depto_expedicion:     ubicacionExpedicion.value.depto_nombre,
      // Laboral, financiera, patrimonio, cuenta
      ...laboral.value,
      ...financiera.value,
      ...patrimonio.value,
      ...cuenta.value,
      // Codeudor 1
      ...(numCodudores.value >= 1 ? personaCod1.value   : {}),
      ...(numCodudores.value >= 1 ? laboralCod1.value   : {}),
      ...(numCodudores.value >= 1 ? financieraCod1.value : {}),
      ...(numCodudores.value >= 1 ? patrimonioCod1.value : {}),
      ...(numCodudores.value >= 1 ? {
        ciudad_codeudor:              ubicacionCod1.value.municipio_nombre,
        departamento_codeudor:        ubicacionCod1.value.depto_nombre,
        ciudad_expedicion_codeudor:   ubicacionExpedicionCod1.value.municipio_nombre || personaCod1.value.ciudad_expedicion_codeudor,
        depto_expedicion_codeudor:    ubicacionExpedicionCod1.value.depto_nombre,
      } : {}),
      // Codeudor 2
      ...(numCodudores.value >= 2 ? personaCod2.value   : {}),
      ...(numCodudores.value >= 2 ? laboralCod2.value   : {}),
      ...(numCodudores.value >= 2 ? financieraCod2.value : {}),
      ...(numCodudores.value >= 2 ? patrimonioCod2.value : {}),
      ...(numCodudores.value >= 2 ? {
        ciudad_codeudor2:             ubicacionCod2.value.municipio_nombre,
        departamento_codeudor2:       ubicacionCod2.value.depto_nombre,
        ciudad_expedicion_codeudor2:  ubicacionExpedicionCod2.value.municipio_nombre || personaCod2.value.ciudad_expedicion_codeudor2,
        depto_expedicion_codeudor2:   ubicacionExpedicionCod2.value.depto_nombre,
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

  // ── Guardar: localStorage + Supabase ─────────────────────
  async function guardarPaso() {
    try {
      if (verificacion.value.correo) {
        guardarBorradorLocal(verificacion.value.correo, {
          general, persona, laboral, financiera, patrimonio, cuenta,
          direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
          autorizaciones, firma,
          numCodudores: numCodudores.value,
          personaCod1, laboralCod1, financieraCod1, patrimonioCod1,
          personaCod2, laboralCod2, financieraCod2, patrimonioCod2,
          ubicacionResidencia, ubicacionExpedicion,
          ubicacionExpedicionCod1, ubicacionExpedicionCod2,
          ubicacionCod1, ubicacionCod2,
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
    verificarYContinuar, onCorreoCambia,
    // Estado
    general, persona, laboral, financiera, patrimonio, cuenta,
    direccionEstructurada, direccionEstructuradaCod1, direccionEstructuradaCod2,
    numCodudores,
    personaCod1, laboralCod1, financieraCod1, patrimonioCod1,
    personaCod2, laboralCod2, financieraCod2, patrimonioCod2,
    ubicacionResidencia, ubicacionExpedicion,
    ubicacionExpedicionCod1, ubicacionExpedicionCod2,
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
