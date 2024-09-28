---

---

# nodebrew

homebrewでインストールします。
```bash
brew install nodebrew
```

インストール後下記コマンで出力されたexportを` ~/.zshrc`に記載します。
```bash
nodebrew setup
```

記載例
```bash
# for nodebrew
export PATH=$HOME/.nodebrew/current/bin:$PATH
```

使用可能なnodeのバージョンを確認
```bash
nodebrew ls-remote
```

nodeインストール
```bash
# バージョンを指定してインストール
nodebrew install v22.9.0

# 安定版インストール
nodebrew install stable

# 最新版インストール
nodebrew install latest
```

nodeバージョン切り替え
```bash
nodebrew use v22.9.0
```

yarnを入れておく
```bash
npm install -g yarn
```
