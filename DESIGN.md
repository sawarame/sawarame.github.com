---
version: 1.0.0
tokens:
  color:
    brand:
      primary:
        light: "#3366cc"
        dark: "#4f9dff"
    surface:
      background:
        light: "#ffffff"
        dark: "#1b1b1d"
      card: "var(--ifm-card-background-color)"
    gradient:
      hero:
        light: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)"
        dark: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0d1b4b 100%)"
      button: "linear-gradient(135deg, #667eea, #764ba2)"
  typography:
    font_family:
      sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    line_height:
      body: 1.7
    letter_spacing:
      default: "0.03em"
  spacing:
    base: 8
    container_max_width: 1100
  border:
    radius:
      card: 16
      button: 12
      icon_wrap: 14
---

# sawara.me Design Guidelines (DESIGN.md)

本ドキュメントは、sawara.me プロジェクトの視覚的アイデンティティ、UI/UX 原則、および実装規約を定義します。AIエージェントおよび開発者は、新しいコンポーネントや機能を追加する際、本ガイドラインに従って一貫性のあるデザインを維持してください。

## 1. Visual Theme & Atmosphere
*   **コンセプト**: "Ship small things." (小さなものを速やかに、美しく届ける)
*   **雰囲気**: ミニマリスト、プロフェッショナル、クリーン、ツール志向。
*   **トーン**: ユーザーの作業を邪魔せず、必要な機能に素早くアクセスできる実用的なデザイン。
*   **特徴**: ダークモードを主体とした近未来的なヒーローセクションと、清潔感のあるツールカードの対比。

## 2. Color Palette & Roles

### Brand Colors
*   **Primary (Light)**: `tokens.color.brand.primary.light`
*   **Primary (Dark)**: `tokens.color.brand.primary.dark`

### Gradient Sets
*   **Hero Background**: `tokens.color.gradient.hero`
*   **Primary Button**: `tokens.color.gradient.button`

### Surface Colors
*   **Background**: `tokens.color.surface.background`
*   **Card Background**: `tokens.color.surface.card`
*   **Highlighted Code**: `rgba(0, 0, 0, 0.1)` (Light) / `rgba(0, 0, 0, 0.3)` (Dark)

## 3. Typography Rules

### Font Stacks
*   **本文/見出し**: `tokens.typography.font_family.sans`
*   **コード**: `tokens.typography.font_family.mono`

### Typographic Scales
*   **Line Height**: 日本語の読みやすさを考慮し、本文は `tokens.typography.line_height.body` を推奨。
*   **Letter Spacing**: 日本語は詰めすぎず、`tokens.typography.letter_spacing.default` を確保。
*   **Hero Title**: 魚を模したSVGタイポグラフィ（`SawaraFishLogo`）を使用。
*   **Section Title**: `clamp(1.6rem, 3.5vw, 2.4rem)`, Font weight 800.

## 4. Spacing & Layout

### Grid & Containers
*   **Base Unit**: `tokens.spacing.base` px を基本単位 (`8, 16, 24, 32...`) とする。
*   **Container Max-width**: `tokens.spacing.container_max_width` px
*   **Grid Gap**: `1.5rem` (24px)
*   **Card Min-width**: `260px`

### Padding
*   **Section Padding**: 5rem (80px) / Mobile: 3.5rem (56px)
*   **Hero Padding**: 1.5rem (24px) / 極限まで高さを抑え、コンテンツへの到達を早める。
*   **Card Padding**: 1.6rem (25.6px)

## 5. Depth & Elevation

### Shadows & Effects
*   **MUI Elevation**: 基本は 0〜1。重要な要素には控えめな影を使用。
*   **Card Hover**: `translateY(-4px)`, `box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12)`
*   **Backdrop Filter**: `blur(12px)` (Hero badge, Secondary button)

### Animations
*   **Hero Orbs**: 緩やかな浮遊アニメーション (`float`, `floatCenter`)
*   **Pulse**: ステータスドット等のパルス効果

## 6. Component Stylings

### MUI (Material UI) v6
*   **Theme Integration**: `src/components/MuiTheme/` で Docusaurus のカラーモードと完全同期。
*   **Button**:
    *   Primary: 角丸 `tokens.border.radius.button` px, グラデーション, ホバー時に浮き上がり。
    *   Secondary: 透過背景, `backdrop-filter` 適用。
*   **Input**: アウトライン形式を推奨。フォーカス時の視認性を重視。

### Custom Components
*   **Tool Card**:
    *   `border-radius`: `tokens.border.radius.card` px
    *   `border: 1px solid var(--ifm-color-emphasis-200)`
    *   `icon-wrap`: 52x52px, `border-radius`: `tokens.border.radius.icon_wrap` px
*   **File Selection Area (DropZone)**:
    *   **Icon**: MUI SVG アイコンを使用。サイズは `3rem` (`48px`) に統一。
    *   **Main Text**: 「クリック・ドラッグ＆ドロップ、または貼り付けで選択」に統一。
    *   **Sub Text**: 「対応フォーマット: [拡張子]」を必ず明記。
    *   **Function**: ドラッグ＆ドロップに加え、クリップボードからの貼り付け（Paste）によるファイル入力に必ず対応させる。

## 7. Icons & Images
*   **Logo**: `img/sawara_logo.svg`
*   **Tool Icons**: `src/icons/` 配下の SVG/PNG を使用。一貫したサイズ感で配置。
*   **Placeholders**: 画像がない場合は Primary カラーのグラデーションや幾何学模様を使用。

## 8. Do's and Don'ts

### Do
*   **Client-Side Only**: 全てのデータ処理をブラウザ内で完結させる（プライバシー最優先）。
*   **Real-time Feedback**: 入力変更は即座にプレビュー/結果に反映。
*   **Action Clarity**: 「コピー」「ダウンロード」ボタンを明示的に配置。
*   **Filename Convention**: ダウンロード時は `YYYYMMDDHHMMSS` 形式をデフォルトとする。

### Don't
*   **純粋な黒 (#000) を避ける**: テキストには濃いグレー、背景には深い紺色/黒色を使用する。
*   **過度な装飾**: ツールとしての道具感を損なう過度な演出は避ける。
*   **i18n を忘れない**: 文字列をハードコードせず、必ず翻訳対応させる。

## 9. Responsive Behavior
*   **Breakpoint**: `900px` (Homepage/Grid 境界) / `768px` (General Mobile)
*   **Mobile Adaptations**:
    *   グリッドを 1 カラムに調整（900px 以下）。
    *   ヒーローセクションのパディングを維持しつつ、フォントサイズを微調整。
    *   テーマ切り替えボタンをナビゲーションバーに常時表示。

## 10. Agent Prompt Guide
AIがUIコンポーネントを生成する際の推奨事項：
1.  **MUI v6 + CSS Modules**: 基本は MUI コンポーネントを使用し、複雑なスタイルは CSS Modules で定義してください。
2.  **Token First**: 色やサイズを指定する際は、`DESIGN.md` の `tokens` を参照してください。
3.  **Color Sync**: 色を指定する際は直接的な Hex ではなく、CSS 変数 (`var(--ifm-color-primary)`) を優先してください。
4.  **i18n First**: 文字列の出力には `Translate` コンポーネントを使用してください。
5.  **Local First**: 外部 API やサーバーサイド処理を提案せず、Web Worker や Canvas API 等のブラウザ機能を活用した実装を提案してください。
