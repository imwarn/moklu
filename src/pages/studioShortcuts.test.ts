/**
 * [INPUT]: depends on vitest, ./studioShortcuts, and Layer/GroupLayer types from @/types
 * [OUTPUT]: Vitest unit tests verifying Studio keyboard shortcut normalization, view gating, mobile drawer Escape, and locked/background layer protection
 * [POS]: automated unit test suite for src/pages/studioShortcuts.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { describe, expect, it } from 'vitest'
import type { GroupLayer, Layer } from '@/types'
import {
  isLayerEditableByShortcut,
  resolveDeletableLayerIds,
  resolveNudgeTarget,
  resolveStudioShortcut,
  type StudioKeyInput,
  type StudioShortcutContext,
} from './studioShortcuts'

function keyEvent(overrides: Partial<StudioKeyInput> & { key: string }): StudioKeyInput {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  }
}

function editorCtx(overrides: Partial<StudioShortcutContext> = {}): StudioShortcutContext {
  return {
    view: 'editor',
    hasOpenMobilePanel: false,
    editingGroupId: null,
    hasSelection: true,
    ...overrides,
  }
}

function makeLayer(overrides: Partial<Layer> & { id: string; type: Layer['type'] }): Layer {
  return {
    name: overrides.id,
    x: 10,
    y: 20,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    ...overrides,
  } as Layer
}

describe('resolveStudioShortcut', () => {
  it('returns null for every shortcut when view is not editor', () => {
    const locCtx = editorCtx({ view: 'localization', hasOpenMobilePanel: true, editingGroupId: 'grp-1' })

    expect(resolveStudioShortcut(keyEvent({ key: 'Delete' }), locCtx)).toBeNull()
    expect(resolveStudioShortcut(keyEvent({ key: 'Backspace' }), locCtx)).toBeNull()
    expect(resolveStudioShortcut(keyEvent({ key: 'ArrowRight' }), locCtx)).toBeNull()
    expect(resolveStudioShortcut(keyEvent({ key: 'Z', metaKey: true, shiftKey: true }), locCtx)).toBeNull()
    expect(resolveStudioShortcut(keyEvent({ key: 'Escape' }), locCtx)).toBeNull()
  })

  it('normalizes shifted and CapsLock uppercase keys for redo, ungroup, and modifier commands', () => {
    const ctx = editorCtx()

    expect(resolveStudioShortcut(keyEvent({ key: 'Z', metaKey: true, shiftKey: true }), ctx)).toEqual({ type: 'redo' })
    expect(resolveStudioShortcut(keyEvent({ key: 'Z', ctrlKey: true, shiftKey: true }), ctx)).toEqual({ type: 'redo' })
    expect(resolveStudioShortcut(keyEvent({ key: 'Y', ctrlKey: true }), ctx)).toEqual({ type: 'redo' })
    expect(resolveStudioShortcut(keyEvent({ key: 'Z', metaKey: true }), ctx)).toEqual({ type: 'undo' })

    expect(resolveStudioShortcut(keyEvent({ key: 'G', metaKey: true, shiftKey: true }), ctx)).toEqual({ type: 'ungroup' })
    expect(resolveStudioShortcut(keyEvent({ key: 'G', ctrlKey: true }), ctx)).toEqual({ type: 'group' })

    expect(resolveStudioShortcut(keyEvent({ key: 'C', metaKey: true }), ctx)).toEqual({ type: 'copy' })
    expect(resolveStudioShortcut(keyEvent({ key: 'C', metaKey: true, altKey: true }), ctx)).toEqual({ type: 'copy-style' })
    expect(resolveStudioShortcut(keyEvent({ key: 'V', metaKey: true }), ctx)).toEqual({ type: 'paste' })
    expect(resolveStudioShortcut(keyEvent({ key: 'V', metaKey: true, altKey: true }), ctx)).toEqual({ type: 'paste-style' })
    expect(resolveStudioShortcut(keyEvent({ key: 'X', ctrlKey: true }), ctx)).toEqual({ type: 'cut' })
    expect(resolveStudioShortcut(keyEvent({ key: 'D', metaKey: true }), ctx)).toEqual({ type: 'duplicate' })
    expect(resolveStudioShortcut(keyEvent({ key: '0', metaKey: true }), ctx)).toEqual({ type: 'zoom-fit' })
    expect(resolveStudioShortcut(keyEvent({ key: '1', ctrlKey: true }), ctx)).toEqual({ type: 'zoom-reset' })
  })

  it('prioritizes closing mobile drawer over exiting group edit on Escape', () => {
    expect(
      resolveStudioShortcut(
        keyEvent({ key: 'Escape' }),
        editorCtx({ hasOpenMobilePanel: true, editingGroupId: 'grp-1' }),
      ),
    ).toEqual({ type: 'close-mobile-panel' })

    expect(
      resolveStudioShortcut(
        keyEvent({ key: 'Escape' }),
        editorCtx({ hasOpenMobilePanel: false, editingGroupId: 'grp-1' }),
      ),
    ).toEqual({ type: 'exit-group-edit' })

    expect(
      resolveStudioShortcut(
        keyEvent({ key: 'Escape' }),
        editorCtx({ hasOpenMobilePanel: false, editingGroupId: null }),
      ),
    ).toBeNull()
  })

  it('computes 1px and 10px nudge vectors and respects selection for delete', () => {
    expect(resolveStudioShortcut(keyEvent({ key: 'ArrowLeft' }), editorCtx())).toEqual({ type: 'nudge', dx: -1, dy: 0 })
    expect(resolveStudioShortcut(keyEvent({ key: 'ArrowDown', shiftKey: true }), editorCtx())).toEqual({ type: 'nudge', dx: 0, dy: 10 })
    expect(resolveStudioShortcut(keyEvent({ key: 'Delete' }), editorCtx({ hasSelection: true }))).toEqual({ type: 'delete' })
    expect(resolveStudioShortcut(keyEvent({ key: 'Backspace' }), editorCtx({ hasSelection: false }))).toBeNull()
  })
})

describe('layer shortcut mutability guards', () => {
  const bg = makeLayer({ id: 'bg', type: 'background', locked: false })
  const lockedText = makeLayer({ id: 'locked-text', type: 'text', locked: true })
  const freeText = makeLayer({ id: 'free-text', type: 'text', locked: false })
  const lockedChild = makeLayer({ id: 'child-locked', type: 'shape', locked: true })
  const freeChild = makeLayer({ id: 'child-free', type: 'shape', locked: false })
  const openGroup = makeLayer({
    id: 'grp-open',
    type: 'group',
    locked: false,
    children: [lockedChild, freeChild],
  } as Partial<GroupLayer> & { id: string; type: 'group' })
  const lockedGroup = makeLayer({
    id: 'grp-locked',
    type: 'group',
    locked: true,
    children: [freeChild],
  } as Partial<GroupLayer> & { id: string; type: 'group' })

  const layers: Layer[] = [bg, lockedText, freeText, openGroup, lockedGroup]

  it('rejects locked and background layers in isLayerEditableByShortcut', () => {
    expect(isLayerEditableByShortcut(bg)).toBe(false)
    expect(isLayerEditableByShortcut(lockedText)).toBe(false)
    expect(isLayerEditableByShortcut(freeText)).toBe(true)
    expect(isLayerEditableByShortcut(null)).toBe(false)
  })

  it('skips locked and background layers for arrow-key nudging', () => {
    expect(resolveNudgeTarget(layers, 'bg', null)).toBeNull()
    expect(resolveNudgeTarget(layers, 'locked-text', null)).toBeNull()
    expect(resolveNudgeTarget(layers, 'free-text', null)).toEqual({ kind: 'top', layer: freeText })
    expect(resolveNudgeTarget(layers, 'child-locked', 'grp-open')).toBeNull()
    expect(resolveNudgeTarget(layers, 'child-free', 'grp-open')).toEqual({
      kind: 'child',
      groupId: 'grp-open',
      layer: freeChild,
    })
    expect(resolveNudgeTarget(layers, 'child-free', 'grp-locked')).toBeNull()
  })

  it('filters out locked and background layers from keyboard delete', () => {
    expect(resolveDeletableLayerIds(layers, ['bg', 'locked-text', 'free-text'], 'free-text', null)).toEqual([
      'free-text',
    ])
    expect(resolveDeletableLayerIds(layers, [], 'bg', null)).toEqual([])
    expect(resolveDeletableLayerIds(layers, [], 'locked-text', null)).toEqual([])
    expect(resolveDeletableLayerIds(layers, ['child-locked', 'child-free'], 'child-free', 'grp-open')).toEqual([
      'child-free',
    ])
    expect(resolveDeletableLayerIds(layers, ['child-free'], 'child-free', 'grp-locked')).toEqual([])
  })
})
