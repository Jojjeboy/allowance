<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAllowanceStore } from '@/stores/allowance'
import TransactionItem from '@/components/TransactionItem.vue'

const { t } = useI18n()
const allowance = useAllowanceStore()

// Group transactions by week
const grouped = computed(() => {
  const groups: { label: string; transactions: typeof allowance.transactions }[] = []
  const now = new Date()

  const getWeekStart = (d: Date) => {
    const day = new Date(d)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - day.getDay())
    return day.getTime()
  }

  const thisWeek = getWeekStart(now)
  const lastWeek = thisWeek - 7 * 24 * 60 * 60 * 1000

  const buckets: Record<string, typeof allowance.transactions> = {
    thisWeek: [],
    lastWeek: [],
    older: [],
  }

  for (const tx of allowance.transactions) {
    const week = getWeekStart(new Date(tx.date))
    if (week >= thisWeek) buckets.thisWeek.push(tx)
    else if (week >= lastWeek) buckets.lastWeek.push(tx)
    else buckets.older.push(tx)
  }

  if (buckets.thisWeek.length) groups.push({ label: t('history.thisWeek'), transactions: buckets.thisWeek })
  if (buckets.lastWeek.length) groups.push({ label: t('history.lastWeek'), transactions: buckets.lastWeek })
  if (buckets.older.length) groups.push({ label: t('history.older'), transactions: buckets.older })

  return groups
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 pb-24">
    <!-- Header -->
    <div class="px-5 pt-12 pb-4">
      <h1 class="text-2xl font-black text-gray-900 dark:text-white">{{ t('history.title') }}</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ t('history.subtitle') }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-if="allowance.transactions.length === 0"
      class="text-center py-20 text-gray-400 dark:text-gray-600"
    >
      <div class="text-6xl mb-4">📋</div>
      <p class="font-medium">{{ t('history.empty') }}</p>
    </div>

    <!-- Grouped transactions -->
    <div class="px-5 flex flex-col gap-5">
      <div v-for="group in grouped" :key="group.label">
        <h2 class="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
          {{ group.label }}
        </h2>
        <div class="flex flex-col gap-2">
          <TransactionItem
            v-for="tx in group.transactions"
            :key="tx.id"
            :transaction="tx"
          />
        </div>
      </div>
    </div>
  </div>
</template>
