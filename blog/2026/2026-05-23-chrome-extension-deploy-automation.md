---
slug: chrome-extension-deploy-automation
title: GitHubのリリースタグをトリガーにChrome拡張機能を自動アップロードする
date: 2026-05-23
draft: false
tags: [GitHub Actions, Chrome Extension, CI/CD, 開発効率化]
emoji: 🧩
---

import LinkCard from '@site/src/components/LinkCard';
import { Puzzle } from 'lucide-react';

Chrome拡張機能の開発において、完成した成果物をZIP形式にまとめ、デベロッパーダッシュボードから手動でアップロードする作業は、頻度が高まると意外に大きな負担となります。
今回は、GitHub Actions を活用して、リリースタグ（v1.0.0 など）の作成をトリガーに、Chrome Web Storeへのアップロードを自動化する方法を紹介します。

<!-- truncate -->

## 自動化のメリット

アップロード作業を自動化することで、主に以下の 2 点のメリットが得られます。

1. **作業手間の削減**: 手動でのビルド、ZIP圧縮、ブラウザ経由のアップロードという一連のルーチンワークから解放されます。
2. **ヒューマンエラーの防止**: アップロードするファイルの取り違えや、特定の環境でのビルドミスといった人的ミスを排除し、常にクリーンな環境から生成された成果物をストアに届けることができます。

## 手順の概要

自動アップロードを実現するための全体像は以下の通りです。

1. **タグの自動作成**: GitHub Actionsで manifest.json からバージョンを取得し、タグを自動作成できるようにする。
2. **Google Cloud Project の設定**: APIを有効化し、認証情報を取得する。
3. **Refresh Token の取得**: API経由で操作するための永続的なトークンを発行する。
4. **GitHub Secrets の設定**: 認証情報を安全にリポジトリに保存する。
5. **リリースタグの作成で自動アップロード**: リリースタグの作成をトリガーにして、認証情報を元にChrome Web Storeへ自動アップロードする。

