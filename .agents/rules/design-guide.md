---
trigger: always_on
description: デザインガイドライン
---

# sawara.me 統合デザイン・実装ガイドライン

このルールは、sawara.me プロジェクトでUIコンポーネントやツールのデザイン・コーディングを行う際に、AIエージェントが遵守すべき厳格なガイドラインです。本ファイルは `DESIGN.md` の全デザインシステムと実装規約を完全に統合しており、エージェントは他のファイルを別途参照することなく、このルールに従って一貫性のあるデザインを維持する必要があります。

---

## 1. コア設計原則（完全厳守）
- **完全ローカル処理（Client-Side Only）**: 
  - すべてのデータ（画像、PDF、テキスト、QR等）はブラウザ内（クライアントサイド）で処理し、いかなる理由があっても外部サーバーへ送信しないこと。
  - Canvas API, Web Worker, または信頼できるローカル処理ライブラリ（`browser-image-compression`, `react-image-crop`, `pdfjs-dist`, `pdf-lib`, `jszip` など）を優先活用すること。
- **状態の同期と永続化**:
  - ツールの設定値（長さ、モード、入力値など）は、リアルタイムでURLのクエリパラメータに同期し、状態を共有可能にすること。
  - 一時的なユーザー設定や状態は `localStorage` を使用して永続化すること。
- **多言語対応（i18n）**:
  - UI内のすべての日本語テキストはハードコードせず、Docusaurusの `Translate` コンポーネントまたは `translate()` 関数を使用して多言語対応させること。英語翻訳データは `i18n/en/` 配下の適切なJSONファイルに追加すること。

---

## 2. デザインシステムトークン（Design System Tokens）
UIを構築する際は、以下のトークン値を厳格に使用し、マジックナンバーや即値（Hexコード等）を直接コードに記述しないこと。

### A. カラー（Colors）
- **ブランドカラー（Brand Colors）**:
  - `Primary (Light)`: `#3366cc`
  - `Primary (Dark)`: `#4f9dff`
- **サーフェスカラー（Surface Colors）**:
  - `Background (Light)`: `#ffffff`
  - `Background (Dark)`: `#1b1b1d`
  - `Card Background`: `var(--ifm-card-background-color)` （Docusaurusテーマと同期）
  - `Highlighted Code`: `rgba(0, 0, 0, 0.1)` (Light用) / `rgba(0, 0, 0, 0.3)` (Dark用)
- **グラデーションセット（Gradients）**:
  - `Hero Background (Light)`: `linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)`
  - `Hero Background (Dark)`: `linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0d1b4b 100%)`
  - `Primary Button`: `linear-gradient(135deg, #667eea, #764ba2)`

### B. タイポグラフィ（Typography）
- **フォントファミリー（Font Family）**:
  - `Sans-serif` (本文/見出し): `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
  - `Monospace` (コード/数値): `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
- **日本語の読みやすさ設定**:
  - `Line Height` (本文行間): `1.7`
  - `Letter Spacing` (文字間隔): `0.03em`
- **タイポグラフィスケール**:
  - `Hero Title`: 魚を模したSVGタイポグラフィ（`SawaraFishLogo`）を使用。
  - `Section Title`: `clamp(1.6rem, 3.5vw, 2.4rem)`, Font weight: `800`

### C. スペーシング＆レイアウト（Spacing & Layout）
- **ベース単位（Base Unit）**: `8px` を基本とし、マージンやパディングは必ず `8, 16, 24, 32, 40...` などの8の倍数で設計すること。
- **コンテナ最大幅（Container Max-width）**: `1100px`
- **グリッドギャップ（Grid Gap）**: `1.5rem` (`24px`)
- **カード最小幅（Card Min-width）**: `260px`
- **セクションパディング（Section Padding）**: `5rem` (`80px`) / モバイル時: `3.5rem` (`56px`)
- **ヒーローパディング（Hero Padding）**: `1.5rem` (`24px`) （極限まで高さを抑え、コンテンツへの到達を早めるため）
- **カードパディング（Card Padding）**: `1.6rem` (`25.6px`)

### D. 境界と角丸（Borders & Border Radius）
- `Card Border Radius`: `16px`
- `Button Border Radius`: `12px`
- `Icon Wrap Border Radius`: `14px`

---

## 3. UI/UX・レイアウト原則
- **プレミアムなビジュアル（Rich Aesthetics）**:
  - 単純なプレーン色（純粋な赤、青、緑など）の使用を避け、ダークモードや洗練されたカラーパレット、滑らかなグラデーション、美しいタイポグラフィを使用すること。
  - ホバー効果やマイクロアニメーションを効果的に追加し、インターフェースが responsive で活き活きと動くようにすること。
- **純粋な黒（#000）の回避**:
  - テキストには濃いグレー、背景には深い紺色/黒色（`tokens.color.surface.background.dark`）を使用し、コントラストを和らげること。
