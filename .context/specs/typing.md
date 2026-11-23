# 日本語変換タイピング (Japanese IME Typing) 仕様書

## 1. ツール概要
* **ID**: `typing`
* **URL**: `/typing`
* **ドキュメント**:
  - `docs/tools/typing.mdx` (`sidebar_position: 20`)
  - `i18n/en/docusaurus-plugin-content-docs/current/tools/typing.mdx` (`sidebar_position: 20`)
  - `i18n/zh-Hans/docusaurus-plugin-content-docs/current/tools/typing.mdx` (`sidebar_position: 20`)
  - `i18n/zh-Hant/docusaurus-plugin-content-docs/current/tools/typing.mdx` (`sidebar_position: 20`)
  - `i18n/ko/docusaurus-plugin-content-docs/current/tools/typing.mdx` (`sidebar_position: 20`)
* **名称**: 日本語変換タイピング (Japanese IME Typing)
* **目的**: ローマ字1打鍵ごとの判定ではなく、IME 変換確定後の文字列を長文例文と照合して消化していくことで、日本語・英数字・記号が混在する実務的な入力力を測定・練習できるブラウザ完結型 Web ツール。
* **主要技術**: React 18, TypeScript, MUI (Material UI) v6, Lucide React, Docusaurus 3, Vitest 2.

## 2. コア要件
* **完全ローカル処理 (Client-Side Only)**:
  文字正規化、一致判定、タイマー管理、スコア集計、自己ベスト保存（LocalStorage）はすべてブラウザ内で完結し、外部サーバーへの通信は一切行わない。
* **状態の同期と永続化 (URL Query & LocalStorage)**:
  - コース選択（60秒 / 180秒）を URL クエリパラメータ（`?course=60` / `?course=180`）とリアルタイム同期。
  - コース別自己ベスト記録を `localStorage`（キー: `sawara_typing_best_records_v1`）へ永続化。
* **多言語対応 (i18n)**:
  - UI 文言は `@docusaurus/Translate`（`Translate` / `translate()`）で国際化し、`i18n/{en,zh-Hans,zh-Hant,ko}/code.json` へ翻訳を登録。
  - 出題例文は日本語変換タイピングに特化しているため、サイトの表示ロケールに関わらず全ロケール共通で日本語の長文を出題する。

## 3. 機能要件

### 3.1. 変換確定ベースの判定・消化ロジック
* **IME Enter 制御**:
  - `event.nativeEvent.isComposing`、`compositionstart`〜`compositionend` の内部フラグ、`event.nativeEvent.keyCode === 229`、および Safari 等の `compositionend` 直後（30ms 未満）に発火する Enter キーイベントを除外し、変換確定の Enter で誤判定されないよう制御する。
  - 変換中でない状態の Enter 押下（または「判定 (Enter)」ボタン押下）で照合を実行する。
  - 入力欄が空の状態で Enter を押した場合は何もしない（総提出文字数・正答率へ計上しない）。
* **文字の正規化・比較ルール**:
  - 結合文字（濁点・半濁点等）の環境差を吸収するため Unicode `NFC` 正規化を適用し、コードポイント配列単位で比較する。
  - 全角英数字・全角 ASCII 記号（`U+FF01`〜`U+FF5E`）は対応する半角文字（`U+0021`〜`U+007E`）へ、全角スペース（`U+3000`）は半角スペース（`U+0020`）へ正規化して比較する。
  - アルファベットの大文字・小文字は厳密に区別する（`A` と `Ａ` は一致、`A` と `a` は不一致）。
  - 日本語文字（ひらがな・カタカナ・漢字・句読点・括弧等）は厳密一致で判定する。
* **先頭一致による消化と残余保持**:
  - 未消化部分の先頭から1文字ずつ比較して最長一致プレフィックス長（`matchedLen`）を算出する。
  - `matchedLen > 0`: 例文カーソル位置と総消化文字数へ `matchedLen` を加算し、入力欄からは先頭 `matchedLen` 文字のみを取り除いて残余文字列を保持する。
  - `matchedLen === 0`: 消化を進めず、エラー枠・シェイクアニメーション・メッセージで不一致を通知し、入力欄の文字列はそのまま保持する。
* **文章完走と巡回**:
  - 例文末尾まで消化したら完走文章数を `+1` し、次の例文へ自動遷移する。
  - 内蔵例文は Fisher-Yates 法で重複なくシャッフル巡回し、全件消化後は直前の末尾例文が先頭に連続しないよう再シャッフルして継続する。

