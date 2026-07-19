import { createRouter, createWebHistory } from 'vue-router'
import { PROXIMAMENTE } from '@/config/flags'

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
    path: '/estado-procesos',
    name: 'estado-procesos',
    component: () => import('@/pages/EstadoProcesosPage.vue'),
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
    path: '/confirmar-solicitud',
    name: 'confirmar-solicitud-asistida',
    component: () => import('@/pages/ConfirmacionSolicitudAsistidaPage.vue'),
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

// En modo próximamente solo se permite la home — todo lo demás redirige ahí
router.beforeEach((to) => {
  if (PROXIMAMENTE && to.name !== 'home') {
    return { name: 'home' }
  }
})

export default router
