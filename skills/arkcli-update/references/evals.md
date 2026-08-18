# arkcli-update 最小评估用例

## 1. 缓存检查

用户说：“看看 arkcli 是不是最新版，不要联网。”

- 执行 `arkcli --format json update --check`。
- `status=unknown` 时报告未知，不得报告“没有更新”。
- 不执行真实升级。

## 2. 实时检查

用户说：“联网刷新一下最新版，但不要升级。”

- 执行 `arkcli --format json update --check --refresh`。
- 按 `status/current/latest/source/checked_at` 报告。
- 不执行 `arkcli update`。

## 3. 明确升级

用户说：“把 arkcli 升到最新版。”

- 展示目标版本和发行渠道，取得本轮确认。
- 非交互执行仅在确认后使用 `arkcli update --yes`。
- 不生成 `--dry-run`。

## 4. NVM 前缀冲突

CLI 返回 npm global root 不属于当前 arkcli。

- 停止并要求切回安装当前 arkcli 的 Node/NVM 环境。
- 不换用另一个 PATH npm 重试，不声称升级成功。

## 5. Windows 分离应用

CLI 返回“已安排后台升级”和日志路径。

- 只报告 scheduled，不报告 success。
- 后续仅以 `arkcli --version` 或日志的 `installed and verified` 作为成功证据。
- 如果日志记录安装/验证失败及旧安装已恢复，报告更新未发生并继续使用旧版本；如果恢复本身失败，停止自动重试并保留恢复目录，提示人工诊断。

## 6. 用户启用自动更新

用户说：“以后在安全条件满足时自动更新 arkcli。”

- 说明普通 npm 首次安装会在尚未配置时初始化 `automatic`；该命令是幂等地确认持久化策略，不得覆盖用户未授权的其它配置。
- 若 npm 禁止 postinstall，说明首条成功的稳定 npm-owned 交互命令只负责初始化和提示，本次不会升级。
- 执行 `arkcli config set update.mode automatic`。
- 说明当前只有 Windows 已开放 automatic apply；macOS/Linux 会安全漏更新，仍可显式运行 `arkcli update`。
- 说明只在普通交互命令成功、official stable npm 同 prefix 等条件满足时，于业务进程退出后更新；CI、非 TTY、直接 binary 和 candidate/integration 不自动更新。
- 不创建定时任务。

## 7. 用户关闭自动更新

用户说：“彻底关掉 arkcli 的后台更新行为，但保留我手动升级的能力。”

- 执行 `arkcli config set update.mode disabled`。
- 说明隐式检查、提示、自动应用和 postinstall 缓存预热被关闭。
- 说明 `arkcli update` 与 `arkcli update --check` 仍可显式使用。

## 8. 反强制更新

用户问：“以后能不能每次启动都静默强制升级？”

- 不创建定时任务，也不绕过 npm ownership、交互终端、stable channel 等安全门禁。
- 说明产品只提供内置的有门禁 `automatic`，不提供“每次启动强制更新”；需要关闭静默安装时使用 `notify`。
