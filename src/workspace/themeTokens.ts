/**
 * [INPUT]: depends on WorkspaceTheme from ./types and semantic Signal Orange / Neutral Zinc CSS theme tokens defined in src/index.css
 * [OUTPUT]: exports WorkspaceThemeTokens and getWorkspaceThemeTokens for WCAG AA light/dark Neutral Zinc + Signal Orange styling
 * [POS]: shared design token map for src/workspace; binds all Quick Workspace primitives and tool panels to semantic surface/panel/border/muted/accent/status tokens
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
  shell: 'bg-panel text-zinc-900 border-border shadow-[0_18px_48px_-24px_rgba(24,24,27,0.12),0_2px_8px_-2px_rgba(24,24,27,0.04)]',
  card: 'bg-panel border-border',
  cardMuted: 'bg-surface border-border/80',
  stage: 'bg-zinc-100/80 border-border',
  border: 'border-border',
  text: 'text-zinc-900',
  textMuted: 'text-muted',
  textSubtle: 'text-muted',
  tabBar: 'bg-zinc-100/90 border-border',
  tabActive: 'bg-panel text-accent-text shadow-[0_1px_2px_rgba(24,24,27,0.06)] ring-1 ring-border',
  tabIdle: 'text-muted hover:text-zinc-900 hover:bg-panel/70',
  input: 'bg-panel border-zinc-300 text-zinc-900 placeholder:text-zinc-500 focus:border-accent focus:ring-2 focus:ring-accent/20',
  buttonPrimary: 'bg-accent-strong text-accent-fg hover:brightness-95 active:scale-[0.98] shadow-[0_1px_2px_rgba(24,24,27,0.08)]',
  buttonSecondary: 'bg-panel text-zinc-800 border border-border hover:bg-surface active:scale-[0.98]',
  buttonStudio: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 active:scale-[0.98] shadow-[0_1px_2px_rgba(24,24,27,0.1)]',
  buttonPro: 'bg-panel text-warning border border-warning/35 hover:bg-warning/[0.06] active:scale-[0.98]',
  pillActive: 'bg-accent-strong text-accent-fg border-accent-strong shadow-[0_1px_2px_rgba(24,24,27,0.08)]',
  pillIdle: 'bg-panel text-zinc-700 border-border hover:border-zinc-300 hover:bg-surface',
  dropzone: 'border-zinc-300 bg-surface hover:border-accent/60 hover:bg-accent-soft/60',
  dropzoneActive: 'border-accent bg-accent-soft',
  dropzoneIcon: 'bg-accent-soft text-accent-text',
  privacyBadge: 'bg-panel text-success border-success/30',
  privacyBanner: 'bg-success/[0.06] text-success border-success/25',
  accentChip: 'bg-accent-soft text-accent-text hover:bg-accent/15',
  accentRing: 'border-accent ring-2 ring-accent/35',
  badgePositive: 'bg-success/[0.07] text-success',
  badgeWarning: 'bg-warning/[0.07] text-warning',
  dangerGhost: 'border-danger/35 text-danger hover:bg-danger/10',
  errorText: 'text-danger',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel',
  busyPill: 'bg-panel/95 text-accent-text border-accent/30 shadow-[0_2px_8px_-2px_rgba(24,24,27,0.08)]',
}

const DARK_TOKENS: WorkspaceThemeTokens = {
  shell: 'bg-panel text-zinc-100 border-border shadow-[0_20px_56px_-24px_rgba(9,9,11,0.75)]',
  card: 'bg-panel border-border',
  cardMuted: 'bg-surface border-border',
  stage: 'bg-surface border-border',
  border: 'border-border',
  text: 'text-zinc-100',
  textMuted: 'text-muted',
  textSubtle: 'text-muted',
  tabBar: 'bg-surface border-border',
  tabActive: 'bg-zinc-800 text-accent-text shadow-[0_1px_2px_rgba(9,9,11,0.45)] ring-1 ring-accent/35',
  tabIdle: 'text-muted hover:text-zinc-100 hover:bg-white/[0.05]',
  input: 'bg-surface border-border text-zinc-100 placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/25',
  buttonPrimary: 'bg-accent-strong text-accent-fg hover:brightness-95 active:scale-[0.98] shadow-[0_1px_2px_rgba(9,9,11,0.4)]',
  buttonSecondary: 'bg-zinc-900 text-zinc-100 border border-border hover:bg-zinc-800 active:scale-[0.98]',
  buttonStudio: 'bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] shadow-[0_1px_2px_rgba(9,9,11,0.4)]',
  buttonPro: 'bg-warning/12 text-warning border border-warning/35 hover:bg-warning/20 active:scale-[0.98]',
  pillActive: 'bg-accent-strong text-accent-fg border-accent-strong shadow-[0_1px_2px_rgba(9,9,11,0.35)]',
  pillIdle: 'bg-surface text-zinc-200 border-border hover:border-zinc-600 hover:bg-zinc-900',
  dropzone: 'border-border bg-zinc-900/40 hover:border-accent/60 hover:bg-accent-soft/50',
  dropzoneActive: 'border-accent bg-accent-soft',
  dropzoneIcon: 'bg-accent-soft text-accent-text',
  privacyBadge: 'bg-success/12 text-success border-success/30',
  privacyBanner: 'bg-success/10 text-success border-success/30',
  accentChip: 'bg-accent-soft text-accent-text hover:bg-accent/20',
  accentRing: 'border-accent ring-2 ring-accent/40',
  badgePositive: 'bg-success/12 text-success',
  badgeWarning: 'bg-warning/12 text-warning',
  dangerGhost: 'border-danger/40 text-danger hover:bg-danger/15',
  errorText: 'text-danger',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel',
  busyPill: 'bg-panel/95 text-accent-text border-accent/35 shadow-[0_2px_10px_-2px_rgba(9,9,11,0.5)]',
}

export function getWorkspaceThemeTokens(theme: WorkspaceTheme): WorkspaceThemeTokens {
  return theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS
}
