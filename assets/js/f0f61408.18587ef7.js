"use strict";(self.webpackChunksawarame_github_com=self.webpackChunksawarame_github_com||[]).push([[149],{8729:(n,e,a)=>{a.r(e),a.d(e,{assets:()=>l,contentTitle:()=>r,default:()=>m,frontMatter:()=>i,metadata:()=>o,toc:()=>c});var t=a(4848),s=a(8453);const i={sidebar_position:3},r="Karabiner-Elements",o={id:"install/karabinerelements",title:"Karabiner-Elements",description:"Install",source:"@site/docs/install/karabinerelements.md",sourceDirName:"install",slug:"/install/karabinerelements",permalink:"/docs/install/karabinerelements",draft:!1,unlisted:!1,editUrl:"https://github.com/sawarame/sawarame.github.com/tree/master/docs/install/karabinerelements.md",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"installSidebar",previous:{title:"jEnv",permalink:"/docs/install/jenv"},next:{title:"nodebrew",permalink:"/docs/install/nodebrew"}},l={},c=[{value:"Install",id:"install",level:2},{value:"Setup",id:"setup",level:2},{value:"Esc\u30ad\u30fc\u5165\u529b\u3067\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b",id:"esc\u30ad\u30fc\u5165\u529b\u3067\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b",level:3},{value:"2\u56de\u9023\u7d9acommand\u3067\u30a8\u30b9\u30b1\u30fc\u30d7",id:"2\u56de\u9023\u7d9acommand\u3067\u30a8\u30b9\u30b1\u30fc\u30d7",level:3}];function d(n){const e={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",p:"p",pre:"pre",...(0,s.R)(),...n.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(e.header,{children:(0,t.jsx)(e.h1,{id:"karabiner-elements",children:"Karabiner-Elements"})}),"\n",(0,t.jsx)(e.h2,{id:"install",children:"Install"}),"\n",(0,t.jsxs)(e.p,{children:[(0,t.jsx)(e.a,{href:"https://karabiner-elements.pqrs.org/",children:"\u516c\u5f0f\u30b5\u30a4\u30c8"}),"\u304b\u3089\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9\u3057\u3066\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3059\u308b"]}),"\n",(0,t.jsx)(e.h2,{id:"setup",children:"Setup"}),"\n",(0,t.jsx)(e.h3,{id:"esc\u30ad\u30fc\u5165\u529b\u3067\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b",children:"Esc\u30ad\u30fc\u5165\u529b\u3067\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b"}),"\n",(0,t.jsx)(e.p,{children:"Esc\u30ad\u30fc\u5165\u529b\u3068\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b\u3068\u3001vi\u3067\u30b3\u30de\u30f3\u30c9\u30e2\u30fc\u30c9\u306b\u79fb\u884c\u3057\u305f\u6642\u4fbf\u5229"}),"\n",(0,t.jsx)(e.pre,{children:(0,t.jsx)(e.code,{className:"language-json",children:'{\n    "description": "Esc\u30ad\u30fc\u5165\u529b\u3067\u540c\u6642\u306b\u534a\u89d2\u30e2\u30fc\u30c9\u306b\u3059\u308b",\n    "manipulators": [\n        {\n            "from": { "key_code": "escape" },\n            "to": [\n                { "key_code": "escape" },\n                { "key_code": "lang2" }\n            ],\n            "type": "basic"\n        }\n    ]\n}\n'})}),"\n",(0,t.jsx)(e.h3,{id:"2\u56de\u9023\u7d9acommand\u3067\u30a8\u30b9\u30b1\u30fc\u30d7",children:"2\u56de\u9023\u7d9acommand\u3067\u30a8\u30b9\u30b1\u30fc\u30d7"}),"\n",(0,t.jsx)(e.p,{children:"\u500b\u4eba\u7684\u306bEsc\u30ad\u30fc\u306f\u9060\u3044\u3068\u611f\u3058\u3066\u3044\u308b\u306e\u3067\u3001Command\u30ad\u30fc2\u56de\u3067\u30a8\u30b9\u30b1\u30fc\u30d7\u3067\u304d\u308b\u3088\u3046\u306b\u3059\u308b"}),"\n",(0,t.jsx)(e.pre,{children:(0,t.jsx)(e.code,{className:"language-Json",children:'{\n    "description": "2\u56de\u9023\u7d9acommand\u3067\u30a8\u30b9\u30b1\u30fc\u30d7",\n    "manipulators": [\n        {\n            "conditions": [\n                {\n                    "name": "right_command_key",\n                    "type": "variable_if",\n                    "value": 1\n                }\n            ],\n            "from": { "key_code": "right_command" },\n            "to": [\n                { "key_code": "escape" },\n                { "key_code": "lang2" }\n            ],\n            "type": "basic"\n        },\n        {\n            "conditions": [\n                {\n                    "name": "right_command_key",\n                    "type": "variable_if",\n                    "value": 0\n                }\n            ],\n            "from": {\n                "key_code": "right_command",\n                "modifiers": { "optional": ["any"] }\n            },\n            "to": [\n                {\n                    "set_variable": {\n                        "name": "right_command_key",\n                        "value": 1\n                    }\n                },\n                { "key_code": "right_command" }\n            ],\n            "to_delayed_action": {\n                "to_if_canceled": [\n                    {\n                        "set_variable": {\n                            "name": "right_command_key",\n                            "value": 0\n                        }\n                    }\n                ],\n                "to_if_invoked": [\n                    {\n                        "set_variable": {\n                            "name": "right_command_key",\n                            "value": 0\n                        }\n                    }\n                ]\n            },\n            "type": "basic"\n        }\n    ]\n}\n'})})]})}function m(n={}){const{wrapper:e}={...(0,s.R)(),...n.components};return e?(0,t.jsx)(e,{...n,children:(0,t.jsx)(d,{...n})}):d(n)}},8453:(n,e,a)=>{a.d(e,{R:()=>r,x:()=>o});var t=a(6540);const s={},i=t.createContext(s);function r(n){const e=t.useContext(i);return t.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function o(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(s):n.components||s:r(n.components),t.createElement(i.Provider,{value:e},n.children)}}}]);