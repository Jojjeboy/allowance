import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'

const ADMIN_PIN = '2204'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const adminMode = ref(false)

  /** True when admin mode has been unlocked with the PIN code */
  const isAdmin = computed(() => adminMode.value)

  // Initialize auth listener
  const initAuth = () => {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser
        loading.value = false
        resolve()
      })
    })
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    adminMode.value = false
    await signOut(auth)
  }

  /** Attempt to enter admin mode with a PIN. Returns true on success. */
  const enterAdmin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      adminMode.value = true
      return true
    }
    return false
  }

  /** Exit admin mode and return to normal view */
  const exitAdmin = () => {
    adminMode.value = false
  }

  return { user, loading, isAdmin, initAuth, loginWithGoogle, logout, enterAdmin, exitAdmin }
})
