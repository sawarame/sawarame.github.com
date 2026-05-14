---
name: mdx-transferrer
description: 既存のReactツールページを再利用可能なコンポーネントとして抽出し、多言語（i18n）対応を維持しながらDocusaurusのMDXドキュメントに統合するためのワークフロー。ツールをMDXで利用可能にする、またはドキュメント構造にツールを移行するよう指示された場合に使用するスキルです。
---

# MDX Transferrer (インタラクティブツール移行ガイド)

このスキルは、独立したReactページ（`src/pages/*.tsx`）にあるインタラクティブなツールを、DocusaurusのMDXドキュメント内に埋め込める再利用可能なコンポーネントに移行するための標準的なワークフローを提供します。このプロセスにより、URLの同期機能と多言語（i18n）対応を維持することができます。

## 移行ワークフロー

以下の手順に従ってツールの移行を行ってください。

### 1. コアコンポーネントの抽出

ツールコンポーネント用の新しいディレクトリを作成します（例: `src/components/YourToolName/index.tsx`）。

- **ロジックとUIの移動**: 元のページからインタラクティブなコアラジックとUI要素をこの新しいコンポーネントに移動します。
- **ページラッパーの削除**: コアコンポーネント内には `<Layout>`、`<PageHeader>`、または独立した `UsageGuide` (使い方) などのコンポーネントを含めないでください。コンポーネントは純粋なインタラクティブツールのみであるべきです。
- **URLの同期**: ツールがURLのクエリパラメータと状態を同期している場合、ネイティブの `window.location` と `window.history` の呼び出しをDocusaurusのルーターフックに置き換えます。

  ```tsx
  import { useHistory, useLocation } from "@docusaurus/router";

  // コンポーネント内:
  const history = useHistory();
  const location = useLocation();

  // URLの読み取り:
  const searchParams = new URLSearchParams(location.search);

  // URLの更新:
  history.replace({ search: newSearch ? `?${newSearch}` : "" });
  ```

### 2. 元ページのリアーキテクチャ (リファクタリング)

元のページ（`src/pages/your-tool.tsx`）を更新し、新しく作成したコンポーネントを使用するようにします。

- `<Layout>` と `<PageHeader>` はそのまま保持します。
- 抽出したコンポーネントをインポートしてレンダリングします。
- **重要**: テキストベースの説明、警告、または `UsageGuide` コンポーネントはコアコンポーネントから**外し**、このページファイル内に戻して、ツールコンポーネントの横または下に配置するようにしてください。

### 3. デフォルト（日本語）のMDXドキュメントの作成

ドキュメント内でツールをホストするMDXファイルを作成します（例: `docs/tools/your-tool.mdx`）。

- **Frontmatter**: タイトルとクリーンなURL slugを定義します。
  ```mdx
  ---
  title: あなたのツール名
  slug: /tools/your-tool
  sidebar_position: 3
  ---
  ```
- **コンポーネントのインポート**: `@site` エイリアスを使用してコンポーネントをインポートします。
  ```mdx
  import YourToolName from "@site/src/components/YourToolName";
  ```
- **Markdownコンテンツ**: Reactコンポーネントの代わりに、標準のMarkdownを使用して説明と使い方ガイドを記述します。セキュリティの警告などにはDocusaurusのアドモニション（`:::info` など）を使用してください。
- **埋め込み**: ツールを表示したい場所に `<YourToolName />` タグを配置します。

### 4. 翻訳版（英語）のMDXドキュメントの作成

新しいMDXページがサイトの英語版でも機能し、404エラーを返さないようにするには、`i18n` ディレクトリにミラーファイルを作成する必要があります。

- **パス**: `i18n/en/docusaurus-plugin-content-docs/current/tools/your-tool.mdx` にファイルを作成します。
- **翻訳**: Markdownのテキスト、見出し、およびFrontmatterの `title` を英語に翻訳します。
- **コンポーネントの維持**: `import` ステートメントと `<YourToolName />` タグは、日本語版とまったく同じ状態にしておきます。（コンポーネント内部の文字列は `code.json` と `@docusaurus/Translate` によって処理されます）。

## 重要な注意点

- **関心の分離 (Separation of Concerns)**: Reactコンポーネントはツールの「機能」のみを処理すべきです。ツールの「使い方」の説明は、親となる `.tsx` ページや `.mdx` ドキュメントの役割です。コンポーネント内でドキュメントの表示を切り替えるために、`showGuide` のような真偽値（boolean）フラグを使用しないでください。
- **i18n 開発サーバーの挙動**: Docusaurusの開発サーバー（`yarn start`）は、通常一度に1つのロケール（言語）しか提供しません。ローカルで言語を切り替える際に、404エラーや奇妙なURLのスタッキング（例: `/en/en/tools/...`）が発生した場合、これは開発サーバーの正常な挙動です。ローカルで英語表示をテストするには、`yarn start --locale en` を実行する必要があります。
- **レスポンシブデザインの調整**: ツールを単独のページ (`src/pages/`) から MDX ドキュメント (`docs/`) に移行すると、画面の両サイドにサイドバーや目次が追加されるため、メインコンテンツの表示領域が狭くなります。そのため、CSS モジュール (例: `your-tool.module.css`) に設定されているメディアクエリのブレイクポイントを見直し、**より広い画面幅 (例: `1024px` や `1280px` など) で 1 カラムレイアウトに切り替わるように調整**してください。
