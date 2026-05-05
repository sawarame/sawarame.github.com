# 新規ツール追加ワークフロー (Add New Tool Workflow)

新しいツールをプロジェクトに追加する際の手順です。

## 1. ページ作成
*   `src/pages/[tool_name].tsx` を作成する。
*   既存のツール（例: `password.tsx`）を参考に、レイアウトコンポーネントでラップする。

## 2. スタイリング
*   `src/css/[tool_name].module.css` を作成する。
*   `.tsx` ファイルで CSS Modules としてインポートし、一貫したクラス命名規則（`common.module.css` の流用など）に従う。

## 3. 多言語対応 (i18n)
*   `Translate` コンポーネントを使用し、`i18n/en/code.json` に必要な翻訳テキストを追記する。

## 4. ナビゲーション更新 (必要に応じて)
*   `docusaurus.config.ts` やヘッダーコンポーネントに、新機能へのリンクを追加する。

## 5. 設計原則の遵守確認
*   `.agents/rules/design-principles.md` を読み返し、「完全ローカル処理」「URL同期」が実装されているか確認する。

## 6. 仕様書の更新
*   `.agents/rules/tool-specs.md` に、新しく追加したツールの概要を追記する。
