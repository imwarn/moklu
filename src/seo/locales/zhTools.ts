/**
 * [INPUT]: depends on RouteCopy and SecondaryToolSlug types from ../types.ts
 * [OUTPUT]: exports ZH_TOOL_ROUTES containing Simplified Chinese copy for merge-photos-to-pdf, split, compress, resize, and ID-card routes
 * [POS]: secondary route-copy chunk for zh within src/seo/locales, merged into ZH_LOCALE by ./zh.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { RouteCopy, SecondaryToolSlug } from '../types.ts'

export const ZH_TOOL_ROUTES: Record<SecondaryToolSlug, RouteCopy> = {
  'merge-photos-to-pdf': {
    navLabel: '多图拼接转 PDF',
    title: '在线多图拼接导出单页 PDF（纯本地零上传）| Moklu',
    metaDescription:
      '将多张照片、发票报销单或截图按竖向、横向或 2–6 列宫格排在一张画面上，直接导出标准单页 PDF 1.4 文件。100% 浏览器本地生成，无水印。',
    badge: '单页 PDF 1.4 · 零上传本地生成',
    h1: '多张图片拼接并导出为单页 PDF',
    subtitle:
      '把发票、合同照片、课件截图按竖向长图、横向并排或 2–6 列宫格整齐排布，支持拖拽调序、90° 旋转、单图边框与质量滑块，在浏览器内直接生成单页 PDF 1.4 文件。',
    steps: [
      {
        title: '添加照片并拖拽排好顺序',
        description: '批量拖入或 Cmd/Ctrl+V 粘贴图片，支持缩略图拖拽排序、一键反转顺序和单图顺时针 90° 旋转。',
      },
      {
        title: '设置布局、边框与 PDF 质量',
        description: '选择竖向、横向或 2–6 列宫格（支持 cover/contain），调节间距、外边距、单图描边边框与 50%–100% 导出质量（默认 92%）。',
      },
      {
        title: '本地导出单页 PDF 1.4',
        description: '直接由本地 HTML5 Canvas 封装为标准单页 PDF 文件下载，不经过服务器，也不添加水印。',
      },
    ],
    highlights: [
      {
        title: '零上传本地封装 PDF 1.4',
        description: '报销发票、扫描件和个人证件照全程留在本机浏览器内存中，断网同样可用。',
      },
      {
        title: '透明底自动转纯净白底',
        description: '导出 PDF 或 JPEG 时，透明背景自动铺设纯白画布，避免打印出现黑底异常。',
      },
      {
        title: '灵活排版与可控体积',
        description: '支持 2–6 列宫格、自定义取色器与 50%–100% 质量调节，清晰度与体积自由平衡。',
      },
    ],
    faqs: [
      {
        question: '导出的是单页 PDF 还是多页 PDF？',
        answer: 'Moklu 将拼好的整张大图封装为标准单页 PDF 1.4 文件，适合多张发票、证明或截图拼成一页打印提交，不支持合并已有多个多页 PDF 文档。',
      },
      {
        question: '可以调节导出 PDF 的画质和文件体积吗？',
        answer: '可以。选择 PDF 格式后界面会显示 50%–100% 质量滑块（默认 92%），可在文字清晰度与邮件/系统上传体积上限之间自由取舍。',
      },
      {
        question: '透明背景的 PNG 拼图转 PDF 会变黑吗？',
        answer: '不会。导出 PDF 或 JPEG 时，Moklu 会自动将透明区域转为纯白背景，确保打印与阅览效果干净清晰。',
      },
      {
        question: '把发票或合同拼成 PDF 会上传到云端吗？',
        answer: '绝对不会。整个拼接与 PDF 1.4 封装过程 100% 在你的浏览器本地内存中完成，零网络上传。',
      },
    ],
  },
  'carousel-splitter': {
    navLabel: '轮播无缝切图',
    title: '小红书 / Instagram 无缝轮播全景切图工具 | Moklu',
    metaDescription:
      '把宽幅全景图或长横幅一键切分成 2-10 张小红书 3:4、Instagram 4:5 或 1:1 无缝滑动轮播图，本地打包 ZIP 下载，零上传。',
    badge: '小红书 3:4 · IG 4:5 无缝滑屏',
    h1: '小红书 & Instagram 无缝轮播切图工具',
    subtitle:
      '将横向全景大片、长信息图或连续故事长卷精准切分为多张滑动无缝衔接的轮播图，实时预览切割线，一键打包编号 ZIP 或送入 Studio 加页码文案。',
    steps: [
      {
        title: '拖入宽幅全景图或长横幅',
        description: '载入横屏摄影作品或宽幅排版设计稿，画面上立刻显示精准的分割参考线。',
      },
      {
        title: '选择张数与社交平台比例',
        description: '在 2 到 10 张间自由设定张数，一键匹配小红书 3:4（1080×1440）、IG 4:5 或 1:1 比例。',
      },
      {
        title: '一键下载编号 ZIP 或进 Studio 加字',
        description: '按发布顺序自动编号打包下载，也能直接作为多页幻灯片导入 Studio 添加标题与页码。',
      },
    ],
    highlights: [
      {
        title: '严丝合缝的滑屏观感',
        description: '精准像素切分确保相邻两张图在滑动切换时完全连贯，不会出现尴尬白缝或错位。',
      },
      {
        title: '内置主流平台黄金比例',
        description: '原生提供小红书 3:4 与 Instagram 4:5 标准输出尺寸，发帖不再被平台二次乱裁。',
      },
      {
        title: '直接衔接 Studio 多页精修',
        description: '切分后的轮播组可一键导入 Studio，为每一页分别添加醒目大字与引导箭头。',
      },
    ],
    faqs: [
      {
        question: '发小红书和发 Instagram 分别应该选什么比例？',
        answer: '小红书图文强烈推荐 3:4（1080×1440），Instagram 竖屏轮播推荐 4:5（1080×1350），方形画册可选 1:1。',
      },
      {
        question: '一张全景图最多可以切成几张轮播图？',
        answer: '支持自由选择 2 张到 10 张无缝连续切片。',
      },
      {
        question: '导出的切片顺序会乱吗？',
        answer: '不会。所有切片按从左到右自动以 01、02、03 顺序命名，解压后按序号选择发布即可。',
      },
      {
        question: '超清 8K 全景图切图需要上传很久吗？',
        answer: '完全不需要上传，全部切分都在你电脑本地浏览器内瞬间完成。',
      },
    ],
  },
  'image-grid-splitter': {
    navLabel: '九宫格切图',
    title: '免费九宫格切图工具（朋友圈 3×3 / 自定义行列切图）| Moklu',
    metaDescription:
      '一键将单张图片切分为微信朋友圈 3×3 九宫格、2×2 四宫格或任意行列矩阵，实时预览切线，纯本地一键打包 ZIP 下载。',
    badge: '朋友圈 3×3 九宫格切图',
    h1: '九宫格与自定义矩阵切图工具',
    subtitle:
      '把单张海报、人像大片或插画精准切割为朋友圈 3×3 九宫格、四宫格或任意行×列切片，自带网格线实时预览，纯本地无损切割并一键打包 ZIP。',
    steps: [
      {
        title: '选择需要切分的原图',
        description: '拖入任意方形或矩形图片，预览区立即叠加精确的行列切割辅助线。',
      },
      {
        title: '设置 3×3 九宫格或自定义行列',
        description: '默认即为经典 3×3 九宫格，也可自由调整为 1×1 到 6×6 的任意矩阵组合。',
      },
      {
        title: '逐张保存或一键打包下载 ZIP',
        description: '按从左到右、从上到下的发圈顺序编号导出，发朋友圈或 IG 绝不排错。',
      },
    ],
    highlights: [
      {
        title: '所见即所得切线预览',
        description: '导出前即可确认人脸、文字或主体是否正好落在分割线上，避免切偏返工。',
      },
      {
        title: '标准顺序自动编号',
        description: '1 到 9 号严格按发布顺序命名，直接全选上传朋友圈即可拼出完整大图。',
      },
      {
        title: '原画质无损本地切分',
        description: '直接从本地原始像素缓冲区裁剪切片，不经过服务器二次压缩降质。',
      },
    ],
    faqs: [
      {
        question: '怎么切标准微信朋友圈九宫格？',
        answer: '保持默认的 3 行 × 3 列设置，拖入图片后点击“打包下载 ZIP”，按编号 1 到 9 顺序发圈即可。',
      },
      {
        question: '支持切成 3×1 三连横图或 2×3 六宫格吗？',
        answer: '支持。行数（1–6）与列数（1–6）可独立设置，轻松制作三连图、六宫格或海报分块打印图。',
      },
      {
        question: '不是正方形的照片能切九宫格吗？',
        answer: '可以直接按原比例切分；如果希望每个格子都是标准正方形，建议先用“图片裁剪”裁成 1:1 再切。',
      },
      {
        question: '每天切图有次数或文件大小限制吗？',
        answer: '没有任何次数限制，因为全部计算都运行在你自己的设备上。',
      },
    ],
  },
  'compress-image': {
    navLabel: '图片压缩',
    title: '免费纯本地批量图片压缩工具（PNG / JPEG / WebP）| Moklu',
    metaDescription:
      '纯浏览器本地批量压缩 PNG、JPEG、WebP 图片，实时显示压缩前后体积与节省比例，支持限宽缩放与 ZIP 打包，绝不上传服务器。',
    badge: '批量本地压缩 · 实时体积对比',
    h1: '纯本地批量图片压缩工具',
    subtitle:
      '无需上传云端，在浏览器内一次压缩多张 PNG、JPEG、WebP 图片，直观查看每张图压缩前后的 KB 变化与体积降幅，支持一键 ZIP 打包下载。',
    steps: [
      {
        title: '批量拖入待压缩图片',
        description: '一次选入单张或数十张大图，本地瞬间加载，无需漫长上传进度条。',
      },
      {
        title: '微调画质滑块、格式与最大宽度',
        description: '自由设定输出格式与压缩质量，逐一查看节省百分比，找到画质与体积的最佳平衡。',
      },
      {
        title: '单独下载或一键打包 ZIP',
        description: '立刻导出瘦身后的图片文件，直接用于博客、小程序、电商详情或邮件附件。',
      },
    ],
    highlights: [
      {
        title: '最高瘦身 80% 依旧清晰',
        description: '转为 WebP 或高效率 JPEG，大幅缩减网页首屏加载耗时并优化 SEO 性能指标。',
      },
      {
        title: '透明直观的体积对比',
        description: '每张图片清晰列出原始大小、压缩后大小与 `-XX%` 节省标签，效果一目了然。',
      },
      {
        title: '涉密文档与内网图片安全压缩',
        description: '纯本地离线算法，公司合同扫描件、产品原图与个人照片绝不外传。',
      },
    ],
    faqs: [
      {
        question: '本地压缩通常能把图片体积减小多少？',
        answer: '常见界面截图和产品图在 WebP 80%–85% 质量下通常可缩减 50%–85% 体积，肉眼几乎看不出画质损失。',
      },
      {
        question: '压缩时会自动清除照片里的 GPS 定位和相机 EXIF 信息吗？',
        answer: '会的。通过浏览器 Canvas 重新编码会自然剥离多余的 EXIF 相机元数据与地理位置标签，体积更小也更保护隐私。',
      },
      {
        question: '可以一边压缩一边把超宽 4K 大图缩到 1920px 吗？',
        answer: '可以。填入可选的“最大宽度”限制，即可在单次批量处理中同步完成缩放与压缩。',
      },
      {
        question: '相比在线云端压缩站有什么优势？',
        answer: '零上传延迟、无单日张数或单文件 5MB 付费墙限制，且完全杜绝隐私图片泄露风险。',
      },
    ],
  },
  'convert-image-format': {
    navLabel: '格式转换',
    title: '免费本地批量图片格式转换（WebP / PNG / JPEG 互转）| Moklu',
    metaDescription:
      '在浏览器本地批量将 WebP 转 PNG、PNG 转 JPEG 或转 WebP，自动修正后缀名并支持 ZIP 批量导出，无需上传任何图片。',
    badge: 'PNG · WebP · JPEG 本地互转',
    h1: '批量图片格式转换工具',
    subtitle:
      '轻松把网上保存的 WebP 转回通用 PNG，或把大体积 PNG 批量转为轻巧 JPEG/WebP，自动规范扩展名并支持一键 ZIP 下载，全部本地极速完成。',
    steps: [
      {
        title: '拖入任意混合格式的源图',
        description: '支持同时投入 WebP、PNG 与 JPEG 图片进行统一批处理。',
      },
      {
        title: '选择目标输出格式与画质',
        description: '按使用场景选择无损 PNG、高兼容 JPEG 或轻量化 WebP。',
      },
      {
        title: '导出转换结果或打包 ZIP',
        description: '自动保留原文件名并切换正确扩展名，在本地秒级下载完成。',
      },
    ],
    highlights: [
      {
        title: '一键解决 WebP 打不开痛点',
        description: '快速把浏览器下载的 .webp 素材批量转为 PPT、微信、PS 和打印店通用 PNG/JPEG。',
      },
      {
        title: '多图同批极速转换',
        description: '几十张素材一次拖入、一次打包导出，告别逐张另存为的繁琐操作。',
      },
      {
        title: '保留原始分辨率不缩水',
        description: '未设置限宽时严格保持原图像素尺寸不变，仅做干净格式转换。',
      },
    ],
    faqs: [
      {
        question: '能把 WebP 图片转回高清 PNG 吗？',
        answer: '可以。拖入任意 WebP 文件，目标格式保持 PNG，即可瞬间导出干净的 .png 图片。',
      },
      {
        question: '带透明背景的 PNG 转成 JPEG 会怎样？',
        answer: '由于 JPEG 格式本身不支持透明通道，透明区域会自动平稳填充为纯色底背景。',
      },
      {
        question: '转换后原来的图片尺寸会变小吗？',
        answer: '不会。只要不手动填写最大宽度限制，输出文件会严格保持原始宽高像素。',
      },
      {
        question: '格式转换需要联网上传吗？',
        answer: '不需要，转换完全基于浏览器内置编解码器在本地运行。',
      },
    ],
  },
  'png-to-webp': {
    navLabel: 'PNG 转 WebP',
    title: 'PNG 转 WebP 在线批量转换工具（保留透明背景 · 纯本地）| Moklu',
    metaDescription:
      '浏览器本地批量将 PNG 截图与透明图标转为轻量 WebP，完整保留透明通道并实时对比体积节省，无需上传服务器。',
    badge: '前端与 SEO 提速利器',
    h1: 'PNG 批量转 WebP 工具（保留透明背景）',
    subtitle:
      '把笨重的 PNG 产品图、透明 Logo 与网页截图一键转为现代 WebP 格式，在完整保留 Alpha 透明通道的同时大幅瘦身，加速网站加载。',
    steps: [
      {
        title: '拖入单个或整批 PNG 文件',
        description: '直接拖入项目里的 PNG 图标、头图或透明贴纸，本地零延迟读取。',
      },
      {
        title: '调节 WebP 画质并查看瘦身比例',
        description: '推荐 82%–90% 质量区间，界面文字锐利清晰且体积立减六成以上。',
      },
      {
        title: '导出 .webp 文件或整包 ZIP',
        description: '立即获得规范命名的 .webp 资源，直接放进网站静态目录或 CDN。',
      },
    ],
    highlights: [
      {
        title: '完整保留透明通道',
        description: '不同于 JPEG 会丢失透明度，WebP 完美保留透明背景与平滑边缘羽化。',
      },
      {
        title: '显著提升 Lighthouse 与 LCP 分数',
        description: '大幅压缩首屏大图字节数，让独立站、博客与文档站点访问更快更省流量。',
      },
      {
        title: '无需安装命令行工具',
        description: '不必折腾 cwebp 或本地脚本，设计师和开发者在浏览器里即可批量转完。',
      },
    ],
    faqs: [
      {
        question: 'PNG 转成 WebP 后透明背景还会保留吗？',
        answer: '会的。WebP 原生支持完整的 Alpha 半透明通道，透明图标和抠图素材边缘依旧干净。',
      },
      {
        question: '界面截图转 WebP 质量设多少最合适？',
        answer: '建议设在 85% 左右，既能保持小字号 UI 文字清晰锐利，又能把 PNG 体积压缩 60%–80%。',
      },
      {
        question: '现在所有主流浏览器都支持 WebP 了吗？',
        answer: '是的，桌面与移动端的 Chrome、Safari、Firefox、Edge 及微信内置浏览器均已全面原生支持 WebP。',
      },
      {
        question: '一次可以转多少张 PNG？',
        answer: '没有云端配额限制，全部转换都在你本地浏览器中高速执行。',
      },
    ],
  },
  'resize-image': {
    navLabel: '图片缩放',
    title: '免费本地批量图片改尺寸工具（像素 / 百分比缩放）| Moklu',
    metaDescription:
      '按精确像素宽高或百分比批量缩放图片尺寸，支持锁定纵横比防变形与 ZIP 打包导出，100% 浏览器本地处理不上传。',
    badge: '精确像素 · 百分比 · 锁定比例',
    h1: '批量图片尺寸缩放工具',
    subtitle:
      '按指定像素宽度、高度或缩放百分比精准调整单张或整批图片尺寸，默认锁定宽高比拒绝拉伸变形，全部在浏览器本地秒级输出。',
    steps: [
      {
        title: '载入待调整尺寸的图片',
        description: '拖入或粘贴图片，页面自动读取每张文件的原始像素宽高。',
      },
      {
        title: '输入目标像素或缩放比例',
        description: '保持纵横比锁定输入宽或高，或直接按 50%、75% 等百分比批量等比缩小。',
      },
      {
        title: '下载成品或送入 Studio 排版',
        description: '本地保存改好尺寸的 PNG/WebP/ZIP，也可一键送入 Studio 套壳美化。',
      },
    ],
    highlights: [
      {
        title: '智能锁定纵横比',
        description: '修改宽度时高度自动同步计算，杜绝人物压扁或界面被拉宽的尴尬。',
      },
      {
        title: '高平滑度抗锯齿重采样',
        description: '采用高质量 Canvas 图像平滑算法，缩小后的文字与摄影细节依然自然清晰。',
      },
      {
        title: '批量统一规范尺寸',
        description: '电商商品图、文章封面或团队头像一次统一成完全相同的宽度并打包导出。',
      },
    ],
    faqs: [
      {
        question: '支持直接按 50% 这样的百分比缩小图片吗？',
        answer: '支持。可在“精确像素”和“百分比缩放”两种模式间自由切换。',
      },
      {
        question: '改尺寸会把照片拉变形吗？',
        answer: '只要保持默认的“锁定宽高比”开启，系统会自动等比例换算另一边像素，绝不拉伸变形。',
      },
      {
        question: '可以一次把多张不同大小的照片统一缩成 1200px 宽吗？',
        answer: '可以。批量导入后设定目标宽度，一键打包 ZIP 即可全部导出。',
      },
      {
        question: '图片改尺寸会上传到服务器吗？',
        answer: '不会，重采样完全在本地浏览器内完成。',
      },
    ],
  },
  'crop-image': {
    navLabel: '图片裁剪',
    title: '免费在线图片裁剪工具（1:1 / 4:5 / 3:4 / 16:9 比例预设）| Moklu',
    metaDescription:
      '一键按 1:1 头像、3:4 小红书、4:5 IG、16:9 封面或 9:16 竖屏精确裁剪照片与截图，100% 浏览器本地无损导出。',
    badge: '全平台黄金比例裁剪',
    h1: '多比例精准图片裁剪工具',
    subtitle:
      '快速将照片或截图精准裁剪为 1:1 方形、3:4 小红书竖图、4:5 IG 卡片、16:9 视频封面或 9:16 竖屏比例，本地原像素裁剪无上传。',
    steps: [
      {
        title: '拖入或粘贴需要裁剪的图片',
        description: '本地秒速加载任意 PNG、JPEG 或 WebP 原图。',
      },
      {
        title: '选择常用平台比例预设',
        description: '在 1:1、4:5、3:4、16:9、9:16、3:2 间一键切换并实时预览裁剪范围。',
      },
      {
        title: '导出裁剪成品或进 Studio 套壳',
        description: '直接本地下载高清裁剪图，也可送入 Studio 进一步排版美化。',
      },
    ],
    highlights: [
      {
        title: '一站覆盖主流社交尺寸',
        description: 'B站/YouTube 16:9、小红书 3:4、Instagram 4:5、头像 1:1 与短视频 9:16 全部内置。',
      },
      {
        title: '原像素无损截取',
        description: '直接从高清原图提取目标区域像素，不会先压缩再裁剪。',
      },
      {
        title: '一键切换“不裁剪加边框”',
        description: '如果舍不得裁掉画面边缘，就在同一工具内无缝切到“加白边补全比例”模式。',
      },
    ],
    faqs: [
      {
        question: '内置了哪些常用裁剪比例？',
        answer: '内置 1:1 方形、4:5 竖版、3:4 小红书竖版、16:9 宽屏、9:16 竖屏故事以及 3:2 经典相机比例。',
      },
      {
        question: '如果不想裁掉照片左右内容，怎么适配 3:4 或 1:1？',
        answer: '切换到同面板的“边框留白（Pad）”模式，即可在不裁切任何画面的前提下自动补白适配目标比例。',
      },
      {
        question: '裁剪会影响未裁掉部分的清晰度吗？',
        answer: '不会，截取区域直接保留原图原生分辨率导出。',
      },
      {
        question: '人像照片在这里裁剪安全吗？',
        answer: '100% 安全，全部操作均在本机浏览器内离线执行。',
      },
    ],
  },
  'add-border-to-photo': {
    navLabel: '照片加白边',
    title: '照片加白边与留白补全比例工具（不裁剪发小红书 / IG）| Moklu',
    metaDescription:
      '为横屏或竖屏照片一键添加精致白边、纯色或渐变边框，自动补全 1:1 / 3:4 / 4:5 比例不裁剪画面，支持圆角与投影，100% 浏览器本地处理。',
    badge: '无裁剪加白边 · 拍立得画框感',
    h1: '照片加白边与无裁剪留白边框工具',
    subtitle:
      '给摄影作品加上画廊白边或深色卡纸边框，把横屏大片完整放进小红书 3:4 或 Instagram 4:5 比例中，一像素都不裁，全程本地高清输出。',
    steps: [
      {
        title: '拖入单张或整组摄影原图',
        description: '支持横版 3:2、16:9 相机直出照片或手机竖拍原图批量载入。',
      },
      {
        title: '设定目标比例、边框厚度与底色',
        description: '选择画廊白、高级黑或柔光渐变边框，按喜好加上圆角与柔和投影。',
      },
      {
        title: '本地导出或在 Studio 加拍摄参数',
        description: '立刻下载完整无裁剪的留白照片，或进 Studio 在底部白边排上镜头焦段水印。',
      },
    ],
    highlights: [
      {
        title: '告别社交平台暴力裁图',
        description: '横屏风光与建筑摄影也能完整发进 3:4 或 1:1 图集，构图一丝不损。',
      },
      {
        title: '一秒拥有画册装裱质感',
        description: '恰到好处的白边留白搭配微弱阴影，让普通手机随手拍也颇具展览画册气息。',
      },
      {
        title: '整组图集视觉高度统一',
        description: '同一组发帖照片批量套用相同边框厚度与比例，主页排版高级整齐。',
      },
    ],
    faqs: [
      {
        question: '怎么把 16:9 横图完整发到小红书 3:4 不被切边？',
        answer: '在边框留白模式下选择 3:4 目标比例与白色背景，系统会自动把完整横图居中嵌入 3:4 白底画布中。',
      },
      {
        question: '可以同时给照片加圆角和轻微立体阴影吗？',
        answer: '可以。面板内提供独立的边框厚度、内图圆角与柔和投影开关，实时预览效果。',
      },
      {
        question: '想在照片底部白边里写上相机型号或拍摄日期怎么办？',
        answer: '点击“在 Studio 画布精修”，即可在底部留白处自由排入精致的字体、焦段信息与日期。',
      },
      {
        question: '原图很大，加白边会上传很慢或压缩画质吗？',
        answer: '不会上传，一切在本地浏览器内存高速渲染并保持高清输出。',
      },
    ],
  },
  'id-card-watermark': {
    navLabel: '身份证 A4 水印',
    title: '纯离线身份证正反面 A4 排版与防盗水印工具 | Moklu',
    metaDescription:
      '身份证正反面照片一键按 1:1 真实物理尺寸排入 300 DPI A4 打印纸，添加自定义防盗用斜纹水印与黑白复印效果。100% 纯浏览器本地离线运行，绝不上传。',
    badge: '100% 离线 · 300 DPI A4 · 防盗水印',
    h1: '身份证正反面 A4 排版 & 防盗水印工具',
    subtitle:
      '把手机拍的身份证正反面按国标真实物理尺寸（85.6mm × 54mm）居中排入 300 DPI A4 打印画布，叠加防盗用用途水印，断网也能正常使用，绝不上传任何证件照。',
    steps: [
      {
        title: '本地载入身份证正面与反面照片',
        description: '分别拖入或选取正反面照片（也可单张处理其他证件）。追求极致安心可先断开网络再操作。',
      },
      {
        title: '自定义防盗水印文字与黑白复印模式',
        description: '输入如“仅供办理XX业务使用 他用无效”的专属水印，调节透明度、倾斜角度、满屏斜纹或压证模式，可一键切换黑白复印质感。',
      },
      {
        title: '下载 300 DPI A4 高清 PNG 直接打印',
        description: '导出 2480×3508 标准 A4 打印图，按 100% 实际大小打印即为 1:1 真实证件尺寸。',
      },
    ],
    highlights: [
      {
        title: '国标 1:1 真实物理比例',
        description: '在 300 DPI A4 画布（2480×3508px）中精确映射 85.6mm × 54mm（1011×638px），打印出来与实体卡分毫不差。',
      },
      {
        title: '难以抹除的用途防盗水印',
        description: '斜向半透明水印精准覆盖证件关键区域，既不影响核验识别，又能有效防止复印件被挪作他用。',
      },
      {
        title: '可验证的零网络上传安全',
        description: '页面执行严格 CSP 策略且无任何文件上传接口，打开网页后开启飞行模式照样 100% 完成排版和导出。',
      },
    ],
    faqs: [
      {
        question: '在这里给身份证加水印和排版真的安全吗？',
        answer: '绝对安全。Moklu 没有任何接收文件的后端接口，所有合成均在你的浏览器本地完成。你可以加载完本页面后直接断网操作，亲眼验证零数据外传。',
      },
      {
        question: '导出的 A4 图片打印出来，身份证大小会和真卡一样大吗？',
        answer: '会的。300 DPI A4 成品严格按 85.6mm × 54mm 换算为 1011×638 像素居中排版，打印时选择“实际大小 / 100% 缩放”即可得到标准 1:1 复印件。',
      },
      {
        question: '防盗用安全水印一般怎么写最规范？',
        answer: '建议写明接收方、具体业务用途和日期，例如：“仅限办理XX银行开户使用，他用无效，2026年11月”。',
      },
      {
        question: '能不能把彩色手机照片做成传统黑白复印件效果？',
        answer: '可以。开启工具栏里的“黑白复印滤镜”开关，即可一键转为高对比度黑白复印件，打印清晰又省彩墨。',
      },
    ],
  },
}
