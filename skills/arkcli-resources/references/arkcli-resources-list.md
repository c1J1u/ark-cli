# resources list 详细参考

> **前置**：先读 [`../SKILL.md`](../SKILL.md)。

## Flag 一览

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `--profile` | 否 | active | 显式 target profile；用 P0-A 修正后的 `RebuildForProfile` 切身份打控制面 |
| `--modality` | 否 | `text` | `text` / `image` / `video` |

## 派发逻辑

```
profile.Type:
  platform   → ListEndpoints (PageAll) 列所有 active endpoint, 按 modality
               过滤 (text=非 ContentGeneration; image=seedream-*; video=seedance-*;
               custom model 走 unknown 放行避免错杀, 见 internal/service/
               inferendpoint/endpoint_modality.go)
  agent-plan
    text     → ListAgentPlanLatestModel
    image    → AgentPlanImageModels  (硬编 console snapshot)
    video    → AgentPlanVideoModels  (硬编 console snapshot)
  coding-plan
    text     → ListArkCodeLatestModel (必传 AccountID, 从 SSO 派生)
    image    → 借道 platform ListEndpoints + modality filter (S10, commit f69be53)
    video    → 同 image
  agent-plan-team
    text/image/video → 与 Agent Plan 使用相同模型池，但凭证语义是 team_seat
  coding-plan-team
    text     → Coding Plan 模型 + team_seat
    image/video → platform Endpoint；team_seat 不可调用，required_overrides=["api_key"]
```

## 输出形态

```json
{
  "profile": "<name>",
  "type": "<platform | agent-plan | coding-plan>",
  "modality": "<text|image|video>",
  "items": [
    {
      "id": "<id>",
      "resource_kind": "<endpoint|model>",
      "data_plane": "<platform|agent_plan|coding_plan>",
      "credential_kind": "<paygo|agent_plan|team_seat>",
      "invocable": true,
      "is_default": true
    }
  ],
  "current_default": "<id-or-empty>",
  "item_count": <n>
}
```

`is_default` 仅表示 items[].id 跟 profile.yaml 的 default 匹配。它不保证当前凭证
可调用；`invocable=false` 时读取 `required_overrides`。

## resolve Endpoint

用户只给 Endpoint，或需要确认它该走 `+chat` / `+understand` / `+gen` 时：

```bash
arkcli resources resolve <endpoint-id> --format json
```

输出示意：

```json
{
  "resource_id": "ep-...",
  "resource_region": "cn-beijing",
  "resource_kind": "endpoint",
  "data_plane": "platform",
  "model_id": "<bound-model-id>",
  "input_modalities": ["text"],
  "output_modalities": ["video"],
  "supported_workflows": ["gen"],
  "generation_modality": "video",
  "requires_user_intent": false,
  "resolution_source": "endpoint_and_model_metadata"
}
```

- 解析先读 Endpoint 绑定，再读模型的 task/API/modality 元数据。
- `resource_region` 是 Endpoint 权威 region，可用于 Endpoint + API Key 时派生 Base URL。
- `requires_user_intent=true` 表示同一资源可服务多个候选工作流，最终由用户任务选择。
- `resolution_warnings` 非空或模态为 `unknown` 时，不要从 Endpoint ID / 模型名猜。

## 跟旧 list 形态的差异（0.1.16 前）

0.1.16 把原 `profile.AvailableTextModels` / `AvailableImageModels` / `AvailableVideoModels` 静态列表全部移除（S2），全部走 `resources list` 实时拉。这意味着：

- 老脚本里读 `profile.yaml.available_text_models` 字段的逻辑全部失效
- Agent 想知道"可用模型清单"必须跑 `resources list`，不能假设 profile.yaml 里有
- profile.yaml 现在只持 default（`Resources.<modality>.Default`），不持 available list

## 跟 `arkcli api ListEndpoints` 的区别

| 维度 | `arkcli resources list` | `arkcli api ListEndpoints` |
|------|------------------------|----------------------------|
| 入口 | 产品命令（shortcuts） | Raw API explorer |
| 派发 | 按 profile.Type 分流 endpoint / plan / coding | 永远 ListEndpoints |
| 输出 | 极简 `[{"id": ...}, ...]` | 完整 Endpoint 全字段 |
| identity scope | `RebuildForProfile` 切 target 身份 | 用 active profile |

Agent 优先 `arkcli resources list`，只在需要 Endpoint 全字段（status / quota / created_at）时回退 `arkcli api ListEndpoints --params ...`。

临时 API Key / Base URL / Endpoint 的执行决策见
[`../../arkcli-shared/references/execution-context.md`](../../arkcli-shared/references/execution-context.md)。
