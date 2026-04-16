import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, auth } from '@/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export interface Dream {
  id: string
  name: string
  targetAmount: number
  imageBase64?: string
  createdAt: string
}

const LS_DREAMS = 'lia_dreams'

function uid(): string {
  return auth.currentUser?.uid ?? 'anonymous'
}

function dreamsDocRef() {
  return doc(db, 'allowance', uid())
}

function loadLocal(): Dream[] {
  try {
    const raw = localStorage.getItem(LS_DREAMS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useDreamsStore = defineStore('dreams', () => {
  const dreams = ref<Dream[]>(loadLocal())

  async function load() {
    try {
      const snap = await getDoc(dreamsDocRef())
      if (snap.exists() && snap.data().dreams) {
        dreams.value = snap.data().dreams
        localStorage.setItem(LS_DREAMS, JSON.stringify(dreams.value))
      }
    } catch {
      // offline – use localStorage
    }
  }

  async function sync() {
    try {
      await setDoc(dreamsDocRef(), { dreams: dreams.value }, { merge: true })
    } catch {
      // offline
    }
    localStorage.setItem(LS_DREAMS, JSON.stringify(dreams.value))
  }

  async function addDream(name: string, targetAmount: number, imageBase64?: string) {
    const dream: Dream = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      imageBase64,
      createdAt: new Date().toISOString(),
    }
    dreams.value.unshift(dream)
    await sync()
    return dream
  }

  async function removeDream(id: string) {
    dreams.value = dreams.value.filter((d) => d.id !== id)
    await sync()
  }

  async function updateDream(id: string, updates: Partial<Dream>) {
    const idx = dreams.value.findIndex((d) => d.id === id)
    if (idx !== -1) {
      dreams.value[idx] = { ...dreams.value[idx], ...updates } as Dream
      await sync()
    }
  }

  return { dreams, load, addDream, removeDream, updateDream }
})
