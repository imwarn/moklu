/**
 * [INPUT]: depends on GrowthRouteSlug and RouteCopy types from ../types.ts
 * [OUTPUT]: exports ZH_GROWTH_ROUTES containing Simplified Chinese SEO copy for the 9 high-intent growth slugs (ipad-mockup, watch-mockup, stitch-screenshots, heic-to-jpg, remove-exif, compress-image-to-200kb, redact-screenshot, annotate-image, draw-on-image)
 * [POS]: growth route-copy chunk for zh within src/seo/locales, merged into ZH_LOCALE by ./zh.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { GrowthRouteSlug, RouteCopy } from '../types.ts'

export const ZH_GROWTH_ROUTES: Record<GrowthRouteSlug, RouteCopy> = {
  'ipad-mockup': {
    navLabel: 'iPad 平板样机',
    title: '免费 iPad Pro 13 平板截图套壳生成器（纯本地）| Moklu',
    metaDescription:
      '为 iPadOS 应用、数据看板与平板笔记截图一键套上 iPad Pro 13 或安卓平板外框，搭配柔和渐变与阴影。100% 浏览器本地渲染，零上传无水印。',
    badge: 'iPad Pro 13 · 安卓平板样机',
    h1: 'iPad Pro 13 与平板截图套壳生成器',
    subtitle:
      '将 iPadOS 分屏界面、看板产品图或电子手账截图放进精致的 iPad Pro 13 或安卓平板外框中，自定义留白、背景渐变与投影，全程浏览器本地渲染。',
    steps: [
      {
        title: '粘贴或拖入平板应用截图',
        description: '使用 Cmd/Ctrl+V 粘贴剪贴板截图，或拖入 iPadOS 模拟器、真机或安卓平板截图文件。',
      },
      {
        title: '切换 iPad Pro 13 与安卓平板边框',
        description: '自由切换横屏或竖屏画布比例，微调圆角、内边距、柔和投影以及极光/午夜/暖纸渐变背景。',
      },
      {
        title: '无水印下载或转入 Studio 组合多端',
        description: '即刻导出高清 2K PNG，或一键送入 Moklu Studio 与 iPhone、桌面浏览器同屏排版。',
      },
    ],
    highlights: [
      {
        title: '精准还原 13 英寸超窄边框',
        description: '贴合新款 iPad Pro 13 与安卓平板等距边框比例，完整保留顶部状态栏与底部操作条。',
      },
      {
        title: '直出 App Store iPad 商店预览图',
        description: '轻松输出 4:3 横屏与 16:9 宽屏展示图，适配 App Store Connect 平板审核位、官网与路演 PPT。',
      },
      {
        title: '内测截图 100% 本地保密',
        description: '未发布平板应用界面与内部 BI 看板全程留在浏览器内存中渲染，不上传任何服务器。',
      },
    ],
    faqs: [
      {
        question: '平板样机工具内置了哪些平板和设备边框？',
        answer: '内置 iPad Pro 13 与安卓平板边框，并可在同一工作台随时切换 Chrome、Safari、iPhone 16 Pro、Pixel 9、Apple Watch、Wear OS 与无边框等共 13 种样机。',
      },
      {
        question: 'iPad 样机同时支持横屏和竖屏截图吗？',
        answer: '支持。默认提供适合平板横屏分屏界面的宽幅画布，也可一键切换竖屏或方形画布适配小红书和官网卡片。',
      },
      {
        question: '能在一张宣传图里同时展示 iPad 和 iPhone 吗？',
        answer: '可以。点击“在 Studio 画布精修”即可把当前 iPad 图层带入多图层画布，再叠加 iPhone 16 Pro、浏览器窗口和卖点大字。',
      },
      {
        question: '导出的 iPad 套壳图片带有水印吗？',
        answer: '完全没有。标准高清 PNG 导出免费且无任何 Moklu 品牌角标。',
      },
    ],
  },
  'watch-mockup': {
    navLabel: '手表样机',
    title: '免费 Apple Watch 与智能手表截图套壳生成器 | Moklu',
    metaDescription:
      '一键给 watchOS 与 Wear OS 运动、健康和表盘小组件截图套上 Apple Watch 或圆形智能手表外框，100% 浏览器本地渲染，免费无水印。',
    badge: 'Apple Watch · Wear OS 表盘样机',
    h1: 'Apple Watch 与智能手表套壳生成器',
    subtitle:
      '为 watchOS 表盘组件、运动记录或 Wear OS 应用界面套上精致的 Apple Watch 方形表壳或圆形 Wear OS 边框，搭配柔和光影背景，纯本地快速出图。',
    steps: [
      {
        title: '拖入或粘贴手表端截图',
        description: '导入 watchOS 模拟器截图或手表真机截屏，也可先加载内置示例画面快速体验。',
      },
      {
        title: '选择 Apple Watch 或圆形 Wear OS 表壳',
        description: '在方形 Apple Watch 与圆形 Wear OS 之间一键切换，调节 1:1 方形或竖屏画布与背景渐变。',
      },
      {
        title: '导出高清 PNG 或进 Studio 搭手机同框',
        description: '秒出无水印高清展示图，或转入 Moklu Studio 与伴生 iPhone App 并排排版。',
      },
    ],
    highlights: [
      {
        title: '方表与圆表双形态精准适配',
        description: '圆润表壳弧度与圆形表盘裁切边缘锐利自然，告别手工抠图锯齿。',
      },
      {
        title: '手机 + 手表协同展示工作流',
        description: '一键移交 Moklu Studio，将 Apple Watch 与 iPhone 16 Pro 组合在同一张应用商店或官网首图中。',
      },
      {
        title: '纯本地 60fps 实时渲染',
        description: '所有表壳合成均在浏览器内存瞬间完成，未上线穿戴端界面无需上传第三方网站。',
      },
    ],
    faqs: [
      {
        question: '手表样机支持 Apple Watch 和圆形安卓手表吗？',
        answer: '支持。工作台同时内置 Apple Watch 方形表壳与 Wear OS 圆形智能手表边框，切换时无需重新上传截图。',
      },
      {
        question: '手表截图套壳推荐用什么画布比例？',
        answer: '默认 1:1 方形画布非常适合官网特性卡片和产品图集，发社媒或商店竖图时可切换 4:5 或 9:16。',
      },
      {
        question: '怎样把 Apple Watch 和 iPhone 放在同一张宣传图里？',
        answer: '点击“在 Studio 画布精修”，即可在多图层画布中把手表样机与 iPhone 16 Pro 样机、功能标题自由组合。',
      },
      {
        question: '生成手表样机有每日导出次数限制吗？',
        answer: '没有限制。全部计算在你的本地浏览器完成，免费无限次导出无水印 PNG。',
      },
    ],
  },
  'stitch-screenshots': {
    navLabel: '长截图智能拼接',
    title: '长截图在线拼接（自动去重叠·聊天记录/字幕拼长图）| Moklu',
    metaDescription:
      '在线拼接微信聊天记录、网页滚动长截图与电影台词字幕：纯本地像素匹配自动去除重复滚动区域与固定顶底栏，支持重影对齐微调接缝，零上传。',
    badge: '自动去重叠 · 重影接缝微调',
    h1: '长截图智能拼接（自动去重叠与接缝微调）',
    subtitle:
      '专为微信/Slack 聊天记录、长文章滚动截图与电影台词拼图打造：纯本地像素匹配自动去除重复内容与固定顶底栏，并支持半透明重影滑块逐像素微调接缝。',
    steps: [
      {
        title: '按顺序拖入或粘贴连续截屏',
        description: '批量导入多张滚动聊天截图、长网页截图或字幕图，支持拖拽调整顺序与一键反转。',
      },
      {
        title: '自动去重叠并用重影微调接缝',
        description: '默认开启纯本地像素匹配，自动裁掉重复滚动段落与固定导航/输入框栏；如有细微偏差可用重影滑块精准对齐。',
      },
      {
        title: '无损导出长图、复制或转入 Studio 打码',
        description: '导出高清 PNG / WebP / JPEG，一键复制到剪贴板，或无损转入 Studio 进行脱敏打码与高亮标注。',
      },
    ],
    highlights: [
      {
        title: '100% 本地像素匹配自动去重叠',
        description: '在浏览器内存中自动识别相邻两张截图的重复行，让聊天对话与文章段落自然连贯无重复。',
      },
      {
        title: '固定顶栏与底栏自动裁剪',
        description: '智能识别手机状态栏、App 顶部导航与底部输入栏，避免长图中反复出现割裂的固定栏。',
      },
      {
        title: '交互式半透明重影接缝微调',
        description: '针对低对比度界面或电影台词字幕，可对单条接缝开启重影覆盖视图手动微调像素偏移。',
      },
    ],
    faqs: [
      {
        question: '“长截图智能拼接”和“竖向长图拼接”有什么区别？',
        answer: '“长截图智能拼接”默认开启智能去重叠与固定顶/底栏裁剪，专为滚动聊天和网页截图优化；“竖向长图拼接”则默认原样首尾相接，适合海报或照片竖拼。',
      },
      {
        question: '如果自动去重叠对纯色或电影字幕接缝略有偏差怎么办？',
        answer: '无明显重叠时会自动安全保留原图避免误裁，你也可以直接打开对应接缝的半透明重影微调滑块，按像素手动对齐。',
      },
      {
        question: '拼接私人微信聊天记录或工作对话会上传到服务器吗？',
        answer: '绝对不会。重叠检测与画布合成全部在你的本机浏览器内存中离线运行，拼完后还能直接本地打码脱敏。',
      },
      {
        question: '超长聊天记录拼出来的图片会被强制压缩模糊吗？',
        answer: '在 8192px / 64MP 安全画布上限内默认保持原图清晰度输出 PNG；超限时会自动等比缩放并在界面明确提示防止浏览器崩溃。',
      },
    ],
  },
  'heic-to-jpg': {
    navLabel: 'HEIC 转 JPG',
    title: 'iPhone HEIC / AVIF 转 JPG 在线免费工具（纯本地零上传）| Moklu',
    metaDescription:
      '将苹果 iPhone .heic / .heif 与 .avif 照片在浏览器本地批量转换为 JPG、PNG 或 WebP。原生解码优先加本地 WASM 兜底，照片绝不上传服务器。',
    badge: '本地 HEIC / AVIF 解码 · 零上传',
    h1: 'iPhone HEIC / AVIF 照片纯本地批量转 JPG',
    subtitle:
      '无需安装软件、无需把私密相册上传云端，直接在浏览器内将苹果 .heic、.heif 和 .avif 照片批量转换为高兼容 JPG、PNG 或 WebP 并打包 ZIP 下载。',
    steps: [
      {
        title: '拖入 iPhone HEIC、HEIF 或 AVIF 照片',
        description: '一次拖入单张或几十张手机原图，系统自动识别 HEIC/AVIF 格式并在本机内存中排队解码。',
      },
      {
        title: '选择 JPG / PNG / WebP 与画质参数',
        description: '默认输出通用 JPG 格式，可按需调节画质、设置最大宽度或目标 KB 体积，并自动清除敏感 EXIF。',
      },
      {
        title: '单张保存或一键打包 ZIP 下载',
        description: '实时查看转换前后文件体积变化，逐张保存或点击一次直接本地打包 ZIP。',
      },
    ],
    highlights: [
      {
        title: '原生解码优先 + 本地 WASM 兜底',
        description: 'Safari 等原生支持浏览器零额外开销直接解码，Chrome、Edge 与 Firefox 自动按需加载本地 WebAssembly 解码器。',
      },
      {
        title: '私密相册与证件照绝不上云',
        description: '告别把手机原图传到陌生服务器的隐患，每一张 HEIC 照片都在你自己的电脑内存中完成转码。',
      },
      {
        title: '支持批量转码与体积同步瘦身',
        description: '转成 JPG 的同时可一步到位控体积（如压缩到 200KB）并导出为单个 ZIP 压缩包。',
      },
    ],
    faqs: [
      {
        question: 'Chrome 和 Edge 不上传服务器是怎么把 HEIC 转成 JPG 的？',
        answer: 'Moklu 会先尝试浏览器原生解码，若当前浏览器不支持 HEIC，则自动动态加载纯本地 WebAssembly 解码器在你的设备内存中转码，照片全程不经过网络。',
      },
      {
        question: '除了苹果 HEIC 和 HEIF，还支持把 AVIF 转成 JPG 或 PNG 吗？',
        answer: '支持。你可以把 .heic、.heif、.avif、WebP、PNG 混合拖入同一批次，统一转换为 JPG、PNG 或 WebP。',
      },
      {
        question: 'HEIC 转换成 JPG 后会保留拍摄 GPS 定位信息吗？',
        answer: '不会。经本地 HTML5 Canvas 重编码导出后会自动移除 GPS 坐标与相机 EXIF 元数据，更适合直接发帖或提交表单。',
      },
      {
        question: '批量转换 HEIC 有每日张数限制或收费门槛吗？',
        answer: '没有每日张数上限，也不需要注册账号，因为全部转码算力都来自你本地设备的浏览器。',
      },
    ],
  },
  'remove-exif': {
    navLabel: '清除 EXIF 隐私',
    title: '在线查看并清除照片 EXIF 与 GPS 定位信息（纯本地）| Moklu',
    metaDescription:
      '纯本地解析 JPEG、PNG、WebP、HEIC 照片中隐藏的 GPS 经纬度、相机型号、拍摄时间与软件元数据，并一键彻底抹除 EXIF 隐私信息，零上传。',
    badge: 'EXIF / GPS 检测 · 纯离线抹除',
    h1: '照片 EXIF 与 GPS 定位信息查看及清除工具',
    subtitle:
      '在分享闲鱼商品图、社媒原图或生活照片前，先在本地扫描隐藏的 GPS 经纬度、设备型号、光圈快门与拍摄时间，再一键导出零元数据的干净图片。',
    steps: [
      {
        title: '拖入照片本地扫描 EXIF 与 GPS',
        description: '载入 JPEG、PNG、WebP 或 HEIC 照片，内置二进制解析器会在浏览器内存即时列出所有敏感元数据标签。',
      },
      {
        title: '核对定位、相机型号与拍摄时间',
        description: '清晰查看是否包含 GPS 经纬度、相机/手机品牌型号、编辑软件及拍摄时间戳，文件零上传。',
      },
      {
        title: '一键导出无 EXIF 干净照片',
        description: '单张保存或批量打包 ZIP，导出的照片不含任何 GPS 定位与设备追踪标签，且无任何水印。',
      },
    ],
    highlights: [
      {
        title: '零依赖二进制 EXIF 深度体检',
        description: '直接通过浏览器 DataView 解析 JPEG APP1、PNG eXIf、WebP EXIF 与 HEIC EXIF 区块，所见即所清。',
      },
      {
        title: '防止家庭住址与行程隐私泄露',
        description: '发帖、卖二手或发送原图给陌生人前彻底剥离 GPS 定位与拍摄时间，杜绝顺藤摸瓜。',
      },
      {
        title: '支持断网离线核验执行',
        description: '打开页面后断开 Wi-Fi 即可完成检测与清除，彻底打消“边去隐私边上传原图”的悖论。',
      },
    ],
    faqs: [
      {
        question: '可以检测并清除照片里的哪些隐私元数据？',
        answer: '内置解析器可识别 GPS 经纬度坐标、相机/手机品牌型号、后期软件名称、原始拍摄时间、ISO、光圈、快门及方向标签，并在导出时全部彻底清除。',
      },
      {
        question: '支持检查和清除哪些图片格式的 EXIF 信息？',
        answer: '支持读取 JPEG、PNG、WebP 与 HEIC/HEIF 中的 EXIF/GPS 数据，并输出纯净的 JPEG、WebP 或 PNG 文件。',
      },
      {
        question: '为什么清除照片隐私必须使用纯本地工具？',
        answer: '如果你把带有家庭住址 GPS 的原图上传到第三方云端服务器去“清除隐私”，原图本身就已经先暴露给了服务器；纯本地处理从源头杜绝泄露。',
      },
      {
        question: '清除 EXIF 方向标签后，手机竖拍的照片会横过来吗？',
        answer: '不会。浏览器解码时会先按正确朝向把像素摆正再重编码导出，竖拍照片去完 EXIF 依然保持正向。',
      },
    ],
  },
  'compress-image-to-200kb': {
    navLabel: '压缩图片到 200KB',
    title: '在线将图片精准压缩到 200KB（支持 100KB / 500KB）| Moklu',
    metaDescription:
      '报名照片、简历证件照与政务系统上传专用：本地二分查找画质将图片精准压缩到 200KB、100KB 或 500KB 以内，零上传、无水印，支持批量 ZIP。',
    badge: '精准目标 KB 压缩 · 本地二分调优',
    h1: '将图片精准压缩到 200KB 以内（支持自定义 KB）',
    subtitle:
      '轻松满足考公考研报名、签证申请、简历投递与政务网站严格的 100KB / 200KB / 500KB 体积上限，浏览器本地二分搜索最优画质，证件照绝不上传云端。',
    steps: [
      {
        title: '拖入超大的报名照或材料图片',
        description: '批量导入超出网站体积限制的 JPEG、PNG、WebP 或 iPhone HEIC 照片。',
      },
      {
        title: '选用 200KB、100KB、500KB 或自定义目标',
        description: '工具在本地自动二分搜索能满足目标上限的最高画质；若最低画质仍超标，可选自动等比微缩尺寸达标。',
      },
      {
        title: '确认达标体积并即时下载',
        description: '绿色达标徽章直观显示压缩前后 KB 对比，单张下载或一键本地打包 ZIP。',
      },
    ],
    highlights: [
      {
        title: '确定性二分查找最高可用画质',
        description: '告别反复手动拉滑块试错，自动逼近 200KB 上限下最清晰的编码质量，人像与文字依旧锐利。',
      },
      {
        title: '可选锁定原尺寸满足审核规范',
        description: '报名系统对像素宽高有硬性要求时可勾选保持原尺寸，普通大图则可允许智能等比缩放确保必达标。',
      },
      {
        title: '证件照与申报材料零上传',
        description: '求职寸照、学历扫描件与签证材料全程在本机浏览器内存压缩，安全且秒出结果。',
      },
    ],
    faqs: [
      {
        question: '工具是如何把照片精准压到 200KB 以内又尽量不糊的？',
        answer: 'Moklu 在本地对编码画质执行确定性二分查找，自动找出刚好低于目标 KB 的最高画质；若超大原图在最低画质下仍超限，还可自动等比缩放尺寸直至达标。',
      },
      {
        question: '除了 200KB，可以压缩到 100KB、50KB 或 500KB 吗？',
        answer: '可以。本页默认预设 200KB 方便直达，你在工具栏中可一键切换 100KB / 500KB 或输入任意自定义 KB 数值。',
      },
      {
        question: '报名或政务网站限制 200KB 时应该选 JPEG 还是 WebP？',
        answer: '多数考试报名、签证和政府系统要求 .jpg 后缀，建议选择 JPEG 输出；若是自建博客或电商网页配图，WebP 在同体积下更清晰。',
      },
      {
        question: '压缩个人证件照和证明材料会上传到服务器吗？',
        answer: '绝不上传。整个二分查找与图像重编码过程 100% 在你本机浏览器内存中执行。',
      },
    ],
  },
  'redact-screenshot': {
    navLabel: '截图打码涂抹',
    title: '在线截图打码、模糊、马赛克与聚光灯高亮（纯本地）| Moklu',
    metaDescription:
      '发帖或汇报前 3 秒在本地给截图打码：支持高斯模糊、马赛克像素化、纯色遮盖与聚光灯高亮，隐藏 API 密钥、手机号和客户信息，零上传。',
    badge: '模糊 · 马赛克 · 聚光灯 · 零上传',
    h1: '截图本地打码、马赛克与聚光灯高亮工具',
    subtitle:
      '分享后台数据、报错终端或聊天截图前，3 秒用纯本地模糊、马赛克、纯色实心遮盖或聚光灯高亮隐藏 API 密钥、手机号、邮箱与金额，还能顺手套壳导出。',
    steps: [
      {
        title: '粘贴或拖入待脱敏的截图',
        description: '截完屏直接按 Cmd/Ctrl+V 粘贴到工作台，原始未打码画面绝不离开你的设备。',
      },
      {
        title: '框选区域打码、马赛克或聚光灯聚焦',
        description: '在敏感信息上拖拽绘制实心遮盖、高斯模糊或马赛克，或用聚光灯压暗背景突出重点指标。',
      },
      {
        title: '套壳导出或进 Studio 无损继续编辑',
        description: '直接导出无水印 PNG（可选 Chrome/iPhone 套壳），或保留无损底图移交 Studio 叠加箭头与说明文字。',
      },
    ],
    highlights: [
      {
        title: '敏感密钥绝不经过云端打码网站',
        description: '把未打码的密钥或财务表传到在线打码网站等于主动泄密；Moklu 全部打码均在本机内存完成。',
      },
      {
        title: '四种专业脱敏与聚焦模式',
        description: '实心色块彻底销毁敏感像素，高斯模糊与马赛克观感柔和，聚光灯模式一键突出汇报核心区域。',
      },
      {
        title: '打码与套壳美化一步到位',
        description: '脱敏后可直接套上 Chrome / Safari / iPhone 外框出图，转入 Studio 仍保留可二次调整的非破坏性图层。',
      },
    ],
    faqs: [
      {
        question: '隐藏 API Key、密码或手机号，选模糊、马赛克还是纯色遮盖更安全？',
        answer: '对于密钥、密码、订单号和身份证号，强烈推荐使用纯色实心遮盖（Solid Mask），它会用不透明像素彻底覆写原区域，不可逆向还原；模糊与马赛克适合轻量视觉弱化。',
      },
      {
        question: '未打码的原截图会先上传到服务器再让我画框吗？',
        answer: '绝对不会。图片直接在浏览器本地解码并绘制在 HTML5 Canvas 上，全程无任何文件上传请求。',
      },
      {
        question: '聚光灯（Spotlight）模式适合什么场景？',
        answer: '聚光灯会自动压暗框选区域以外的背景，让读者一眼聚焦你框出的核心按钮、KPI 数字或代码行，非常适合写教程和发更新日志。',
      },
      {
        question: '打完码一键转入 Moklu Studio 后还能微调打码位置吗？',
        answer: '可以。移交 Studio 时会无损保留底层原图与独立打码图层，方便你继续微调框选范围并添加箭头和文字注释。',
      },
    ],
  },
  'annotate-image': {
    navLabel: '图片标注',
    title: '在线图片标注与截图标注工具（矩形/箭头/文字/画笔 · 纯本地）| Moklu',
    metaDescription:
      '免费纯本地在线图片标注工具：为截图和照片添加矩形框、指示箭头、文字注释与平滑画笔，支持 8 控制点自由缩放图层、撤销重做、原图导出与一键复制，零上传无水印。',
    badge: '矩形 · 箭头 · 文字 · 画笔',
    h1: '纯本地在线图片标注与截图标注工具',
    subtitle:
      '写操作文档、提 Bug 单或审校界面时，直接在浏览器内为图片叠加矢量矩形、指示箭头、可双击编辑文字与画笔标注。每个图层都支持 8 控制点缩放与自由拖拽，原图分辨率无损导出且零上传。',
    steps: [
      {
        title: '粘贴截图或拖入需要标注的图片',
        description: '截屏后直接按 Cmd/Ctrl+V 粘贴，或拖入本地 PNG、JPEG、WebP、AVIF、HEIC 图片，全部文件仅留在本地浏览器。',
      },
      {
        title: '叠加矩形框、箭头、文字或画笔标记',
        description: '快捷键一键切换选择 (V)、画笔 (B)、矩形 (R)、箭头 (A) 与文字 (T)，挑选配色和线宽，并用蓝色 8 控制点精准调整每个图层位置与尺寸。',
      },
      {
        title: '无损下载原图或一键复制发给同事',
        description: '导出高清无水印 PNG / WebP / JPEG，或一键复制到剪贴板直接粘贴进微信、飞书、Slack 与文档。',
      },
    ],
    highlights: [
      {
        title: '全矢量图层与 8 控制点精细缩放',
        description: '画完的矩形、箭头、文字和画笔都不会立刻压死在底图上，随时可以选中拖拽移动、拉伸改大小、换颜色或单独删除。',
      },
      {
        title: '效率快捷键与 50 步撤销重做',
        description: '支持 V/B/R/A/T 秒切工具、双击文字原地编辑、Delete 删图层与 Cmd/Ctrl+Z 连续撤销重做，标注教程图行云流水。',
      },
      {
        title: '内部截图纯本地标注零泄密',
        description: '后台数据、未上线需求图与设计评审截图全程留在设备内存，自动保存本地 IndexedDB 草稿，绝不上传服务器。',
      },
    ],
    faqs: [
      {
        question: 'Moklu 图片标注工具支持哪些标注样式？',
        answer: '内置选择与 8 控制点缩放工具、贝塞尔平滑自由画笔、圆角矩形框、高辨识度指示箭头，以及带对比度描边、支持双击修改的文字标注。',
      },
      {
        question: '画完箭头或矩形框后还能移动位置和调整大小吗？',
        answer: '可以。切换到选择工具 (V) 点击任意标注图层，即可拖动位置、通过四周 8 个蓝色控制点缩放变形、更改颜色与线宽，或按 Delete 单独删除。',
      },
      {
        question: '给截图加完标注后导出会压缩原图清晰度吗？',
        answer: '不会。所有标注以归一化矢量坐标保存，导出时直接在原始图片完整分辨率的 HTML5 Canvas 上精准绘制，导出 PNG 保持原图锐度。',
      },
      {
        question: '在套壳样机、改尺寸或拼图工具里可以直接顺手标注吗？',
        answer: '可以。样机套壳、缩放裁剪与拼图预览区均内置了“标注”按钮，点击即可弹出同样的矢量标注浮层，保存后立即回写到当前图片。',
      },
      {
        question: '标注后的企业内部截图会上传到云端服务器吗？',
        answer: '绝对不会。图片解码、矢量图层渲染、IndexedDB 本地草稿以及最终合成导出全部 100% 在本机浏览器内存中运行。',
      },
    ],
  },
  'draw-on-image': {
    navLabel: '图片涂鸦画笔',
    title: '在线在图片上画画与涂鸦标记（平滑画笔 · 纯本地免费）| Moklu',
    metaDescription:
      '直接在浏览器里用平滑矢量画笔在照片或截图上圈重点、划下划线、手绘涂鸦与加箭头文字，支持 8 种高亮配色、粗细调节与单笔撤销删除，零上传无水印。',
    badge: '平滑矢量画笔 · 本地涂鸦',
    h1: '在线在图片上画画、圈重点与手绘标记',
    subtitle:
      '打开即进入平滑画笔模式，在照片或截图上随手圈出重点、划出下划线或手绘批注。每条笔迹均为可移动可缩放的矢量图层，纯本地处理无需下载软件。',
    steps: [
      {
        title: '导入照片或粘贴剪贴板截图',
        description: '拖入手机照片、文档截图或直接按 Cmd/Ctrl+V 粘贴，无需上传等待即可立即开始涂鸦。',
      },
      {
        title: '用平滑画笔随手圈画与批注',
        description: '默认开启画笔模式，自由挑选 8 种高对比色与线宽，也可随时切到矩形、箭头或文字补充说明。',
      },
      {
        title: '一键复制到聊天窗口或保存高清图',
        description: '画完直接复制到剪贴板粘贴进微信/飞书，或按原图分辨率保存无水印 PNG / WebP / JPEG。',
      },
    ],
    highlights: [
      {
        title: '二次贝塞尔曲线自动顺滑笔迹',
        description: '内置抽稀与贝塞尔曲线平滑算法，即使只用鼠标或触控板圈重点，线条依然流畅顺滑不锯齿。',
      },
      {
        title: '连手绘笔迹也能选中移动与缩放',
        description: '区别于一笔定死的位图画板，每一笔手绘线条都是独立矢量对象，画歪了可直接选中挪位、缩放或单条删除。',
      },
      {
        title: '电脑鼠标与手机触控笔同样顺手',
        description: '采用统一 Pointer Events 并在绘制时锁定页面滚动，手机端手指涂鸦与平板手写笔批注一样跟手。',
      },
    ],
    faqs: [
      {
        question: '“图片涂鸦画笔”和“图片标注”两个页面有什么区别？',
        answer: '“图片涂鸦画笔”默认选中画笔工具，打开就能立刻圈画涂鸦；“图片标注”默认选中矩形框，更适合结构化文档和 Bug 截图。两个页面都包含全部 5 种标注工具。',
      },
      {
        question: '画错一笔可以只删那一笔而不清空整张图吗？',
        answer: '可以。按 Cmd/Ctrl+Z 支持多达 50 步撤销重做，也可以按 V 切到选择模式点击任意单条笔迹，按 Delete 精准删除那一笔。',
      },
      {
        question: '在高分辨率截图上涂鸦导出后会变模糊或有锯齿吗？',
        answer: '不会。笔迹以分辨率无关的矢量坐标记录，保存或复制时会按照底图原始高清尺寸重新抗锯齿渲染。',
      },
      {
        question: '手机浏览器上可以用手指直接在照片上涂鸦圈重点吗？',
        answer: '支持。画布已针对触控和手写笔优化，手指拖动涂鸦时不会误触发页面上下滚动，纯本地离线也能顺畅使用。',
      },
    ],
  },
}
