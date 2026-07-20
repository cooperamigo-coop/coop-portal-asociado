import { ref, computed } from 'vue'
import {
  buscarAsociadoPorCedula,
  crearAsociado,
  crearSolicitudCredito,
} from '@/services/credito.service'
import { supabase } from '@/services/supabase'
import {
  buscarBorrador,
  guardarBorrador,
  eliminarBorrador,
} from '@/services/progreso.service'
import {
  schemaPersonales,
  schemaLaborales,
  schemaCredito,
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

export function useCredito() {
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

  const datosPersonales = ref({
    cedula: '', nombres: '', apellidos: '',
    email: '', telefono: '', fecha_nacimiento: '',
    direccion: '', ciudad: '',
  })

  const datosLaborales = ref({
    empresa: '', cargo: '', tipo_contrato: '',
    salario: '', fecha_ingreso_empresa: '',
  })

  const datosCredito = ref({
    tipo_credito: '', monto_solicitado: '',
    plazo_meses: '', destino: '',
  })

  registrarInicioFormulario('credito')

  const cuotaEstimada = computed(() => {
    const P = Number(datosCredito.value.monto_solicitado)
    const r = 0.018
    const n = Number(datosCredito.value.plazo_meses)
    if (!P || !n || P < 500000 || P > 100000000) return null
    if (n < 6 || n > 120) return null
    const c = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return isNaN(c) ? null : Math.round(c)
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

  const pasoValido = computed(() => {
    if (paso.value === 0) {
      return !!(emailInicial.value.trim() && !errorEmail.value)
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
    if (paso.value === 3) {
      return !!(
        datosCredito.value.tipo_credito &&
        datosCredito.value.monto_solicitado &&
        datosCredito.value.plazo_meses &&
        !erroresCampos.value.monto_solicitado &&
        !erroresCampos.value.plazo_meses
      )
    }
    return true
  })

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
      const borrador = await buscarBorrador(email, 'credito')
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
    if (b.datos.datosCredito) datosCredito.value = { ...b.datos.datosCredito }
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
      await guardarBorrador(emailInicial.value, 'credito', pasoActual, {
        datosPersonales: datosPersonales.value,
        datosLaborales: datosLaborales.value,
        datosCredito: datosCredito.value,
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
      if (existente) {
        asociadoExistente.value = existente
        datosPersonales.value.nombres   = existente.nombres
        datosPersonales.value.apellidos = existente.apellidos
        datosPersonales.value.telefono  = existente.telefono ?? ''
        datosLaborales.value.empresa    = existente.empresa ?? ''
        datosLaborales.value.cargo      = existente.cargo ?? ''
        datosLaborales.value.salario    = existente.salario ?? ''
      } else {
        asociadoExistente.value = null
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

    if (envioDemasiadorapido('credito', 5)) {
      error.value = 'Por favor complete el formulario con atención.'
      return
    }

    const v1 = validarSchema(schemaPersonales, datosPersonales.value)
    const v2 = validarSchema(schemaLaborales, datosLaborales.value)
    const v3 = validarSchema(schemaCredito, datosCredito.value)

    if (!v1.valido || !v2.valido || !v3.valido) {
      erroresCampos.value = {
        ...erroresCampos.value,
        ...(v1.errores || {}),
        ...(v2.errores || {}),
        ...(v3.errores || {}),
      }
      error.value = 'Por favor corrija los errores en el formulario.'
      return
    }

    const permitido = await verificarRateLimit(supabase, datosPersonales.value.cedula, 'credito')
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
          email:                 emailInicial.value.trim() || null,
          celular:               v1.datos.telefono || null,
          fecha_nacimiento:      v1.datos.fecha_nacimiento || null,
          direccion:             v1.datos.direccion || null,
          ciudad:                v1.datos.ciudad || null,
          empresa:               v2.datos.empresa || null,
          cargo:                 v2.datos.cargo || null,
          tipo_contrato:         v2.datos.tipo_contrato || null,
          salario:               v2.datos.salario || null,
          fecha_ingreso_empresa: v2.datos.fecha_ingreso_empresa || null,
        })
        const nuevo = await crearAsociado(datosAsociado)
        asociadoId = nuevo.id
      }

      const datosSolicitud = {
        asociado_id:      asociadoId,
        tipo_credito:     v3.datos.tipo_credito,
        monto_solicitado: v3.datos.monto_solicitado,
        plazo_meses:      v3.datos.plazo_meses,
        destino:          v3.datos.destino || null,
      }

      const solicitud = await crearSolicitudCredito(datosSolicitud)

      await registrarIntento(supabase, datosPersonales.value.cedula, 'credito')
      await eliminarBorrador(emailInicial.value, 'credito').catch(() => {})

      solicitudCreada.value = solicitud
      paso.value = 4
    } catch (e) {
      if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
        error.value = 'Ya existe una solicitud activa para este documento.'
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
    loading.value = false
    error.value = null
    solicitudCreada.value = null
    asociadoExistente.value = null
    erroresCampos.value = {}
    honeypot.value = ''
    registrarInicioFormulario('credito')
    datosPersonales.value = {
      cedula: '', nombres: '', apellidos: '',
      email: '', telefono: '', fecha_nacimiento: '', direccion: '', ciudad: '',
    }
    datosLaborales.value = {
      empresa: '', cargo: '', tipo_contrato: '', salario: '', fecha_ingreso_empresa: '',
    }
    datosCredito.value = {
      tipo_credito: '', monto_solicitado: '', plazo_meses: '', destino: '',
    }
  }

  return {
    paso, loading, loadingEmail, error, solicitudCreada, asociadoExistente,
    erroresCampos, honeypot,
    emailInicial, errorEmail, borradorDisponible,
    datosPersonales, datosLaborales, datosCredito,
    cuotaEstimada, pasoValido,
    validarCampoActual, schemaPersonales, schemaLaborales, schemaCredito,
    confirmarEmail, restaurarBorrador, descartarBorrador,
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
