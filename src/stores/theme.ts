import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const LS_THEME = 'lia_theme'

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem(LS_THEME)
  const isDark = ref(stored === 'dark') // default: light

  function apply() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (val) => {
    localStorage.setItem(LS_THEME, val ? 'dark' : 'light')
    apply()
  })

  // Apply on init
  apply()

  return { isDark, toggle }
})
