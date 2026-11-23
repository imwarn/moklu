/**
 * [INPUT]: depends on useEffect and useState from react
 * [OUTPUT]: exports useDebouncedValue hook and WORKSPACE_DEBOUNCE_MS constant
 * [POS]: shared debounce primitive for src/workspace/tools; prevents full-resolution canvas re-encoding on every slider frame or keystroke
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useState } from 'react'

export const WORKSPACE_DEBOUNCE_MS = 150

/**
 * Returns a debounced copy of `value` that settles after `delayMs` of inactivity.
 * During SSR (no effects), returns `value` synchronously.
 */
export function useDebouncedValue<T>(value: T, delayMs = WORKSPACE_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      globalThis.clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
