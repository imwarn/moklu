/**
 * [INPUT]: depends on WorkspaceLocale and WorkspaceToolId from ./types; depends on EN, ZH, JA, KO dictionaries from ./locales/*
 * [OUTPUT]: exports WorkspaceStrings interface and getWorkspaceStrings(locale) for EN, ZH, JA, KO
 * [POS]: self-contained 4-language UI dictionary facade for src/workspace; enables standalone compilation without src/seo
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { WorkspaceLocale, WorkspaceQuickTheme, WorkspaceToolId } from './types'
import { EN } from './locales/en'
import { JA } from './locales/ja'
import { KO } from './locales/ko'
import { ZH } from './locales/zh'

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
    copyError: string
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
    demoLoaded: string
    replaceScreenshot: string
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
}

const DICTIONARIES: Record<WorkspaceLocale, WorkspaceStrings> = { en: EN, zh: ZH, ja: JA, ko: KO }

export function getWorkspaceStrings(locale: WorkspaceLocale): WorkspaceStrings {
  return DICTIONARIES[locale] ?? EN
}
