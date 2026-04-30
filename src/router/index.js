import { createRouter, createWebHistory } from 'vue-router'
import { PROXIMAMENTE } from '@/config/flags'

// Rutas que requieren que el portal esté habilitado (PROXIMAMENTE = false)
const RUTAS_BLOQUEADAS_EN_MODO_PROXIMAMENTE = ['solicitar-credito', 'solicitar-afiliacion']

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/solicitar-credito',
    name: 'solicitar-credito',
    component: () => import('@/pages/SolicitudCreditoPage.vue'),
  },
  {
    path: '/solicitar-afiliacion',
    name: 'solicitar-afiliacion',
    component: () => import('@/pages/SolicitudAfiliacionPage.vue'),
  },
  {
    path: '/captura-movil/:token',
    name: 'captura-movil',
    component: () => import('@/pages/CapturaMovilPage.vue'),
    meta: { publico: true, sinLayout: true },
  },
  {
    path: '/firma-codeudor',
    name: 'firma-codeudor',
    component: () => import('@/pages/FirmaCodeudorPage.vue'),
    meta: { publico: true, sinLayout: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (PROXIMAMENTE && RUTAS_BLOQUEADAS_EN_MODO_PROXIMAMENTE.includes(to.name)) {
    return { name: 'home' }
  }
})

export default router
