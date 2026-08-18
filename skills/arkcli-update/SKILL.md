---
name: arkcli-update
version: 1.0.0
description: "检查或升级 arkcli，并管理 notify、automatic、disabled 三种持久化更新策略。用户问版本是否最新、要求刷新或升级、启用或关闭自动更新、排查 npm/Node/NVM 前缀不一致或更新 helper 结果时触发。"
metadata:
  requires:
    bins: ["arkcli"]
  cliHelp: "arkcli update --help"
---

# arkcli 版本检查与升级

**开始前先读取 [`../arkcli-shared/SKILL.md`](../arkcli-shared/SKILL.md)**，沿用其中的调用归因、结构化输出和确认规则。本命令不访问业务账号，不需要先跑 `auth status`。

## 只检查

默认使用零网络的本地缓存：

```bash
arkcli --format json update --check
```

按 `status` 判断，不要只看兼容字段 `update_available`：

| `status` | 含义 | Agent 行为 |
|---|---|---|
| `unknown` | 没有当前发行渠道的有效缓存 | 明确说“未知”，需要实时结果时再用 `--refresh` |
| `up_to_date` | 缓存或 registry 已确认当前版本不旧于 latest | 可报告已是最新；同时说明 `source` |
| `update_available` | `latest` 严格新于 `current` | 报告版本差异；不要自动升级 |

`source` 是 `none` / `cache` / `registry`，`checked_at` 是缓存或查询时间。需要实时查询并顺手暖缓存时：

```bash
arkcli --format json update --check --refresh
```

`--refresh` 会访问当前二进制内置 npm registry；失败时保留原错误，不把旧缓存包装成实时结果。

## 执行升级

只有用户明确要求升级当前 arkcli 时才进入写流程。先展示 `current → latest` 和当前发行渠道，再取得本轮确认；Agent 在确认后才可给非交互命令添加 `--yes`：

```bash
arkcli update --yes
```

`update` 会启动外部 npm，属于 `opaque_external_execution`，**不支持 `--dry-run`**。不要尝试、伪造或用 raw API 替代 Client Preview；用版本差异说明 + 明确确认完成安全闭环。

升级成功必须同时满足：npm 返回成功、同一个 npm global root 下的 package 版本等于 `latest`，以及 npm 管理的目标 executable 的 `--version` 也等于 `latest`。命令返回失败时不得声称升级完成。

显式 `arkcli update` 和 `arkcli update --check` 在所有更新模式下都可用；`disabled` 只关闭隐式行为。

## 持久化更新策略

只有用户明确要求改变策略时才执行：

```bash
# 普通 npm 首次安装的默认值：满足安全门禁后静默自动更新
arkcli config set update.mode automatic

# 关闭静默自动安装，但保留后台检查与更新提示
arkcli config set update.mode notify

# 关闭后台检查、提示、自动更新和安装后缓存预热
arkcli config set update.mode disabled
```

普通 npm postinstall 只会在 `update.mode` 从未设置时初始化为 `automatic` 并打印退出指令；升级/reinstall 必须保留既有 `notify` 或 `disabled`。若 npm 禁止 postinstall，稳定且 npm-owned 的 CLI 只在首条成功交互式普通命令结束后初始化并显示同一退出指令，该命令绝不立即升级。CI、直接 binary、dev/candidate、非 TTY、Preview、`config`/`update`/内部命令保持 `notify`。Agent 不得以“默认值”为由主动改写用户已经持久化的选择。

`automatic` 的一次交互链路如下：

1. 一个普通交互式命令成功完成；该命令始终使用启动时的旧版本完成。
2. CLI 只消费当前发行渠道的 stable/latest 缓存，并确认当前 executable 由同一 npm global root 管理。
3. CLI 退出后，npm launcher 校验一次性 nonce 和严格 handoff，再同步运行 package 外 helper。
4. helper 在安装前再次读取 `update.mode`，执行 npm 安装并验证 package 与 executable 版本；下一条命令才使用新版本。

当前只有 Windows 在通过 package/launcher 回滚事务验证后进入这条 automatic apply 链；macOS/Linux 会 fail closed，继续保留显式 `arkcli update`，直到各自的原生恢复事务实现并验证。自动更新也不会在 CI、非 TTY、Client Preview、内部维护命令、`config`/`update` 命令、candidate/integration 构建、直接运行的非 npm binary 或 npm prefix 不一致时执行。一次自动安装失败不会改变刚才业务命令的成功退出码，并对同一目标版本退避 24 小时。

## 失败与平台分流

- `npm` 缺失：把 CLI 给出的手动命令交给用户，不自行安装 Node/npm。
- npm prefix / Node / NVM 不一致：停止；提示用户切回安装当前 arkcli 的 Node 环境。不要用 PATH 中另一个 npm 强行继续。
- 当前 binary 不在 npm global package 内：CLI 会说明该副本不受影响；非交互环境必须再次获得授权后才加 `--yes`。即使 npm package 验证成功，也不要声称当前副本已经变更。
- Windows 的显式 `arkcli update`：命令只表示“已安排”。package 外 helper 会在父进程退出后安装并写 `update-apply.log`；只有新一次 `arkcli --version` 显示目标版本，或日志记录 `installed and verified`，才能报告完成。Windows `automatic` 模式由 npm launcher 同步等待 helper；不得把该安全结论外推到尚未开放 automatic apply 的 macOS/Linux。
- Windows 应用采用 fail-closed 回滚事务：更新前保存原 package 与 npm 生成的 launcher；npm 失败、package/版本/executable/launcher 任一验证失败，或发现未完成的上次事务时，必须恢复旧安装或停止并保留恢复证据。失败日志不得被解释为“部分成功”，也不要删除 `.arkcli-update-*` 恢复目录。

## 禁止行为

- 不代表用户运行 postinstall，也不覆盖既有 `notify/disabled`；只有用户明确要求改变策略时，Agent 才执行 `config set update.mode ...`。
- 不用 cron、系统服务或 Agent 定时任务模拟自动更新。
- 用户只问“有新版吗”时不运行真实 `arkcli update`。
- 不因普通更新提示中断当前业务命令或改变其退出码。
- 不把 `status=unknown` 解读成“无更新”或“已是最新”。

评测用例见 [`references/evals.md`](references/evals.md)。
