---
name: arkcli-update
version: 1.0.1
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
# 未来对应产品/平台 gate 开启后：显式授权当前 exact install
# 当前 release 会返回 automatic unavailable，不写配置
arkcli config set update.mode automatic

# 关闭静默自动安装，但保留后台检查与更新提示
arkcli config set update.mode notify

# 关闭后台检查、提示、自动更新和安装后缓存预热
arkcli config set update.mode disabled
```

普通 npm postinstall、首次运行和环境变量都不得推断 automatic 授权；缺失 `update.mode` 的兼容默认值始终是 `notify`。Windows、macOS、Linux 的 fail-closed transaction 都已实现，但当前六个产品/平台生产 gate 全部为 `false`，因此 `config set update.mode automatic` 会在读写配置和 consent receipt 前明确返回 unavailable。Agent 不得把实现完成、发现新版本或 npm 安装形态解释成已获得 automatic 权限。

未来某个产品/平台 gate 通过真实跨版本验收并开启后，`automatic` 的交互链路如下：

1. 一个普通交互式命令成功完成；该命令始终使用启动时的旧版本完成。
2. CLI 要求 exact stable 产品/包/registry/tag、forward patch、双时钟观察、10/50/100 cohort、显式 consent 和一次性 rollout token 全部成立。
3. Detached helper 等待当前进程精确退出，直接下载 reservation 固定的 SRI/URL，把 inert bytes 写入隔离 stage；不执行 npm、Node、lifecycle 或 candidate。
4. Windows 使用 persistent bootstrap、execution lease、journal 和 FileId-bound no-replace rename；macOS 使用 `RENAME_SWAP`；Linux 使用 `RENAME_EXCHANGE`。不支持原子 cutover 或任一证据漂移时 safe miss。
5. 成功后下一条命令才使用新版本；失败不改变刚才业务命令的成功退出码，并保留旧版本或 exact rollback。

当前没有任何产品/平台进入 production automatic apply 链。即使未来 gate 打开，CI、非 TTY、Client Preview、AI Skill workflow、内部维护命令、`config`/`update` 命令、candidate/integration 构建、直接运行的非 npm binary、容器/环境证据不足或 npm prefix 不一致仍会 safe miss；失败对同一目标版本退避 24 小时。

## 失败与平台分流

- `npm` 缺失：把 CLI 给出的手动命令交给用户，不自行安装 Node/npm。
- npm prefix / Node / NVM 不一致：停止；提示用户切回安装当前 arkcli 的 Node 环境。不要用 PATH 中另一个 npm 强行继续。
- 当前 binary 不在 npm global package 内：CLI 会说明该副本不受影响；非交互环境必须再次获得授权后才加 `--yes`。即使 npm package 验证成功，也不要声称当前副本已经变更。
- Windows 的显式 `arkcli update`：命令只表示“已安排”。package 外 helper 会在父进程退出后安装并写 `update-apply.log`；只有新一次 `arkcli --version` 显示目标版本，或日志记录 `installed and verified`，才能报告完成。
- Windows 应用采用 fail-closed 回滚事务：更新前保存原 package 与 npm 生成的 launcher；npm 失败、package/版本/executable/launcher 任一验证失败，或发现未完成的上次事务时，必须恢复旧安装或停止并保留恢复证据。失败日志不得被解释为“部分成功”，也不要删除 `.arkcli-update-*` 恢复目录。
- macOS/Linux 的显式 `arkcli update` 保持现有手工 npm 升级语义；不要把尚未开启的 automatic 原子 cutover 描述成显式命令已经使用该路径。

## 禁止行为

- 不代表用户运行 postinstall，也不覆盖既有 `notify/disabled`；只有用户明确要求改变策略时，Agent 才执行 `config set update.mode ...`。
- 不用 cron、系统服务或 Agent 定时任务模拟自动更新。
- 用户只问“有新版吗”时不运行真实 `arkcli update`。
- 不因普通更新提示中断当前业务命令或改变其退出码。
- 不把 `status=unknown` 解读成“无更新”或“已是最新”。

评测用例见 [`references/evals.md`](references/evals.md)。
