<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAllowanceStore } from '@/stores/allowance'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useWeeklyDeposit } from '@/composables/useWeeklyDeposit'
                                                                                                                                                                                                                                      import { useRouter } from 'vue-router'
import BucketCard from '@/components/BucketCard.vue'

const { t } = useI18n()
const allowance = useAllowanceStore()
const authStore = useAuthStore()
const theme = useThemeStore()
const router = useRouter()

useWeeklyDeposit()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 10) return '🌅 God morgon, Lia!'
  if (hour < 17) return '☀️ Hej Lia!'
  return '🌙 God kväll, Lia!'
})

const nextDepositDays = computed(() => {
  const now = new Date()
  const startDate = new Date(allowance.startDate)

  // If before start date (May 1st), calculate days to start date
  if (now < startDate) {
    const msUntilStart = startDate.getTime() - now.getTime()
    return Math.ceil(msUntilStart / (1000 * 60 * 60 * 24))
  }

  // After start date: find next Friday at 08:00
  const day = now.getDay() // 0=Sun, 5=Fri

  // If it's Friday before 08:00, show "today"
  if (day === 5 && now.getHours() < 8) return 0

  // Calculate days until next Friday
  let daysUntilFriday = (5 - day + 7) % 7

  // If it's already Friday (after 08:00) or later in the week, next Friday is 7 days away
  if (day === 5 && now.getHours() >= 8) {
    daysUntilFriday = 7
  } else if (daysUntilFriday === 0) {
    // Today is Friday but before 08:00, show 0
    // (handled above)
  }

  return daysUntilFriday
})

const nextDepositDate = computed(() => {
  const now = new Date()
  const startDate = new Date(allowance.startDate)

  // If before start date, use start date
  if (now < startDate) {
    return startDate
  }

  // Calculate next Friday at 08:00
  const day = now.getDay() // 0=Sun, 5=Fri
  const nextFriday = new Date(now)
  let daysUntilFriday = (5 - day + 7) % 7

  if (day === 5 && now.getHours() >= 8) {
    daysUntilFriday = 7
  } else if (day === 5 && now.getHours() < 8) {
    daysUntilFriday = 0
  }

  nextFriday.setDate(nextFriday.getDate() + daysUntilFriday)
  return nextFriday
})

const weekdayName = computed(() => {
  const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  return weekdays[nextDepositDate.value.getDay()]
})

const paydayLabel = computed(() => {
  if (nextDepositDays.value === 0) return t('dashboard.today')
  if (nextDepositDays.value === 1) return t('dashboard.tomorrow')
  return t('dashboard.inDays', { days: nextDepositDays.value })
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 pb-24">
    <!-- Header -->
    <div class="px-5 pb-2 pt-[calc(3rem+env(safe-area-inset-top,0px))]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900 dark:text-white">{{ greeting }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ t('dashboard.subtitle') }}</p>
        </div>
        <button
          id="theme-toggle"
          @click="theme.toggle()"
          class="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl hover:scale-110 transition-transform"
          :aria-label="theme.isDark ? t('common.lightMode') : t('common.darkMode')"
        >
          {{ theme.isDark ? '☀️' : '🌙' }}
        </button>
      </div>

      <!-- Payday countdown -->
      <div class="mt-4 flex items-center gap-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl px-4 py-3 border border-purple-100 dark:border-purple-900/30">
        <span class="text-xl">💰</span>
        <div class="flex-1">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {{ t('dashboard.nextPayday') }}
          </p>
          <p class="text-sm font-bold text-purple-700 dark:text-purple-300">
            {{ paydayLabel }} · {{ weekdayName }} · +60 kr
          </p>
        </div>
        <router-link
          to="/admin"
          class="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-400 transition-colors select-none"
          aria-label="Admin"
        >⚙</router-link>
      </div>
    </div>

    <!-- Bucket cards -->
    <div class="px-5 mt-5 flex flex-col gap-4">
      <BucketCard bucket="spend" :balance="allowance.buckets.spend" />
      <BucketCard bucket="give" :balance="allowance.buckets.give" />
      <BucketCard bucket="save" :balance="allowance.buckets.save" />
    </div>

    <!-- Total balance pill -->
    <div class="mx-5 mt-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur border border-purple-100 dark:border-purple-900/30 px-5 py-4 flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">Totalt saldo</span>
      <span class="text-xl font-black text-purple-700 dark:text-purple-300 tabular-nums">
        {{ allowance.totalBalance.toFixed(2) }} kr
      </span>
    </div>

    <!-- Logout button -->
    <div class="px-5 mt-8 mb-4">
      <button
        @click="handleLogout"
        class="w-full py-4 rounded-3xl bg-white/40 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-bold hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all active:scale-95"
      >
        {{ t('admin.logout') }}
      </button>
    </div>
  </div>
</template>
