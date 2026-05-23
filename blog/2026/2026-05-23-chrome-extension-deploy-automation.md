---
slug: chrome-extension-deploy-automation
title: GitHubのリリースタグをトリガーにChrome拡張機能を自動アップロードする
date: 2026-05-23
draft: true
tags: [GitHub Actions, Chrome Extension, CI/CD, 開発効率化]
emoji: 🧩
---

import LinkCard from '@site/src/components/LinkCard';
import { Puzzle } from 'lucide-react';

Chrome拡張機能の開発において、完成した成果物をZIPに固めて、デベロッパーダッシュボードから手動でアップロードする作業は、頻度が高まると意外に大きな負担となります。
今回は、GitHub Actions を活用して、リリースタグ（v1.0.0 など）の作成をトリガーに、Chrome Web Storeへのアップロードを自動化する方法を紹介します。

<!-- truncate -->

## 自動化のメリット

アップロード作業を自動化することで、主に以下の 2 点のメリットが得られます。

1. **作業手間の削減**: 手動でのビルド、ZIP圧縮、ブラウザ経由のアップロードという一連のルーチンワークから解放されます。
2. **ヒューマンエラーの防止**: アップロードするファイルの取り違えや、特定の環境でのビルドミスといった人的ミスを排除し、常にクリーンな環境から生成された成果物をストアに届けることができます。

## 手順の概要

自動アップロードを実現するための全体像は以下の通りです。

1. **タグの自動作成**: GitHub Actionsでmanifest.jsonからバージョンを取得し、タグを自動作成できるようにする。
2. **Google Cloud Project の設定**: APIを有効化し、認証情報を取得する。
3. **Refresh Token の取得**: API経由で操作するための永続的なトークンを発行する。
4. **GitHub Secrets の設定**: 認証情報を安全にリポジトリに保存する。
5. **リリースタグの作成で自動アップロード**: リリースタグの作成をトリガーにして、認証情報を元にChromeウェブストアに自動でアップロードする。

