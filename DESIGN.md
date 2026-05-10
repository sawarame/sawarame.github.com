# sawara.me Design Guidelines (DESIGN.md)

本ドキュメントは、sawara.me プロジェクトの視覚的アイデンティティ、UI/UX 原則、および実装規約を定義します。AIエージェントおよび開発者は、新しいコンポーネントや機能を追加する際、本ガイドラインに従って一貫性のあるデザインを維持してください。

## 1. Visual Theme & Atmosphere
*   **コンセプト**: "Ship small things." (小さなものを速やかに、美しく届ける)
*   **雰囲気**: ミニマリスト、プロフェッショナル、クリーン、ツール志向。
*   **トーン**: ユーザーの作業を邪魔せず、必要な機能に素早くアクセスできる実用的なデザイン。
*   **特徴**: ダークモードを主体とした近未来的なヒーローセクションと、清潔感のあるツールカードの対比。

## 2. Color Palette & Roles

### Brand Colors
*   **Primary (Light)**: `#3366cc` (信頼感のあるブルー)
*   **Primary (Dark)**: `#4f9dff` (視認性の高い明るいブルー)

### Gradient Sets
*   **Hero Background (Light)**: `linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)`
*   **Hero Background (Dark)**: `linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0d1b4b 100%)`
*   **Primary Button**: `linear-gradient(135deg, #667eea, #764ba2)`

### Surface Colors
*   **Background**: Docusaurus 標準の背景色 (`#ffffff` / `#1b1b1d`)
*   **Card Background**: `var(--ifm-card-background-color)`
*   **Highlighted Code**: `rgba(0, 0, 0, 0.1)` (Light) / `rgba(0, 0, 0, 0.3)` (Dark)

## 3. Typography Rules

### Font Stacks
*   **本文/見出し**: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
*   **コード**: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

### Typographic Scales
*   **Line Height**: 日本語の読みやすさを考慮し、本文は `1.6` 〜 `1.8` を推奨。
*   **Letter Spacing**: 日本語は詰めすぎず、`0.02em` 〜 `0.05em` を確保。
*   **Hero Title**: `clamp(2.5rem, 6vw, 4.5rem)`, Font weight 800.
*   **Section Title**: `clamp(1.6rem, 3.5vw, 2.4rem)`, Font weight 800.

## 4. Spacing & Layout

### Grid & Containers
*   **Base Unit**: 8px を基本単位 (`8, 16, 24, 32...`) とする。
*   **Container Max-width**: `1100px`
*   **Grid Gap**: `1.5rem` (24px)
*   **Card Min-width**: `260px`

### Padding
*   **Section Padding**: 5rem (80px) / Mobile: 3.5rem (56px)
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
    *   Primary: 角丸 12px, グラデーション, ホバー時に浮き上がり。
    *   Secondary: 透過背景, `backdrop-filter` 適用。
*   **Input**: アウトライン形式を推奨。フォーカス時の視認性を重視。

### Custom Components
*   **Tool Card**:
    *   `border-radius: 16px`
    *   `border: 1px solid var(--ifm-color-emphasis-200)`
    *   `icon-wrap`: 52x52px, `border-radius: 14px`
*   **Hero Badge**: 100px 角丸, 透過ボーダー, 緑色のパルスドット付き。

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
*   **Breakpoint**: `768px` (Mobile/Tablet 境界)
*   **Mobile Adaptations**:
    *   ヒーローセクションのアクションボタンを縦並びに。
    *   グリッドを 1 カラムに調整。
    *   テーマ切り替えボタンをナビゲーションバーに常時表示。

## 10. Agent Prompt Guide
AIがUIコンポーネントを生成する際の推奨事項：
1.  **MUI v6 + CSS Modules**: 基本は MUI コンポーネントを使用し、複雑なスタイルは CSS Modules で定義してください。
2.  **Color Sync**: 色を指定する際は直接的な Hex ではなく、CSS 変数 (`var(--ifm-color-primary)`) を優先してください。
3.  **i18n First**: 文字列の出力には `Translate` コンポーネントを使用してください。
4.  **Local First**: 外部 API やサーバーサイド処理を提案せず、Web Worker や Canvas API 等のブラウザ機能を活用した実装を提案してください。
