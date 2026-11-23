/**
 * [INPUT]: depends on forwardRef, useRef, DragEvent, and ReactNode from react
 * [OUTPUT]: exports FileUploadButton forward-ref component supporting button and keyboard/drag-and-drop dropzone file-picker triggers
 * [POS]: file-input UI primitive in src/components/ui; encapsulates hidden input reset semantics and ref forwarding for toolbar, panel, and property upload actions
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { forwardRef, useRef, type DragEvent, type ReactNode } from 'react'

interface FileUploadButtonProps {
  onFiles: (files: File[]) => void | Promise<void>
  children: ReactNode
  accept?: string
  multiple?: boolean
  className?: string
  inputClassName?: string
  variant?: 'button' | 'dropzone'
  disabled?: boolean
  ariaLabel?: string
}

export const FileUploadButton = forwardRef<HTMLInputElement, FileUploadButtonProps>(function FileUploadButton({
  onFiles,
  children,
  accept = 'image/*',
  multiple = false,
  className,
  inputClassName = 'hidden',
  variant = 'button',
  disabled,
  ariaLabel,
}, ref) {
  const innerRef = useRef<HTMLInputElement | null>(null)
  const setInputRef = (node: HTMLInputElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
  const openPicker = () => innerRef.current?.click()
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) void onFiles(Array.from(event.dataTransfer.files))
  }

  const trigger = variant === 'dropzone' ? (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      className={className}
      onClick={openPicker}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPicker() }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {children}
    </div>
  ) : (
    <button type="button" disabled={disabled} aria-label={ariaLabel} className={className} onClick={openPicker}>
      {children}
    </button>
  )

  return (
    <>
      {trigger}
      <input
        ref={setInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={inputClassName}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length) void onFiles(files)
          event.target.value = ''
        }}
      />
    </>
  )
})
