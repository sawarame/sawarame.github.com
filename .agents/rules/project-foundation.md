# プロジェクト基本原則 (Project Foundation)

本プロジェクトにおける AI エージェントの行動指針と基本ルールです。

## 1. プロジェクト概要
*   **プロジェクト名**: sawara.me
*   **種類**: Docusaurus をベースとしたドキュメント・ブログ・ツール集サイト。
*   **主要目的**: 美しく統一されたデザインと、管理しやすいページ構造、および便利なツール群の提供。

## 2. 技術スタック
*   **フレームワーク**: Docusaurus (React)
*   **UI ライブラリ**: MUI (Material UI)
    *   テーマ設定は `src/components/MuiTheme/` で管理されている。
*   **言語**: TypeScript (必須)
*   **スタイリング**: CSS Modules, カスタムCSS, MUI System
*   **パッケージマネージャー**: Yarn

## 3. コーディング規約
*   **型安全**: `interface` / `type` を明記し、`any` 型を極力排除すること。
*   **コンポーネント**: React Functional Component (FC) と Hooks を使用。
*   **スタイリング**: `src/css/` 内の CSS Modules を活用し、レスポンシブデザインを意識すること。
*   **Docusaurus 準拠**: フレームワーク標準の機能（Translate, Link等）を優先して使用すること。

## 4. AI 操作ルール
*   **最小限の変更**: 指示されたタスク以外のファイルやコメントを無断で変更・削除しない。
*   **品質担保**: コード生成後は必ず文法・型エラーがないかチェックすること。
*   **仕様の同期**: 機能を変更・追加した際は、必ず `.agents/rules/tool-specs.md` を更新し、実装と仕様を同期させること。
*   **破壊的操作の禁止**: `rm` 等の非可逆な操作は行わない。

## 5. 開発コマンド
*   起動: `yarn start`
*   ビルド: `yarn build`
*   パッケージ追加: `yarn add <package>`
