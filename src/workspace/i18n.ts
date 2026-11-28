/**
 * [INPUT]: depends on WorkspaceLocale, WorkspaceQuickTheme, and WorkspaceToolId from ./types; dynamically imports ./locales/{en,zh,ja,ko} on demand (with automatic top-level eager preload in SSR, Node, and Vitest)
 * [OUTPUT]: exports WorkspaceStrings interface, hasWorkspaceLocale, preloadWorkspaceLocale, preloadAllWorkspaceLocales, and getWorkspaceStrings(locale) for EN, ZH, JA, KO
 * [POS]: self-contained code-split 4-language UI dictionary registry for src/workspace; enables standalone compilation without src/seo
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { IdPhotoLocaleStrings } from './locales/idPhotoLocale'
import type { WorkspaceLocale, WorkspaceQuickTheme, WorkspaceToolId } from './types'

export interface WorkspaceStrings {
  tabs: Record<WorkspaceToolId, { label: string; short: string; description: string }>
  common: {
    toolsTablistLabel: string
    privacyBadge: string
    privacySubline: string
    dropTitle: string
    dropHint: string
    dropMultipleTitle: string
    pasteShortcut: string
    chooseFiles: string
    tryDemo: string
    openInStudio: string
    proBatchCta: string
    downloadPng: string
    downloadImage: string
    downloadPdf: string
    downloadZip: string
    copyImage: string
    copied: string
    copiedToChat: string
    copyError: string
    exportTrustNote: string
    heicDecoding: string
    multiPastePrompt: string
    multiPasteSwitch: string
    multiPasteDismiss: string
    customColor: string
    downloading: string
    processing: string
    clearAll: string
    remove: string
    moveLeft: string
    moveRight: string
    preview: string
    dimensions: string
    format: string
    quality: string
    background: string
    gap: string
    padding: string
    radius: string
    auto: string
    emptyPreview: string
    previousImage: string
    nextImage: string
    downloadSingle: string
    closePreview: string
    inspectPreview: string
    invalidFileError: string
    decodeError: string
    exportError: string
    zipError: string
    draftSaved: string
    clearDraft: string
  }
  swatches: {
    white: string
    pureWhite: string
    softGray: string
    warmCream: string
    slateDark: string
    charcoal: string
    aurora: string
    softAurora: string
    sunset: string
    peachGlow: string
    transparent: string
    slateGray: string
    securityRed: string
    navyBlue: string
  }
  mockup: {
    deviceLabel: string
    categories: Record<'browser' | 'phone' | 'tablet' | 'watch' | 'screen', string>
    canvasLabel: string
    canvasWidthLabel: string
    canvasHeightLabel: string
    themeLabel: string
    themes: Record<WorkspaceQuickTheme, string>
    fitLabel: string
    fitCover: string
    fitContain: string
    fitFill: string
    customSize: string
    paddingLabel: string
    browserTitle: string
    browserUrl: string
    browserThemeLabel: string
    browserThemeLight: string
    browserThemeDark: string
    demoLoaded: string
    replaceScreenshot: string
  }
  exif: {
    badgeWithGps: string
    badgeGeneric: string
    toggleExpand: string
    toggleCollapse: string
    gpsLabel: string
    cameraLabel: string
    dateLabel: string
    exposureLabel: string
    softwareLabel: string
    strippedHint: string
  }
  redact: {
    toolbarLabel: string
    modeOff: string
    blur: string
    pixelate: string
    spotlight: string
    intensity: string
    spotlightZoom: string
    deleteSelected: string
    clearAll: string
    drawHint: string
    regionsCount: string
  }
  merge: {
    directionLabel: string
    horizontal: string
    vertical: string
    grid: string
    normalizeLabel: string
    matchMin: string
    matchMax: string
    original: string
    alignLabel: string
    alignTop: string
    alignMiddle: string
    alignBottom: string
    alignLeft: string
    alignCenter: string
    alignRight: string
    columns: string
    cellAspect: string
    fitLabel: string
    fitCover: string
    fitContain: string
    borderWidth: string
    borderColor: string
    reverseOrder: string
    rotate90: string
    dragToReorder: string
    scaledNotice: string
    removeOverlapLabel: string
    removeOverlapHint: string
    overlapTrimmedLabel: string
    addMore: string
    loadDemoSet: string
    itemsCount: string
    previewAlt: string
    mergeError: string
  }
  split: {
    modeLabel: string
    carousel: string
    grid: string
    slidesCount: string
    slideAspect: string
    rows: string
    cols: string
    nineGridPreset: string
    twoByTwoPreset: string
    slicesReady: string
    downloadSlice: string
    cutPreviewHint: string
    previewAlt: string
    splitError: string
  }
  compress: {
    maxWidthLabel: string
    keepOriginalWidth: string
    totalSaved: string
    beforeAfter: string
    compressing: string
    addImages: string
    clickToPreview: string
    compressError: string
  }
  resize: {
    modeLabel: string
    resizeMode: string
    cropMode: string
    padMode: string
    resizeByLabel: string
    byPixels: string
    byScale: string
    scaleLabel: string
    aspectLabel: string
    freeAspect: string
    widthLabel: string
    heightLabel: string
    lockAspect: string
    borderLabel: string
    shadowLabel: string
    batchReady: string
    batchStripLabel: string
    transformError: string
  }
  annotate: {
    title: string
    closeLabel: string
    saveLabel: string
    inlineButton: string
    toolbarLabel: string
    toolSelect: string
    toolBrush: string
    toolRect: string
    toolArrow: string
    toolText: string
    colorLabel: string
    strokeWidthLabel: string
    fontSizeLabel: string
    undo: string
    redo: string
    deleteLayer: string
    clearAll: string
    layersCount: string
    defaultText: string
    editTextHint: string
    emptyHint: string
    shortcutsHint: string
    replaceImage: string
    savedToast: string
  }
  idCard: {
    privacyTitle: string
    privacyDesc: string
    frontSlot: string
    backSlot: string
    uploadFront: string
    uploadBack: string
    loadSampleId: string
    watermarkLabel: string
    defaultWatermark: string
    watermarkMode: string
    modeTiled: string
    modeAcross: string
    opacity: string
    angle: string
    fontSize: string
    color: string
    dpiLabel: string
    dpi300: string
    dpi150: string
    grayscaleLabel: string
    downloadA4: string
    cardSizeHint: string
    previewAlt: string
    frontDecodeError: string
    backDecodeError: string
    renderError: string
  }
  idPhoto: IdPhotoLocaleStrings
}

const ALL_WORKSPACE_LOCALES: readonly WorkspaceLocale[] = ['en', 'zh', 'ja', 'ko']

const workspaceLocaleRegistry = new Map<WorkspaceLocale, WorkspaceStrings>()
const pendingWorkspaceLocaleLoads = new Map<WorkspaceLocale, Promise<WorkspaceStrings>>()

function importWorkspaceLocale(locale: WorkspaceLocale): Promise<WorkspaceStrings> {
  switch (locale) {
    case 'zh':
      return import('./locales/zh').then((m) => m.ZH)
    case 'ja':
      return import('./locales/ja').then((m) => m.JA)
    case 'ko':
      return import('./locales/ko').then((m) => m.KO)
    case 'en':
    default:
      return import('./locales/en').then((m) => m.EN)
  }
}

export function hasWorkspaceLocale(locale: WorkspaceLocale): boolean {
  return workspaceLocaleRegistry.has(locale)
}

export function preloadWorkspaceLocale(locale: WorkspaceLocale): Promise<WorkspaceStrings> {
  const cached = workspaceLocaleRegistry.get(locale)
  if (cached) return Promise.resolve(cached)

  const pending = pendingWorkspaceLocaleLoads.get(locale)
  if (pending) return pending

  const promise = importWorkspaceLocale(locale)
    .then((strings) => {
      workspaceLocaleRegistry.set(locale, strings)
      return strings
    })
    .finally(() => {
      pendingWorkspaceLocaleLoads.delete(locale)
    })

  pendingWorkspaceLocaleLoads.set(locale, promise)
  return promise
}

export async function preloadAllWorkspaceLocales(): Promise<void> {
  await Promise.all(ALL_WORKSPACE_LOCALES.map((locale) => preloadWorkspaceLocale(locale)))
}

// Eagerly register all 4 locales in Node, Vite SSR, and Vitest; Rolldown
// dead-code-eliminates this branch (and its top-level await) in client builds.
if (typeof import.meta.env === 'undefined' || import.meta.env.SSR || import.meta.env.MODE === 'test') {
  await preloadAllWorkspaceLocales()
}

export function getWorkspaceStrings(locale: WorkspaceLocale): WorkspaceStrings {
  const strings =
    workspaceLocaleRegistry.get(locale) ??
    workspaceLocaleRegistry.get('en') ??
    workspaceLocaleRegistry.values().next().value
  if (!strings) {
    throw new Error(
      `Workspace locale "${locale}" is not loaded yet. Call preloadWorkspaceLocale("${locale}") before rendering.`,
    )
  }
  return strings
}
