---
sidebar_position: 1
---

# Homebrew

パッケージのインストール
```zsh
brew install <formula>
```

GUIアプリケーションのインストール
```zsh
brew install --cask <cask>
```

パッケージのアンインストール
```zsh
brew uninstall <formula>
```

パッケージの検索
```zsh
brew search <text>
```

インストール済みのパッケージ一覧を表示
```zsh
brew list
```

他のパッケージから依存されていないパッケージ（リーフ）の一覧を表示
```zsh
brew leaves
```

指定したパッケージの依存関係を表示
```zsh
brew deps <formula>
```

Homebrew自体のアップデート
```zsh
brew update
```

インストール済みの全パッケージをアップグレード
```zsh
brew upgrade
```

指定したパッケージをアップグレード
```zsh
brew upgrade <formula>
```

古いバージョンのパッケージやキャッシュファイルを削除し、ディスクスペースを解放
```
brew cleanup
```

パッケージの詳細情報を表示
```zsh
brew info <formula>
```

Homebrewでインストールしたサービスの状態を確認
```zsh
brew services list
```

サービスを起動し、ログイン時に自動起動するように設定
```zsh
brew services start <service>
```

サービスを停止
```zsh
brew services stop <service>
```

サービスを再起動
```zsh
brew services restart <service>
```








