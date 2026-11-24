/**
 * [INPUT]: depends on @dnd-kit/sortable (useSortable), @dnd-kit/utilities (CSS), WorkspaceThemeTokens from ../themeTokens, and WorkspaceImageInput from ../types
 * [OUTPUT]: exports SortableMergeThumbProps and SortableMergeThumb draggable thumbnail strip card with move/rotate/remove controls
 * [POS]: sortable item subcomponent of MergeQuickTool inside src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WorkspaceThemeTokens } from '../themeTokens'
import type { WorkspaceImageInput } from '../types'

export interface SortableMergeThumbProps {
  item: WorkspaceImageInput
  index: number
  total: number
  tokens: WorkspaceThemeTokens
  labels: {
    moveLeft: string
    moveRight: string
    rotate90: string
    remove: string
  }
  onMove: (index: number, delta: -1 | 1) => void
  onRotate: (id: string) => void
  onRemove: (id: string) => void
}

export function SortableMergeThumb({
  item,
  index,
  total,
  tokens,
  labels,
  onMove,
  onRotate,
  onRemove,
}: SortableMergeThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const rotation = item.rotation ?? 0

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-testid={`merge-thumb-${index}`}
      className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 ${tokens.card} ${
        isDragging ? 'z-20 opacity-85 shadow-md ring-2 ring-accent/40' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative flex cursor-grab touch-none items-center gap-1.5 active:cursor-grabbing"
      >
        <svg
          viewBox="0 0 12 20"
          className={`h-4 w-2.5 shrink-0 opacity-50 ${tokens.textSubtle}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="3" cy="5" r="1.2" />
          <circle cx="9" cy="5" r="1.2" />
          <circle cx="3" cy="10" r="1.2" />
          <circle cx="9" cy="10" r="1.2" />
          <circle cx="3" cy="15" r="1.2" />
          <circle cx="9" cy="15" r="1.2" />
        </svg>
        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-black/5">
          <img
            src={item.dataUrl}
            alt={item.name}
            style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
            className="h-full w-full object-cover transition-transform"
          />
          {rotation !== 0 && (
            <span className="absolute bottom-0.5 right-0.5 rounded bg-zinc-900/80 px-1 text-[9px] font-bold tabular-nums text-white">
              {rotation}°
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className={`max-w-[120px] truncate text-[11px] font-medium ${tokens.text}`}>
          {index + 1}. {item.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`${labels.moveLeft}: ${item.name}`}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`${labels.moveRight}: ${item.name}`}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            →
          </button>
          <button
            type="button"
            title={labels.rotate90}
            aria-label={`${labels.rotate90}: ${item.name}`}
            data-testid={`merge-rotate-${index}`}
            onClick={() => onRotate(item.id)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" strokeLinecap="round" />
              <path d="M12.5 2.8v2.6H9.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`${labels.remove}: ${item.name}`}
            onClick={() => onRemove(item.id)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
          >
            ×
          </button>
        </div>
      </div>
    </li>
  )
}
