---
sidebar_position: 2
---

# Oh My Zsh

https://github.com/ohmyzsh/ohmyzsh


## Install


```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```


## Setup


### zsh-autosuggestions追加

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

`~/.zshrc`のpluginsにzsh-autosuggestionsを追加する

```
plugins=(
  git
  zsh-autosuggestions
)
```

### zsh-syntax-highlighting追加

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

`~/.zshrc`のpluginsにzsh-syntax-highlightingを追加する

```
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```


### Powerlevel10k追加

```bash
git clone https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k
```

`~/.zshrc`のthemeをpowerlevel10kに変更する

```
ZSH_THEME=powerlevel10k/powerlevel10k
```
powerlevel10k`はNerd Font対応フォントが必要が必要になるので、[こちら](https://github.com/romkatv/powerlevel10k#fonts)からフォントをダウンロードしてインストールします。  
フォントをインストールしたらターミナルの設定でフォントを変更ます。VSCodeのターミナルに設定する場合は、下記設定を追加します。

```json
{
  "terminal.integrated.fontFamily": "MesloLGS NF"
}
```