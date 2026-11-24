/**
 * [INPUT]: depends on react, trackFunnelEvent from @/utils/telemetry, copyImageToClipboard and isSupportedImageFile from ./canvasUtils, WorkspaceTheme and WorkspaceToolId from ./types, and getWorkspaceThemeTokens from ./themeTokens
 * [OUTPUT]: exports DropZone (with HEIC/AVIF support, decoding progress, and rejection telemetry), PrivacyBadge, PreviewBusyOverlay, SegmentedControl, SliderField, StudioHandoffButton, CopyImageButton (with Cmd/Ctrl+Shift+C shortcut and 1.5s confirmation), ColorSwatchRow, and DraftStatusBar
 * [POS]: reusable WCAG-compliant accessible UI primitives shared across all 6 Quick Workspace tool panels in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { trackFunnelEvent } from '@/utils/telemetry'
import { copyImageToClipboard, isSupportedImageFile } from './canvasUtils'
import type { WorkspaceTheme, WorkspaceToolId } from './types'
import { getWorkspaceThemeTokens } from './themeTokens'

function trackRejectedFiles(rejected: readonly File[]): void {
  for (const file of rejected) {
    const dot = file.name.lastIndexOf('.')
    const ext = dot > 0 && dot < file.name.length - 1 ? file.name.slice(dot + 1).toLowerCase() : 'none'
    trackFunnelEvent('format_rejected', { ext, mime: file.type || 'unknown' })
  }
}

export interface DropZoneProps {
  theme: WorkspaceTheme
  title: string
  hint: string
  buttonLabel: string
  invalidFileMessage?: string
  decodingLabel?: string | null
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
  decodingLabel = null,
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
        if (rejected.length > 0) {
          trackRejectedFiles(rejected)
          onInvalidFiles?.(rejected)
        }
        onFiles(multiple ? pasted : [pasted[0]])
      } else if (rejected.length > 0) {
        event.preventDefault()
        setInvalidNotice(invalidFileMessage)
        trackRejectedFiles(rejected)
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
      trackRejectedFiles(rejected)
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
          accept="image/*,.heic,.heif,.avif"
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
      {decodingLabel && (
        <div
          role="status"
          aria-live="polite"
          data-testid="dropzone-decoding-status"
          className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${tokens.busyPill}`}
        >
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>{decodingLabel}</span>
        </div>
      )}
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

export interface DraftStatusBarProps {
  theme: WorkspaceTheme
  toolId: WorkspaceToolId
  savedLabel: string
  clearLabel: string
  onClear: () => void
}

export function DraftStatusBar({
  theme,
  toolId,
  savedLabel,
  clearLabel,
  onClear,
}: DraftStatusBarProps) {
  const tokens = getWorkspaceThemeTokens(theme)
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={`draft-status-${toolId}`}
      className={`mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[11px] ${tokens.card}`}
    >
      <span className={`inline-flex items-center gap-1.5 font-medium ${tokens.textSubtle}`}>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
        <span>{savedLabel}</span>
      </span>
      <button
        type="button"
        data-testid={`clear-draft-${toolId}`}
        onClick={onClear}
        className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
      >
        {clearLabel}
      </button>
    </div>
  )
}

export interface CopyImageButtonProps {
  theme: WorkspaceTheme
  tool: WorkspaceToolId
  label: string
  copiedLabel: string
  copyErrorMessage: string
  disabled?: boolean
  getImage: () => Promise<{ blob: Blob; previewDataUrl?: string } | null>
  onError?: (message: string | null) => void
  onBusyChange?: (copying: boolean) => void
  testId?: string
  className?: string
}

export function CopyImageButton({
  theme,
  tool,
  label,
  copiedLabel,
  copyErrorMessage,
  disabled = false,
  getImage,
  onError,
  onBusyChange,
  testId,
  className = '',
}: CopyImageButtonProps) {
  const tokens = getWorkspaceThemeTokens(theme)
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const timerRef = useRef<number | null>(null)
  const getImageRef = useRef(getImage)
  const onErrorRef = useRef(onError)
  const onBusyRef = useRef(onBusyChange)

  useEffect(() => {
    getImageRef.current = getImage
    onErrorRef.current = onError
    onBusyRef.current = onBusyChange
  }, [getImage, onError, onBusyChange])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
    if (disabled || copying) return
    setCopying(true)
    onBusyRef.current?.(true)
    onErrorRef.current?.(null)
    try {
      const target = await getImageRef.current()
      if (!target) return
      await copyImageToClipboard(target.blob, target.previewDataUrl)
      trackFunnelEvent('copy_completed', { tool })
      setCopied(true)
      if (typeof window !== 'undefined') {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
          setCopied(false)
          timerRef.current = null
        }, 1500)
      }
    } catch {
      onErrorRef.current?.(copyErrorMessage)
    } finally {
      setCopying(false)
      onBusyRef.current?.(false)
    }
  }, [copyErrorMessage, copying, disabled, tool])

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== 'c') {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      event.preventDefault()
      void handleCopy()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, handleCopy])

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || copying}
      title={`${label} (Cmd/Ctrl+Shift+C)`}
      onClick={() => void handleCopy()}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tokens.focusRing} ${
        copied ? `${tokens.privacyBadge} border` : tokens.buttonSecondary
      } ${className}`}
    >
      {copied ? (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
          <path d="M4.5 10.5 8.2 14.2 15.8 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="7" y="7" width="9.5" height="9.5" rx="2" />
          <path d="M13 7V5.5A2 2 0 0 0 11 3.5H5.5A2 2 0 0 0 3.5 5.5V11A2 2 0 0 0 5.5 13H7" strokeLinecap="round" />
        </svg>
      )}
      <span className="truncate">{copied ? copiedLabel : label}</span>
    </button>
  )
}