### 3.2. 内蔵プリセット例文
* ビジネス（5本）、IT・開発（6本）、ニュース・コラム（4本）、日常・教養（3本）の計 **18本** を `src/components/Typing/passages.ts` に内蔵。
* 各例文は 80〜150 文字程度の単一パラグラフ（改行なし）とし、日本語（ひらがな・カタカナ・漢字）に加え、英字（大文字・小文字混在）・数字・記号（`%`, `/`, `-`, `:`, `()`, `@`, `#`, `!`, `?`, `.`, `,` 等）を自然に含む。

### 3.3. コース・タイマー・ゲームフロー
* **コース選択**: 1分コース（60秒） / 3分コース（180秒）。
* **画面フェーズ遷移**:
  1. **待機画面 (`idle`)**: コース選択カード（各コース自己ベスト表示）、ルール概要、スタートボタン。
  2. **カウントダウン画面 (`countdown`)**: 3 → 2 → 1 の3秒カウントダウン（中断・キャンセル可能）。終了と同時にタイマーを開始し、入力欄へ自動フォーカス。
  3. **プレイ画面 (`playing`)**:
     - 残り時間（`MM:SS`＋プログレスバー、残り10秒以下で警告色）、現在の消化文字数、完走文章数。
     - 課題文表示エリア（ジャンルバッジ・タイトル・進捗・消化済み／現在位置／未消化のスタイル区別、行間 `1.7`・文字間隔 `0.03em`、クリック時に入力欄へフォーカス復帰）。
     - 入力欄（`onPaste` / `onDrop` / `onDragOver` でペースト・ドロップを禁止し、ブロック時にフィードバック表示）。
     - リトライボタン・中断ボタン。
  4. **結果画面 (`result`)**:
     - 制限時間が 0 秒になった時点で即座に遷移（タイムアップ時に未 Enter の入力欄テキストはスコアに含めない）。
     - 表示項目: 総消化文字数（メインスコア）＋ 自己ベスト更新バッジ（`NEW BEST!`）、CPM、正答率（`総消化文字数 / 総提出文字数 × 100`、提出 0 時は `0%`）、完走文章数、ランク評価、自己ベストとの比較。
     - 操作: 結果テキストのクリップボードコピー、同じコースでもう一度、コース選択へ戻る。

### 3.4. ランク評価基準（CPM）
| ランク | CPM 基準 | 評価目安 |
|---|---|---|
| S | 200 以上 | エキスパート級 |
| A | 150 〜 199 | 上級レベル |
| B | 100 〜 149 | 実務レベル |
| C | 60 〜 99 | 標準レベル |
| D | 60 未満 | 入門レベル |

## 4. URL クエリパラメータ & LocalStorage 仕様

### 4.1. URL クエリパラメータ
| パラメータ | 型 | 許容値 | デフォルト | 説明 |
|---|---|---|---|---|
| `course` | string | `"60"` / `"180"` | `"60"` | 選択中のコース時間（秒） |

### 4.2. LocalStorage スキーマ
* **キー**: `sawara_typing_best_records_v1`
* **値 (JSON)**:
  ```json
  {
    "60": {
      "chars": 165,
      "cpm": 165,
      "accuracy": 95.4,
      "completedPassages": 1,
      "achievedAt": "2026-11-23T08:00:00.000Z"
    },
    "180": {
      "chars": 480,
      "cpm": 160,
      "accuracy": 94.1,
      "completedPassages": 4,
      "achievedAt": "2026-11-23T08:05:00.000Z"
    }
  }
  ```
* 消化文字数が 0 の場合は自己ベストとして保存しない。既存記録を上回った場合のみ更新する。

## 5. ディレクトリ・ファイル構成
* `src/components/Typing/index.tsx`: UI コンポーネント（`MuiTheme` ラップ、状態遷移・IME/タイマー制御）
* `src/components/Typing/logic.ts`: 文字正規化・先頭一致消化・IMEガード・スコア算出・シャッフル・URL/LocalStorage 永続化の純粋ロジック
* `src/components/Typing/passages.ts`: 内蔵プリセット例文データ（18本）
* `src/components/Typing/styles.module.css`: ライト／ダークモード・レスポンシブ対応スタイル
* `src/components/Typing/index.test.ts`: Vitest 単体テストスイート
* `src/components/FeatureList/index.tsx`: トップページツール一覧登録（`Keyboard` アイコン）
* `docs/tools/typing.mdx` および `i18n/{en,zh-Hans,zh-Hant,ko}/docusaurus-plugin-content-docs/current/tools/typing.mdx`: 多言語 MDX ドキュメント
