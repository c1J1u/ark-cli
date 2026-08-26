# @volcengine/ark-managed-agents

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) plugin that integrates [Volcengine Ark Managed Agents](https://www.volcengine.com/product/ark) (AgentKit/Coze-style cloud agents) into the DSH chat UI. After install and an API key, you can browse your Ark managed agents and dispatch long-running agent tasks directly from DSH via MCP tools.

火山方舟 Managed Agents 插件。将方舟云端托管 Agent（AgentKit/Coze 风格）接入 DSH 对话界面；安装并配置 API Key 后，即可在 DSH 中浏览你的 Managed Agent、通过 MCP 工具派发长任务、取回执行轨迹与产物。

This package ships two runtime pieces:

本插件包含两部分：

- **Server** — A cordis plugin that launches a local stdio MCP server, exposing Ark Managed Agents operations as MCP tools (`mcp__ark_ma__*`).
  服务端：cordis 插件，启动本地 stdio MCP 服务，将 Ark Managed Agents 操作暴露为 MCP 工具（`mcp__ark_ma__*`）。
- **Client UI** — A web-profile injection that adds a **Managed Agents** settings section under **Settings** for API key, base URL and default model configuration.
  客户端 UI：web profile 注入，在设置页新增 **Managed Agents** 区块，用于配置 API Key、Base URL 和默认模型。

## Features / 功能

- Browse and search agents in your Ark account without leaving DSH / 在 DSH 内浏览、搜索 Ark 账号下的 Agent
- Dispatch tasks to any managed agent through the standard MCP tool interface / 通过 MCP 工具向任意 Managed Agent 派发任务
- Streaming responses with thought-step and tool-call visibility / 流式返回，展示思考步骤与工具调用
- Long-running task polling with automatic trajectory/result retrieval / 长任务自动轮询，取回完整轨迹与结果
- List and download agent artifacts / 列出并下载 Agent 产物
- Per-agent model and parameter overrides preserved from the Ark console / 保留 Ark 控制台配置的模型与参数覆盖

## Install / 安装

### From npm (recommended / 推荐)

```sh
npx -y @deepseek-ai/dsh plugin --profile web add @volcengine/ark-managed-agents
```

### From GitHub Release

```sh
npx -y @deepseek-ai/dsh plugin --profile web add https://github.com/volcengine/ark-cli/releases/download/dsh-plugins%2Fv0.1.0/ark-managed-agents.tgz
```

### Via awesome-dsh-plugin registry

```sh
npx -y @deepseek-ai/dsh plugin --profile web add volcengine/ark-cli#ark-managed-agents
```

### From a local clone (development / 开发用)

```sh
npx -y @deepseek-ai/dsh plugin --profile web add ./dsh-plugins/ark-managed-agents
```

**Restart DSH after install.** The MCP server row carries a `config:` entry and only activates on the next host start. After restart, open **Settings → Managed Agents** to configure credentials.

**安装后必须重启 DSH**（MCP 服务在 `config:` 行注册，需重启生效）。重启后打开 **Settings → Managed Agents** 配置凭据。

## Configuration / 配置

Configure in the UI settings panel (preferred), or via environment variables (used as fallback):

在 UI 设置面板中配置（推荐），或通过环境变量配置（作为兜底）：

| Setting / 设置项 | Env var / 环境变量 | Purpose / 说明 |
|---|---|---|
| API Key | `ARK_MA_API_KEY` / `ARK_API_KEY` | Volcengine Ark API key. `ARK_API_KEY` is used as a shared fallback. / 方舟 API Key；`ARK_API_KEY` 作为通用兜底。 |
| Base URL | `ARK_MA_BASE_URL` | API base URL. Default: `https://ark.cn-beijing.volces.com/api/agentkit`. / API 基础地址，默认指向 cn-beijing AgentKit。 |
| Default Model | `ARK_MA_MODEL` | Model ID used when an agent does not specify one. / Agent 未指定模型时使用的默认模型 ID。 |

## Exposed MCP Tools / 暴露的 MCP 工具

After restart, the following tools (prefixed `mcp__ark_ma__`) are available to the model:

重启后模型可使用以下工具（前缀 `mcp__ark_ma__`）：

| Tool / 工具 | Purpose / 用途 |
|---|---|
| `ma_list_agents` | List agents in the configured Ark account / 列出账号下的 Agent |
| `ma_dispatch_task` | Dispatch a task to a specified agent / 向指定 Agent 派发任务 |
| `ma_get_status` | Poll a running task's status / 查询任务运行状态 |
| `ma_get_trajectory` | Retrieve a task's execution trajectory (thoughts, tool calls) / 获取任务执行轨迹（思考、工具调用） |
| `ma_get_result` | Retrieve a completed task's final result / 获取已完成任务的最终结果 |
| `ma_list_artifacts` | List artifacts produced by a task / 列出任务产生的产物 |
| `ma_download_artifacts` | Download task artifacts to local disk / 将任务产物下载到本地 |

`toolCallTimeoutMs` is set to 5 minutes (300000 ms) to accommodate long-running agent tasks.

工具调用超时设为 5 分钟（300000 ms），以适配长时间运行的 Agent 任务。

## Requirements / 前置条件

- DSH ≥ 0.1.0
- Node.js ≥ 22.19.0 (ships with DSH)
- A Volcengine Ark account with Managed Agents (AgentKit) enabled
- An API key with access to the AgentKit API

## Notes / 说明

- The MCP server runs as a local Node.js subprocess using `process.execPath` with `ELECTRON_RUN_AS_NODE=1`, so it works under both the `dsh` CLI and the DSH desktop app.
  MCP 服务以本地 Node.js 子进程运行（使用 `process.execPath` + `ELECTRON_RUN_AS_NODE=1`），同时兼容 `dsh` CLI 与桌面版 DSH。
- Server path is resolved from the DSH profile directory at runtime — no hard-coded absolute paths.
  服务路径在运行时从 DSH profile 目录解析，不依赖硬编码绝对路径。
- `failOnStartupError: false` is set so a misconfigured API key does not prevent DSH from starting; configure the key and restart when ready.
  设置了 `failOnStartupError: false`，API Key 配置错误不会阻止 DSH 启动；填好后重启即可。

## License

Apache-2.0 © 2025-2026 Beijing Volcano Engine Technology Co., Ltd.