また、今回は[Nickmark](https://github.com/sawarame/Nickmark)という私の開発した拡張機能で試してみました。

---

## 1. タグを自動作成する
プロジェクトに `.github/workflows/create-tag.yml` というファイルを以下の内容で設置します。

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

こちらをリポジトリにコミットすることで **GitHub Actions** に **Create Release Tag** というワークフローが追加されます。

このワークフローはmainブランチコミットされた時に、manifest.jsonのバージョンでタグを作成します。同じバージョンのタグがすでに存在する場合は何も起こりません。

実際にバージョンを上げてコミットするとワークフローが実行され、  
![alt text](./images/chrome-extension-deploy-automation_001.png)

タグが作成されます。  
![alt text](./images/chrome-extension-deploy-automation_002.png)

最終的にこのタグからリリースを作成した時に、Chromeウェブストアに公開されるようにしていきます。

## 2. Google Cloud Project の設定と API の有効化

まず、Google Cloud で Chrome Web Store を操作するための API を有効にします。

1.  Google Cloud プロジェクト作成
    - [Google Cloud Console](https://console.cloud.google.com/)にアクセスします。
    - 左上の **「プロジェクトを選択」** をクリックし、**「新しいプロジェクト」** をクリック。  
    ![alt text](./images/chrome-extension-deploy-automation_003.png)
    - プロジェクト名は適当なもので大丈夫です、今回は「My-Chrome-Extensions」としました。  
    ![alt text](./images/chrome-extension-deploy-automation_004.png)
    - 作成が完了したら改めて左上の **「プロジェクトを選択」** をクリックし、作成したプロジェクト(My-Chrome-Extensions)を選択します。  
    ![alt text](./images/chrome-extension-deploy-automation_005.png)
2. **「Chrome Web Store API」** の有効化  
    - ページ上部の検索バーから「Chrome Web Store API」を検索し、表示された「Chrome Web Store API」を選択  
    ![alt text](./images/chrome-extension-deploy-automation_006.png)
    - 「Chrome Web Store API」ページの **「有効化」** ボタンをクリックします。  
    ![alt text](./images/chrome-extension-deploy-automation_007.png)
3. **「OAuth クライアント」** 作成  
    - **「API/サービスの詳細」** 画面のメニューから **「対象」** を選択し、公開ステータスを公開し、**「本番環境」** にします。  
    ![alt text](./images/chrome-extension-deploy-automation_008.png)
    - 左側メニューから **「クライアント」** を選択し、 **「クライアントを作成」** ボタンをクリックします。  
    ![alt text](./images/chrome-extension-deploy-automation_009.png)
    - アプリケーションの種類として **「デスクトップ アプリ」** を選択し、名前はわかりやすいもの（今回は「For GitHub Actions」）を入力して作成します。
    ![alt text](./images/chrome-extension-deploy-automation_010.png)
    - 発行された **クライアント ID** と **クライアント シークレット** を控えておきます。
    ![alt text](./images/chrome-extension-deploy-automation_011.png)

## 3. Refresh Token の取得

APIアクセスに必要な「リフレッシュトークン」を取得します。

1. 次のURLを作成し、アクセスします。  
※ **[OAuthクライアント作成時のクライアントID]** の箇所を書き換えてください。  
```
https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=[OAuthクライアント作成時のクライアントID]&redirect_uri=http://127.0.0.1
```  

2. アカウントの選択画面が出てきたら、使用するアカウントを選択します。  
![alt text](./images/chrome-extension-deploy-automation_012.png)
3. 「このアプリはGoogleで確認されていません」というページが表示されたら、左下の「詳細」をクリックして、「（プロジェクト名）（安全ではないページ）に移動」をクリックします。  
![alt text](./images/chrome-extension-deploy-automation_013.png)
4. 「（プロジェクト名）がGoogleアカウントへのアクセスを求めています」というページが表示されるので「続行」をクリック。  
![alt text](./images/chrome-extension-deploy-automation_014.png)

以上の手順で `http://127.0.0.1` から始まるURLにリダイレクトされます。  
このURLの中の、`code=` の後ろから `&scope` の直前までの長い文字列が **認証コード** です。これをコピーしてください。 ※ `&scope` 以降の文字は含めないように注意してください。

下記コマンドのそれぞれの箇所（ **[OAuthクライアント作成時のクライアントID]**、**[OAuthクライアント作成時のクライアントシークレット]**、**[上記で順で取得した認証コード]**）を修正し、ターミナルで実行します。

```bash
curl "https://accounts.google.com/o/oauth2/token" \
-d "client_id=[OAuthクライアント作成時のクライアントID]&client_secret=[OAuthクライアント作成時のクライアントシークレット]&code=[上記で順で取得した認証コード]&grant_type=authorization_code&redirect_uri=http://127.0.0.1"
```

実行すると次のようなレスポンスが返ってきますので、その中の **refresh_token** の値をコピーしてください。

```json
{
  "access_token": "ya29.a0A...",
  "expires_in": 3599,
  "refresh_token": "1//0e...",
  "scope": "https://www.googleapis.com/auth/chromewebstore",
  "token_type": "Bearer"
}
```

## 4. GitHub Secrets の設定

取得した情報を、GitHub リポジトリの Settings > Secrets and variables > Actions > Repository secrets に登録します。

| 名前 | 内容 |
| :--- | :--- |
| `CHROME_CLIENT_ID` | OAuthクライアント作成時のクライアントID |
| `CHROME_CLIENT_SECRET` | Authクライアント作成時のクライアントシークレット |
| `CHROME_REFRESH_TOKEN` | 上記手順で取得したリフレッシュトークン |
| `CHROME_EXTENSION_ID` | 拡張機能のID（デベロッパーダッシュボードで確認可能） |
| `PUBLISHER_ID` | パブリッシャーID（デベロッパーダッシュボードで確認可能） |

- 拡張機能のID  
デベロッパーダッシュボードの拡張機能のページで確認できます。  
![alt text](./images/chrome-extension-deploy-automation_016.png)

- パブリッシャーID
デベロッパーダッシュボードの設定画面から確認できます。  
![alt text](./images/chrome-extension-deploy-automation_017.png)

## 5. GitHub Actions のワークフローを作成する

リポジトリの `.github/workflows/release.yml` に以下の内容を記述します。

```yaml
name: Publish to Chrome Web Store

# Releaseが作成・公開されたときに発火
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

      # 1. 依存関係のインストールとビルド
      - name: Install dependencies & Build
        run: |
          npm install
          npm run build

      # 2. Chrome Web Storeにアップロード＆審査へ提出
      - name: Upload and Publish
        run: npx chrome-webstore-upload-cli@latest --source Nickmark.zip
        env:
          EXTENSION_ID: ${{ secrets.EXTENSION_ID }}
          CLIENT_ID: ${{ secrets.CLIENT_ID }}
          CLIENT_SECRET: ${{ secrets.CLIENT_SECRET }}
          REFRESH_TOKEN: ${{ secrets.REFRESH_TOKEN }}
          PUBLISHER_ID: ${{ secrets.PUBLISHER_ID }}
```

こちらをmainブランチにコミットすると **GitHub Actions** に **Publish to Chrome Web Store** というワークフローが追加されます。

[Nickmark](https://github.com/sawarame/Nickmark)は `npm run build` でパッケージ（Nickmark.zip）が生成されるようになっているので、buildした後そのままuploadの手順を実行していますが、必要に応じてパッケージ化するステップを追加してください。

こちらのワークフローはリリースタグを作成すると実行されるようになっています。

--- 

## 動作確認

以上で手順としては完了となりますので、実際に「1. タグを自動作成する」で作成したタグをリリースして動作確認してみます。

GitHubのタグから **「Create release from tag」** ボタンをクリック  
![alt text](./images/chrome-extension-deploy-automation_018.png)

リリース内容を入力して **「Publish release」** ボタンをクリックすると、GitHub Actionsのワークフローが開始されます。  
![alt text](./images/chrome-extension-deploy-automation_019.png)

ワークフロー完了後、Chromeウェブストアデベロッパーズでッシュボードで「審査待ち」になっていることを確認します。  
![alt text](./images/chrome-extension-deploy-automation_020.png)

バージョンも問題なく更新されてそうなので、無事自動化に成功しました。  
![alt text](./images/chrome-extension-deploy-automation_021.png)


## 注意点

- **初回アップロード**: まだ一度もストアに公開していない拡張機能の場合、初回のみデベロッパーダッシュボードから手動でZIPをアップロードする必要があります。APIによる更新は、既存のアイテムが対象です。
- **権限の変更**: `manifest.json` の `permissions` や `host_permissions` に追加・変更があった場合は自動で「審査待ち」にはなりません、Chromeウェブストアデベロッパーズでッシュボードで必須項目を入力して、手動で「審査のために送信」を行う必要があります。

## まとめ

一度この仕組みを構築してしまえば、manifest.jsonのバージョンを上げてコミットすれば公開準備が整います。
手動作業による心理的ハードルやミスを減らし、開発の本来の目的である機能改善にリソースを集中できるようになります。Chrome拡張機能を継続的にメンテナンスしている方の参考になれば幸いです。。
