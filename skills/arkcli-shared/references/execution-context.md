# 数据面执行上下文

> 仅在用户临时传入 `--profile`、`--api-key`、`--base-url`、Endpoint
> (`ep-...`) 或模型名，并准备运行 `+chat`、`+understand`、`+gen` 时读取。
> 配置来源优先级见 [`global-flags.md`](global-flags.md)。

## 先判资源，再判凭证

不要根据 API Key 的文本形态猜它属于后付费、Agent Plan、Coding Plan 或团队席位。
这些 Key 都可能长得像 `ark-*`。执行上下文必须按下面顺序解析：

```text
用户意图
  -> 资源：Endpoint / 模型名 / profile default
  -> 工作流：chat / understand / gen(image|video)
  -> 数据面：platform / agent_plan / coding_plan
  -> 凭证语义：paygo / agent_plan / team_seat
  -> Base URL 与区域
  -> 单次执行；不写回 profile
```

`+chat` 与 `+understand` 都使用 text/Responses lane；输入图片、视频或音频不会把
它们变成 image/video generation lane。只有 `+gen` 按 image/video lane 选择能力。

## 五类 Profile × 三种模态

每格依次为 `数据面 / 凭证 / 资源`：

| Profile | text（Chat / Understand） | image（Gen） | video（Gen） |
|---|---|---|---|
| Agent Plan | `agent_plan / Agent Plan Key / 模型名` | `agent_plan / Agent Plan Key / 模型名` | `agent_plan / Agent Plan Key / 模型名` |
| Agent Plan Team | `agent_plan / 团队席位 Key / 模型名` | `agent_plan / 团队席位 Key / 模型名` | `agent_plan / 团队席位 Key / 模型名` |
| Coding Plan | `coding_plan / 后付费 API Key / 模型名` | `platform / 后付费 API Key / Endpoint` | `platform / 后付费 API Key / Endpoint` |
| Coding Plan Team | `coding_plan / 团队席位 Key / 模型名` | `platform / 后付费 API Key / Endpoint` | `platform / 后付费 API Key / Endpoint` |
| Platform（后付费） | `platform / 后付费 API Key / Endpoint` | `platform / 后付费 API Key / Endpoint` | `platform / 后付费 API Key / Endpoint` |

特别注意：

- Coding Plan 个人版的 text lane 使用的是**后付费 API Key**，不是另一种
  “Coding Plan Key”。
- Coding Plan Team 的 text lane 使用团队席位 Key；但 image/video 必须切到
  platform Endpoint，并使用后付费 API Key，不能把团队席位 Key 发过去。
- Agent Plan（个人/团队）的三种模态都使用套餐模型名，不使用 platform Endpoint。

## 临时参数组合

| 用户给出的组合 | 处理 |
|---|---|
| 什么都不传 | 使用 active/显式 `--profile` 的完整上下文与 default 资源 |
| 只给模型名 | 按所选 profile 的 lane 执行；模型名不能代替 platform Endpoint |
| 只给 Endpoint | 需要 paygo 凭证。当前 profile 兼容则使用；否则只可从同 identity 的 profile 中选择唯一兼容项 |
| 只给 API Key + 模型名 | 只有该 Key 能唯一匹配本地某个 profile 时才能推导 lane；否则报歧义，要求补 Base URL/Endpoint 或选 profile |
| Endpoint + API Key | 从 Endpoint 权威元数据读取 region，派生 platform Base URL；本次为 stateless，profile 不参与连接 |
| Endpoint + API Key + Base URL | 三者共同构成 stateless 调用；profile 不参与连接 |
| Base URL（没有显式 API Key） | 拒绝。绝不把 profile 中保存的 Key 发往用户覆盖的 URL |
| platform Base URL + 模型名 | 拒绝。platform lane 必须使用 `ep-...` |

额外约束：

- 显式 `--profile X` 是硬约束。若 X 的凭证不兼容 Endpoint，不得静默借用其他
  profile；应要求用户提供 `--api-key` 或选择正确 profile。
- 未显式选择 profile 时，如果同 identity 下恰好只有一个兼容的 Platform 或
  Coding Plan 个人版 profile，可只借用它的连接信息；有多个候选必须报歧义。
- 所有临时覆盖都只作用于当前进程，不修改 active profile、default、API Key
  列表或 `config.yaml`。

## Endpoint 决定工作流

用户只给 `ep-...` 时，不要从 Endpoint ID 或绑定模型名称里的 `seedream` /
`seedance` 等子串猜用途。先运行：

```bash
arkcli resources resolve <endpoint-id> --format json
```

消费这些稳定字段：

- `supported_workflows`：候选 `chat` / `understand` / `gen`
- `generation_modality`：`image` / `video` / `image_or_video` / `unknown`
- `requires_user_intent`：为 `true` 时必须结合用户意图选择工作流
- `resource_region`：Endpoint 的权威区域；不可拿当前 profile region 代替
- `resolution_warnings`：元数据不完整时的降级原因

若同一个 Responses Endpoint 同时支持开放对话和多模态理解，资源元数据只能给出
候选，最终仍由用户任务决定：

```text
开放问答/追问/推理     -> +chat
转写/抽取/字幕/定位等  -> +understand
图片或视频生成         -> +gen
```

元数据不可用时返回 `unknown`，不要退回模型名启发式猜测；请用户明确工作流或补
`--modality`。

## dry-run 的统一边界

`+chat`、`+understand`、`+gen` 的 `--dry-run` 使用与真实执行相同的上下文和资源
解析逻辑：

- 允许读取控制面的 Endpoint/模型元数据，以保证 dry-run 与真实执行分类一致。
- 禁止调用会产生推理用量、计费或存储响应的数据面 API。
- 禁止控制面写操作。
- 输出可包含无 secret 的 `execution_context`；Endpoint 解析可附带
  `resource_resolution`。
- 输出不得包含 API Key、token 或其他凭证值。

因此，dry-run 的含义是“无副作用预演”，不是“完全离线”。例如自动识别
Endpoint 是 image 还是 video 可以做只读控制面查询，但绝不能真的生成内容。
