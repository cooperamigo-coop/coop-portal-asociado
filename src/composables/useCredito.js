import { ref, computed } from 'vue'
import {
  buscarAsociadoPorCedula,
  crearAsociado,
  crearSolicitudCredito,
} from '@/services/credito.service'

export function useCredito() {
  const paso = ref(1)
  const loading = ref(false)
  const error = ref(null)
  const solicitudCreada = ref(null)
  const asociadoExistente = ref(null)

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

  const cuotaEstimada = computed(() => {
    const P = Number(datosCredito.value.monto_solicitado)
    const r = 0.018
    const n = Number(datosCredito.value.plazo_meses)
    if (!P || !n) return null
    const c = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return isNaN(c) ? null : Math.round(c)
  })

  const pasoValido = computed(() => {
    if (paso.value === 1)
      return !!(datosPersonales.value.cedula &&
                datosPersonales.value.nombres &&
                datosPersonales.value.apellidos)
    if (paso.value === 2)
      return !!(datosLaborales.value.empresa && datosLaborales.value.salario)
    if (paso.value === 3)
      return !!(datosCredito.value.tipo_credito &&
                datosCredito.value.monto_solicitado &&
                datosCredito.value.plazo_meses)
    return true
  })

  async function verificarCedula() {
    if (datosPersonales.value.cedula.length < 5) return
    try {
      const existente = await buscarAsociadoPorCedula(datosPersonales.value.cedula)
      if (existente) {
        asociadoExistente.value = existente
        datosPersonales.value.nombres   = existente.nombres
        datosPersonales.value.apellidos = existente.apellidos
        datosPersonales.value.email     = existente.email ?? ''
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
    paso.value = n
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviarSolicitud() {
    loading.value = true
    error.value = null
    try {
      let asociadoId

      if (asociadoExistente.value) {
        asociadoId = asociadoExistente.value.id
      } else {
        const nuevo = await crearAsociado({
          cedula:               datosPersonales.value.cedula,
          nombres:              datosPersonales.value.nombres.trim(),
          apellidos:            datosPersonales.value.apellidos.trim(),
          email:                datosPersonales.value.email || null,
          telefono:             datosPersonales.value.telefono || null,
          fecha_nacimiento:     datosPersonales.value.fecha_nacimiento || null,
          direccion:            datosPersonales.value.direccion || null,
          ciudad:               datosPersonales.value.ciudad || null,
          empresa:              datosLaborales.value.empresa || null,
          cargo:                datosLaborales.value.cargo || null,
          tipo_contrato:        datosLaborales.value.tipo_contrato || null,
          salario:              datosLaborales.value.salario ? Number(datosLaborales.value.salario) : null,
          fecha_ingreso_empresa:datosLaborales.value.fecha_ingreso_empresa || null,
        })
        asociadoId = nuevo.id
      }

      const solicitud = await crearSolicitudCredito({
        asociado_id:      asociadoId,
        tipo_credito:     datosCredito.value.tipo_credito,
        monto_solicitado: Number(datosCredito.value.monto_solicitado),
        plazo_meses:      Number(datosCredito.value.plazo_meses),
        destino:          datosCredito.value.destino || null,
      })

      solicitudCreada.value = solicitud
      paso.value = 4
    } catch (e) {
      error.value = e.message.includes('duplicate')
        ? 'Ya existe una solicitud activa para esta cédula.'
        : 'Error al enviar la solicitud. Intente nuevamente.'
    } finally {
      loading.value = false
    }
  }

  function reiniciar() {
    paso.value = 1
    error.value = null
    solicitudCreada.value = null
    asociadoExistente.value = null
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
    paso, loading, error, solicitudCreada, asociadoExistente,
    datosPersonales, datosLaborales, datosCredito,
    cuotaEstimada, pasoValido,
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
