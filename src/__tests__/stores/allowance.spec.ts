import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Firebase mock ────────────────────────────────────────────────────────────
vi.mock('@/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  arrayUnion: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}))
// ────────────────────────────────────────────────────────────────────────────

import { useAllowanceStore } from '@/stores/allowance'

// Helpers to manipulate "now" in shouldDepositThisWeek

function setMockDate(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

function restoreDate() {
  vi.useRealTimers()
}

describe('useAllowanceStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    restoreDate()
    vi.clearAllMocks()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with zero buckets when localStorage is empty', () => {
    const store = useAllowanceStore()
    expect(store.buckets).toEqual({ spend: 0, give: 0, save: 0 })
  })

  it('hydrates buckets from localStorage on init', () => {
    localStorage.setItem('lia_buckets', JSON.stringify({ spend: 100, give: 20, save: 50 }))
    const store = useAllowanceStore()
    expect(store.buckets).toEqual({ spend: 100, give: 20, save: 50 })
  })

  it('hydrates transactions from localStorage on init', () => {
    const txs = [{ id: '1', date: '2026-01-01', description: 'Test', amount: 10, bucket: 'spend' }]
    localStorage.setItem('lia_transactions', JSON.stringify(txs))
    const store = useAllowanceStore()
    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0].description).toBe('Test')
  })

  it('falls back to default when localStorage has corrupted JSON', () => {
    localStorage.setItem('lia_buckets', 'NOT_JSON{{')
    const store = useAllowanceStore()
    expect(store.buckets).toEqual({ spend: 0, give: 0, save: 0 })
  })

  // ── totalBalance computed ──────────────────────────────────────────────────

  it('totalBalance sums all three buckets', () => {
    localStorage.setItem('lia_buckets', JSON.stringify({ spend: 40, give: 10, save: 10 }))
    const store = useAllowanceStore()
    expect(store.totalBalance).toBe(60)
  })

  // ── depositWeekly ──────────────────────────────────────────────────────────

  it('depositWeekly adds 40/10/10 to the correct buckets', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    expect(store.buckets.spend).toBe(40)
    expect(store.buckets.give).toBe(10)
    expect(store.buckets.save).toBe(10)
  })

  it('depositWeekly creates a transaction entry', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0].description).toBe('Veckopeng')
    expect(store.transactions[0].amount).toBe(60)
  })

  it('depositWeekly updates lastDeposit', async () => {
    const store = useAllowanceStore()
    expect(store.lastDeposit).toBeNull()
    await store.depositWeekly()
    expect(store.lastDeposit).not.toBeNull()
  })

  it('deposits accumulate correctly after two calls', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    await store.depositWeekly()
    expect(store.buckets.spend).toBe(80)
    expect(store.buckets.give).toBe(20)
    expect(store.buckets.save).toBe(20)
    expect(store.transactions).toHaveLength(2)
  })

  // ── adjustBucket ──────────────────────────────────────────────────────────

  it('adjustBucket increases a bucket balance', async () => {
    const store = useAllowanceStore()
    await store.adjustBucket('save', 50, 'Bonus')
    expect(store.buckets.save).toBe(50)
  })

  it('adjustBucket decreases a bucket balance', async () => {
    localStorage.setItem('lia_buckets', JSON.stringify({ spend: 40, give: 10, save: 10 }))
    const store = useAllowanceStore()
    await store.adjustBucket('spend', -15, 'Köpte glass')
    expect(store.buckets.spend).toBe(25)
  })

  it('adjustBucket never goes below 0', async () => {
    const store = useAllowanceStore()
    await store.adjustBucket('give', -999, 'Stort köp')
    expect(store.buckets.give).toBe(0)
  })

  it('adjustBucket records a transaction', async () => {
    const store = useAllowanceStore()
    await store.adjustBucket('spend', 20, 'Pocket money', 'En liten notering')
    expect(store.transactions).toHaveLength(1)
    const tx = store.transactions[0]
    expect(tx.bucket).toBe('spend')
    expect(tx.amount).toBe(20)
    expect(tx.note).toBe('En liten notering')
  })

  // ── resetWeeklyTimer ──────────────────────────────────────────────────────

  it('resetWeeklyTimer sets lastDeposit 8 days in the past', () => {
    const store = useAllowanceStore()
    store.resetWeeklyTimer()
    const last = new Date(store.lastDeposit!)
    const now = new Date()
    const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(8, 0)
  })

  // ── shouldDepositThisWeek ─────────────────────────────────────────────────

  it('returns true when lastDeposit is null and date is on or after start date', () => {
    setMockDate('2026-05-01T10:00:00') // Friday, May 1st (after 08:00 start)
    const store = useAllowanceStore()
    expect(store.lastDeposit).toBeNull()
    expect(store.shouldDepositThisWeek()).toBe(true)
  })

  it('returns false when date is before start date', () => {
    setMockDate('2026-04-20T10:00:00') // Before May 1st start
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(false)
  })

  it('returns false when lastDeposit is after the most recent Friday 08:00', () => {
    // Simulate: "now" is Saturday after payday, lastDeposit = yesterday (Friday) after 08:00
    setMockDate('2026-05-02T10:00:00') // Saturday
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-05-01T09:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(false)
  })

  it('returns true when lastDeposit predates the most recent Friday 08:00', () => {
    // now = Monday after payday, last deposit was two weeks ago
    setMockDate('2026-05-04T09:00:00') // Monday
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-19T09:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(true)
  })

  // ── localStorage persistence ───────────────────────────────────────────────

  it('persist() writes buckets to localStorage', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    const saved = JSON.parse(localStorage.getItem('lia_buckets')!)
    expect(saved.spend).toBe(40)
  })

  it('persist() writes transactions to localStorage', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    const saved = JSON.parse(localStorage.getItem('lia_transactions')!)
    expect(saved).toHaveLength(1)
  })

  it('persist() writes lastDeposit to localStorage', async () => {
    const store = useAllowanceStore()
    await store.depositWeekly()
    const saved = localStorage.getItem('lia_last_deposit')
    expect(saved).not.toBeNull()
    expect(saved).not.toBe('null')
  })
})
