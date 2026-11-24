/**
 * [INPUT]: depends on LocaleBundle type from ../types.ts; depends on JA_TOOL_ROUTES from ./jaTools.ts and INFO_PAGE_ROUTES from ./infoRoutes.ts
 * [OUTPUT]: exports JA_LOCALE complete Japanese UI labels and 23 intent/info route copy entries
 * [POS]: Japanese (`/ja/...`) language pack within src/seo/locales, loaded by src/seo/i18n.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle } from '../types.ts'
import { JA_TOOL_ROUTES } from './jaTools.ts'
import { INFO_PAGE_ROUTES } from './infoRoutes.ts'

export const JA_LOCALE: LocaleBundle = {
  code: 'ja',
  nativeName: '日本語',
  shortLabel: '日本語',
  ogLocale: 'ja_JP',
  ui: {
    brandName: 'Moklu',
    brandTagline: 'ローカル完結のモックアップ＆画像ツール',
    skipToContent: 'メインコンテンツへスキップ',
    openStudio: 'Studio を開く',
    openStudioShort: 'Studio',
    openInStudioCta: 'Studio で多層レイヤー編集へ',
    proBadge: 'PRO',
    proUpgrade: 'Moklu Pro',
    proActive: 'Pro 有効',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    toggleThemeAria: 'ライトテーマとダークテーマを切り替え',
    languageLabel: '言語',
    menuToggleAria: 'ナビゲーションメニューを開閉',
    primaryNavAria: '主要ツールナビゲーション',
    mobileNavAria: 'モバイルツールナビゲーション',
    navCategories: {
      mockup: 'モックアップ',
      merge: '画像結合',
      split: '画像分割',
      compress: '圧縮・変換',
      resize: 'リサイズ',
      'id-card': '身分証透かし',
    },
    dropzoneTitle: '画像をドロップ、または Ctrl/Cmd+V で貼り付け',
    dropzoneSubtitle: '100% ブラウザ内ローカル処理。サーバーへの送信は一切ありません。',
    privacyBadge: '完全ブラウザ内処理 · サーバー送信ゼロ',
    privacyBannerTitle: '設計からプライベート：画像データはこの端末の外へ出ません',
    privacyBannerDescription:
      'フレーム合成、画像結合、カルーセル分割、WebP 圧縮、身分証 A4 透かしまで、すべてブラウザの HTML5 Canvas でローカル実行されます。オフラインでも動作します。',
    privacyProofPoints: [
      'サーバーアップロード不要・待機時間ゼロ',
      '高解像度 PNG / WebP / JPEG / ZIP を即時出力',
      'ワンクリックで Moklu Studio へ引き継ぎ編集',
    ],
    howToHeading: '3 ステップで完了',
    howToSubheading: 'アカウント登録やアップロード待ちなし。ブラウザを開いた瞬間に使えます。',
    highlightsHeading: '実務のワークフローに最適化',
    highlightsSubheading: '用途ごとの黄金比や出力設定をあらかじめプリセットしています。',
    relatedToolsHeading: '関連ツールで続けて編集',
    relatedToolsSubheading: '別のローカル画像処理へつなげるか、Studio で多層デザインに仕上げられます。',
    directoryHeading: 'Moklu のローカル画像ツール一覧',
    directorySubheading: 'すべてのツールがクライアント側で完結し、通常出力に強制透かしは入りません。',
    faqHeading: 'よくある質問',
    faqSubheading: 'ローカル処理の安全性、画質、対応形式、Studio 連携について。',
    studioBannerTitle: '見出しテキスト、矢印注釈、多言語スライドを作りたいですか？',
    studioBannerDescription:
      '現在の画像をそのまま Moklu Studio へ送信。Konva ベースの多層レイヤーキャンバスで、タイポグラフィ・影・グラデーション・複数スライドを一括編集できます。',
    studioBannerAction: 'Studio を開く',
    studioBannerProAction: 'Moklu Pro',
    footerDescription:
      'オープンソースでローカル優先のスクリーンショット美化＆ブラウザ画像ツールキット。追跡なし、アップロードなし。',
    footerGroups: {
      mockups: 'モックアップ・公開素材',
      mergeSplit: '結合・分割',
      optimizeResize: '圧縮・サイズ調整',
      documentsStudio: '身分証・Studio',
    },
    footerLanguages: '言語切り替え',
    footerOpenSource: 'GitHub リポジトリ',
    footerLocalFirstNote: 'すべての処理はブラウザ内 HTML5 Canvas でローカル実行されます',
    footerCopyright: 'Moklu · オープンソース画像ツール',
  },
  routes: {
    '': {
      navLabel: 'ホーム',
      title: 'Moklu | 無料・完全ローカルのスクショモックアップ＆画像処理ツール',
      metaDescription:
        'Chrome / iPhone 16 Pro モックアップ、画像結合、カルーセル分割、WebP 圧縮、身分証 A4 透かし作成を 100% ブラウザ内で完結。サーバー送信ゼロ。',
      badge: '100% ブラウザ完結 · アップロード不要',
      h1: 'スクショ美化とローカル画像処理を 1 つのタブで',
      subtitle:
        'スクリーンショットを貼るだけで Chrome や iPhone 16 Pro 枠を適用。縦長結合、SNS カルーセル分割、WebP 圧縮、身分証 A4 透かしまでサーバー送信ゼロで処理し、ワンクリックで Studio へ連携できます。',
      steps: [
        {
          title: 'ツールを選ぶか画像を貼り付け',
          description: 'Ctrl/Cmd+V でクリップボードから貼るか、ローカルの PNG・JPEG・WebP をドロップします。',
        },
        {
          title: 'プリセットをリアルタイム調整',
          description: 'デバイス枠、結合方向、分割数、圧縮品質、不正利用防止透かしをブラウザ内で即時プレビューします。',
        },
        {
          title: '即ダウンロード、または Studio で仕上げ',
          description: '透かしなしでそのまま保存するか、「Studio で編集」から見出し文字や複数スライドを追加できます。',
        },
      ],
      highlights: [
        {
          title: '数秒でプロ品質の発表用ビジュアル',
          description: '素の画面キャプチャを Chrome・Safari・iPhone・Pixel 枠と美しい背景で引き立てます。',
        },
        {
          title: '毎日の画像作業を 1 か所に集約',
          description: '横並び比較、縦長スクショ結合、9 分割、PNG→WebP 変換、白枠余白追加、身分証 A4 透かしを網羅。',
        },
        {
          title: 'クイック作業から多層 Studio へ直結',
          description: '素早く仕上げた画像をそのまま Moklu Studio に送り、見出しや注釈レイヤーを重ねられます。',
        },
      ],
      faqs: [
        {
          question: '画像やスクリーンショットがサーバーにアップロードされますか？',
          answer: 'いいえ。Moklu の全ツールはブラウザ内の HTML5 Canvas と Blob API のみで動作し、画像データが外部へ送信されることはありません。',
        },
        {
          question: '基本機能は無料ですか？サイトロゴの透かしは入りますか？',
          answer: 'はい、標準のモックアップ・結合・分割・圧縮・リサイズ・身分証ツールは無料で、強制的なロゴ透かしも入りません。',
        },
        {
          question: 'クイックツールと Moklu Studio の違いは何ですか？',
          answer: 'クイックツールは単一目的を最速で終える即席ワークスペース、Moklu Studio は文字・バッジ・複数スライドを扱う本格的な多層エディタです。',
        },
        {
          question: '対応している画像形式とブラウザを教えてください。',
          answer: 'PNG、JPEG、WebP の読み込み・書き出しに対応し、PC とスマートフォンの Chrome・Safari・Firefox・Edge で動作します。',
        },
      ],
    },
    studio: {
      navLabel: 'Moklu Studio',
      title: 'Moklu Studio | 多層レイヤー対応モックアップ＆画像キャンバスエディタ',
      metaDescription:
        'アプリ紹介画像やプロダクト発表スライドをブラウザ内で制作。デバイス枠、見出しテキスト、グラデーション、多言語スライドをローカル保存で編集。',
      badge: '多層レイヤーキャンバスエディタ',
      h1: '多層モックアップ＆ビジュアル制作 Studio',
      subtitle:
        'デバイスフレーム、見出し文字、バッジ、メッシュ背景、多言語スライドをブラウザ内で自在にレイアウト。ローカル自動保存で機密デザインも安心です。',
      steps: [
        {
          title: 'テンプレートを選ぶかクイックツールから転送',
          description: 'App Store や 16:9 テンプレートから始めるか、クイックワークスペースの画像を引き継ぎます。',
        },
        {
          title: 'フレーム・文字・影をレイヤー配置',
          description: 'Chrome・Safari・iPhone・Pixel 枠にタイポグラフィや図形、ドロップシャドウを自由に重ねます。',
        },
        {
          title: '高解像度 PNG や多言語セットを書き出し',
          description: '単一スライドまたは複数言語分のセットをローカルで高速レンダリングし出力します。',
        },
      ],
      highlights: [
        {
          title: '非破壊レイヤー構成',
          description: '背景・端末枠・画像・テキストを個別にロック、非表示、並び替え、やり直しできます。',
        },
        {
          title: '多言語スライドの一括管理',
          description: 'レイアウトを保ったまま英語・日本語・中国語・韓国語のストア訴求テキストを切り替えられます。',
        },
        {
          title: 'ローカル完結のプロジェクト保存',
          description: 'ブラウザの IndexedDB に保存され、JSON 形式でのバックアップ書き出しにも対応しています。',
        },
      ],
      faqs: [
        {
          question: 'クイックツールで作った画像をそのまま Studio で編集できますか？',
          answer: 'はい。各ツールの「Studio で編集」ボタンから、現在の画像とフレームを編集可能なレイヤーとして引き継げます。',
        },
        {
          question: 'Studio のプロジェクトデータはどこに保存されますか？',
          answer: '端末内ブラウザの IndexedDB と localStorage に保存され、クラウドアカウント登録は不要です。',
        },
        {
          question: '任意のピクセルサイズでキャンバスを作れますか？',
          answer: 'はい。16:9、4:5、9:16 などのプリセットに加え、幅・高さをピクセル単位で自由に指定できます。',
        },
        {
          question: '操作のやり直しやプロジェクトのバックアップは可能ですか？',
          answer: 'Undo/Redo 履歴を備えており、プロジェクト全体のエクスポートとインポートで安全に退避できます。',
        },
      ],
    },
    'browser-mockup': {
      navLabel: 'ブラウザ枠',
      title: '無料ブラウザモックアップ生成（Chrome / Safari ウィンドウ）| Moklu',
      metaDescription:
        'Web アプリや管理画面のスクショに美しい Chrome・Safari・ミニマルウィンドウ枠と背景グラデーションを追加。完全ブラウザ処理でアップロード不要。',
      badge: 'Chrome / Safari ウィンドウ枠',
      h1: 'Web アプリ向けブラウザモックアップ生成ツール',
      subtitle:
        'SaaS 管理画面や LP、リリースノートのスクリーンショットを洗練された Chrome・Safari・ミニマル枠に収め、均一な余白と自然な影をローカルで適用します。',
      steps: [
        {
          title: 'Web 画面のスクショを貼り付け',
          description: 'ダッシュボードやサイト画面を撮影し、そのままドロップまたはペーストします。',
        },
        {
          title: 'Chrome・Safari・ミニマル枠を選択',
          description: '16:9 や 16:10 比率、背景グラデーション、フィット方式をリアルタイムで調整します。',
        },
        {
          title: 'PNG 保存、または Studio で注釈追加',
          description: '高解像度 PNG をすぐ書き出すか、Studio を開いて見出しや強調矢印を重ねられます。',
        },
      ],
      highlights: [
        {
          title: 'プレスリリース・Zenn・Note 記事に最適',
          description: '16:9 の均整な余白で雑多なデスクトップ端を隠し、記事のアイキャッチ品質を引き上げます。',
        },
        {
          title: 'くっきり鮮明なウィンドウ描写',
          description: 'ウィンドウボタンや角丸、アドレスバーが拡大時にもにじまずシャープに書き出されます。',
        },
        {
          title: '社外秘の管理画面も安全に加工',
          description: 'ローカル Canvas 合成のため、公開前の新機能 UI が外部サーバーに送信される心配はありません。',
        },
      ],
      faqs: [
        {
          question: 'どのブラウザフレームデザインを選べますか？',
          answer: 'Chrome ブラウザ、Safari ブラウザ、アドレスバーを省いたミニマルウィンドウの 3 種をワンクリックで切り替えられます。',
        },
        {
          question: 'ブログ記事や X 投稿にはどの比率がおすすめですか？',
          answer: '標準の 16:9（1600×900）または 16:10（1600×1000）が X カード、技術記事、Product Hunt で美しく表示されます。',
        },
        {
          question: 'URL バーの表記変更や説明テキストの追加はできますか？',
          answer: '「Studio で編集」を押すと、ウィンドウ細部の調整や見出し・吹き出しレイヤーの追加が可能です。',
        },
        {
          question: '未公開 SaaS のスクリーンショットは保存されませんか？',
          answer: '一切保存されません。ブラウザのローカルメモリ上のみで描画され、タブを閉じれば消去されます。',
        },
      ],
    },
    'iphone-mockup': {
      navLabel: 'iPhone 枠',
      title: '無料 iPhone 16 Pro モックアップ生成ツール | Moklu',
      metaDescription:
        'iOS アプリのスクショを精細な iPhone 16 Pro フレームにはめ込み、スタジオ背景と影を自動適用。完全ローカル処理＆ワンクリック Studio 連携。',
      badge: 'iPhone 16 Pro 端末フレーム',
      h1: 'iPhone 16 Pro モックアップ生成ツール',
      subtitle:
        'iOS アプリ画面を正確な比率の iPhone 16 Pro ベゼルに配置し、柔らかいライティングと整った余白で洗練された紹介画像をローカル生成します。',
      steps: [
        {
          title: 'iOS アプリのスクリーンショットを読み込み',
          description: '実機やシミュレータの画像をドロップするか、デモ画面で即座に仕上がりを試せます。',
        },
        {
          title: '比率・背景テーマ・表示フィットを調整',
          description: '4:5、9:16、1:1 から用途に合う比率を選び、Cover / Contain で画面端をきれいに合わせます。',
        },
        {
          title: 'PNG 書き出し、または Studio で見出し追加',
          description: '完成画像をすぐ保存するか、Studio に送ってキャッチコピー入りの訴求画像へ発展させます。',
        },
      ],
      highlights: [
        {
          title: '実機準拠のコーナー曲線と比率',
          description: 'iPhone 16 Pro の縦横比と角丸に自然にフィットし、不自然な引き伸ばしを防ぎます。',
        },
        {
          title: 'SNS・ポートフォリオ向けプリセット',
          description: 'Instagram 4:5、縦長ストーリー 9:16、プレゼン用 16:9 をワンクリックで切り替え可能。',
        },
        {
          title: 'TestFlight 開発中画面も安心',
          description: 'NDA 下の開発中アプリ画面もサーバー送信ゼロのまま紹介画像を作成できます。',
        },
      ],
      faqs: [
        {
          question: 'iPhone 16 Pro 枠に最適なスクショ解像度は？',
          answer: '1206×2622 や 1290×2796 などの標準 iPhone 縦長キャプチャが最適で、他比率も Cover 設定で自動フィットします。',
        },
        {
          question: '2 台の iPhone を並べたり傾けたりできますか？',
          answer: 'はい。「Studio で編集」へ進むと、iPhone レイヤーの複製・回転・複数配置が自由に行えます。',
        },
        {
          question: '書き出した iPhone モックアップに透かしは入りますか？',
          answer: '入りません。高解像度 PNG をロゴ透かしなしでそのままダウンロードできます。',
        },
        {
          question: 'LP や資料など商用利用しても問題ありませんか？',
          answer: 'ご自身のスクリーンショットから作成したモックアップは、Web サイト・提案書・ストア申請に自由に利用できます。',
        },
      ],
    },
    'device-mockup': {
      navLabel: 'マルチデバイス枠',
      title: 'マルチデバイスモックアップ生成（Pixel 9 / iPhone / Web）| Moklu',
      metaDescription:
        'Google Pixel 9、iPhone 16 Pro、デスクトップブラウザ枠を統一テイストで生成。完全ローカル描画でクロスプラットフォーム製品に最適。',
      badge: 'Pixel 9 · iPhone · ブラウザ対応',
      h1: 'マルチデバイスモックアップ生成ツール',
      subtitle:
        'Android・iOS・Web の各画面を統一された影と背景グラデーションで美しくフレーミング。Pixel 9 を含む主要枠をローカルで即座に切り替えられます。',
      steps: [
        {
          title: 'Android・iOS・Web の画面をドロップ',
          description: '画像を 1 度読み込めば、再アップロードなしで各デバイス枠を見比べられます。',
        },
        {
          title: 'キャンバス比率と背景トーンを統一',
          description: 'Aurora・Midnight・Warm Paper のテーマで全プラットフォームのビジュアルに一貫性を持たせます。',
        },
        {
          title: '書き出し、または Studio で複数端末を合成',
          description: '単体モックアップを保存するか、Studio で PC ブラウザとスマホを 1 枚に並べて演出します。',
        },
      ],
      highlights: [
        {
          title: 'Android / Google Pixel 9 フレーム標準搭載',
          description: 'Google Play 向けアプリも iOS と同じ洗練されたハードウェア枠で見せられます。',
        },
        {
          title: 'ブランドの一貫性を保つ光影設計',
          description: '端末を変えても同じドロップシャドウと余白設計を維持し、統一感ある紹介ページを作れます。',
        },
        {
          title: '待ち時間ゼロのブラウザ描画',
          description: 'クラウドレンダリング待ちがなく、枠や背景の試行錯誤を 60fps で確認できます。',
        },
      ],
      faqs: [
        {
          question: '切り替え可能なデバイスモデルは何種類ありますか？',
          answer: 'Google Pixel 9、iPhone 16 Pro、Chrome ブラウザ、Safari ブラウザ、ミニマルウィンドウの 5 種類に対応しています。',
        },
        {
          question: 'PC 画面とスマホ画面を 1 枚の画像に同時に配置できますか？',
          answer: 'はい。「Studio で編集」を開くことで、複数の端末レイヤーを 1 キャンバス上に自在にレイアウトできます。',
        },
        {
          question: 'デバイス枠を切り替えると読み込み済みの画像は消えますか？',
          answer: '消えません。スクリーンショットを保持したまま枠や背景テーマを何度でも比較できます。',
        },
        {
          question: '画像は外部サーバーで合成されますか？',
          answer: 'いいえ。すべてローカルのブラウザ内のみで処理されます。',
        },
      ],
    },
    'app-store-screenshots': {
      navLabel: 'ストアスクショ',
      title: 'App Store & Google Play 向け 9:16 スクショ作成ツール | Moklu',
      metaDescription:
        '9:16 縦長プリセットと iPhone 16 Pro 枠でストア申請用スクリーンショットを素早く作成。ワンクリックで Studio 多言語スライド編集へ連携。',
      badge: '9:16 ストア申請用縦長プリセット',
      h1: 'App Store & Google Play スクショ作成ツール',
      subtitle:
        '縦長 9:16 キャンバスと iPhone 16 Pro 枠を初期設定済み。素早くベースを作り、そのまま Moklu Studio でキャッチコピーや多言語スライド一式へ展開できます。',
      steps: [
        {
          title: 'アプリの主要画面を読み込み',
          description: 'iOS / Android のキャプチャを縦長 9:16 ストア用フレームへ配置します。',
        },
        {
          title: '目を引く背景テーマと枠を選択',
          description: '検索一覧で視認性の高い Aurora・Midnight・Warm Paper 背景から選べます。',
        },
        {
          title: 'そのまま保存、または Studio で多言語セット制作',
          description: '単体 PNG 出力に加え、Studio 連携で 5 枚組の見出し付きストア画像を効率よく仕上げられます。',
        },
      ],
      highlights: [
        {
          title: '9:16 縦長レイアウトを即時用意',
          description: '1080×1920 比率でストアプレビューに適した縦長構図を迷わず作成できます。',
        },
        {
          title: 'Studio の多言語ローカライズと直結',
          description: '日本語・英語・中国語・韓国語など地域別ストア画像を同一レイアウトで管理できます。',
        },
        {
          title: '公開前アプリの機密を保持',
          description: 'リリース前の画面キャプチャを外部クラウドに上げずローカル端末だけで完結できます。',
        },
      ],
      faqs: [
        {
          question: 'スマホ枠の上に大きな訴求見出しを入れるにはどうすればいいですか？',
          answer: '「Studio で編集」をクリックすると現在のフレームが Studio へ転送され、見出し・バッジ・複数スライドを自由に追加できます。',
        },
        {
          question: 'App Store と Google Play の両方に使えますか？',
          answer: 'はい。同じ 9:16 キャンバスと背景を保ったまま、iPhone 16 Pro と Pixel 9 フレームを切り替えられます。',
        },
        {
          question: '複数言語のストア画像をまとめて管理できますか？',
          answer: 'Moklu Studio にはローカライズ専用ビューがあり、複数スライドの翻訳テキストをローカルで一括管理できます。',
        },
        {
          question: '書き出し時に画像が劣化したり透かしが入ったりしませんか？',
          answer: '劣化のない高解像度 PNG で出力され、強制透かしも一切入りません。',
        },
      ],
    },
    'merge-images': {
      navLabel: 'オンライン画像結合',
      title: 'オンライン画像結合 | 複数画像を 1 枚に横並び・縦結合・グリッド・PDF 出力 | Moklu',
      metaDescription:
        '無料ローカルのオンライン画像結合ツール。横並び・縦長結合・2〜6 列グリッド（cover/contain）、ドラッグ並び替え、90° 回転、個別枠線、カスタム背景色、クリップボードコピー、単ページ PDF 出力に対応。送信ゼロ。',
      badge: '横並び · 縦結合 · 2〜6 列グリッド · PDF',
      h1: 'オンライン画像結合ツール',
      subtitle:
        '複数枚の写真をドロップまたは Cmd/Ctrl+V で貼り付け、横並び・縦結合・2〜6 列グリッド（cover/contain）で 1 枚に結合。ドラッグ並び替え、順序反転、90° 回転、枠線、クリップボードコピー、単ページ PDF 出力まで 100% ローカル処理します。',
      steps: [
        {
          title: '画像を追加してドラッグ並び替え・回転',
          description: '複数ファイルをドロップまたは Cmd/Ctrl+V で貼り付け、サムネイルのドラッグ並び替え（←/→ ボタン併用）、順序反転、個別 90° 回転を行います。',
        },
        {
          title: 'レイアウト・配置・枠線・背景を設定',
          description: '横・縦・2〜6 列グリッド（cover/contain）を選び、間隔（0〜64px）、外余白（0〜80px）、角丸（0〜48px）、個別枠線（0〜24px）、カスタム背景色を調整します。',
        },
        {
          title: 'クリップボードへコピーまたは画像 / PDF 保存',
          description: 'ワンクリックで PNG をクリップボードへコピーするか、PNG / WebP / JPEG / 単ページ PDF 1.4（画質 50%〜100%）で保存。Studio への引き継ぎも可能です。',
        },
      ],
      highlights: [
        {
          title: '横・縦・2〜6 列グリッドと精密配置',
          description: '最小揃え・最大揃え・原寸（先頭/中央/末尾揃え）とグリッドの cover / contain 切替で、異なるサイズの画像も端正に整列します。',
        },
        {
          title: 'ドラッグ並び替え・順序反転・個別枠線',
          description: 'サムネイルのドラッグ操作、一括順序反転、個別 90° 回転、0〜24px の個別枠線とカスタムカラーピッカーを備えています。',
        },
        {
          title: 'クリップボードコピー＆単ページ PDF 出力',
          description: 'チャットツールへ即貼り付けできるコピー機能と、完全ローカルの単ページ PDF 1.4 出力に対応。アップロードも透かしも不要です。',
        },
      ],
      faqs: [
        {
          question: 'どのような結合レイアウトとグリッド設定に対応していますか？',
          answer: '横並び、縦結合、2〜6 列グリッドに対応しています。グリッドでは 1:1 / 4:3 / 3:4 / 自動のセル比率と、cover（切り抜き敷き詰め）・contain（切らずに全体表示）を切り替えられます。',
        },
        {
          question: '解像度がバラバラの画像はどのように揃えられますか？',
          answer: '横・縦結合では最小サイズ揃え（初期値）、最大サイズ揃え、原寸維持から選択できます。原寸モードでは上/左揃え、中央揃え（初期値）、下/右揃えを指定できます。',
        },
        {
          question: 'ドラッグ並び替え、順序反転、単体回転はできますか？',
          answer: 'はい。サムネイルをドラッグして直感的に並び替えでき（キーボードや ←/→ ボタンにも対応）、ワンクリック順序反転と画像ごとの 90° 時計回り回転が使えます。',
        },
        {
          question: '余白、枠線、角丸、背景色はどこまでカスタマイズできますか？',
          answer: '間隔（0〜64px）、外余白（0〜80px）、角丸（0〜48px）、個別枠線（0〜24px、色プリセット＋カラーピッカー）を調整でき、背景も 6 種のプリセット（グラデーション・透過含む）とカスタムカラーピッカーに対応しています。',
        },
        {
          question: '対応出力形式と画質設定を教えてください。PDF 出力はできますか？',
          answer: 'PNG、WebP、JPEG、単ページ PDF 1.4 に対応しています。JPEG / WebP / PDF では 50%〜100%（初期値 92%）の画質スライダーが使え、透過背景は JPEG / PDF 時に自動で白地合成されます。なお PDF は結合画像を 1 ページに収める単ページ仕様であり、複数ページ PDF 文書の結合ツールではありません。',
        },
        {
          question: '結合画像をそのままクリップボードにコピーできますか？',
          answer: 'はい。「クリップボードにコピー」を押すと結合結果を PNG としてクリップボードへ書き込み、Slack・LINE・メール・資料へそのまま貼り付けられます。',
        },
        {
          question: '枚数や解像度の上限はありますか？',
          answer: '枚数の固定上限はありません。ブラウザの安定性を守るため出力キャンバスには 8192px / 64MP の安全上限があり、超過時は自動等比縮小してプレビュー寸法の横に縮小通知を表示します。',
        },
        {
          question: '縦長スクショ結合で重複するヘッダーや重なり部分を自動カットしますか？',
          answer: '重複部分の自動削除機能は搭載していません。すべての元画像を欠けなく確実に並べて結合する設計です。',
        },
        {
          question: 'スマホでも使えますか？結合後に文字や矢印を追加したい場合は？',
          answer: 'はい。PC・スマートフォンどちらのブラウザでもオフラインかつ透かし無料で使えます。見出し文字や注釈矢印を重ねたい場合は「Studio を開く」から多層キャンバスで編集できます。',
        },
      ],
    },
    'combine-photos-side-by-side': {
      navLabel: '横並び結合',
      title: '2 枚以上の写真を横並びで結合（Before / After 比較）| Moklu',
      metaDescription:
        '写真や UI スクショを左右横並びに 1 枚へ結合。高さ自動揃え、区切り余白、角丸対応。100% ブラウザ内処理でアップロード不要。',
      badge: '左右比較・横並びプリセット',
      h1: '写真を左右横並びに結合するツール',
      subtitle:
        'Before / After 比較や UI 改修レビューに最適な横並び結合プリセット。異なる端末の写真も高さを自動整列し、すっきりした余白と角丸で仕上げます。',
      steps: [
        {
          title: '比較したい写真を 2 枚以上ドロップ',
          description: '左右に並べたい写真やスクショを追加し、左から右の順序を確認します。',
        },
        {
          title: '区切り間隔・外余白・背景色を調整',
          description: '白やダークの区切り線幅、角丸の丸みをスライダーで微調整します。',
        },
        {
          title: '保存、または Studio で比較ラベル追加',
          description: 'PNG / WebP をローカル保存するか、Studio で Before / After バッジを添えられます。',
        },
      ],
      highlights: [
        {
          title: '改修前後・写真比較に最適',
          description: 'デザインレビュー、レタッチ比較、商品バリエーション比較が 1 枚で直感的に伝わります。',
        },
        {
          title: '切り抜きなしで高さを自動統一',
          description: '縦横比を保ったまま高さを揃えるため、写真の端が意図せず切れる心配がありません。',
        },
        {
          title: '3 枚・4 枚の連続横並びにも対応',
          description: '2 枚比較だけでなく複数ステップの横長ストーリー結合もスマートに作れます。',
        },
      ],
      faqs: [
        {
          question: '3 枚以上の写真を横 1 列に並べられますか？',
          answer: 'はい。2 枚・3 枚・4 枚以上でも左から順に横 1 列へ綺麗に結合できます。',
        },
        {
          question: '横並びにすると写真の端がトリミングされますか？',
          answer: 'いいえ。比率を維持して高さを揃えるため、元画像の全範囲がそのまま残ります。',
        },
        {
          question: '2 枚の間にきれいな白い区切り線を入れる方法は？',
          answer: '背景色を白に設定し、間隔（Gap）と外余白（Padding）を好みのピクセル数に調整してください。',
        },
        {
          question: '個人の比較写真を処理しても安全ですか？',
          answer: 'はい。処理はブラウザ内でオフライン完結し、外部サーバーには一切送信されません。',
        },
      ],
    },
    'stitch-images-vertically': {
      navLabel: '縦長スクショ結合',
      title: '縦長スクリーンショット結合ツール（チャット・長文スクショ）| Moklu',
      metaDescription:
        '複数枚のスマホスクショやトーク履歴を縦 1 枚にシームレス結合。幅自動揃え・隙間 0px 設定対応。完全ブラウザ内ローカル処理。',
      badge: '縦長スクショ・シームレス結合',
      h1: '画像を縦に連結して 1 枚の縦長画像を作成',
      subtitle:
        'トーク履歴、領収書、手順ガイド、長い Web 画面のスクショを上から下へ綺麗に縦結合。幅を自動で統一し、0px 連結から余白付きカードまでローカルで仕上げます。',
      steps: [
        {
          title: '読む順番にスクショを読み込み',
          description: '連続撮影した画面キャプチャを追加し、上下の並び順を整えます。',
        },
        {
          title: '0px シームレス結合か余白付きを選択',
          description: '連続スクショは間隔 0px で継ぎ目なしに、解説手順は余白と角丸で見やすく調整できます。',
        },
        {
          title: '鮮明な縦長画像をローカル保存',
          description: '文字が読みやすい高解像度 PNG または軽量 WebP としてすぐ保存できます。',
        },
      ],
      highlights: [
        {
          title: '機密トークや明細も安全に結合',
          description: 'LINE・Slack ログや請求書スクショを外部サイトへ送らず端末内だけで結合できます。',
        },
        {
          title: '混在サイズも横幅を自動統一',
          description: 'PC とスマホの画面が混ざっていても同じ横幅に自動スケールして整列します。',
        },
        {
          title: '長大画像でも安定動作',
          description: '文字のシャープさを維持しつつ、ブラウザのメモリ上限を超えるクラッシュを防ぎます。',
        },
      ],
      faqs: [
        {
          question: '継ぎ目の線を完全に消して縦結合できますか？',
          answer: '間隔・外余白・角丸をすべて 0px に設定すると、継ぎ目のない連続した縦長画像になります。',
        },
        {
          question: '横幅が異なるスクリーンショット同士も綺麗に繋がりますか？',
          answer: 'はい。縦結合の幅揃え設定により、全画像が同じ横幅へ比率維持のまま整列されます。',
        },
        {
          question: '文字が多い縦長画像は PNG と WebP どちらが良いですか？',
          answer: '小さな UI 文字をくっきり残すなら PNG、SNS やチャットで軽く共有したい場合は高品質 WebP が最適です。',
        },
        {
          question: '結合後に個人情報へモザイクや強調枠を入れられますか？',
          answer: '「Studio で編集」へ送れば、目隠し図形や赤枠・注釈テキストを簡単に重ねられます。',
        },
      ],
    },
    'photo-collage-grid': {
      navLabel: 'コラージュグリッド',
      title: '無料フォトコラージュグリッド作成（2×2 / 3×3 / 自由列数）| Moklu',
      metaDescription:
        '写真を整然とした 2×2・3×3・多列グリッドコラージュへ自動配置。列数・セル比率・角丸・背景色をローカルで自在に調整。',
      badge: 'カスタム列数グリッド配置',
      h1: 'フォトコラージュ・グリッド作成ツール',
      subtitle:
        '旅行写真や商品カット、UI 画面一覧を均等な 2×2・3×3・多列グリッドに美しく整理。余白と角丸を正確に揃え、完全ローカルで書き出します。',
      steps: [
        {
          title: '複数写真を追加して配置順を調整',
          description: '4 枚、6 枚、9 枚以上の画像をドロップし、グリッドの並び順を整えます。',
        },
        {
          title: '列数・セル比率・フィット方式を設定',
          description: '2〜6 列、1:1 や 4:3 のセル比率、Cover / Contain、角丸と背景色を選びます。',
        },
        {
          title: 'コラージュを保存、または Studio で装飾',
          description: '完成画像をすぐ出力するか、Studio でタイトル文字やロゴを追加できます。',
        },
      ],
      highlights: [
        {
          title: '数値精度の均等レイアウト',
          description: '手動では揃いにくい余白や角丸を全セルで完全に一致させます。',
        },
        {
          title: 'Cover と Contain を用途で切替',
          description: '雑誌風の全面敷き詰め（Cover）も、UI を切らない全体表示（Contain）も自由自在。',
        },
        {
          title: '登録不要・強制ロゴなし',
          description: '透かしや会員制限に邪魔されず、きれいなグリッド画像をそのまま保存できます。',
        },
      ],
      faqs: [
        {
          question: '2×2 や 3×3 のコラージュが簡単に作れますか？',
          answer: 'はい。列数を 2〜6 の間で指定するだけで、追加した枚数に応じた整然たるグリッドが自動生成されます。',
        },
        {
          question: 'セル内で被写体が切り取られないようにできますか？',
          answer: 'フィット方式を Contain に切り替えるか、元写真に近い 4:3 / 3:4 のセル比率を選択してください。',
        },
        {
          question: 'コラージュの枠線や背景色は変更できますか？',
          answer: 'はい。白、黒、ダークグレー、柔らかなスタジオカラーなどを自由に選べます。',
        },
        {
          question: '作成したコラージュ写真はサーバーに保存されますか？',
          answer: 'いいえ。ブラウザ内のみで描画され、サーバーには一切送信されません。',
        },
      ],
    },
    ...JA_TOOL_ROUTES,
    ...INFO_PAGE_ROUTES.ja,
  },
}
