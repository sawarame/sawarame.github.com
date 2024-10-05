---
sidebar_position: 1
---

# Install and setup

## About Karabiner-Elements

## Install

[公式サイト](https://karabiner-elements.pqrs.org/)からダウンロードしてインストールする

## Setup

### Escキー入力で同時に半角モードにする

Escキー入力と同時に半角モードにすると、viでコマンドモードに移行した時便利

```json
{
    "description": "Escキー入力で同時に半角モードにする",
    "manipulators": [
        {
            "from": { "key_code": "escape" },
            "to": [
                { "key_code": "escape" },
                { "key_code": "lang2" }
            ],
            "type": "basic"
        }
    ]
}
```

### 2回連続commandでエスケープ

個人的にEscキーは遠いと感じているので、Commandキー2回でエスケープできるようにする

```Json
{
    "description": "2回連続commandでエスケープ",
    "manipulators": [
        {
            "conditions": [
                {
                    "name": "right_command_key",
                    "type": "variable_if",
                    "value": 1
                }
            ],
            "from": { "key_code": "right_command" },
            "to": [
                { "key_code": "escape" },
                { "key_code": "lang2" }
            ],
            "type": "basic"
        },
        {
            "conditions": [
                {
                    "name": "right_command_key",
                    "type": "variable_if",
                    "value": 0
                }
            ],
            "from": {
                "key_code": "right_command",
                "modifiers": { "optional": ["any"] }
            },
            "to": [
                {
                    "set_variable": {
                        "name": "right_command_key",
                        "value": 1
                    }
                },
                { "key_code": "right_command" }
            ],
            "to_delayed_action": {
                "to_if_canceled": [
                    {
                        "set_variable": {
                            "name": "right_command_key",
                            "value": 0
                        }
                    }
                ],
                "to_if_invoked": [
                    {
                        "set_variable": {
                            "name": "right_command_key",
                            "value": 0
                        }
                    }
                ]
            },
            "type": "basic"
        }
    ]
}
```