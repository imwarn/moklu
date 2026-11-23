/**
 * [INPUT]: depends on create from zustand; reads browser localStorage and matchMedia safely
 * [OUTPUT]: exports ThemePreference, ResolvedTheme, THEME_STORAGE_KEY, resolveTheme, readSystemPrefersDark, applyDocumentTheme, and useThemeStore
 * [POS]: sole theme state store in src/theme; consumed by QuickWorkspace, SiteHeader, and ToolLandingPage while /studio keeps dark canvas chrome
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'moklu:ui-theme'

interface ThemeStoreState {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
  syncSystemTheme: (prefersDark?: boolean) => void
}

function isValidThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean = readSystemPrefersDark(),
): ResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  return prefersDark ? 'dark' : 'light'
}

export function loadStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isValidThemePreference(raw) ? raw : 'light'
  } catch {
    return 'light'
  }
}

function persistThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Ignore quota or private browsing storage restrictions.
  }
}

export function applyDocumentTheme(
  theme: ResolvedTheme,
  surface: 'workspace' | 'studio' = 'workspace',
): void {
  if (typeof document === 'undefined') return
  const effective: ResolvedTheme = surface === 'studio' ? 'dark' : theme
  const root = document.documentElement
  root.dataset.theme = effective
  root.style.colorScheme = effective
}

const initialPreference = loadStoredThemePreference()
const initialResolved = resolveTheme(initialPreference)

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  preference: initialPreference,
  resolvedTheme: initialResolved,

  setPreference: (preference) => {
    const resolvedTheme = resolveTheme(preference)
    persistThemePreference(preference)
    set({ preference, resolvedTheme })
  },

  toggleTheme: () => {
    const next: ThemePreference = get().resolvedTheme === 'dark' ? 'light' : 'dark'
    const resolvedTheme = resolveTheme(next)
    persistThemePreference(next)
    set({ preference: next, resolvedTheme })
  },

  syncSystemTheme: (prefersDark) => {
    const { preference } = get()
    if (preference !== 'system') return
    const resolvedTheme = resolveTheme('system', prefersDark ?? readSystemPrefersDark())
    set({ resolvedTheme })
  },
}))
