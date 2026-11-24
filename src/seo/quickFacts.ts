/**
 * [INPUT]: depends on LocaleCode, ResolvedRoute, and RouteCategory types from ./types.ts
 * [OUTPUT]: exports QuickFactItem, ToolQuickFacts, and getToolQuickFacts() returning 4-locale structured specifications and capability boundaries for each tool family
 * [POS]: structured factual spec and boundary copy provider within src/seo, rendered by SeoLandingSections.tsx for transparent human scanning and GEO/LLM fact extraction
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleCode, ResolvedRoute, RouteCategory } from './types.ts'

export interface QuickFactItem {
  label: string
  value: string
}

export interface ToolQuickFacts {
  heading: string
  subheading: string
  boundariesHeading: string
  facts: readonly QuickFactItem[]
  boundaries: readonly string[]
}

type SpecBucket = Exclude<RouteCategory, 'studio' | 'info'>

const QUICK_FACTS_BY_LOCALE: Record<
  LocaleCode,
  {
    heading: string
    subheading: string
    boundariesHeading: string
    buckets: Record<SpecBucket, { facts: readonly QuickFactItem[]; boundaries: readonly string[] }>
  }
> = {
  en: {
    heading: 'Quick facts & capability boundaries',
    subheading: 'Exact formats, limits, and processing scope for this browser tool.',
    boundariesHeading: 'Scope & boundaries',
    buckets: {
      hub: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Pricing', value: 'Free core tools, zero forced watermarks' },
          { label: 'Core tools', value: 'Mockup, Merge, Split, Compress, Resize, ID Watermark + Studio' },
          { label: 'Input formats', value: 'PNG, JPEG, WebP, GIF, SVG (drop, select, or Cmd/Ctrl+V paste)' },
          { label: 'Output formats', value: 'PNG, WebP, JPEG, single-page PDF 1.4, and ZIP batches' },
          { label: 'Safety ceiling', value: 'Up to 8192px / 64MP with automatic proportional scaling notice' },
        ],
        boundaries: [
          'All pixel processing runs in browser RAM; no cloud storage or server-side queue exists.',
          'PDF export in Merge packages the combined canvas into a single-page PDF 1.4 sheet rather than merging multi-page PDF documents.',
        ],
      },
      mockup: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Frames', value: 'Chrome, Safari, Minimal browser, iPhone 16 Pro, Pixel 9, 9:16 Store' },
          { label: 'Pricing', value: 'Free standard 2K PNG exports, zero watermarks' },
          { label: 'Customization', value: 'Padding, radius, soft shadows, light/dark frames, backdrops' },
          { label: 'Output', value: 'High-res PNG export or 1-click handoff to Moklu Studio' },
          { label: 'Offline ready', value: 'Works with Wi-Fi disconnected once loaded' },
        ],
        boundaries: [
          'Quick Workspace focuses on single-frame speed; open Moklu Studio for multi-device scenes, headlines, and multi-slide localization.',
          'Browser frame address bars are purely decorative SVG art and never fetch live URLs.',
        ],
      },
      merge: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Layouts', value: 'Horizontal, Vertical, and 2–6 column Grid (cover / contain)' },
          { label: 'Alignment', value: 'match-min (default), match-max, original (start / center / end)' },
          { label: 'Ordering & edits', value: 'Drag-and-drop reorder, Reverse, 90° rotate, 0–24px borders, custom colors' },
          { label: 'Outputs', value: 'PNG, WebP, JPEG, single-page PDF 1.4 (50%–100% quality), Copy to Clipboard' },
          { label: 'Limits', value: 'No fixed image count cap; 8192px / 64MP auto-scaled ceiling' },
        ],
        boundaries: [
          'Vertical stitching joins images cleanly edge-to-edge and does not auto-remove overlapping scroll regions or repeated status bars.',
          'PDF export creates a single-page PDF 1.4 image sheet rather than merging multi-page PDF files; transparent backgrounds turn white in JPEG/PDF.',
          'For freeform overlapping layers, callout arrows, or text labels, use 1-click handoff to Moklu Studio.',
        ],
      },
      split: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Modes', value: 'Seamless carousel slices (4:5, 3:4, 1:1) & custom grid (1–6 rows × 1–6 cols)' },
          { label: 'Pricing', value: 'Free unlimited splits, zero watermarks' },
          { label: 'Output', value: 'Ordered PNG slices bundled into a 1-click local ZIP' },
          { label: 'Preview', value: 'Live interactive cut-line overlay before export' },
          { label: 'Offline ready', value: 'Runs completely offline in desktop and mobile browsers' },
        ],
        boundaries: [
          'Splitting performs exact pixel slicing without AI outpainting or generative fill.',
          'ZIP packaging runs client-side in memory; extremely large outputs depend on available device RAM.',
        ],
      },
      compress: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Formats', value: 'Convert and compress PNG, JPEG, and WebP in batch' },
          { label: 'Controls', value: 'Quality slider, optional max-width downscaling, live before/after byte counters' },
          { label: 'Output', value: 'Individual downloads or 1-click local ZIP archive' },
          { label: 'Pricing', value: 'Free without daily file caps or watermarks' },
          { label: 'Privacy', value: 'Zero server uploads; EXIF metadata stripped on Canvas re-encode' },
        ],
        boundaries: [
          'Uses native browser Canvas encoders (PNG, JPEG, WebP) rather than server-side mozjpeg/pngquant binaries.',
          'Animated GIF or animated WebP files flatten to their first frame when re-encoded on Canvas.',
        ],
      },
      resize: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Modes', value: 'Batch Resize (px / %), Aspect Crop (1:1, 4:5, 3:4, 16:9), Border & Pad' },
          { label: 'Border controls', value: 'Custom backdrop colors, rounded corners, and soft drop shadows' },
          { label: 'Output', value: 'PNG, WebP, or JPEG with 1-click ZIP batch download' },
          { label: 'Pricing', value: 'Free, unlimited local runs, zero watermarks' },
          { label: 'Privacy', value: 'All resizing and padding execute locally in browser RAM' },
        ],
        boundaries: [
          'Upscaling beyond native source resolution uses standard browser interpolation, not AI super-resolution.',
          'Border & Pad preserves 100% of the uncropped frame inside the chosen aspect ratio.',
        ],
      },
      'id-card': {
        facts: [
          { label: 'Processing', value: '100% offline HTML5 Canvas enforced by strict CSP' },
          { label: 'Physical scale', value: 'ISO/IEC 7810 ID-1 exact scale (85.6 × 53.98 mm) on A4 sheet' },
          { label: 'Watermark', value: 'Custom text, angle, opacity, spacing, and color' },
          { label: 'Output', value: 'Print-ready high-DPI A4 PNG sheet (300 DPI equivalent)' },
          { label: 'Pricing', value: 'Free, zero watermarks from Moklu' },
          { label: 'Verification', value: 'Disconnect Wi-Fi after loading to verify 100% offline execution' },
        ],
        boundaries: [
          'Generates print-ready A4 PNG sheets locally; always verify scale at 100% ("Actual Size") in your print dialog.',
          'Moklu never transmits or stores identity document pixels on any server.',
        ],
      },
    },
  },
  zh: {
    heading: '快速规格与能力边界',
    subheading: '当前浏览器工具支持的参数范围、导出格式与透明边界说明。',
    boundariesHeading: '明确的能力边界',
    buckets: {
      hub: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '费用与水印', value: '核心工具免费，标准导出零水印' },
          { label: '包含工具', value: '样机套壳、在线图片拼接、切图、压缩转换、缩放加白边、证件水印 + Studio' },
          { label: '输入支持', value: 'PNG / JPEG / WebP / GIF / SVG（拖拽、选图或 Cmd/Ctrl+V 粘贴）' },
          { label: '导出格式', value: 'PNG、WebP、JPEG、单页 PDF 1.4 与批量 ZIP' },
          { label: '安全上限', value: '画布上限 8192px / 64MP，超限自动等比缩放并提示' },
        ],
        boundaries: [
          '全部像素计算在本机浏览器内存中运行，无服务器上传或云端存储队列。',
          '拼图 PDF 导出将成品封装为单页 PDF 1.4，不用于合并多个已有 PDF 文档。',
        ],
      },
      mockup: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '支持设备框', value: 'Chrome、Safari、极简窗口、iPhone 16 Pro、Pixel 9、9:16 商店图' },
          { label: '费用与水印', value: '2K 高清 PNG 导出免费无水印' },
          { label: '外观控制', value: '内边距、圆角、柔和投影、浅深色窗口与渐变背景' },
          { label: '进阶联动', value: '一键转入 Moklu Studio 进行多图层精修' },
          { label: '离线可用', value: '页面加载后断开网络依然可以完整导出' },
        ],
        boundaries: [
          '快速工作台主打单图极速套壳；如需多设备组合、大字标题与多语言套图，请点击打开 Studio。',
          '浏览器地址栏文字仅为视觉 SVG 装饰，不会请求或访问任何网址。',
        ],
      },
      merge: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '布局模式', value: '横向并排、竖向长图、2–6 列宫格（支持 cover / contain）' },
          { label: '对齐方式', value: '按最小对齐（默认）、按最大对齐、原尺寸（靠顶/左 · 居中 · 靠底/右）' },
          { label: '排序与微调', value: '拖拽排序、一键反转、单图 90° 旋转、0–24px 描边边框、自定义取色器' },
          { label: '导出与复制', value: 'PNG / WebP / JPEG / 单页 PDF 1.4（50%–100% 质量）+ 一键复制剪贴板' },
          { label: '张数与上限', value: '无固定张数限制；8192px / 64MP 安全上限，超限自动等比缩放并提示' },
        ],
        boundaries: [
          '竖向长图按边缘整齐拼接，不包含自动识别并裁去重复滚动区域或状态栏的功能。',
          'PDF 导出生成单页 PDF 1.4 图片文件（非多页 PDF 合并）；导出 JPEG/PDF 时透明底自动转为白底。',
          '如需自由叠放图层、添加标注箭头或标题文案，可一键转入 Moklu Studio。',
        ],
      },
      split: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '切图模式', value: '小红书/IG 无缝轮播（3:4、4:5、1:1）与 1–6 行 × 1–6 列宫格' },
          { label: '费用与水印', value: '免费无限次切图，零水印' },
          { label: '导出方式', value: '按序编号 PNG，一键本地打包 ZIP 下载' },
          { label: '可视化预览', value: '实时叠加像素级切割参考线' },
          { label: '离线可用', value: '电脑与手机浏览器均可离线完成切图' },
        ],
        boundaries: [
          '仅执行严格像素级无损裁切，不进行 AI 扩图或内容生成补全。',
          'ZIP 打包在浏览器内存中执行，超大图批量导出受限于本机可用内存。',
        ],
      },
      compress: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '支持格式', value: 'PNG、JPEG、WebP 本地批量压缩与格式互转' },
          { label: '调节参数', value: '画质滑块、最大宽度限制、实时压缩前后体积对比' },
          { label: '导出方式', value: '单张下载或一键本地 ZIP 批量打包' },
          { label: '费用与限额', value: '无每日张数上限，免费无水印' },
          { label: '隐私特性', value: 'Canvas 重编码自动移除 EXIF 拍摄隐私信息' },
        ],
        boundaries: [
          '基于浏览器原生 Canvas 编码器，不依赖服务端 mozjpeg/pngquant 云端压缩队列。',
          '动态 GIF 或动态 WebP 经 Canvas 重编码后会保留首帧静态图。',
        ],
      },
      resize: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '支持模式', value: '批量改尺寸（像素/%）、比例裁剪（1:1/4:5/3:4/16:9）、留白加白边' },
          { label: '白边样式', value: '自定义留白底色、圆角与柔和投影' },
          { label: '导出方式', value: 'PNG / WebP / JPEG，支持批量 ZIP 下载' },
          { label: '费用与水印', value: '免费无限次本地处理，零水印' },
          { label: '隐私特性', value: '所有裁剪与留白均在本地内存中完成' },
        ],
        boundaries: [
          '超过原图尺寸放大时采用浏览器标准插值算法，不含 AI 超分放大。',
          '加白边留白模式 100% 保留完整原画面，不会裁切构图边缘。',
        ],
      },
      'id-card': {
        facts: [
          { label: '处理方式', value: '100% 离线 HTML5 Canvas + 严格 CSP 策略防护' },
          { label: '物理比例', value: '严格 ISO/IEC 7810 ID-1 物理尺寸（85.6 × 53.98 mm）A4 排版' },
          { label: '防盗水印', value: '自定义用途文字、倾角、透明度、密度与颜色' },
          { label: '导出规格', value: '高分辨率 A4 可直接打印 PNG 文件' },
          { label: '费用与水印', value: '免费使用，不附加任何平台推广水印' },
          { label: '离线验证', value: '打开页面后断开 Wi-Fi 即可验证纯离线执行' },
        ],
        boundaries: [
          '本地生成 A4 打印级 PNG；打印时请在打印对话框勾选“实际大小 / 100% 缩放”以保证 1:1 比例。',
          'Moklu 绝不上传、不记录、不缓存任何身份证件像素。',
        ],
      },
    },
  },
  ja: {
    heading: 'クイック仕様と動作範囲',
    subheading: 'このブラウザツールの対応形式・上限・ローカル処理仕様。',
    boundariesHeading: '対応範囲と制限事項',
    buckets: {
      hub: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（サーバー送信ゼロ）' },
          { label: '料金・透かし', value: '基本ツール無料、強制透かしなし' },
          { label: '主要ツール', value: 'モックアップ・画像結合・分割・圧縮変換・リサイズ・身分証透かし + Studio' },
          { label: '入力形式', value: 'PNG / JPEG / WebP / GIF / SVG（ドロップ・選択・Cmd/Ctrl+V）' },
          { label: '出力形式', value: 'PNG、WebP、JPEG、単ページ PDF 1.4、一括 ZIP' },
          { label: '安全上限', value: '最大 8192px / 64MP（超過時は自動等比縮小と通知を表示）' },
        ],
        boundaries: [
          'すべてのピクセル処理は端末のブラウザメモリ内で完結し、外部サーバーへの送信は一切ありません。',
          '画像結合の PDF 出力は単ページ PDF 1.4 生成専用であり、複数ページ PDF 文書の結合ツールではありません。',
        ],
      },
      mockup: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: '対応フレーム', value: 'Chrome、Safari、ミニマル枠、iPhone 16 Pro、Pixel 9、9:16 ストア枠' },
          { label: '料金・透かし', value: '2K PNG 書き出し無料、透かしなし' },
          { label: '調整項目', value: '余白、角丸、シャドウ、ライト/ダーク枠、背景色' },
          { label: 'Studio 連携', value: 'ワンクリックで Moklu Studio 多層編集へ引き継ぎ' },
          { label: 'オフライン対応', value: 'ページ読み込み後はオフラインでも動作' },
        ],
        boundaries: [
          'クイックツールは単体フレームの高速出力向けです。複数端末合成や見出し追加は Moklu Studio をご利用ください。',
          'ブラウザ枠のアドレスバー表記は装飾用 SVG であり、外部 URL へアクセスしません。',
        ],
      },
      merge: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: 'レイアウト', value: '横並び、縦結合、2〜6 列グリッド（cover / contain 対応）' },
          { label: 'サイズ揃え', value: '最小揃え（初期値）、最大揃え、原寸（先頭・中央・末尾揃え）' },
          { label: '並び替え・装飾', value: 'ドラッグ並び替え、順序反転、90° 回転、0〜24px 枠線、カラーピッカー' },
          { label: '出力・コピー', value: 'PNG / WebP / JPEG / 単ページ PDF 1.4（画質 50%〜100%）+ クリップボードコピー' },
          { label: '上限仕様', value: '枚数固定上限なし；8192px / 64MP 超過時は自動縮小＆通知' },
        ],
        boundaries: [
          '縦長結合では重複スクロール領域やステータスバーの自動削除は行わず、元画像を正確に連結します。',
          'PDF 出力は結合画像を 1 ページに収める単ページ PDF 1.4 仕様です（JPEG/PDF の透過領域は自動で白地合成）。',
          '自由配置や矢印・見出しテキスト追加はワンクリックで Moklu Studio へ引き継げます。',
        ],
      },
      split: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: '分割モード', value: 'カルーセル分割（4:5 / 3:4 / 1:1）＆自由グリッド（1〜6 行 × 1〜6 列）' },
          { label: '料金・透かし', value: '無料・回数無制限・透かしなし' },
          { label: '出力形式', value: '連番 PNG をワンクリックでローカル ZIP 保存' },
          { label: 'プレビュー', value: '書き出し前にカットラインをリアルタイム表示' },
          { label: 'オフライン対応', value: 'PC・スマホどちらのブラウザでもオフライン実行可能' },
        ],
        boundaries: [
          'ピクセル単位の正確な分割のみを行い、AI 補完や画像生成は行いません。',
          'ZIP 生成はブラウザメモリ内で行うため、極端に大きな画像は端末メモリに依存します。',
        ],
      },
      compress: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: '対応形式', value: 'PNG / JPEG / WebP のローカル一括圧縮と形式変換' },
          { label: '調整項目', value: '画質スライダー、最大幅縮小、前後バイト数のリアルタイム比較' },
          { label: '出力形式', value: '個別ダウンロードまたは一括ローカル ZIP' },
          { label: '料金・制限', value: '1 日の回数制限なし、無料・透かしなし' },
          { label: 'プライバシー', value: 'Canvas 再エンコード時に EXIF メタデータを除去' },
        ],
        boundaries: [
          'サーバー側バイナリではなくブラウザ標準の Canvas エンコーダを使用します。',
          'アニメーション GIF / WebP は再エンコード時に先頭フレームの静止画になります。',
        ],
      },
      resize: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: '対応モード', value: '一括リサイズ（px / %）、比率切り抜き、白枠・余白パディング' },
          { label: '枠スタイル', value: '自由背景色、角丸、ソフトシャドウ' },
          { label: '出力形式', value: 'PNG / WebP / JPEG、一括 ZIP 出力対応' },
          { label: '料金・透かし', value: '無料・無制限・透かしなし' },
          { label: 'プライバシー', value: 'すべての変換が端末ブラウザメモリ内で完結' },
        ],
        boundaries: [
          '元画像より大きく拡大する場合はブラウザ標準補間となり、AI 超解像は行いません。',
          '白枠・パディングモードでは元写真を一切切り抜かずに目的比率へ収めます。',
        ],
      },
      'id-card': {
        facts: [
          { label: '処理方式', value: '厳格な CSP 保護下の完全オフライン HTML5 Canvas' },
          { label: '実寸規格', value: 'ISO/IEC 7810 ID-1 実寸（85.6 × 53.98 mm）A4 配置' },
          { label: '透かし設定', value: '用途テキスト・角度・透明度・間隔・色を自由指定' },
          { label: '出力規格', value: '印刷対応の高解像度 A4 PNG' },
          { label: '料金・透かし', value: '無料、Moklu の宣伝透かしは一切なし' },
          { label: '検証方法', value: 'ページ表示後に Wi-Fi を切ってオフライン動作を確認可能' },
        ],
        boundaries: [
          'A4 印刷用 PNG をローカル生成します。印刷時は「実際のサイズ（100%）」を選んでください。',
          '身分証の画像データがサーバーへ送信・保存されることは一切ありません。',
        ],
      },
    },
  },
  ko: {
    heading: '빠른 사양 및 기능 범위',
    subheading: '현재 브라우저 도구의 지원 형식, 한도 및 투명한 처리 범위 안내.',
    boundariesHeading: '기능 범위 및 제한 사항',
    buckets: {
      hub: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '요금 및 워터마크', value: '핵심 도구 무료, 기본 내보내기 워터마크 없음' },
          { label: '지원 도구', value: '목업, 온라인 이미지 합치기, 분할, 압축·변환, 리사이즈, 신분증 워터마크 + Studio' },
          { label: '입력 형식', value: 'PNG, JPEG, WebP, GIF, SVG (드롭, 선택, Cmd/Ctrl+V 붙여넣기)' },
          { label: '출력 형식', value: 'PNG, WebP, JPEG, 단일 페이지 PDF 1.4, 일괄 ZIP' },
          { label: '안전 한도', value: '최대 8192px / 64MP (초과 시 자동 비례 축소 및 안내 표시)' },
        ],
        boundaries: [
          '모든 픽셀 처리는 사용자 기기의 브라우저 메모리에서 실행되며 서버 업로드나 대기열이 없습니다.',
          '이미지 합치기의 PDF 내보내기는 단일 페이지 PDF 1.4 생성용이며 다중 페이지 PDF 문서 병합 도구가 아닙니다.',
        ],
      },
      mockup: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '지원 프레임', value: 'Chrome, Safari, 미니멀 창, iPhone 16 Pro, Pixel 9, 9:16 앱스토어' },
          { label: '요금 및 워터마크', value: '2K PNG 내보내기 무료, 워터마크 없음' },
          { label: '커스터마이즈', value: '여백, 라운드, 그림자, 라이트/다크 프레임, 배경색' },
          { label: 'Studio 연계', value: '원클릭으로 Moklu Studio 멀티 레이어 편집 이동' },
          { label: '오프라인 지원', value: '페이지 로드 후 오프라인에서도 즉시 작동' },
        ],
        boundaries: [
          '빠른 작업대는 단일 프레임 고속 생성에 최적화되어 있으며, 다중 기기 배치나 제목 문구는 Moklu Studio에서 편집하세요.',
          '브라우저 프레임 주소창은 시각적 SVG 요소이며 외부 URL에 접속하지 않습니다.',
        ],
      },
      merge: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '레이아웃', value: '가로, 세로, 2~6열 그리드 (cover / contain 전환)' },
          { label: '크기 정렬', value: '최소 맞춤(기본), 최대 맞춤, 원본(시작 / 가운데 / 끝 정렬)' },
          { label: '정렬 및 스타일', value: '드래그 정렬, 순서 뒤집기, 90° 회전, 0~24px 테두리, 커스텀 색상 선택기' },
          { label: '출력 및 복사', value: 'PNG / WebP / JPEG / 단일 페이지 PDF 1.4 (품질 50%~100%) + 클립보드 복사' },
          { label: '한도 안내', value: '고정 장수 제한 없음; 8192px / 64MP 초과 시 자동 축소 및 알림' },
        ],
        boundaries: [
          '세로 이어붙이기는 겹치는 스크롤 영역이나 상태바를 자동 삭제하지 않으며 원본 픽셀을 예측 가능하게 연결합니다.',
          'PDF 내보내기는 합쳐진 이미지를 한 장에 담은 단일 페이지 PDF 1.4를 생성합니다 (JPEG/PDF 투명 배경은 자동 흰색 처리).',
          '자유 레이어 배치, 화살표 강조, 헤드라인 추가는 원클릭으로 Moklu Studio에서 이어서 편집하세요.',
        ],
      },
      split: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '분할 모드', value: '심리스 캐러셀(4:5, 3:4, 1:1) 및 맞춤 격자(1~6행 × 1~6열)' },
          { label: '요금 및 워터마크', value: '무료 무제한 분할, 워터마크 없음' },
          { label: '출력 형식', value: '번호순 PNG를 원클릭 로컬 ZIP으로 저장' },
          { label: '미리보기', value: '내보내기 전 실시간 절단 가이드라인 표시' },
          { label: '오프라인 지원', value: '데스크톱과 모바일 브라우저 모두 오프라인 작동' },
        ],
        boundaries: [
          '픽셀 단위 정확한 절단만 수행하며 AI 확장이나 생성 채우기는 포함하지 않습니다.',
          'ZIP 압축은 브라우저 메모리에서 수행되므로 초대형 파일은 기기 RAM 용량에 영향을 받습니다.',
        ],
      },
      compress: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '지원 형식', value: 'PNG, JPEG, WebP 로컬 일괄 압축 및 포맷 변환' },
          { label: '제어 옵션', value: '품질 슬라이더, 최대 너비 축소, 전후 용량 실시간 비교' },
          { label: '출력 형식', value: '개별 저장 또는 원클릭 로컬 ZIP 묶음 다운로드' },
          { label: '요금 및 제한', value: '일일 파일 수 제한 없음, 무료·무워터마크' },
          { label: '프라이버시', value: 'Canvas 재인코딩 시 EXIF 메타데이터 자동 제거' },
        ],
        boundaries: [
          '서버 바이너리가 아닌 브라우저 기본 Canvas 인코더를 사용합니다.',
          '애니메이션 GIF/WebP는 Canvas 재인코딩 시 첫 프레임 정지 이미지로 저장됩니다.',
        ],
      },
      resize: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '지원 모드', value: '일괄 리사이즈(px/%), SNS 비율 자르기, 흰 테두리·여백 패딩' },
          { label: '테두리 스타일', value: '맞춤 배경색, 모서리 라운드, 부드러운 그림자' },
          { label: '출력 형식', value: 'PNG, WebP, JPEG 및 일괄 ZIP 다운로드' },
          { label: '요금 및 워터마크', value: '무료 무제한 로컬 실행, 워터마크 없음' },
          { label: '프라이버시', value: '모든 크기 조절과 패딩이 브라우저 RAM에서 처리됨' },
        ],
        boundaries: [
          '원본보다 크게 확대할 때는 브라우저 표준 보간을 사용하며 AI 업스케일링은 포함하지 않습니다.',
          '흰 테두리·패딩 모드는 원본 사진의 어떤 부분도 자르지 않고 비율을 맞춥니다.',
        ],
      },
      'id-card': {
        facts: [
          { label: '처리 방식', value: '엄격한 CSP 정책이 적용된 100% 오프라인 HTML5 Canvas' },
          { label: '실물 규격', value: 'ISO/IEC 7810 ID-1 실물 크기(85.6 × 53.98 mm) A4 배치' },
          { label: '워터마크', value: '용도 문구, 각도, 투명도, 간격, 색상 맞춤 설정' },
          { label: '출력 규격', value: '인쇄용 고해상도 A4 PNG 시트' },
          { label: '요금 및 워터마크', value: '무료, Moklu 홍보 워터마크 없음' },
          { label: '검증 방법', value: '페이지 로드 후 Wi-Fi를 끄고 오프라인 동작 직접 확인 가능' },
        ],
        boundaries: [
          '인쇄용 A4 PNG를 로컬 생성하며, 인쇄 시 대화상자에서 "실제 크기(100%)"를 선택하세요.',
          '신분증 픽셀 데이터는 어떤 서버로도 전송되거나 저장되지 않습니다.',
        ],
      },
    },
  },
}

export function getToolQuickFacts(
  locale: LocaleCode,
  route: Pick<ResolvedRoute, 'category' | 'tool'>,
): ToolQuickFacts {
  const dict = QUICK_FACTS_BY_LOCALE[locale] ?? QUICK_FACTS_BY_LOCALE.en
  const bucketKey: SpecBucket =
    route.category === 'hub'
      ? 'hub'
      : route.category === 'studio' || route.category === 'info'
        ? route.tool
        : route.category
  const bucket = dict.buckets[bucketKey] ?? dict.buckets.hub

  return {
    heading: dict.heading,
    subheading: dict.subheading,
    boundariesHeading: dict.boundariesHeading,
    facts: bucket.facts,
    boundaries: bucket.boundaries,
  }
}
