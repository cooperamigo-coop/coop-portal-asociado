import { ref, computed } from 'vue'
import {
  buscarAsociadoPorCedula,
  crearAsociadoAfiliacion,
  crearSolicitudAfiliacion,
} from '@/services/afiliacion.service'

export function useAfiliacion() {
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
    empresa: '', cargo: '', tipo_contrato: '', salario: '',
    fecha_ingreso_empresa: '',
  })

  const pasoValido = computed(() => {
    if (paso.value === 1)
      return !!(datosPersonales.value.cedula &&
                datosPersonales.value.nombres &&
                datosPersonales.value.apellidos &&
                datosPersonales.value.email)
    if (paso.value === 2)
      return !!(datosLaborales.value.empresa && datosLaborales.value.salario)
    return true
  })

  async function verificarCedula() {
    if (datosPersonales.value.cedula.length < 5) return
    try {
      const existente = await buscarAsociadoPorCedula(datosPersonales.value.cedula)
      asociadoExistente.value = existente ?? null
      if (existente) {
        datosPersonales.value.nombres   = existente.nombres
        datosPersonales.value.apellidos = existente.apellidos
        datosPersonales.value.email     = existente.email ?? ''
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
        const nuevo = await crearAsociadoAfiliacion({
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
          salario:              datosLaborales.value.salario
                                  ? Number(datosLaborales.value.salario) : null,
          fecha_ingreso_empresa:datosLaborales.value.fecha_ingreso_empresa || null,
        })
        asociadoId = nuevo.id
      }

      const solicitud = await crearSolicitudAfiliacion({
        asociado_id: asociadoId,
      })

      solicitudCreada.value = solicitud
      paso.value = 3
    } catch (e) {
      error.value = 'Error al enviar la solicitud. Intente nuevamente.'
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
      empresa: '', cargo: '', tipo_contrato: '',
      salario: '', fecha_ingreso_empresa: '',
    }
  }

  return {
    paso, loading, error, solicitudCreada, asociadoExistente,
    datosPersonales, datosLaborales,
    pasoValido,
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
