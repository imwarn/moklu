# Moklu

**Local-first browser mockup studio & online image toolkit | 纯本地浏览器截图套壳与在线图片拼接工具箱**

- Live site / 官方网站: [https://moklu.app/](https://moklu.app/)
- Chinese hub / 中文首页: [https://moklu.app/zh/](https://moklu.app/zh/)
- Online image merger / 在线图片拼接: [https://moklu.app/zh/merge-images/](https://moklu.app/zh/merge-images/) ([EN](https://moklu.app/merge-images/) · [JA](https://moklu.app/ja/merge-images/) · [KO](https://moklu.app/ko/merge-images/))
- Source code / 开源仓库: [https://github.com/imwarn/moklu](https://github.com/imwarn/moklu) (MIT License)

---

## English

Moklu is an open-source, 100% browser-local visual workbench at **[https://moklu.app](https://moklu.app)**. Every image operation runs directly inside your browser tab via HTML5 Canvas with zero server uploads, zero account walls, and zero forced watermarks on standard exports.

### Complete Feature Matrix

| Tool | Dedicated Routes | Key Capabilities | Output & Limits |
| --- | --- | --- | --- |
| **Online Image Merger** | `/merge-images`, `/combine-photos-side-by-side`, `/stitch-images-vertically`, `/photo-collage-grid`, `/merge-photos-to-pdf` | Horizontal, vertical (with optional 100% local pixel-matching smart long-screenshot overlap removal & fixed top/bottom bar trimming), and 2–6 column grid (`cover` / `contain`, `1:1`, `4:3`, `3:4`, `auto`); `match-min`, `match-max`, `original` (`start` / `center` / `end` alignment); drag-and-drop reorder, Reverse order, per-image 90° rotation; gap (`0–64px`), padding (`0–80px`), corner radius (`0–48px`), per-image borders (`0–24px`), custom color picker, local IndexedDB draft autosave | PNG, WebP, JPEG, single-page PDF 1.4 (`50%–100%` quality), 1-click Copy to Clipboard, lossless multi-layer Studio handoff; 8192px / 64MP auto-scaled ceiling |
| **Screenshot Mockups** | `/`, `/browser-mockup`, `/iphone-mockup`, `/device-mockup`, `/app-store-screenshots` | Chrome, Safari, and minimal browser windows; iPhone 16 Pro, Pixel 9, and App Store 9:16 templates; custom padding, shadows, and light/dark themes | High-res PNG + 1-click handoff to Moklu Studio |
| **Carousel & Grid Splitter** | `/carousel-splitter`, `/image-grid-splitter` | Seamless swipeable panorama slices (`4:5`, `3:4`, `1:1`) and custom matrix splits (`1–6` rows × `1–6` cols) with live cut-line overlay | Numbered PNG slices bundled as 1-click local ZIP |
| **Batch Compressor & Converter** | `/compress-image`, `/convert-image-format`, `/png-to-webp` | Client-side PNG, JPEG, and WebP compression and conversion with quality slider, optional max-width scaling, and before/after byte counters | Individual files or 1-click local ZIP |
| **Resize, Crop & Border Pad** | `/resize-image`, `/crop-image`, `/add-border-to-photo` | Exact pixel or `%` batch resizing, social ratio cropping (`1:1`, `4:5`, `3:4`, `16:9`), and uncropped gallery border padding | PNG, WebP, JPEG, or batch ZIP |
| **Offline ID Card Watermark** | `/id-card-watermark` | ISO/IEC 7810 ID-1 exact physical scale (`85.6 × 53.98 mm`) on A4 with customizable diagonal anti-fraud watermark text, angle, opacity, and density | Print-ready A4 PNG, 100% offline under strict CSP |
| **Moklu Studio** | `/studio` | Konva-powered multi-layer canvas editor with device/browser frames, brand kits, typography, shapes, templates, multi-slide App Store layouts, and localization | PNG / multi-slide exports + Playwright headless CLI |

### Privacy & Explicit Capability Boundaries

- **Zero server uploads**: Every quick tool executes in browser RAM using HTML5 Canvas 2D. Disconnect Wi-Fi after loading any tool page and it still works end to end.
- **Explicit boundaries**:
  - Single-page PDF export packages the merged image sheet into one PDF 1.4 page rather than merging multi-page PDF documents.
  - Vertical stitching defaults to clean edge-to-edge joining and provides optional smart long-screenshot overlap removal and fixed top/bottom bar trimming via 100% local pixel matching, plus lossless multi-layer handoff to Moklu Studio for further editing and local browser IndexedDB draft autosave.
  - Canvas outputs enforce an `8192px / 64MP` safety ceiling with automatic proportional scaling and a visible scaled badge.
- **Trust & compliance pages**: `/about`, `/privacy`, `/terms` (available in EN, ZH, JA, KO) and `/llms.txt`.

---

## 简体中文

Moklu（**[https://moklu.app](https://moklu.app)**）是一款开源、100% 浏览器本地运行的截图套壳与在线图片处理工具箱。全部像素处理均基于本机 HTML5 Canvas 完成，不上传任何服务器，免登录注册，基础高清导出零水印。

### 完整功能一览

| 工具模块 | 专题页面 | 核心能力 | 导出与安全边界 |
| --- | --- | --- | --- |
| **在线图片拼接** | `/zh/merge-images`、`/zh/combine-photos-side-by-side`、`/zh/stitch-images-vertically`、`/zh/photo-collage-grid`、`/zh/merge-photos-to-pdf` | 横向并排、竖向长图（可选纯本地像素匹配智能去重叠与固定顶/底栏裁剪）、2–6 列宫格（`cover` 铺满 / `contain` 完整、`1:1`/`4:3`/`3:4`/自动）；按最小/最大/原尺寸对齐（支持靠顶/左、居中、靠底/右）；拖拽排序、一键反转顺序、单图 90° 旋转；间距（`0–64px`）、外边距（`0–80px`）、圆角（`0–48px`）、单图描边边框（`0–24px`）、自定义取色器与本地 IndexedDB 草稿自动保存 | PNG、WebP、JPEG、单页 PDF 1.4（`50%–100%` 质量滑块）、一键复制到剪贴板、多图层无损移交 Studio；8192px / 64MP 安全上限自动等比缩放并提示 |
| **截图套壳与样机** | `/zh`、`/zh/browser-mockup`、`/zh/iphone-mockup`、`/zh/device-mockup`、`/zh/app-store-screenshots` | Chrome / Safari / 极简浏览器窗口、iPhone 16 Pro、Pixel 9 与应用商店 9:16 竖屏样机；浅深色边框、阴影与背景一键切换 | 高清 PNG 导出，支持一键转入 Studio 多图层精修 |
| **轮播与九宫格切图** | `/zh/carousel-splitter`、`/zh/image-grid-splitter` | 小红书 `3:4` / Instagram `4:5` / `1:1` 无缝滑屏轮播切图，以及 `1–6` 行 × `1–6` 列自由宫格切图，实时叠加切割线 | 按序编号 PNG，本地一键打包 ZIP |
| **批量压缩与格式转换** | `/zh/compress-image`、`/zh/convert-image-format`、`/zh/png-to-webp` | PNG / JPEG / WebP 本地批量压缩与互转，提供质量滑块、最大宽度限制及压缩前后体积实时对比 | 单张下载或批量本地 ZIP 打包 |
| **改尺寸、裁剪与加白边** | `/zh/resize-image`、`/zh/crop-image`、`/zh/add-border-to-photo` | 像素与百分比批量缩放、社媒比例裁剪，以及不裁剪原画面的留白加白边与圆角投影 | PNG / WebP / JPEG 或批量 ZIP |
| **纯离线身份证水印** | `/zh/id-card-watermark` | 严格按 ISO/IEC 7810 ID-1 物理尺寸（`85.6 × 53.98 mm`）排版至 A4 画布，自定义斜向防盗用途水印 | 打印级高清 A4 PNG，严格 CSP 保护，断网可用 |
| **Moklu Studio** | `/zh/studio` | 基于 Konva 的多图层画布编辑器，支持品牌色板、排版标注、模板复用、多页应用商店套图与多语言本地化 | 多画布高分辨率导出 + Playwright 无头 CLI |

### 隐私架构与能力边界

- **100% 本地零上传**：所有快速工具均在浏览器内存与 Canvas 2D 中执行，可在 DevTools Network 面板核验零上传，断网同样可用。
- **清晰透明的能力边界**：
  - PDF 导出用于将拼接成品封装为标准单页 PDF 1.4 文件，不用于多页 PDF 文档合并。
  - 竖向拼接提供可选的智能长截图去重叠与固定顶/底栏裁剪（纯本地像素匹配），支持拼图多图层无损移交 Studio 二次编辑与本地 IndexedDB 草稿自动保存。
  - 拼图画布设置 `8192px / 64MP` 安全上限，超限时自动等比缩放并在界面明确提示。
- **信任与站点说明**：内置四语 `/about`、`/privacy`、`/terms` 与 `/llms.txt`。

---

## Quick Start & Development / 本地开发与构建

Requires Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

Verification and production SSG build (generates all 92 localized HTML routes, `sitemap.xml`, `robots.txt`, and `llms.txt`):

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
  - Studio 编辑器基于 MIT 协议的开源项目 **[PixelDeck](https://github.com/Pr0xS/PixelDeck)**，保留其原有版权与 MIT 许可声明，并由 Moklu 独立新增纯本地六大图片快速工具、浏览器样机与多语言 SSG/GEO 架构。

Website: [https://moklu.app](https://moklu.app)
