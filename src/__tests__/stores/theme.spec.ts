import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

// jsdom doesn't have a <html> classList we can easily assert on,
// but we can verify the side effect by spying on classList methods.

describe('useThemeStore', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    addSpy = vi.spyOn(document.documentElement.classList, 'add')
    removeSpy = vi.spyOn(document.documentElement.classList, 'remove')
    // Reset actual class state
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('defaults to light mode when no localStorage value exists', () => {
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
  })

  it('reads "dark" from localStorage and activates dark mode on init', () => {
    localStorage.setItem('lia_theme', 'dark')
    const store = useThemeStore()
    expect(store.isDark).toBe(true)
  })

  it('reads "light" from localStorage and stays in light mode', () => {
    localStorage.setItem('lia_theme', 'light')
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
  })

  // ── toggle ─────────────────────────────────────────────────────────────────

  it('toggle flips isDark from false to true', () => {
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
    store.toggle()
    expect(store.isDark).toBe(true)
  })

  it('toggle flips isDark from true to false', () => {
    localStorage.setItem('lia_theme', 'dark')
    const store = useThemeStore()
    store.toggle()
    expect(store.isDark).toBe(false)
  })

  it('toggle persists "dark" to localStorage', async () => {
    const store = useThemeStore()
    store.toggle() // light → dark
    // watcher is sync via Vue reactivity in vitest
    await Promise.resolve()
    expect(localStorage.getItem('lia_theme')).toBe('dark')
  })

  it('toggle persists "light" to localStorage', async () => {
    localStorage.setItem('lia_theme', 'dark')
    const store = useThemeStore()
    store.toggle() // dark → light
    await Promise.resolve()
    expect(localStorage.getItem('lia_theme')).toBe('light')
  })

  // ── DOM class side-effects ─────────────────────────────────────────────────

  it('apply() adds "dark" class to <html> when isDark is true', () => {
    localStorage.setItem('lia_theme', 'dark')
    useThemeStore() // creates store; apply() runs on init
    expect(addSpy).toHaveBeenCalledWith('dark')
  })

  it('apply() removes "dark" class from <html> when isDark is false', () => {
    localStorage.setItem('lia_theme', 'light')
    useThemeStore()
    expect(removeSpy).toHaveBeenCalledWith('dark')
  })
})
