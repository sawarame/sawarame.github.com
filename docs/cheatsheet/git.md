---
sidebar_position: 1
---

# Gitコマンドチートシート

## 設定

gitで使用するエディタをvimにする

```zsh
git config --global core.editor vim
```

git branchでpagerを使用しない

```zsh
git config --global pager.branch 'false'
```

コミットに使用するユーザー名とメールアドレスを設定

```zsh
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

全ての設定内容を表示
```zsh
git config --global --list
```