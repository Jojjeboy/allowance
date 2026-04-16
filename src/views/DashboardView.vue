<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAllowanceStore } from '@/stores/allowance'
import { useThemeStore } from '@/stores/theme'
import { useWeeklyDeposit } from '@/composables/useWeeklyDeposit'
import BucketCard from '@/components/BucketCard.vue'

const { t } = useI18n()
const allowance = useAllowanceStore()
const theme = useThemeStore()

useWeeklyDeposit()

const showPaydayBanner = ref(false)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 10) return '🌅 God morgon, Lia!'
  if (hour < 17) return '☀️ Hej Lia!'
  return '🌙 God kväll, Lia!'
})

const nextFriday = computed(() => {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 5=Fri
  let daysUntil = (5 - day + 7) % 7
  // If it's Friday before 16:00, show "today"
  if (day === 5 && now.getHours() < 16) daysUntil = 0
  else if (day === 5) daysUntil = 7 // already paid today, next is in 7 days
  return daysUntil
})

const paydayLabel = computed(() => {
  if (nextFriday.value === 0) return t('dashboard.today')
  if (nextFriday.value === 1) return t('dashboard.tomorrow')
  return t('dashboard.inDays', { days: nextFriday.value })
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 pb-24">
    <!-- Header -->
    <div class="px-5 pt-12 pb-2">
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
            {{ paydayLabel }} · +60 kr
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
        {{ allowance.totalBalance.toFixed(0) }} kr
      </span>
    </div>
  </div>
</template>
