<script setup lang="ts">
import { ref, watch } from 'vue'
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

// Watch for the panel opening so we can seed the input values
watch(unlocked, (val) => { if (val) initEditBalances() })

// Adjust form — one input per bucket, pre-filled with current balance
const bucketOptions: { key: BucketType; label: string; emoji: string }[] = [
  { key: 'spend', label: 'Spendera', emoji: '🛍️' },
  { key: 'give', label: 'Ge bort', emoji: '🎁' },
  { key: 'save', label: 'Spara', emoji: '🏦' },
]

// Local editable copies, initialised once the panel opens
const editBalances = ref<Record<BucketType, number | ''>>({ spend: '', give: '', save: '' })
const adjustNote = ref('')
const successMsg = ref('')

function initEditBalances() {
  editBalances.value = {
    spend: allowance.buckets.spend,
    give: allowance.buckets.give,
    save: allowance.buckets.save,
  }
}

async function saveBalances() {
  for (const b of bucketOptions) {
    const newVal = Number(editBalances.value[b.key])
    if (!isNaN(newVal)) {
      const delta = newVal - allowance.buckets[b.key]
      if (delta !== 0) {
        const desc = adjustNote.value
          ? adjustNote.value
          : delta > 0 ? 'Manuell påfyllnad' : 'Manuellt avdrag'
        await allowance.adjustBucket(b.key, delta, desc, adjustNote.value || undefined)
      }
    }
  }
  adjustNote.value = ''
  successMsg.value = t('admin.success')
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
        <h2 class="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">{{ t('admin.currentBalances') }}</h2>
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

        <!-- One input per bucket, pre-filled with current balance -->
        <div class="flex flex-col gap-3 mb-4">
          <div
            v-for="b in bucketOptions"
            :key="b.key"
            class="flex items-center gap-3"
          >
            <span class="text-2xl w-8 text-center">{{ b.emoji }}</span>
            <label :for="`admin-balance-${b.key}`" class="w-20 text-sm font-semibold text-white/70">{{ b.label }}</label>
            <div class="relative flex-1">
              <input
                :id="`admin-balance-${b.key}`"
                v-model.number="editBalances[b.key]"
                type="number"
                min="0"
                class="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 pr-10 font-bold text-lg focus:outline-none focus:border-purple-400 transition"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium pointer-events-none">kr</span>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <button
          id="admin-save-btn"
          @click="saveBalances"
          class="w-full py-3 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 active:scale-95 transition-all"
        >
          💾 {{ t('admin.saveChanges') }}
        </button>
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
