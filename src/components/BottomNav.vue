<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'dashboard', path: '/', icon: '🏠', labelKey: 'nav.dashboard' },
  { name: 'dreams', path: '/dreams', icon: '✨', labelKey: 'nav.dreams' },
  { name: 'hero', path: '/hero', icon: '🦸‍♀️', labelKey: 'nav.hero' },
  { name: 'history', path: '/history', icon: '📋', labelKey: 'nav.history' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-purple-100 dark:border-purple-900/50 safe-area-bottom"
    role="navigation"
    :aria-label="t('nav.dashboard')"
  >
    <div class="flex items-stretch max-w-lg mx-auto">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :id="`nav-${tab.name}`"
        @click="navigate(tab.path)"
        class="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-all duration-200 relative group"
        :class="
          isActive(tab.path)
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-purple-400'
        "
        :aria-label="t(tab.labelKey)"
        :aria-current="isActive(tab.path) ? 'page' : undefined"
      >
        <!-- Active pill background -->
        <span
          v-if="isActive(tab.path)"
          class="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 -z-10 transition-all duration-300"
        />
        <span
          class="text-xl leading-none mb-0.5 transition-transform duration-200"
          :class="isActive(tab.path) ? 'scale-110' : 'group-hover:scale-105'"
        >
          {{ tab.icon }}
        </span>
        <span class="text-[10px] font-semibold tracking-wide uppercase">
          {{ t(tab.labelKey) }}
        </span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
