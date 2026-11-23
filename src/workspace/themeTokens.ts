/**
 * [INPUT]: depends on WorkspaceTheme from ./types
 * [OUTPUT]: exports WorkspaceThemeTokens and getWorkspaceThemeTokens for WCAG-compliant light/dark violet-zinc styling
 * [POS]: shared design token map for src/workspace; aligns brand accent with landing page violet/zinc palette and guarantees dark-mode contrast
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { WorkspaceTheme } from './types'

export interface WorkspaceThemeTokens {
  shell: string
  card: string
  cardMuted: string
  stage: string
  border: string
  text: string
  textMuted: string
  textSubtle: string
  tabBar: string
  tabActive: string
  tabIdle: string
  input: string
  buttonPrimary: string
  buttonSecondary: string
  buttonStudio: string
  buttonPro: string
  pillActive: string
  pillIdle: string
  dropzone: string
  dropzoneActive: string
  dropzoneIcon: string
  privacyBadge: string
  privacyBanner: string
  accentChip: string
  accentRing: string
  badgePositive: string
  badgeWarning: string
  dangerGhost: string
  errorText: string
  focusRing: string
  busyPill: string
}

const LIGHT_TOKENS: WorkspaceThemeTokens = {
  shell: 'bg-white text-zinc-900 border-zinc-200/90 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.14)]',
  card: 'bg-white border-zinc-200/90',
  cardMuted: 'bg-zinc-50/90 border-zinc-200/80',
  stage: 'bg-zinc-100/90 border-zinc-200/90',
  border: 'border-zinc-200',
  text: 'text-zinc-900',
  textMuted: 'text-zinc-600',
  textSubtle: 'text-zinc-500',
  tabBar: 'bg-zinc-100/90 border-zinc-200/80',
  tabActive: 'bg-white text-violet-700 shadow-sm ring-1 ring-zinc-200/90',
  tabIdle: 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60',
  input: 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20',
  buttonPrimary: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-sm',
  buttonSecondary: 'bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100',
  buttonStudio: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-sm',
  buttonPro: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/90',
  pillActive: 'bg-violet-600 text-white border-violet-600 shadow-xs',
  pillIdle: 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
  dropzone: 'border-zinc-300 bg-zinc-50/70 hover:border-violet-400 hover:bg-violet-50/40',
  dropzoneActive: 'border-violet-500 bg-violet-50/80',
  dropzoneIcon: 'bg-violet-500/12 text-violet-600',
  privacyBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  privacyBanner: 'bg-emerald-50/90 text-emerald-900 border-emerald-200',
  accentChip: 'bg-violet-600/10 text-violet-700 hover:bg-violet-600/20',
  accentRing: 'border-violet-500 ring-2 ring-violet-500/35',
  badgePositive: 'bg-emerald-500/15 text-emerald-700',
  badgeWarning: 'bg-amber-500/15 text-amber-800',
  dangerGhost: 'border-rose-300/80 text-rose-600 hover:bg-rose-500/10',
  errorText: 'text-rose-600',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
  busyPill: 'bg-white/90 text-violet-700 border-violet-200 shadow-sm',
}

const DARK_TOKENS: WorkspaceThemeTokens = {
  shell: 'bg-[#15151c] text-[#ececf4] border-white/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.65)]',
  card: 'bg-[#1a1a24] border-white/10',
  cardMuted: 'bg-[#121218] border-white/10',
  stage: 'bg-[#0e0e14] border-white/10',
  border: 'border-white/10',
  text: 'text-[#f1f1f8]',
  textMuted: 'text-[#b0b3c6]',
  textSubtle: 'text-[#9699b0]',
  tabBar: 'bg-[#101016] border-white/10',
  tabActive: 'bg-[#232333] text-violet-200 shadow-sm ring-1 ring-violet-400/35',
  tabIdle: 'text-[#a6aabf] hover:text-white hover:bg-white/5',
  input: 'bg-[#111118] border-white/15 text-[#f1f1f8] placeholder:text-[#7e8299] focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25',
  buttonPrimary: 'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-sm',
  buttonSecondary: 'bg-white/5 text-[#ececf4] border border-white/15 hover:bg-white/10 active:bg-white/15',
  buttonStudio: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-sm',
  buttonPro: 'bg-amber-500/15 text-amber-200 border border-amber-400/30 hover:bg-amber-500/25',
  pillActive: 'bg-violet-600 text-white border-violet-400 shadow-xs',
  pillIdle: 'bg-[#14141c] text-[#c8cbe0] border-white/15 hover:border-white/30 hover:bg-white/5',
  dropzone: 'border-white/15 bg-white/[0.025] hover:border-violet-400/60 hover:bg-violet-500/10',
  dropzoneActive: 'border-violet-400 bg-violet-500/15',
  dropzoneIcon: 'bg-violet-400/15 text-violet-300',
  privacyBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  privacyBanner: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/30',
  accentChip: 'bg-violet-400/15 text-violet-200 hover:bg-violet-400/25',
  accentRing: 'border-violet-400 ring-2 ring-violet-400/35',
  badgePositive: 'bg-emerald-400/15 text-emerald-300',
  badgeWarning: 'bg-amber-400/15 text-amber-300',
  dangerGhost: 'border-rose-400/40 text-rose-300 hover:bg-rose-500/15',
  errorText: 'text-rose-300',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#15151c]',
  busyPill: 'bg-[#1a1a24]/95 text-violet-200 border-violet-400/35 shadow-sm',
}

export function getWorkspaceThemeTokens(theme: WorkspaceTheme): WorkspaceThemeTokens {
  return theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS
}
