<script setup lang="ts">
import { computed } from 'vue'
import type { Dream } from '@/stores/dreams'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  dream: Dream
  saveBalance: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ delete: [id: string] }>()

const progress = computed(() => {
  if (props.dream.targetAmount <= 0) return 100
  return Math.min(100, Math.round((props.saveBalance / props.dream.targetAmount) * 100))
})

const isComplete = computed(() => progress.value >= 100)
</script>

<template>
  <div
    class="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-card border border-purple-100 dark:border-purple-900/30 transition-all duration-300 hover:scale-[1.01]"
  >
    <!-- Image -->
    <div class="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
      <img
        v-if="dream.imageBase64"
        :src="dream.imageBase64"
        :alt="dream.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-6xl">✨</div>

      <!-- Complete badge -->
      <div
        v-if="isComplete"
        class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <span class="text-5xl animate-bounce">🎉</span>
      </div>

      <!-- Delete button -->
      <button
        @click.stop="emit('delete', dream.id)"
        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-900 transition-all"
        :aria-label="t('dreams.delete')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Info -->
    <div class="p-4">
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 class="font-bold text-gray-900 dark:text-white text-base leading-tight">
            {{ dream.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {{ saveBalance.toFixed(2) }} {{ t('common.kr') }}
            <span class="opacity-60">{{ t('dreams.of') }}</span>
            {{ dream.targetAmount.toFixed(2) }} {{ t('common.kr') }}
          </p>
        </div>
        <span
          class="text-sm font-black tabular-nums ml-2"
          :class="isComplete ? 'text-green-500' : 'text-purple-600 dark:text-purple-400'"
        >
          {{ progress }}%
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :class="isComplete
            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'"
          :style="{ width: progress + '%' }"
        />
      </div>

      <p v-if="isComplete" class="text-center text-green-600 dark:text-green-400 font-semibold text-sm mt-3">
        {{ t('dreams.completed') }}
      </p>
    </div>
  </div>
</template>
