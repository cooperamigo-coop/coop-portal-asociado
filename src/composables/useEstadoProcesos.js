import { ref } from 'vue'
import { consultarEstadoProcesos } from '@/services/estadoProcesos.service'
import { sanitizarTexto, esBot } from '@/utils/seguridad'

export function useEstadoProcesos() {
  const cedula    = ref('')
  const correo    = ref('')
  const honeypot  = ref('')
  const cargando  = ref(false)
  const error     = ref(null)
  const resultado = ref(null) // { encontrado, nombre, procesos } | null

  async function consultar() {
    error.value = null
    resultado.value = null

    // Honeypot: si este campo viene lleno, es un bot — no revelamos nada
    if (esBot(honeypot.value)) return

    const cedulaLimpia = sanitizarTexto(cedula.value)
    const correoLimpio = sanitizarTexto(correo.value)

    if (!/^[0-9]{5,15}$/.test(cedulaLimpia)) {
      error.value = 'Ingresa un número de identificación válido.'
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correoLimpio)) {
      error.value = 'Ingresa un correo electrónico válido.'
      return
    }

    cargando.value = true
    try {
      const data = await consultarEstadoProcesos(cedulaLimpia, correoLimpio)
      if (!data?.encontrado) {
        error.value = 'No encontramos ningún proceso con esos datos. Verifica el número de identificación y el correo.'
        return
      }
      resultado.value = data
    } catch (e) {
      error.value = e.message || 'No fue posible consultar el estado en este momento. Intenta nuevamente.'
    } finally {
      cargando.value = false
    }
  }

  function reiniciar() {
    cedula.value = ''
    correo.value = ''
    honeypot.value = ''
    error.value = null
    resultado.value = null
  }

  return { cedula, correo, honeypot, cargando, error, resultado, consultar, reiniciar }
}
