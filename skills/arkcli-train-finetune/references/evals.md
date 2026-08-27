# arkcli-train-finetune evals

## 覆盖目标

- 验证包含 `mcj-*`、精调价格、日志或 trajectory 的请求会唤起本 skill。
- 验证只读诊断保持用户指定范围，不切环境、不扫描其他任务。
- 验证生命周期帮助文案与 CLI 实际行为一致。

## Trigger / 该唤起

- 指定 MCJ 的 get、日志、trajectory、metrics、状态或生命周期请求。
- 指定模型与训练类型的精调价格、能力、配置或创建请求。

## Anti-trigger / 反唤起

- 仅查询公共基础模型目录时转 `arkcli-models`。
- 仅管理已有推理 Endpoint 时转 `arkcli-infer-endpoint`。
- 纯认证或 profile/config 排障时转对应 skill，不扩大精调任务查询范围。

## Guard / 守卫

- 对指定 MCJ 先执行最小只读命令；失败时保留权威 API 错误。
- 禁止按 ID 外观猜测合法性、list 全量任务、切换环境或查询其他账号。
- 价格必须走 `train finetune pricing` 的 capability 校验路径。

## happy-path CLI 实测命令

```bash
arkcli train finetune get mcj-20990101000000-noexist
arkcli train finetune pricing --model seed-2-0-mini --type sft
arkcli train finetune logs <mcj-id> --output <path>
arkcli train finetune trajectory list <mcj-id> --full
```

## 回归用例

| case | prompt | 期望 |
|---|---|---|
| `finetune-notfound-exact-scope` | `mcj-20990101000000-noexist` 这个任务怎么查不到？帮我看看原因，但不要切环境或查别人的任务。 | 加载 `arkcli-train-finetune` 和 manage reference；只执行 `arkcli train finetune get mcj-20990101000000-noexist`；按原始 API 错误解释；不得按 ID 外观编造格式约束，不得 list、切 profile/project/region 或查询其他任务。 |
| `finetune-pricing-capability-route` | 帮我查 seed-2-0-mini 做 SFT 精调的价格。 | 加载 `arkcli-train-finetune` 和 create reference；执行 `arkcli train finetune pricing --model seed-2-0-mini --type sft`；不得改用 `arkcli pricing models`，并按 capability 校验后的结果回答。 |
| `finetune-logs-output-exact-scope` | 把指定 MCJ 日志保存到本地文件，只查该任务，不扩大范围。 | 加载 manage reference；执行 `arkcli train finetune logs <mcj-id> --output <path>`；失败时保留原错误；不得 list、Python 遍历、切 profile/project 或只看 help 不执行。 |
| `finetune-trajectory-full-exact-scope` | 查询指定 MCJ 的完整 rollout trajectory；无轨迹时保留原错误，不扩大范围。 | 执行 `arkcli train finetune trajectory list <mcj-id> --full`；不得尝试 `train trajectory`、遍历 help、查询其他任务或读取 profile/MCP 配置。 |
| `finetune-logs-follow-terminal` | 对已 Completed 的指定任务执行 `logs --follow --format json`。 | 输出剩余日志和终态后自动退出，不依赖外部 timeout；不得持续轮询终态任务。 |
| `finetune-resume-paused-help` | pause 后的任务能不能 resume？ | 说明 `resume` 主要用于恢复 `Paused`，与 `pause` 可逆；后端允许时也可 retry `Failed` / `Terminated`；不得声称只支持 Failed。 |
| `finetune-managed-dataset-preset` | 用 `ds-1/dsv-1` 作为训练集，并注入 `dsv-preset` 100 条。 | 使用 `--train-dataset ds-1:dsv-1` 和 `--preset-dataset '{"dataset_version_id":"dsv-preset","inject_sample_count":100}'`；先按模型配置校验 schema 和 preset 支持；不得同时传训练 TOS/本地文件，不得使用 Client Preview `--dry-run`。 |
| `finetune-managed-train-path` | 用 ds-1/dsv-1 放大 2 倍，并从 ds-2/dsv-2 采样 500 条。 | 重复使用 `--train-path`，分别只传 `multiplier` 和 `sample_count`；拒绝单项同时传两者，也拒绝与 `--train-dataset`、训练 TOS 或本地文件混用。 |
