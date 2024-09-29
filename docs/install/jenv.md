---

---

# jEnv
Javaのバージョン管理ツール

[GitHub](https://github.com/jenv/jenv)

```bash
brew install jenv
```

` ~/.zshrc`に下記内容を記載します。
```
# for jenv
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
```
 
``` もしくは下記コマンドを実行
echo '# for jenv' >> ~/.zshrc
echo 'export PATH="$HOME/.jenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(jenv init -)"' >> ~/.zshrc
```

OpenJDKインストール
```bash
brew install openjdk@21
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

jEnvに追加
```bash
jenv add /Library/Java/JavaVirtualMachines/openjdk-21.jdk/Contents/Home
```

追加するJavaのディレクトリは下記コマンドで確認できます。
```bash
/usr/libexec/java_home -V
```

jEnvに追加されたか確認
```bash
jenv versions
```

グローバルJavaバージョンの設定
```bash
jenv global 21.0
```

ローカル（現在のディレクトリ）Javaバージョンの設定
```bash
jenv local 21.0
```

シェルJavaバージョンの設定
```bash
jenv shell 21.0
```


jEnvから削除する場合
```bash
brew remove 21.0
```

j

