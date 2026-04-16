import { describe, it, expect, beforeEach, vi } from 'vitest'
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
}))
// ────────────────────────────────────────────────────────────────────────────

import { useDreamsStore } from '@/stores/dreams'

describe('useDreamsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with an empty dreams array', () => {
    const store = useDreamsStore()
    expect(store.dreams).toHaveLength(0)
  })

  it('hydrates dreams from localStorage on init', () => {
    const saved = [
      {
        id: 'abc',
        name: 'Ny cykel',
        targetAmount: 500,
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]
    localStorage.setItem('lia_dreams', JSON.stringify(saved))
    const store = useDreamsStore()
    expect(store.dreams).toHaveLength(1)
    expect(store.dreams[0].name).toBe('Ny cykel')
  })

  it('falls back to [] when localStorage has corrupt JSON', () => {
    localStorage.setItem('lia_dreams', '{{BROKEN')
    const store = useDreamsStore()
    expect(store.dreams).toHaveLength(0)
  })

  // ── addDream ───────────────────────────────────────────────────────────────

  it('addDream adds a new dream with correct fields', async () => {
    const store = useDreamsStore()
    const dream = await store.addDream('iPad', 3000)
    expect(store.dreams).toHaveLength(1)
    expect(store.dreams[0].name).toBe('iPad')
    expect(store.dreams[0].targetAmount).toBe(3000)
    expect(store.dreams[0].id).toBeDefined()
    expect(store.dreams[0].createdAt).toBeDefined()
    expect(dream.name).toBe('iPad')
  })

  it('addDream prepends to the list (newest first)', async () => {
    const store = useDreamsStore()
    await store.addDream('Bok', 100)
    await store.addDream('Lego', 200)
    expect(store.dreams[0].name).toBe('Lego')
    expect(store.dreams[1].name).toBe('Bok')
  })

  it('addDream stores optional base64 image', async () => {
    const store = useDreamsStore()
    await store.addDream('Poster', 50, 'data:image/png;base64,abc123')
    expect(store.dreams[0].imageBase64).toBe('data:image/png;base64,abc123')
  })

  it('addDream persists to localStorage', async () => {
    const store = useDreamsStore()
    await store.addDream('Gitarr', 1500)
    const saved = JSON.parse(localStorage.getItem('lia_dreams')!)
    expect(saved).toHaveLength(1)
    expect(saved[0].name).toBe('Gitarr')
  })

  it('addDream generates unique IDs', async () => {
    const store = useDreamsStore()
    const a = await store.addDream('A', 100)
    const b = await store.addDream('B', 200)
    expect(a.id).not.toBe(b.id)
  })

  // ── removeDream ────────────────────────────────────────────────────────────

  it('removeDream removes the correct item', async () => {
    const store = useDreamsStore()
    const d = await store.addDream('Kostym', 800)
    await store.removeDream(d.id)
    expect(store.dreams).toHaveLength(0)
  })

  it('removeDream ignores unknown id without error', async () => {
    const store = useDreamsStore()
    await store.addDream('Klocka', 600)
    await store.removeDream('nonexistent-id')
    expect(store.dreams).toHaveLength(1)
  })

  it('removeDream updates localStorage', async () => {
    const store = useDreamsStore()
    const d = await store.addDream('Hörlurar', 700)
    await store.removeDream(d.id)
    const saved = JSON.parse(localStorage.getItem('lia_dreams')!)
    expect(saved).toHaveLength(0)
  })

  // ── updateDream ────────────────────────────────────────────────────────────

  it('updateDream patches only the provided fields', async () => {
    const store = useDreamsStore()
    const d = await store.addDream('Skateboard', 400)
    await store.updateDream(d.id, { name: 'Elscooter', targetAmount: 2000 })
    const updated = store.dreams.find((x) => x.id === d.id)!
    expect(updated.name).toBe('Elscooter')
    expect(updated.targetAmount).toBe(2000)
    // original createdAt should still be there
    expect(updated.createdAt).toBe(d.createdAt)
  })

  it('updateDream does nothing when id is not found', async () => {
    const store = useDreamsStore()
    await store.addDream('Tavla', 300)
    await store.updateDream('ghost-id', { name: 'Ghost' })
    expect(store.dreams[0].name).toBe('Tavla')
  })

  it('updateDream persists changes to localStorage', async () => {
    const store = useDreamsStore()
    const d = await store.addDream('Kamera', 2500)
    await store.updateDream(d.id, { targetAmount: 3000 })
    const saved = JSON.parse(localStorage.getItem('lia_dreams')!)
    expect(saved[0].targetAmount).toBe(3000)
  })
})
