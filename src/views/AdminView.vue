<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAllowanceStore, type BucketType } from '@/stores/allowance'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const allowance = useAllowanceStore()
const authStore = useAuthStore()
const router = useRouter()

// PIN protection (separate from Google Auth — admin page PIN)
const ADMIN_PIN = '1234' // Change this or move to env
const pinInput = ref('')
const pinError = ref(false)
const unlocked = ref(false)

function submitPin() {
  if (pinInput.value === ADMIN_PIN) {
    unlocked.value = true
    pinError.value = false
  } else {
    pinError.value = true
    pinInput.value = ''
  }
}

// Adjust form
const selectedBucket = ref<BucketType>('spend')
const adjustAmount = ref<number | ''>('')
const adjustNote = ref('')
const successMsg = ref('')

const bucketOptions: { key: BucketType; label: string; emoji: string }[] = [
  { key: 'spend', label: 'Spendera', emoji: '🛍️' },
  { key: 'give', label: 'Ge bort', emoji: '🎁' },
  { key: 'save', label: 'Spara', emoji: '🏦' },
]

async function adjust(type: 'add' | 'deduct') {
  if (!adjustAmount.value) return
  const amount = Number(adjustAmount.value)
  const delta = type === 'add' ? amount : -amount
  const desc = adjustNote.value
    ? adjustNote.value
    : type === 'add' ? 'Manuell påfyllnad' : 'Manuellt avdrag'
  await allowance.adjustBucket(selectedBucket.value, delta, desc, adjustNote.value || undefined)
  successMsg.value = t('admin.success')
  adjustAmount.value = ''
  adjustNote.value = ''
  setTimeout(() => (successMsg.value = ''), 2500)
}

async function resetTimer() {
  allowance.resetWeeklyTimer()
  successMsg.value = t('admin.resetSuccess')
  setTimeout(() => (successMsg.value = ''), 2500)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 pb-10 px-5 pt-12">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-black text-white">{{ t('admin.title') }}</h1>
        <p class="text-sm text-purple-400 mt-0.5">{{ authStore.user?.email }}</p>
      </div>
      <button
        @click="router.push('/')"
        class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Tillbaka"
      >
        ←
      </button>
    </div>

    <!-- PIN gate -->
    <div v-if="!unlocked" class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div class="text-6xl">🔐</div>
      <h2 class="text-xl font-bold text-white">{{ t('admin.pinPrompt') }}</h2>
      <input
        id="admin-pin-input"
        v-model="pinInput"
        type="password"
        inputmode="numeric"
        maxlength="4"
        :placeholder="t('admin.pinPlaceholder')"
        class="w-48 text-center text-3xl tracking-[0.5em] rounded-2xl border-2 py-4 bg-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors"
        :class="pinError ? 'border-red-500' : 'border-white/20'"
        @keyup.enter="submitPin"
      />
      <p v-if="pinError" class="text-red-400 text-sm font-semibold">{{ t('admin.pinError') }}</p>
      <button
        id="admin-pin-submit"
        @click="submitPin"
        class="px-8 py-3 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 active:scale-95 transition-all"
      >
        {{ t('admin.pinSubmit') }}
      </button>
    </div>

    <!-- Admin panel -->
    <div v-else class="flex flex-col gap-5">
      <!-- Current balances -->
      <div class="rounded-3xl bg-white/10 backdrop-blur border border-white/10 p-5">
        <h2 class="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Aktuella saldon</h2>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="b in bucketOptions" :key="b.key" class="text-center">
            <div class="text-2xl mb-1">{{ b.emoji }}</div>
            <div class="text-xl font-black text-white tabular-nums">{{ allowance.buckets[b.key] }}</div>
            <div class="text-xs text-white/50 font-medium">kr</div>
            <div class="text-xs text-purple-300">{{ b.label }}</div>
          </div>
        </div>
      </div>

      <!-- Adjust form -->
      <div class="rounded-3xl bg-white/10 backdrop-blur border border-white/10 p-5">
        <h2 class="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">{{ t('admin.adjust') }}</h2>

        <!-- Bucket selector -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="b in bucketOptions"
            :key="b.key"
            :id="`admin-bucket-${b.key}`"
            @click="selectedBucket = b.key"
            class="flex-1 py-2 rounded-2xl text-sm font-semibold border transition-all"
            :class="selectedBucket === b.key
              ? 'bg-purple-500 border-purple-400 text-white'
              : 'border-white/20 text-white/60 hover:border-white/40'"
          >
            {{ b.emoji }} {{ b.label }}
          </button>
        </div>

        <!-- Amount -->
        <input
          id="admin-amount-input"
          v-model="adjustAmount"
          type="number"
          min="1"
          :placeholder="t('admin.amountPlaceholder')"
          class="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-medium focus:outline-none focus:border-purple-400 transition mb-3"
        />

        <!-- Note -->
        <input
          id="admin-note-input"
          v-model="adjustNote"
          :placeholder="t('admin.notePlaceholder')"
          class="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-medium focus:outline-none focus:border-purple-400 transition mb-4"
        />

        <!-- Add / Deduct buttons -->
        <div class="flex gap-3">
          <button
            id="admin-add-btn"
            @click="adjust('add')"
            :disabled="!adjustAmount"
            class="flex-1 py-3 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {{ t('admin.addMoney') }}
          </button>
          <button
            id="admin-deduct-btn"
            @click="adjust('deduct')"
            :disabled="!adjustAmount"
            class="flex-1 py-3 rounded-2xl bg-pink-500 text-white font-bold hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {{ t('admin.deductMoney') }}
          </button>
        </div>
      </div>

      <!-- Reset timer -->
      <button
        id="admin-reset-timer"
        @click="resetTimer"
        class="w-full py-4 rounded-3xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 active:scale-95 transition-all"
      >
        🔄 {{ t('admin.resetTimer') }}
      </button>

      <!-- Logout -->
      <button
        id="admin-logout"
        @click="handleLogout"
        class="w-full py-4 rounded-3xl border border-white/10 text-white/40 text-sm font-semibold hover:text-white/70 hover:border-white/30 transition-all"
      >
        {{ t('admin.logout') }}
      </button>

      <!-- Success message -->
      <Transition name="toast">
        <div
          v-if="successMsg"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl whitespace-nowrap"
        >
          {{ successMsg }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }
</style>
