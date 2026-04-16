<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BucketType } from '@/stores/allowance'

const { t, n } = useI18n()

interface Props {
  bucket: BucketType
  balance: number
}

const props = defineProps<Props>()

const config = {
  spend: {
    emoji: '🛍️',
    labelKey: 'dashboard.buckets.spend',
    gradient: 'from-purple-500 to-pink-500',
    glowClass: 'shadow-[0_8px_32px_rgba(168,85,247,0.35)]',
    badgeBg: 'bg-white/20',
    weeklyAmount: 40,
  },
  give: {
    emoji: '🎁',
    labelKey: 'dashboard.buckets.give',
    gradient: 'from-pink-500 to-orange-400',
    glowClass: 'shadow-[0_8px_32px_rgba(236,72,153,0.35)]',
    badgeBg: 'bg-white/20',
    weeklyAmount: 10,
  },
  save: {
    emoji: '🏦',
    labelKey: 'dashboard.buckets.save',
    gradient: 'from-yellow-400 to-purple-500',
    glowClass: 'shadow-[0_8px_32px_rgba(250,204,21,0.35)]',
    badgeBg: 'bg-white/20',
    weeklyAmount: 10,
  },
}

const c = computed(() => config[props.bucket])
</script>

<template>
  <div
    class="relative rounded-3xl p-5 text-white overflow-hidden cursor-default select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
    :class="['bg-gradient-to-br', c.gradient, c.glowClass]"
  >
    <!-- Decorative blobs -->
    <div
      class="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none"
    />
    <div
      class="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none"
    />

    <!-- Header row -->
    <div class="flex items-center justify-between mb-4 relative">
      <div class="flex items-center gap-2">
        <span class="text-3xl">{{ c.emoji }}</span>
        <span class="font-bold text-lg tracking-tight">{{ t(c.labelKey) }}</span>
      </div>
      <span
        class="text-xs font-semibold px-2.5 py-1 rounded-full"
        :class="c.badgeBg"
      >
        +{{ c.weeklyAmount }} kr/v
      </span>
    </div>

    <!-- Balance -->
    <div class="relative">
      <div class="text-4xl font-black tracking-tight tabular-nums leading-none">
        {{ balance.toFixed(0) }}
        <span class="text-2xl font-bold opacity-80 ml-1">kr</span>
      </div>
      <div class="text-sm opacity-70 mt-1 font-medium">Tillgängligt saldo</div>
    </div>
  </div>
</template>