また、今回は [Nickmark](https://github.com/sawarame/Nickmark) という私が開発した拡張機能で実際に試した例を元に解説します。

---

## 1. タグを自動作成する

まず、プロジェクトの main ブランチに更新があった際、バージョン情報を元に自動でタグを打つ仕組みを作ります。
プロジェクトの `.github/workflows/create-tag.yml` ファイルを以下の内容で作成してください。

```yaml
name: Create Release Tag

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Get version from manifest.json
        run: |
          VERSION=$(jq -r '.version' Nickmark/manifest.json)
          echo "VERSION=v$VERSION" >> $GITHUB_ENV
          echo "Detected version: v$VERSION"

      - name: Create and Push Tag
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          
          if git ls-remote --tags origin "refs/tags/${VERSION}" | grep -q "${VERSION}"; then
            echo "Tag ${VERSION} already exists in remote. Skipping tag creation."
          else
            git tag "${VERSION}"
            git push origin "${VERSION}"
            echo "🎉 Successfully created and pushed tag: ${VERSION}"
          fi
```

このファイルをリポジトリにコミットすると、GitHub Actions に **Create Release Tag** というワークフローが追加されます。

このワークフローは、main ブランチへのコミット時に manifest.json のバージョンを確認し、新しいバージョンであれば自動的にタグを作成します。すでに同じバージョンのタグが存在する場合は、重複作成を避けるため処理をスキップします。

実際にバージョンを上げてコミットすると、以下のようにワークフローが実行され、
![GitHub Actionsのタグ作成ワークフロー実行結果](./images/chrome-extension-deploy-automation_001.png)

新しいタグが作成されます。
![GitHub上で作成された新しいリリースタグ](./images/chrome-extension-deploy-automation_002.png)

最終的に、このタグを元に「リリース」を作成したタイミングで、Chrome Web Storeへ自動アップロードされるように設定していきます。

## 2. Google Cloud Project の設定と API の有効化

次に、API 経由で Chrome Web Store を操作するための準備を行います。

### 1. Google Cloud プロジェクトの作成
- [Google Cloud Console](https://console.cloud.google.com/) にアクセスします。
- 画面左上の「プロジェクトを選択」をクリックし、**「新しいプロジェクト」** を選択します。
![Google Cloud Consoleのプロジェクト選択画面](./images/chrome-extension-deploy-automation_003.png)
- 任意のプロジェクト名（例：「My-Chrome-Extensions」）を入力して作成します。
![プロジェクト名入力画面](./images/chrome-extension-deploy-automation_004.png)
- 作成完了後、再び左上のプロジェクト選択から、作成したプロジェクトを選択状態にします。
![作成したプロジェクトの選択画面](./images/chrome-extension-deploy-automation_005.png)

### 2. Chrome Web Store API の有効化
- 画面上部の検索バーに「Chrome Web Store API」と入力し、検索結果から選択します。
![APIライブラリでのChrome Web Store API検索](./images/chrome-extension-deploy-automation_006.png)
- **「有効化」** ボタンをクリックします。
![Chrome Web Store APIの有効化ボタン](./images/chrome-extension-deploy-automation_007.png)

### 3. OAuth クライアントの作成
- 左側のメニューから「APIとサービス」 > **「OAuth 同意画面」** を選択します。User Type を「外部」に設定し、公開ステータスを **「本番環境」** に変更します。
![OAuth同意画面の公開ステータス設定](./images/chrome-extension-deploy-automation_008.png)
- 左側のメニューから **「認証情報」** を選択し、画面上部の **「認証情報を作成」 > 「OAuth クライアント ID」** をクリックします。
![認証情報の作成メニュー](./images/chrome-extension-deploy-automation_009.png)
- アプリケーションの種類として **「デスクトップ アプリ」** を選択し、名前を入力（例：「For GitHub Actions」）して作成します。
![OAuthクライアントIDの作成画面](./images/chrome-extension-deploy-automation_010.png)
- 作成後に表示される **クライアント ID** と **クライアント シークレット** を大切に保管しておきます。
![クライアントIDとクライアントシークレットの表示画面](./images/chrome-extension-deploy-automation_011.png)

## 3. Refresh Token の取得

API アクセスに必要な「リフレッシュトークン」を取得します。

### 1. 認証コードの取得
以下の URL の `[CLIENT_ID]` 部分を先ほど取得したクライアント ID に書き換え、ブラウザでアクセスします。
```text
https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=[CLIENT_ID]&redirect_uri=http://127.0.0.1
```

- Google アカウントの選択画面が表示されるので、対象のアカウントを選択します。
![Googleアカウント選択画面](./images/chrome-extension-deploy-automation_012.png)
- 「このアプリは Google で確認されていません」と表示された場合は、左下の「詳細」をクリックし、**「（プロジェクト名）に移動（安全ではない）」** を選択します。
![セキュリティ警告画面での詳細表示](./images/chrome-extension-deploy-automation_013.png)
- 権限のリクエスト画面で **「続行」** をクリックします。
![アクセスのリクエスト確認画面](./images/chrome-extension-deploy-automation_014.png)

アクセス許可後、ブラウザの URL が `http://127.0.0.1` で始まるものに切り替わります。この URL 内にある `code=` の直後から `&scope` の直前までが **認証コード** です。

### 2. リフレッシュトークンの発行
ターミナルを開き、以下のコマンドの各項目を書き換えて実行します。

```bash
curl "https://accounts.google.com/o/oauth2/token" \
-d "client_id=[クライアントID]&client_secret=[クライアントシークレット]&code=[取得した認証コード]&grant_type=authorization_code&redirect_uri=http://127.0.0.1"
```

成功すると以下のような JSON レスポンスが返ってくるので、その中の `refresh_token` の値をコピーして保存します。

```json
{
  "access_token": "ya29.a0A...",
  "expires_in": 3599,
  "refresh_token": "1//0e...",
  "scope": "https://www.googleapis.com/auth/chromewebstore",
  "token_type": "Bearer"
}
```

:::info
"expires_in": 3599 は「1時間(3599秒)で有効期限が切れる」という意味ですが、これは `access_token` の有効期限になります。

リフレッシュトークンを使ってアクセストークンを再発行する（＝GitHub Actionsで実行）が6ヶ月間（約180日）に一度も行われないと　`refresh_token` は自動的に期限切れになりますので、半年に一回はバージョンアップを行っておけば `refresh_token` が無効になってGitHub Actionsのジョブが失敗するということはありません。
:::

## 4. GitHub Secrets の設定

取得した認証情報を、GitHub リポジトリの Settings > Secrets and variables > Actions > Repository secrets に登録します。

| 名前 | 内容 |
| :--- | :--- |
| `CHROME_CLIENT_ID` | OAuth クライアントのクライアント ID |
| `CHROME_CLIENT_SECRET` | OAuth クライアントのクライアント シークレット |
| `CHROME_REFRESH_TOKEN` | 取得したリフレッシュトークン |
| `CHROME_EXTENSION_ID` | 拡張機能の ID |
| `PUBLISHER_ID` | パブリッシャー ID |

各 ID は、Chrome Web Store デベロッパーダッシュボードから確認できます。

- **拡張機能の ID**: 各拡張機能の個別ページで確認。
![デベロッパーダッシュボードでの拡張機能ID確認](./images/chrome-extension-deploy-automation_016.png)

- **パブリッシャー ID**: デベロッパーダッシュボードの設定画面から確認。
![デベロッパーダッシュボードの設定画面でのパブリッシャーID確認](./images/chrome-extension-deploy-automation_017.png)

## 5. GitHub Actions のワークフローを作成する

最後に、リリース作成時に実行されるアップロード用のワークフローを作成します。
`.github/workflows/release.yml` を以下の内容で作成します。

```yaml
name: Publish to Chrome Web Store

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies & Build
        run: |
          npm install
          npm run build

      - name: Upload and Publish
        run: npx chrome-webstore-upload-cli@latest --source Nickmark.zip
        env:
          EXTENSION_ID: ${{ secrets.EXTENSION_ID }}
          CLIENT_ID: ${{ secrets.CLIENT_ID }}
          CLIENT_SECRET: ${{ secrets.CLIENT_SECRET }}
          REFRESH_TOKEN: ${{ secrets.REFRESH_TOKEN }}
          PUBLISHER_ID: ${{ secrets.PUBLISHER_ID }}
```

Nickmark の場合は `npm run build` でパッケージ（Nickmark.zip）が生成される仕組みになっているため、ビルド後にそのままアップロード手順を実行しています。プロジェクトの構成に合わせて、必要に応じて ZIP 圧縮を行うステップを追加してください。

---

## 動作確認

設定がすべて完了したので、実際にタグからリリースを作成して動作確認してみます。

GitHub のタグ一覧から、作成されたタグの **「Create release from tag」** をクリックします。
![GitHubのタグ一覧からのリリース作成ボタン](./images/chrome-extension-deploy-automation_018.png)

リリースノートを入力して **「Publish release」** をクリックすると、GitHub Actions のワークフローが開始されます。
![リリース公開ボタンのクリック](./images/chrome-extension-deploy-automation_019.png)

ワークフロー完了後、デベロッパーダッシュボードを確認すると、ステータスが「審査待ち」に更新されているはずです。
![デベロッパーダッシュボードでの審査待ちステータス](./images/chrome-extension-deploy-automation_020.png)

バージョンも正しく更新されており、自動化に成功しました。
![ストアにアップロードされた新しいバージョン情報の確認](./images/chrome-extension-deploy-automation_021.png)

## 注意点

- **初回アップロード**: まだ一度もストアに公開していない拡張機能の場合、初回のみデベロッパーダッシュボードから手動で ZIP をアップロードする必要があります。API による更新は、すでに存在するアイテムが対象となります。
- **権限の変更**: manifest.json の `permissions` や `host_permissions` に変更があった場合、自動的には審査へ提出されません。その場合はデベロッパーダッシュボードにログインし、不足している説明項目などを入力してから、手動で「審査のために送信」を行う必要があります。

## まとめ

一度この仕組みを構築してしまえば、manifest.json のバージョンを上げてコミットするだけで公開準備が整います。

手動作業による心理的ハードルやミスを減らし、開発の本来の目的である機能改善にリソースを集中できるようになります。Chrome 拡張機能を継続的にメンテナンスしている方の参考になれば幸いです。
