/**
 * [INPUT]: depends on react, WorkspaceTheme from ./types, and getWorkspaceThemeTokens from ./themeTokens
 * [OUTPUT]: exports DropZone, PrivacyBadge, PreviewBusyOverlay, SegmentedControl, SliderField, StudioHandoffButton, and ColorSwatchRow (with optional native custom color picker)
 * [POS]: reusable WCAG-compliant accessible UI primitives shared across all 6 Quick Workspace tool panels in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { WorkspaceTheme } from './types'
import { getWorkspaceThemeTokens } from './themeTokens'

const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|svg|gif)$/i

function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_FILE_PATTERN.test(file.name)
}

export interface DropZoneProps {
  theme: WorkspaceTheme
  title: string
  hint: string
  buttonLabel: string
  invalidFileMessage?: string
  multiple?: boolean
  compact?: boolean
  enablePaste?: boolean
  onFiles: (files: File[]) => void
  onInvalidFiles?: (rejected: File[]) => void
  className?: string
}

export function DropZone({
  theme,
  title,
  hint,
  buttonLabel,
  invalidFileMessage = 'Unsupported file format. Please choose an image file.',
  multiple = false,
  compact = false,
  enablePaste = true,
  onFiles,
  onInvalidFiles,
  className = '',
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null)
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
      const rejected: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind !== 'file') continue
        const file = item.getAsFile()
        if (!file) continue
        if (isSupportedImageFile(file)) {
          pasted.push(file)
        } else {
          rejected.push(file)
        }
      }
      if (pasted.length > 0) {
        event.preventDefault()
        setInvalidNotice(rejected.length > 0 ? invalidFileMessage : null)
        if (rejected.length > 0) onInvalidFiles?.(rejected)
        onFiles(multiple ? pasted : [pasted[0]])
      } else if (rejected.length > 0) {
        event.preventDefault()
        setInvalidNotice(invalidFileMessage)
        onInvalidFiles?.(rejected)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [enablePaste, invalidFileMessage, multiple, onFiles, onInvalidFiles])

  const emitFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const all = Array.from(list)
    const valid: File[] = []
    const rejected: File[] = []
    for (const file of all) {
      if (isSupportedImageFile(file)) {
        valid.push(file)
      } else {
        rejected.push(file)
      }
    }
    if (rejected.length > 0) {
      setInvalidNotice(invalidFileMessage)
      onInvalidFiles?.(rejected)
    } else {
      setInvalidNotice(null)
    }
    if (valid.length > 0) {
      onFiles(multiple ? valid : [valid[0]])
    }
  }

  return (
    <div className={className}>
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
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${tokens.focusRing} ${
          dragging ? tokens.dropzoneActive : tokens.dropzone
        } ${compact ? 'px-4 py-4' : 'px-5 py-7'}`}
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
        <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${tokens.dropzoneIcon}`}>
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
      {invalidNotice && (
        <p role="alert" data-testid="dropzone-invalid-alert" className={`mt-2 text-xs font-medium ${tokens.errorText}`}>
          {invalidNotice}
        </p>
      )}
    </div>
  )
}

export function PrivacyBadge({ theme, label }: { theme: WorkspaceTheme; label: string }) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tokens.privacyBadge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      {label}
    </span>
  )
}

export function PreviewBusyOverlay({
  theme,
  label,
}: {
  theme: WorkspaceTheme
  label: string
}) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="workspace-preview-busy"
      className={`pointer-events-none absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-xs ${tokens.busyPill}`}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span>{label}</span>
    </div>
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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(0, options.findIndex((opt) => opt.value === value))

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (options.length === 0) return
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = options.length - 1
    }
    if (nextIndex === null) return
    event.preventDefault()
    onChange(options[nextIndex].value)
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <div>
      <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt, idx) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              ref={(el) => {
                optionRefs.current[idx] = el
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={idx === activeIndex ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`min-h-8 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${tokens.focusRing} ${
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
        className={`h-1.5 w-full cursor-pointer accent-accent ${tokens.focusRing}`}
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
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-[color,background-color,opacity,transform,scale] disabled:cursor-not-allowed disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonStudio}`}
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

function toColorInputHex(value: string, fallback = '#ffffff'): string {
  const trimmed = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return fallback
}

export function ColorSwatchRow({
  theme,
  label,
  value,
  options,
  allowCustom = false,
  customLabel = 'Custom color',
  onChange,
}: {
  theme: WorkspaceTheme
  label: string
  value: string
  options: ColorSwatchOption[]
  allowCustom?: boolean
  customLabel?: string
  onChange: (next: string) => void
}) {
  const customInputId = useId()
  const tokens = getWorkspaceThemeTokens(theme)
  const normalizedValue = value.trim().toLowerCase()
  const isCustomActive =
    allowCustom &&
    /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalizedValue) &&
    !options.some((opt) => opt.value.trim().toLowerCase() === normalizedValue)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`block text-xs font-semibold ${tokens.textMuted}`}>{label}</span>
        {isCustomActive && (
          <span className={`font-mono text-[11px] uppercase tabular-nums ${tokens.textSubtle}`}>
            {normalizedValue}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((swatch) => {
          const active = swatch.value.trim().toLowerCase() === normalizedValue
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
              className={`h-8 w-8 rounded-full border transition-transform ${tokens.focusRing} ${
                active
                  ? `scale-110 ${tokens.accentRing}`
                  : 'border-border hover:scale-105'
              }`}
            />
          )
        })}
        {allowCustom && (
          <label
            htmlFor={customInputId}
            title={customLabel}
            className={`relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-transform focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1 focus-within:ring-offset-panel ${
              isCustomActive
                ? `scale-110 ${tokens.accentRing}`
                : 'border-border hover:scale-105'
            }`}
            style={{
              background: isCustomActive
                ? value
                : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ef4444)',
            }}
          >
            <input
              id={customInputId}
              type="color"
              aria-label={customLabel}
              data-testid="custom-color-input"
              value={toColorInputHex(value)}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            {!isCustomActive && (
              <span
                aria-hidden="true"
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/95 text-[10px] font-bold leading-none text-zinc-900 shadow-xs"
              >
                +
              </span>
            )}
          </label>
        )}
      </div>
    </div>
  )
}
