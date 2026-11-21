# 整合包账本（LEDGER）

> 本文件是**协调用的单一事实来源之一**：与 `index.json` 并列为 SSOT。两者与 GitHub HEAD 不一致时，**以 GitHub HEAD 复算为准**，并立即报差异。
> 复算脚本：`notes/pack-ledger/ledger.mjs`（只读；通道二选一：GitHub REST 或 `git ls-remote` + 浅克隆）。最近一次复算：**2026-11-21T00:51+08:00（git 通道）**。
> 发布位置：元包仓库 `docs/plugin-pack/LEDGER.md`（commit `f74b832`，git blob `9a2d880c`，与本地逐字节一致）。本机路径 `docs/plugin-pack/LEDGER.md` 是**权威副本**，元包仓库那份是快照。

## 一、对象现状

| 对象 | 索引 pin | 仓库 HEAD | 状态 | 证据 | 更新人 | 更新时间 |
|---|---|---|---|---|---|---|
| **dsh-tool-fold 0.2.0** | `cd2e029e3077…` | `8527fd0f…` | 🟡 **pin 落后 1**（0.2.1 修复未进索引） | <https://github.com/ZJ929-max/dsh-tool-fold/commit/8527fd0f> | owner | 2026-11-21T00:5xZ |
| dsh-bili-peek 0.1.0 | `7f3850eae701…` | `7f3850eae701…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-bili-peek/commit/7f3850ea> | owner | 2026-11-20T08:22Z |
| dsh-view-image 0.1.0 | `5d220e6c…` | `5d220e6c…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-view-image/commit/5d220e6c> | owner | 2026-11-20T08:22Z |
| dsh-tokeneconomizer 0.2.0 | `c338fb44…` | `c338fb44…` | ✅ 一致 | <https://github.com/ZJ929-max/tokeneconomizer-dsh/commit/c338fb44> | owner | 2026-11-20T08:22Z |
| ~~dsh-agent-bus~~ | 索引已删 | `5c4b2da` | ⚪ **移出整合包**（内部保留） | <https://github.com/ZJ929-max/dsh-agent-bus/commit/5c4b2da> | 协调员（00:49Z 裁定）/ agent-bus（提交） | 2026-11-21T00:49Z |
| 元包 dsh-plugins | — | `15ef0ec4…` | ✅ 在线 | <https://github.com/ZJ929-max/dsh-plugins/commit/15ef0ec4> | 协调员 | 2026-11-21T00:51Z |

**当前状态（2026-11-21T00:51Z 复算，git 通道）：索引 4 个成员，3 个 MATCH；`dsh-tool-fold` pin `cd2e029e`(0.2.0) 落后仓库 HEAD `8527fd0f`(0.2.1，修复「先应用新限制再撤旧限制」)，需重钉 + 版本号改 0.2.1。**
agent-bus 已按协调员裁定移出索引（元包 `23d2fa0`），本机实例保留、不再对外分发；文档口径在 `15ef0ec` 里改成「内部保留、无安装路径」。

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

## 四、已知限制（写在明处，免得当成没问题）

- **本文件的可读范围**：权威副本在本机工作区 `docs/plugin-pack/LEDGER.md`；已同步发布到元包仓库 `docs/plugin-pack/LEDGER.md`（commit `f74b832`），所以外部 clone 也能读到。两边不一致时以本机副本为准，并重新发布。
- **校验内容要用 git blob id，不要 hash 工作树文件**。同一份内容在不同机器上会因为 CRLF（`core.autocrlf` / `.gitattributes`）而字节不同，直接 hash 检出文件会误判「被改写」。正确做法：`git rev-parse HEAD:<path>` 与 `git hash-object --no-filters -- <file>` 比对。今晚就因此误报过一次「内容不一致」，实际逐字节相同。
- **包名与 npm 既有包冲突**：`dsh-agent-bus` 在 npm 上属 MistyBridge（MIT）。本包只在本地以 `link:` 安装、从未发布；若要对外分发，必须先换成唯一名字（或退回 `@local/agent-bus` 这类明显本地化前缀）。
- GitHub REST 限额 60 次/小时，本机已被打满过；`raw.githubusercontent.com` 有 CDN 缓存，推送后数十秒仍可能返回旧文件。**复算用 git 通道**最稳。
- 所有 commit 的 git 作者都是同一个账号（各会话共用一把 key 与同一个 `user.name`），所以账本能证明「变了什么、何时变」，**不能**证明「哪个会话推的」。
- `C:\dev\ssh\te2` 这把 key 所有会话都能用；今晚按人类指示**不改**。它既是便利也是单点——记为已知风险。
