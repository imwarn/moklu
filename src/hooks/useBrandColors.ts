/**
 * [INPUT]: depends on useEditorStore from @/store; BrandColor from @/types
 * [OUTPUT]: exports useBrandColors
 * [POS]: stable-reference selector hook of src/hooks/; returns project brand palette without allocating an empty fallback array per render
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEditorStore } from '@/store'
import type { BrandColor } from '@/types'

const EMPTY_BRAND_COLORS: BrandColor[] = []

/** Select the project palette without allocating a fallback array on every render. */
export function useBrandColors(): BrandColor[] {
  return useEditorStore((state) => state.project.settings.brandColors) ?? EMPTY_BRAND_COLORS
}
