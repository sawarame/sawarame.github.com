---
name: tool-generator
description: 新しいWebツールを作成し、多言語対応のMDXドキュメントとしてサイトに統合するためのワークフロー。新規ツールの開発を依頼された場合に使用するスキルです。
---

# Tool Generator (新規ツール作成ガイド)

このスキルは、sawara.me に新しいブラウザ完結型のWebツールを作成し、Docusaurus の MDX ドキュメントベースの構造に統合するための標準的なワークフローを提供します。ツールの作成から、URL同期、Markdownでの説明文の記述、そして英語への多言語化 (i18n) までをカバーします。

## 新規ツール作成ワークフロー

以下の手順に従って新規ツールを作成してください。

### 1. 仕様の確認と仕様書の作成

実装を始める前に、必ず要件を整理した仕様書を作成してください。

- `.context/specs/` ディレクトリ配下にツールの仕様書 (例: `new-tool.md`) を作成します。
- プロジェクトガイドライン (`GEMINI.md`) の原則に従い、**サーバー通信を行わない完全なクライアントサイド(ブラウザ内)処理**であることを確認してください。

### 2. コアコンポーネントの実装

ツールのインタラクティブな機能を提供する React コンポーネントを作成します。

*   `src/components/` 配下に新しいディレクトリを作成します（例: `src/components/NewTool/index.tsx`）。
*   **スタイルのカプセル化**: コンポーネント固有のスタイルは同じディレクトリ内に作成し（`src/components/NewTool/styles.module.css`）、コンポーネント内で `import styles from './styles.module.css';` として読み込んでください。
*   **関心の分離**: このコンポーネントは「ツールのUIとロジック」のみを含みます。ツールの「使い方」や「説明」などの静的なテキストは含めないでください。
- **URLの同期**: ツールの状態（設定値など）を URL のクエリパラメータと同期させてください。これによりユーザーが設定を共有・ブックマークできるようになります。

  ```tsx
  import { useHistory, useLocation } from "@docusaurus/router";

  // コンポーネント内:
  const history = useHistory();
  const location = useLocation();

  // 状態変更時のURL更新:
  history.replace({ search: newSearch ? `?${newSearch}` : "" });
  ```

- **コンポーネントの国際化**: コンポーネント内のボタン名やラベルなどの静的テキストは、`@docusaurus/Translate` の `translate()` 関数を使用し、`i18n/en/code.json` に英語の翻訳データを追加してください。

### 3. デフォルト（日本語）のMDXドキュメントの作成

ドキュメント内でツールを表示し、使い方を説明する MDX ファイルを作成します。

- `docs/tools/` 配下にファイルを作成します（例: `docs/tools/new-tool.mdx`）。
- **Frontmatter**: タイトルとクリーンなURL slugを定義します。
  ```mdx
  ---
  title: 新しいツールの名前
  slug: /tools/new-tool
  hide_title: true
  ---
  ```*   **コンポーネントのインポートと配置**:
    ```mdx
    import NewTool from "@site/src/components/NewTool";
    import ToolPageHeader from "@site/src/components/ToolPageHeader";

    <ToolPageHeader
      title="新しいツールの名前"
      desc="ここにツールの概要を書きます"
      icon="✨"
      color1="#3498db"
      color2="#8e44ad"
    />

    <NewTool />

    ## 使い方

    1. 手順1
    2. 手順2

    :::info セキュリティについて
    🔒 処理はすべてブラウザ内で行われ、データがサーバーに送信されることはありません。
    :::
    ```
  ```

### 4. 翻訳版（英語）のMDXドキュメントの作成

英語版のサイトでもツールが利用できるように、MDXのミラーファイルを作成します。

- `i18n/en/docusaurus-plugin-content-docs/current/tools/` 配下に同じ名前のファイルを作成します（例: `i18n/en/docusaurus-plugin-content-docs/current/tools/new-tool.mdx`）。
- **翻訳**: Markdownのテキスト、見出し、および Frontmatter の `title` を英語に翻訳します。
- **コンポーネントの維持**: `import` ステートメントと `<NewTool />` タグは、日本語版とまったく同じ状態にしておきます。

## 重要な注意点

- **完全ローカル処理の徹底**: 繰り返しになりますが、ファイルや入力データは絶対にサーバーへ送信せず、ブラウザの API (Canvas, FileReader 等) を使って処理してください。
- **i18n 開発サーバーの挙動**: Docusaurusの開発サーバー（`yarn start`）は、通常一度に1つのロケールしか提供しません。ローカルで英語表示や言語切り替えをテストするには、`yarn start --locale en` を実行する必要があります。
