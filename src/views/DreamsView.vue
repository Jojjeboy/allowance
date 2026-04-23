<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDreamsStore } from '@/stores/dreams'
import { useAllowanceStore } from '@/stores/allowance'
import DreamCard from '@/components/DreamCard.vue'
import ConfettiEffect from '@/components/ConfettiEffect.vue'

const { t } = useI18n()
const dreamsStore = useDreamsStore()
const allowance = useAllowanceStore()
const confetti = ref<InstanceType<typeof ConfettiEffect> | null>(null)

const showAddModal = ref(false)
const newName = ref('')
const newTarget = ref<number | ''>('')
const newImageBase64 = ref<string | undefined>(undefined)
const imagePreview = ref<string | undefined>(undefined)
const saving = ref(false)
const deleteConfirmId = ref<string | null>(null)

// Watch for completing dreams
const prevCompleted = ref(new Set<string>())
watch(
  () => dreamsStore.dreams.map((d) => d.id),
  () => {
    dreamsStore.dreams.forEach((d) => {
      const pct = Math.min(100, (allowance.buckets.save / d.targetAmount) * 100)
      if (pct >= 100 && !prevCompleted.value.has(d.id)) {
        prevCompleted.value.add(d.id)
        confetti.value?.trigger()
      }
    })
  },
  { immediate: true },
)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    newImageBase64.value = ev.target?.result as string
    imagePreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function resetForm() {
  newName.value = ''
  newTarget.value = ''
  newImageBase64.value = undefined
  imagePreview.value = undefined
}

async function addDream() {
  if (!newName.value || !newTarget.value) return
  saving.value = true
  await dreamsStore.addDream(newName.value.trim(), Number(newTarget.value), newImageBase64.value)
  saving.value = false
  showAddModal.value = false
  resetForm()
}

async function confirmDelete(id: string) {
  await dreamsStore.removeDream(id)
  deleteConfirmId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 pb-24">
    <ConfettiEffect ref="confetti" />

    <!-- Header -->
    <div class="px-5 pb-2 pt-[calc(3rem+env(safe-area-inset-top,0px))]">
      <h1 class="text-2xl font-black text-gray-900 dark:text-white">{{ t('dreams.title') }}</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ t('dreams.subtitle') }}</p>

      <!-- Save balance indicator -->
      <div class="mt-3 inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full px-4 py-1.5 text-sm font-semibold border border-yellow-200 dark:border-yellow-800/30">
        🏦 {{ allowance.buckets.save.toFixed(2) }} kr tillgängligt att spara
      </div>
    </div>

    <!-- Dream list -->
    <div class="px-5 mt-4 flex flex-col gap-4">
      <DreamCard
        v-for="dream in dreamsStore.dreams"
        :key="dream.id"
        :dream="dream"
        :save-balance="allowance.buckets.save"
        @delete="deleteConfirmId = $event"
      />

      <div
        v-if="dreamsStore.dreams.length === 0"
        class="text-center py-16 text-gray-400 dark:text-gray-600"
      >
        <div class="text-6xl mb-4">✨</div>
        <p class="font-medium">{{ t('dreams.empty') }}</p>
      </div>
    </div>

    <!-- FAB -->
    <button
      id="add-dream-btn"
      @click="showAddModal = true"
      class="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
      :aria-label="t('dreams.addNew')"
    >
      +
    </button>

    <!-- Delete confirm modal -->
    <Transition name="modal">
      <div
        v-if="deleteConfirmId"
        class="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
        @click.self="deleteConfirmId = null"
      >
        <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-center mb-6">
            {{ t('dreams.confirmDelete') }}
          </p>
          <div class="flex gap-3">
            <button
              @click="deleteConfirmId = null"
              class="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {{ t('dreams.cancel') }}
            </button>
            <button
              @click="confirmDelete(deleteConfirmId!)"
              class="flex-1 py-3 rounded-2xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors"
            >
              {{ t('dreams.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Add Dream modal -->
    <Transition name="modal">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="showAddModal = false; resetForm()"
      >
        <div class="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-slide-up">
          <h2 class="text-xl font-black text-gray-900 dark:text-white mb-5">{{ t('dreams.addTitle') }}</h2>

          <!-- Name -->
          <div class="mb-4">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ t('dreams.name') }}
            </label>
            <input
              id="dream-name-input"
              v-model="newName"
              :placeholder="t('dreams.namePlaceholder')"
              class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <!-- Target -->
          <div class="mb-4">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ t('dreams.target') }}
            </label>
            <input
              id="dream-target-input"
              v-model="newTarget"
              type="number"
              min="1"
              :placeholder="t('dreams.targetPlaceholder')"
              class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <!-- Image -->
          <div class="mb-6">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ t('dreams.image') }}
            </label>
            <label
              id="dream-image-upload"
              class="flex items-center gap-3 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 cursor-pointer hover:border-purple-400 transition-colors"
            >
              <div v-if="imagePreview" class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img :src="imagePreview" class="w-full h-full object-cover" alt="Preview" />
              </div>
              <span class="text-sm font-medium text-purple-600 dark:text-purple-400">
                {{ imagePreview ? t('dreams.changeImage') : t('dreams.uploadImage') }} 📷
              </span>
              <input type="file" accept="image/*" class="sr-only" @change="onFileChange" />
            </label>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              @click="showAddModal = false; resetForm()"
              class="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {{ t('dreams.cancel') }}
            </button>
            <button
              id="dream-save-btn"
              @click="addDream"
              :disabled="saving || !newName || !newTarget"
              class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-glow hover:shadow-glow-pink disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {{ saving ? '...' : t('dreams.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
