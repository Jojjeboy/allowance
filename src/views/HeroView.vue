<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAllowanceStore } from '@/stores/allowance'
import ConfettiEffect from '@/components/ConfettiEffect.vue'

const { t, tm } = useI18n()
const allowance = useAllowanceStore()
const confetti = ref<InstanceType<typeof ConfettiEffect> | null>(null)

type CharityKey = 'hundstallet' | 'wwf' | 'barncancerfonden'

const charities: { key: CharityKey; emoji: string; color: string }[] = [
  { key: 'hundstallet', emoji: '🐕', color: 'from-amber-400 to-orange-500' },
  { key: 'wwf', emoji: '🐼', color: 'from-green-400 to-emerald-600' },
  { key: 'barncancerfonden', emoji: '🎗️', color: 'from-pink-400 to-rose-600' },
]

const LS_CHARITY = 'lia_charity'
const selectedCharity = ref<CharityKey>(
  (localStorage.getItem(LS_CHARITY) as CharityKey) ?? 'hundstallet',
)

function selectCharity(key: CharityKey) {
  selectedCharity.value = key
  localStorage.setItem(LS_CHARITY, key)
}

const giveBalance = computed(() => allowance.buckets.give)
const canDonate = computed(() => giveBalance.value >= 100)
const remaining = computed(() => Math.max(0, 100 - giveBalance.value))

const impactText = computed(() => {
  const key = `hero.impacts.${selectedCharity.value}`
  const impacts = tm(key) as Array<{ threshold: number; text: string }>
  if (!Array.isArray(impacts) || impacts.length === 0) return ''
  const balance = giveBalance.value
  let result = impacts[0]?.text ?? ''
  for (const impact of [...impacts].reverse()) {
    if (balance >= impact.threshold) {
      result = impact.text
      break
    }
  }
  return result
})

const showConfirmModal = ref(false)
const donated = ref(false)

function openDonateModal() {
  if (!canDonate.value) return
  showConfirmModal.value = true
}

async function confirmDonate() {
  const amount = giveBalance.value
  await allowance.adjustBucket(
    'give',
    -amount,
    `Donation till ${t(`hero.charities.${selectedCharity.value}`)}`,
  )
  showConfirmModal.value = false
  donated.value = true
  confetti.value?.trigger({ colors: ['#ec4899', '#a855f7', '#facc15', '#f97316'] })
  setTimeout(() => (donated.value = false), 4000)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-gray-950 dark:via-pink-950/10 dark:to-gray-950 pb-24">
    <ConfettiEffect ref="confetti" />

    <!-- Header -->
    <div class="px-5 pt-12 pb-4">
      <h1 class="text-2xl font-black text-gray-900 dark:text-white">{{ t('hero.title') }}</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ t('hero.subtitle') }}</p>
    </div>

    <!-- Charity selector -->
    <div class="px-5 flex flex-col gap-3">
      <button
        v-for="ch in charities"
        :key="ch.key"
        :id="`charity-${ch.key}`"
        @click="selectCharity(ch.key)"
        class="relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all duration-200"
        :class="selectedCharity === ch.key
          ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-gray-800 shadow-card'
          : 'border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'"
      >
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 bg-gradient-to-br"
          :class="ch.color"
        >
          {{ ch.emoji }}
        </div>
        <div class="flex-1 text-left">
          <p class="font-bold text-gray-900 dark:text-white">
            {{ t(`hero.charities.${ch.key}`) }}
          </p>
        </div>
        <!-- Selected ring -->
        <div
          v-if="selectedCharity === ch.key"
          class="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>
    </div>

    <!-- Impact meter -->
    <div class="mx-5 mt-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-5 text-white shadow-glow">
      <p class="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">{{ t('hero.impact') }}</p>

      <!-- Balance display -->
      <div class="flex items-baseline gap-2 mb-4">
        <span class="text-4xl font-black tabular-nums">{{ giveBalance.toFixed(0) }}</span>
        <span class="text-xl font-bold opacity-80">kr</span>
      </div>

      <!-- Progress to 100 -->
      <div class="mb-3">
        <div class="h-3 rounded-full bg-white/20 overflow-hidden">
          <div
            class="h-full rounded-full bg-white transition-all duration-700"
            :style="{ width: Math.min(100, giveBalance) + '%' }"
          />
        </div>
        <p class="text-xs mt-1.5 opacity-80 font-medium">
          {{ Math.min(100, giveBalance).toFixed(0) }} / 100 kr för donation
        </p>
      </div>

      <!-- Impact text -->
      <div class="bg-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
        <p class="text-sm font-semibold">
          🌟 Du har samlat till {{ impactText }}
        </p>
      </div>
    </div>

    <!-- Donate button -->
    <div class="px-5 mt-5">
      <button
        id="donate-btn"
        @click="openDonateModal"
        :disabled="!canDonate"
        class="w-full py-4 rounded-3xl font-black text-lg transition-all duration-300"
        :class="canDonate
          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:scale-[1.02] active:scale-[0.98] animate-pulse-slow'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'"
      >
        <span v-if="canDonate">{{ t('hero.donateButton') }}</span>
        <span v-else>{{ t('hero.donateButtonLocked', { remaining }) }}</span>
      </button>
    </div>

    <!-- Donation success toast -->
    <Transition name="toast">
      <div
        v-if="donated"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl"
      >
        {{ t('hero.donateSuccess', { charity: t(`hero.charities.${selectedCharity}`) }) }}
      </div>
    </Transition>

    <!-- Confirm modal -->
    <Transition name="modal">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
        @click.self="showConfirmModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
          <div class="text-5xl mb-4">🌟</div>
          <h2 class="text-xl font-black text-gray-900 dark:text-white mb-2">
            {{ t('hero.donateConfirmTitle', { charity: t(`hero.charities.${selectedCharity}`) }) }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {{ t('hero.donateConfirmText', {
              amount: giveBalance.toFixed(0),
              charity: t(`hero.charities.${selectedCharity}`)
            }) }}
          </p>
          <div class="flex gap-3">
            <button
              @click="showConfirmModal = false"
              class="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300"
            >
              {{ t('hero.donateConfirmNo') }}
            </button>
            <button
              id="confirm-donate-btn"
              @click="confirmDonate"
              class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-glow"
            >
              {{ t('hero.donateConfirmYes') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(20px); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
