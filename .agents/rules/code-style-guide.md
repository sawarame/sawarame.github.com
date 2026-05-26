---
trigger: always_on
description: コードスタイルガイドライン
---

# sawara.me コードスタイルガイドライン

このガイドラインは、sawara.me プロジェクトでTypeScript、React、Docusaurus、MUIを用いて開発を行う際に、AIエージェントおよび開発者が遵守すべき厳格なコーディングスタイルと設計規約を定義します。

---

## 1. コメント・ドキュメンテーション規約（最重要）

### A. 日本語コメントの原則
- ソースコードには**できるだけ日本語で詳細なコメント**を残すようにすること。
- コードの「なぜ（Why）」や「複雑なアルゴリズムの意図」を説明するためにコメントを積極的に記述すること。

### B. クラス・メソッド・関数のJSDoc（必須）
- すべてのクラス、インターフェース、カスタムHook、コンポーネント、および関数・メソッドには、必ずその機能や引数、戻り値についての説明を **JSDoc形式** で記述すること。
- JSDoc内の記述言語は特別な理由がない限り**日本語**を使用すること。

#### 記述例:
```typescript
/**
 * ランダムなパスワード文字列を生成します。
 * 
 * @param availableSymbols 使用可能な記号のセット（指定がない場合は全ての記号）
 * @param filterStr 除外したい文字のセット
 * @param length パスワードの長さ
 * @param useSameChar 同じ文字の重複使用を許可するかどうか
 * @param useSymbols 記号を含めるかどうか
 * @returns 生成されたパスワード文字列
 */
const generatePassword = (
  availableSymbols: string,
  filterStr: string,
  length: number,
  useSameChar: boolean,
  useSymbols: boolean
): string => {
  // 実装...
};
```

---

## 2. 言語・TypeScript 規約

- **Strictな型定義**:
  - `any` の使用は原則禁止とする。型が不明な場合は `unknown` を使用し、型ガード等で解決すること。
  - PropsやState、ユーティリティ関数の引数・戻り値には、必ず明確な `interface` または `type` を定義すること。
- **ファイル名とモジュール化**:
  - Reactコンポーネントファイルは、フォルダ構成（例: `src/components/PasswordGenerator/index.tsx`）とし、関連するスタイルは CSS Modules (`styles.module.css`) で同階層に配置すること。

---

## 3. インポート順序（Import Order）

可読性と一貫性を維持するため、インポートは以下のグループに分け、それぞれ空行を挟んで記述すること。

1. **React・コアライブラリ**: `react` や React由来の標準Hooks
2. **Docusaurus関連**: `@docusaurus/*`
3. **外部UIライブラリ**: `@mui/material`, `@mui/icons-material/*`, `lucide-react` など
4. **プロジェクト内共通モジュール/テーマ**: `@site/src/components/*` など
5. **スタイル/CSS**: CSS Modules (`*.module.css`)

#### 記述例:
```typescript
import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';

import { TextField, Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';
```

---

## 4. React & Docusaurus 設計パターン

- **コンポーネント宣言**:
  - 基本的に Arrow Function ではなく `export default function ComponentName() { ... }` の形式で定義すること。
  - サブコンポーネントはメインコンポーネントの上部（または別ファイル）で定義し、メインコンポーネントの内部で関数コンポーネントをネスト定義しないこと。
- **状態（State）とURL同期**:
  - ツールのパラメータや入力状態は、URLのクエリパラメータ (`URLSearchParams`) とリアルタイムに同期すること。
  - `useEffect` を用い、初回マウント時にURLから状態を復元し、状態変更時に `history.replace` でクエリを更新すること。
- **多言語対応 (i18n)**:
  - 画面に表示する全てのテキストはハードコードせず、必ず `translate()` 関数または `<Translate>` コンポーネントを使用すること。
  - 英語翻訳ファイル（`i18n/en/` 配下の JSON）にも翻訳データを必ず追加すること。

---

## 5. ファイル出力・ダウンロード規約

- **サニタイズ**:
  - ファイルの保存・ダウンロード時のデフォルトファイル名は、タイムスタンプ形式 `YYYYMMDDHHMMSS` を基本とすること。
  - ファイル名に含まれるシステム予約文字や制御文字、およびセキュリティリスクのある有害な文字は必ずクライアントサイドでサニタイズすること。
