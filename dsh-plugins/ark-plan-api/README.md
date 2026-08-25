# @volcengine/ark-plan-api

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) cordis plugin that registers Volcengine Ark model provider routes on the native `llm-pi-ai` adapter. After install and an API key, Ark Agent Plan, Coding Plan and postpaid models appear directly in DSH's model picker — no extra configuration beyond pasting the key.

火山方舟模型路由插件。在 DSH 原生模型选择器中注册方舟 Agent Plan、Coding Plan 与后付费模型路由；安装后填入 API Key 即可使用，无需额外配置。

## Features / 功能

- **Agent Plan** — `doubao-seed-evolving`, `doubao-seed-2.1-pro`, `deepseek-v4-pro` and more via the Agent Plan endpoint.
- **Coding Plan** — Coding-optimized models for both cn-beijing and BytePlus regions.
- **Postpaid (后付费)** — Direct pay-as-you-go access to Ark foundation models.
- **Native picker integration** — All providers show up alongside built-in ones in **Settings → Models**, no model IDs to memorize.
- **Anthropic Messages wire protocol** — Uses the same Messages API shape DSH uses for Anthropic, so tool use, vision and streaming work out of the box.

## Install / 安装

### From GitHub Release (recommended / 推荐)

```sh
npx -y @deepseek-ai/dsh plugin --profile web add https://github.com/volcengine/ark-cli/releases/latest/download/ark-plan-api.tgz
```

### Via awesome-dsh-plugin registry

```sh
npx -y @deepseek-ai/dsh plugin --profile web add volcengine/ark-cli#ark-plan-api
```

### From a local clone (development / 开发用)

```sh
npx -y @deepseek-ai/dsh plugin --profile web add ./dsh-plugins/ark-plan-api
```

Restart DSH after install, then open **Settings → Models**, pick an Ark provider and paste your API key. Each route reads its key from a separate env var (see table below); the Models UI writes the key to the correct name automatically.

安装后重启 DSH，打开 **Settings → Models**，选择 Ark provider 并粘贴 API Key。每条路由从独立的环境变量读取密钥（见下表），Models 设置页会自动写入对应变量。

## Providers / 提供的模型路由

| Route ID | Purpose / 用途 | Base URL | API Key Env |
|---|---|---|---|
| `ark-agent-plan-cn` | Agent Plan (cn-beijing) | `https://ark.cn-beijing.volces.com/api/plan` | `ARK_AGENT_PLAN_CN_API_KEY` |
| `ark-coding-plan-cn` | Coding Plan (cn-beijing) | `https://ark.cn-beijing.volces.com/api/coding` | `ARK_CODING_PLAN_CN_API_KEY` |
| `ark-coding-plan-byteplus` | Coding Plan (BytePlus/海外) | `https://ark.ap-southeast.bytepluses.com/api/coding` | `ARK_CODING_PLAN_BYTEPLUS_API_KEY` |
| `ark-cn` | Postpaid API 后付费 (cn-beijing) | `https://ark.cn-beijing.volces.com/api/v3/compatible` | `ARK_CN_API_KEY` |
| `ark-byteplus` | Postpaid API 后付费 (BytePlus/海外) | `https://ark.ap-southeast.bytepluses.com/api/v3/compatible` | `ARK_BYTEPLUS_API_KEY` |

Default wire protocol is the Anthropic Messages API. Base URLs intentionally omit the `/v1` suffix — pi-ai hands `baseURL` straight to the Anthropic SDK, which appends `/v1/messages`.

默认走 Anthropic Messages 协议。`baseURL` 已省略 `/v1` 后缀，pi-ai 会将其直接传给 Anthropic SDK，由 SDK 拼接 `/v1/messages`。

## Requirements / 前置条件

- DSH ≥ 0.1.0
- Node.js ≥ 22.19.0 (ships with DSH)
- A Volcengine Ark API key with access to the corresponding endpoint

## License

Apache-2.0 © 2025-2026 Beijing Volcano Engine Technology Co., Ltd.
