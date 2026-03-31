import { createRouter, createWebHistory } from 'vue-router'

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
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
