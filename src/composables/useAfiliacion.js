import { ref, computed } from 'vue'
import {
  buscarAsociadoPorCedula,
  crearAsociadoAfiliacion,
  crearSolicitudAfiliacion,
} from '@/services/afiliacion.service'
import { supabase } from '@/services/supabase'
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
  const paso = ref(1)
  const loading = ref(false)
  const error = ref(null)
  const solicitudCreada = ref(null)
  const asociadoExistente = ref(null)
  const erroresCampos = ref({})
  const honeypot = ref('')

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
    if (paso.value === 1) {
      return !!(
        datosPersonales.value.cedula &&
        datosPersonales.value.nombres &&
        datosPersonales.value.apellidos &&
        datosPersonales.value.email &&
        !erroresCampos.value.cedula &&
        !erroresCampos.value.nombres &&
        !erroresCampos.value.apellidos &&
        !erroresCampos.value.email
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
        datosPersonales.value.email     = existente.email ?? ''
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
    }
    paso.value = n
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviarSolicitud() {
    error.value = null

    // Anti-bot: honeypot
    if (honeypot.value !== '') return

    // Anti-bot: tiempo mínimo
    if (envioDemasiadorapido('afiliacion', 8)) {
      error.value = 'Por favor complete el formulario con atención.'
      return
    }

    // Validación completa
    const v1 = validarSchema(schemaPersonales, datosPersonales.value)
    const v2 = validarSchema(schemaLaborales, datosLaborales.value)

    // Email es requerido en afiliación
    if (!datosPersonales.value.email) {
      erroresCampos.value = { ...erroresCampos.value, email: 'El correo electrónico es requerido' }
      error.value = 'Por favor corrija los errores en el formulario.'
      return
    }

    if (!v1.valido || !v2.valido) {
      erroresCampos.value = {
        ...erroresCampos.value,
        ...(v1.errores || {}),
        ...(v2.errores || {}),
      }
      error.value = 'Por favor corrija los errores en el formulario.'
      return
    }

    // Rate limiting
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
          email:                 v1.datos.email || null,
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
    paso.value = 1
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
    paso, loading, error, solicitudCreada, asociadoExistente,
    erroresCampos, honeypot,
    datosPersonales, datosLaborales,
    pasoValido,
    validarCampoActual, schemaPersonales, schemaLaborales,
    verificarCedula, irAPaso, enviarSolicitud, reiniciar,
  }
}
