import { ref, onMounted, onUnmounted } from 'vue'

export function useBreakpoint() {
  const isMobile = ref(typeof window !== 'undefined' && window.innerWidth <= 767)

  function update() {
    isMobile.value = window.innerWidth <= 767
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile }
}
