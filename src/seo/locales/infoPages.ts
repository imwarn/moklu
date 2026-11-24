/**
 * [INPUT]: depends on InfoPageSlug and LocaleCode types from ../types.ts
 * [OUTPUT]: exports InfoPageSection, InfoPageDocument, and getInfoPageDocument() for /about, /privacy, and /terms across EN/ZH/JA/KO
 * [POS]: structured editorial document provider for trust info pages within src/seo/locales, consumed by src/seo/InfoPageContent.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { InfoPageSlug, LocaleCode } from '../types.ts'

export interface InfoPageSection {
  heading: string
  body: string
  bullets?: readonly string[]
}

export interface InfoPageDocument {
  eyebrowLabel: string
  summary: string
  updatedDate: string
  sections: readonly InfoPageSection[]
  githubCtaLabel: string
  backToToolsLabel: string
}

const INFO_DOCUMENTS: Record<LocaleCode, Record<InfoPageSlug, InfoPageDocument>> = {
  en: {
    about: {
      eyebrowLabel: 'Entity & Architecture',
      summary:
        'Moklu (https://moklu.app) is a local-first browser mockup studio and image utility suite. Unlike cloud editors that queue uploads on remote servers, Moklu runs every operation locally on your device via HTML5 Canvas.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'Inspect source on GitHub',
      backToToolsLabel: 'Back to all tools',
      sections: [
        {
          heading: 'What Moklu does',
          body: 'Moklu combines six instant browser image utilities with a full multi-layer canvas editor (Moklu Studio) in one privacy-first web app.',
          bullets: [
            'Screenshot Mockups: Chrome, Safari, minimal browser windows, iPhone 16 Pro, Pixel 9, and App Store 9:16 frames.',
            'Online Image Merger: Horizontal, vertical, and 2–6 column grid layouts with cover/contain fit, custom color picker, borders, drag-and-drop reorder, 90° rotation, clipboard copy, and single-page PDF 1.4 export.',
            'Carousel & Grid Splitter: Pixel-aligned panorama carousel slices and 3×3 or custom matrix splits with 1-click ZIP export.',
            'Local Batch Compressor & Format Converter: PNG, JPEG, and WebP conversion and compression with before/after byte counters.',
            'Resizer, Cropper & Photo Border Pad: Exact dimensions, scale %, social aspect ratios, and gallery borders without cropping.',
            'Offline ID Card Watermark Maker: ISO/IEC 7810 ID-1 physical-scale A4 layouts with diagonal anti-fraud watermarks.',
          ],
        },
        {
          heading: 'Local-first zero-upload architecture',
          body: 'Every quick tool runs in browser RAM using HTML5 Canvas 2D and standard Web APIs. There is no server-side image processing pipeline, no file retention policy to trust blindly, and no account wall.',
        },
        {
          heading: 'Open-source governance & identity',
          body: 'Moklu (moklu.app) is developed openly at https://github.com/imwarn/moklu under the MIT license, originating from PixelDeck with original Moklu browser frames, quick tools, and multilingual SSG pages. It is an independent developer tool and is unrelated to any third-party gaming domains.',
        },
      ],
    },
    privacy: {
      eyebrowLabel: 'Zero-Upload Guarantee',
      summary:
        'Your files stay on your device. Moklu executes all image decoding, compositing, compression, PDF packaging, and watermarking locally inside your browser.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'Audit privacy in source code',
      backToToolsLabel: 'Back to all tools',
      sections: [
        {
          heading: 'No server-side image uploads',
          body: 'When you drop, select, or paste images into Moklu, the browser reads them directly in local memory. Moklu does not transmit image bytes, EXIF metadata, or ID documents over the network.',
          bullets: [
            'Verify in DevTools: Open the Network tab while merging, compressing, or watermarking; zero image requests occur.',
            'Verify offline: Load any Moklu tool page, disconnect Wi-Fi, and run the full workflow locally.',
          ],
        },
        {
          heading: 'Local browser storage',
          body: 'Moklu uses browser localStorage solely for UI preferences (such as Light/Dark theme) and browser IndexedDB only when you explicitly create and save multi-layer projects inside Moklu Studio. Clearing browser site data removes all stored projects immediately.',
        },
        {
          heading: 'Content Security Policy & open audit',
          body: 'Production deployments enforce strict CSP headers (public/_headers) to restrict script origins and prevent unauthorized data exfiltration. The full source code is publicly auditable on GitHub.',
        },
      ],
    },
    terms: {
      eyebrowLabel: 'Clear Usage Terms',
      summary:
        'Use Moklu freely for personal and commercial work. You own 100% of your exported files, and standard browser exports never carry forced watermarks.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'View MIT license on GitHub',
      backToToolsLabel: 'Back to all tools',
      sections: [
        {
          heading: 'Ownership of your content',
          body: 'Because Moklu processes files exclusively on your machine, Moklu never claims rights, licenses, or copies of your screenshots, photos, PDFs, or documents.',
        },
        {
          heading: 'MIT open-source software disclaimer',
          body: 'Moklu is provided under the MIT license "as is", without warranty of any kind. Always retain copies of critical original files before batch processing or printing.',
        },
        {
          heading: 'Technical capability boundaries',
          body: 'To keep browser tabs stable across desktop and mobile devices, merged outputs enforce an 8192px / 64MP safety ceiling with automatic proportional scaling and clear UI indicators. Single-page PDF export packages a merged image into a single PDF 1.4 page and is not a multi-page PDF document merger.',
        },
      ],
    },
  },
  zh: {
    about: {
      eyebrowLabel: '产品定位与本地架构',
      summary:
        'Moklu（https://moklu.app）是一款开源、本地优先的浏览器截图套壳与在线图片工具箱。所有图像处理均通过 HTML5 Canvas 在你的本机浏览器中完成，无需上传服务器，无需注册账号。',
      updatedDate: '2026-11-24',
      githubCtaLabel: '前往 GitHub 审阅源码',
      backToToolsLabel: '返回全部工具',
      sections: [
        {
          heading: 'Moklu 提供哪些核心能力',
          body: 'Moklu 将六大高频纯本地图片处理工具与完整的 Konva 多图层 Studio 画布整合在同一个网页应用中：',
          bullets: [
            '在线图片拼接：支持横向并排、竖向长图、2–6 列宫格拼图、cover/contain 填充、拖拽排序、反转顺序、单图 90° 旋转、单图描边边框、自定义取色器、一键复制到剪贴板以及单页 PDF 1.4 导出。',
            '截图套壳与样机生成：支持 Chrome / Safari 浏览器窗口、iPhone 16 Pro、Pixel 9 与 App Store 9:16 应用商店截图模板。',
            '轮播与九宫格切图：支持小红书与 Instagram 无缝全景轮播切图、3×3 九宫格及自定义行列切图，一键打包 ZIP。',
            '批量图片压缩与格式转换：支持 PNG / JPEG / WebP 本地互转与质量控制，实时显示压缩前后体积对比。',
            '缩放、裁剪与加白边：支持精确像素与百分比缩放、社媒比例裁剪，以及不裁剪留白加边框。',
            '纯离线身份证 A4 防盗水印：严格遵循 ISO/IEC 7810 ID-1 物理尺寸排版，并叠加可自定义斜向防盗水印。',
          ],
        },
        {
          heading: '100% 本地零上传架构',
          body: '所有快速工具都在浏览器内存与 HTML5 Canvas 2D 中执行，没有云端图片上传接口，也没有服务器排队等待。加载页面后即使断开网络，依然可以完成全部本地处理。',
        },
        {
          heading: '开源治理与品牌说明',
          body: 'Moklu（moklu.app）在 https://github.com/imwarn/moklu 基于 MIT 协议开源，衍生自 PixelDeck 并新增了全套 Moklu 本地图片工具、浏览器样机与多语言 SSG 页面。Moklu 是独立的开源视觉工具，与任何同名第三方游戏站点无关。',
        },
      ],
    },
    privacy: {
      eyebrowLabel: '零上传隐私承诺',
      summary:
        '你的图片永远留在你的设备里。Moklu 在浏览器本地完成全部解码、拼图、压缩、单页 PDF 封装与防盗水印，不向任何远程服务器上传图片数据。',
      updatedDate: '2026-11-24',
      githubCtaLabel: '在 GitHub 审计隐私实现',
      backToToolsLabel: '返回全部工具',
      sections: [
        {
          heading: '零服务器图片上传',
          body: '当你拖入、选择或粘贴图片到 Moklu 时，浏览器仅在本地内存中读取文件。图片字节、拍摄元数据与证件信息均不会通过网络发出。',
          bullets: [
            'Network 面板自检：打开开发者工具 Network 面板处理图片，可验证无任何图片上传请求。',
            '断网离线验证：打开任意工具页面后断开 Wi-Fi，仍可完整执行拼接、压缩与身份证水印导出。',
          ],
        },
        {
          heading: '浏览器本地存储边界',
          body: 'Moklu 仅使用 localStorage 保存浅深色主题等界面偏好，仅在你主动使用 Studio 编辑器保存项目时使用浏览器 IndexedDB。清除浏览器站点数据即可立即删除全部本地草稿。',
        },
        {
          heading: '严格 CSP 与开源审计',
          body: '生产环境通过严格的 Content-Security-Policy 响应头限制脚本来源并防范数据外发。所有构建配置与前端引擎均在 GitHub 公开可查。',
        },
      ],
    },
    terms: {
      eyebrowLabel: '透明使用条款',
      summary:
        'Moklu 核心浏览器工具面向个人与商业场景免费开放，标准导出不加任何水印，你对自己生成的作品拥有 100% 版权。',
      updatedDate: '2026-11-24',
      githubCtaLabel: '查看 GitHub MIT 协议',
      backToToolsLabel: '返回全部工具',
      sections: [
        {
          heading: '内容所有权',
          body: '由于所有处理均在你的设备本地完成，Moklu 不会获取你的图片副本，也不对你的截图、拼图、PDF 或证件文件主张任何权利。',
        },
        {
          heading: 'MIT 开源免责说明',
          body: 'Moklu 代码遵循 MIT 协议按现状提供，不附带明示或默示担保。批量处理或打印重要资料前，请自行保留原始文件备份。',
        },
        {
          heading: '明确的能力边界',
          body: '为防止浏览器内存溢出，拼图画布设置 8192px / 64MP 安全上限，超限时自动等比缩放并在界面明确提示；PDF 导出用于将拼接成品封装为单页 PDF 1.4 文件，不支持多页 PDF 文档合并；长图拼接不包含自动去重叠功能。',
        },
      ],
    },
  },
  ja: {
    about: {
      eyebrowLabel: 'プロダクトとローカル設計',
      summary:
        'Moklu（https://moklu.app）は、ブラウザ内 HTML5 Canvas で完結するオープンソースのモックアップ＆画像処理ワークベンチです。アップロードもログインも不要で、すべての処理を端末内で実行します。',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub でソースを確認',
      backToToolsLabel: '全ツール一覧へ戻る',
      sections: [
        {
          heading: 'Moklu でできること',
          body: '6 つの高速ブラウザ画像ツールと、Konva ベースの多層キャンバスエディタ（Moklu Studio）を 1 つのアプリに統合しています。',
          bullets: [
            'オンライン画像結合：横並び・縦結合・2〜6 列グリッド、cover/contain 切替、ドラッグ並び替え、順序反転、90° 回転、枠線、カスタムカラー、クリップボードコピー、単ページ PDF 1.4 出力に対応。',
            'モックアップ生成：Chrome・Safari・ミニマルブラウザ枠、iPhone 16 Pro、Pixel 9、App Store 9:16 枠を即座に適用。',
            'カルーセル＆グリッド分割：SNS 向けシームレス分割や 3×3 / 自由行列分割を ZIP で一括出力。',
            'ローカル一括圧縮＆形式変換：PNG / JPEG / WebP の相互変換と容量削減をブラウザ内で完結。',
            'リサイズ・切り抜き・白枠追加：正確なピクセル指定、SNS 比率、余白パディングに対応。',
            '完全オフライン身分証 A4 透かし：ISO/IEC 7810 ID-1 実寸レイアウトと斜め不正利用防止透かしを作成。',
          ],
        },
        {
          heading: 'ゼロアップロード設計',
          body: 'すべてのクイックツールはブラウザの RAM と HTML5 Canvas 2D 上で実行されます。画像送信 API は存在せず、ページ表示後はオフラインでも動作します。',
        },
        {
          heading: 'オープンソースと識別情報',
          body: 'Moklu（moklu.app）は https://github.com/imwarn/moklu で MIT ライセンスのもと公開されている独立した開発者向け画像ツールです。',
        },
      ],
    },
    privacy: {
      eyebrowLabel: 'ゼロアップロード保証',
      summary:
        '画像は端末の外へ出ません。Moklu は読み込み、結合、圧縮、単ページ PDF 生成、透かし描画まですべてブラウザ内でローカル実行します。',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub で実装を監査',
      backToToolsLabel: '全ツール一覧へ戻る',
      sections: [
        {
          heading: 'サーバーへの画像送信ゼロ',
          body: 'ドロップまたは貼り付けた画像はブラウザ内メモリでのみ処理され、画像データや身分証情報が外部へ送信されることはありません。',
          bullets: [
            'Network タブで確認：画像処理中に外部アップロード通信が一切発生しないことを確認できます。',
            'オフライン検証：ページを開いた状態で Wi-Fi を切っても、結合や透かし作成が動作します。',
          ],
        },
        {
          heading: 'ローカルストレージの範囲',
          body: 'localStorage はテーマ設定の保存のみに使用し、IndexedDB は Moklu Studio のプロジェクト保存時のみ使用します。ブラウザのサイトデータ消去で即時削除できます。',
        },
        {
          heading: '厳格な CSP と公開監査',
          body: '本番環境では厳格な Content-Security-Policy ヘッダーを適用し、未許可スクリプトやデータ送信を防止しています。',
        },
      ],
    },
    terms: {
      eyebrowLabel: 'シンプルな利用規約',
      summary:
        '個人・商用を問わず無料で利用できます。出力した画像と PDF の権利は 100% お客様に帰属し、通常出力に強制透かしは入りません。',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub で MIT ライセンスを見る',
      backToToolsLabel: '全ツール一覧へ戻る',
      sections: [
        {
          heading: 'コンテンツの所有権',
          body: 'ファイルはすべてお客様の端末内で処理されるため、Moklu がユーザーの画像や PDF の権利を主張することはありません。',
        },
        {
          heading: 'MIT オープンソース免責',
          body: '本ソフトウェアは MIT ライセンスに基づき現状のまま提供されます。重要な元画像は必ず端末にバックアップを保管してください。',
        },
        {
          heading: '技術的な動作範囲',
          body: 'ブラウザの安定動作のため結合出力は 8192px / 64MP を安全上限とし、超過時は自動縮小と通知を行います。PDF 出力は結合画像を単ページ PDF 1.4 に格納する仕様であり、複数ページ PDF の結合ツールではありません。',
        },
      ],
    },
  },
  ko: {
    about: {
      eyebrowLabel: '제품 정체성 & 로컬 아키텍처',
      summary:
        'Moklu(https://moklu.app)는 브라우저 HTML5 Canvas에서 100% 로컬로 실행되는 오픈소스 목업 스튜디오 및 이미지 도구 모음입니다. 서버 업로드나 회원가입 없이 바로 사용할 수 있습니다.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub에서 소스코드 보기',
      backToToolsLabel: '전체 도구로 돌아가기',
      sections: [
        {
          heading: 'Moklu가 제공하는 핵심 도구',
          body: '6가지 즉시 실행 브라우저 이미지 유틸리티와 Konva 멀티 레이어 에디터(Moklu Studio)를 하나의 로컬 워크스페이스에 통합했습니다.',
          bullets: [
            '온라인 이미지 합치기: 가로·세로·2~6열 그리드, cover/contain 채우기, 드래그 정렬, 순서 뒤집기, 90° 회전, 개별 테두리, 커스텀 색상 선택기, 클립보드 복사 및 단일 페이지 PDF 1.4 내보내기 지원.',
            '스크린샷 목업: Chrome·Safari·미니멀 브라우저 프레임, iPhone 16 Pro, Pixel 9, 앱스토어 9:16 레이아웃 제공.',
            '캐러셀 및 9분할 자르기: 인스타그램 심리스 파노라마 분할과 3×3·맞춤 격자 분할 및 ZIP 일괄 저장.',
            '로컬 일괄 압축 및 포맷 변환: PNG·JPEG·WebP 변환과 용량 절감 비교를 브라우저에서 즉시 처리.',
            '리사이즈·자르기·흰 테두리 추가: 정확한 픽셀 크기 조절, SNS 비율 자르기, 크롭 없는 여백 패딩 지원.',
            '오프라인 신분증 A4 워터마크: ISO/IEC 7810 ID-1 실물 규격 배치 및 대각선 도용 방지 워터마크 생성.',
          ],
        },
        {
          heading: '서버 업로드 제로 로컬 설계',
          body: '모든 빠른 도구는 브라우저 메모리와 HTML5 Canvas 2D에서 실행됩니다. 백엔드 업로드 서버가 없으며, 페이지를 연 뒤 오프라인 상태에서도 정상 작동합니다.',
        },
        {
          heading: '오픈소스 거버넌스',
          body: 'Moklu(moklu.app)는 https://github.com/imwarn/moklu 에서 MIT 라이선스로 공개 개발되는 독립 이미지 도구입니다.',
        },
      ],
    },
    privacy: {
      eyebrowLabel: '무업로드 보안 보장',
      summary:
        '파일은 내 기기를 떠나지 않습니다. Moklu는 디코딩, 병합, 압축, 단일 페이지 PDF 생성, 워터마크까지 모든 처리를 브라우저 로컬에서 수행합니다.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub에서 보안 구현 감사',
      backToToolsLabel: '전체 도구로 돌아가기',
      sections: [
        {
          heading: '이미지 서버 전송 제로',
          body: '이미지를 선택하거나 붙여넣어도 브라우저 로컬 메모리에서만 읽히며, 이미지 바이트나 신분증 정보는 네트워크로 전송되지 않습니다.',
          bullets: [
            'Network 탭 검증: 개발자 도구 Network 패널에서 이미지 업로드 요청이 0건임을 직접 확인할 수 있습니다.',
            '오프라인 검증: 도구 페이지를 연 뒤 Wi-Fi를 꺼도 병합, 압축, 워터마크 내보내기가 그대로 동작합니다.',
          ],
        },
        {
          heading: '브라우저 로컬 저장 범위',
          body: 'localStorage는 라이트/다크 테마 설정에만 사용하며, IndexedDB는 Moklu Studio 프로젝트를 직접 저장할 때만 사용합니다. 브라우저 사이트 데이터를 지우면 즉시 삭제됩니다.',
        },
        {
          heading: '엄격한 CSP 및 오픈소스 검증',
          body: '프로덕션 배포 시 엄격한 Content-Security-Policy 헤더를 적용해 비인가 스크립트와 데이터 유출을 차단합니다.',
        },
      ],
    },
    terms: {
      eyebrowLabel: '투명한 이용약관',
      summary:
        '개인 및 상업 용도로 자유롭게 사용할 수 있습니다. 내보낸 파일의 소유권은 100% 사용자에게 있으며, 기본 출력에 강제 워터마크가 없습니다.',
      updatedDate: '2026-11-24',
      githubCtaLabel: 'GitHub에서 MIT 라이선스 보기',
      backToToolsLabel: '전체 도구로 돌아가기',
      sections: [
        {
          heading: '콘텐츠 소유권',
          body: '모든 처리가 사용자 기기 내에서 이루어지므로 Moklu는 사용자가 만든 스크린샷, 병합 사진, PDF에 대해 어떠한 권리도 주장하지 않습니다.',
        },
        {
          heading: 'MIT 오픈소스 면책',
          body: 'Moklu 소프트웨어는 MIT 라이선스에 따라 있는 그대로 제공됩니다. 중요한 원본 파일은 작업 전 반드시 별도 백업을 유지하세요.',
        },
        {
          heading: '기술적 기능 경계',
          body: '브라우저 안정성을 위해 병합 출력은 8192px / 64MP 안전 한도를 적용하며 초과 시 자동 비례 축소 및 안내를 표시합니다. PDF 내보내기는 병합 이미지를 단일 페이지 PDF 1.4로 저장하며, 다중 페이지 PDF 문서 병합 도구가 아닙니다.',
        },
      ],
    },
  },
}

export function getInfoPageDocument(
  locale: LocaleCode,
  slug: InfoPageSlug,
): InfoPageDocument {
  const byLocale = INFO_DOCUMENTS[locale] ?? INFO_DOCUMENTS.en
  return byLocale[slug] ?? INFO_DOCUMENTS.en.about
}
