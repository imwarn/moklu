/**
 * [INPUT]: depends on GrowthRouteSlug and RouteCopy types from ../types.ts
 * [OUTPUT]: exports JA_GROWTH_ROUTES containing Japanese SEO copy for the 7 high-intent growth slugs (ipad-mockup, watch-mockup, stitch-screenshots, heic-to-jpg, remove-exif, compress-image-to-200kb, redact-screenshot)
 * [POS]: growth route-copy chunk for ja within src/seo/locales, merged into JA_LOCALE by ./ja.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { GrowthRouteSlug, RouteCopy } from '../types.ts'

export const JA_GROWTH_ROUTES: Record<GrowthRouteSlug, RouteCopy> = {
  'ipad-mockup': {
    navLabel: 'iPad モックアップ',
    title: '無料 iPad Pro 13 タブレットモックアップ生成（ローカル）| Moklu',
    metaDescription:
      'iPadOS アプリや管理画面、ノート画面を美しい iPad Pro 13・Android タブレット枠に配置。影やグラデーション背景も自在に調整でき、完全ブラウザ内処理で送信ゼロ。',
    badge: 'iPad Pro 13・タブレット枠対応',
    h1: 'iPad Pro 13・タブレットモックアップ生成ツール',
    subtitle:
      'iPadOS の分割画面やダッシュボード、デジタル手帳のスクリーンショットを洗練された iPad Pro 13 または Android タブレット枠へ配置。外部送信ゼロで高解像度出力できます。',
    steps: [
      {
        title: 'タブレット画面のスクショを貼り付け',
        description: 'Cmd/Ctrl+V での貼り付け、または iPadOS シミュレータや Android タブレットのキャプチャをドロップします。',
      },
      {
        title: 'iPad Pro 13 と Android タブレット枠を切替',
        description: '横向き 4:3・16:9 や縦向き比率を選び、余白・シャドウ・Aurora や Midnight の背景トーンを整えます。',
      },
      {
        title: 'PNG 書き出し、または Studio で複数端末合成',
        description: '透かしなしの 2K PNG を即保存するか、Moklu Studio へ渡して iPhone や見出しと組み合わせて仕上げます。',
      },
    ],
    highlights: [
      {
        title: '13 インチのスリムな均等ベゼル',
        description: '最新 iPad Pro 13 と Android タブレットの比率に合わせ、ステータスバーやツールバーを歪めず美しく収めます。',
      },
      {
        title: 'App Store iPad 申請画像にも最適',
        description: 'App Store Connect 用の横長タブレット紹介画像や営業資料、リリースノート画像を統一感ある質感で作成できます。',
      },
      {
        title: '完全ローカル描画で機密 UI も安心',
        description: '開発中のタブレット UI や社内 BI ダッシュボードもブラウザメモリ内だけで合成され、サーバーへ送信されません。',
      },
    ],
    faqs: [
      {
        question: 'iPad モックアップではどのタブレット・デバイス枠が使えますか？',
        answer: 'iPad Pro 13 と Android タブレットに加え、Chrome・Safari・ミニマル枠・iPhone 16 Pro・Pixel 9・Apple Watch・Wear OS・フレームレスの全 13 種類を切り替えられます。',
      },
      {
        question: '横向きと縦向きどちらの iPad スクショにも対応していますか？',
        answer: 'はい。分割画面向けの横長キャンバスから SNS 投稿向けの縦長・正方形キャンバスまでワンクリックで切り替えられます。',
      },
      {
        question: 'iPad と iPhone を 1 枚の宣伝画像に並べて配置できますか？',
        answer: 'はい。「Studio で編集」を開くと、多層キャンバス上で iPad・iPhone 16 Pro・ブラウザ枠や見出しを自在にレイアウトできます。',
      },
      {
        question: 'iPad モックアップの書き出しに透かしは入りますか？',
        answer: '入りません。標準の高解像度 PNG 書き出しは無料で透かしゼロです。',
      },
    ],
  },
  'watch-mockup': {
    navLabel: 'ウォッチモックアップ',
    title: '無料 Apple Watch・スマートウォッチモックアップ生成 | Moklu',
    metaDescription:
      'watchOS や Wear OS のワークアウト画面・ウィジェットを Apple Watch と円形 Wear OS 枠で美しく演出。完全ブラウザ内ローカル描画・透かしなし。',
    badge: 'Apple Watch・Wear OS 対応',
    h1: 'Apple Watch・スマートウォッチモックアップ生成',
    subtitle:
      'watchOS コンプリケーションやフィットネス画面、Wear OS タイルを精密な Apple Watch ケースまたは円形 Wear OS 枠に収め、柔らかなスタジオ背景でローカル書き出しします。',
    steps: [
      {
        title: 'watchOS / Wear OS の画面を読み込む',
        description: 'シミュレータや実機で撮ったスマートウォッチのスクリーンショットを正方形キャンバスへドロップします。',
      },
      {
        title: 'Apple Watch と円形 Wear OS を切り替え',
        description: '角丸の Apple Watch フレームと円形 Wear OS フレームを比較し、背景グラデーションと影の深さを調整します。',
      },
      {
        title: '高精細 PNG 保存または Studio へ引き継ぎ',
        description: '透かしなしの正方形 PNG を即座に保存するか、Studio へ送って連携 iPhone アプリと並べて演出します。',
      },
    ],
    highlights: [
      {
        title: '角型 Apple Watch と丸型 Wear OS 両対応',
        description: '画面のカーブや円形文字盤の輪郭を滑らかに表現し、不自然な切り抜き跡を防ぎます。',
      },
      {
        title: 'スマホ連携アプリの紹介スライドに最適',
        description: 'ワンクリックで Moklu Studio に渡し、iPhone 16 Pro と Apple Watch の同時訴求バナーを作成できます。',
      },
      {
        title: 'サーバー送信なしの 60fps 描画',
        description: '未公開のウェアラブル UI も端末のブラウザメモリ内だけで瞬時にレンダリングされます。',
      },
    ],
    faqs: [
      {
        question: 'Apple Watch だけでなく円形の Wear OS フレームも選べますか？',
        answer: 'はい。角丸の Apple Watch フレームと円形の Wear OS フレームの両方を内蔵しており、画像を再読み込みせずに切り替えられます。',
      },
      {
        question: 'スマートウォッチ画像の書き出しにおすすめの比率はどれですか？',
        answer: '初期設定の 1:1 正方形は機能紹介カードやポートフォリオに最適で、SNS 投稿では 4:5 や 9:16 比率も便利です。',
      },
      {
        question: 'Apple Watch と iPhone を 1 枚のバナーに同時に載せられますか？',
        answer: 'はい。「Studio で編集」をクリックすれば、Apple Watch と iPhone 16 Pro のレイヤーを 1 キャンバス上に自由に並べて見出しを追加できます。',
      },
      {
        question: 'ウォッチモックアップの生成回数に上限はありますか？',
        answer: 'ありません。すべてローカルブラウザ内で処理されるため、無料・無制限で PNG を書き出せます。',
      },
    ],
  },
  'stitch-screenshots': {
    navLabel: '長尺スクショ結合',
    title: 'スクロール長尺スクショ結合（自動重複除去・継ぎ目微調整）| Moklu',
    metaDescription:
      'LINE・Slack チャット履歴や長い Web ページ、映画字幕のスクショをローカルピクセル照合で自動重複除去して 1 枚に結合。固定上下バー切り抜きと半透明ガイド微調整対応。',
    badge: '自動重複除去・継ぎ目ゴースト微調整',
    h1: 'スクロール長尺スクショ結合（自動重複除去対応）',
    subtitle:
      'チャット履歴・長い記事・字幕キャプチャの重なり部分を 100% ローカルのピクセル照合で自動カット。固定ヘッダー/フッター除去と半透明ゴースト重ね合わせによる 1px 単位の継ぎ目調整に対応します。',
    steps: [
      {
        title: '連続スクロール画像を順番にドロップ',
        description: 'チャット画面や Web ページの連続キャプチャを一括読み込み。サムネイルのドラッグで順序変更や反転も自在です。',
      },
      {
        title: '重複自動カット＆ゴースト重ね合わせで微調整',
        description: '重なった行と固定上下バーをローカル解析で自動除去し、必要なら半透明ゴーストスライダーで継ぎ目を精密に合わせます。',
      },
      {
        title: 'PNG 保存・クリップボードコピー・Studio 連携',
        description: '鮮明な長尺画像を保存・コピーするか、そのまま Studio に渡してモザイク処理や注釈を追加できます。',
      },
    ],
    highlights: [
      {
        title: '100% ローカルの重複スクロール自動検出',
        description: '隣接するスクショ間で重複した文章や吹き出しを端末メモリ内で検出し、自然な 1 枚の長尺画像へ繋ぎます。',
      },
      {
        title: '固定ヘッダー・ナビバーの自動トリミング',
        description: '各キャプチャに繰り返し写り込むアプリのトップバーや下部入力欄を自動で取り除きます。',
      },
      {
        title: '半透明ゴーストオーバーレイ継ぎ目微調整',
        description: '単調な背景や字幕画像で微調整したい継ぎ目だけ、半透明プレビューを見ながらピクセル単位で手動補正できます。',
      },
    ],
    faqs: [
      {
        question: '「長尺スクショ結合」と「画像を縦に結合」の違いは何ですか？',
        answer: '「長尺スクショ結合」はスクロール画面向けにスマート重複除去と固定上下バー切り抜きを初期オンにしており、「画像を縦に結合」は写真をそのまま端から端へ連結する標準モードです。',
      },
      {
        question: '自動重複検出が微妙にずれた継ぎ目は手動で直せますか？',
        answer: 'はい。各継ぎ目ごとに半透明ゴーストオーバーレイを開いて 1px 単位で重なり幅を上書き調整できます。明確な重複がない場合は元画像を安全に保持します。',
      },
      {
        question: '社内の Slack や個人チャット履歴を結合しても外部送信されませんか？',
        answer: '一切送信されません。ピクセル照合もキャンバス結合もブラウザ内で完結し、結合後すぐにローカルでモザイク伏せ字も施せます。',
      },
      {
        question: '結合した長尺画像が 8192px を超える場合はどうなりますか？',
        answer: 'ブラウザクラッシュを防ぐ 8192px / 64MP 安全上限により、比率を保ったまま自動縮小し画面上に明示的な通知を表示します。',
      },
    ],
  },
  'heic-to-jpg': {
    navLabel: 'HEIC を JPG に変換',
    title: 'iPhone HEIC・AVIF を JPG へ無料変換（完全ローカル）| Moklu',
    metaDescription:
      'iPhone の .heic / .heif や .avif 写真をサーバー送信なしでブラウザ内一括変換（JPG・PNG・WebP）。ネイティブ優先＋ローカル WASM フォールバック対応。',
    badge: 'ローカル HEIC / AVIF 変換・送信ゼロ',
    h1: 'iPhone HEIC・AVIF 写真をローカルで JPG 変換',
    subtitle:
      'iPhone で撮影した .heic / .heif や .avif 写真を外部サーバーへ一切アップロードせず、ブラウザ内でまとめて JPEG・PNG・WebP へ変換し ZIP で一括保存します。',
    steps: [
      {
        title: 'HEIC・HEIF・AVIF 写真をまとめてドロップ',
        description: '複数枚の iPhone 写真や AVIF 画像を読み込むと、形式を自動判定して端末メモリ内で変換キューを作成します。',
      },
      {
        title: 'JPG / PNG / WebP と画質・容量を設定',
        description: '汎用性の高い JPEG 出力を初期設定済み。必要に応じて画質や最大幅、目標 KB 指定も同時に設定できます。',
      },
      {
        title: '個別保存またはワンクリック ZIP 書き出し',
        description: '変換前後のファイルサイズを比較確認し、そのまま 1 枚ずつ保存するかローカル ZIP で一括ダウンロードします。',
      },
    ],
    highlights: [
      {
        title: 'ネイティブ優先＋ローカル WASM フォールバック',
        description: 'Safari では追加読み込みゼロのネイティブデコードを使い、Chrome・Edge・Firefox でもローカル WASM デコーダで完結します。',
      },
      {
        title: 'プライベート写真も端末外へ出さない設計',
        description: 'クラウド変換サイトのようにカメラロールを外部サーバーへ預ける必要がなく、家族写真や書類も安心です。',
      },
      {
        title: '変換と同時に EXIF 除去＆サイズ最適化',
        description: 'JPG 変換時に GPS などの撮影メタデータを自動除去でき、そのまま 200KB 以下への圧縮まで一連で完了します。',
      },
    ],
    faqs: [
      {
        question: 'Chrome や Firefox でサーバーを使わずに HEIC を JPG 変換できる仕組みは？',
        answer: 'まずブラウザ標準のネイティブデコードを試み、非対応環境ではクライアント側 WebAssembly HEIC デコーダを自動ロードしてローカルメモリ内で変換します。',
      },
      {
        question: 'HEIC / HEIF だけでなく AVIF 画像もまとめて JPG に変換できますか？',
        answer: 'はい。.heic・.heif・.avif・WebP・PNG を混在させたまま一括で JPEG・PNG・WebP に変換できます。',
      },
      {
        question: 'HEIC から JPG に変換すると GPS 位置情報は残りますか？',
        answer: '残りません。HTML5 Canvas 経由の再エンコード時に GPS 座標やカメラ EXIF メタデータが自動で取り除かれます。',
      },
      {
        question: '1 日の変換枚数制限やファイルサイズ課金はありますか？',
        answer: 'ありません。お使いの端末のブラウザで処理するため、登録不要・無料で無制限に変換できます。',
      },
    ],
  },
  'remove-exif': {
    navLabel: 'EXIF・GPS 削除',
    title: '写真の EXIF・GPS 位置情報をローカル確認＆完全削除 | Moklu',
    metaDescription:
      'JPEG・PNG・WebP・HEIC に埋め込まれた GPS 緯度経度・カメラ機種・撮影日時をブラウザ内で検査し、サーバー送信ゼロで EXIF メタデータを完全削除します。',
    badge: 'EXIF・GPS 検査＆オフライン削除',
    h1: '写真の EXIF・GPS 位置情報を確認して完全削除',
    subtitle:
      'SNS 投稿やフリマ出品の前に、写真へ埋め込まれた GPS 位置情報・カメラ機種・ソフトウェア・撮影日時をブラウザ内で即座に検査し、メタデータゼロの安全な画像へ書き出します。',
    steps: [
      {
        title: '写真をドロップして埋め込み EXIF を検査',
        description: 'JPEG・PNG・WebP・HEIC を読み込むと、内蔵バイナリパーサーが GPS 座標や機種タグをローカルメモリ内で解析します。',
      },
      {
        title: '検出された GPS・カメラ・日時タグを確認',
        description: '緯度経度・メーカー・モデル・露出設定・撮影日時の有無を外部送信なしで一覧確認できます。',
      },
      {
        title: 'メタデータ除去済みのクリーン画像を保存',
        description: 'EXIF と GPS を完全剥離した画像を単体または一括 ZIP でローカル書き出しします。',
      },
    ],
    highlights: [
      {
        title: 'ゼロ依存のバイナリ EXIF 検査エンジン',
        description: 'JPEG APP1、PNG eXIf、WebP EXIF、HEIC EXIF ボックスをブラウザの DataView で直接読み取り可視化します。',
      },
      {
        title: '自宅住所や撮影場所の意図しない特定を防止',
        description: 'フリマ出品画像やブログ写真に残りやすい GPS 緯度経度と撮影機材情報を確実に消去します。',
      },
      {
        title: 'Wi-Fi オフでも検証できる完全ローカル処理',
        description: 'プライバシー削除のために原本を外部サーバーへ送る矛盾をなくし、ページ読込後はオフラインでも動作します。',
      },
    ],
    faqs: [
      {
        question: 'どの種類の EXIF・プライバシー情報を検出して削除できますか？',
        answer: 'GPS 緯度経度、カメラのメーカーと機種名、編集ソフト名、撮影日時、ISO・絞り・シャッター速度・向きタグを検出し、書き出し時にすべて除去します。',
      },
      {
        question: 'EXIF 検査と削除はどの画像形式に対応していますか？',
        answer: 'JPEG・PNG・WebP・HEIC/HEIF の EXIF 領域を解析でき、クリーンな JPEG・WebP・PNG として保存できます。',
      },
      {
        question: 'クラウド型ツールではなくローカル EXIF 削除を使う利点は何ですか？',
        answer: '自宅の GPS が入った原本を他社サーバーへアップロードするリスクを完全に排除できるため、機密性の高い写真も安全に処理できます。',
      },
      {
        question: 'EXIF 削除後にスマホで縦撮りした写真が横向きに回転しませんか？',
        answer: '回転しません。ブラウザが正しい向きへピクセルを展開してから再エンコードするため、縦写真はそのまま縦向きで保存されます。',
      },
    ],
  },
  'compress-image-to-200kb': {
    navLabel: '200KB 以下に圧縮',
    title: '画像を 200KB 以下（100KB / 500KB）に正確圧縮・無料 | Moklu',
    metaDescription:
      '採用応募・ビザ申請・資格試験フォームの容量制限に合わせて画像を 200KB・100KB・500KB 以下へローカル二分探索圧縮。送信ゼロ・画質劣化を最小限に抑制。',
    badge: '目標 KB 指定圧縮・ローカル二分探索',
    h1: '画像を 200KB 以下へ正確に軽量化（100KB / 500KB 対応）',
    subtitle:
      '求人応募・証明写真・行政申請フォームの厳しい 100KB / 200KB / 500KB 上限に合わせ、ブラウザ内の二分探索で最高画質を保ちつつ目標容量以下へ確実に収めます。',
    steps: [
      {
        title: '容量オーバーの写真や書類画像をドロップ',
        description: 'アップロード上限を超える JPEG・PNG・WebP・HEIC ファイルを 1 枚またはまとめて追加します。',
      },
      {
        title: '200KB・100KB・500KB または任意 KB を指定',
        description: 'ローカル二分探索で目標 KB 内に収まる最高品質を自動算出し、必要時のみ比率維持の縮小で確実に収めます。',
      },
      {
        title: '目標達成サイズを確認して即ダウンロード',
        description: '圧縮前後の KB 数値と達成バッジを確認し、個別保存または一括ローカル ZIP で書き出します。',
      },
    ],
    highlights: [
      {
        title: '二分探索で「上限ギリギリの最高画質」を自動選定',
        description: 'スライダーを何度も試す手間を省き、200KB 未満で最も鮮明な画質を数ミリ秒で自動計算します。',
      },
      {
        title: 'ピクセル寸法維持オプション対応',
        description: '証明写真の指定ピクセルを崩したくない場合は解像度維持をオンに、超高解像度写真は自動縮小で確実に収められます。',
      },
      {
        title: '履歴書写真・申請書類も完全ローカル保護',
        description: '顔写真や本人確認書類を外部サーバーへ一切送らず、端末ブラウザ内だけで圧縮を完結します。',
      },
    ],
    faqs: [
      {
        question: 'どのようにして画質を保ちながら正確に 200KB 以下へ圧縮していますか？',
        answer: 'ブラウザ内で品質パラメータを二分探索し目標バイト数に収まる最大品質を見つけます。最低品質でも超過する超高解像度画像は必要に応じて等比縮小して確実に収めます。',
      },
      {
        question: '200KB 以外に 100KB や 500KB、任意のサイズ指定もできますか？',
        answer: 'はい。このページでは 200KB を初期設定していますが、100KB・500KB プリセットや任意の目標 KB 値へすぐ変更できます。',
      },
      {
        question: '申請フォームの 200KB 制限では JPEG と WebP どちらを選ぶべきですか？',
        answer: 'Web サイト掲載なら同容量で高精細な WebP が有利ですが、行政・求人フォームが .jpg のみ受付の場合は JPEG を選択してください。',
      },
      {
        question: '証明写真や申請用画像を圧縮する際にサーバー通信は発生しますか？',
        answer: '発生しません。すべての圧縮探索処理はお使いのブラウザメモリ内でオフライン完結します。',
      },
    ],
  },
  'redact-screenshot': {
    navLabel: 'スクショぼかし・伏せ字',
    title: 'スクリーンショットをローカルでぼかし・モザイク・黒塗り | Moklu',
    metaDescription:
      '共有前に 3 秒で API キー・メールアドレス・顧客名をローカル隠蔽。ぼかし・モザイク・完全塗りつぶし・スポットライト強調を送信ゼロで実行しモックアップ枠にも対応。',
    badge: 'ぼかし・モザイク・スポットライト・送信ゼロ',
    h1: 'スクショのぼかし・モザイク・黒塗り＆スポットライト',
    subtitle:
      '画面共有や資料掲載の前に、API キー・メールアドレス・請求額・個人情報を 3 秒でローカル保護。完全塗りつぶし・ぼかし・モザイク・スポットライト強調に対応します。',
    steps: [
      {
        title: '保護したいスクショを貼り付けまたはドロップ',
        description: '管理画面やターミナルを撮影したらすぐ Cmd/Ctrl+V で貼り付け。未加工の機密画像は一切外部へ送信されません。',
      },
      {
        title: '隠す領域をドラッグして加工モードを選択',
        description: '機密情報には塗りつぶし・ぼかし・モザイクを、注目させたい指標にはスポットライト枠を配置します。',
      },
      {
        title: 'そのまま保存、枠付き出力、または Studio へ連携',
        description: 'Chrome・iPhone 枠付きまたは枠なしで即 PNG 保存でき、非破壊レイヤーのまま Studio で矢印や注釈も追加できます。',
      },
    ],
    highlights: [
      {
        title: '機密画像をクラウドへ送らない真のマスキング',
        description: 'API トークンや顧客一覧が写った未加工スクショを外部サイトへアップロードするリスクをゼロにします。',
      },
      {
        title: '4 種類のマスキング＆フォーカスツール',
        description: '復元不能な完全塗りつぶし、柔らかなガウスぼかし、モザイク化、周囲を暗くするスポットライト強調を自在に使い分けられます。',
      },
      {
        title: 'マスキングとモックアップ整形を 1 回で完結',
        description: '伏せ字処理と同時にブラウザ枠やシャドウを整えられ、Studio 引き継ぎ後も元画像を非破壊で再調整できます。',
      },
    ],
    faqs: [
      {
        question: 'API キーやパスワードを隠すにはぼかし・モザイク・塗りつぶしのどれが安全ですか？',
        answer: '認証情報や個人情報には元のピクセルを完全に上書きする「塗りつぶし（Solid Mask）」が最も安全です。ぼかしやモザイクは視覚的な配慮が必要な場面に適しています。',
      },
      {
        question: 'ぼかし枠を描く前に元の機密スクショがサーバーへアップロードされませんか？',
        answer: 'アップロードされません。読み込みからマスキング描画、PNG 書き出しまで 100% ブラウザ内メモリで完結します。',
      },
      {
        question: 'スポットライト（Spotlight）モードはどのような用途に向いていますか？',
        answer: '指定した範囲以外を穏やかに暗くして対象ボタンや数値を際立たせるため、操作マニュアル・変更履歴・プレゼン資料に最適です。',
      },
      {
        question: 'Moklu Studio へ引き継いだ後もマスキング領域の位置を調整できますか？',
        answer: 'はい。元のスクリーンショットを非破壊で保持したままマスキングレイヤーを引き継ぐため、範囲の微調整や矢印・テキストの追加が可能です。',
      },
    ],
  },
}
