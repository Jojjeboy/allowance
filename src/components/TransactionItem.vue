<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction, BucketType } from '@/stores/allowance'

interface Props {
  transaction: Transaction
}

const props = defineProps<Props>()

const isCredit = computed(() => props.transaction.amount > 0)

const bucketEmoji: Record<BucketType, string> = {
  spend: '🛍️',
  give: '🎁',
  save: '🏦',
}

const formattedDate = computed(() => {
  const d = new Date(props.transaction.date)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div class="flex items-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm">
    <!-- Icon bubble -->
    <div
      class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
      :class="isCredit
        ? 'bg-purple-100 dark:bg-purple-900/30'
        : 'bg-pink-100 dark:bg-pink-900/30'"
    >
      {{ transaction.description === 'Veckopeng' ? '🎉' : bucketEmoji[transaction.bucket] }}
    </div>

    <!-- Details -->
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">
        {{ transaction.description }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
        <span>{{ formattedDate }}</span>
        <span v-if="transaction.note" class="opacity-60">· {{ transaction.note }}</span>
      </p>
    </div>

    <!-- Amount -->
    <div
      class="font-black tabular-nums text-base flex-shrink-0"
      :class="isCredit
        ? 'text-purple-600 dark:text-purple-400'
        : 'text-pink-600 dark:text-pink-400'"
    >
      {{ isCredit ? '+' : '' }}{{ transaction.amount.toFixed(2) }} kr
    </div>
  </div>
</template>
