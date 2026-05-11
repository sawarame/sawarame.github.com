# sawara.me - プロジェクト構成と開発ガイドライン

本ファイルは、このプロジェクトで開発を行う際の最優先ガイドラインです。

## 1. プロジェクト概要
* **名称**: sawara.me
* **構成**: Docusaurus 3 をベースとした、ドキュメント・ブログ・Webツール集のハイブリッドサイト。
* **基本方針**: [DESIGN.md](DESIGN.md) に基づく統一されたデザイン、管理しやすいページ構造、プライバシー重視のツール群を提供すること。

## 2. 技術スタック
* **フレームワーク**: Docusaurus 3 (React 18)
* **UI ライブラリ**: MUI (Material UI) v6
    * テーマ設定: `src/components/MuiTheme/`
* **言語**: TypeScript (必須、型安全性を重視)
* **スタイリング**:
    * CSS Modules (`*.module.css`)
    * カスタム CSS (`src/css/custom.css`)
    * MUI System / Emotion
* **パッケージマネージャー**: Yarn
* **主要ライブラリ**:
    * 画像/PDF操作: `browser-image-compression`, `react-image-crop`, `pdfjs-dist`, `pdf-lib`, `jszip`
    * QRコード: `qrcode.react`, `@zxing/library`, `jsQR`
    * メタデータ: `exifr`

## 3. 設計原則 (コア・マンデート)
開発時、特に新しいツールを追加する際は以下の原則を厳守してください。

### A. 完全ローカル処理 (Client-Side Only)
* **原則**: 全てのデータ（画像、PDF、テキスト、QR等）はブラウザ内で処理し、外部サーバーへ送信しない。
* **実装**: Canvas API, Web Worker, クライアントサイドライブラリを優先活用する。

### B. 状態の共有と永続化
* **URL同期**: ツールの設定値（長さ、モード等）はリアルタイムでクエリパラメータに反映し、URLによる状態共有を可能にする。
* **LocalStorage**: 一時的なデータやユーザー設定は `localStorage` で永続化する。

### C. UI/UX 規約
* **リアルタイム性**: 入力の変更は即座にプレビューや結果に反映させる。
* **操作性**: 「コピー」ボタン、適切なファイル名（`YYYYMMDDHHMMSS`等）でのダウンロード機能を提供。
* **レスポンシブ**: MUI を活用し、モバイルフレンドリーな設計を徹底する。

### D. 多言語対応 (i18n)
* **言語**: 日本語 (デフォルト) と英語の二ヶ国語対応。
* **手法**: Docusaurus 標準の `Translate` コンポーネントおよび `translate()` 関数を使用。
* **翻訳データ**: `i18n/en/` 配下の JSON ファイルを適切に更新する。

多言語対応の詳細については [SKILL.md](.agents/skills/i18n/SKILL.md) を参照してください。

## 4. コーディング規約
* **React**: Functional Components + Hooks を使用。
* **TypeScript**: `any` の使用を避け、`interface` / `type` を定義する。
* **ディレクトリ構造**:
    * ページ本体: `src/pages/`
    * コンポーネント: `src/components/`
    * スタイル: `src/css/`

## 5. 開発ワークフロー
* **起動**: `yarn start`
* **ビルド**: `yarn build`
* **型チェック**: `yarn typecheck`
* **ツール改修**: 既存ツール改修時は、実装後に必ず `.context/specs/` フォルダの中に仕様書ファイルを更新すること。
* **ツール追加**: 新規ツール作成時は、実装後に必ず `.context/specs/` フォルダの中に仕様書ファイルを作成すること。

## 6. 特記事項
* **セキュリティ**: ファイル名からのシステム予約文字除去など、クライアントサイドでのサニタイズを徹底。
* **API制限**: サーバーサイドAPI（IP取得等）を呼ぶ際は、ボット対策とプライバシーに配慮する。

## 7. ツール別仕様書 (Tool Specifications)

各ツールの詳細な機能要件と実装上の注意点です。
各ツールの仕様は、個別のファイルに分割されています。必要に応じてこれらを参照してください。

### ツール一覧
1. [パスワードジェネレーター](.context/specs/password.md)
2. [テキスト保存場所](.context/specs/text.md)
3. [デバイス情報チェッカー](.context/specs/device.md) 
4. [QRコード作成](.context/specs/qr.md)
5. [日付比較ツール](.context/specs/date.md)
6. [写真Exif情報チェッカー](.context/specs/exif.md)
7. [画像軽量化・クロップツール](.context/specs/resize.md)
8. [PDF変換・編集](.context/specs/pdf-editor.md)
9. [Web快適度測定ツール](.context/specs/benchmark.md)
10. [QRコード読み取り](.context/specs/qr-reader.md)
11. [ルーレットメーカー](.context/specs/roulette.md)

##　8. ブログ執筆について

ブログ執筆をする際は [SKILL.md](.agents/skills/blog/SKILL.md) を参照し、そのルールに従って作成してください。


