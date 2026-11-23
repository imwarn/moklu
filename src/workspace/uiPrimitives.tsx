/**
 * [INPUT]: depends on react, WorkspaceTheme from ./types, and getWorkspaceThemeTokens from ./themeTokens
 * [OUTPUT]: exports DropZone, PrivacyBadge, SegmentedControl, SliderField, StudioHandoffButton, and ColorSwatchRow
 * [POS]: reusable accessible UI primitives shared across all 6 Quick Workspace tool panels in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { WorkspaceTheme } from './types'
import { getWorkspaceThemeTokens } from './themeTokens'

export interface DropZoneProps {
  theme: WorkspaceTheme
  title: string
  hint: string
  buttonLabel: string
  multiple?: boolean
  compact?: boolean
  enablePaste?: boolean
  onFiles: (files: File[]) => void
  className?: string
}

export function DropZone({
  theme,
  title,
  hint,
  buttonLabel,
  multiple = false,
  compact = false,
  enablePaste = true,
  onFiles,
  className = '',
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const tokens = getWorkspaceThemeTokens(theme)

  useEffect(() => {
    if (!enablePaste || typeof window === 'undefined') return
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      const items = event.clipboardData?.items
      if (!items) return
      const pasted: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) pasted.push(file)
        }
      }
      if (pasted.length > 0) {
        event.preventDefault()
        onFiles(multiple ? pasted : [pasted[0]])
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [enablePaste, multiple, onFiles])

  const emitFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const valid = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name))
    if (valid.length > 0) onFiles(multiple ? valid : [valid[0]])
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        emitFiles(e.dataTransfer.files)
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        dragging ? tokens.dropzoneActive : tokens.dropzone
      } ${compact ? 'px-4 py-4' : 'px-5 py-7'} ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          emitFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/12 text-indigo-500">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className={`text-sm font-medium ${tokens.text}`}>{title}</p>
      <p className={`mt-1 text-xs ${tokens.textSubtle}`}>{hint}</p>
      <span className={`mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${tokens.buttonSecondary}`}>
        {buttonLabel}
      </span>
    </div>
  )
}

export function PrivacyBadge({ theme, label }: { theme: WorkspaceTheme; label: string }) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tokens.privacyBadge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {label}
    </span>
  )
}

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  theme,
  label,
  value,
  options,
  onChange,
}: {
  theme: WorkspaceTheme
  label: string
  value: T
  options: Array<SegmentedOption<T>>
  onChange: (next: T) => void
}) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <div>
      <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active ? tokens.pillActive : tokens.pillIdle
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SliderField({
  theme,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  theme: WorkspaceTheme
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (next: number) => void
}) {
  const id = useId()
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className={`text-xs font-semibold ${tokens.textMuted}`}>
          {label}
        </label>
        <span className={`text-xs font-medium tabular-nums ${tokens.text}`}>
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-indigo-600"
      />
    </div>
  )
}

export function StudioHandoffButton({
  theme,
  label,
  disabled = false,
  onClick,
}: {
  theme: WorkspaceTheme
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${tokens.buttonStudio}`}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 13.5V16h2.5l7.4-7.4-2.5-2.5L4 13.5Z" strokeLinejoin="round" />
        <path d="M12.5 5 15 7.5" strokeLinecap="round" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

export interface ColorSwatchOption {
  label: string
  value: string
}

export function ColorSwatchRow({
  theme,
  label,
  value,
  options,
  onChange,
}: {
  theme: WorkspaceTheme
  label: string
  value: string
  options: ColorSwatchOption[]
  onChange: (next: string) => void
}) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <div>
      <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((swatch) => {
          const active = value === swatch.value
          return (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={active}
              onClick={() => onChange(swatch.value)}
              style={{
                background: swatch.value === 'transparent'
                  ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                  : swatch.value,
              }}
              className={`h-7 w-7 rounded-full border transition-transform ${
                active
                  ? 'scale-110 border-indigo-500 ring-2 ring-indigo-500/40'
                  : 'border-slate-300/80 hover:scale-105'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
