/**
 * [INPUT]: depends on LocaleBundle type from ../types.ts; depends on ZH_TOOL_ROUTES from ./zhTools.ts
 * [OUTPUT]: exports ZH_LOCALE complete Simplified Chinese UI labels and 19 intent-specific route copy entries
 * [POS]: Simplified Chinese (`/zh/...`) language pack within src/seo/locales, loaded by src/seo/i18n.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle } from '../types.ts'
import { ZH_TOOL_ROUTES } from './zhTools.ts'

export const ZH_LOCALE: LocaleBundle = {
  code: 'zh',
  nativeName: '简体中文',
  shortLabel: '中文',
  ogLocale: 'zh_CN',
  ui: {
    brandName: 'Moklu',
    brandTagline: '纯本地截图套壳与图片工作台',
    skipToContent: '跳至主要内容',
    openStudio: '进入 Studio 精修',
    openStudioShort: 'Studio',
    openInStudioCta: '一键转入 Studio 多图层精修',
    proBadge: 'PRO',
    proUpgrade: 'Moklu Pro',
    proActive: 'Pro 已启用',
    themeLight: '浅色',
    themeDark: '深色',
    toggleThemeAria: '切换浅色与深色主题',
    languageLabel: '切换语言',
    menuToggleAria: '展开或收起导航菜单',
    navCategories: {
      mockup: '截图套壳',
      merge: '拼图合并',
      split: '切图宫格',
      compress: '压缩转换',
      resize: '缩放裁剪',
      'id-card': '证件水印',
    },
    dropzoneTitle: '拖拽图片到此处，或直接 Ctrl/Cmd+V 粘贴',
    dropzoneSubtitle: '100% 浏览器本地处理，不上传任何服务器',
    privacyBadge: '100% 浏览器本地计算 · 零上传',
    privacyBannerTitle: '隐私源自架构：你的图片从未离开过本机设备',
    privacyBannerDescription:
      '所有套壳渲染、拼图、切图、格式压缩与身份证 A4 防盗水印均基于浏览器 HTML5 Canvas 本地完成。即使断开网络，全部功能依然可用。',
    privacyProofPoints: [
      '零服务器上传，无云端排队等待',
      '即时导出高清 PNG / WebP / JPEG 与 ZIP',
      '一键无损转入 Moklu Studio 多图层画布',
    ],
    howToHeading: '三步完成本地处理',
    howToSubheading: '无需注册账号，无需等待上传，打开页面即刻出图。',
    highlightsHeading: '专为真实高频场景设计',
    highlightsSubheading: '每个工具页面都预设了贴合该搜索场景的比例、参数与导出规范。',
    relatedToolsHeading: '继续使用相关工具',
    relatedToolsSubheading: '串联上下游图片处理步骤，或直接进入 Studio 进行精细排版。',
    directoryHeading: 'Moklu 全部本地图片工具',
    directorySubheading: '以下全部工具均 100% 浏览器端运行，基础高清导出无强制水印。',
    faqHeading: '常见问题解答',
    faqSubheading: '关于本地隐私保护、输出画质、支持格式与 Studio 精修的说明。',
    studioBannerTitle: '需要自定义大字标题、标注箭头或多页应用商店套图？',
    studioBannerDescription:
      '将当前作品一键送入 Moklu Studio —— 完整的 Konva 多图层画布编辑器，支持多层阴影、网格渐变、文字标注与多语言套图管理。',
    studioBannerAction: '启动 Moklu Studio',
    footerDescription: '开源、本地优先的截图美化与浏览器图片工具集。无追踪、无文件上传。',
    footerGroups: {
      mockups: '套壳与发布视觉',
      mergeSplit: '拼图与切图',
      optimizeResize: '压缩与尺寸调整',
      documentsStudio: '证件与 Studio',
    },
    footerLanguages: '多语言版本',
    footerOpenSource: 'GitHub 开源仓库',
    footerLocalFirstNote: '全部像素处理均在本地 HTML5 Canvas 完成',
    footerCopyright: 'Moklu · 开源视觉工具工作台',
  },
  routes: {
    '': {
      navLabel: '工具首页',
      title: 'Moklu — 免费纯本地截图套壳、拼图切图与证件水印工具箱',
      metaDescription:
        '在线浏览器与 iPhone 16 Pro 截图套壳、长图拼接、小红书轮播切图、批量压缩转 WebP、身份证 A4 防盗水印，100% 浏览器本地处理不上传服务器。',
      badge: '100% 浏览器本地 · 不上传服务器',
      h1: '截图美化与纯本地图片处理工作台',
      subtitle:
        '拖入或粘贴图片即可套上 Chrome / iPhone 16 Pro 边框、拼接长图、切分小红书无缝轮播与九宫格、压缩转换格式或制作身份证 A4 防盗水印 —— 一键转入 Studio 精修。',
      steps: [
        {
          title: '选择工具或直接粘贴截图',
          description: '按 Ctrl/Cmd+V 粘贴剪贴板截图，或直接拖入本地 PNG、JPEG、WebP 图片文件。',
        },
        {
          title: '实时调节预设样式与参数',
          description: '在浏览器本地即时切换设备外框、拼图方向、切图比例、压缩质量或证件防盗水印。',
        },
        {
          title: '直接导出或一键进 Studio 精修',
          description: '立刻下载无水印高清成品，或点击“在 Studio 画布精修”继续叠加标题、标注与多页布局。',
        },
      ],
      highlights: [
        {
          title: '产品发布级截图套壳',
          description: '几秒钟把原始后台或 App 截图变成质感出众的 Chrome、Safari、iPhone 与 Pixel 展示图。',
        },
        {
          title: '覆盖日常高频图片刚需',
          description: '集成横向对比拼图、竖向长截图、九宫格切图、PNG 转 WebP、无裁剪加白边与身份证 A4 水印。',
        },
        {
          title: '轻工具无缝衔接专业画布',
          description: '先在首屏快速出图，需要加文案、阴影或多语言套图时一键带入 Moklu Studio 继续编辑。',
        },
      ],
      faqs: [
        {
          question: 'Moklu 会把我的截图或照片上传到服务器吗？',
          answer: '绝对不会。所有工具均基于浏览器本地 HTML5 Canvas 与 Blob API 执行，图片数据全程留在你的设备内存中。',
        },
        {
          question: '基础导出免费吗？会强行加网站水印吗？',
          answer: '全部核心套壳、拼图、切图、压缩、尺寸调整与证件水印功能均可免费使用，导出图片不带任何强制品牌水印。',
        },
        {
          question: '快捷工作台和 Moklu Studio 有什么区别？',
          answer: '快捷工作台打开即用，聚焦单一高频任务秒出图；Moklu Studio 则是完整的多图层画布编辑器，适合制作多页应用商店图与复杂宣传图。',
        },
        {
          question: '支持哪些图片格式与浏览器？',
          answer: '支持读取与导出 PNG、JPEG、WebP，兼容桌面及移动端最新版 Chrome、Edge、Safari 与 Firefox。',
        },
      ],
    },
    studio: {
      navLabel: 'Moklu Studio',
      title: 'Moklu Studio — 多图层截图美化与套壳画布编辑器',
      metaDescription:
        '纯本地多图层 Konva 画布编辑器：自由编排浏览器与手机样机、大字标题、柔光渐变、阴影标注与多语言应用商店套图。',
      badge: '完整多图层画布编辑器',
      h1: '多图层截图套壳与产品视觉 Studio',
      subtitle:
        '在浏览器本地自由组合设备样机、标题文案、标签徽章、柔光背景与多语言幻灯片组，自动本地保存，随时导出高清套图。',
      steps: [
        {
          title: '选择画布模板或从快捷工具转入',
          description: '可直接选用应用商店、社媒海报或宽屏模板，也能把快捷工作台的作品一键带入编辑。',
        },
        {
          title: '编排多图层样机、文字与阴影',
          description: '自由拖拽 Chrome、Safari、iPhone、Pixel 样机，叠加中英日韩标题、形状与柔和投影。',
        },
        {
          title: '高清导出单页或多语言套图',
          description: '在本地渲染并导出单张 PNG/WebP 或完整的多页打包 ZIP。',
        },
      ],
      highlights: [
        {
          title: '非破坏性图层管理',
          description: '独立调整背景、设备外框、图片与文字的层级、锁定状态、透明度与历史撤销。',
        },
        {
          title: '多语言套图同步排版',
          description: '内置本地化视图，一套视觉布局同时维护中、英、日、韩等不同语言的应用商店文案。',
        },
        {
          title: '本地优先工程持久化',
          description: '项目数据保存在浏览器本地存储中，支持工程文件备份导出，未发布产品稿绝对保密。',
        },
      ],
      faqs: [
        {
          question: '可以把快捷工作台刚做好的图直接送到 Studio 继续加字吗？',
          answer: '可以。每个快捷工具都提供“在 Studio 画布精修”按钮，点击后会自动把图片和样机载入到可编辑图层中。',
        },
        {
          question: 'Studio 里的工程文件存在哪里？',
          answer: '所有工程和素材均保存在你本地浏览器的 IndexedDB 与 localStorage 中，不依赖云端账号。',
        },
        {
          question: '支持自定义画布像素尺寸吗？',
          answer: '支持。除了常见 16:9、4:5、9:16 和应用商店预设外，可输入任意自定义宽高像素。',
        },
        {
          question: '误操作了可以撤销或导出工程备份吗？',
          answer: '支持多步撤销/重做，并可随时导出便携式工程备份文件以便跨设备恢复。',
        },
      ],
    },
    'browser-mockup': {
      navLabel: '浏览器样机',
      title: '免费浏览器截图套壳生成器（Chrome / Safari 窗口）— Moklu',
      metaDescription:
        '一键给网页或后台截图套上精致 Chrome、Safari 或极简 macOS 窗口外框，自定义渐变背景与阴影。100% 浏览器本地处理，零上传。',
      badge: 'Chrome / Safari 窗口套壳',
      h1: '浏览器截图套壳生成器',
      subtitle:
        '为 SaaS 后台、官网着陆页或更新日志截图套上清爽的 Chrome、Safari 或极简窗口边框，搭配柔和背景渐变与阴影，全部在浏览器本地渲染。',
      steps: [
        {
          title: '粘贴或拖入网页截图',
          description: '直接按 Cmd/Ctrl+V 粘贴刚截好的产品页面，或拖入本地 PNG/WebP 截图文件。',
        },
        {
          title: '选择 Chrome、Safari 或极简窗口风格',
          description: '按发布渠道切换 16:9 宽屏或 16:10 比例，挑选柔和渐变背景与画面填充方式。',
        },
        {
          title: '下载高清图或转入 Studio 加标注',
          description: '秒出高清无水印 PNG，也可一键转入 Studio 添加功能标题与高亮箭头。',
        },
      ],
      highlights: [
        {
          title: '适配更新日志与社区发布',
          description: '规整的 16:9 宽屏留白隐藏杂乱桌面边缘，让产品文档、公众号配图与社区发帖瞬间提质。',
        },
        {
          title: '矢量级清晰窗口栏',
          description: '红黄绿窗口按钮、地址栏圆角与阴影在高分屏导出时依旧锐利无锯齿。',
        },
        {
          title: '内部系统截图完全保密',
          description: '纯本地 Canvas 合成，未上线功能界面与内部数据看板绝不经过任何第三方服务器。',
        },
      ],
      faqs: [
        {
          question: '内置了哪几种浏览器窗口样式？',
          answer: '快捷工作台支持一键切换 Chrome 浏览器、Safari 浏览器以及极简无地址栏窗口三种样式。',
        },
        {
          question: '写技术文章或发公众号推荐用什么画布比例？',
          answer: '默认 16:9（1600×900）和 16:10（1600×1000）非常适合技术博客、文档站、X/Twitter 和 Product Hunt 展示。',
        },
        {
          question: '可以自定义地址栏文字或加上文字说明吗？',
          answer: '点击“在 Studio 画布精修”即可修改窗口栏细节，并在独立图层上自由叠加标题、箭头和徽章。',
        },
        {
          question: '网页截图会被保存或用于训练吗？',
          answer: '绝不会。渲染过程完全在你的本地浏览器内存中进行，关闭页面即清除。',
        },
      ],
    },
    'iphone-mockup': {
      navLabel: 'iPhone 样机',
      title: '免费 iPhone 16 Pro 手机套壳截图生成器 — Moklu',
      metaDescription:
        '把手机 App 截图一键套入高质感 iPhone 16 Pro 机身外框，搭配柔和渐变背景与投影，100% 浏览器本地运行，支持一键进 Studio 精修。',
      badge: 'iPhone 16 Pro 质感机身',
      h1: 'iPhone 16 Pro 手机截图套壳生成器',
      subtitle:
        '为 iOS 应用截图快速套上精准比例的 iPhone 16 Pro 外框，自动匹配精致圆角、柔光背景与自然投影，无需上传云端。',
      steps: [
        {
          title: '导入或粘贴手机应用截图',
          description: '拖入真机截图或模拟器截图，也可先点击“体验示例截图”零门槛预览效果。',
        },
        {
          title: '切换竖版比例、背景主题与适配模式',
          description: '在 4:5、9:16、1:1 等画布比例间自由切换，灵活调节铺满或完整显示。',
        },
        {
          title: '导出高清 PNG 或进 Studio 排标题',
          description: '本地即刻导出成品图，或转入 Studio 为手机样机配上醒目卖点大字。',
        },
      ],
      highlights: [
        {
          title: '精准贴合新款机身比例',
          description: '屏幕圆角与顶部灵动岛比例贴合真实 iPhone 16 Pro 观感，告别廉价拉伸变形。',
        },
        {
          title: '一键适配多平台封面尺寸',
          description: '轻松输出小红书竖版、Instagram 4:5、短视频 9:16 或官网横版产品展示图。',
        },
        {
          title: '内测版本截图安全无忧',
          description: 'TestFlight 阶段或保密项目截图纯本地渲染，不经过任何外部服务器。',
        },
      ],
      faqs: [
        {
          question: '什么尺寸的截图最适合 iPhone 16 Pro 样机？',
          answer: '标准 iPhone 竖屏截图（如 1206×2622 或 1290×2796）效果最佳，其他比例的手机截图也可通过 Cover 模式自动居中对齐。',
        },
        {
          question: '可以在一张图里放两台 iPhone 或倾斜摆放吗？',
          answer: '可以。点击“在 Studio 画布精修”即可复制多台设备图层、调整旋转角度并自由组合构图。',
        },
        {
          question: '导出的 iPhone 套壳图有水印吗？',
          answer: '没有。基础高清 PNG 导出完全干净，无任何平台角标。',
        },
        {
          question: '可以用于商业官网、PPT 和应用上架吗？',
          answer: '可以。你基于自有截图生成的样机图可自由用于商业宣传、融资路演和商店上架。',
        },
      ],
    },
    'device-mockup': {
      navLabel: '多设备样机',
      title: '多设备样机生成器（Pixel / iPhone / 浏览器）— Moklu',
      metaDescription:
        '一站式生成 Google Pixel 9、iPhone 16 Pro 与桌面浏览器样机展示图，统一光影与配色风格，100% 本地浏览器渲染。',
      badge: 'Pixel 9 · iPhone · 桌面窗口',
      h1: '跨平台多设备样机生成器',
      subtitle:
        '为 Android、iOS 与响应式 Web 应用提供统一质感的硬件与窗口样机，一键切换 Pixel 9、iPhone 与浏览器边框，全程本地渲染。',
      steps: [
        {
          title: '上传 Android、iOS 或网页截图',
          description: '拖入任意端截图，切换不同设备外框时已上传的画面会自动保留无需重传。',
        },
        {
          title: '统一画布尺寸与光影氛围',
          description: '使用同一套柔和极光、午夜深蓝或暖纸色调，确保跨端宣传图风格高度一致。',
        },
        {
          title: '导出单图或在 Studio 组合多端',
          description: '立即导出高清 PNG，或进入 Studio 把桌面端与移动端样机拼在同一张头图中。',
        },
      ],
      highlights: [
        {
          title: '原生支持 Android Pixel 9 样机',
          description: '让 Google Play 与安卓独立应用也能拥有与 iOS 同样高级的硬件展示框。',
        },
        {
          title: '全平台视觉语言统一',
          description: '共享一致的阴影深度、留白比例与渐变配色，告别拼凑感。',
        },
        {
          title: '本地 60fps 实时预览',
          description: '告别云端样机网站漫长的排队渲染，参数调整即刻可见。',
        },
      ],
      faqs: [
        {
          question: '支持哪些设备与窗口模型？',
          answer: '目前内置 Google Pixel 9、iPhone 16 Pro、Chrome 浏览器、Safari 浏览器和极简窗口五种常用样机。',
        },
        {
          question: '怎么把手机版和网页版截图放在同一张宣传图里？',
          answer: '点击“在 Studio 画布精修”，即可在多图层画布中同时添加多个不同设备样机并排展示。',
        },
        {
          question: '切换样机模型需要重新上传截图吗？',
          answer: '不需要。当前截图会自动绑定到新的设备屏幕上，方便快速对比视觉效果。',
        },
        {
          question: '图片会上传到云端生成样机吗？',
          answer: '不会，所有合成计算均在本地浏览器中独立完成。',
        },
      ],
    },
    'app-store-screenshots': {
      navLabel: '应用商店截图',
      title: 'App Store 与 Google Play 应用商店截图生成器（9:16）— Moklu',
      metaDescription:
        '快速制作高转化率 9:16 应用商店宣传截图，内置 iPhone 16 Pro 样机与渐变背景，一键转入 Studio 排版多页卖点文案与多语言本地化。',
      badge: '9:16 商店上架竖版预设',
      h1: 'App Store & 应用商店宣传截图生成器',
      subtitle:
        '默认锁定 9:16 商店竖版比例与 iPhone 16 Pro 机身，几秒生成清爽底图，并可一键送入 Moklu Studio 批量制作多页标题与多语言商店套图。',
      steps: [
        {
          title: '放入核心功能页面截图',
          description: '拖入你的 App 界面截图，页面已默认配置好适合应用商店展示的 9:16 竖屏比例。',
        },
        {
          title: '挑选高对比度背景主题',
          description: '选用柔和极光、深邃午夜或温润纸感背景，让你的 App 在搜索结果中脱颖而出。',
        },
        {
          title: '直接导出或转入 Studio 做全套多页图',
          description: '单张可直接下载，需要大字卖点标题和多语言批量套图时一键进入 Studio。',
        },
      ],
      highlights: [
        {
          title: '开箱即用的 9:16 竖版规范',
          description: '无需反复查尺寸参数，默认 1080×1920 竖屏构图直接贴合主流应用商店比例。',
        },
        {
          title: '直通 Studio 多语言商店工作流',
          description: '转入 Studio 后可一套版式维护中、英、日、韩多地区上架文案，大幅提效。',
        },
        {
          title: '上架前新版本零泄露风险',
          description: '所有设计均在本地设备完成，未公开的新版本界面不会外泄到第三方平台。',
        },
      ],
      faqs: [
        {
          question: '怎么在手机样机上方加上醒目的中文/英文功能标题？',
          answer: '点击“在 Studio 画布精修”即可将当前构图导入多图层画布，自由添加主副标题、角标和连续多页幻灯片。',
        },
        {
          question: '同时做苹果 App Store 和 Google Play 上架图方便吗？',
          answer: '非常方便，保留同一背景配色，只需在 iPhone 16 Pro 与 Pixel 9 样机间一键切换即可。',
        },
        {
          question: '支持多语言批量制作和导出吗？',
          answer: 'Moklu Studio 内置多语言本地化视图，可集中管理不同地区的标题文案并按语言导出。',
        },
        {
          question: '导出图片会被压缩变模糊吗？',
          answer: '不会，支持无损高清 PNG 导出，确保界面文字与图标边缘清晰锐利。',
        },
      ],
    },
    'merge-images': {
      navLabel: '图片合并拼接',
      title: '免费在线拼图合并工具（横向对比 / 竖向长图 / 宫格）— Moklu',
      metaDescription:
        '浏览器本地合并多张照片或截图：支持左右拼接、竖向长截图和自由网格拼图，自定义间距、圆角与背景色，不上传任何图片。',
      badge: '横向 · 竖向 · 宫格多图合并',
      h1: '多图拼接与合并工具',
      subtitle:
        '拖入或连续粘贴多张图片，自由切换横向对比、竖向长图或宫格拼图，支持自动对齐尺寸、调节间距圆角，100% 浏览器本地瞬间合成。',
      steps: [
        {
          title: '添加并调整多张图片顺序',
          description: '批量选图或连续 Ctrl/Cmd+V 粘贴，自由调整图片先后排列顺序。',
        },
        {
          title: '选择拼接方向与外观细节',
          description: '切换横向、竖向或网格拼图，调节图片间距、外边距、圆角大小与背景色。',
        },
        {
          title: '导出合成大图或进 Studio 加注',
          description: '本地下载高清 PNG 或轻量 WebP，也可一键转入 Studio 添加对比标签与箭头。',
        },
      ],
      highlights: [
        {
          title: '异形分辨率智能对齐',
          description: '横向拼接自动统一高度、竖向拼接自动统一宽度，不同来源的截图也能严丝合缝。',
        },
        {
          title: '留白与圆角一眼精致',
          description: '可设 0px 无缝拼合，也可加白边圆角做出杂志风产品合集图。',
        },
        {
          title: '聊天记录与私密照绝对安全',
          description: '无需上传到任何云端拼图站点，全部像素合成就在当前浏览器标签页内完成。',
        },
      ],
      faqs: [
        {
          question: '一次可以合并多少张图片？',
          answer: '支持同时添加多张图片批量拼接，内置智能画布尺寸上限保护，防止浏览器内存溢出。',
        },
        {
          question: '两张图原本分辨率不一样，拼出来会参差不齐吗？',
          answer: '不会。系统提供自动等高/等宽对齐选项，能把不同尺寸的图片等比缩放后整齐拼合。',
        },
        {
          question: '拼完之后想加上“改造前/改造后”文字标签怎么办？',
          answer: '点击“在 Studio 画布精修”即可把拼好的成品图直接送入画布，自由加字、加边框和水印。',
        },
        {
          question: '拼接后的图片会被压缩画质吗？',
          answer: '导出 PNG 时完全无损保留清晰度；若需控制体积发社交平台，也可切换为高画质 WebP。',
        },
      ],
    },
    'combine-photos-side-by-side': {
      navLabel: '左右对比拼图',
      title: '左右拼图工具：两张照片横向并排合并 — Moklu',
      metaDescription:
        '把两张或多张照片左右横向并排拼成对比图，自动等高对齐，支持留白间隔与圆角，100% 浏览器本地合成不上传。',
      badge: '横向并排对比预设',
      h1: '照片左右并排拼图工具',
      subtitle:
        '专为 Before/After 前后对比、界面改版评审与双图展示预设横向模式，自动对齐画面高度，自定义分割间距与边框背景。',
      steps: [
        {
          title: '放入对比的左右图片',
          description: '上传或粘贴两张及以上图片，确认从左到右的排列顺序。',
        },
        {
          title: '调节间隔宽度、外边距与圆角',
          description: '设置洁白或深色分隔线，控制圆角弧度，让双图对比一目了然。',
        },
        {
          title: '下载对比图或进 Studio 加标注',
          description: '本地即刻导出 PNG/WebP，或一键转入 Studio 添加“改版前 / 改版后”醒目标签。',
        },
      ],
      highlights: [
        {
          title: '视觉对比一眼清晰',
          description: '非常适合修图前后对比、UI 设计稿走查、穿搭对比与产品细节并排展示。',
        },
        {
          title: '等比对齐不裁切主体',
          description: '不同机型拍出的照片自动按统一高度等比缩放，完整保留画面左右内容。',
        },
        {
          title: '支持两张及多张横排长卷',
          description: '不仅限于双图对比，3 张、4 张连拍同样可以整齐横向排开。',
        },
      ],
      faqs: [
        {
          question: '可以并排拼 3 张或 4 张照片吗？',
          answer: '可以。横向模式支持 2 张及以上任意数量的图片按顺序水平排布。',
        },
        {
          question: '左右拼图会自动把我的照片裁掉一部分吗？',
          answer: '不会。横向并排采用等比缩放对齐高度，完整保留每张原图内容不做裁剪。',
        },
        {
          question: '怎么在两张图中间加一条干净的白色分隔线？',
          answer: '将背景色设为白色，再适当调大“图片间距”与“外边距”即可生成清爽白边分隔。',
        },
        {
          question: '私人对比照在这里拼安全吗？',
          answer: '完全安全，整个合成过程 100% 在本机浏览器执行，不会上传到任何服务器。',
        },
      ],
    },
    'stitch-images-vertically': {
      navLabel: '竖向长图拼接',
      title: '免费竖向长截图拼接工具（聊天记录 / 网页长图）— Moklu',
      metaDescription:
        '把多张手机截图、微信聊天记录、账单或教程步骤竖向无缝拼成一张高清长图，自动统一宽度，100% 浏览器本地处理不上传。',
      badge: '竖向长截图无缝拼接',
      h1: '竖向长图与聊天记录拼接工具',
      subtitle:
        '将连续截屏的聊天记录、商品详情、长文档或操作步骤从上到下整齐拼接，支持 0 像素无缝衔接与自动等宽对齐，全程纯本地保护隐私。',
      steps: [
        {
          title: '按阅读顺序导入多张截图',
          description: '拖入或粘贴多张截屏，上下微调顺序确保内容衔接自然。',
        },
        {
          title: '选择 0px 无缝拼或卡片留白',
          description: '拼接聊天记录可将间距设为 0 实现无缝长图；做图文教程可开启圆角与柔和底色。',
        },
        {
          title: '本地导出清晰竖版长图',
          description: '一键保存高清 PNG/WebP，长图文字依然清晰可读，全程零上传。',
        },
      ],
      highlights: [
        {
          title: '私密聊天与账单零风险',
          description: '拼接微信对话、报销凭证或内部沟通截图时，数据绝不离开你的电脑或手机浏览器。',
        },
        {
          title: '自动统一宽度不歪斜',
          description: '即使混入了不同设备的截图，也会自动按统一列宽等比缩放对齐。',
        },
        {
          title: '超长画布安全防崩溃',
          description: '内置高分辨率保护机制，在保证字体清晰的同时避免浏览器内存溢出。',
        },
      ],
      faqs: [
        {
          question: '怎么把多张截图拼成完全没有缝隙的长图？',
          answer: '将图片间距、外边距和圆角全部调为 0，即可得到严丝合缝的连续长截图。',
        },
        {
          question: '电脑截图和手机截图能竖向拼在一起吗？',
          answer: '可以。竖向模式支持等宽归一化，自动把不同宽度的截图对齐到同一宽度。',
        },
        {
          question: '文字很多的长截图导出 PNG 还是 WebP 更好？',
          answer: '需要极致清晰文字推荐 PNG；如果要在微信或网页快速分享、担心体积过大，可选高画质 WebP。',
        },
        {
          question: '拼完长图后怎么给隐私信息打码或画红框？',
          answer: '点击“在 Studio 画布精修”即可用形状遮挡隐私文字，并添加重点标注框。',
        },
      ],
    },
    'photo-collage-grid': {
      navLabel: '宫格拼图',
      title: '免费宫格拼图生成器（四宫格 / 九宫格 / 自定义列数）— Moklu',
      metaDescription:
        '一键将多张照片排成整齐的 2×2 四宫格、3×3 九宫格或自定义列数拼图，支持比例裁剪、圆角与留白背景，100% 浏览器本地完成。',
      badge: '自定义列数宫格拼图',
      h1: '多图网格与宫格拼图生成器',
      subtitle:
        '把旅行照片、美食合集、产品多角度图或 UI 界面一键排成规整的 2×2、3×3 或自定义多列网格拼图，间距严密对称，纯本地秒出图。',
      steps: [
        {
          title: '批量添加照片并排序',
          description: '导入 4 张、6 张、9 张或更多图片，按画面主次调整各格子位置。',
        },
        {
          title: '设定列数、格子比例与圆角间距',
          description: '支持 2 到 6 列自由调节，切换 1:1、4:3、3:4 格子比例以及铺满/完整显示模式。',
        },
        {
          title: '下载高清拼图或进 Studio 排版',
          description: '立刻保存无水印高清拼图，或送入 Studio 加上封面大字和日期角标。',
        },
      ],
      highlights: [
        {
          title: '像素级对称网格',
          description: '每个格子的边距、间隔和圆角完全一致，比手动在修图软件里拖拽精准得多。',
        },
        {
          title: '支持铺满裁剪与完整留白',
          description: '人像与风景适合 Cover 铺满更有杂志感，界面截图适合 Contain 完整展示不截断。',
        },
        {
          title: '无会员弹窗与强制水印',
          description: '打开网页就能免费做干净的四宫格和九宫格拼图，不打断创作节奏。',
        },
      ],
      faqs: [
        {
          question: '支持做 2×2 四宫格和 3×3 九宫格拼图吗？',
          answer: '支持。列数可从 2 列调到 6 列，放 4 张设 2 列即为四宫格，放 9 张设 3 列即为标准九宫格。',
        },
        {
          question: '怎样避免宫格里的人物头部或文字被裁掉？',
          answer: '可将填充模式切换为“完整显示（Contain）”，或选择更接近原图形状的 4:3 / 3:4 格子比例。',
        },
        {
          question: '可以更换拼图底板的颜色吗？',
          answer: '可以。支持纯白、深炭黑、柔和灰或自定义色盘作为拼图底色。',
        },
        {
          question: '制作拼图会上传我的相册照片吗？',
          answer: '不会，所有照片只在你的设备浏览器内存中合成。',
        },
      ],
    },
    ...ZH_TOOL_ROUTES,
  },
}
