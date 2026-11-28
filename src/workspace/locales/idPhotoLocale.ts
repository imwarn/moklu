/**
 * [INPUT]: depends on WorkspaceLocale from ../types
 * [OUTPUT]: exports IdPhotoLocaleStrings and ID_PHOTO_LOCALE_{EN,ZH,JA,KO} dictionaries for IdPhotoQuickTool and IdPhotoPreviewStage across en, zh, ja, and ko (zero em-dashes)
 * [POS]: dedicated 4-language UI copy module inside src/workspace/locales imported by en.ts, zh.ts, ja.ts, and ko.ts to keep every locale file modular and under 450 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { WorkspaceLocale } from '../types'

export interface IdPhotoLocaleStrings {
  tryDemoPortrait: string
  replacePortrait: string
  dropTitle: string
  dropHint: string
  tabSingle: string
  tabTrio: string
  tabSheet: string
  presetLabel: string
  customPreset: string
  customUnitLabel: string
  unitMm: string
  unitPx: string
  customWidthMm: string
  customHeightMm: string
  customWidthPx: string
  customHeightPx: string
  specCardTitle: string
  specComplianceHead: string
  specComplianceRule: string
  specAuthenticNote: string
  backgroundLabel: string
  bgPureWhite: string
  bgCivilBlue: string
  bgDeepBlue: string
  bgOfficialRed: string
  bgNeutralGray: string
  bgResumeGradient: string
  engineLabel: string
  engineAi: string
  enginePure: string
  stageDownloading: string
  stageInferring: string
  stageRefining: string
  edgeRefineTitle: string
  defringeLabel: string
  featherLabel: string
  zoomLabel: string
  autoCenterBtn: string
  showGuidesLabel: string
  dragPanHint: string
  guideHeadTop: string
  guideEyeLine: string
  guideChin: string
  formatLabel: string
  formatJpgExam: string
  formatPngLossless: string
  targetKbLabel: string
  targetKbUnlimited: string
  targetKbMet: string
  targetKbUnmet: string
  trioHeading: string
  trioSubtitle: string
  trioDownloadZip: string
  trioSelectedBadge: string
  trioCardWhite: string
  trioCardBlue: string
  trioCardRed: string
  trioCardGray: string
  sheetPaperLabel: string
  paper4r: string
  paperA4: string
  cropMarksLabel: string
  sheetPhotosCount: string
  downloadSheetPng: string
  downloadSheetPdf: string
  downloadPhoto: string
  downloadTrioShort: string
  previewAlt: string
  sheetPreviewAlt: string
  mattingError: string
  renderError: string
  sheetError: string
  presets: Record<string, { name: string; sub: string; tip: string }>
}

export const ID_PHOTO_LOCALE_EN: IdPhotoLocaleStrings = {
  tryDemoPortrait: 'Try Demo Portrait',
  replacePortrait: 'Replace Photo',
  dropTitle: 'Drop a front-facing portrait, click to upload, or paste (Cmd/Ctrl+V)',
  dropHint: '100% browser-local AI portrait cutout · Zero uploads · PNG, JPEG, WebP, HEIC',
  tabSingle: '1. Single Photo',
  tabTrio: '2. Multi-Color Compare',
  tabSheet: '3. 6-Inch / A4 Print Sheet',
  presetLabel: 'ID & Passport Size Standard',
  customPreset: 'Custom Size',
  customUnitLabel: 'Dimension Unit',
  unitMm: 'mm (300 DPI)',
  unitPx: 'Pixels (px)',
  customWidthMm: 'Width (mm)',
  customHeightMm: 'Height (mm)',
  customWidthPx: 'Width (px)',
  customHeightPx: 'Height (px)',
  specCardTitle: 'Official Spec & Audit Guide',
  specComplianceHead: 'Head height ratio',
  specComplianceRule: 'Keep ears & eyebrows visible, neutral expression, avoid matching shirt and backdrop color.',
  specAuthenticNote: 'Authentic features preserved: zero AI face warping or synthetic suit overlays.',
  backgroundLabel: 'Background Color',
  bgPureWhite: 'Pure White',
  bgCivilBlue: 'Civil Blue',
  bgDeepBlue: 'Deep Blue',
  bgOfficialRed: 'Official Red',
  bgNeutralGray: 'Neutral Gray',
  bgResumeGradient: 'Resume Blue-Gray',
  engineLabel: 'Matting Engine',
  engineAi: 'AI Portrait Matting (MODNet)',
  enginePure: 'Instant Backdrop Swap (0MB)',
  stageDownloading: 'Loading local AI model (cached for future use)',
  stageInferring: 'Detecting portrait silhouette locally...',
  stageRefining: 'Refining hair strands & removing halo...',
  edgeRefineTitle: 'Framing & Anti-Halo Edge Refinement',
  defringeLabel: 'Defringe / Remove Halo',
  featherLabel: 'Hair Edge Softness',
  zoomLabel: 'Portrait Zoom',
  autoCenterBtn: 'Auto Center Portrait',
  showGuidesLabel: 'Compliance Guide Overlay',
  dragPanHint: 'Drag portrait to reposition inside frame',
  guideHeadTop: 'Top margin 8-12%',
  guideEyeLine: 'Eye level',
  guideChin: 'Chin line',
  formatLabel: 'File Format',
  formatJpgExam: 'JPG (Exam Standard)',
  formatPngLossless: 'PNG (Lossless)',
  targetKbLabel: 'Portal File Size Cap',
  targetKbUnlimited: 'Unlimited',
  targetKbMet: 'Cap met',
  targetKbUnmet: 'Min quality reached',
  trioHeading: 'Instant 4-Color Studio Compare',
  trioSubtitle: 'Click any background card to select it, or download the White / Blue / Red bundle in one click.',
  trioDownloadZip: 'Download White / Blue / Red Trio ZIP',
  trioSelectedBadge: 'Selected',
  trioCardWhite: 'Pure White (#FFFFFF)',
  trioCardBlue: 'Civil Blue (#438EDB)',
  trioCardRed: 'Official Red (#D92B2B)',
  trioCardGray: 'Neutral Gray (#E5E7EB)',
  sheetPaperLabel: 'Photo Paper Size',
  paper4r: '6-Inch Photo Paper (4R · 102x152mm)',
  paperA4: 'A4 Sheet (210x297mm)',
  cropMarksLabel: 'Exterior corner crop marks',
  sheetPhotosCount: 'photos · 300 DPI',
  downloadSheetPng: 'Download Print PNG',
  downloadSheetPdf: 'Download Print PDF',
  downloadPhoto: 'Download ID Photo',
  downloadTrioShort: 'Trio ZIP',
  previewAlt: 'Rendered ID photo preview',
  sheetPreviewAlt: 'Printable ID photo sheet preview',
  mattingError: 'Portrait matting failed. Switch to Instant Backdrop Swap or try another photo.',
  renderError: 'Failed to render ID photo. Please try again.',
  sheetError: 'Failed to compose print sheet. Please try again.',
  presets: {
    'us-passport': { name: 'US Passport / Visa 2x2"', sub: '51x51mm · 600x600px', tip: 'Pure white background, head 50%-69% of height, JPG <= 240KB.' },
    'schengen-visa': { name: 'Schengen Visa 35x45mm', sub: '35x45mm · 413x531px', tip: 'Plain light white/gray backdrop, head 70%-80% of frame.' },
    'uk-passport': { name: 'UK / Commonwealth 35x45mm', sub: '35x45mm · 413x531px', tip: 'Plain light gray or cream backdrop, no shadows behind head.' },
    'cn-1inch': { name: '1-Inch Standard', sub: '25x35mm · 295x413px', tip: 'Common for resume, diplomas, and certificates (blue/white/red).' },
    'cn-2inch': { name: '2-Inch Standard', sub: '35x49mm · 413x579px', tip: 'Standard 2-inch format for official registrations and badges.' },
    'cn-small-1inch': { name: 'Small 1-Inch (License)', sub: '22x32mm · 260x378px', tip: 'Used for driver license and social security cards (white).' },
    'cn-exam': { name: 'Civil / Exam Portal', sub: '25x35mm · <= 30KB', tip: 'Strict 295x413px JPG under 30KB for exam registrations.' },
    'cn-passport': { name: 'China Passport / Visa', sub: '33x48mm · 390x567px', tip: 'Pure white backdrop, dark clothing recommended, both ears visible.' },
    'jp-rirekisho': { name: 'Japan Resume (30x40mm)', sub: '30x40mm · 354x472px', tip: 'Standard Japanese rirekisho photo, white or pale blue backdrop.' },
    'jp-mynumber': { name: 'Japan MyNumber / Passport', sub: '35x45mm · 413x531px', tip: '35x45mm standard for Japanese passport and MyNumber card.' },
    'kr-passport': { name: 'Korea Passport (35x45mm)', sub: '35x45mm · 413x531px', tip: 'Pure white backdrop, head height 32-36mm, eyebrows visible.' },
    'kr-resume': { name: 'Korea ID / Resume (30x40mm)', sub: '30x40mm · 354x472px', tip: 'Half-card 3x4cm standard for Korean resumes and IDs.' },
    'resume-headshot': { name: 'Resume Headshot', sub: '35x49mm · 500x700px', tip: 'Clean gray or subtle studio blue-gray gradient for LinkedIn & CV.' },
  },
}

export const ID_PHOTO_LOCALE_ZH: IdPhotoLocaleStrings = {
  tryDemoPortrait: '一键体验示例人像',
  replacePortrait: '更换照片',
  dropTitle: '拖拽正面人像照片到这里、点击上传，或直接粘贴 (Cmd/Ctrl+V)',
  dropHint: '100% 浏览器本地 AI 抠图 · 零上传 · 支持 PNG / JPEG / WebP / HEIC',
  tabSingle: '1. 单张精调',
  tabTrio: '2. 多底色对比',
  tabSheet: '3. 六寸 / A4 冲印排版',
  presetLabel: '证件照用途与尺寸规格',
  customPreset: '自定义尺寸',
  customUnitLabel: '尺寸单位',
  unitMm: '毫米 (300 DPI)',
  unitPx: '像素 (px)',
  customWidthMm: '宽度 (mm)',
  customHeightMm: '高度 (mm)',
  customWidthPx: '宽度 (px)',
  customHeightPx: '高度 (px)',
  specCardTitle: '官方规格与审核要点',
  specComplianceHead: '头部占比建议',
  specComplianceRule: '建议露双耳与眉毛、表情自然；白底避免穿浅白衣服，深色衣领对比更清晰。',
  specAuthenticNote: '严格保留真实五官与自然衣着，不做 AI 换脸/虚假换装，确保政务与考试审核通过。',
  backgroundLabel: '标准底色',
  bgPureWhite: '纯白底',
  bgCivilBlue: '证件蓝',
  bgDeepBlue: '深海蓝',
  bgOfficialRed: '标准红',
  bgNeutralGray: '高级灰',
  bgResumeGradient: '简历浅蓝渐变',
  engineLabel: '抠图引擎',
  engineAi: 'AI 发丝精抠 (MODNet)',
  enginePure: '纯色底极速换色 (0MB)',
  stageDownloading: '正在加载本地 AI 模型（首次加载后自动缓存）',
  stageInferring: '正在本地识别人像轮廓...',
  stageRefining: '正在执行发丝边缘精修与去白边...',
  edgeRefineTitle: '构图与边缘防毛边精修',
  defringeLabel: '边缘去白边 / 去毛边',
  featherLabel: '发丝边缘柔化',
  zoomLabel: '画面缩放',
  autoCenterBtn: '一键智能居中',
  showGuidesLabel: '合规辅助线',
  dragPanHint: '在人像画面上按住拖拽即可微调构图位置',
  guideHeadTop: '头顶留白 8-12%',
  guideEyeLine: '双眼水平线',
  guideChin: '下巴参考线',
  formatLabel: '导出格式',
  formatJpgExam: 'JPG (报名标准)',
  formatPngLossless: 'PNG (无损高清)',
  targetKbLabel: '报名系统体积上限',
  targetKbUnlimited: '不限制',
  targetKbMet: '已达标',
  targetKbUnmet: '已达最低画质',
  trioHeading: '四色底色实时对比',
  trioSubtitle: '点击任意底色卡片即可切换当前底色，或一键打包下载白/蓝/红三色套装。',
  trioDownloadZip: '一键打包下载 白/蓝/红 三色套装 ZIP',
  trioSelectedBadge: '当前选中',
  trioCardWhite: '纯白底 (#FFFFFF)',
  trioCardBlue: '证件蓝 (#438EDB)',
  trioCardRed: '标准红 (#D92B2B)',
  trioCardGray: '高级灰 (#E5E7EB)',
  sheetPaperLabel: '冲印相纸规格',
  paper4r: '六寸相纸 (4R · 102x152mm)',
  paperA4: 'A4 打印纸 (210x297mm)',
  cropMarksLabel: '添加外侧裁切参考线（不污染照片内侧）',
  sheetPhotosCount: '张连版 · 300 DPI',
  downloadSheetPng: '下载冲印排版 PNG',
  downloadSheetPdf: '下载打印 PDF',
  downloadPhoto: '下载证件照',
  downloadTrioShort: '三色 ZIP',
  previewAlt: '证件照实时预览',
  sheetPreviewAlt: '证件照冲印排版预览',
  mattingError: 'AI 人像抠图失败，可切换为“纯色底极速换色”或更换清晰正面照片重试。',
  renderError: '证件照渲染失败，请重试。',
  sheetError: '冲印排版生成失败，请重试。',
  presets: {
    'cn-1inch': { name: '一寸标准照', sub: '25x35mm · 295x413px', tip: '简历、毕业证、资格证通用，支持蓝底/白底/红底。' },
    'cn-2inch': { name: '二寸标准照', sub: '35x49mm · 413x579px', tip: '常用于登记表、执业证及国际证件申请。' },
    'cn-small-1inch': { name: '小一寸（驾照/社保）', sub: '22x32mm · 260x378px', tip: '驾驶证换证、社保卡采集标准，要求纯白底与深色上衣。' },
    'cn-exam': { name: '公考/教资/四六级', sub: '25x35mm · <= 30KB', tip: '严格 295x413px 且 JPG 体积控制在 30KB 以内，直传报名网。' },
    'cn-passport': { name: '中国护照/签证', sub: '33x48mm · 390x567px', tip: '纯白背景无阴影，头部居中，双耳与额头清晰可见。' },
    'us-passport': { name: '美国签证/护照 2x2寸', sub: '51x51mm · 600x600px', tip: '正方形 600x600px 纯白底，JPG 文件不超过 240KB。' },
    'schengen-visa': { name: '申根签证 35x45mm', sub: '35x45mm · 413x531px', tip: '浅白/纯白底，头部占画面高度 70%-80%。' },
    'uk-passport': { name: '英国/英联邦签证', sub: '35x45mm · 413x531px', tip: '浅灰或浅米白底，面部受光均匀无阴影。' },
    'jp-rirekisho': { name: '日本履历书 30x40mm', sub: '30x40mm · 354x472px', tip: '日本求职履历书常用尺寸，推荐白底或浅蓝底。' },
    'jp-mynumber': { name: '日本签证/在留卡', sub: '35x45mm · 413x531px', tip: '日本护照、MyNumber 与在留资格标准尺寸。' },
    'kr-passport': { name: '韩国护照/签证 35x45', sub: '35x45mm · 413x531px', tip: '纯白底，五官清晰，不佩戴反光眼镜。' },
    'kr-resume': { name: '韩国半名片 30x40mm', sub: '30x40mm · 354x472px', tip: '韩国简历与学生证常用 3x4cm 规格。' },
    'resume-headshot': { name: '求职简历形象照', sub: '35x49mm · 500x700px', tip: '高级灰或浅蓝灰渐变背景，适配脉脉/Boss/领英简历。' },
  },
}

export const ID_PHOTO_LOCALE_JA: IdPhotoLocaleStrings = {
  tryDemoPortrait: 'デモ人物写真で試す',
  replacePortrait: '写真を変更',
  dropTitle: '正面の人物写真をドロップ、クリックして選択、または貼り付け (Cmd/Ctrl+V)',
  dropHint: '100% ブラウザ完結のローカル AI 切り抜き · 送信なし · PNG / JPEG / WebP / HEIC',
  tabSingle: '1. 単体調整',
  tabTrio: '2. 背景色比較',
  tabSheet: '3. L判・4R / A4 印刷配置',
  presetLabel: '証明写真の用途・サイズ規格',
  customPreset: 'カスタムサイズ',
  customUnitLabel: 'サイズ単位',
  unitMm: 'mm (300 DPI)',
  unitPx: 'ピクセル (px)',
  customWidthMm: '幅 (mm)',
  customHeightMm: '高さ (mm)',
  customWidthPx: '幅 (px)',
  customHeightPx: '高さ (px)',
  specCardTitle: '公式規格・チェックポイント',
  specComplianceHead: '顔・頭部の目安比率',
  specComplianceRule: '耳と眉が見える正面姿勢・無表情を推奨。白背景では白系の服を避けると輪郭が鮮明になります。',
  specAuthenticNote: '公的申請基準を守るため、AI による顔変形や合成スーツ加工は行いません。',
  backgroundLabel: '背景色',
  bgPureWhite: 'ピュアホワイト',
  bgCivilBlue: '証明ブルー',
  bgDeepBlue: 'ディープブルー',
  bgOfficialRed: 'オフィシャルレッド',
  bgNeutralGray: 'ニュートラルグレー',
  bgResumeGradient: '履歴書グラデーション',
  engineLabel: '切り抜きエンジン',
  engineAi: 'AI 人物切り抜き (MODNet)',
  enginePure: '単色背景クイック置換 (0MB)',
  stageDownloading: 'ローカル AI モデルを読み込み中（次回以降はキャッシュ利用）',
  stageInferring: 'ブラウザ内で人物輪郭を解析中...',
  stageRefining: '髪の毛の境界補正と白フチ除去を実行中...',
  edgeRefineTitle: '構図調整・白フチ除去',
  defringeLabel: '境界の白フチ除去',
  featherLabel: '髪エッジのなじみ',
  zoomLabel: 'ズーム倍率',
  autoCenterBtn: '自動センタリング',
  showGuidesLabel: '規格ガイド線を表示',
  dragPanHint: '写真上をドラッグして顔の位置を微調整できます',
  guideHeadTop: '頭上余白 8-12%',
  guideEyeLine: '目の水平ライン',
  guideChin: 'あご基準線',
  formatLabel: '書き出し形式',
  formatJpgExam: 'JPG (Web 申請標準)',
  formatPngLossless: 'PNG (可逆高画質)',
  targetKbLabel: 'ファイル容量上限',
  targetKbUnlimited: '制限なし',
  targetKbMet: '上限達成',
  targetKbUnmet: '最低画質に到達',
  trioHeading: '4色背景ライブ比較',
  trioSubtitle: '背景カードをクリックして切り替え、または白・青・赤の3色セットを ZIP で一括保存できます。',
  trioDownloadZip: '白・青・赤 3色セットを ZIP 保存',
  trioSelectedBadge: '選択中',
  trioCardWhite: 'ホワイト (#FFFFFF)',
  trioCardBlue: 'ブルー (#438EDB)',
  trioCardRed: 'レッド (#D92B2B)',
  trioCardGray: 'グレー (#E5E7EB)',
  sheetPaperLabel: '印刷用紙サイズ',
  paper4r: '4R / 6インチ写真用紙 (102x152mm)',
  paperA4: 'A4 用紙 (210x297mm)',
  cropMarksLabel: '外側のカットガイド線を追加',
  sheetPhotosCount: '枚配置 · 300 DPI',
  downloadSheetPng: '印刷用 PNG を保存',
  downloadSheetPdf: '印刷用 PDF を保存',
  downloadPhoto: '証明写真を保存',
  downloadTrioShort: '3色 ZIP',
  previewAlt: '証明写真のプレビュー',
  sheetPreviewAlt: '証明写真印刷シートのプレビュー',
  mattingError: 'AI 切り抜きに失敗しました。単色背景クイック置換に切り替えるか別の写真をお試しください。',
  renderError: '証明写真の生成に失敗しました。もう一度お試しください。',
  sheetError: '印刷レイアウトの作成に失敗しました。もう一度お試しください。',
  presets: {
    'jp-rirekisho': { name: '履歴書 (30x40mm)', sub: '30x40mm · 354x472px', tip: '就職・転職の履歴書標準。白または薄い青背景が一般的です。' },
    'jp-mynumber': { name: 'マイナンバー / パスポート', sub: '35x45mm · 413x531px', tip: 'パスポート・マイナンバーカード・在留カード規格 (35x45mm)。' },
    'us-passport': { name: '米国ビザ / パスポート 2x2"', sub: '51x51mm · 600x600px', tip: '純白背景 600x600px、JPG 容量 240KB 以内。' },
    'schengen-visa': { name: 'シェンゲンビザ 35x45mm', sub: '35x45mm · 413x531px', tip: '明るい単色背景、顔比率 70%-80% の欧州ビザ規格。' },
    'uk-passport': { name: '英国パスポート 35x45mm', sub: '35x45mm · 413x531px', tip: 'ライトグレーまたはクリーム色の無地背景を推奨。' },
    'cn-1inch': { name: '中国 1寸 (25x35mm)', sub: '25x35mm · 295x413px', tip: '中国標準の1寸サイズ。青・白・赤背景に対応。' },
    'cn-2inch': { name: '中国 2寸 (35x49mm)', sub: '35x49mm · 413x579px', tip: '公的申請や各種証明書向けの2寸規格。' },
    'cn-small-1inch': { name: '中国 小1寸 (22x32mm)', sub: '22x32mm · 260x378px', tip: '運転免許証などの小1寸規格。' },
    'cn-exam': { name: '試験 Web 申請 (<=30KB)', sub: '25x35mm · <= 30KB', tip: '295x413px 固定で 30KB 以下に収める試験申請仕様。' },
    'cn-passport': { name: '中国パスポート 33x48mm', sub: '33x48mm · 390x567px', tip: '純白背景、両耳と輪郭がはっきり見える正面写真。' },
    'kr-passport': { name: '韓国パスポート 35x45mm', sub: '35x45mm · 413x531px', tip: '純白背景・無表情の韓国旅券標準サイズ。' },
    'kr-resume': { name: '韓国証明写真 30x40mm', sub: '30x40mm · 354x472px', tip: '韓国履歴書・学生証向けの 3x4cm 規格。' },
    'resume-headshot': { name: 'ビジネスプロフィール写真', sub: '35x49mm · 500x700px', tip: 'グレーや淡いブルーグレー背景の採用・SNS 向け写真。' },
  },
}

export const ID_PHOTO_LOCALE_KO: IdPhotoLocaleStrings = {
  tryDemoPortrait: '데모 인물 사진 체험',
  replacePortrait: '사진 교체',
  dropTitle: '정면 인물 사진을 드롭하거나 클릭해 업로드, 또는 붙여넣기 (Cmd/Ctrl+V)',
  dropHint: '100% 브라우저 로컬 AI 누끼 · 서버 업로드 없음 · PNG / JPEG / WebP / HEIC',
  tabSingle: '1. 단면 정밀 보정',
  tabTrio: '2. 배경색 비교',
  tabSheet: '3. 4x6 인치 / A4 인화 배열',
  presetLabel: '증명사진 용도 및 규격',
  customPreset: '사용자 지정 크기',
  customUnitLabel: '크기 단위',
  unitMm: 'mm (300 DPI)',
  unitPx: '픽셀 (px)',
  customWidthMm: '너비 (mm)',
  customHeightMm: '높이 (mm)',
  customWidthPx: '너비 (px)',
  customHeightPx: '높이 (px)',
  specCardTitle: '공식 규격 및 심사 가이드',
  specComplianceHead: '권장 머리 비율',
  specComplianceRule: '양쪽 귀와 눈썹이 보이는 정면 표정을 유지하고, 흰 배경에는 짙은 상의를 권장합니다.',
  specAuthenticNote: '공식 여권·비자·시험 규정 준수를 위해 AI 얼굴 변형이나 합성 정장 기능을 적용하지 않습니다.',
  backgroundLabel: '배경 색상',
  bgPureWhite: '순백색',
  bgCivilBlue: '증명 블루',
  bgDeepBlue: '딥 블루',
  bgOfficialRed: '공식 레드',
  bgNeutralGray: '뉴트럴 그레이',
  bgResumeGradient: '이력서 블루그레이',
  engineLabel: '배경 분리 엔진',
  engineAi: 'AI 인물 분리 (MODNet)',
  enginePure: '단색 배경 즉시 교체 (0MB)',
  stageDownloading: '로컬 AI 모델 불러오는 중 (이후 브라우저 캐시 재사용)',
  stageInferring: '브라우저에서 인물 윤곽을 분석하는 중...',
  stageRefining: '잔머리 경계 보정 및 흰 테두리 제거 중...',
  edgeRefineTitle: '구도 및 잔머리 경계 보정',
  defringeLabel: '경계 흰 테두리 제거',
  featherLabel: '머리카락 경계 부드럽게',
  zoomLabel: '화면 확대/축소',
  autoCenterBtn: '자동 중앙 정렬',
  showGuidesLabel: '규격 가이드라인 표시',
  dragPanHint: '사진 위를 드래그해 얼굴 위치를 미세 조정하세요',
  guideHeadTop: '상단 여백 8-12%',
  guideEyeLine: '눈높이 기준선',
  guideChin: '턱 기준선',
  formatLabel: '출력 형식',
  formatJpgExam: 'JPG (온라인 접수 표준)',
  formatPngLossless: 'PNG (무손실 원본)',
  targetKbLabel: '접수 사이트 용량 제한',
  targetKbUnlimited: '제한 없음',
  targetKbMet: '용량 충족',
  targetKbUnmet: '최소 화질 도달',
  trioHeading: '4가지 배경색 실시간 비교',
  trioSubtitle: '원하는 배경 카드를 클릭해 선택하거나 흰색/파란색/빨간색 3종 세트를 한 번에 ZIP으로 저장하세요.',
  trioDownloadZip: '흰색 / 파란색 / 빨간색 3종 ZIP 다운로드',
  trioSelectedBadge: '선택됨',
  trioCardWhite: '순백색 (#FFFFFF)',
  trioCardBlue: '증명 블루 (#438EDB)',
  trioCardRed: '공식 레드 (#D92B2B)',
  trioCardGray: '뉴트럴 그레이 (#E5E7EB)',
  sheetPaperLabel: '인화 용지 크기',
  paper4r: '4x6 인치 사진 용지 (4R · 102x152mm)',
  paperA4: 'A4 용지 (210x297mm)',
  cropMarksLabel: '사진 바깥쪽 재단선 표시',
  sheetPhotosCount: '매 배열 · 300 DPI',
  downloadSheetPng: '인화용 PNG 다운로드',
  downloadSheetPdf: '인쇄용 PDF 다운로드',
  downloadPhoto: '증명사진 다운로드',
  downloadTrioShort: '3색 ZIP',
  previewAlt: '증명사진 실시간 미리보기',
  sheetPreviewAlt: '증명사진 인화 배열 미리보기',
  mattingError: 'AI 인물 분리에 실패했습니다. 단색 배경 즉시 교체 모드로 전환하거나 다른 사진으로 시도하세요.',
  renderError: '증명사진 생성에 실패했습니다. 다시 시도해 주세요.',
  sheetError: '인화 배열 생성에 실패했습니다. 다시 시도해 주세요.',
  presets: {
    'kr-passport': { name: '한국 여권사진 (3.5x4.5cm)', sub: '35x45mm · 413x531px', tip: '순백색 배경, 정수리부터 턱까지 3.2-3.6cm, 눈썹 노출 필수.' },
    'kr-resume': { name: '반명함 / 이력서 (3x4cm)', sub: '30x40mm · 354x472px', tip: '취업 이력서, 학생증, 자격증 표준 반명함 규격.' },
    'us-passport': { name: '미국 비자 / 여권 2x2"', sub: '51x51mm · 600x600px', tip: '정사각형 600x600px 순백색 배경, JPG 240KB 이하.' },
    'schengen-visa': { name: '솅겐 비자 35x45mm', sub: '35x45mm · 413x531px', tip: '밝은 무지 배경, 얼굴 비율 70%-80% 유지.' },
    'uk-passport': { name: '영국 여권 35x45mm', sub: '35x45mm · 413x531px', tip: '연한 회색 또는 크림색 무지 배경 권장.' },
    'jp-rirekisho': { name: '일본 이력서 30x40mm', sub: '30x40mm · 354x472px', tip: '일본 취업 이력서용 30x40mm 표준 규격.' },
    'jp-mynumber': { name: '일본 여권 / 마이넘버', sub: '35x45mm · 413x531px', tip: '일본 여권 및 재류카드 35x45mm 규격.' },
    'cn-1inch': { name: '중국 1인치 (25x35mm)', sub: '25x35mm · 295x413px', tip: '중국 이력서·자격증 표준 1인치 규격.' },
    'cn-2inch': { name: '중국 2인치 (35x49mm)', sub: '35x49mm · 413x579px', tip: '공식 서류 및 비자용 2인치 규격.' },
    'cn-small-1inch': { name: '중국 소1인치 (22x32mm)', sub: '22x32mm · 260x378px', tip: '운전면허증 등 소형 증명 규격.' },
    'cn-exam': { name: '시험 원서 접수 (<=30KB)', sub: '25x35mm · <= 30KB', tip: '295x413px 유지하면서 30KB 이하 JPG로 자동 맞춤.' },
    'cn-passport': { name: '중국 여권 33x48mm', sub: '33x48mm · 390x567px', tip: '순백색 배경, 양쪽 귀가 보이도록 정면 촬영.' },
    'resume-headshot': { name: '프로필 / 이력서 사진', sub: '35x49mm · 500x700px', tip: '링크드인·이력서용 뉴트럴 그레이 및 소프트 그라데이션.' },
  },
}

const ID_PHOTO_LOCALE_MAP: Record<WorkspaceLocale, IdPhotoLocaleStrings> = {
  en: ID_PHOTO_LOCALE_EN,
  zh: ID_PHOTO_LOCALE_ZH,
  ja: ID_PHOTO_LOCALE_JA,
  ko: ID_PHOTO_LOCALE_KO,
}

export const ID_PHOTO_COMPARE_COLORS: ReadonlyArray<{ id: 'white' | 'blue' | 'red' | 'gray'; hex: string }> = [
  { id: 'white', hex: '#FFFFFF' },
  { id: 'blue', hex: '#438EDB' },
  { id: 'red', hex: '#D92B2B' },
  { id: 'gray', hex: '#E5E7EB' },
]

export function getIdPhotoLocaleStrings(locale: WorkspaceLocale): IdPhotoLocaleStrings {
  return ID_PHOTO_LOCALE_MAP[locale] ?? ID_PHOTO_LOCALE_EN
}
