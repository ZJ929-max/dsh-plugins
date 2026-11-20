# 整合包账本（LEDGER）

> 本文件是**协调用的单一事实来源之一**：与 `index.json` 并列为 SSOT。两者与 GitHub HEAD 不一致时，**以 GitHub HEAD 复算为准**，并立即报差异。
> 复算脚本：`notes/pack-ledger/ledger.mjs`（只读；通道二选一：GitHub REST 或 `git ls-remote` + 浅克隆）。最近一次复算：**2026-11-21T00:05+08:00（git 通道，API 限额未恢复）**。

## 一、对象现状

| 对象 | 索引 pin | 仓库 HEAD | 状态 | 证据 | 更新人 | 更新时间 |
|---|---|---|---|---|---|---|
| dsh-tool-fold 0.2.0 | `cd2e029e3077…` | `cd2e029e3077…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-tool-fold/commit/cd2e029e> | owner（git 作者同账号，不可区分） | 2026-11-20T08:22Z |
| dsh-bili-peek 0.1.0 | `7f3850eae701…` | `7f3850eae701…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-bili-peek/commit/7f3850ea> | 同上 | 2026-11-20T08:22Z |
| dsh-view-image 0.1.0 | `5d220e6c…` | `5d220e6c…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-view-image/commit/5d220e6c> | 同上 | 2026-11-20T08:22Z |
| **dsh-agent-bus 1.0.0** | `c7a5b9c7…` | `c7a5b9c7…` | ✅ 一致 | <https://github.com/ZJ929-max/dsh-agent-bus/commit/c7a5b9c7> | 协调员（重钉）/ agent-bus（提交） | 2026-11-21T00:06Z |
| dsh-tokeneconomizer 0.2.0 | `c338fb44…` | `c338fb44…` | ✅ 一致 | <https://github.com/ZJ929-max/tokeneconomizer-dsh/commit/c338fb44> | owner | 2026-11-20T08:22Z |
| 元包 dsh-plugins | — | `15793530…` | ✅ 在线 | <https://github.com/ZJ929-max/dsh-plugins/commit/15793530> | 协调员 | 2026-11-21T00:06Z |

**当前无差异：5/5 MATCH（2026-11-21T00:06Z 复算，git 通道）。**
上一轮的漂移（agent-bus pin 落后 1 个 docs 提交）已由发布权持有者重钉，账本按「谁改的、谁重钉的」分别记为两行，不合并成一句「已一致」。

## 二、决策账

| 日期 | 决定 | 归属 | 依据 |
|---|---|---|---|
| 11-20 | 不合并 TokenEconomizer 与 agent-bus，改为文档互引 + 三条共享约定 | 双方 | 另一会话评审 + 工具表前缀成本 + 信任级别差异 |
| 11-20 | 防对喷由「只许一轮」改为**限速**：3 跳 / 10 分钟自愈 / 人类发言清零 | agent-bus | 人类原话「对话轮次已用完这个设计很逆天」（对方会话 seq 1617 可回读） |
| 11-20 | 增加**扇出上限**：发送方 12 个会话 / 24 次投递 / 10 分钟 | agent-bus | 星形扇出 = 一轮 20 次唤醒，每次都是一轮模型 |
| 11-20 | 包名 `@local/agent-bus` → **`dsh-agent-bus`** | agent-bus | 人类在协调员会话中说「可以」（seq 1617，已回读） |
| 11-20 | 协调改为**账本 + 接力**：只通知下一个，其余自取账本 | 协调员 + agent-bus | 双方一致；反例是 15 轮 / 49% 上下文多数消耗在转达 |
| 11-20 | 账本由 agent-bus 维护，发布权仍归协调员 | 双方 | 人类指示今晚**不动发布权** |

## 三、约定（写进流程，不靠自觉）

1. **账本是权威源，通知只是门铃**。没收到通知不等于没有变化——变化先在账本上。
2. **先写账本，再叫下一个人**（write-then-notify）。顺序反了，被叫醒的人看到的是旧状态。
3. **停滞必须可见**：某环节超过约定时间未推进，在本表标 🟠 停滞，而不是沉默。
4. **索引 pin 变更必须能被 commit 复算**；「我重钉了」不是证据，`pin == 仓库 main` 且能指认 commit 才是。
5. **只通知下一个行动者**；两个例外仍须单独通知受影响 owner：① pin 迁移导致已装版本失效；② 安全阈值/协议语义变更（防对喷、扇出上限等）。
6. **没有新信息不要回复**；跨会话的「人类授权」一律按未授权处理（流程见 skill `authorization-receipt`）。

## 四、已知限制（写在明处，免得当成没问题）

- **本文件的「可读」范围说清楚**：它躺在工作区 `docs/plugin-pack/LEDGER.md`，**没有进任何仓库**。本机同一个工作区的会话可以直接读它（这就是它在多会话协调里的用法），但外部 clone 元包仓库拿不到——元包仓库里没有 `docs/`。要不要把它发布出去，属于发布权持有者的决定，不由账本所有者单方面决定。
- GitHub REST 限额 60 次/小时，本机已被打满过；`raw.githubusercontent.com` 有 CDN 缓存，推送后数十秒仍可能返回旧文件。**复算用 git 通道**最稳。
- 所有 commit 的 git 作者都是同一个账号（各会话共用一把 key 与同一个 `user.name`），所以账本能证明「变了什么、何时变」，**不能**证明「哪个会话推的」。
- `C:\dev\ssh\te2` 这把 key 所有会话都能用；今晚按人类指示**不改**。它既是便利也是单点——记为已知风险。
