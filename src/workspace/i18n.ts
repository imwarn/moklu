/**
 * [INPUT]: depends on WorkspaceLocale and WorkspaceToolId from ./types
 * [OUTPUT]: exports WorkspaceStrings interface and getWorkspaceStrings(locale) for EN, ZH, JA, KO
 * [POS]: self-contained 4-language UI dictionary for src/workspace; enables standalone compilation without src/seo
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { WorkspaceLocale, WorkspaceToolId } from './types'

export interface WorkspaceStrings {
  tabs: Record<WorkspaceToolId, { label: string; short: string; description: string }>
  common: {
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
    downloadZip: string
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
    emptyPreview: string
    previousImage: string
    nextImage: string
    downloadSingle: string
    closePreview: string
    inspectPreview: string
  }
  mockup: {
    deviceLabel: string
    canvasLabel: string
    themeLabel: string
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
    columns: string
    cellAspect: string
    addMore: string
    loadDemoSet: string
    itemsCount: string
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
  }
  compress: {
    maxWidthLabel: string
    keepOriginalWidth: string
    totalSaved: string
    beforeAfter: string
    compressing: string
    addImages: string
    clickToPreview: string
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
    grayscaleLabel: string
    downloadA4: string
  }
}

const EN: WorkspaceStrings = {
  tabs: {
    mockup: { label: 'Mockup Studio', short: 'Mockup', description: 'Frame screenshots in browser & device mockups' },
    merge: { label: 'Merge & Stitch', short: 'Merge', description: 'Combine photos side-by-side, vertically, or in a grid' },
    split: { label: 'Carousel & Grid Split', short: 'Split', description: 'Slice panoramas and 3×3 social grids' },
    compress: { label: 'Compress & Convert', short: 'Compress', description: 'Shrink PNG, JPEG & WebP offline in batch' },
    resize: { label: 'Resize, Crop & Pad', short: 'Resize', description: 'Resize, crop, or add social borders without cropping' },
    'id-card': { label: 'ID Card Watermark', short: 'ID Card', description: 'Compose A4 front+back sheet with anti-fraud watermark' },
  },
  common: {
    privacyBadge: '100% Local Browser Processing · Never Uploaded',
    privacySubline: 'Runs strictly inside your browser canvas with zero server uploads.',
    dropTitle: 'Drop an image here, click to upload, or paste (Cmd/Ctrl+V)',
    dropHint: 'PNG, JPEG, WebP, SVG · Processed locally',
    dropMultipleTitle: 'Drop multiple images here, click to select, or paste',
    pasteShortcut: 'Paste (Cmd+V)',
    chooseFiles: 'Select Image',
    tryDemo: 'Try Demo Screenshot',
    openInStudio: 'Open in Studio ↗',
    proBatchCta: '4K Batch Export · Pro',
    downloadPng: 'Download PNG',
    downloadImage: 'Download Image',
    downloadZip: 'Download ZIP',
    downloading: 'Preparing…',
    processing: 'Rendering…',
    clearAll: 'Clear',
    remove: 'Remove',
    moveLeft: 'Move earlier',
    moveRight: 'Move later',
    preview: 'Live Preview',
    dimensions: 'Dimensions',
    format: 'Output Format',
    quality: 'Quality',
    background: 'Background',
    gap: 'Gap',
    padding: 'Outer Padding',
    radius: 'Corner Radius',
    emptyPreview: 'Upload an image or try the instant demo',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    downloadSingle: 'Download this image',
    closePreview: 'Close preview',
    inspectPreview: 'Preview image',
  },
  mockup: {
    deviceLabel: 'Frame',
    canvasLabel: 'Canvas Size',
    themeLabel: 'Backdrop',
    fitLabel: 'Screenshot Fit',
    fitCover: 'Cover',
    fitContain: 'Contain',
    fitFill: 'Stretch',
    customSize: 'Custom px',
    paddingLabel: 'Frame Scale',
    browserTitle: 'Window Title',
    browserUrl: 'Address URL',
    demoLoaded: 'Demo screenshot active',
    replaceScreenshot: 'Upload Screenshot',
  },
  merge: {
    directionLabel: 'Layout Mode',
    horizontal: 'Side-by-Side',
    vertical: 'Vertical Stitch',
    grid: 'Grid Collage',
    normalizeLabel: 'Alignment',
    matchMin: 'Match Smallest',
    matchMax: 'Match Largest',
    original: 'Original',
    columns: 'Columns',
    cellAspect: 'Cell Ratio',
    addMore: 'Add Images',
    loadDemoSet: 'Try 3-Image Demo',
    itemsCount: 'images',
  },
  split: {
    modeLabel: 'Split Mode',
    carousel: 'Carousel Panorama',
    grid: 'Grid Matrix',
    slidesCount: 'Slides',
    slideAspect: 'Slide Ratio',
    rows: 'Rows',
    cols: 'Columns',
    nineGridPreset: '3×3 Nine-Grid',
    twoByTwoPreset: '2×2 Quad',
    slicesReady: 'slices ready',
    downloadSlice: 'Save',
    cutPreviewHint: 'Dashed guides show exact seamless cut lines',
  },
  compress: {
    maxWidthLabel: 'Max Width',
    keepOriginalWidth: 'Original',
    totalSaved: 'Total Saved',
    beforeAfter: 'Size Change',
    compressing: 'Compressing…',
    addImages: 'Add Images to Compress',
    clickToPreview: 'Click thumbnail to inspect',
  },
  resize: {
    modeLabel: 'Transform Mode',
    resizeMode: 'Resize',
    cropMode: 'Crop',
    padMode: 'Border & Pad',
    resizeByLabel: 'Resize By',
    byPixels: 'Dimensions (px)',
    byScale: 'Scale (%)',
    scaleLabel: 'Scale Percentage',
    aspectLabel: 'Aspect Ratio',
    freeAspect: 'Free',
    widthLabel: 'Width (px)',
    heightLabel: 'Height (px)',
    lockAspect: 'Lock aspect ratio',
    borderLabel: 'Border Size',
    shadowLabel: 'Drop shadow',
    batchReady: 'processed',
    batchStripLabel: 'Processed images',
  },
  idCard: {
    privacyTitle: '100% Offline Browser Processing · Never Uploaded',
    privacyDesc: 'Sensitive ID photos stay on your device memory only. Zero network requests.',
    frontSlot: 'Front Side',
    backSlot: 'Back Side',
    uploadFront: 'Upload Front',
    uploadBack: 'Upload Back',
    loadSampleId: 'Try Sample Mock ID',
    watermarkLabel: 'Anti-Fraud Watermark',
    defaultWatermark: 'FOR VERIFICATION ONLY',
    watermarkMode: 'Pattern',
    modeTiled: 'Full-Page Tiled',
    modeAcross: 'Across Cards',
    opacity: 'Opacity',
    angle: 'Angle',
    fontSize: 'Text Size',
    color: 'Ink Color',
    dpiLabel: 'Print Resolution',
    grayscaleLabel: 'Photocopy B&W Mode',
    downloadA4: 'Download A4 Print PNG',
  },
}

const ZH: WorkspaceStrings = {
  tabs: {
    mockup: { label: '样机美化', short: '样机', description: '浏览器与设备截图一键套壳美化' },
    merge: { label: '多图拼接', short: '拼图', description: '横向并排、竖向长图、宫格拼图' },
    split: { label: '轮播与九宫格切图', short: '切图', description: '小红书/IG无缝轮播与3×3九宫格' },
    compress: { label: '本地压缩转换', short: '压缩', description: '批量离线压缩 PNG/JPEG/WebP' },
    resize: { label: '缩放裁剪留白', short: '尺寸', description: '无损缩放、比例裁剪与防裁留白边框' },
    'id-card': { label: '身份证件水印', short: '证件水印', description: 'A4 正反面排版 + 防盗用安全水印' },
  },
  common: {
    privacyBadge: '100% 本地浏览器离线处理 · 绝不上传服务器',
    privacySubline: '所有图像处理均在您的设备本地 Canvas 完成，零网络上传。',
    dropTitle: '拖拽图片到这里、点击上传，或直接粘贴 (Cmd/Ctrl+V)',
    dropHint: '支持 PNG / JPEG / WebP / SVG · 纯本地处理',
    dropMultipleTitle: '拖拽多张图片到这里、点击选择，或直接粘贴',
    pasteShortcut: '粘贴图片 (Cmd+V)',
    chooseFiles: '选择图片',
    tryDemo: '一键体验示例图',
    openInStudio: '在 Studio 画布精修 ↗',
    proBatchCta: '4K 批量导出 · Pro',
    downloadPng: '下载高清 PNG',
    downloadImage: '下载图片',
    downloadZip: '打包下载 ZIP',
    downloading: '正在生成…',
    processing: '正在渲染…',
    clearAll: '清空',
    remove: '移除',
    moveLeft: '前移',
    moveRight: '后移',
    preview: '实时预览',
    dimensions: '输出尺寸',
    format: '导出格式',
    quality: '压缩质量',
    background: '背景填充',
    gap: '图片间距',
    padding: '外边距',
    radius: '圆角半径',
    emptyPreview: '上传图片或点击体验示例图即可实时预览',
    previousImage: '上一张图片',
    nextImage: '下一张图片',
    downloadSingle: '下载当前图片',
    closePreview: '关闭预览',
    inspectPreview: '查看大图预览',
  },
  mockup: {
    deviceLabel: '设备与窗口框',
    canvasLabel: '画布比例',
    themeLabel: '背景风格',
    fitLabel: '画面填充',
    fitCover: '铺满裁剪',
    fitContain: '完整显示',
    fitFill: '拉伸适配',
    customSize: '自定义宽高',
    paddingLabel: '缩放比例',
    browserTitle: '窗口标题',
    browserUrl: '地址栏链接',
    demoLoaded: '已加载示例界面',
    replaceScreenshot: '上传截图',
  },
  merge: {
    directionLabel: '拼接方式',
    horizontal: '横向并排',
    vertical: '竖向长图',
    grid: '宫格拼图',
    normalizeLabel: '尺寸对齐',
    matchMin: '按最小对齐',
    matchMax: '按最大对齐',
    original: '保持原尺寸',
    columns: '每行列数',
    cellAspect: '格子比例',
    addMore: '继续添加',
    loadDemoSet: '加载 3 张示例图',
    itemsCount: '张图片',
  },
  split: {
    modeLabel: '切图模式',
    carousel: '无缝轮播全景',
    grid: '宫格矩阵切图',
    slidesCount: '轮播张数',
    slideAspect: '单页比例',
    rows: '行数',
    cols: '列数',
    nineGridPreset: '3×3 九宫格',
    twoByTwoPreset: '2×2 四宫格',
    slicesReady: '张切片已就绪',
    downloadSlice: '下载',
    cutPreviewHint: '虚线表示精确无缝切割位置',
  },
  compress: {
    maxWidthLabel: '最大宽度',
    keepOriginalWidth: '保持原宽',
    totalSaved: '累计节省体积',
    beforeAfter: '体积变化',
    compressing: '正在压缩…',
    addImages: '添加待压缩图片',
    clickToPreview: '点击缩略图放大预览',
  },
  resize: {
    modeLabel: '处理模式',
    resizeMode: '缩放尺寸',
    cropMode: '比例裁剪',
    padMode: '留白加边框',
    resizeByLabel: '缩放依据',
    byPixels: '按像素 (px)',
    byScale: '按比例 (%)',
    scaleLabel: '缩放比例',
    aspectLabel: '目标比例',
    freeAspect: '自由比例',
    widthLabel: '宽度 (px)',
    heightLabel: '高度 (px)',
    lockAspect: '锁定纵横比',
    borderLabel: '边框厚度',
    shadowLabel: '柔和投影',
    batchReady: '张已处理',
    batchStripLabel: '已处理图片列表',
  },
  idCard: {
    privacyTitle: '100% 浏览器本地离线处理 · 绝不上传',
    privacyDesc: '敏感证件照片仅保存在当前浏览器内存中，绝不经过任何服务器。',
    frontSlot: '人像面（正面）',
    backSlot: '国徽面（反面）',
    uploadFront: '上传正面',
    uploadBack: '上传反面',
    loadSampleId: '加载模拟证件示例',
    watermarkLabel: '防盗用安全水印',
    defaultWatermark: '仅供办理业务使用 他用无效',
    watermarkMode: '水印排布',
    modeTiled: '全页满铺',
    modeAcross: '仅覆盖证件',
    opacity: '不透明度',
    angle: '倾斜角度',
    fontSize: '字体大小',
    color: '水印颜色',
    dpiLabel: '打印清晰度',
    grayscaleLabel: '黑白复印件效果',
    downloadA4: '下载 A4 打印 PNG',
  },
}

const JA: WorkspaceStrings = {
  tabs: {
    mockup: { label: 'モックアップ', short: 'モックアップ', description: 'ブラウザ・端末フレームでスクリーンショットを装飾' },
    merge: { label: '画像結合', short: '結合', description: '横並び・縦連結・グリッドコラージュを作成' },
    split: { label: '分割・カルーセル', short: '分割', description: 'シームレスカルーセルや3×3グリッドに分割' },
    compress: { label: '圧縮・形式変換', short: '圧縮', description: 'PNG / JPEG / WebP をローカルで一括軽量化' },
    resize: { label: 'リサイズ・余白', short: 'リサイズ', description: '拡大縮小・トリミング・SNS向け余白フレーム追加' },
    'id-card': { label: '本人確認書類透かし', short: '書類透かし', description: 'A4表裏レイアウト＋不正利用防止透かしをオフライン生成' },
  },
  common: {
    privacyBadge: '100% ブラウザ完結・サーバー送信なし',
    privacySubline: 'すべての画像処理はお使いの端末内で完結し、外部へ送信されません。',
    dropTitle: '画像をドロップ、クリックして選択、または貼り付け (Cmd/Ctrl+V)',
    dropHint: 'PNG / JPEG / WebP / SVG 対応・ローカル処理',
    dropMultipleTitle: '複数画像をドロップ、クリックして選択、または貼り付け',
    pasteShortcut: '貼り付け (Cmd+V)',
    chooseFiles: '画像を選択',
    tryDemo: 'デモ画像で試す',
    openInStudio: 'Studio で詳細編集 ↗',
    proBatchCta: '4K 一括書き出し · Pro',
    downloadPng: 'PNG を保存',
    downloadImage: '画像を保存',
    downloadZip: 'ZIP で一括保存',
    downloading: '作成中…',
    processing: '描画中…',
    clearAll: 'クリア',
    remove: '削除',
    moveLeft: '前へ',
    moveRight: '後ろへ',
    preview: 'ライブプレビュー',
    dimensions: '出力サイズ',
    format: '出力形式',
    quality: '画質',
    background: '背景',
    gap: '間隔',
    padding: '外側余白',
    radius: '角丸',
    emptyPreview: '画像をアップロードするかデモ画像をお試しください',
    previousImage: '前の画像',
    nextImage: '次の画像',
    downloadSingle: 'この画像を保存',
    closePreview: 'プレビューを閉じる',
    inspectPreview: '画像を拡大表示',
  },
  mockup: {
    deviceLabel: 'フレーム',
    canvasLabel: 'キャンバス比率',
    themeLabel: '背景テーマ',
    fitLabel: '画像の収まり',
    fitCover: 'カバー',
    fitContain: '全体表示',
    fitFill: '引き伸ばし',
    customSize: 'カスタム px',
    paddingLabel: 'フレーム倍率',
    browserTitle: 'ウィンドウタイトル',
    browserUrl: 'URL バー',
    demoLoaded: 'デモ画像を表示中',
    replaceScreenshot: 'スクショを選択',
  },
  merge: {
    directionLabel: '結合レイアウト',
    horizontal: '横並び',
    vertical: '縦連結',
    grid: 'グリッド',
    normalizeLabel: 'サイズ揃え',
    matchMin: '最小に合わせる',
    matchMax: '最大に合わせる',
    original: '元のサイズ',
    columns: '列数',
    cellAspect: 'セル比率',
    addMore: '画像を追加',
    loadDemoSet: '3枚デモを読み込む',
    itemsCount: '枚',
  },
  split: {
    modeLabel: '分割モード',
    carousel: 'カルーセル分割',
    grid: 'グリッド分割',
    slidesCount: 'スライド枚数',
    slideAspect: 'スライド比率',
    rows: '行数',
    cols: '列数',
    nineGridPreset: '3×3 グリッド',
    twoByTwoPreset: '2×2 グリッド',
    slicesReady: '枚の分割が完了',
    downloadSlice: '保存',
    cutPreviewHint: '点線がシームレス分割ラインを示します',
  },
  compress: {
    maxWidthLabel: '最大幅',
    keepOriginalWidth: '元の幅',
    totalSaved: '削減サイズ合計',
    beforeAfter: '容量変化',
    compressing: '圧縮中…',
    addImages: '圧縮する画像を追加',
    clickToPreview: 'サムネイルをクリックして拡大',
  },
  resize: {
    modeLabel: '変換モード',
    resizeMode: 'リサイズ',
    cropMode: '切り抜き',
    padMode: '余白・フレーム',
    resizeByLabel: '指定方法',
    byPixels: 'ピクセル指定',
    byScale: '倍率指定 (%)',
    scaleLabel: '拡大・縮小率',
    aspectLabel: '縦横比',
    freeAspect: '自由',
    widthLabel: '幅 (px)',
    heightLabel: '高さ (px)',
    lockAspect: '縦横比を固定',
    borderLabel: '余白サイズ',
    shadowLabel: 'ドロップシャドウ',
    batchReady: '件処理済み',
    batchStripLabel: '処理済み画像一覧',
  },
  idCard: {
    privacyTitle: '100% オフライン処理・アップロード一切なし',
    privacyDesc: '身分証画像はブラウザのメモリ内のみで処理され、外部送信されません。',
    frontSlot: '表面',
    backSlot: '裏面',
    uploadFront: '表面を選択',
    uploadBack: '裏面を選択',
    loadSampleId: 'サンプル書類を試す',
    watermarkLabel: '不正利用防止透かし',
    defaultWatermark: '本人確認専用・他用無効',
    watermarkMode: '透かし配置',
    modeTiled: '全面タイル',
    modeAcross: 'カード上のみ',
    opacity: '不透明度',
    angle: '角度',
    fontSize: '文字サイズ',
    color: '透かし色',
    dpiLabel: '印刷解像度',
    grayscaleLabel: 'モノクロコピー風',
    downloadA4: 'A4 印刷用 PNG を保存',
  },
}

const KO: WorkspaceStrings = {
  tabs: {
    mockup: { label: '목업 스튜디오', short: '목업', description: '브라우저·디바이스 프레임으로 스크린샷 꾸미기' },
    merge: { label: '이미지 합치기', short: '합치기', description: '가로 나란히, 세로 긴 이미지, 그리드 콜라주' },
    split: { label: '캐러셀·그리드 분할', short: '분할', description: '파노라마 슬라이드 및 3×3 피드 분할' },
    compress: { label: '압축·포맷 변환', short: '압축', description: 'PNG / JPEG / WebP 로컬 일괄 용량 축소' },
    resize: { label: '리사이즈·여백', short: '리사이즈', description: '크기 조정, 자르기, 크롭 없는 SNS 여백 추가' },
    'id-card': { label: '신분증 워터마크', short: '신분증', description: 'A4 앞뒷면 배치 + 도용 방지 보안 워터마크' },
  },
  common: {
    privacyBadge: '100% 브라우저 로컬 처리 · 서버 업로드 없음',
    privacySubline: '모든 이미지 처리는 기기 브라우저 내에서만 실행되며 외부로 전송되지 않습니다.',
    dropTitle: '이미지를 드롭하거나 클릭해 선택 또는 붙여넣기 (Cmd/Ctrl+V)',
    dropHint: 'PNG / JPEG / WebP / SVG · 로컬 전용',
    dropMultipleTitle: '여러 이미지를 드롭하거나 클릭해 선택 또는 붙여넣기',
    pasteShortcut: '붙여넣기 (Cmd+V)',
    chooseFiles: '이미지 선택',
    tryDemo: '데모 이미지 체험',
    openInStudio: 'Studio에서 정밀 편집 ↗',
    proBatchCta: '4K 일괄 내보내기 · Pro',
    downloadPng: 'PNG 다운로드',
    downloadImage: '이미지 다운로드',
    downloadZip: 'ZIP 일괄 다운로드',
    downloading: '준비 중…',
    processing: '렌더링 중…',
    clearAll: '초기화',
    remove: '삭제',
    moveLeft: '앞으로',
    moveRight: '뒤로',
    preview: '실시간 미리보기',
    dimensions: '출력 크기',
    format: '출력 형식',
    quality: '품질',
    background: '배경',
    gap: '간격',
    padding: '바깥 여백',
    radius: '모서리 둥글기',
    emptyPreview: '이미지를 올리거나 데모 버튼으로 바로 체험하세요',
    previousImage: '이전 이미지',
    nextImage: '다음 이미지',
    downloadSingle: '이 이미지 다운로드',
    closePreview: '미리보기 닫기',
    inspectPreview: '이미지 크게 보기',
  },
  mockup: {
    deviceLabel: '프레임',
    canvasLabel: '캔버스 비율',
    themeLabel: '배경 테마',
    fitLabel: '화면 맞춤',
    fitCover: '채우기',
    fitContain: '전체 보기',
    fitFill: '늘리기',
    customSize: '사용자 지정 px',
    paddingLabel: '프레임 배율',
    browserTitle: '창 제목',
    browserUrl: '주소 표시줄',
    demoLoaded: '데모 화면 적용됨',
    replaceScreenshot: '스크린샷 업로드',
  },
  merge: {
    directionLabel: '합치기 방식',
    horizontal: '가로 나란히',
    vertical: '세로 이어붙이기',
    grid: '그리드 콜라주',
    normalizeLabel: '크기 정렬',
    matchMin: '작은 쪽 기준',
    matchMax: '큰 쪽 기준',
    original: '원본 유지',
    columns: '열 개수',
    cellAspect: '셀 비율',
    addMore: '이미지 추가',
    loadDemoSet: '3장 데모 불러오기',
    itemsCount: '장',
  },
  split: {
    modeLabel: '분할 모드',
    carousel: '캐러셀 파노라마',
    grid: '그리드 매트릭스',
    slidesCount: '슬라이드 수',
    slideAspect: '슬라이드 비율',
    rows: '행',
    cols: '열',
    nineGridPreset: '3×3 아홉 칸',
    twoByTwoPreset: '2×2 네 칸',
    slicesReady: '장 분할 완료',
    downloadSlice: '저장',
    cutPreviewHint: '점선이 정확한 분할 위치를 표시합니다',
  },
  compress: {
    maxWidthLabel: '최대 너비',
    keepOriginalWidth: '원본 유지',
    totalSaved: '총 절감 용량',
    beforeAfter: '용량 변화',
    compressing: '압축 중…',
    addImages: '압축할 이미지 추가',
    clickToPreview: '썸네일을 눌러 크게 보기',
  },
  resize: {
    modeLabel: '변환 모드',
    resizeMode: '크기 조정',
    cropMode: '비율 자르기',
    padMode: '테두리·여백',
    resizeByLabel: '조정 기준',
    byPixels: '픽셀 (px)',
    byScale: '비율 (%)',
    scaleLabel: '축소·확대 비율',
    aspectLabel: '화면 비율',
    freeAspect: '자유',
    widthLabel: '너비 (px)',
    heightLabel: '높이 (px)',
    lockAspect: '비율 고정',
    borderLabel: '테두리 두께',
    shadowLabel: '그림자 효과',
    batchReady: '장 처리 완료',
    batchStripLabel: '처리된 이미지 목록',
  },
  idCard: {
    privacyTitle: '100% 오프라인 브라우저 처리 · 서버 전송 없음',
    privacyDesc: '민감한 신분증 사진은 브라우저 메모리에서만 처리되며 절대 업로드되지 않습니다.',
    frontSlot: '앞면',
    backSlot: '뒷면',
    uploadFront: '앞면 업로드',
    uploadBack: '뒷면 업로드',
    loadSampleId: '샘플 신분증 체험',
    watermarkLabel: '도용 방지 워터마크',
    defaultWatermark: '본인 확인 전용 · 타 용도 사용 금지',
    watermarkMode: '패턴',
    modeTiled: '전체 타일',
    modeAcross: '신분증 위만',
    opacity: '투명도',
    angle: '각도',
    fontSize: '글자 크기',
    color: '색상',
    dpiLabel: '인쇄 해상도',
    grayscaleLabel: '흑백 사본 모드',
    downloadA4: 'A4 인쇄용 PNG 저장',
  },
}

const DICTIONARIES: Record<WorkspaceLocale, WorkspaceStrings> = { en: EN, zh: ZH, ja: JA, ko: KO }

export function getWorkspaceStrings(locale: WorkspaceLocale): WorkspaceStrings {
  return DICTIONARIES[locale] ?? EN
}
