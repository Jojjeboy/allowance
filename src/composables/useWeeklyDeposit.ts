import { onMounted, onUnmounted } from 'vue'
import { useAllowanceStore } from '@/stores/allowance'

export function useWeeklyDeposit() {
  const allowanceStore = useAllowanceStore()
  let intervalId: ReturnType<typeof setInterval> | null = null

  function check() {
    if (allowanceStore.shouldDepositThisWeek()) {
      allowanceStore.depositWeekly()
    }
  }

  onMounted(() => {
    check()
    // Re-check every 5 minutes while app is open
    intervalId = setInterval(check, 5 * 60 * 1000)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })
}
