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

export function useSolicitudCredito() {
  const paso           = ref(1)
  const totalPasos     = 17
  const loading        = ref(false)
  const error          = ref(null)
  const solicitudId    = ref(null)
  const enviado        = ref(false)
  const erroresCampos  = ref({})

  // ── Paso previo: verificación ─────────────────────────────
  const verificacion = ref({
    correo:           '',
    tipo_documento:   'cedula_ciudadania',
    numero_documento: '',
  })
  const verificado              = ref(false)
  const loadingVerificacion     = ref(false)
  const errorVerificacion       = ref(null)
  const asociadoVerificado      = ref(null)
  const mostrarModalNoAsociado  = ref(false)
  const tieneBorradorPrevio     = ref(false)
  const borradorRecuperado      = ref(false)

  // ── Sección 1: Datos generales ────────────────────────────
  const general = ref({
    fecha_solicitud:           new Date().toISOString().split('T')[0],
    valor_credito:             '',
    destino_credito:           '',
    plazo_solicitado:          '',
    tipo_operacion:            '',
    monto_reestructura:        '',
    credito_educativo:         false,
    numero_comprobante:        '',
    numero_pagare:             '',
    nombre_firma_solicitante:  '',
    cc_firma_solicitante:      '',
    nombre_codeudor_1:         '',
    cc_codeudor_1:             '',
  })

  // ── Sección 2: Datos personales solicitante ───────────────
  const persona = ref({
    tipo_documento:             '',
    numero_identificacion:      '',
    tipo_persona:               '',
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

  // ── Sección 3: Laboral solicitante ────────────────────────
  const laboral = ref({
    cargo_oficio:       '',
    nombre_empresa:     '',
    tipo_contrato:      '',
    tipo_contrato_otro: '',
    fecha_ingreso:      '',
  })

  // ── Sección 4: Financiera solicitante ─────────────────────
  const financiera = ref({
    salario_ingresos_fijos:   '',
    ingresos_independiente:   '',
    otros_ingresos:           '',
    gastos_familiares:        '',
    otros_gastos:             '',
    obligaciones_financieras: '',
    ahorros:                  '',
  })

  // ── Sección 5: Patrimonio solicitante ─────────────────────
  const patrimonio = ref({
    tiene_propiedad_raiz: false,
    valor_propiedad_raiz: '',
    tiene_vehiculo:       false,
    valor_vehiculo:       '',
    total_activos:        '',
    total_pasivos:        '',
  })

  // ── Sección 6: Cuenta de desembolso ──────────────────────
  const cuenta = ref({
    tipo_cuenta:      '',
    entidad_bancaria: '',
    numero_cuenta:    '',
  })

  // ── Sección 7-8: Referencias solicitante ─────────────────
  const refFamiliar1 = ref({ nombres_apellidos: '', parentesco: '', profesion_oficio: '', contacto: '' })
  const refFamiliar2 = ref({ nombres_apellidos: '', parentesco: '', profesion_oficio: '', contacto: '' })
  const refPersonal1 = ref({ nombres_apellidos: '', relacion: '', profesion_oficio: '', contacto: '' })
  const refPersonal2 = ref({ nombres_apellidos: '', relacion: '', profesion_oficio: '', contacto: '' })

  // ── Sección 9: Datos personales codeudor ──────────────────
  const personaCod = ref({
    tipo_documento_codeudor:             '',
    numero_identificacion_codeudor:      '',
    tipo_persona_codeudor:               '',
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

  // ── Secciones 10-14: Codeudor ────────────────────────────
  const laboralCod = ref({
    cargo_oficio_codeudor:       '',
    nombre_empresa_codeudor:     '',
    tipo_contrato_codeudor:      '',
    tipo_contrato_otro_codeudor: '',
    fecha_ingreso_codeudor:      '',
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
  const refFamiliarCod1 = ref({ nombres_apellidos: '', parentesco: '', profesion_oficio: '', contacto: '' })
  const refFamiliarCod2 = ref({ nombres_apellidos: '', parentesco: '', profesion_oficio: '', contacto: '' })
  const refPersonalCod1 = ref({ nombres_apellidos: '', relacion: '', profesion_oficio: '', contacto: '' })
  const refPersonalCod2 = ref({ nombres_apellidos: '', relacion: '', profesion_oficio: '', contacto: '' })

  // ── Sección 16: Autorizaciones ────────────────────────────
  const autorizaciones = ref({
    autorizacion_reporte_centrales:    false,
    autorizacion_consulta_informacion: false,
    autorizacion_tratamiento_datos:    false,
    autorizacion_datos_sensibles:      false,
    declaracion_veracidad_informacion: false,
  })

  // ── Progreso ──────────────────────────────────────────────
  const porcentaje = computed(() =>
    Math.round(((paso.value - 1) / totalPasos) * 100)
  )

  // ── Definición de pasos ───────────────────────────────────
  const pasos = [
    { numero: 1,  titulo: 'Datos de la solicitud',           seccion: 'Solicitud'   },
    { numero: 2,  titulo: 'Datos personales',                seccion: 'Solicitante' },
    { numero: 3,  titulo: 'Información laboral',             seccion: 'Solicitante' },
    { numero: 4,  titulo: 'Información financiera',          seccion: 'Solicitante' },
    { numero: 5,  titulo: 'Patrimonio',                      seccion: 'Solicitante' },
    { numero: 6,  titulo: 'Cuenta de desembolso',            seccion: 'Solicitante' },
    { numero: 7,  titulo: 'Referencias familiares',          seccion: 'Solicitante' },
    { numero: 8,  titulo: 'Referencias personales',          seccion: 'Solicitante' },
    { numero: 9,  titulo: 'Datos personales codeudor',       seccion: 'Codeudor'    },
    { numero: 10, titulo: 'Información laboral codeudor',    seccion: 'Codeudor'    },
    { numero: 11, titulo: 'Información financiera codeudor', seccion: 'Codeudor'    },
    { numero: 12, titulo: 'Patrimonio codeudor',             seccion: 'Codeudor'    },
    { numero: 13, titulo: 'Referencias familiares codeudor', seccion: 'Codeudor'    },
    { numero: 14, titulo: 'Referencias personales codeudor', seccion: 'Codeudor'    },
    { numero: 15, titulo: 'Datos operativos',                seccion: 'Sistema'     },
    { numero: 16, titulo: 'Autorizaciones',                  seccion: 'Legal'       },
    { numero: 17, titulo: 'Firmas',                          seccion: 'Legal'       },
  ]

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
      const debeVerificar = tiposQueVerifican.includes(
        verificacion.value.tipo_documento
      )

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

      // Pre-llenar campos del solicitante
      persona.value.numero_identificacion = verificacion.value.numero_documento
      persona.value.tipo_documento        = verificacion.value.tipo_documento
      persona.value.correo_electronico    = verificacion.value.correo

      // Recuperar borrador local si existe
      const borrador = recuperarBorradorLocal(verificacion.value.correo)
      if (borrador) {
        if (borrador.general)    general.value    = { ...general.value,    ...borrador.general }
        if (borrador.persona)    persona.value    = { ...persona.value,    ...borrador.persona }
        if (borrador.laboral)    laboral.value    = { ...laboral.value,    ...borrador.laboral }
        if (borrador.financiera) financiera.value = { ...financiera.value, ...borrador.financiera }
        if (borrador.patrimonio) patrimonio.value = { ...patrimonio.value, ...borrador.patrimonio }
        if (borrador.cuenta)     cuenta.value     = { ...cuenta.value,     ...borrador.cuenta }
        if (borrador.paso)       paso.value       = borrador.paso
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

  // Detectar borrador al cambiar correo
  function onCorreoCambia(correo) {
    verificacion.value.correo = correo
    tieneBorradorPrevio.value = tieneBorrador(correo)
  }

  // ── Aplanar todas las secciones para BD ──────────────────
  function aplanarDatos() {
    return {
      ...general.value,
      ...persona.value,
      ...laboral.value,
      ...financiera.value,
      ...patrimonio.value,
      ...cuenta.value,
      ref_familiar_1_nombres:    refFamiliar1.value.nombres_apellidos,
      ref_familiar_1_parentesco: refFamiliar1.value.parentesco,
      ref_familiar_1_profesion:  refFamiliar1.value.profesion_oficio,
      ref_familiar_1_contacto:   refFamiliar1.value.contacto,
      ref_familiar_2_nombres:    refFamiliar2.value.nombres_apellidos,
      ref_familiar_2_parentesco: refFamiliar2.value.parentesco,
      ref_familiar_2_profesion:  refFamiliar2.value.profesion_oficio,
      ref_familiar_2_contacto:   refFamiliar2.value.contacto,
      ref_personal_1_nombres:    refPersonal1.value.nombres_apellidos,
      ref_personal_1_relacion:   refPersonal1.value.relacion,
      ref_personal_1_profesion:  refPersonal1.value.profesion_oficio,
      ref_personal_1_contacto:   refPersonal1.value.contacto,
      ref_personal_2_nombres:    refPersonal2.value.nombres_apellidos,
      ref_personal_2_relacion:   refPersonal2.value.relacion,
      ref_personal_2_profesion:  refPersonal2.value.profesion_oficio,
      ref_personal_2_contacto:   refPersonal2.value.contacto,
      ...personaCod.value,
      ...laboralCod.value,
      ...financieraCod.value,
      ...patrimonioCod.value,
      ref_familiar_cod_1_nombres:    refFamiliarCod1.value.nombres_apellidos,
      ref_familiar_cod_1_parentesco: refFamiliarCod1.value.parentesco,
      ref_familiar_cod_1_profesion:  refFamiliarCod1.value.profesion_oficio,
      ref_familiar_cod_1_contacto:   refFamiliarCod1.value.contacto,
      ref_familiar_cod_2_nombres:    refFamiliarCod2.value.nombres_apellidos,
      ref_familiar_cod_2_parentesco: refFamiliarCod2.value.parentesco,
      ref_familiar_cod_2_profesion:  refFamiliarCod2.value.profesion_oficio,
      ref_familiar_cod_2_contacto:   refFamiliarCod2.value.contacto,
      ref_personal_cod_1_nombres:    refPersonalCod1.value.nombres_apellidos,
      ref_personal_cod_1_relacion:   refPersonalCod1.value.relacion,
      ref_personal_cod_1_profesion:  refPersonalCod1.value.profesion_oficio,
      ref_personal_cod_1_contacto:   refPersonalCod1.value.contacto,
      ref_personal_cod_2_nombres:    refPersonalCod2.value.nombres_apellidos,
      ref_personal_cod_2_relacion:   refPersonalCod2.value.relacion,
      ref_personal_cod_2_profesion:  refPersonalCod2.value.profesion_oficio,
      ref_personal_cod_2_contacto:   refPersonalCod2.value.contacto,
      ...autorizaciones.value,
      paso_actual: paso.value,
    }
  }

  // ── Guardar progreso: localStorage + Supabase ─────────────
  async function guardarPaso() {
    try {
      // 1. Guardar en localStorage de forma inmediata (sin red)
      if (verificacion.value.correo) {
        guardarBorradorLocal(verificacion.value.correo, {
          general:    general.value,
          persona:    persona.value,
          laboral:    laboral.value,
          financiera: financiera.value,
          patrimonio: patrimonio.value,
          cuenta:     cuenta.value,
          paso:       paso.value,
        })
      }

      // 2. Guardar en Supabase en segundo plano
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
  async function siguiente() {
    error.value = null
    loading.value = true
    try {
      await guardarPaso()
      paso.value = Math.min(paso.value + 1, totalPasos)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      loading.value = false
    }
  }

  function anterior() {
    paso.value = Math.max(paso.value - 1, 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function irAPaso(n) {
    if (n >= 1 && n <= totalPasos) {
      paso.value = n
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Envío final ───────────────────────────────────────────
  async function enviar() {
    if (!autorizaciones.value.autorizacion_reporte_centrales ||
        !autorizaciones.value.autorizacion_tratamiento_datos ||
        !autorizaciones.value.declaracion_veracidad_informacion) {
      error.value = 'Debe aceptar todas las autorizaciones obligatorias para continuar.'
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

  return {
    paso, totalPasos, loading, error, enviado,
    solicitudId, erroresCampos, porcentaje, pasos,
    // Verificación previa
    verificacion, verificado, loadingVerificacion, errorVerificacion,
    asociadoVerificado, mostrarModalNoAsociado,
    tieneBorradorPrevio, borradorRecuperado,
    verificarYContinuar, onCorreoCambia,
    // Estado por sección
    general, persona, laboral, financiera, patrimonio, cuenta,
    refFamiliar1, refFamiliar2, refPersonal1, refPersonal2,
    personaCod, laboralCod, financieraCod, patrimonioCod,
    refFamiliarCod1, refFamiliarCod2,
    refPersonalCod1, refPersonalCod2,
    autorizaciones,
    // Acciones
    siguiente, anterior, irAPaso, enviar, guardarPaso,
  }
}
