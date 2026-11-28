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
          { label: 'Processing', value: '100% browser-local HTML5 Canvas & local WASM (zero uploads)' },
          { label: 'Pricing', value: 'Free core tools, zero forced watermarks' },
          { label: 'Core tools', value: 'Mockup & Redact, Merge & Multi-Page PDF, Split, Compress/HEIC/EXIF, Resize, Annotate, ID Photo, ID Watermark + Studio' },
          { label: 'Input formats', value: 'PNG, JPEG, WebP, HEIC/HEIF, AVIF, GIF, SVG (drop, select, or Cmd/Ctrl+V paste)' },
          { label: 'Output formats', value: 'PNG, WebP, JPEG, Multi-Page A4 & Single-Page PDF 1.4, and ZIP batches' },
          { label: 'Safety ceiling', value: 'Up to 8192px / 64MP with automatic proportional scaling notice' },
        ],
        boundaries: [
          'All pixel processing, HEIC WASM decoding, and EXIF inspection run in browser RAM; no cloud storage or server-side queue exists.',
          'PDF export in Merge builds printable Multi-Page A4/Fit PDF 1.4 or Single-Page PDF 1.4 sheets from images rather than merging existing PDF documents.',
        ],
      },
      mockup: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Frames', value: '13 built-in frames: Chrome, Safari, Minimal, iPhone 16 Pro, Pixel 9, iPad, Android Tablet, Apple Watch, Wear OS, Frameless' },
          { label: 'Redaction', value: 'Local Blur, Pixelate, Solid Mask, and Spotlight callout boxes before framing' },
          { label: 'Customization', value: 'Padding, radius, soft shadows, light/dark frames, backdrops' },
          { label: 'Output', value: 'Free 2K PNG export (zero watermarks) or 1-click non-destructive handoff to Moklu Studio' },
          { label: 'Offline ready', value: 'Works with Wi-Fi disconnected once loaded' },
        ],
        boundaries: [
          'Quick Workspace focuses on single-frame speed and instant redaction; open Moklu Studio for multi-device scenes, headlines, and Zero-Key multi-slide localization.',
          'Browser frame address bars are purely decorative SVG art and never fetch live URLs.',
        ],
      },
      merge: {
        facts: [
          { label: 'Processing', value: '100% browser-local HTML5 Canvas (zero uploads)' },
          { label: 'Layouts', value: 'Horizontal, Vertical (smart scroll-overlap removal, fixed bar trim & ghost-overlay seam fine-tuning), and 2–6 column Grid (cover / contain)' },
          { label: 'Alignment', value: 'match-min (default), match-max, original (start / center / end)' },
          { label: 'Ordering & edits', value: 'Drag-and-drop reorder, Reverse, 90° rotate, 0–24px borders, custom colors, local IndexedDB draft autosave' },
          { label: 'Outputs', value: 'PNG, WebP, JPEG, Mode A Multi-Page A4/Fit PDF 1.4 & Mode B Single-Page PDF 1.4 (50%–100% quality), Copy to Clipboard, lossless multi-layer Studio handoff' },
          { label: 'Limits', value: 'No fixed image count cap; 8192px / 64MP auto-scaled ceiling' },
        ],
        boundaries: [
          'Vertical stitching supports both clean edge-to-edge joining and optional smart long-screenshot overlap removal, fixed top/bottom bar trimming, and interactive ghost-overlay seam fine-tuning via 100% local pixel matching (unmatched frames stay intact).',
          'PDF export builds printable Mode A Multi-Page A4/Fit PDF 1.4 packets or Mode B Single-Page PDF 1.4 sheets from images (not merging existing PDF documents); transparent backgrounds turn white in JPEG/PDF.',
          'Supports lossless multi-layer handoff to Moklu Studio for further layer editing and local browser IndexedDB draft autosave (excluding built-in demo images).',
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
          { label: 'Processing', value: '100% browser-local HTML5 Canvas + lazy WASM HEIC decoder (zero uploads)' },
          { label: 'Formats', value: 'Decode HEIC/HEIF, AVIF, PNG, JPEG, WebP and export JPEG, WebP, or PNG in batch' },
          { label: 'Target-KB & controls', value: 'Exact Target-KB binary search (100KB / 200KB / 500KB / custom), quality slider, max-width scaling, live byte counters' },
          { label: 'EXIF & GPS privacy', value: 'Built-in binary EXIF/GPS inspector (JPEG, PNG, WebP, HEIC) with 100% local metadata stripping' },
          { label: 'Output', value: 'Individual downloads or 1-click local ZIP archive' },
          { label: 'Pricing', value: 'Free without daily file caps or watermarks' },
        ],
        boundaries: [
          'Uses native browser Canvas encoders plus a lazy-loaded local WASM HEIC fallback on non-Safari browsers rather than remote cloud queues.',
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
      annotate: {
        facts: [
          { label: 'Processing', value: '100% browser-local SVG vector editor + HTML5 Canvas compositor (zero uploads)' },
          { label: 'Markup tools', value: 'Freehand Brush (Bezier smoothed), Rectangle, Arrow, and editable Text layers' },
          { label: 'Layer controls', value: '8-handle selection box resizing, drag move, color presets, stroke/font sizing, 50-step Undo/Redo' },
          { label: 'Inline mode', value: 'Also opens directly inside Mockup, Resize, and Merge preview stages via 1-click Annotate' },
          { label: 'Outputs', value: 'Full-resolution PNG, WebP, or JPEG download, Copy to Clipboard, and Studio handoff' },
          { label: 'Drafts & pricing', value: 'Local IndexedDB draft autosave, free unlimited exports, zero watermarks' },
        ],
        boundaries: [
          'Annotations stay editable as vector layers inside Quick Workspace and local IndexedDB drafts; downloaded PNG/WebP/JPEG files flatten markup cleanly onto full-resolution pixels.',
          'All brush smoothing, layer hit-testing, and full-res canvas compositing run strictly in browser RAM with zero server uploads.',
        ],
      },
      'id-photo': {
        facts: [
          { label: 'Processing', value: '100% browser-local MODNet FP16 portrait matting + Guided Filter & foreground color decontamination (zero server uploads)' },
          { label: 'Sizes', value: '1-inch (25×35mm / 295×413px), 2-inch (35×49mm / 413×579px), US 2×2 in (600×600px), Schengen/JP/KR 35×45mm & 30×40mm + custom mm/px' },
          { label: 'Backgrounds', value: 'White, Civil Blue, Red, Gray, subtle resume gradient + 1-click White/Blue/Red Trio ZIP' },
          { label: 'Exam KB cap & Print', value: 'Binary-search <=30KB/50KB/100KB/200KB JPG + 300 DPI 6-inch (4R) & A4 print sheets (PNG/PDF)' },
          { label: 'Pricing & Privacy', value: 'Free core exports, zero watermarks, works offline after first local model cache' },
          { label: 'Compliance', value: 'Preserves authentic facial geometry, skin texture, and real clothing for official review' },
        ],
        boundaries: [
          'Preserves authentic facial features and clothing for official government, visa, passport, and exam compliance; does NOT apply AI face reshaping or synthetic suit swapping.',
          'First AI portrait cutout caches the local 12.4 MB MODNet FP16 model in your browser with zero image uploads; pure-backdrop mode also runs immediately with zero model download.',
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
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas 与本地 WASM（零上传）' },
          { label: '费用与水印', value: '核心工具免费，标准导出零水印' },
          { label: '包含工具', value: '样机套壳/打码、在线图片拼接/多页 PDF、切图、压缩/HEIC/EXIF、缩放加白边、图片标注、证件照、证件水印 + Studio' },
          { label: '输入支持', value: 'PNG / JPEG / WebP / HEIC / HEIF / AVIF / GIF / SVG（拖拽、选图或 Cmd/Ctrl+V）' },
          { label: '导出格式', value: 'PNG、WebP、JPEG、多页 A4 / 单页 PDF 1.4 与批量 ZIP' },
          { label: '安全上限', value: '画布上限 8192px / 64MP，超限自动等比缩放并提示' },
        ],
        boundaries: [
          '全部像素计算、HEIC WASM 解码与 EXIF 解析均在本机浏览器内存中运行，无服务器上传或云端队列。',
          '拼图 PDF 导出支持由图片生成多页 A4/自适应 PDF 1.4 或单页 PDF 1.4，不用于合并多个已有 PDF 文档。',
        ],
      },
      mockup: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '支持设备框', value: '13 款内置样机：Chrome、Safari、极简窗口、iPhone 16 Pro、Pixel 9、iPad、安卓平板、Apple Watch、Wear OS、无边框' },
          { label: '隐私打码', value: '支持本地模糊、马赛克、纯色实心遮盖与聚光灯高亮，脱敏后再套壳' },
          { label: '外观控制', value: '内边距、圆角、柔和投影、浅深色窗口与渐变背景' },
          { label: '进阶联动', value: '2K 高清 PNG 免费无水印，支持一键无损转入 Moklu Studio 多图层精修' },
          { label: '离线可用', value: '页面加载后断开网络依然可以完整导出' },
        ],
        boundaries: [
          '快速工作台主打单图极速套壳与本地打码；如需多设备组合、大字标题与零 API Key 多语言套图，请打开 Studio。',
          '浏览器地址栏文字仅为视觉 SVG 装饰，不会请求或访问任何网址。',
        ],
      },
      merge: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas（零上传）' },
          { label: '布局模式', value: '横向并排、竖向长图（智能去重叠、固定顶/底栏裁剪与半透明重影接缝微调）、2–6 列宫格（cover / contain）' },
          { label: '对齐方式', value: '按最小对齐（默认）、按最大对齐、原尺寸（靠顶/左 · 居中 · 靠底/右）' },
          { label: '排序与微调', value: '拖拽排序、一键反转、单图 90° 旋转、0–24px 描边边框、自定义取色器、本地 IndexedDB 草稿自动保存' },
          { label: '导出与复制', value: 'PNG / WebP / JPEG / 模式 A 多页 A4 PDF & 模式 B 单页 PDF 1.4（50%–100% 质量）、一键复制、多图层无损移交 Studio' },
          { label: '张数与上限', value: '无固定张数限制；8192px / 64MP 安全上限，超限自动等比缩放并提示' },
        ],
        boundaries: [
          '竖向拼接支持标准首尾相接及可选智能长截图去重叠、固定顶/底栏裁剪与半透明重影接缝微调（纯本地像素匹配，无明显重叠自动安全保留原图）。',
          'PDF 导出支持模式 A（一图一页的多页 A4/自适应打印 PDF 1.4）与模式 B（单页 PDF 1.4），用于图片转 PDF 而非合并已有 PDF 文档；透明底在 JPEG/PDF 中自动转白。',
          '支持拼图多图层无损移交 Moklu Studio 二次编辑（独立保留各图位置、圆角与旋转），并支持本地 IndexedDB 草稿自动保存。',
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
          { label: '处理方式', value: '100% 浏览器本地 HTML5 Canvas + 按需本地 WASM HEIC 解码（零上传）' },
          { label: '支持格式', value: '读取 HEIC/HEIF、AVIF、PNG、JPEG、WebP，批量输出 JPEG、WebP 或 PNG' },
          { label: '目标体积与画质', value: '确定性目标 KB 二分压缩（100KB / 200KB / 500KB / 自定义）、画质滑块、最大宽度与前后体积对比' },
          { label: 'EXIF 与 GPS 隐私', value: '内置二进制 EXIF/GPS 体检（JPEG / PNG / WebP / HEIC），导出自动彻底清除位置与设备元数据' },
          { label: '导出方式', value: '单张下载或一键本地 ZIP 批量打包' },
          { label: '费用与限额', value: '无每日张数上限，免费无水印' },
        ],
        boundaries: [
          '基于浏览器原生 Canvas 编码器及非 Safari 下的按需本地 WASM HEIC 解码器，不依赖云端转码队列。',
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
      annotate: {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地矢量 SVG 编辑与 HTML5 Canvas 原图合成（零上传）' },
          { label: '标注工具', value: '平滑贝塞尔画笔、矩形框、指示箭头与可双击编辑的文字图层' },
          { label: '图层编辑', value: '8 控制点自由缩放拉伸、拖拽移动、8 色快捷色盘、线宽/字号调节与 50 步撤销重做' },
          { label: '内联联动', value: '同时内置在样机套壳、缩放裁剪与拼图预览栏中，一键弹窗原地标注保存' },
          { label: '导出与复制', value: '原图分辨率 PNG / WebP / JPEG 下载、一键复制到剪贴板与转入 Studio' },
          { label: '草稿与费用', value: '本地 IndexedDB 草稿自动保存，免费无限次导出且无水印' },
        ],
        boundaries: [
          '快捷工作台与本地 IndexedDB 草稿中所有标注均保持矢量可二次编辑；导出 PNG/WebP/JPEG 时会在原图完整分辨率上无损合成为单张图片。',
          '画笔平滑、选中命中检测与高清合成全部在本地浏览器内存中完成，不上传任何图片或标注内容。',
        ],
      },
      'id-photo': {
        facts: [
          { label: '处理方式', value: '100% 浏览器本地 MODNet FP16 人像抠图 + 导向滤波与前景色去污染（零上传）' },
          { label: '支持尺寸', value: '一寸（25×35mm / 295×413px）、二寸（35×49mm / 413×579px）、美签 2×2 英寸（600×600px）、申根/日韩 35×45mm 与 30×40mm 及自定义 mm/px' },
          { label: '底色与打包', value: '标准白底、政务蓝底、证件红底、高级灰、简历淡渐变，支持一键白/蓝/红三底色 ZIP 打包' },
          { label: '报名控体积与冲印', value: '二分精准压至 ≤30KB / 50KB / 100KB / 200KB JPG，内置 300 DPI 六寸（4R）与 A4 冲印排版（PNG / PDF）' },
          { label: '费用与离线', value: '核心制作免费无水印，首次本地缓存模型后断网也可离线制作' },
          { label: '合规原则', value: '严格保留真实五官轮廓与原始着装，满足公考、护照与签证官方审核标准' },
        ],
        boundaries: [
          '为确保通过政府证件、护照签证及考试报名系统的人脸比对审核，本工具坚持保留真实面部特征与着装，不提供 AI 换脸美颜磨皮或虚假 AI 换装。',
          '首次 AI 抠图会在浏览器本地缓存 12.4 MB 的 MODNet FP16 模型（照片像素零上传）；纯色背景照片亦可直接使用零模型快速换底模式。',
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
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas ＆ ローカル WASM（サーバー送信ゼロ）' },
          { label: '料金・透かし', value: '基本ツール無料、強制透かしなし' },
          { label: '主要ツール', value: 'モックアップ＆ぼかし・画像結合/複数ページ PDF・分割・圧縮/HEIC/EXIF・リサイズ・画像注釈・証明写真・身分証透かし + Studio' },
          { label: '入力形式', value: 'PNG / JPEG / WebP / HEIC / HEIF / AVIF / GIF / SVG（ドロップ・選択・Cmd/Ctrl+V）' },
          { label: '出力形式', value: 'PNG、WebP、JPEG、複数ページ A4 / 単ページ PDF 1.4、一括 ZIP' },
          { label: '安全上限', value: '最大 8192px / 64MP（超過時は自動等比縮小と通知を表示）' },
        ],
        boundaries: [
          'すべてのピクセル処理、HEIC WASM デコード、EXIF 検査は端末のブラウザメモリ内で完結し、外部サーバーへの送信は一切ありません。',
          '画像結合の PDF 出力は複数ページ A4 / フィット PDF 1.4 または単ページ PDF 1.4 の画像生成専用であり、既存 PDF 文書同士の結合ツールではありません。',
        ],
      },
      mockup: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: '対応フレーム', value: '全 13 種：Chrome・Safari・ミニマル枠・iPhone 16 Pro・Pixel 9・iPad・Android タブレット・Apple Watch・Wear OS・フレームレス' },
          { label: '伏せ字・ぼかし', value: 'ローカルでぼかし・モザイク・塗りつぶし・スポットライト強調を適用可能' },
          { label: '調整項目', value: '余白、角丸、シャドウ、ライト/ダーク枠、背景色' },
          { label: 'Studio 連携', value: '2K PNG 書き出し無料（透かしなし）＋ワンクリックで Moklu Studio 非破壊多層編集へ引き継ぎ' },
          { label: 'オフライン対応', value: 'ページ読み込み後はオフラインでも動作' },
        ],
        boundaries: [
          'クイックツールは単体フレームの高速出力とローカルぼかし向けです。複数端末合成やゼロキー多言語翻訳は Moklu Studio をご利用ください。',
          'ブラウザ枠のアドレスバー表記は装飾用 SVG であり、外部 URL へアクセスしません。',
        ],
      },
      merge: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas（送信ゼロ）' },
          { label: 'レイアウト', value: '横並び、縦結合（スマート重複除去・固定上下バー切り抜き・半透明ゴースト継ぎ目微調整対応）、2〜6 列グリッド（cover / contain）' },
          { label: 'サイズ揃え', value: '最小揃え（初期値）、最大揃え、原寸（先頭・中央・末尾揃え）' },
          { label: '並び替え・装飾', value: 'ドラッグ並び替え、順序反転、90° 回転、0〜24px 枠線、カラーピッカー、ローカル IndexedDB 下書き自動保存' },
          { label: '出力・コピー', value: 'PNG / WebP / JPEG / モード A 複数ページ A4 PDF ＆ モード B 単ページ PDF 1.4（画質 50%〜100%）、コピー、多層 Studio 無劣化引き継ぎ' },
          { label: '上限仕様', value: '枚数固定上限なし；8192px / 64MP 超過時は自動縮小＆通知' },
        ],
        boundaries: [
          '縦結合は標準の端揃え連結に加え、100% ローカルのピクセル照合によるスマート長尺スクショ重複除去・固定上下バー切り抜き・ゴースト継ぎ目微調整を利用できます。',
          'PDF 出力はモード A（複数ページ A4 / フィット PDF 1.4）とモード B（単ページ PDF 1.4）に対応します（既存 PDF 結合ではありません；透過領域は自動で白地合成）。',
          '結合した複数画像を独立レイヤーのまま無劣化で Moklu Studio へ引き継いで再編集でき、作業状態はローカル IndexedDB 下書きに自動保存されます。',
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
          { label: '処理方式', value: '100% ブラウザ内 HTML5 Canvas ＋ 遅延読込ローカル WASM HEIC デコーダ（送信ゼロ）' },
          { label: '対応形式', value: 'HEIC/HEIF・AVIF・PNG・JPEG・WebP を読み込み、JPEG・WebP・PNG へ一括変換' },
          { label: '目標 KB・調整項目', value: '目標 KB 二分探索圧縮（100KB / 200KB / 500KB / 任意）、画質スライダー、最大幅縮小、前後容量比較' },
          { label: 'EXIF・GPS プライバシー', value: '内蔵バイナリ EXIF/GPS 検査（JPEG/PNG/WebP/HEIC）＆ 100% ローカルメタデータ完全除去' },
          { label: '出力形式', value: '個別ダウンロードまたは一括ローカル ZIP' },
          { label: '料金・制限', value: '1 日の回数制限なし、無料・透かしなし' },
        ],
        boundaries: [
          'ブラウザ標準 Canvas エンコーダと非 Safari 向けローカル WASM HEIC デコーダのみを使用し、外部サーバーへ一切送信しません。',
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
      annotate: {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内ベクター SVG 編集 ＋ HTML5 Canvas 高解像度合成（送信ゼロ）' },
          { label: '注釈ツール', value: '滑らかなベジェ手書きペン、矩形枠、矢印、ダブルクリック編集対応テキスト' },
          { label: 'レイヤー操作', value: '8 ハンドル拡大縮小、ドラッグ移動、カラーパレット、線幅・文字サイズ調整、50 段階の元に戻す/やり直す' },
          { label: 'ツール内連携', value: 'モックアップ・リサイズ・画像結合のプレビューからもワンクリックで注釈モーダルを起動可能' },
          { label: '書き出し', value: '元解像度 PNG / WebP / JPEG 保存、クリップボードコピー、Studio 引き継ぎ' },
          { label: '下書き・料金', value: 'ローカル IndexedDB 下書き自動保存、無料・透かしなし' },
        ],
        boundaries: [
          'ワークスペース内およびローカル IndexedDB 下書きでは注釈レイヤーを再編集可能なベクター状態で保持し、PNG/WebP/JPEG 書き出し時に元解像度で鮮明に合成します。',
          'すべての描画・当たり判定・合成は端末ブラウザのメモリ内で完結し、外部サーバーへの送信は一切ありません。',
        ],
      },
      'id-photo': {
        facts: [
          { label: '処理方式', value: '100% ブラウザ内 MODNet FP16 人物切り抜き ＋ ガイデッドフィルタ＆前景デコンタミネーション（送信ゼロ）' },
          { label: '対応サイズ', value: '履歴書 30×40mm、マイナンバー・パスポート 35×45mm、1寸（25×35mm）・2寸（35×49mm）、米国ビザ 2×2 in（600×600px）＋自由 mm/px' },
          { label: '背景色・一括出力', value: '白・水色/公的ブルー・赤・グレー・履歴書用淡グラデーション ＋ 白/青/赤 3色トリオ ZIP 一括保存' },
          { label: '容量上限と印刷シート', value: '二分探索で 30KB / 50KB / 100KB / 200KB 以下に JPG 圧縮 ＋ 300 DPI L判/4R（6インチ）＆ A4 印刷シート（PNG / PDF）' },
          { label: '料金・オフライン', value: '基本書き出し無料・透かしなし、初回モデルキャッシュ後はオフライン動作対応' },
          { label: '公式申請準拠', value: '本人の顔立ちや服装を忠実に保ち、パスポート・マイナンバー・受験申請の審査基準に準拠' },
        ],
        boundaries: [
          'パスポート・マイナンバーカード・ビザ・資格試験の本人確認審査に準拠するため、AI による顔の輪郭変形や合成スーツ着せ替え機能は意図的に搭載していません。',
          '初回の AI 人物切り抜き時に約 12.4 MB の MODNet FP16 モデルをブラウザ内キャッシュへ保存します（写真データの外部送信はゼロ）。無地背景の写真はモデル読込なしの高速モードも利用できます。',
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
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas 및 로컬 WASM (업로드 제로)' },
          { label: '요금 및 워터마크', value: '핵심 도구 무료, 기본 내보내기 워터마크 없음' },
          { label: '지원 도구', value: '목업/모자이크, 온라인 이미지 합치기/다중 페이지 PDF, 분할, 압축/HEIC/EXIF, 리사이즈, 이미지 주석, 증명사진, 신분증 워터마크 + Studio' },
          { label: '입력 형식', value: 'PNG, JPEG, WebP, HEIC/HEIF, AVIF, GIF, SVG (드롭, 선택, Cmd/Ctrl+V)' },
          { label: '출력 형식', value: 'PNG, WebP, JPEG, 다중 페이지 A4 / 단일 페이지 PDF 1.4, 일괄 ZIP' },
          { label: '안전 한도', value: '최대 8192px / 64MP (초과 시 자동 비례 축소 및 안내 표시)' },
        ],
        boundaries: [
          '모든 픽셀 처리, HEIC WASM 디코딩, EXIF 검사는 기기 브라우저 메모리에서 실행되며 서버 업로드나 대기열이 없습니다.',
          '이미지 합치기의 PDF 내보내기는 사진으로 다중 페이지 A4 / 맞춤 PDF 1.4 또는 단일 페이지 PDF 1.4를 생성하며 기존 PDF 문서를 병합하지 않습니다.',
        ],
      },
      mockup: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '지원 프레임', value: '13종 내장 프레임: Chrome, Safari, 미니멀 창, iPhone 16 Pro, Pixel 9, iPad, 안드로이드 태블릿, Apple Watch, Wear OS, 프레임리스' },
          { label: '보안 가리기', value: '로컬 블러, 모자이크, 단색 마스킹, 스포트라이트 강조 지원' },
          { label: '커스터마이즈', value: '여백, 라운드, 그림자, 라이트/다크 프레임, 배경색' },
          { label: 'Studio 연계', value: '무료 2K PNG(워터마크 없음) 또는 원클릭 비파괴 Moklu Studio 레이어 이동' },
          { label: '오프라인 지원', value: '페이지 로드 후 오프라인에서도 즉시 작동' },
        ],
        boundaries: [
          '빠른 작업대는 단일 프레임 고속 생성과 즉석 가리기에 최적화되어 있으며, 다중 기기 연출과 키 없는(Zero-Key) 다국어 번역은 Moklu Studio에서 진행하세요.',
          '브라우저 프레임 주소창은 시각적 SVG 요소이며 외부 URL에 접속하지 않습니다.',
        ],
      },
      merge: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas (업로드 제로)' },
          { label: '레이아웃', value: '가로, 세로(스마트 스크롤 겹침 제거·고정 상·하단 바 자르기·반투명 고스트 이음새 조정 지원), 2~6열 그리드(cover / contain)' },
          { label: '크기 정렬', value: '최소 맞춤(기본), 최대 맞춤, 원본(시작 / 가운데 / 끝 정렬)' },
          { label: '정렬 및 스타일', value: '드래그 정렬, 순서 뒤집기, 90° 회전, 0~24px 테두리, 커스텀 색상 선택기, 로컬 IndexedDB 초안 자동 저장' },
          { label: '출력 및 복사', value: 'PNG / WebP / JPEG / 모드 A 다중 페이지 A4 PDF & 모드 B 단일 페이지 PDF 1.4 (품질 50%~100%), 복사, 멀티 레이어 무손실 Studio 연동' },
          { label: '한도 안내', value: '고정 장수 제한 없음; 8192px / 64MP 초과 시 자동 축소 및 알림' },
        ],
        boundaries: [
          '세로 이어붙이기는 기본 가장자리 연결과 100% 로컬 픽셀 매칭 기반 스마트 긴 스크린샷 겹침 제거, 고정 상·하단 바 자르기, 고스트 이음새 미세 조정을 지원합니다.',
          'PDF 내보내기는 모드 A(인쇄용 다중 페이지 A4/맞춤 PDF 1.4)와 모드 B(단일 페이지 PDF 1.4)를 모두 지원합니다 (기존 PDF 병합 아님; 투명 배경은 자동 흰색 처리).',
          '병합 이미지를 독립 멀티 레이어 그대로 무손실 Moklu Studio로 넘겨 2차 편집할 수 있으며, 작업 상태는 브라우저 로컬 IndexedDB 초안으로 자동 저장됩니다.',
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
          { label: '처리 방식', value: '100% 브라우저 로컬 HTML5 Canvas + 지연 로드 로컬 WASM HEIC 디코더 (업로드 제로)' },
          { label: '지원 형식', value: 'HEIC/HEIF, AVIF, PNG, JPEG, WebP 읽기 및 JPEG·WebP·PNG 일괄 변환' },
          { label: '목표 KB · 제어 옵션', value: '목표 KB 이진 탐색 압축(100KB / 200KB / 500KB / 직접 입력), 품질 슬라이더, 최대 너비 축소, 전후 용량 비교' },
          { label: 'EXIF · GPS 프라이버시', value: '내장 바이너리 EXIF/GPS 검사기(JPEG/PNG/WebP/HEIC) 및 100% 로컬 메타데이터 완전 제거' },
          { label: '출력 형식', value: '개별 저장 또는 원클릭 로컬 ZIP 묶음 다운로드' },
          { label: '요금 및 제한', value: '일일 파일 수 제한 없음, 무료·무워터마크' },
        ],
        boundaries: [
          '서버 바이너리 없이 브라우저 기본 Canvas 인코더와 비-Safari용 로컬 WASM HEIC 디코더만 사용합니다.',
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
      annotate: {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 벡터 SVG 편집 + HTML5 Canvas 고해상도 합성 (업로드 제로)' },
          { label: '주석 도구', value: '부드러운 베지어 자유 브러시, 사각형, 화살표, 더블클릭 인라인 편집 텍스트' },
          { label: '레이어 제어', value: '8개 핸들 크기 조절, 드래그 이동, 8색 팔레트, 선 굵기/글자 크기 조절, 50단계 실행 취소·다시 실행' },
          { label: '인라인 연동', value: '목업·리사이즈·이미지 합치기 미리보기에서도 원클릭 주석 모달로 즉시 표시 가능' },
          { label: '내보내기', value: '원본 해상도 PNG / WebP / JPEG 다운로드, 클립보드 복사, Moklu Studio 연동' },
          { label: '초안 및 요금', value: '로컬 IndexedDB 초안 자동 저장, 무료 무제한, 워터마크 없음' },
        ],
        boundaries: [
          '퀵 워크스페이스와 브라우저 IndexedDB 초안에서는 주석이 벡터 레이어로 유지되어 언제든 수정할 수 있으며, PNG/WebP/JPEG 저장 시 원본 해상도에 선명하게 합성됩니다.',
          '모든 브러시 보정, 선택 판정, 캔버스 합성은 기기 브라우저 메모리에서만 실행되며 서버로 업로드되지 않습니다.',
        ],
      },
      'id-photo': {
        facts: [
          { label: '처리 방식', value: '100% 브라우저 로컬 MODNet FP16 인물 누끼 + 가이디드 필터 및 전경 색번짐 보정 (서버 업로드 제로)' },
          { label: '지원 규격', value: '여권·주민등록증 35×45mm, 반명함·이력서 30×40mm, 1인치(25×35mm)·2인치(35×49mm), 미국 비자 2×2 in(600×600px) + 사용자 지정 mm/px' },
          { label: '배경 및 일괄 저장', value: '흰색, 공공 블루, 빨강, 그레이, 이력서용 은은한 그라데이션 + 흰색/파랑/빨강 3색 트리오 ZIP 원클릭 저장' },
          { label: '용량 제한 및 인화지', value: '이진 탐색으로 30KB / 50KB / 100KB / 200KB 이하 JPG 맞춤 압축 + 300 DPI 4R(4×6인치) 및 A4 인화 시트(PNG / PDF)' },
          { label: '요금 및 오프라인', value: '핵심 내보내기 무료·워터마크 없음, 최초 모델 캐시 후 오프라인에서도 실행' },
          { label: '공식 심사 준수', value: '실제 얼굴 윤곽과 복장을 그대로 유지해 여권·비자·공채·자격증 심사 기준에 부합' },
        ],
        boundaries: [
          '여권, 비자, 국가시험 및 공채 원서의 본인 확인 심사를 통과할 수 있도록 AI 얼굴 성형·과도한 보정이나 합성 정장 갈아입히기 기능은 제공하지 않습니다.',
          '첫 AI 인물 분리 시 12.4 MB MODNet FP16 모델이 브라우저 로컬 캐시에 저장되며 사진 픽셀은 절대 서버로 전송되지 않습니다. 단색 배경 사진은 모델 다운로드 없는 즉시 모드도 지원합니다.',
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