- **奥行きと浮遊感（Elevation & Shadows）**:
  - `MUI Elevation`: 基本は `0` 〜 `1`。重要な要素には控えめな影を使用すること。
  - `Card Hover`: `translateY(-4px)` に加え、影 `box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12)` を適用すること。
  - `Backdrop Filter`: 透過要素（Hero badge, Secondary button）には `blur(12px)` を適用すること。
  - `Animations`: 緩やかな浮遊アニメーション（`float`, `floatCenter`）やステータスドットのパルス効果を適宜使用すること。

---

## 4. コンポーネント実装仕様
- **技術スタック**:
  - React 18 + TypeScript (型安全性を重視し、`any` の使用を避ける)
  - UIライブラリ: MUI (Material UI) v6。テーマ設定（`src/components/MuiTheme/`）と完全同期させること。
  - スタイリングは MUI System/Emotion、および CSS Modules (`*.module.css`) を併用すること。
- **MUI Button**:
  - `Primary`: 角丸 `12px`、グラデーション（`linear-gradient(135deg, #667eea, #764ba2)`）、ホバー時に浮き上がりを適用する。
  - `Secondary`: 透過背景、`backdrop-filter: blur(12px)` を適用する。
- **MUI Input**:
  - アウトライン形式を推奨し、フォーカス時の視認性を極めて重視すること。
- **Tool Card（ツールカード）**:
  - `border-radius`: `16px`
  - `border`: `1px solid var(--ifm-color-emphasis-200)`
  - `icon-wrap`: `52x52px` の正方形、`border-radius`: `14px`、背景は Primary gradient。
  - `icon`: Lucideアイコン（白 `#ffffff`）を中央に配置。
- **Tool Page Header（ツールページヘッダー）**:
  - 装飾的なオーブや背景グラデーションを排除した、クリーンで実用的な「フラット」デザインとすること。
  - 背景は `var(--ifm-color-emphasis-100)` のベタ塗りに、下部境界線 `1px solid var(--ifm-color-emphasis-200)` とする。
  - アイコンは 64x64px の正方形ボックス（ブランドカラー背景）内に Lucide アイコン（白）を配置する。
- **File Selection Area（DropZone / ファイル選択エリア）**:
  - MUI SVG アイコンを使用し、サイズは `3rem` (`48px`) に統一する。
  - メイン文言は「クリック・ドラッグ＆ドロップ、または貼り付けで選択」に統一する。
  - サブ文言に「対応フォーマット: [拡張子]」を明記する。
  - ドラッグ＆ドロップに加え、クリップボードからの貼り付け（Paste）によるファイル入力に必ず対応させる。
- **Data List / Custom Table（データリスト / カスタムテーブル）**:
  - ブラウザやフレームワークのデフォルトスタイルとの干渉を防ぎ、境界線やマージンを精密に制御するため、標準 of `table` タグではなく、`display: flex` を使用したリスト形式を推奨する。
  - 行間の境界線には `var(--ifm-color-emphasis-200)` を使用し、最終行の `border-bottom` は `none` にして外枠と重ならないようにする。
  - 行ホバー時には微細な背景色変更（例: `rgba(var(--ifm-color-primary-rgb), 0.02)`）を適用する。

---

## 5. アイコン・画像規約
- **ロゴ**: `img/sawara_logo_light.svg` / `img/sawara_logo_dark.svg`
- **コアアイコン**: `lucide-react` を基本とする。
  - 線幅（`stroke-width`）は `2px`、サイズは用途に応じ `16/24/32/48px` を使い分けること。
  - ページヘッダーやカードなどの構造的要素に絵文字を使用せず、Lucideアイコンで統一すること。
- **拡張子アイコン**: `src/icons/` 配下の PNG を使用すること。
- **プレースホルダー**: 画像がない場合は Primary カラーのグラデーションや幾何学模様を使用し、デザインの空白を作らないこと。

---

## 6. レスポンシブ動作
- **ブレイクポイント**: `900px`（Homepage/Grid 境界）および `768px`（一般的なモバイル）
- **モバイル表示時の調整**:
  - グリッドレイアウトを 1カラムに自動調整すること（900px以下）。
  - ヒーローセクションのパディングを維持しつつ、フォントサイズを微調整すること。
  - テーマ切り替えボタンをナビゲーションバーに常時表示させること。

---

## 7. コーディング・開発規約
- **コメントとJSDoc**:
  - コード内のコメントや JSDoc、およびマークダウンドキュメントの記述には、特別な理由がない限り**日本語**を使用すること。
  - 作成するすべてのクラス、関数、カスタムHookには、必ず分かりやすい JSDoc（JavaDoc/JSDoc形式）を記載すること。
- **ファイル名とダウンロード**:
  - ファイルのダウンロード機能を提供する際は、デフォルトのファイル名を `YYYYMMDDHHMMSS` 形式（タイムスタンプ）にすること。また、ダウンロード前にシステム予約文字や有害な文字を除去するサニタイズを徹底すること。
- **変更時の仕様書更新**:
  - ツールを新規追加した際は `.context/specs/` に新しい仕様書を作成し、既存ツールを改修した際は対応する仕様書を必ず更新すること。
