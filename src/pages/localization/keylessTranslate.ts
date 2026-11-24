/**
 * [INPUT]: depends on serializeMarkedText, parseMarkedText, and stripMarkTags from @/ai/markedText; depends on LocaleContentBatchEntry, TextLayer, and TextMark from @/types; depends on effectiveLocalizationMode and getLanguageName from @/utils/locale; depends on cellKey, CellKey, and LocalizableRow from ./types
 * [OUTPUT]: exports KeylessTranslationItem, KeylessPromptBundle, KeylessParseResult, collectKeylessTranslationItems, buildKeylessTranslationPrompt, extractJsonPayload, and parseKeylessTranslationResponse
 * [POS]: pure prompt serialization and JSON response parsing engine for Zero-Key Web AI translation inside src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { parseMarkedText, serializeMarkedText, stripMarkTags } from '@/ai/markedText'
import type { LocaleContentBatchEntry, TextLayer, TextMark } from '@/types'
import { effectiveLocalizationMode, getLanguageName } from '@/utils/locale'
import { cellKey, type CellKey, type LocalizableRow } from './types'

export interface KeylessTranslationItem {
  refId: string
  slideGroupId: string
  slideGroupName: string
  layerId: string
  layerName: string
  sourceText: string
  taggedSource: string
  sourceMarks: TextMark[]
  taggable: boolean
  pendingLocales: string[]
}

export interface KeylessPromptBundle {
  prompt: string
  cellCount: number
  activeLocales: string[]
}

export interface KeylessParseResult {
  ok: boolean
  entries: LocaleContentBatchEntry[]
  formattingLostKeys: CellKey[]
  appliedCount: number
  error?: string
}

/** Collect all auto-localizable text rows that need translation under current overwrite settings. */
export function collectKeylessTranslationItems(
  rows: LocalizableRow[],
  nonDefaultLocales: string[],
  overwriteExisting: boolean,
): KeylessTranslationItem[] {
  const items: KeylessTranslationItem[] = []
  let seq = 1

  for (const row of rows) {
    if (row.layerType !== 'text') continue
    if (effectiveLocalizationMode(row.layer) !== 'auto') continue
    if (!row.defaultText) continue

    const pendingLocales = nonDefaultLocales.filter((locale) => {
      const hasOverride = typeof row.layer.localeContent?.[locale]?.text === 'string'
      return !hasOverride || overwriteExisting
    })
    if (pendingLocales.length === 0) continue

    const textLayer = row.layer as TextLayer
    const serialized = serializeMarkedText(row.defaultText, textLayer.marks)

    items.push({
      refId: `L${seq++}`,
      slideGroupId: row.slideGroupId,
      slideGroupName: row.slideGroupName,
      layerId: row.layerId,
      layerName: row.layerName,
      sourceText: row.defaultText,
      taggedSource: serialized.tagged,
      sourceMarks: serialized.marks,
      taggable: serialized.taggable,
      pendingLocales,
    })
  }

  return items
}

/** Build a self-contained copy/paste prompt + JSON template preserving <mN> rich-text tags. */
export function buildKeylessTranslationPrompt(
  items: KeylessTranslationItem[],
  defaultLocale: string,
  nonDefaultLocales: string[],
): KeylessPromptBundle {
  const templateByLocale: Record<string, Record<string, string>> = {}
  let cellCount = 0

  for (const locale of nonDefaultLocales) {
    const entriesForLocale: Record<string, string> = {}
    for (const item of items) {
      if (!item.pendingLocales.includes(locale)) continue
      entriesForLocale[item.refId] = item.taggedSource
      cellCount += 1
    }
    if (Object.keys(entriesForLocale).length > 0) {
      templateByLocale[locale] = entriesForLocale
    }
  }

  const activeLocales = Object.keys(templateByLocale)
  const sourceLabel = `${getLanguageName(defaultLocale)} (${defaultLocale})`
  const targetList = activeLocales.map((code) => `${getLanguageName(code)} (${code})`).join(', ')
  const hasRichTags = items.some((item) => item.taggable)

  const lines = [
    `Translate the UI/marketing screenshot copy below from ${sourceLabel} into: ${targetList}.`,
    '',
    'Rules:',
    '1. Return ONLY a valid JSON object (raw JSON or inside a ```json code block) using the exact same locale codes and item IDs (L1, L2, ...).',
    '2. Keep translations concise, idiomatic, and visually punchy for app screenshots.',
    ...(hasRichTags
      ? ['3. IMPORTANT: Preserve every inline formatting tag such as <m1>...</m1> and <m2>...</m2> around the corresponding translated words. Do not drop, rename, or break tag pairs.']
      : []),
    '',
    'Input JSON (replace each string value with its translation for that locale):',
    '```json',
    JSON.stringify(templateByLocale, null, 2),
    '```',
  ]

  return {
    prompt: lines.join('\n'),
    cellCount,
    activeLocales,
  }
}

