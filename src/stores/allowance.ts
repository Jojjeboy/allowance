import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '@/firebase'
import {
  doc,
  getDoc,
  setDoc,
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
const LS_START_DATE = 'lia_start_date'
const LS_DEPOSIT_DAY = 'lia_deposit_day'
const LS_DONATION_THRESHOLD = 'lia_donation_threshold'

// Allowance starts from May 1st, 2026 on Saturdays
const ALLOWANCE_START_DATE = '2026-05-01'

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
  const startDate = ref<string>(loadLocal(LS_START_DATE, ALLOWANCE_START_DATE))
  const depositDay = ref<number>(loadLocal(LS_DEPOSIT_DAY, 5)) // 0=Sun, 5=Fri
  const donationThreshold = ref<number>(loadLocal(LS_DONATION_THRESHOLD, 100))
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
        startDate.value = data.startDate ?? ALLOWANCE_START_DATE
        depositDay.value = data.depositDay ?? 5
        donationThreshold.value = data.donationThreshold ?? 100
        if (data.lastDeposit instanceof Timestamp) {
          lastDeposit.value = data.lastDeposit.toDate().toISOString()
        }
        saveLocal(LS_BUCKETS, buckets.value)
        saveLocal(LS_TRANSACTIONS, transactions.value)
        saveLocal(LS_LAST_DEPOSIT, lastDeposit.value)
        saveLocal(LS_DEPOSIT_DAY, depositDay.value)
        saveLocal(LS_START_DATE, startDate.value)
        saveLocal(LS_DONATION_THRESHOLD, donationThreshold.value)
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
          startDate: startDate.value,
          depositDay: depositDay.value,
          donationThreshold: donationThreshold.value,
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
    saveLocal(LS_START_DATE, startDate.value)
    saveLocal(LS_DEPOSIT_DAY, depositDay.value)
    saveLocal(LS_DONATION_THRESHOLD, donationThreshold.value)
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

  async function depositExtra(amount: number, description: string) {
    // Distribute extra deposit in same proportion as weekly: 40:10:10
    const spendAmount = Math.round((amount * 40) / 60 * 100) / 100
    const giveAmount = Math.round((amount * 10) / 60 * 100) / 100
    const saveAmount = Math.round((amount * 10) / 60 * 100) / 100

    buckets.value.spend += spendAmount
    buckets.value.give += giveAmount
    buckets.value.save += saveAmount

    const now = new Date().toISOString()
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: now,
      description,
      amount,
      bucket: 'spend', // representative; split implied
      note: `Extra deposit: ${spendAmount} spend, ${giveAmount} give, ${saveAmount} save`,
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
    const now = new Date()
    const start = new Date(startDate.value)

    // Don't deposit before the start date
    if (now < start) {
      return false
    }

    // If no deposit yet and we're past the start date, allow first deposit
    if (!lastDeposit.value) {
      return true
    }

    // Find the most recent payday at 08:00
    const lastPayday = new Date(now)
    const currentDay = lastPayday.getDay()
    const daysBack = (currentDay - depositDay.value + 7) % 7
    lastPayday.setDate(lastPayday.getDate() - daysBack)
    lastPayday.setHours(8, 0, 0, 0)

    const last = new Date(lastDeposit.value)
    return now >= lastPayday && last < lastPayday
  }

  return {
    buckets,
    transactions,
    lastDeposit,
    startDate,
    depositDay,
    donationThreshold,
    loading,
    totalBalance,
    load,
    depositWeekly,
    depositExtra,
    adjustBucket,
    resetWeeklyTimer,
    shouldDepositThisWeek,
    persist,
  }
})
