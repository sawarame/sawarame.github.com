---
sidebar_position: 1
---

# Install and setup

## About Prezto

zsh設定フレームワーク

[GitHub](https://github.com/sorin-ionescu/prezto)

## Install

GitHubからソースコードをクローン

```zsh
git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"
```

クローン後、下記コマンドを実行してzshの設定ファイルを新しく作成します。

```zsh
setopt EXTENDED_GLOB
for rcfile in "${ZDOTDIR:-$HOME}"/.zprezto/runcoms/^README.md(.N); do
  ln -s "$rcfile" "${ZDOTDIR:-$HOME}/.${rcfile:t}"
done
```

実際にはクローンしたPreztoのファイルにリンクを貼るだけです。

下記のように既にファイルがあってリンク作成に失敗した場合は、手動で貼り直します
```
ln: /Users/user/.zprofile: File exists
```

```bash
# 現在のファイルの内容を確認
cat /Users/${USER}/.zprofile

# ファイルをバックアップとして名称変更
mv /Users/${USER}/.zprofile /Users/${USER}/.zprofile.bk

# リンクを貼る
ln -s /Users/${USER}/.zprezto/runcoms/zprofile /Users/${USER}/.zprofile

# 旧ファイルの内容を追加
cat /Users/${USER}/.zprofile.bk >> /Users/${USER}/.zprofile

# 古いファイルの内容が末尾に追加されているか確認
cat /Users/${USER}/.zprofile
```

## Setup

### モジュール追加

`.zpreztorc`の`zstyle ':prezto:load' pmodule`に追加したいモジュールを追記します。

```
# Set the Prezto modules to load (browse modules).
# The order matters.
zstyle ':prezto:load' pmodule \
  'environment' \
  'terminal' \
  'editor' \
  'history' \
  'directory' \
  'spectrum' \
  'utility' \
  'completion' \
  'prompt'
```

追加可能なモジュールはこちら  
https://github.com/sorin-ionescu/prezto/tree/master/modules

`git` `homebrew` `autosuggestions` `syntax-highlighting` は追加したほうが良さそう


### テーマ変更

```zsh
# 使用できるテーマのプレビューを確認
prompt -p

# テーマを設定する
prompt -s [テーマ名]
```

テーマを永続化したい場合は `.zpreztorc` の `zstyle ':prezto:module:prompt' theme` に設定する

```
zstyle ':prezto:module:prompt' theme '[テーマ名]'
```
