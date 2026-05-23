---
name: i18n-manager
description: 新しいツールの追加、UIコンポーネントの作成・修正、またはブログやドキュメントの翻訳を行う際に使用するスキル。Docusaurusの多言語(i18n)対応ルール、翻訳ファイルの場所（code.jsonやMDXの配置）、およびReactコンポーネントでの `<Translate>` 実装ガイドラインを提供します。多言語対応が関わる作業では必ずこのスキルをアクティブにしてください。
---

# 多言語対応方針 (i18n Policy)

## 1. 基本構成
*   **フレームワーク**: Docusaurus 3 の i18n 機能を使用。
*   **デフォルト言語**: 日本語 (`ja`)。URLパス: `/`。
*   **追加言語**: 英語 (`en`)。URLパス: `/en/`。

## 2. 実装方法 (UIコンポーネント)
*   **Reactコンポーネント内**: 
    *   JSX内では `@docusaurus/Translate` コンポーネントを使用する。
    *   プロパティ渡しなど、静的な文字列が必要な場合は `translate()` 関数を使用する。
*   **翻訳データ (code.json)**: 
    *   カスタムコンポーネントや自作UIの翻訳データは、すべて `i18n/en/code.json` に ID ベースで定義する。
    *   IDの命名規則は、機能やコンポーネント名のプレフィックスを付けること（例: `home.tools.diff.title`, `diff.upload.title`）。

## 3. 実装方法 (ドキュメント・ブログ MDX)
*   **ツールのMDXページ**:
    *   日本語版の元ファイルは `docs/tools/*.mdx` に作成する。
    *   英語版の翻訳ファイルは `i18n/en/docusaurus-plugin-content-docs/current/tools/*.mdx` に作成する。
*   **ブログ記事**: 
    *   日本語版の元ファイルは `blog/` 配下に作成する。
    *   英語版の翻訳ファイルは `i18n/en/docusaurus-plugin-content-blog/` 配下に同じ構造で作成する。
*   **設定ファイル (navbar/footer)**:
    *   `docusaurus.config.ts` に定義されたナビゲーションやフッターの項目は、`i18n/en/docusaurus-theme-classic/` 配下の `navbar.json` や `footer.json` で翻訳する。

## 4. エージェントへの行動指示 (Mandates)
*   **Must Do**: 新しい機能やUIコンポーネントを作成・修正する際は、文字列をハードコードせず、必ず `Translate` コンポーネントまたは `translate()` を使用し、同時に `i18n/en/code.json` に英語の翻訳を追加すること。
*   **Must Do**: 新しいツールページを追加する際は、日本語版MDX (`docs/tools/`) の作成とセットで、必ず英語版MDX (`i18n/en/docusaurus-plugin-content-docs/current/tools/`) も作成すること。
*   **Quality**: 英語翻訳を行う際は、UIのスペースに収まる簡潔な表現を心がけ、技術用語の一貫性を保つこと。
