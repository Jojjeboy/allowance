import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dreams',
      name: 'dreams',
      component: () => import('../views/DreamsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hero',
      name: 'hero',
      component: () => import('../views/HeroView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresParent: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
  ],
})

// Navigation Guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await authStore.initAuth()
  }

  const isPublic = to.name === 'login'
  const isAuthenticated = !!authStore.user

  if (!isPublic && !isAuthenticated) {
    next('/login')
  } else if (isPublic && isAuthenticated) {
    // Parents go straight to admin, children go to dashboard
    next(authStore.isParent ? '/admin' : '/')
  } else if (to.meta.requiresParent && !authStore.isParent) {
    // Non-parent tried to access an admin-only route — send them home
    next('/')
  } else if (authStore.isParent && to.name !== 'admin' && to.name !== 'login') {
    // Parent tried to access a child-facing route — send them to admin
    next('/admin')
  } else {
    next()
  }
})

export default router
