import { ref, computed } from 'vue'
import {
  consultarCreditoRotativo,
  activarCreditoRotativo,
  solicitarDesembolsoRotativo,
} from '@/services/creditoRotativo.service'

export function useCreditoRotativoPortal() {
  const info      = ref(null)   // resultado de consultar_credito_rotativo_portal (null = sin producto)
  const cedula    = ref('')
  const loading   = ref(false)
  const enviando  = ref(false)
  const error     = ref(null)

  const disponible = computed(() => !!info.value)
  const estado     = computed(() => info.value?.estado ?? null)

  const cupoDisponibleReal = computed(() => {
    const s = info.value?.saldo
    if (!s) return 0
    return Number(s.cupo_disponible) - Number(s.cupo_reservado)
  })

  async function consultar(cedulaAsociado) {
    cedula.value = cedulaAsociado
    loading.value = true
    error.value = null
    try {
      info.value = await consultarCreditoRotativo(cedulaAsociado)
    } catch (e) {
      // Si la consulta falla, simplemente no se ofrece el producto — no bloquea
      // el resto del formulario de crédito.
      console.error('Error consultando Crédito Rotativo:', e)
      info.value = null
    } finally {
      loading.value = false
    }
  }

  async function activar(cupo, cuenta) {
    enviando.value = true
    error.value = null
    try {
      const res = await activarCreditoRotativo(cedula.value, cupo, cuenta)
      if (!res?.ok) {
        error.value = res?.error ?? 'No fue posible activar el producto'
        return false
      }
      await consultar(cedula.value)
      return true
    } catch (e) {
      error.value = 'Ocurrió un error al activar. Intenta de nuevo.'
      console.error(e)
      return false
    } finally {
      enviando.value = false
    }
  }

  async function solicitarDesembolso(monto) {
    enviando.value = true
    error.value = null
    try {
      const res = await solicitarDesembolsoRotativo(cedula.value, monto)
      if (!res?.ok) {
        error.value = res?.error ?? 'No fue posible registrar la solicitud'
        return false
      }
      await consultar(cedula.value)
      return true
    } catch (e) {
      error.value = 'Ocurrió un error al enviar la solicitud. Intenta de nuevo.'
      console.error(e)
      return false
    } finally {
      enviando.value = false
    }
  }

  return {
    info, loading, enviando, error,
    disponible, estado, cupoDisponibleReal,
    consultar, activar, solicitarDesembolso,
  }
}
