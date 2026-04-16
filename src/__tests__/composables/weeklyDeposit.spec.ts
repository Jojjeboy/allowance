/**
 * Tests for the shouldDepositThisWeek() logic.
 *
 * The function (implemented inside useAllowanceStore) finds the most-recent
 * Friday at 16:00 and returns true when:
 *   - lastDeposit is null, OR
 *   - lastDeposit < that Friday AND now >= that Friday
 *
 * We smoke-test the function through the store so we don't duplicate code.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }) },
}))

import { useAllowanceStore } from '@/stores/allowance'

/** Force "now" to a specific ISO string so tests are deterministic. */
function mockTime(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

describe('shouldDepositThisWeek()', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('returns true when there has never been a deposit (lastDeposit = null)', () => {
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(true)
  })

  /**
   * Scenario: It is Friday 17:00 and we have NOT deposited yet this week.
   * The most-recent Friday 16:00 was 1 hour ago → should deposit.
   */
  it('returns true on Friday afternoon when no deposit has occurred yet', () => {
    mockTime('2026-04-17T17:00:00') // Friday 17:00 local
    // Deposit from previous week
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-08T17:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(true)
  })

  /**
   * Scenario: It is Saturday morning, deposit already happened yesterday.
   * → should NOT deposit again.
   */
  it('returns false on Saturday when deposit occurred the previous Friday', () => {
    mockTime('2026-04-18T09:00:00') // Saturday 09:00 local
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-17T17:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(false)
  })

  /**
   * Scenario: It is Monday, deposit was on Friday of the current "calendar week".
   * → should NOT deposit again this week.
   */
  it('returns false on Monday when deposit happened last Friday (same week)', () => {
    mockTime('2026-04-20T09:00:00') // Monday
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-17T17:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(false)
  })

  /**
   * Scenario: It is Thursday — before payday — no matter when lastDeposit is,
   * we should NOT deposit because we haven't reached Friday 16:00 yet.
   */
  it('returns false on Thursday when this week\'s Friday deposit already happened', () => {
    // "now" = Thursday Apr 16; most-recent Friday = Apr 10 16:00.
    // Last deposit = Saturday Apr 11 (after Apr 10 16:00) → already paid for this cycle.
    mockTime('2026-04-16T10:00:00') // Thursday 10:00
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-11T09:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(false)
  })

  /**
   * Scenario: Two weeks have passed with no deposit.
   * → should deposit (catch-up is handled outside this function, but it returns true).
   */
  it('returns true when two weeks have passed without a deposit', () => {
    mockTime('2026-04-20T09:00:00') // Monday
    localStorage.setItem('lia_last_deposit', JSON.stringify('2026-04-03T17:00:00.000Z'))
    const store = useAllowanceStore()
    expect(store.shouldDepositThisWeek()).toBe(true)
  })
})
