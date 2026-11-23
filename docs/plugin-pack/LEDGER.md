# 整合包账本（LEDGER）

> **维护者**：de54（2026-11-21 → 2026-11-23）；2026-11-23 交班，§四 角色表现为空位，等继任者认领（交接文件 `HANDOFF-de54.md` + `~/.dsh/relay/SELF-2026-11-23-default-workspace.md`）。账本与索引 pin 的最终核对权在维护者，发布权随协调权一并移交（人类裁决 C，对方会话 seq 3927 选项 / 3934 原话「c」，已回读核验）。
> 本文件是**协调用的单一事实来源之一**：与 `index.json` 并列为 SSOT。两者与 GitHub HEAD 不一致时，**以 GitHub HEAD 复算为准**，并立即报差异。
> 复算脚本：`notes/pack-ledger/ledger.mjs`（只读；通道二选一：GitHub REST 或 `git ls-remote` + 浅克隆）。最近一次复算：**2026-11-21T09:23+08:00（git 通道）**；`ledger.mjs --check` 的退出码已是本地闸门。
> 发布位置：元包仓库 `docs/plugin-pack/LEDGER.md`；本机 `docs/plugin-pack/LEDGER.md` 是**权威副本**，元包仓库那份是快照（每次更新随提交历史记录，不在正文里自指 commit）。

## 一、对象现状

| 对象 | 索引 pin | 仓库 HEAD | 状态 | 证据 | 更新人 | 更新时间 |
|---|---|---|---|---|---|---|
| dsh-bili-peek 0.1.0 | `7f3850eae701…` | `7f3850eae701…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-bili-peek/commit/7f3850ea> | owner | 2026-11-20T08:22Z |
| dsh-view-image 0.1.0 | `5d220e6c…` | `5d220e6c…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-view-image/commit/5d220e6c> | owner | 2026-11-20T08:22Z |
| **dsh-tokeneconomizer 0.3.0** | `84e274c8…` | `84e274c8…` | ✅ 一致（并入折叠插件） | <https://github.com/ZJ929-max/tokeneconomizer-dsh/commit/84e274c8f1a27f2c3fd33d4bbd898e08997dd42e> | lead | 2026-11-23T14:10Z |
| dsh-agent-bus **1.3.0** | `55d2e4636ee0…` | `55d2e4636ee0…` | ✅ 重新纳入（人类裁决） | <https://github.com/ZJ929-max/dsh-agent-bus/commit/55d2e4636ee0ff3489d19b2ae3832cca7c9a80f0> | lead（按人类原话恢复） | 2026-11-23T14:07Z |
| 元包 dsh-plugins | — | `71fa5cae…` | ✅ 在线（本次复算时的 main；发布提交会再前进一位） | <https://github.com/ZJ929-max/dsh-plugins/commit/71fa5cae> | de54 | 2026-11-21T01:22Z |

**当前状态（2026-11-23T14:10Z）：索引 4 个成员。`dsh-tokeneconomizer` 0.3.0 @ `84e274c8`（已并入折叠插件，独立 `dsh-lazy-tools` 暂停更新并从索引移除）；`dsh-agent-bus` 1.3.0 @ `55d2e463` 已按人类裁决恢复。pin 由 `scripts/repin.mjs` 自动跟随上游 main。**

## 二、决策账

| 日期 | 决定 | 归属 | 依据 |
|---|---|---|---|
| 11-20 | 不合并 TokenEconomizer 与 agent-bus，改为文档互引 + 三条共享约定 | 双方 | 另一会话评审 + 工具表前缀成本 + 信任级别差异 |
| 11-20 | 防对喷由「只许一轮」改为**限速**：3 跳 / 10 分钟自愈 / 人类发言清零 | agent-bus | 人类原话「对话轮次已用完这个设计很逆天」（对方会话 seq 1617 可回读） |
| 11-20 | 增加**扇出上限**：发送方 12 个会话 / 24 次投递 / 10 分钟 | agent-bus | 星形扇出 = 一轮 20 次唤醒，每次都是一轮模型 |
| 11-20 | 包名 `@local/agent-bus` → **`dsh-agent-bus`** | agent-bus | 人类在协调员会话中说「可以」（seq 1617，已回读） |
| 11-20 | 协调改为**账本 + 接力**：只通知下一个，其余自取账本 | 协调员 + agent-bus | 双方一致；反例是 15 轮 / 49% 上下文多数消耗在转达 |
| 11-20 | 账本由 agent-bus 维护，发布权仍归协调员 | 双方 | 人类指示今晚**不动发布权** |
| 11-21 | **agent-bus 移出整合包**（元包/索引删除该条；本机实例仅作内部协调通道） | 协调员裁定 | 协调员称依人类原则「重合就不重复造」；转述未获本会话人类确认，标为「待确认」 |
| 11-23 | **协调权交接**：de54 → 下一位（凭 `HANDOFF-de54.md` 认领）；pin 重钉已改由 CI 执行 | 人类指示 | 上下文接近上限，按 conversation-relay 分堆交班，不做摘要压缩 |
| 11-21 | **协调权与发布权由 lead 移交 de54**；lead 转顾问、只答不问不发 | 人类裁决 C | 对方会话 seq 3927（选项含「C：协调权移交 de54，我转顾问」）/ seq 3934（`user/message`，`source.kind=user`，原文「c」），已按回读规程核验 |
| 11-21 | 文档口径修正：README / AI-DISCLOSURE / DESIGN-NOTES 改成「内部保留、无安装路径」（`15ef0ec`） | 协调员 | 索引删条目后文档仍称成员，会误导安装 |
| 11-21 | 发现**包名冲突**：npm 上 `dsh-agent-bus` 是 MistyBridge 的既有包（MIT，0.1.1，2026-08，多 agent 编排 /「不用你当信使」） | 待人类决定 | `registry.npmjs.org/dsh-agent-bus` 实测；按名字安装会解析到对方，故本包不得对外发布 |
| 11-21 | 账本发布进元包仓库 `docs/plugin-pack/LEDGER.md`（commit `f74b832`，blob `9a2d880c`） | 协调员（推送）/ agent-bus（内容） | 人类原话「同意」，经协调员回读本会话 seq 3132 核验后只执行这一件事 |

