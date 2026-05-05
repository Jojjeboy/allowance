<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAllowanceStore } from '@/stores/allowance'
import { useDreamsStore } from '@/stores/dreams'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/BottomNav.vue'
import { computed, watch } from 'vue'

const route = useRoute()
const allowanceStore = useAllowanceStore()
const dreamsStore = useDreamsStore()
const authStore = useAuthStore()

const showNav = computed(() =>
  !['login', 'admin'].includes(route.name as string)
)

// Load data once user is authenticated
watch(
  () => authStore.user,
  async (user) => {
    if (user) {
      await Promise.all([allowanceStore.load(), dreamsStore.load()])
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen font-sans antialiased">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <BottomNav v-if="showNav" />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
