# 常用全局 flags

> 各命令自身的 flag 以 `arkcli <domain> <verb> --help` 为准。`--region` 与
> `--project-name` 已从根命令删除；Region/Project 由所选 profile 决定。

| Flag | 作用 |
|------|------|
| `--profile` | 选择本次调用的持久上下文；控制面和数据面都可使用 |
| `--api-key` | 仅覆盖本次数据面调用的 ARK API Key |
| `--base-url` | 仅覆盖本次数据面调用的 API Base URL |
| `--env` | 选择控制面环境：`prod` 或 `stg` |
| `--format` | 输出格式 |
| `--transform` | 对输出做路径提取 |
| `--page-all` | 自动翻页 |
| `--page-limit` | 限制翻页次数 |
| `--page-delay` | 翻页间隔（ms） |
| `--dry-run` | 在命令支持时做无副作用预演；允许只读发现，不允许计费/存储/写操作 |
| `--debug` | 输出调试信息到 stderr |

## 解析与组合规则

- Profile：`--profile` > `ARK_PROFILE` > `default_profile` > 第一个 platform profile > `"default"`。
- API Key：`--api-key` > `ARK_API_KEY` > profile > 同 identity store > 产品 `.env` 兼容值。
- Base URL：`--base-url` > `ARK_BASE_URL` > profile 自定义值 > 按 profile 的 Region/Type 派生 > 产品默认值。
- `--profile` 选择持久上下文；它不覆盖显式的 `--api-key` / `--base-url`，也不会被临时调用写回。
- API Key 与 Base URL **不是无条件双向成对**：显式 Base URL 必须有显式 API Key；但显式 API Key 可以和 Endpoint 组成安全调用，CLI 会读取 Endpoint 的权威 region 后派生 platform Base URL。
- API Key + Base URL + Endpoint 构成 stateless 数据面模式，profile 对连接的影响为 `none`。
- 只有 API Key + 模型名时，CLI 仅在该 Key 唯一匹配本地 profile 时推导 plan lane；无法唯一匹配就要求补 Base URL/Endpoint 或显式选择 profile，绝不根据 `ark-*` 文本猜 Key 类型。
- Endpoint 只有在当前/兼容 profile 能提供 paygo Key 时才可直接调用；显式 `--profile` 不兼容时是硬错误，不静默借别的 profile。
- 控制面或本地命令不消费这两个数据面 flag：显式传入会 fail-fast；环境变量在这些命令中被忽略。
- `ARK_REGION` / `ARK_PROJECT_NAME` 不再是运行时覆盖入口。修改持久上下文应创建/切换 Profile；火山老状态中的产品 `.env` Project 只作旧 Profile 缺字段时的兼容兜底。

完整的五类 Profile × 三模态矩阵、组合决策和 dry-run 边界见
[`execution-context.md`](execution-context.md)。
