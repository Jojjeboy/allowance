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

const PARENT_UIDS = (import.meta.env.VITE_PARENT_UID as string || '').split(',').map(uid => uid.trim())
const CHILD_UID = import.meta.env.VITE_CHILD_UID as string

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  /** True when the logged-in user is one of the designated parent/admin accounts */
  const isParent = computed(() => !!user.value && PARENT_UIDS.includes(user.value.uid))

  /** True when the logged-in user is the child account */
  const isChild = computed(() => !!user.value && user.value.uid === CHILD_UID)

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
    await signOut(auth)
  }

  return { user, loading, isParent, isChild, initAuth, loginWithGoogle, logout }
})
