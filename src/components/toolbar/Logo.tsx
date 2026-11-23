/**
 * [INPUT]: depends on React JSX runtime and CSS custom properties (`--color-accent`, `--color-accent-fg`) from src/index.css
 * [OUTPUT]: exports Logo component rendering the Moklu Studio Nested Mockup Frame vector emblem and wordmark
 * [POS]: brand identity mark in src/components/toolbar; rendered by Toolbar and reused at enlarged scale inside AppLoadingScreen
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
/** Moklu brand — Nested Mockup Frame mark (32×32 geometric grid, zero gradients). */
export function Logo() {
  return (
    <div className="flex shrink-0 select-none items-center gap-2 text-[#F4F4F5]" aria-label="Moklu Studio">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path fill="currentColor" d="M6 8a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4v-4h-4v4H6V12h4V8H6Z" />
        <rect fill="var(--color-accent)" x="12" y="2" width="18" height="18" rx="4" />
        <rect fill="var(--color-accent-fg)" x="18" y="6" width="6" height="2" rx="1" />
      </svg>
      <span className="text-sm font-bold tracking-tight text-[#F4F4F5]">Moklu</span>
      <span className="hidden text-[10px] font-medium tracking-wide text-muted min-[1250px]:inline">STUDIO</span>
    </div>
  )
}
