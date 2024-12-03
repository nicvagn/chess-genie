import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chessboard',

      component: () => import('../views/ChessBoardView.vue'),
    },
    {
      path: '/cg',
      name: 'chessground',

      component: () => import('../views/ChessGroundView.vue'),
    },
  ],
})

export default router
