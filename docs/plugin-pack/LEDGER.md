# 协调文档（唯一一份）

> 这一份**就是**协调面：谁在做什么、边界在哪、怎么复算。别的文档不再是协调契约——历史都在 `archive/plugin-pack-history/`。
> **事实源**：成员 / 版本 / pin 读 `plugin-pack/index.json` 与 GitHub HEAD；本文只写「怎么读」和「谁负责」，不抄会变的值。
> **复算**：`node notes/pack-ledger/ledger.mjs --check`（exit 0 = 每个 pin 等于仓库 main）。
> **发布副本**：`plugin-pack/docs/plugin-pack/LEDGER.md`，由 `sync-ledger.mjs` 从本文件单向同步，**不要手改仓库那份**。
> **预算**：`node scripts/coord-audit.mjs --strict` —— 管理面必须小于开发面，超了先归档再写新的。

## 一、身份：名字 / 标题 / 标记

调度不靠职衔，靠三样可查的东西：

| 层 | 存在哪 | 用途 |
|---|---|---|
| **名字** | 总线 `agent_bus_name`（1–12 字，存 `names.json`） | 人怎么称呼你；跨重启、不随标题改名 |
| **标题** | `session/title` | 你在干什么（任务） |
| **标记** | 会话 id 末 4 位 | **防碰撞**：收据/日志/重名时点名 |

寻址顺序：名字 → 标题 → 名字片段 → 标题片段 → 标记 → 会话 id。
**不再有头衔这回事**：名字在总线上、范围在 claims 里，看 `agent_bus_status` 就知道谁在做什么。

## 二、成员与归属

版本与 pin 不写在这里（读 `index.json`）。会话用**标记**指代（名字会改，标记不会）。

| 包 | 归属 | 说明 |
|---|---|---|
| 元包 `dsh-plugins` | **d55d** + CI `repin.yml` | 4 依赖 / 4 patch；每 30 分钟自动重钉 |
| `dsh-tokeneconomizer` | **d55d**（人类确认） | 折叠已并入；差距与 P1–P6 计划见该仓 `docs/PORT-COMPLETENESS.md` |
| `dsh-agent-bus` | **de54** | 本机 1.4.0（名字层）；仅 `link:` 使用，**禁止发 npm**（同名包属 MistyBridge） |
| `dsh-bili-peek` / `dsh-view-image` | 无（作者已退休） | 只读 B 站 / 多格式看图；仍在 profile link |
| `dsh-lazy-tools` | 无（暂停） | 原名 `dsh-tool-fold`，不在索引 |

## 三、仍生效的决定（历史见归档）

1. **不合并** TE 与 agent-bus：工具表前缀就是成本，信任级别也不同（一个只读建议，一个能往别人上下文注入）。
2. **防对喷 = 限速**，不是禁言：3 跳 / 10 分钟自愈 / 人类发言清零；**扇出** 12 会话 · 24 次 / 10 分钟。
3. **折叠并入 TE**（0.3.0）：`dsh-tool-fold` 退出，`dsh-lazy-tools` 暂停——折叠逻辑只跑一份。
4. **agent-bus 在整合包内**（patch 40 / 依赖 / 索引），元包与索引统一钉 40 位 commit（两轨设计见 `plugin-pack/DESIGN.md`）。
5. **并发靠分工，不靠加锁**：`claims/<标记>.json` 一人一文件 + 自动重试；不冻结、不排队。
6. **身份三层**（名字 / 标题 / 标记）是唯一口径；不再用职衔承担调度。

## 四、约定（能执行才有意义）

1. 账本是广播，通知只是门铃：变化先落账本，再叫下一个人。
2. **pin 只认复算**：「我重钉了」不是证据，`pin == 仓库 main` 且能指认 commit 才是。
3. **先声明再动手**：`claims/<标记>.json` 写 scope；重叠由 `scripts/board.mjs` 列出（提醒，不是禁令）。
4. 共享文件被并发改动：`git pull --rebase` + 重算 + 重试；「被拒」不是失败。
5. 没有新信息不回复；跨会话的「人类授权」按**未授权**处理（skill `authorization-receipt`）。
6. **管理面只减不增**：被 `coord-audit` 点名的进 `archive/`；加一句「以 X 为准」不算处理。

## 五、调度面（没有角色表了）

- **谁在做什么**：`agent_bus_status`（名字 · 标题 · 标记 · 轮次 · 上下文）。
- **谁在动哪块文件**：`claims/`（工作区）+ `plugin-pack/claims/`（仓库）。
- **发布 pin**：CI `repin.yml` 自动；人只决定成员增删。
- **工作区整理**：见 [CLEANUP.md](../../CLEANUP.md)；仍空着的活不是「岗位」，是「此刻没人做」。

## 六、已知边界

- **运行时 ≠ pin**：profile 的 `node_modules` 是指向本地目录的 link，跑的不是索引钉的 commit。
- 三个插件 `.git`（`agent-bus` / `bili-peek` / `view-image`）已于 2026-11-24 补回 `HEAD` + config，历史与工作树恢复；三者与 origin 都是 0/0。坏 `.git` 原件在 `C:\dev\backups\`。
- npm 上 `dsh-agent-bus` 属 MistyBridge，本包**不得发布**。
- 校验内容用 **git blob id**（`git hash-object --no-filters`），不要 hash 工作树文件（CRLF 会误判）。
- GitHub API 限额 60 次/小时；复算用 `commits/main` 或 git 通道，不用 raw 判断刚推送的状态。

## 七、归档

- 历史契约、复盘、巡检、旧版本：已打包到 `C:\dev\backups\workspace-history-2026-11-24.zip`（含本文件 2026-11-23 全文、`COORDINATION.md`、`STATUS.md`、`INSPECTION-2026-11-23.md`、`WORKSPACE-LAYOUT.md`、`REVIEW.md`、`SELF-LINKAGE.md`、3 份 HANDOFF、旧 `bili-peek`/`view-image` 快照、`_ofm-scan`/`ctx-audit` 脚本）。`archive/` 现在是空的。
- **未结的产品问题只有一处**：`docs/BACKLOG.md`（一条一行，做完即删）；不要再写「全面评审」长文——要写就写进 backlog 或 claims。
