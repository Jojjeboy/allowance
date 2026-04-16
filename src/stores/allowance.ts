import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '@/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

export type BucketType = 'spend' | 'give' | 'save'

export interface Transaction {
  id: string
  date: string // ISO string
  description: string
  amount: number // positive = credit, negative = debit
  bucket: BucketType
  note?: string
}

export interface Buckets {
  spend: number
  give: number
  save: number
}

const LS_BUCKETS = 'lia_buckets'
const LS_TRANSACTIONS = 'lia_transactions'
const LS_LAST_DEPOSIT = 'lia_last_deposit'

function uid(): string {
  return auth.currentUser?.uid ?? 'anonymous'
}

function docRef() {
  return doc(db, 'allowance', uid())
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useAllowanceStore = defineStore('allowance', () => {
  const buckets = ref<Buckets>(loadLocal(LS_BUCKETS, { spend: 0, give: 0, save: 0 }))
  const transactions = ref<Transaction[]>(loadLocal(LS_TRANSACTIONS, []))
  const lastDeposit = ref<string | null>(loadLocal(LS_LAST_DEPOSIT, null))
  const loading = ref(false)

  const totalBalance = computed(() => buckets.value.spend + buckets.value.give + buckets.value.save)

  async function load() {
    loading.value = true
    try {
      const snap = await getDoc(docRef())
      if (snap.exists()) {
        const data = snap.data()
        buckets.value = data.buckets ?? { spend: 0, give: 0, save: 0 }
        transactions.value = data.transactions ?? []
        if (data.lastDeposit instanceof Timestamp) {
          lastDeposit.value = data.lastDeposit.toDate().toISOString()
        }
        saveLocal(LS_BUCKETS, buckets.value)
        saveLocal(LS_TRANSACTIONS, transactions.value)
        saveLocal(LS_LAST_DEPOSIT, lastDeposit.value)
      }
    } catch {
      // offline – use localStorage (already loaded above)
    } finally {
      loading.value = false
    }
  }

  async function syncFirestore() {
    try {
      await setDoc(
        docRef(),
        {
          buckets: buckets.value,
          transactions: transactions.value,
          lastDeposit: lastDeposit.value ? Timestamp.fromDate(new Date(lastDeposit.value)) : null,
        },
        { merge: true },
      )
    } catch {
      // offline – already saved to localStorage
    }
  }

  function persist() {
    saveLocal(LS_BUCKETS, buckets.value)
    saveLocal(LS_TRANSACTIONS, transactions.value)
    saveLocal(LS_LAST_DEPOSIT, lastDeposit.value)
    syncFirestore()
  }

  async function depositWeekly() {
    buckets.value.spend += 40
    buckets.value.give += 10
    buckets.value.save += 10

    const now = new Date().toISOString()
    lastDeposit.value = now

    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: now,
      description: 'Veckopeng',
      amount: 60,
      bucket: 'spend', // representative; split implied
    }
    transactions.value.unshift(tx)
    persist()
  }

  async function adjustBucket(
    bucket: BucketType,
    amount: number,
    description: string,
    note?: string,
  ) {
    buckets.value[bucket] = Math.max(0, buckets.value[bucket] + amount)

    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description,
      amount,
      bucket,
      note,
    }
    transactions.value.unshift(tx)
    persist()
  }

  function resetWeeklyTimer() {
    // Set last deposit to 8 days ago so next deposit fires on next Friday
    const d = new Date()
    d.setDate(d.getDate() - 8)
    lastDeposit.value = d.toISOString()
    persist()
  }

  function shouldDepositThisWeek(): boolean {
    if (!lastDeposit.value) return true
    const last = new Date(lastDeposit.value)
    const now = new Date()

    // Find the most recent Friday at 16:00
    const friday = new Date(now)
    friday.setHours(16, 0, 0, 0)
    const day = friday.getDay() // 0=Sun, 5=Fri
    const diff = (day <= 5 ? 5 - day : 5 - day + 7)
    friday.setDate(friday.getDate() - (day === 5 ? 0 : day < 5 ? day - 5 + 7 : day - 5))
    // Simpler: get days since last Monday, go back to Friday
    const daysBack = ((now.getDay() + 1) % 7) + 1 // Mon=0 ... Sun=6 in ISO
    const lastFriday = new Date(now)
    lastFriday.setDate(now.getDate() - ((now.getDay() + 2) % 7))
    lastFriday.setHours(16, 0, 0, 0)

    return now >= lastFriday && last < lastFriday
  }

  return {
    buckets,
    transactions,
    lastDeposit,
    loading,
    totalBalance,
    load,
    depositWeekly,
    adjustBucket,
    resetWeeklyTimer,
    shouldDepositThisWeek,
  }
})
