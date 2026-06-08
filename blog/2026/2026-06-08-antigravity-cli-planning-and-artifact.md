---
slug: antigravity-cli-planning-and-artifact
title: Antigravity CLI の /planning と /artifact を活用した、計画から実装までの開発フロー
date: 2026-06-08
draft: true
tags:
  - Antigravity CLI
  - Development
  - Testing
  - AI
emoji: 🛠️
---

開発プロセスにおいてAIにコード変更を指示する際、十分な調査や設計合意がないまま直接コードを書き換えると、予期しないエラーや修正の手戻りが発生するリスクが高まります。このような課題を解決するために、Antigravity CLI には、実装前の「計画（Planning）」と成果物の「視覚的な管理（Artifact）」を組み合わせた開発フローが用意されています。

本記事では、対話画面から実行できる **`/planning`** コマンドと **`Artifact（成果物）`** 機能の役割を整理し、実際にプロジェクトへ単体テストを導入する実践例を交えて解説します。

<!-- truncate -->

---

### 各コマンドと機能の役割

#### `/planning` コマンド：実装前の設計と合意形成

**`/planning`** は、Antigravity CLI の対話画面内で実行する特別なスラッシュコマンドです。このコマンドを入力すると、AI は一時的に計画モードに切り替わり、直接のコード修正を行わずに以下の調査と設計を行います。

- **コードベースの解析**: 変更に関連する既存のソースコードや依存ライブラリ、プロジェクトの設定を読み込みます。
- **実装方針の策定**: 追加または修正が必要なファイルの一覧、およびその実装手順を整理します。
- **検証方法の定義**: 実装後に正常に動作するかを確認するための自動テストコマンドや、手動での確認手順をまとめます。
- **計画書の提示**: 以上の内容をまとめた「実装計画書」を作成し、開発者に提示します。

開発者はこの計画書をレビューし、方針に問題がないかを確認した上で実装の実行を承認（Proceed）します。これにより、意図しない書き換えや方針のズレを事前に防ぐことができます。

#### Artifact（成果物）機能：構造化された情報の独立管理

**`Artifact`** は、チャットの会話履歴とは独立したドキュメントやファイルとして情報を管理・提示する機能です。

通常、AI との対話で長いコードやドキュメントを出力させると、チャット画面が埋まり、過去のやり取りをスクロールして確認することが難しくなります。 Artifact 機能を利用すると、計画書（ `implementation_plan.md` ）やタスクリスト（ `task.md` ）、完成した成果物のドキュメント（ `walkthrough.md` ）が独立した画面や別ファイルとして出力されます。

これにより、以下のメリットが得られます。

- **高い視認性**: チャットの対話履歴を汚さず、最新の成果物だけを整理された形で確認できます。
- **シームレスな操作**: 提示された計画書に対して「承認」ボタンを押すだけで、AI が次の実装フェーズへ自動で移行します。
- **履歴の更新**: 計画やタスクが進行するにつれて、AI が同じ Artifact の内容を随時書き換えて最新状態を維持します。

---

### 実践：単体テストの追加

ここからは、実際にこの sawara.me のツール集にテストフレームワーク（ **`Vitest`** ）を導入し、単体テストを追加する開発フローを例に、具体的な流れを解説します。

#### 計画の作成

まず、Antigravity CLI の対話画面で以下のように指示し、 **`/planning`** コマンドを実行しプランニングモードに移行します。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_001.webp)
<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>/planningコマンドで、プランニングモードに移行する</small>

</div>

プランニングモードに移行後、実装したい内容のプロンプトを入力します。

```
このプロジェクトのツール集に単体テストを実装してください。
```

最初はあえて、ざっくりお願いしてみました。

指示を受けると、AI はプロジェクトの `package.json` や既存のコードを解析し、 `implementation_plan.md` をArtifactとして新規作成します。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_002.webp)
<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>implementation_plan.mdというArtifactが作成された</small>

</div>

内容を確認するために `/artifact` コマンドを実行し、`implementation_plan.md` の `open` を選択し中身を確認してみます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_003.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>/artifactコマンドの結果からopenを選択</small>

</div>

テストが3つしか作成されないようだったので、`reject` してみます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_004.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>implementation_plan.mdの中身</small>

</div>

`reject` を行うと理由を問われますので、「5. Write-in...」を選択し、

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_005.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>reject理由選択</small>

</div>

下記の理由を入れてみます。

```
ツール集で定義されているすべての機能に対して単体テストを実装してください。
```

すると再度 `implementation_plan.md` が作成されます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_006.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>reject内容から再度implementation_plan.mdが作成された</small>

</div>

`/artifact` コマンドを実行し中身を確認してみます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_007.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>再作成されたimplementation_plan.mdの中身</small>

</div>

一旦すべてのツールが単体テスト作成対象になったようです。テスト内容についても細かい指示を出すことはできますが、今回は一旦この内容で進めてもらうことにします。

改めて `approve` を選択します。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_008.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>今度はapproveを選択</small>

</div>

すると `task.md` が作成されます。AIが作業を続けている間も `/artifact` コマンドで確認することができます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_009.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>AI処理中でもコマンドが打てる</small>

</div>

`task.md` の中身はチェックリストになっており、作業が終わったものはチェックが入っていきます。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_010.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>task.mdの中身</small>

</div>

残念ながら、開いたままだとチェックが増えていく様子は確認できませんでした、、、一度閉じてから再度開き直す必要があります。

作業が完了すると `walkthrough.md` という最終的な変更内容と検証結果を要約したArtifactを作成します。

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_011.webp)

<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>作業完了後walkthrough.mdが作成される</small>

</div>

<div className="text--center" style={{ margin: '2rem 0' }}>
![alt text](images/antigravity-cli-planning-and-artifact_012.webp)
<small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>walkthrough.mdの中身</small>

</div>

---

### 結論

Antigravity CLI の **`/planning`** コマンドと **`Artifact`** 機能を組み合わせることで、以下のステップに沿って安全に開発を進めることができます。

1. 実装前に変更方針の全体像を把握する
2. 会話とは独立したドキュメントでタスクと変更コードを整理する
3. 検証結果をレポート形式で確認する

これにより、単にコードを自動生成するだけでなく、人間とAIが開発の意図を正確に共有し、品質の高いコードを維持することが可能になります。大規模な機能追加や、今回のようなテストフレームワークの導入時には、まず対話画面で **`/planning`** を実行することから始めることが推奨されます。
