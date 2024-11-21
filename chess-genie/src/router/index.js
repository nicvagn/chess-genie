import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chessboard',

      component: () => import('../views/ChessboardView.vue'),
    },
  ],
})

export default router
