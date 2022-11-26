import {
  createWebHistory,
  createRouter,
  RouteRecordRaw,
  RouteLocationNormalized,
} from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'connect',
    component: () => import('@/views/Connect.vue'),
  },
  {
    path: '/room/:id',
    name: 'room',
    component: () => import('@/views/Room.vue'),
    props: (route) => ({ query: route.query.id }),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
