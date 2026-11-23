/**
 * [INPUT]: depends on vitest and themeStore exports from ./themeStore
 * [OUTPUT]: unit test suite verifying theme resolution, persistence, toggle behavior, and SSR/Node safety
 * [POS]: verification suite for src/theme/themeStore.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  loadStoredThemePreference,
  resolveTheme,
  useThemeStore,
} from './themeStore'

function createMemoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => {
      data.clear()
    },
  }
}

describe('themeStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useThemeStore.setState({ preference: 'light', resolvedTheme: 'light' })
  })

  it('resolves explicit light, dark, and system preferences accurately', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('defaults to light when window or localStorage is unavailable', () => {
    expect(loadStoredThemePreference()).toBe('light')
    expect(useThemeStore.getState().preference).toBe('light')
    expect(useThemeStore.getState().resolvedTheme).toBe('light')
  })

  it('persists preference under moklu:ui-theme and toggles resolved theme', () => {
    const storage = createMemoryStorage()
    vi.stubGlobal('window', {
      localStorage: storage,
      matchMedia: () => ({ matches: false }),
    })

    useThemeStore.getState().setPreference('dark')
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(useThemeStore.getState().resolvedTheme).toBe('dark')
    expect(loadStoredThemePreference()).toBe('dark')

    useThemeStore.getState().toggleTheme()
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(useThemeStore.getState().preference).toBe('light')
    expect(useThemeStore.getState().resolvedTheme).toBe('light')
  })

  it('tracks system color scheme changes only when preference is system', () => {
    const storage = createMemoryStorage()
    vi.stubGlobal('window', {
      localStorage: storage,
      matchMedia: () => ({ matches: true }),
    })

    useThemeStore.getState().setPreference('system')
    expect(useThemeStore.getState().resolvedTheme).toBe('dark')

    useThemeStore.getState().syncSystemTheme(false)
    expect(useThemeStore.getState().resolvedTheme).toBe('light')

    useThemeStore.getState().setPreference('dark')
    useThemeStore.getState().syncSystemTheme(false)
    expect(useThemeStore.getState().resolvedTheme).toBe('dark')
  })

  it('applies document theme for workspace while keeping studio chrome dark', () => {
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } }
    vi.stubGlobal('document', { documentElement: root })

    applyDocumentTheme('light', 'workspace')
    expect(root.dataset.theme).toBe('light')
    expect(root.style.colorScheme).toBe('light')

    applyDocumentTheme('light', 'studio')
    expect(root.dataset.theme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
  })
})
