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
  schemaLaborales,
  validarCampo,
  validarSchema,
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
  const loadingEmail = ref(false)
  const error = ref(null)
  const solicitudCreada = ref(null)
  const asociadoExistente = ref(null)
  const erroresCampos = ref({})
  const honeypot = ref('')

  const emailInicial = ref('')
  const errorEmail = ref('')
  const borradorDisponible = ref(null)
  const tipoDocumentoInicial = ref('cedula_ciudadania')
  const numeroDocumentoInicial = ref('')
  const errorNumeroDoc = ref('')
  const aceptaAutorizacion = ref(false)
  const loadingVerificacion = ref(false)
  const mostrarModalYaAsociado = ref(false)

  const datosPersonales = ref({
    cedula: '', nombres: '', apellidos: '',
    email: '', telefono: '', fecha_nacimiento: '',
    direccion: '', ciudad: '',
  })

  const datosLaborales = ref({
    empresa: '', cargo: '', tipo_contrato: '',
    salario: '', fecha_ingreso_empresa: '',
  })

  registrarInicioFormulario('afiliacion')

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
      return !!(
        datosPersonales.value.cedula &&
        datosPersonales.value.nombres &&
        datosPersonales.value.apellidos &&
        !erroresCampos.value.cedula &&
        !erroresCampos.value.nombres &&
        !erroresCampos.value.apellidos
      )
    }
    if (paso.value === 2) {
      return !!(
        datosLaborales.value.empresa &&
        datosLaborales.value.salario &&
        !erroresCampos.value.empresa &&
        !erroresCampos.value.salario
      )
    }
    return true
  })

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
        datosPersonales.value.email  = email
        datosPersonales.value.cedula = numDoc
        paso.value = 1
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      // Error en verificación — continuar (fail open)
      datosPersonales.value.email  = email
      datosPersonales.value.cedula = numDoc
      paso.value = 1
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      loadingVerificacion.value = false
    }
  }

  async function confirmarEmail() {
    errorEmail.value = ''
    const email = emailInicial.value.trim()
    if (!email) {
      errorEmail.value = 'El correo electrónico es requerido'
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEmail.value = 'Correo electrónico inválido'
      return
    }
    loadingEmail.value = true
    try {
      const borrador = await buscarBorrador(email, 'afiliacion')
      if (borrador) {
        borradorDisponible.value = borrador
      } else {
        datosPersonales.value.email = email
        paso.value = 1
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      datosPersonales.value.email = email
      paso.value = 1
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      loadingEmail.value = false
    }
  }

  function restaurarBorrador() {
    const b = borradorDisponible.value
    if (!b) return
    if (b.datos.datosPersonales) datosPersonales.value = { ...b.datos.datosPersonales }
    if (b.datos.datosLaborales) datosLaborales.value = { ...b.datos.datosLaborales }
    borradorDisponible.value = null
    paso.value = b.paso_actual
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function descartarBorrador() {
    datosPersonales.value.email = emailInicial.value.trim()
    borradorDisponible.value = null
    paso.value = 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function _guardarProgreso(pasoActual) {
    if (!emailInicial.value.trim()) return
    try {
      await guardarBorrador(emailInicial.value, 'afiliacion', pasoActual, {
        datosPersonales: datosPersonales.value,
        datosLaborales: datosLaborales.value,
      })
    } catch {
      // silencioso — no interrumpir el flujo
    }
  }

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

  function irAPaso(n) {
    if (n > paso.value) {
      let resultado
      if (paso.value === 1) resultado = validarSchema(schemaPersonales, datosPersonales.value)
      if (paso.value === 2) resultado = validarSchema(schemaLaborales, datosLaborales.value)
      if (resultado && !resultado.valido) {
        erroresCampos.value = { ...erroresCampos.value, ...resultado.errores }
        return
      }
      _guardarProgreso(n)
    }
    paso.value = n
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviarSolicitud() {
    error.value = null

    if (honeypot.value !== '') return

    if (envioDemasiadorapido('afiliacion', 8)) {
      error.value = 'Por favor complete el formulario con atención.'
      return
    }

    const v1 = validarSchema(schemaPersonales, datosPersonales.value)
    const v2 = validarSchema(schemaLaborales, datosLaborales.value)

    if (!v1.valido || !v2.valido) {
      erroresCampos.value = {
        ...erroresCampos.value,
        ...(v1.errores || {}),
        ...(v2.errores || {}),
      }
      error.value = 'Por favor corrija los errores en el formulario.'
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
        const datosAsociado = sanitizarObjeto({
          cedula:                v1.datos.cedula,
          nombres:               v1.datos.nombres,
          apellidos:             v1.datos.apellidos,
          email:                 emailInicial.value.trim(),
          telefono:              v1.datos.telefono || null,
          fecha_nacimiento:      v1.datos.fecha_nacimiento || null,
          direccion:             v1.datos.direccion || null,
          ciudad:                v1.datos.ciudad || null,
          empresa:               v2.datos.empresa || null,
          cargo:                 v2.datos.cargo || null,
          tipo_contrato:         v2.datos.tipo_contrato || null,
          salario:               v2.datos.salario || null,
          fecha_ingreso_empresa: v2.datos.fecha_ingreso_empresa || null,
        })
        const nuevo = await crearAsociadoAfiliacion(datosAsociado)
        asociadoId = nuevo.id
      }

      const solicitud = await crearSolicitudAfiliacion({ asociado_id: asociadoId })

      await registrarIntento(supabase, datosPersonales.value.cedula, 'afiliacion')
      await eliminarBorrador(emailInicial.value, 'afiliacion').catch(() => {})

      solicitudCreada.value = solicitud
      paso.value = 3
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
    registrarInicioFormulario('afiliacion')
    datosPersonales.value = {
      cedula: '', nombres: '', apellidos: '',
      email: '', telefono: '', fecha_nacimiento: '', direccion: '', ciudad: '',
    }
    datosLaborales.value = {
      empresa: '', cargo: '', tipo_contrato: '',
      salario: '', fecha_ingreso_empresa: '',
    }
  }

  return {
    paso, loading, loadingEmail, error, solicitudCreada, asociadoExistente,
    erroresCampos, honeypot,
    emailInicial, errorEmail, borradorDisponible,
    tipoDocumentoInicial, numeroDocumentoInicial, errorNumeroDoc,
    aceptaAutorizacion, loadingVerificacion, mostrarModalYaAsociado,
    datosPersonales, datosLaborales,
    pasoValido,
    validarCampoActual, schemaPersonales, schemaLaborales,
    verificarYContinuar, confirmarEmail, restaurarBorrador, descartarBorrador,
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
