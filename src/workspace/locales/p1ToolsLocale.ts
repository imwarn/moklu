/**
 * [INPUT]: depends on WorkspaceLocale from ../types
 * [OUTPUT]: exports P1ToolsLocaleStrings, getP1ToolsStrings, and localized formatting helpers for MergeQuickTool, OverlapTunerModal, CompressQuickTool, and BeforeAfterSlider across en, zh, ja, and ko (zero em-dashes)
 * [POS]: dedicated 4-language UI copy module inside src/workspace/locales for Stage 2 merge seam tuning, multipage PDF, target-KB compression, split-slider comparison, and EXIF inspection
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { WorkspaceLocale } from '../types'

export interface P1ToolsLocaleStrings {
  merge: {
    seamAutoFolded: (px: number) => string
    seamCustomFolded: (px: number) => string
    seamBadgePrefix: string
    fineTune: string
    copiedToChat: string
    copyShortcutHint: string
    trustSubtext: string
    heicDecoding: string
    pdfModeLabel: string
    pdfMultipageTitle: string
    pdfMultipageDesc: string
    pdfSingleTitle: string
    pdfSingleDesc: string
    pdfPageSizeLabel: string
    pdfPageSizeA4: string
    pdfPageSizeFit: string
    pdfOrientationLabel: string
    pdfPortrait: string
    pdfLandscape: string
    pdfMarginLabel: string
    pdfMarginNone: string
    pdfMarginNormal: string
    pdfPagesCount: (count: number) => string
    multipageCopyHint: string
  }
  overlapModal: {
    title: string
    seamLabel: (seamNumber: number, firstIndex: number, secondIndex: number) => string
    hint: string
    overlapHeightLabel: string
    autoDetectedLabel: string
    resetToAuto: (px: number) => string
    confirm: string
    cancel: string
    topEdgeBadge: string
    bottomGhostBadge: string
    viewportAriaLabel: string
  }
  compress: {
    modeLabel: string
    modeQuality: string
    modeTargetKb: string
    targetKbLabel: string
    customKbLabel: string
    pngAutoSwitchedNote: string
    autoDownscaleNotice: (width: number, targetKb: number) => string
    preserveUnmetNotice: (targetKb: number) => string
    keepOriginalRetry: string
    allowAutoScale: string
    appliedQualityLabel: string
    targetMetBadge: string
    compareAction: string
    heicDecoding: string
    exifBannerWithGps: (count: number) => string
    exifBannerNoGps: (count: number) => string
    exifInspect: string
    exifHide: string
    exifGpsLabel: string
    exifCameraLabel: string
    exifDateLabel: string
    exifExposureLabel: string
    exifSoftwareLabel: string
    exifOrientationLabel: string
    exifStripGuarantee: string
    exifCleanNotice: string
    exifRouteIntro: string
  }
  slider: {
    original: string
    compressed: string
    saved: string
    larger: string
    dividerAriaLabel: string
    zoomLabel: string
    keyboardHint: string
    copyImage: string
    copied: string
    download: string
  }
}

const EN_P1_STRINGS: P1ToolsLocaleStrings = {
  merge: {
    seamAutoFolded: (px) => `Auto-folded ${px}px overlap`,
    seamCustomFolded: (px) => `Tuned ${px}px overlap`,
    seamBadgePrefix: 'Seam',
    fineTune: 'Fine-tune',
    copiedToChat: 'Copied! Ready to paste in chat',
    copyShortcutHint: 'Cmd/Ctrl+Shift+C',
    trustSubtext: 'Lossless original resolution · Free, no watermark',
    heicDecoding: 'Decoding HEIC locally...',
    pdfModeLabel: 'PDF Layout Mode',
    pdfMultipageTitle: 'Standard Multi-Page PDF',
    pdfMultipageDesc: 'One image per page, ideal for printing and formal submissions',
    pdfSingleTitle: 'Seamless Single-Page Long PDF',
    pdfSingleDesc: 'Stitched continuous page for design scrolls and chat archives',
    pdfPageSizeLabel: 'Page Size',
    pdfPageSizeA4: 'A4',
    pdfPageSizeFit: 'Fit Image Ratio',
    pdfOrientationLabel: 'Orientation',
    pdfPortrait: 'Portrait',
    pdfLandscape: 'Landscape',
    pdfMarginLabel: 'Margins',
    pdfMarginNone: 'No Margin',
    pdfMarginNormal: 'Balanced',
    pdfPagesCount: (count) => `${count} pages`,
    multipageCopyHint: 'Download multi-page PDF to save all pages',
  },
  overlapModal: {
    title: 'Fine-Tune Overlap Seam',
    seamLabel: (n, a, b) => `Seam #${n} · Image ${a} + Image ${b}`,
    hint: 'Drag the 50% ghost overlay vertically to align text or lines. Use ArrowUp / ArrowDown (Shift for 10px).',
    overlapHeightLabel: 'Overlap Trim (px)',
    autoDetectedLabel: 'Auto',
    resetToAuto: (px) => `Reset to Auto (${px}px)`,
    confirm: 'Confirm',
    cancel: 'Cancel',
    topEdgeBadge: 'Top Image Bottom',
    bottomGhostBadge: 'Bottom Ghost (50%)',
    viewportAriaLabel: 'Overlap ghost alignment viewport',
  },
  compress: {
    modeLabel: 'Compression Mode',
    modeQuality: 'Quality Slider',
    modeTargetKb: 'Target File Size',
    targetKbLabel: 'Max File Size (KB)',
    customKbLabel: 'Custom KB (10 to 10240)',
    pngAutoSwitchedNote: 'PNG is lossless. Switched to WebP automatically to meet the file size cap.',
    autoDownscaleNotice: (width, targetKb) =>
      `Source dimensions were too large. Auto-scaled width to ${width}px so the image stays crisp under ${targetKb}KB.`,
    preserveUnmetNotice: (targetKb) =>
      `Original dimensions kept. Even at minimum quality the output exceeds ${targetKb}KB.`,
    keepOriginalRetry: 'Keep Original Size & Retry',
    allowAutoScale: 'Allow Auto-Scale to Fit',
    appliedQualityLabel: 'Quality',
    targetMetBadge: 'Under cap',
    compareAction: 'Compare',
    heicDecoding: 'Decoding HEIC locally...',
    exifBannerWithGps: (count) =>
      `Detected GPS location, camera model, and ${count} EXIF metadata tags -> stripped automatically on export`,
    exifBannerNoGps: (count) =>
      `Detected ${count} EXIF metadata tags -> stripped automatically on export`,
    exifInspect: 'Inspect EXIF',
    exifHide: 'Hide details',
    exifGpsLabel: 'GPS Location',
    exifCameraLabel: 'Device / Camera',
    exifDateLabel: 'Capture Time',
    exifExposureLabel: 'Exposure',
    exifSoftwareLabel: 'Software',
    exifOrientationLabel: 'Orientation',
    exifStripGuarantee: 'Exported images are re-encoded locally via Canvas with zero EXIF or GPS metadata.',
    exifCleanNotice: 'No EXIF or GPS metadata detected in uploaded images.',
    exifRouteIntro: 'Upload photos to inspect embedded GPS and camera EXIF tags. All exports strip EXIF locally.',
  },
  slider: {
    original: 'Original',
    compressed: 'Compressed',
    saved: 'Saved',
    larger: 'Larger',
    dividerAriaLabel: 'Before and after comparison divider',
    zoomLabel: 'Zoom',
    keyboardHint: 'ArrowLeft/ArrowRight to move divider · Wheel to zoom',
    copyImage: 'Copy Image',
    copied: 'Copied!',
    download: 'Download',
  },
}

const ZH_P1_STRINGS: P1ToolsLocaleStrings = {
  merge: {
    seamAutoFolded: (px) => `已自动折叠 ${px}px 重叠区`,
    seamCustomFolded: (px) => `已微调折叠 ${px}px 重叠区`,
    seamBadgePrefix: '接缝',
    fineTune: '微调',
    copiedToChat: '已复制，可直接粘贴至聊天框',
    copyShortcutHint: '⌘/Ctrl+Shift+C',
    trustSubtext: '原图分辨率无损导出 · 免费无水印',
    heicDecoding: '正在本地解析 HEIC 图片...',
    pdfModeLabel: 'PDF 排版模式',
    pdfMultipageTitle: '标准多页文档',
    pdfMultipageDesc: '一图一页，适合打印/提交材料',
    pdfSingleTitle: '无缝单页长图 PDF',
    pdfSingleDesc: '适合设计长稿/聊天记录存档',
    pdfPageSizeLabel: '纸张尺寸',
    pdfPageSizeA4: 'A4',
    pdfPageSizeFit: '适应原图比例',
    pdfOrientationLabel: '方向',
    pdfPortrait: '纵向',
    pdfLandscape: '横向',
    pdfMarginLabel: '页边距',
    pdfMarginNone: '无边距',
    pdfMarginNormal: '适中留白',
    pdfPagesCount: (count) => `共 ${count} 页`,
    multipageCopyHint: '多页文档请直接下载 PDF 保存全部页面',
  },
  overlapModal: {
    title: '微调拼接重叠区',
    seamLabel: (n, a, b) => `接缝 #${n} · 图 ${a} 与 图 ${b}`,
    hint: '上下拖拽 50% 半透明叠影对齐文字与边线，支持 ↑ / ↓ 微调（按住 Shift 为 10px）。',
    overlapHeightLabel: '重叠折叠高度 (px)',
    autoDetectedLabel: '自动检测',
    resetToAuto: (px) => `恢复自动 (${px}px)`,
    confirm: '确认应用',
    cancel: '取消',
    topEdgeBadge: '上图底部',
    bottomGhostBadge: '下图叠影 (50%)',
    viewportAriaLabel: '重叠区半透明对齐画布',
  },
  compress: {
    modeLabel: '压缩模式',
    modeQuality: '按画质滑块压缩',
    modeTargetKb: '限制最大文件体积',
    targetKbLabel: '最大体积上限 (KB)',
    customKbLabel: '自定义 KB (10 - 10240)',
    pngAutoSwitchedNote: 'PNG 为无损格式，已自动切换为 WebP 以满足体积限制。',
    autoDownscaleNotice: (width, targetKb) =>
      `原图尺寸过大，已自动等比缩小宽度至 ${width}px 以确保在 ${targetKb}KB 内依然清晰可读`,
    preserveUnmetNotice: (targetKb) =>
      `已保留原尺寸，当前最低画质仍超出 ${targetKb}KB 目标上限`,
    keepOriginalRetry: '保留原尺寸重试',
    allowAutoScale: '恢复自动缩放以达标',
    appliedQualityLabel: '实测画质',
    targetMetBadge: '已达标',
    compareAction: '前后对比',
    heicDecoding: '正在本地解析 HEIC 图片...',
    exifBannerWithGps: (count) =>
      `检测到拍摄定位 (GPS) 与设备型号等 ${count} 项元数据 -> 导出时将默认抹除`,
    exifBannerNoGps: (count) =>
      `检测到设备型号与拍摄参数等 ${count} 项元数据 -> 导出时将默认抹除`,
    exifInspect: '查看详情',
    exifHide: '收起详情',
    exifGpsLabel: '拍摄定位 (GPS)',
    exifCameraLabel: '设备与型号',
    exifDateLabel: '拍摄时间',
    exifExposureLabel: '曝光参数',
    exifSoftwareLabel: '软件信息',
    exifOrientationLabel: '方向标记',
    exifStripGuarantee: '导出图片均在本地 Canvas 重新编码，彻底清除所有 EXIF 与 GPS 定位信息。',
    exifCleanNotice: '未检测到 EXIF 或 GPS 隐私元数据。',
    exifRouteIntro: '上传照片即可检测隐藏的 GPS 定位与相机参数，导出时自动在本地彻底抹除。',
  },
  slider: {
    original: '原图',
    compressed: '压缩后',
    saved: '节省',
    larger: '增加',
    dividerAriaLabel: '拖动对比压缩前后画质',
    zoomLabel: '缩放',
    keyboardHint: '支持 ←/→ 键微调对比线 · 滚轮缩放',
    copyImage: '复制图片',
    copied: '已复制',
    download: '下载图片',
  },
}

const JA_P1_STRINGS: P1ToolsLocaleStrings = {
  merge: {
    seamAutoFolded: (px) => `${px}px の重複を自動折畳み`,
    seamCustomFolded: (px) => `${px}px の重複を手動調整`,
    seamBadgePrefix: '継ぎ目',
    fineTune: '微調整',
    copiedToChat: 'コピーしました。チャットにそのまま貼付可能',
    copyShortcutHint: 'Cmd/Ctrl+Shift+C',
    trustSubtext: '元の解像度でロスレス出力 · 無料・透かしなし',
    heicDecoding: 'HEIC をローカルで変換中...',
    pdfModeLabel: 'PDF レイアウト形式',
    pdfMultipageTitle: '標準マルチページ PDF',
    pdfMultipageDesc: '1画像1ページ、印刷や書類提出に最適',
    pdfSingleTitle: 'シームレス1ページ長尺 PDF',
    pdfSingleDesc: '長尺デザインやチャット履歴の保存に最適',
    pdfPageSizeLabel: '用紙サイズ',
    pdfPageSizeA4: 'A4',
    pdfPageSizeFit: '元画像に合わせる',
    pdfOrientationLabel: '向き',
    pdfPortrait: '縦向き',
    pdfLandscape: '横向き',
    pdfMarginLabel: '余白',
    pdfMarginNone: '余白なし',
    pdfMarginNormal: '標準余白',
    pdfPagesCount: (count) => `全 ${count} ページ`,
    multipageCopyHint: '複数ページは PDF ダウンロードで保存してください',
  },
  overlapModal: {
    title: '継ぎ目の重複を微調整',
    seamLabel: (n, a, b) => `継ぎ目 #${n} · 画像 ${a} と 画像 ${b}`,
    hint: '50% 半透明オーバーレイを上下ドラッグして文字や線を合わせます（↑ / ↓ で 1px、Shift で 10px）。',
    overlapHeightLabel: '重複カット高さ (px)',
    autoDetectedLabel: '自動検出',
    resetToAuto: (px) => `自動値に戻す (${px}px)`,
    confirm: '適用する',
    cancel: 'キャンセル',
    topEdgeBadge: '上画像の下端',
    bottomGhostBadge: '下画像オーバーレイ (50%)',
    viewportAriaLabel: '重複エリア半透明アライメント領域',
  },
  compress: {
    modeLabel: '圧縮モード',
    modeQuality: '画質スライダー',
    modeTargetKb: '目標ファイルサイズ',
    targetKbLabel: '最大サイズ上限 (KB)',
    customKbLabel: 'カスタム KB (10 - 10240)',
    pngAutoSwitchedNote: 'PNG は可逆形式のため、容量上限に合わせて WebP に自動切替しました。',
    autoDownscaleNotice: (width, targetKb) =>
      `元画像が大きいため、${targetKb}KB 以内で鮮明さを保つよう幅を ${width}px に自動縮小しました。`,
    preserveUnmetNotice: (targetKb) =>
      `元の解像度を維持しているため、最低画質でも ${targetKb}KB 上限を超えています。`,
    keepOriginalRetry: '元の解像度で再試行',
    allowAutoScale: '自動縮小を許可',
    appliedQualityLabel: '適用画質',
    targetMetBadge: '達成',
    compareAction: '前後比較',
    heicDecoding: 'HEIC をローカルで変換中...',
    exifBannerWithGps: (count) =>
      `撮影位置 (GPS) や端末モデルなど ${count} 件のメタデータを検出 -> 書き出し時に自動削除`,
    exifBannerNoGps: (count) =>
      `${count} 件の EXIF メタデータを検出 -> 書き出し時に自動削除`,
    exifInspect: '詳細を見る',
    exifHide: '閉じる',
    exifGpsLabel: '撮影位置 (GPS)',
    exifCameraLabel: '撮影デバイス',
    exifDateLabel: '撮影日時',
    exifExposureLabel: '露出設定',
    exifSoftwareLabel: 'ソフトウェア',
    exifOrientationLabel: '回転情報',
    exifStripGuarantee: '書き出し画像はローカル Canvas で再エンコードされ、EXIF / GPS 情報は完全に消去されます。',
    exifCleanNotice: 'EXIF または GPS メタデータは検出されませんでした。',
    exifRouteIntro: '写真を読み込むと GPS やカメラの EXIF 情報を確認でき、書き出し時に自動で完全削除します。',
  },
  slider: {
    original: '元画像',
    compressed: '圧縮後',
    saved: '削減',
    larger: '増加',
    dividerAriaLabel: '圧縮前後の比較スライダー',
    zoomLabel: 'ズーム',
    keyboardHint: '←/→ キーで比較線を移動 · ホイールで拡大縮小',
    copyImage: '画像をコピー',
    copied: 'コピー済み',
    download: 'ダウンロード',
  },
}

const KO_P1_STRINGS: P1ToolsLocaleStrings = {
  merge: {
    seamAutoFolded: (px) => `${px}px 겹침 자동 접힘`,
    seamCustomFolded: (px) => `${px}px 겹침 수동 조정`,
    seamBadgePrefix: '이음새',
    fineTune: '미세 조정',
    copiedToChat: '복사 완료! 채팅창에 바로 붙여넣기 가능',
    copyShortcutHint: 'Cmd/Ctrl+Shift+C',
    trustSubtext: '원본 해상도 무손실 내보내기 · 무료 · 워터마크 없음',
    heicDecoding: 'HEIC 이미지를 로컬에서 변환 중...',
    pdfModeLabel: 'PDF 레이아웃 모드',
    pdfMultipageTitle: '표준 다중 페이지 PDF',
    pdfMultipageDesc: '이미지 1장당 1페이지, 인쇄 및 서류 제출에 적합',
    pdfSingleTitle: '심리스 단일 페이지 롱 PDF',
    pdfSingleDesc: '긴 디자인 시안 및 채팅 기록 보관에 적합',
    pdfPageSizeLabel: '용지 크기',
    pdfPageSizeA4: 'A4',
    pdfPageSizeFit: '원본 비율 맞춤',
    pdfOrientationLabel: '방향',
    pdfPortrait: '세로',
    pdfLandscape: '가로',
    pdfMarginLabel: '여백',
    pdfMarginNone: '여백 없음',
    pdfMarginNormal: '표준 여백',
    pdfPagesCount: (count) => `총 ${count}페이지`,
    multipageCopyHint: '다중 페이지 문서는 PDF 다운로드로 저장하세요',
  },
  overlapModal: {
    title: '이음새 겹침 미세 조정',
    seamLabel: (n, a, b) => `이음새 #${n} · 이미지 ${a} + 이미지 ${b}`,
    hint: '50% 반투명 오버레이를 위아래로 드래그해 글자와 선을 맞추세요 (↑ / ↓ 1px, Shift 10px).',
    overlapHeightLabel: '겹침 제거 높이 (px)',
    autoDetectedLabel: '자동 감지',
    resetToAuto: (px) => `자동값으로 복원 (${px}px)`,
    confirm: '적용 확인',
    cancel: '취소',
    topEdgeBadge: '상단 이미지 하단',
    bottomGhostBadge: '하단 오버레이 (50%)',
    viewportAriaLabel: '겹침 반투명 정렬 뷰포트',
  },
  compress: {
    modeLabel: '압축 모드',
    modeQuality: '화질 슬라이더',
    modeTargetKb: '목표 파일 용량',
    targetKbLabel: '최대 파일 크기 (KB)',
    customKbLabel: '사용자 지정 KB (10 - 10240)',
    pngAutoSwitchedNote: 'PNG는 무손실 형식이므로 용량 제한을 맞추기 위해 WebP로 자동 전환했습니다.',
    autoDownscaleNotice: (width, targetKb) =>
      `원본 크기가 커서 ${targetKb}KB 이하에서 선명도를 유지하도록 너비를 ${width}px로 자동 축소했습니다.`,
    preserveUnmetNotice: (targetKb) =>
      `원본 크기를 유지한 상태에서는 최저 화질로도 ${targetKb}KB 제한을 초과합니다.`,
    keepOriginalRetry: '원본 크기 유지 재시도',
    allowAutoScale: '자동 축소 허용',
    appliedQualityLabel: '적용 화질',
    targetMetBadge: '목표 달성',
    compareAction: '전후 비교',
    heicDecoding: 'HEIC 이미지를 로컬에서 변환 중...',
    exifBannerWithGps: (count) =>
      `촬영 위치(GPS) 및 기기 모델 등 ${count}개 메타데이터 감지 -> 내보내기 시 기본 삭제`,
    exifBannerNoGps: (count) =>
      `${count}개 EXIF 메타데이터 감지 -> 내보내기 시 기본 삭제`,
    exifInspect: '상세 보기',
    exifHide: '접기',
    exifGpsLabel: '촬영 위치 (GPS)',
    exifCameraLabel: '기기 / 카메라',
    exifDateLabel: '촬영 시각',
    exifExposureLabel: '노출 정보',
    exifSoftwareLabel: '소프트웨어',
    exifOrientationLabel: '방향 정보',
    exifStripGuarantee: '내보낸 이미지는 로컬 Canvas에서 재인코딩되어 모든 EXIF 및 GPS 정보가 완전히 제거됩니다.',
    exifCleanNotice: '업로드된 이미지에서 EXIF 또는 GPS 메타데이터가 감지되지 않았습니다.',
    exifRouteIntro: '사진을 업로드하면 숨겨진 GPS 위치와 카메라 EXIF 정보를 확인하고 내보내기 시 로컬에서 삭제합니다.',
  },
  slider: {
    original: '원본',
    compressed: '압축 후',
    saved: '절감',
    larger: '증가',
    dividerAriaLabel: '압축 전후 비교 슬라이더',
    zoomLabel: '확대',
    keyboardHint: '←/→ 키로 비교선 이동 · 마우스 휠로 확대/축소',
    copyImage: '이미지 복사',
    copied: '복사됨',
    download: '다운로드',
  },
}

const P1_LOCALE_MAP: Record<WorkspaceLocale, P1ToolsLocaleStrings> = {
  en: EN_P1_STRINGS,
  zh: ZH_P1_STRINGS,
  ja: JA_P1_STRINGS,
  ko: KO_P1_STRINGS,
}

export function getP1ToolsStrings(locale: WorkspaceLocale): P1ToolsLocaleStrings {
  return P1_LOCALE_MAP[locale] ?? EN_P1_STRINGS
}
