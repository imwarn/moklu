# Moklu

**Local-first browser mockup studio & online image toolkit | 纯本地浏览器截图套壳与在线图片拼接工具箱**

> **Try the live zero-upload workbench right now: [https://moklu.app/](https://moklu.app/)**
> 30 dedicated browser-local tools across 4 languages (120 static SSG routes), zero server uploads, zero account walls, zero forced watermarks.
>
> **立即体验纯本地在线工作台：[https://moklu.app/zh/](https://moklu.app/zh/)**
> 覆盖 30 个高频专题页、四语 120 条静态路由：全部处理均在本机浏览器内完成，零上传、免登录、标准高清导出零水印。

- Live workbench / 官方网站: [https://moklu.app/](https://moklu.app/) ([EN](https://moklu.app/) · [中文](https://moklu.app/zh/) · [日本語](https://moklu.app/ja/) · [한국어](https://moklu.app/ko/))
- Online image merger / 在线图片拼接: [https://moklu.app/zh/merge-images/](https://moklu.app/zh/merge-images/) ([EN](https://moklu.app/merge-images/) · [JA](https://moklu.app/ja/merge-images/) · [KO](https://moklu.app/ko/merge-images/))
- Popular instant tools / 热门直达: [HEIC to JPG](https://moklu.app/heic-to-jpg/) · [Compress to 200KB](https://moklu.app/compress-image-to-200kb/) · [Remove EXIF](https://moklu.app/remove-exif/) · [Stitch Screenshots](https://moklu.app/stitch-screenshots/) · [Merge to A4 PDF](https://moklu.app/merge-photos-to-pdf/) · [Redact Screenshot](https://moklu.app/redact-screenshot/) · [Moklu Studio](https://moklu.app/studio/)
- Source code / 开源仓库: [https://github.com/imwarn/moklu](https://github.com/imwarn/moklu) (MIT License)

---

## English

Moklu is an open-source, 100% browser-local visual workbench at **[https://moklu.app](https://moklu.app)** shipping **30 dedicated slugs / 120 localized SSG routes** (`en`, `zh`, `ja`, `ko`). Every mockup render, long-screenshot stitch, HEIC/AVIF decode, EXIF scan, target-KB compression, multi-page A4 PDF build, screenshot redaction, and ID watermark runs directly in browser RAM with zero server uploads and zero forced watermarks on standard exports.

### Complete Feature Matrix (30 Slugs / 120 Localized Routes)

| Tool Family | Dedicated Routes | Key Capabilities | Output & Limits |
| --- | --- | --- | --- |
| **Screenshot Mockups & Local Redaction** | `/`, `/browser-mockup`, `/iphone-mockup`, `/ipad-mockup`, `/watch-mockup`, `/device-mockup`, `/app-store-screenshots`, `/redact-screenshot` | **13 built-in device/browser frames** (Chrome, Safari, Minimal, iPhone 16 Pro, Pixel 9, iPad, Android Tablet, Apple Watch, Wear OS, Frameless); **3-second local Redact** (Blur, Pixelate, Solid Mask, Spotlight focus callouts) before framing; custom padding, shadows, gradients, and light/dark themes | High-res 2K PNG + 1-click non-destructive handoff to Moklu Studio |
| **Online Image Merger & Multi-Page PDF** | `/merge-images`, `/combine-photos-side-by-side`, `/stitch-images-vertically`, `/stitch-screenshots`, `/photo-collage-grid`, `/merge-photos-to-pdf` | Horizontal, vertical (with optional 100% local pixel-matching smart long-screenshot overlap removal, fixed top/bottom bar trimming, and interactive ghost-overlay seam fine-tuning), and 2–6 column grid (`cover` / `contain`, `1:1`, `4:3`, `3:4`, `auto`); `match-min`, `match-max`, `original` (`start` / `center` / `end`); drag-and-drop reorder, Reverse, 90° rotation, borders (`0–24px`), custom color picker, local IndexedDB draft autosave | PNG, WebP, JPEG, **Mode A Multi-Page A4 / Fit printable PDF 1.4** & **Mode B Single-Page Long PDF 1.4** (`50%–100%` quality), Copy to Clipboard, lossless multi-layer Studio handoff; 8192px / 64MP ceiling |
| **Local Compressor, HEIC/AVIF, Target-KB & EXIF** | `/compress-image`, `/compress-image-to-200kb`, `/heic-to-jpg`, `/remove-exif`, `/convert-image-format`, `/png-to-webp` | **Local HEIC/HEIF & AVIF decoding** (native browser decode first, lazy local WASM fallback with zero uploads); **Target-KB binary search compression** (`100KB`, `200KB`, `500KB`, or custom KB with optional dimension lock); **zero-dependency binary EXIF/GPS inspector & remover** (JPEG, PNG, WebP, HEIC); live before/after byte counters | Clean metadata-free JPEG, WebP, or PNG (individual files or 1-click local ZIP) |
| **Carousel & Grid Splitter** | `/carousel-splitter`, `/image-grid-splitter` | Seamless swipeable panorama slices (`4:5`, `3:4`, `1:1`) and custom matrix splits (`1–6` rows × `1–6` cols) with live cut-line overlay | Numbered PNG slices bundled as 1-click local ZIP |
| **Resize, Crop & Border Pad** | `/resize-image`, `/crop-image`, `/add-border-to-photo` | Exact pixel or `%` batch resizing, social ratio cropping (`1:1`, `4:5`, `3:4`, `16:9`), and uncropped gallery border padding | PNG, WebP, JPEG, or batch ZIP |
| **Offline ID Card Watermark** | `/id-card-watermark` | ISO/IEC 7810 ID-1 exact physical scale (`85.6 × 53.98 mm`) on A4 with customizable diagonal anti-fraud watermark text, angle, opacity, and density | Print-ready A4 PNG, 100% offline under strict CSP |
| **Moklu Studio & Headless CLI** | `/studio` (plus `/about`, `/privacy`, `/terms`) | Konva multi-layer canvas editor with 13 frames, brand kits, typography, shapes, non-destructive redaction layers, templates, multi-slide App Store decks, and **Zero-Key Studio translation** (copy-paste JSON workflow with any LLM) | Multi-slide PNG / ZIP exports + **Playwright headless CLI** (`cli/`) |

### Privacy & Explicit Capability Boundaries

- **Zero server uploads**: Every quick tool executes in browser RAM via HTML5 Canvas 2D, `DataView` binary parsers, and lazy-loaded local WASM (for HEIC on non-Safari browsers). Disconnect Wi-Fi after loading any tool page and it still works end to end.
- **Explicit boundaries**:
  - PDF export supports **Mode A Multi-Page A4 / Fit printable PDF 1.4** (one photo per page) and **Mode B Single-Page Long PDF 1.4** (combined sheet) generated from images; it does not merge existing PDF documents.
  - Vertical stitching supports clean edge-to-edge joining plus optional smart long-screenshot overlap removal, fixed top/bottom bar trimming, and interactive ghost-overlay seam fine-tuning via 100% local pixel matching, lossless multi-layer handoff to Moklu Studio, and local browser IndexedDB draft autosave.
  - Canvas outputs enforce an `8192px / 64MP` safety ceiling with automatic proportional scaling and a visible scaled badge.
- **Trust & GEO pages**: `/about`, `/privacy`, `/terms` (available in EN, ZH, JA, KO) and `/llms.txt`.

---

## 简体中文

Moklu（**[https://moklu.app](https://moklu.app)**）是一款开源、100% 浏览器本地运行的截图套壳与在线图片处理工作台，现已覆盖 **30 个核心路由 / 120 个四语静态 SSG 页面**（`en` / `zh` / `ja` / `ko`）。所有样机渲染、在线图片拼接、HEIC/AVIF 解码、EXIF/GPS 体检清除、目标 KB 精准压缩、多页 A4 PDF 生成、截图打码与身份证水印均在浏览器本地内存中完成，零服务器上传，免登录注册，基础高清导出零水印。

### 完整功能一览（30 个专题页 / 120 条四语路由）

| 工具模块 | 专题页面 | 核心能力 | 导出与安全边界 |
| --- | --- | --- | --- |
| **截图套壳与本地打码** | `/zh`、`/zh/browser-mockup`、`/zh/iphone-mockup`、`/zh/ipad-mockup`、`/zh/watch-mockup`、`/zh/device-mockup`、`/zh/app-store-screenshots`、`/zh/redact-screenshot` | **13 款内置设备与浏览器样机**（Chrome、Safari、极简窗口、iPhone 16 Pro、Pixel 9、iPad、安卓平板、Apple Watch、Wear OS、无边框）；**3 秒本地截图打码**（模糊、马赛克、纯色实心遮盖、聚光灯高亮）；浅深色边框、阴影与渐变背景一键切换 | 2K 高清无水印 PNG，支持一键无损转入 Moklu Studio 多图层精修 |
| **在线图片拼接与多页 PDF** | `/zh/merge-images`、`/zh/combine-photos-side-by-side`、`/zh/stitch-images-vertically`、`/zh/stitch-screenshots`、`/zh/photo-collage-grid`、`/zh/merge-photos-to-pdf` | 横向并排、竖向长图（可选纯本地像素匹配智能长截图去重叠、固定顶/底栏裁剪与半透明重影接缝微调）、2–6 列宫格（`cover` / `contain`、`1:1`/`4:3`/`3:4`/自动）；按最小/最大/原尺寸对齐；拖拽排序、反转、单图 90° 旋转、描边边框（`0–24px`）、自定义取色器与本地 IndexedDB 草稿自动保存 | PNG、WebP、JPEG、**模式 A 多页 A4 / 自适应打印 PDF 1.4** 与 **模式 B 单页长图 PDF 1.4**（`50%–100%` 质量滑块）、一键复制剪贴板、多图层无损移交 Studio；8192px / 64MP 安全上限 |
| **本地压缩、HEIC/AVIF、目标 KB 与 EXIF 清除** | `/zh/compress-image`、`/zh/compress-image-to-200kb`、`/zh/heic-to-jpg`、`/zh/remove-exif`、`/zh/convert-image-format`、`/zh/png-to-webp` | **本地 HEIC/HEIF 与 AVIF 解码**（浏览器原生解码优先 + 按需本地 WASM 兜底，照片绝不上云）；**确定性目标 KB 二分查找压缩**（`100KB` / `200KB` / `500KB` / 自定义 KB，可选锁定原尺寸）；**零依赖二进制 EXIF/GPS 体检与清除**（支持 JPEG / PNG / WebP / HEIC）；实时体积对比 | 无元数据纯净 JPEG / WebP / PNG，单张保存或一键本地 ZIP 打包 |
| **轮播与九宫格切图** | `/zh/carousel-splitter`、`/zh/image-grid-splitter` | 小红书 `3:4` / Instagram `4:5` / `1:1` 无缝滑屏轮播切图，以及 `1–6` 行 × `1–6` 列自由宫格切图，实时叠加切割线 | 按序编号 PNG，本地一键打包 ZIP |
| **改尺寸、裁剪与加白边** | `/zh/resize-image`、`/zh/crop-image`、`/zh/add-border-to-photo` | 像素与百分比批量缩放、社媒比例裁剪，以及不裁剪原画面的留白加白边与圆角投影 | PNG / WebP / JPEG 或批量 ZIP |
| **纯离线身份证水印** | `/zh/id-card-watermark` | 严格按 ISO/IEC 7810 ID-1 物理尺寸（`85.6 × 53.98 mm`）排版至 A4 画布，自定义斜向防盗用途水印 | 打印级高清 A4 PNG，严格 CSP 保护，断网可用 |
| **Moklu Studio 与无头 CLI** | `/zh/studio`（含 `/zh/about`、`/zh/privacy`、`/zh/terms`） | 基于 Konva 的多图层画布编辑器，支持 13 款样机、品牌色板、排版标注、非破坏性打码图层、多页应用商店套图与 **Zero-Key 零密钥 Studio 多语言翻译**（复制粘贴 JSON 配合任意大模型本地回填） | 多画布高分辨率导出 + **Playwright 无头 CLI**（`cli/`） |

### 隐私架构与能力边界

- **100% 本地零上传**：所有快速工具均在浏览器内存、HTML5 Canvas 2D、`DataView` 二进制解析器与按需本地 WASM 解码器中执行，可在 DevTools Network 面板核验零上传，断网同样可用。
- **清晰透明的能力边界**：
  - PDF 导出支持 **模式 A 多页 A4 / 自适应打印 PDF 1.4**（一图一页）与 **模式 B 单页长图 PDF 1.4**，用于由图片生成 PDF，不用于合并已有的 PDF 文档。
  - 竖向拼接支持标准首尾相接及可选智能长截图去重叠、固定顶/底栏裁剪与半透明重影接缝微调（纯本地像素匹配），支持拼图多图层无损移交 Studio 二次编辑与本地 IndexedDB 草稿自动保存。
  - 拼图画布设置 `8192px / 64MP` 安全上限，超限时自动等比缩放并在界面明确提示。
- **信任与站点说明**：内置四语 `/about`、`/privacy`、`/terms` 与 `/llms.txt`。

---

## Quick Start & Development / 本地开发与构建

Requires Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

Verification and production SSG build (generates all 120 localized HTML routes, `sitemap.xml`, `robots.txt`, and `llms.txt`):

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Additional engineering documentation:
- [Engineering docs index](./docs/README.md)
- [Development plan](./docs/development-plan.md)
- [Benchmark plan](./docs/benchmark-plan.md)
- [Release checklist](./docs/release-checklist.md)

## Architecture & Attribution / 技术栈与开源致谢

- **Stack**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + Geist (self-hosted, OFL-1.1) + Konva 10 + Zustand 5 + JSZip 3 + Vitest 4 + Playwright.
- **License & Notices**: MIT License (see [`LICENSE`](./LICENSE) and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)).
- **Credit / 致谢**:
  - Moklu Studio is built on the MIT-licensed open-source project **[PixelDeck](https://github.com/Pr0xS/PixelDeck)**, retaining its original copyright and MIT license notice, combined with original Moklu quick image tools, browser frames, commercial foundation, and multilingual SSG/GEO pages.
  - Studio 编辑器基于 MIT 协议的开源项目 **[PixelDeck](https://github.com/Pr0xS/PixelDeck)**，保留其原有版权与 MIT 许可声明，并由 Moklu 独立新增纯本地图片快速工具、设备样机、本地隐私处理引擎与多语言 SSG/GEO 架构。

Website: [https://moklu.app](https://moklu.app)
