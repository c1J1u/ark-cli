# DSH Plugins for Volcengine Ark

This directory contains two officially maintained [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) plugins that bring Volcengine Ark model serving and cloud Managed Agents into DSH.

本目录包含两个由火山引擎官方维护的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）插件，将火山方舟的模型服务与云端 Managed Agents 能力接入 DSH。

| Plugin | Description / 说明 | Category |
|---|---|---|
| [`ark-plan-api`](./ark-plan-api) | Registers Ark Agent Plan, Coding Plan and postpaid model routes in the native DSH model picker. 在 DSH 原生模型选择器中注册方舟 Agent Plan、Coding Plan 与后付费模型路由。 | `model` |
| [`ark-managed-agents`](./ark-managed-agents) | Adds a Managed Agents settings tab and MCP tools to dispatch long-running agent tasks to Ark cloud Managed Agents. 新增 Managed Agents 设置页，并通过 MCP 工具向方舟云端 Managed Agents 派发长任务、取回轨迹与产物。 | `tools` |

## Requirements / 前置条件

- DeepSeek Harness ≥ 0.1.0
- Node.js ≥ 22.19.0 (ships with DSH)
- A valid [Volcengine Ark](https://www.volcengine.com/product/ark) API key

## Install / 安装

Prebuilt tarballs are attached to [GitHub Releases](https://github.com/volcengine/ark-cli/releases). For the recommended one-liner install command and full setup guide, see the official documentation:

预构建安装包已附在 [GitHub Releases](https://github.com/volcengine/ark-cli/releases)。推荐的一键安装命令与完整配置指南请见官方文档：

<https://www.volcengine.com/docs/82379>

To install from a local clone of this repo (for development):

从本地源码子目录安装（开发用）：

```sh
dsh plugin --profile web add ./dsh-plugins/ark-plan-api
dsh plugin --profile web add ./dsh-plugins/ark-managed-agents
```

## Post-install / 安装后

**Restart DSH once after install.** The Managed Agents MCP server carries a `config:` entry and only activates on the next host start.

安装后**重启一次 DSH**（Managed Agents MCP 服务在 `config:` 行注册，需重启生效）：

- **ark-plan-api** — Open **Settings → Models**, pick an Ark provider and paste your API key.
  打开 **Settings → Models**，选择 Ark provider 并粘贴 API Key。
- **ark-managed-agents** — Open **Settings → Managed Agents**, enter your API key and default model. After restart, `mcp__ark_ma__*` tools become available in chat.
  打开 **Settings → Managed Agents**，填入 API Key 与默认模型；重启后对话中可使用 `mcp__ark_ma__*` 工具。

## Uninstall / 卸载

```sh
dsh plugin --profile web remove @volcengine/ark-managed-agents
dsh plugin --profile web remove @volcengine/ark-plan-api
```

## Documentation / 文档

<https://www.volcengine.com/docs/82379>

## License

Apache-2.0 © 2025-2026 Beijing Volcano Engine Technology Co., Ltd.
