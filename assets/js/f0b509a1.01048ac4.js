"use strict";(self.webpackChunksawarame_github_com=self.webpackChunksawarame_github_com||[]).push([[245],{661:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>s,contentTitle:()=>a,default:()=>m,frontMatter:()=>r,metadata:()=>c,toc:()=>l});var i=t(4848),o=t(8453);const r={sidebar_position:2},a="WezTerm",c={id:"install/wezterm",title:"WezTerm",description:"\u30bf\u30fc\u30df\u30ca\u30eb\u30a8\u30df\u30e5\u30ec\u30fc\u30bf\u30fc",source:"@site/docs/install/wezterm.md",sourceDirName:"install",slug:"/install/wezterm",permalink:"/docs/install/wezterm",draft:!1,unlisted:!1,editUrl:"https://github.com/sawarame/sawarame.github.com/tree/master/docs/install/wezterm.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"installSidebar",previous:{title:"Prezto",permalink:"/docs/install/prezto"},next:{title:"jEnv",permalink:"/docs/install/jenv"}},s={},l=[];function d(e){const n={code:"code",h1:"h1",header:"header",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"wezterm",children:"WezTerm"})}),"\n",(0,i.jsx)(n.p,{children:"\u30bf\u30fc\u30df\u30ca\u30eb\u30a8\u30df\u30e5\u30ec\u30fc\u30bf\u30fc"}),"\n",(0,i.jsx)(n.p,{children:"homebrew\u7d4c\u7531\u3067\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"brew install wezterm\n"})}),"\n",(0,i.jsx)(n.p,{children:"\u8a2d\u5b9a\u30d5\u30a1\u30a4\u30eb\u4f5c\u6210"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"vi ~/.wezterm.lua\n"})}),"\n",(0,i.jsx)(n.p,{children:"\u4e0b\u8a18\u5185\u5bb9\u3092\u8a18\u8f09\u3059\u308b"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-lua",children:'local wezterm = require \'wezterm\'\n\nlocal config = {}\n\nif wezterm.config_builder then\n  config = wezterm.config_builder()\nend\n\n-- \u30ab\u30e9\u30fc\u30b9\u30ad\u30fc\u30e0\u306e\u8a2d\u5b9a\nconfig.color_scheme = \'Bamboo\'\n\nconfig.window_background_opacity = 0.9\n\n-- \u6700\u521d\u304b\u3089\u30d5\u30eb\u30b9\u30af\u30ea\u30fc\u30f3\u3067\u8d77\u52d5\nlocal mux = wezterm.mux\nwezterm.on("gui-startup", function(cmd)\n    local tab, pane, window = mux.spawn_window(cmd or {})\n    window:gui_window():toggle_fullscreen()\nend)\n\n-- \u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba\u306e\u8a2d\u5b9a\nconfig.font_size = 14\n\nlocal act = wezterm.action\nconfig.keys = {\n  -- Command+d/s\u3067\u65b0\u3057\u3044\u30da\u30a4\u30f3\u3092\u4f5c\u6210\n  { key = \'d\', mods = \'CMD\', action = wezterm.action.SplitHorizontal { domain = \'CurrentPaneDomain\' }, },\n  { key = \'s\', mods = \'CMD\', action = wezterm.action.SplitVertical { domain = \'CurrentPaneDomain\' }, },\n  -- Ctrl+Shift+h/l/k/j\u3067\u30da\u30a4\u30f3\u79fb\u52d5\n  { key = "h", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Left"), },\n  { key = "l", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Right"), },\n  { key = "k", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Up"), },\n  { key = "j", mods = "SHIFT|CTRL", action = act.ActivatePaneDirection("Down"), },\n}\n\nreturn config\n'})})]})}function m(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>c});var i=t(6540);const o={},r=i.createContext(o);function a(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);