/**
 * [INPUT]: depends on WorkspaceTheme from ./types
 * [OUTPUT]: exports WorkspaceThemeTokens and getWorkspaceThemeTokens for consistent light/dark styling
 * [POS]: shared design token map for src/workspace; keeps light mode crisp neutral and dark mode aligned with Moklu Studio
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
  privacyBadge: string
  privacyBanner: string
}

const LIGHT_TOKENS: WorkspaceThemeTokens = {
  shell: 'bg-white text-slate-900 border-slate-200/90 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.14)]',
  card: 'bg-white border-slate-200/90',
  cardMuted: 'bg-slate-50/90 border-slate-200/80',
  stage: 'bg-slate-100/90 border-slate-200/90',
  border: 'border-slate-200',
  text: 'text-slate-900',
  textMuted: 'text-slate-600',
  textSubtle: 'text-slate-500',
  tabBar: 'bg-slate-100/90 border-slate-200/80',
  tabActive: 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/90',
  tabIdle: 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
  input: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  buttonPrimary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm',
  buttonSecondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  buttonStudio: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm',
  buttonPro: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/90',
  pillActive: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
  pillIdle: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
  dropzone: 'border-slate-300 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/40',
  dropzoneActive: 'border-indigo-500 bg-indigo-50/80',
  privacyBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  privacyBanner: 'bg-emerald-50/90 text-emerald-900 border-emerald-200',
}

const DARK_TOKENS: WorkspaceThemeTokens = {
  shell: 'bg-[#15151c] text-[#ececf4] border-white/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.65)]',
  card: 'bg-[#1a1a24] border-white/10',
  cardMuted: 'bg-[#121218] border-white/10',
  stage: 'bg-[#0e0e14] border-white/10',
  border: 'border-white/10',
  text: 'text-[#f1f1f8]',
  textMuted: 'text-[#a8abbf]',
  textSubtle: 'text-[#84879c]',
  tabBar: 'bg-[#101016] border-white/10',
  tabActive: 'bg-[#232333] text-indigo-300 shadow-sm ring-1 ring-indigo-400/30',
  tabIdle: 'text-[#9ea2b8] hover:text-white hover:bg-white/5',
  input: 'bg-[#111118] border-white/15 text-[#f1f1f8] placeholder:text-[#6e7186] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25',
  buttonPrimary: 'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600 shadow-sm',
  buttonSecondary: 'bg-white/5 text-[#ececf4] border border-white/15 hover:bg-white/10 active:bg-white/15',
  buttonStudio: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-sm',
  buttonPro: 'bg-amber-500/15 text-amber-200 border border-amber-400/30 hover:bg-amber-500/25',
  pillActive: 'bg-indigo-500 text-white border-indigo-400 shadow-xs',
  pillIdle: 'bg-[#14141c] text-[#c2c5d8] border-white/10 hover:border-white/25 hover:bg-white/5',
  dropzone: 'border-white/15 bg-white/[0.025] hover:border-indigo-400/60 hover:bg-indigo-500/10',
  dropzoneActive: 'border-indigo-400 bg-indigo-500/15',
  privacyBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  privacyBanner: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/30',
}

export function getWorkspaceThemeTokens(theme: WorkspaceTheme): WorkspaceThemeTokens {
  return theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS
}