/** Extract JSON object text from raw LLM output, supporting ```json fenced blocks and conversational wrappers. */
export function extractJsonPayload(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed)
  if (fenceMatch && fenceMatch[1].trim()) {
    return fenceMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Parse pasted web-AI JSON back into a single undoable setLocaleContentBatch
 * payload, restoring <mN> TextMarks via parseMarkedText and falling back to
 * stripMarkTags when tags are malformed.
 */
export function parseKeylessTranslationResponse(
  rawInput: string,
  items: KeylessTranslationItem[],
  targetLocales: string[],
): KeylessParseResult {
  const jsonText = extractJsonPayload(rawInput)
  if (!jsonText) {
    return { ok: false, entries: [], formattingLostKeys: [], appliedCount: 0, error: 'Empty input' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    return {
      ok: false,
      entries: [],
      formattingLostKeys: [],
      appliedCount: 0,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }

  if (!isPlainRecord(parsed)) {
    return { ok: false, entries: [], formattingLostKeys: [], appliedCount: 0, error: 'Root must be a JSON object' }
  }

  const targetLocaleSet = new Set(targetLocales)
  const itemByRef = new Map<string, KeylessTranslationItem>()
  const itemByLayerId = new Map<string, KeylessTranslationItem>()
  for (const item of items) {
    itemByRef.set(item.refId, item)
    itemByLayerId.set(item.layerId, item)
  }
  const resolveItem = (id: string) => itemByRef.get(id) ?? itemByLayerId.get(id)

  const seenCells = new Set<CellKey>()
  const entries: LocaleContentBatchEntry[] = []
  const formattingLostKeys: CellKey[] = []

  const recordCell = (item: KeylessTranslationItem, locale: string, rawTranslated: string) => {
    if (!targetLocaleSet.has(locale)) return
    const key = cellKey(item.layerId, locale)
    if (seenCells.has(key)) return
    seenCells.add(key)

    if (item.taggable && item.sourceMarks.length > 0) {
      const restored = parseMarkedText(rawTranslated, item.sourceMarks)
      if (restored) {
        entries.push({
          slideGroupId: item.slideGroupId,
          layerId: item.layerId,
          locale,
          patch: { text: restored.text, marks: restored.marks },
        })
        return
      }
      formattingLostKeys.push(key)
      entries.push({
        slideGroupId: item.slideGroupId,
        layerId: item.layerId,
        locale,
        patch: { text: stripMarkTags(rawTranslated), marks: undefined },
      })
      return
    }

    entries.push({
      slideGroupId: item.slideGroupId,
      layerId: item.layerId,
      locale,
      patch: { text: stripMarkTags(rawTranslated), marks: undefined },
    })
  }

  // Primary shape: { [locale]: { [refId | layerId]: translatedString } }
  for (const [topKey, topVal] of Object.entries(parsed)) {
    if (!isPlainRecord(topVal)) continue

    if (targetLocaleSet.has(topKey)) {
      for (const [itemKey, value] of Object.entries(topVal)) {
        if (typeof value !== 'string') continue
        const item = resolveItem(itemKey)
        if (item) recordCell(item, topKey, value)
      }
      continue
    }

    // Fallback shape: { [refId | layerId]: { [locale]: translatedString } }
    const maybeItem = resolveItem(topKey)
    if (maybeItem) {
      for (const [locKey, value] of Object.entries(topVal)) {
        if (typeof value === 'string' && targetLocaleSet.has(locKey)) {
          recordCell(maybeItem, locKey, value)
        }
      }
    }
  }

  if (entries.length === 0) {
    return {
      ok: false,
      entries: [],
      formattingLostKeys: [],
      appliedCount: 0,
      error: 'No matching locale or item keys found',
    }
  }

  return {
    ok: true,
    entries,
    formattingLostKeys,
    appliedCount: entries.length,
  }
}
