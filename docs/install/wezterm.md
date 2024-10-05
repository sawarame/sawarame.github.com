---
sidebar_position: 2
---

# WezTerm

ターミナルエミュレーター

homebrew経由でインストール

```bash
brew install wezterm
```

設定ファイル作成

```bash
vi ~/.wezterm.lua
```

下記内容を記載する
```lua
local wezterm = require 'wezterm'

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

-- カラースキームの設定
config.color_scheme = 'Bamboo'

config.window_background_opacity = 0.9

-- 最初からフルスクリーンで起動
local mux = wezterm.mux
wezterm.on("gui-startup", function(cmd)
    local tab, pane, window = mux.spawn_window(cmd or {})
    window:gui_window():toggle_fullscreen()
end)

-- フォントサイズの設定
config.font_size = 14

local act = wezterm.action
config.keys = {
  -- Command+d/sで新しいペインを作成
  { key = 'd', mods = 'CMD', action = wezterm.action.SplitHorizontal { domain = 'CurrentPaneDomain' }, },
  { key = 's', mods = 'CMD', action = wezterm.action.SplitVertical { domain = 'CurrentPaneDomain' }, },
  -- Ctrl+Shift+h/l/k/jでペイン移動
  { key = "h", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Left"), },
  { key = "l", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Right"), },
  { key = "k", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Up"), },
  { key = "j", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Down"), },
}

return config
```