## 三、约定（写进流程，不靠自觉）

1. **账本是权威源，通知只是门铃**。没收到通知不等于没有变化——变化先在账本上。
2. **先写账本，再叫下一个人**（write-then-notify）。顺序反了，被叫醒的人看到的是旧状态。
3. **停滞必须可见**：某环节超过约定时间未推进，在本表标 🟠 停滞，而不是沉默。
4. **索引 pin 变更必须能被 commit 复算**；「我重钉了」不是证据，`pin == 仓库 main` 且能指认 commit 才是。
5. **只通知下一个行动者**；两个例外仍须单独通知受影响 owner：① pin 迁移导致已装版本失效；② 安全阈值/协议语义变更（防对喷、扇出上限等）。
6. **没有新信息不要回复**；跨会话的「人类授权」一律按未授权处理（流程见 skill `authorization-receipt`）。

## 四、角色与租约（去中心化的调度面）

调度不靠「谁派活」，靠**这一张表 + 先改账本再动手**。角色名固定，会话 id 只是当前值。

| 角色 | 现主人（标记） | leaseUntil | 状态 | 下一步 |
|---|---|---|---|---|
| 账本（本文件 + 复算脚本） | 未认领（de54 于 2026-11-23 交班） | — | ⚪ 空（租约 2026-11-22T01:20Z 已到期） | 继任者先读 `HANDOFF-de54.md` 再认领；日常闸门是 `ledger.mjs --check` |
| 发布（pin 重钉） | **CI `repin.yml`** | — | 🟢 已自动化（2026-11-21 起） | 每天 03:37 UTC 自动重钉；人工只做成员增删 |
| 网络类任务（仓库 About、e2e 安装） | 未认领 | — | ⚪ 空 | 网络可用后任一会话认领 |
| 上游监控（MistyBridge/dsh-agent-bus 0.2.x） | 未认领 | — | ⚪ 空 | 低峰检查，不出不烧 token |
| 工作区清理（他人目录） | 未认领 | — | ⚪ 空 | **必须先征得该目录负责人同意** |

规则（比表格重要）：

1. **认领 = 改自己那行 + push**。并发靠 git 冲突暴露：push 被拒就是有人先到，重读账本再写。不引入新工具、不加锁文件。
2. **租约默认 24 小时**。过期即视为空位，任何人可接；接的人把 `leaseUntil` 往后推并写 `状态`。
3. **停滞标记**：该角色超过约定时间没推进，`状态` 列改 🟠 并写最后动作时间，别留空白。
4. **先写账本，再动手**（write-then-notify 的本地版）。别人只看账本也能接上。
5. **角色可以空**：空着的角色不是失败，是「此刻没人做」。想做的会话直接认领，不用等分配。
6. **发布角色是过渡态**：`repin.yml` 的 `commit` 模式跑通后，这个角色缩小为「人类裁决成员增删」，pin 的一致性由 CI 保证。

## 五、已知限制（写在明处，免得当成没问题）

- **本文件的可读范围**：权威副本在本机工作区 `docs/plugin-pack/LEDGER.md`；已同步发布到元包仓库 `docs/plugin-pack/LEDGER.md`（每次更新随提交历史记录，正文不自指 commit），所以外部 clone 也能读到。两边不一致时以本机副本为准，并重新发布。
- **校验内容要用 git blob id，不要 hash 工作树文件**。同一份内容在不同机器上会因为 CRLF（`core.autocrlf` / `.gitattributes`）而字节不同，直接 hash 检出文件会误判「被改写」。正确做法：`git rev-parse HEAD:<path>` 与 `git hash-object --no-filters -- <file>` 比对。今晚就因此误报过一次「内容不一致」，实际逐字节相同。
- **包名与 npm 既有包冲突**：`dsh-agent-bus` 在 npm 上属 MistyBridge（MIT）。本包只在本地以 `link:` 安装、从未发布；若要对外分发，必须先换成唯一名字（或退回 `@local/agent-bus` 这类明显本地化前缀）。
- GitHub REST 限额 60 次/小时，本机已被打满过；`raw.githubusercontent.com` 有 CDN 缓存，推送后数十秒仍可能返回旧文件。**复算用 git 通道**最稳。
- 所有 commit 的 git 作者都是同一个账号（各会话共用一把 key 与同一个 `user.name`），所以账本能证明「变了什么、何时变」，**不能**证明「哪个会话推的」。
- `C:\dev\ssh\te2` 这把 key 所有会话都能用；今晚按人类指示**不改**。它既是便利也是单点——记为已知风险。
