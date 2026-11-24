/**
 * [INPUT]: depends on InfoPageSlug, LocaleCode, and RouteCopy types from ../types.ts
 * [OUTPUT]: exports INFO_PAGE_ROUTES providing 4-locale SEO metadata and FAQs for /about, /privacy, and /terms
 * [POS]: route-copy chunk for trust info pages within src/seo/locales, merged into locales/{en,zh,ja,ko}.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { InfoPageSlug, LocaleCode, RouteCopy } from '../types.ts'

export const INFO_PAGE_ROUTES: Record<LocaleCode, Record<InfoPageSlug, RouteCopy>> = {
  en: {
    about: {
      navLabel: 'About Moklu',
      title: 'About Moklu | Local-First Browser Mockup & Image Toolkit',
      metaDescription:
        'Moklu (moklu.app) is an open-source, 100% browser-local screenshot mockup studio and image toolkit for merging, splitting, compressing, resizing, and watermarking ID cards.',
      badge: 'About Moklu',
      h1: 'About Moklu Local Image Toolkit',
      subtitle:
        'Moklu is an open-source, local-first web application at moklu.app that runs screenshot mockups, online image merging, carousel splitting, format compression, resizing, and ID card watermarking directly in your browser.',
      steps: [
        {
          title: 'Open any tool directly',
          description: 'Visit moklu.app or any dedicated tool route with no account signup or paywall.',
        },
        {
          title: 'Process images locally on Canvas',
          description: 'Every pixel operation runs inside your browser tab via HTML5 Canvas and Web APIs.',
        },
        {
          title: 'Export or audit the open-source code',
          description: 'Download watermark-free files locally or inspect the full source code on GitHub.',
        },
      ],
      highlights: [
        {
          title: 'Zero-upload architecture',
          description: 'Images never leave device memory. Every tool continues working even after you disconnect from the network.',
        },
        {
          title: 'Six quick tools plus Studio',
          description: 'Combine everyday image utilities with a full Konva multi-layer mockup studio in one cohesive workspace.',
        },
        {
          title: 'Open source on GitHub',
          description: 'Built openly under the MIT license at github.com/imwarn/moklu so anyone can verify privacy claims.',
        },
      ],
      faqs: [
        {
          question: 'What is Moklu (moklu.app)?',
          answer:
            'Moklu is a free, open-source, browser-local image toolkit and mockup studio at https://moklu.app. It provides browser and device mockups, online image merging (horizontal, vertical, grid, and single-page PDF), carousel and grid splitting, batch compression and WebP conversion, resizing/cropping/padding, and offline ID card A4 watermarking.',
        },
        {
          question: 'Where can I inspect Moklu source code?',
          answer:
            'The complete source code is publicly available at https://github.com/imwarn/moklu under the MIT license.',
        },
      ],
    },
    privacy: {
      navLabel: 'Privacy Policy',
      title: 'Privacy Policy | 100% Local Zero-Upload Architecture | Moklu',
      metaDescription:
        'How Moklu protects your images: 100% client-side HTML5 Canvas processing, zero server image uploads, strict CSP headers, and open-source auditability.',
      badge: 'Privacy & Security',
      h1: 'Moklu Privacy Policy & Zero-Upload Architecture',
      subtitle:
        'Moklu processes every screenshot, photo, and ID card 100% locally in your browser tab. No image bytes are uploaded, stored, or logged on any remote server.',
      steps: [
        {
          title: 'Local memory decoding',
          description: 'Selected or pasted files are read in browser RAM via FileReader and Object URLs.',
        },
        {
          title: 'On-device Canvas rendering',
          description: 'Mockups, merges, splits, compression, PDFs, and watermarks render locally on HTML5 Canvas.',
        },
        {
          title: 'Immediate memory cleanup',
          description: 'Closing or refreshing the tab releases temporary image buffers from browser memory.',
        },
      ],
      highlights: [
        {
          title: 'Zero image uploads',
          description: 'Moklu has no backend image upload endpoint. You can verify this in your browser Network tab.',
        },
        {
          title: 'Strict Content Security Policy',
          description: 'Production responses enforce strict CSP headers blocking unauthorized third-party scripts and exfiltration.',
        },
        {
          title: 'Optional local-only settings',
          description: 'Theme preferences and Studio projects stay in your browser localStorage and IndexedDB only.',
        },
      ],
      faqs: [
        {
          question: 'Does Moklu upload my photos or ID cards to a server?',
          answer:
            'No. All six quick tools and Moklu Studio execute locally inside your browser using HTML5 Canvas and client-side JavaScript. Zero image files are sent to any server.',
        },
        {
          question: 'How can I verify that Moklu never uploads files?',
          answer:
            'Open your browser Developer Tools Network panel while processing images, or disconnect Wi-Fi after loading the page. You can also inspect the source code at https://github.com/imwarn/moklu.',
        },
      ],
    },
    terms: {
      navLabel: 'Terms of Use',
      title: 'Terms of Use | Open-Source Local Image Toolkit | Moklu',
      metaDescription:
        'Terms of use for Moklu (moklu.app): free local browser tools without watermarks, MIT open-source licensing, user content ownership, and service boundaries.',
      badge: 'Terms & License',
      h1: 'Moklu Terms of Use & Open-Source License',
      subtitle:
        'Simple, transparent terms for using Moklu at moklu.app. You keep 100% ownership of everything you create, and core browser tools remain free without watermarks.',
      steps: [
        {
          title: 'Full ownership of outputs',
          description: 'You retain all rights to screenshots, merged images, PDFs, and mockups exported with Moklu.',
        },
        {
          title: 'MIT open-source software',
          description: 'Moklu source code is distributed under the MIT license on GitHub without warranty.',
        },
        {
          title: 'Responsible local usage',
          description: 'Ensure you hold the necessary rights to any images or documents you edit in your browser.',
        },
      ],
      highlights: [
        {
          title: 'No hidden watermarks',
          description: 'Standard exports from all six quick tools and Studio carry zero forced Moklu watermarks.',
        },
        {
          title: 'Provided as-is',
          description: 'Like all MIT-licensed software, Moklu is provided as-is; keep backups of important source files.',
        },
        {
          title: 'Browser-bound limits',
          description: 'Export ceiling (8192px / 64MP) protects browser stability across desktop and mobile hardware.',
        },
      ],
      faqs: [
        {
          question: 'Can I use Moklu outputs for commercial projects?',
          answer:
            'Yes. You retain 100% ownership of the images, mockups, and single-page PDFs you create with Moklu and may use them in personal or commercial work.',
        },
        {
          question: 'What license covers the Moklu codebase?',
          answer:
            'Moklu is open source under the MIT license at https://github.com/imwarn/moklu, built upon PixelDeck with original Moklu tools and browser frame assets.',
        },
      ],
    },
  },
  zh: {
    about: {
      navLabel: '关于 Moklu',
      title: '关于 Moklu | 纯本地开源截图套壳与在线图片拼接工具箱',
      metaDescription:
        'Moklu（moklu.app）是一款开源、100% 浏览器本地运行的视觉工作台，提供在线图片拼接、浏览器与 iPhone 套壳、轮播九宫格切图、压缩转 WebP、改尺寸与身份证 A4 水印。',
      badge: '关于 Moklu',
      h1: '关于 Moklu 纯本地视觉工具箱',
      subtitle:
        'Moklu（https://moklu.app）是一款开源、本地优先的浏览器图片工具箱与多图层样机工作室。所有在线图片拼接、截图套壳、切图、压缩、改尺寸与身份证水印均在你的设备浏览器内完成。',
      steps: [
        {
          title: '打开即用，免登录',
          description: '访问 moklu.app 或任一专题工具页即可直接拖入或粘贴图片处理，无需注册账号。',
        },
        {
          title: 'HTML5 Canvas 本地计算',
          description: '全部像素合成、压缩、PDF 封装与水印渲染均在本地标签页内执行，原图不经过服务器。',
        },
        {
          title: '开源可审计',
          description: '完整源码托管于 GitHub（github.com/imwarn/moklu），采用 MIT 协议开源。',
        },
      ],
      highlights: [
        {
          title: '零上传本地架构',
          description: '图片数据仅停留在你的设备内存中，页面加载完成后即使断开网络也能继续使用全部本地工具。',
        },
        {
          title: '六大工具 + Studio 联动',
          description: '日常快速工具与 Konva 多图层 Studio 画布无缝衔接，满足从快速拼图到应用商店多语言出图的全流程。',
        },
        {
          title: 'MIT 开源透明',
          description: '所有处理引擎、CSP 策略与静态构建脚本均可在 GitHub 公开查验。',
        },
      ],
      faqs: [
        {
          question: 'Moklu（moklu.app）是什么？',
          answer:
            'Moklu 是位于 https://moklu.app 的免费开源浏览器本地图片工具集，覆盖在线图片拼接（横向/竖向/2–6 列宫格/单页 PDF）、浏览器与手机样机套壳、小红书与 IG 无缝轮播/九宫格切图、批量压缩转 WebP、尺寸裁剪加白边以及身份证 A4 防盗水印。',
        },
        {
          question: '在哪里可以查看 Moklu 的开源代码？',
          answer:
            '完整源码已基于 MIT 协议公开在 https://github.com/imwarn/moklu，欢迎审计、反馈问题或提交改进。',
        },
      ],
    },
    privacy: {
      navLabel: '隐私说明',
      title: '隐私说明 | 100% 本地零上传架构 | Moklu',
      metaDescription:
        'Moklu 如何保护你的图片与证件隐私：100% 浏览器 HTML5 Canvas 本地处理、零服务器上传、严格 CSP 安全头与开源代码可验证。',
      badge: '隐私与安全',
      h1: 'Moklu 隐私说明与零上传架构',
      subtitle:
        'Moklu 的全部图片拼接、套壳、压缩、裁剪与身份证水印功能均在你的浏览器本地执行，不上传、不存储、不记录任何用户的图片数据。',
      steps: [
        {
          title: '本地内存读取',
          description: '你选择或粘贴的图片仅通过浏览器 FileReader 与 Object URL 在本机内存中解码。',
        },
        {
          title: '本机 Canvas 渲染',
          description: '拼接、压缩、单页 PDF 生成与防盗水印均在客户端 Canvas 2D 中完成。',
        },
        {
          title: '关闭即释放',
          description: '关闭或刷新页面后，快速工具的临时图片缓存会随浏览器内存立即回收。',
        },
      ],
      highlights: [
        {
          title: '无图片上传接口',
          description: 'Moklu 未部署任何后端图片接收服务，你可随时在浏览器 Network 面板核验零网络传输。',
        },
        {
          title: '严格 CSP 防护',
          description: '生产站点配置严格 Content-Security-Policy，阻止未授权脚本执行与数据外发。',
        },
        {
          title: '配置仅存本机',
          description: '浅深色主题与 Studio 项目草稿仅保存在你的浏览器 localStorage 与 IndexedDB 中。',
        },
      ],
      faqs: [
        {
          question: '使用 Moklu 处理照片或身份证时，图片会上传到服务器吗？',
          answer:
            '不会。Moklu 所有六款快速工具与 Studio 均基于本地 HTML5 Canvas 与前端脚本运行，没有任何图片字节会被发送到服务器。',
        },
        {
          question: '如何自行验证 Moklu 确实零上传？',
          answer:
            '打开浏览器的开发者工具 Network（网络）面板观察处理过程，或在打开页面后断开 Wi-Fi 继续拼图、压图或制作证件水印；也可直接在 https://github.com/imwarn/moklu 审计全部源码。',
        },
      ],
    },
    terms: {
      navLabel: '使用条款',
      title: '使用条款 | 开源纯本地图片工具箱 | Moklu',
      metaDescription:
        'Moklu（moklu.app）使用条款：核心浏览器工具免费无水印、用户对导出作品拥有完整版权、MIT 开源许可与能力边界说明。',
      badge: '条款与许可',
      h1: 'Moklu 使用条款与开源许可',
      subtitle:
        '清晰透明的 Moklu 使用约定：你对自己制作并导出的全部图片与 PDF 拥有 100% 版权，基础浏览器工具永久免费、不加水印。',
      steps: [
        {
          title: '完整作品归属',
          description: '通过 Moklu 导出的拼图、套壳图、单页 PDF 与压缩图片，版权完全归你本人或所属组织所有。',
        },
        {
          title: 'MIT 开源许可',
          description: 'Moklu 代码遵循 MIT 开源协议发布于 GitHub，按现状提供，不附带额外商业担保。',
        },
        {
          title: '合法合规使用',
          description: '请确保你对输入处理的图片、截图与证件拥有合法使用权限，并自行留存原始文件备份。',
        },
      ],
      highlights: [
        {
          title: '标准导出零水印',
          description: '全部六大快速工具与 Studio 标准导出均不添加 Moklu 强制水印，可直接用于个人或商业场景。',
        },
        {
          title: '明确的技术边界',
          description: '单张拼图输出安全上限为 8192px / 64MP，超限时自动等比缩放并明确提示，保障浏览器不崩溃。',
        },
        {
          title: '无绑定账号风险',
          description: '基础工具无需登录注册，也不收集用户邮箱、手机号或图片素材。',
        },
      ],
      faqs: [
        {
          question: '使用 Moklu 导出的图片和 PDF 可以商用吗？',
          answer:
            '可以。你对自己通过 Moklu 生成的全部图片、样机和单页 PDF 享有完整所有权，可直接用于商业项目、应用商店发布与社媒内容。',
        },
        {
          question: 'Moklu 采用什么开源协议？',
          answer:
            'Moklu 代码采用 MIT 协议开源于 https://github.com/imwarn/moklu，基于 PixelDeck 衍生并新增了全套 Moklu 浏览器工具与样机资源。',
        },
      ],
    },
  },
  ja: {
    about: {
      navLabel: 'Moklu について',
      title: 'Moklu について | 完全ローカルのオープンソース画像・モックアップツール',
      metaDescription:
        'Moklu（moklu.app）は、ブラウザ内 HTML5 Canvas で完結するオープンソースのモックアップ＆画像処理ツールキットです。画像結合・分割・圧縮・リサイズ・身分証透かしに対応。',
      badge: 'Moklu について',
      h1: 'Moklu について（完全ローカル画像ツール）',
      subtitle:
        'Moklu（https://moklu.app）は、スクリーンショットのモックアップ作成、オンライン画像結合、カルーセル分割、圧縮・形式変換、リサイズ、身分証 A4 透かしを 100% ブラウザ内で実行するオープンソース Web アプリです。',
      steps: [
        {
          title: '登録不要ですぐ利用',
          description: 'moklu.app を開くだけで、アカウント作成やアップロード待ちなしに作業を開始できます。',
        },
        {
          title: 'ブラウザ内 Canvas で処理',
          description: '画像結合・PDF 生成・圧縮・透かし処理はすべて端末のブラウザメモリ内で完結します。',
        },
        {
          title: 'MIT オープンソース',
          description: 'ソースコードは GitHub（github.com/imwarn/moklu）で公開されており、誰でも検証できます。',
        },
      ],
      highlights: [
        {
          title: 'ゼロアップロード設計',
          description: '画像ファイルは一切外部サーバーへ送信されず、ページ読み込み後はオフラインでも動作します。',
        },
        {
          title: '6 つのクイックツール + Studio',
          description: '日常の画像ユーティリティと Konva ベースの多層レイアウト Studio を 1 つのワークフローで連携できます。',
        },
        {
          title: 'オープンソースで透明性を担保',
          description: 'MIT ライセンスのもと、画像エンジンとビルド構成をすべて公開しています。',
        },
      ],
      faqs: [
        {
          question: 'Moklu（moklu.app）とは何ですか？',
          answer:
            'Moklu は https://moklu.app で提供されている無料・オープンソースのローカル画像ツール集です。ブラウザ／端末モックアップ、オンライン画像結合（横・縦・2〜6 列グリッド・単ページ PDF）、分割、圧縮・WebP 変換、リサイズ、身分証 A4 透かしに対応しています。',
        },
        {
          question: 'ソースコードはどこで確認できますか？',
          answer:
            'すべてのソースコードは MIT ライセンスで https://github.com/imwarn/moklu に公開されています。',
        },
      ],
    },
    privacy: {
      navLabel: 'プライバシーポリシー',
      title: 'プライバシーポリシー | 完全ローカル・ゼロアップロード設計 | Moklu',
      metaDescription:
        'Moklu のプライバシー保護方針：100% クライアント側 HTML5 Canvas 処理、サーバーへの画像送信ゼロ、厳格な CSP ヘッダーとオープンソース監査。',
      badge: 'プライバシーとセキュリティ',
      h1: 'Moklu プライバシーポリシー（送信ゼロ設計）',
      subtitle:
        'Moklu はすべてのスクリーンショット、写真、身分証画像をブラウザ内でローカル処理します。画像データをサーバーへ送信・保存・記録することは一切ありません。',
      steps: [
        {
          title: 'ブラウザメモリ内で読み込み',
          description: 'ドロップまたは貼り付けた画像は、端末のブラウザ RAM 上でのみデコードされます。',
        },
        {
          title: '端末内 Canvas レンダリング',
          description: '結合、モックアップ合成、圧縮、単ページ PDF、透かし描画はすべてローカルで実行されます。',
        },
        {
          title: 'タブを閉じると即時解放',
          description: 'クイックツールの一時データは大元のタブを閉じるだけでメモリから解放されます。',
        },
      ],
      highlights: [
        {
          title: '画像アップロード API なし',
          description: 'Moklu に画像を送信するバックエンドは存在せず、ブラウザの Network タブでゼロ送信を確認できます。',
        },
        {
          title: '厳格な CSP ヘッダー',
          description: '本番環境では厳格な Content-Security-Policy により不正な外部通信やスクリプト実行を遮断します。',
        },
        {
          title: '設定は端末内のみ保存',
          description: 'テーマ設定や Studio プロジェクトはブラウザの localStorage / IndexedDB にのみ保存されます。',
        },
      ],
      faqs: [
        {
          question: '写真や身分証のデータがサーバーに送信されることはありますか？',
          answer:
            'ありません。全 6 種のクイックツールと Studio はブラウザ内 HTML5 Canvas でローカル動作し、画像データが外部送信されることはありません。',
        },
        {
          question: '本当にアップロードされないことを確認できますか？',
          answer:
            '開発者ツールの Network タブを確認するか、ページ表示後に Wi-Fi をオフにしてお試しください。ソースコードも https://github.com/imwarn/moklu で公開しています。',
        },
      ],
    },
    terms: {
      navLabel: '利用規約',
      title: '利用規約 | オープンソース・ローカル画像ツール | Moklu',
      metaDescription:
        'Moklu（moklu.app）の利用規約：透かしなしの無料ローカル処理、出力データの権利帰属、MIT ライセンス、動作上限について。',
      badge: '利用規約とライセンス',
      h1: 'Moklu 利用規約とオープンソースライセンス',
      subtitle:
        'Moklu（moklu.app）を安心してご利用いただくためのシンプルな規約です。作成した画像や PDF の権利は 100% ユーザーに帰属し、基本ツールは透かしなしで無料です。',
      steps: [
        {
          title: '出力物の完全な権利',
          description: 'Moklu で作成した画像・モックアップ・単ページ PDF の権利はすべて作成者本人に帰属します。',
        },
        {
          title: 'MIT オープンソース提供',
          description: 'ソースコードは GitHub 上で MIT ライセンスにより現状のまま提供されます。',
        },
        {
          title: '適切な利用とバックアップ',
          description: '処理する画像・文書の権利をご確認のうえ、大切な元ファイルは端末に保管してください。',
        },
      ],
      highlights: [
        {
          title: '強制透かしなし',
          description: '基本ブラウザツールの通常書き出しに Moklu の強制透かしは入りません。商用利用も可能です。',
        },
        {
          title: '安全な解像度上限',
          description: 'ブラウザ安定性のため出力上限は 8192px / 64MP となっており、超過時は自動リサイズと通知を行います。',
        },
        {
          title: 'アカウント登録不要',
          description: '基本機能はログインや個人情報の登録なしで利用できます。',
        },
      ],
      faqs: [
        {
          question: 'Moklu で書き出した画像や PDF は商用利用できますか？',
          answer:
            'はい。作成した画像、モックアップ、単ページ PDF の権利は 100% お客様に帰属し、個人・商用どちらでも自由に利用できます。',
        },
        {
          question: 'Moklu のコードライセンスは何ですか？',
          answer:
            'https://github.com/imwarn/moklu にて MIT ライセンスで公開されています。',
        },
      ],
    },
  },
  ko: {
    about: {
      navLabel: 'Moklu 소개',
      title: 'Moklu 소개 | 오픈소스 로컬 브라우저 목업 및 이미지 도구 모음',
      metaDescription:
        'Moklu(moklu.app)는 브라우저 HTML5 Canvas에서 100% 로컬로 작동하는 오픈소스 목업 스튜디오 및 이미지 도구 모음입니다. 이미지 합치기, 분할, 압축, 리사이즈, 신분증 워터마크를 지원합니다.',
      badge: 'Moklu 소개',
      h1: 'Moklu 소개 및 로컬 아키텍처',
      subtitle:
        'Moklu(https://moklu.app)는 스크린샷 목업, 온라인 이미지 합치기, 캐러셀 분할, 이미지 압축, 크기 조절, 신분증 A4 워터마크를 브라우저 안에서 100% 로컬로 실행하는 오픈소스 웹 도구입니다.',
      steps: [
        {
          title: '회원가입 없이 바로 실행',
          description: 'moklu.app 또는 각 도구 페이지에 접속해 이미지를 끌어놓거나 붙여넣으면 즉시 처리됩니다.',
        },
        {
          title: 'HTML5 Canvas 로컬 처리',
          description: '이미지 병합, 단일 페이지 PDF 생성, 압축, 워터마크까지 모두 내 기기 브라우저에서 실행됩니다.',
        },
        {
          title: 'MIT 오픈소스 공개',
          description: '전체 소스코드는 GitHub(github.com/imwarn/moklu)에 MIT 라이선스로 공개되어 있습니다.',
        },
      ],
      highlights: [
        {
          title: '서버 업로드 제로 아키텍처',
          description: '이미지가 기기 메모리를 벗어나지 않으며, 페이지 로드 후 오프라인 상태에서도 정상 작동합니다.',
        },
        {
          title: '6가지 빠른 도구 + Studio',
          description: '일상적인 이미지 유틸리티와 Konva 기반 멀티 레이어 Studio를 하나의 워크스페이스에서 연결합니다.',
        },
        {
          title: '투명한 오픈소스 검증',
          description: '이미지 처리 엔진과 CSP 보안 정책을 GitHub에서 누구나 직접 감사할 수 있습니다.',
        },
      ],
      faqs: [
        {
          question: 'Moklu(moklu.app)는 어떤 서비스인가요?',
          answer:
            'Moklu는 https://moklu.app 에서 제공하는 무료 오픈소스 로컬 이미지 도구 모음입니다. 브라우저·디바이스 목업, 온라인 이미지 합치기(가로·세로·2~6열 그리드·단일 페이지 PDF), 분할, 압축 및 WebP 변환, 리사이즈, 오프라인 신분증 A4 워터마크를 지원합니다.',
        },
        {
          question: '소스코드는 어디에서 볼 수 있나요?',
          answer:
            '전체 소스코드는 MIT 라이선스로 https://github.com/imwarn/moklu 에 공개되어 있습니다.',
        },
      ],
    },
    privacy: {
      navLabel: '개인정보 처리방침',
      title: '개인정보 처리방침 | 100% 로컬 무업로드 아키텍처 | Moklu',
      metaDescription:
        'Moklu의 이미지 보안 원칙: 100% 클라이언트 HTML5 Canvas 처리, 서버 업로드 제로, 엄격한 CSP 보안 헤더, 오픈소스 검증 가능.',
      badge: '프라이버시 & 보안',
      h1: 'Moklu 개인정보 처리방침 및 무업로드 설계',
      subtitle:
        'Moklu는 모든 스크린샷, 사진, 신분증 이미지를 브라우저 탭 내부에서 100% 로컬로 처리합니다. 어떠한 이미지 데이터도 원격 서버로 업로드하거나 저장하지 않습니다.',
      steps: [
        {
          title: '로컬 메모리 디코딩',
          description: '선택하거나 붙여넣은 파일은 브라우저 RAM 안에서 FileReader와 Object URL로만 읽힙니다.',
        },
        {
          title: '기기 내 Canvas 렌더링',
          description: '이미지 합치기, 압축, 단일 페이지 PDF, 워터마크 모두 로컬 HTML5 Canvas에서 렌더링됩니다.',
        },
        {
          title: '탭 종료 시 즉시 해제',
          description: '탭을 닫거나 새로고침하면 빠른 도구의 임시 이미지 버퍼는 즉시 메모리에서 해제됩니다.',
        },
      ],
      highlights: [
        {
          title: '이미지 업로드 서버 없음',
          description: 'Moklu는 이미지 업로드 백엔드가 없으며, 브라우저 Network 탭에서 전송 0바이트를 직접 확인할 수 있습니다.',
        },
        {
          title: '엄격한 CSP 보안 정책',
          description: '배포 환경에 엄격한 Content-Security-Policy 헤더를 적용해 비인가 외부 스크립트와 유출을 차단합니다.',
        },
        {
          title: '설정은 로컬에만 저장',
          description: '테마 설정과 Studio 프로젝트는 사용자의 브라우저 localStorage 및 IndexedDB에만 저장됩니다.',
        },
      ],
      faqs: [
        {
          question: '사진이나 신분증 이미지가 서버로 전송되나요?',
          answer:
            '아니요. 6가지 빠른 도구와 Studio 모두 브라우저 HTML5 Canvas에서 로컬로 실행되며 어떤 파일도 서버로 전송되지 않습니다.',
        },
        {
          question: '서버 업로드가 없다는 점을 직접 확인할 수 있나요?',
          answer:
            '브라우저 개발자 도구의 Network 패널을 확인하거나, 페이지가 열린 뒤 네트워크를 끊고 사용해 보세요. 전체 소스코드도 https://github.com/imwarn/moklu 에서 확인할 수 있습니다.',
        },
      ],
    },
    terms: {
      navLabel: '이용약관',
      title: '이용약관 | 오픈소스 로컬 이미지 도구 모음 | Moklu',
      metaDescription:
        'Moklu(moklu.app) 이용약관: 워터마크 없는 무료 기본 도구, 결과물 소유권 보장, MIT 오픈소스 라이선스 및 브라우저 안전 한계 안내.',
      badge: '이용약관 & 라이선스',
      h1: 'Moklu 이용약관 및 오픈소스 라이선스',
      subtitle:
        '명확하고 투명한 Moklu 이용 약관입니다. Moklu로 만든 모든 이미지와 PDF의 소유권은 100% 사용자에게 있으며, 기본 브라우저 도구는 워터마크 없이 무료입니다.',
      steps: [
        {
          title: '결과물 소유권 100% 보장',
          description: 'Moklu에서 내보낸 목업, 병합 이미지, 단일 페이지 PDF의 권리는 모두 사용자에게 귀속됩니다.',
        },
        {
          title: 'MIT 오픈소스 제공',
          description: 'Moklu 코드는 GitHub에서 MIT 라이선스로 있는 그대로 제공됩니다.',
        },
        {
          title: '책임 있는 로컬 사용',
          description: '편집하는 이미지와 문서의 권리를 확인하고 중요한 원본 파일은 별도로 백업해 두세요.',
        },
      ],
      highlights: [
        {
          title: '강제 워터마크 없음',
          description: '6가지 기본 도구와 Studio 표준 내보내기에는 강제 워터마크가 붙지 않으며 상업적 용도로도 사용할 수 있습니다.',
        },
        {
          title: '안전 해상도 한도',
          description: '브라우저 안정성을 위해 최대 8192px / 64MP 안전 한도를 두며, 초과 시 자동 비례 축소 및 안내를 표시합니다.',
        },
        {
          title: '계정 등록 불필요',
          description: '기본 이미지 도구는 회원가입이나 개인정보 입력 없이 바로 사용할 수 있습니다.',
        },
      ],
      faqs: [
        {
          question: 'Moklu로 만든 이미지와 PDF를 상업적으로 사용해도 되나요?',
          answer:
            '네. Moklu로 생성한 모든 이미지, 목업, 단일 페이지 PDF의 소유권은 100% 사용자에게 있으며 개인·상업 프로젝트 모두 자유롭게 사용할 수 있습니다.',
        },
        {
          question: 'Moklu 코드베이스의 라이선스는 무엇인가요?',
          answer:
            'Moklu는 https://github.com/imwarn/moklu 에서 MIT 라이선스로 공개된 오픈소스 프로젝트입니다.',
        },
      ],
    },
  },
}
