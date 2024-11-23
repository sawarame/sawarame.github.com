---
sidebar_position: 1
---

# Homebrew

macOS用のパッケージ管理ツール

[GitHub](https://github.com/Homebrew)

## Install

[公式サイト](https://brew.sh/ja/)に記載してあるコマンドでインストールする

```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

インストール後に表示される下記のコマンドを入力する

```zsh
echo >> /Users/${USER}/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/${USER}/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```