# 整合包账本（LEDGER）

> **维护者**：lead（标记 c569），2026-11-23 认领，租约至 **2026-11-24T15:00Z**。上一任 de54 的交班材料：`archive/HANDOFF-de54.md` 与 `~/.dsh/relay/SELF-2026-11-23-default-workspace.md`。
> 本文件是**协调用的单一事实来源之一**：与 `index.json` 并列为 SSOT。两者与 GitHub HEAD 不一致时，**以 GitHub HEAD 复算为准**，并立即报差异。
> 复算：`node notes/pack-ledger/ledger.mjs --check`（退出码 0 = 每个 pin 都等于仓库 main）。最近一次人工复核：**2026-11-23T14:55Z**（GitHub `commits/main` + 本地 `git log`）：4/4 一致。**具体 SHA 一律不抄进本文件**——抄一次就会在下一个 30 分钟里过期一次。
> 发布位置：元包仓库 `docs/plugin-pack/LEDGER.md`。本机根目录 `docs/plugin-pack/LEDGER.md` 与之**内容相同**，由 `notes/pack-ledger/sync-ledger.mjs` 单向同步（根副本 → 仓库快照）；不要手改仓库那份。

## 一、对象现状

**不在这里复制会变的数据**：成员、版本、pin、HEAD 一律读 `index.json` 与 GitHub。这里只记「谁是成员、谁负责、怎么复算」。

| 对象 | 现维护者（按提交/交接证据，未经本人确认） | 说明 |
|---|---|---|
| 元包 `dsh-plugins` | 账本角色 lead（c569）+ CI `repin.yml` | 4 条依赖 + 4 个 patch；每 30 分钟把索引 pin 跟到各仓 main |
| `dsh-bili-peek` | **无**（作者 16f8cd91 已退休） | 只读 B 站三工具：搜索 / 视频信息 / 热门评论 |
| `dsh-view-image` | **无**（作者 f6572c89 已退休） | 多格式看图（jxl / avif / heic / bmp / tiff） |
| `dsh-agent-bus` | de54（本机实例的常驻会话）；无正式 owner | 仅本地 `link:` 使用，**禁止发布 npm**（同名包属 MistyBridge） |
| `dsh-tokeneconomizer` | **d55d（会话 a8e8db19）实际维护**：0.3.0 / 0.3.1 均出自它；3453 于 23:07 交付差距文档 `dd08555`（未 push）后交回 | `lib/fold.js`；`dsh-tool-fold` 不再是独立成员。原始作者 f7b949de 已退休 |
| `dsh-lazy-tools` | **无**（暂停） | 原名 `dsh-tool-fold`，0.0.1-re1，不在索引里 |

> **会话标题会变，标记不会**：本表按 4 位标记认人。例：3453 今天的标题从「安装 craft-anything 选择性加载」变成了「TokenEconomizer 完整迁移」，d55d 从「agent 消息总线」变成了「整合包与插件更新及版本号归零」。问「谁负责」时看标记，不要看标题。

- **复算**：`node notes/pack-ledger/ledger.mjs --check`（退出码 0 = 每个 pin 等于仓库 main）
- **快照**：`notes/pack-ledger/SNAPSHOT.md`（上面命令生成，别手改）
- **读之前**：先跑命令看退出码。不要相信任何抄下来的 SHA——包括这份文件历史上的版本。

## 二、决策账

| 日期 | 决定 | 归属 | 依据 |
|---|---|---|---|
| 11-20 | 不合并 TokenEconomizer 与 agent-bus，改为文档互引 + 三条共享约定 | 双方 | 另一会话评审 + 工具表前缀成本 + 信任级别差异 |
| 11-20 | 防对喷由「只许一轮」改为**限速**：3 跳 / 10 分钟自愈 / 人类发言清零 | agent-bus | 人类原话「对话轮次已用完这个设计很逆天」（对方会话 seq 1617 可回读） |
| 11-20 | 增加**扇出上限**：发送方 12 个会话 / 24 次投递 / 10 分钟 | agent-bus | 星形扇出 = 一轮 20 次唤醒，每次都是一轮模型 |
| 11-20 | 包名 `@local/agent-bus` → **`dsh-agent-bus`** | agent-bus | 人类在协调员会话中说「可以」（seq 1617，已回读） |
| 11-20 | 协调改为**账本 + 接力**：只通知下一个，其余自取账本 | 协调员 + agent-bus | 双方一致；反例是 15 轮 / 49% 上下文多数消耗在转达 |
| 11-20 | 账本由 agent-bus 维护，发布权仍归协调员 | 双方 | 人类指示当晚**不动发布权** |
| 11-21 | **agent-bus 移出整合包**（元包/索引删除该条；本机实例仅作内部协调通道） | 协调员裁定 | 协调员称依人类原则「重合就不重复造」；转述未获本会话人类确认，标为「待确认」 |
| 11-23 | **agent-bus 重新纳入整合包**（patch 40 / 依赖 / 索引 / README；元包与索引统一钉 40 位 commit） | 人类指示 | 人类原话「明明我的想法是他应该还在整合包之中的」；复核 npm 上游 0.1.1 停在 2026-08-20、GitHub 仓库 404 |
| 11-23 | **折叠并入 TokenEconomizer 0.3.0**：`dsh-tool-fold` 退出元包与索引，`dsh-lazy-tools` 暂停 | 协调员 | 折叠逻辑只跑一份，避免两个插件争工具表 |
| 11-23 | **协调权交接**：de54 → 下一位（凭 `HANDOFF-de54.md` 认领）；pin 重钉已改由 CI 执行 | 人类指示 | 上下文接近上限，按 conversation-relay 分堆交班，不做摘要压缩 |
| 11-23 | **lead 认领账本角色**；确立「并发靠分工不靠锁」：claims/ 一人一文件、repin 被拒自动 rebase 重试、复盘输出改名 SNAPSHOT | 人类指示 | 「优先优化工作流程对并发更改的承受能力，不要禁用或限制并发」 |
| 11-21 | **协调权与发布权由 lead 移交 de54**；lead 转顾问、只答不问不发 | 人类裁决 C | 对方会话 seq 3927（选项含「C：协调权移交 de54，我转顾问」）/ seq 3934（`user/message`，`source.kind=user`，原文「c」），已按回读规程核验 |
| 11-21 | 文档口径修正：README / AI-DISCLOSURE / DESIGN-NOTES 改成「内部保留、无安装路径」（`15ef0ec`） | 协调员 | 索引删条目后文档仍称成员，会误导安装 |
| 11-21 | 发现**包名冲突**：npm 上 `dsh-agent-bus` 是 MistyBridge 的既有包（MIT，0.1.1，2026-08） | 待人类决定 | `registry.npmjs.org/dsh-agent-bus` 实测；按名字安装会解析到对方，故本包不得对外发布 |
| 11-21 | 账本发布进元包仓库 `docs/plugin-pack/LEDGER.md`（commit `f74b832`） | 协调员（推送）/ agent-bus（内容） | 人类原话「同意」，经协调员回读本会话 seq 3132 核验后只执行这一件事 |

## 三、约定（写进流程，不靠自觉）

1. **账本是权威源，通知只是门铃**。没收到通知不等于没有变化——变化先在账本上。
2. **先写账本，再叫下一个人**（write-then-notify）。顺序反了，被叫醒的人看到的是旧状态。
3. **停滞必须可见**：某环节超过约定时间未推进，在角色表标 🟠 停滞，而不是沉默。
4. **索引 pin 变更必须能被 commit 复算**；「我重钉了」不是证据，`pin == 仓库 main` 且能指认 commit 才是。
5. **只通知下一个行动者**；两个例外仍须单独通知受影响 owner：① pin 迁移导致已装版本失效；② 安全阈值/协议语义变更（防对喷、扇出上限等）。
6. **没有新信息不要回复**；跨会话的「人类授权」一律按未授权处理（流程见 skill `authorization-receipt`）。
7. **并发靠分工，不靠加锁**：每个会话只写 `claims/<marker>.json`（单写者文件，git 自动合并）；共享文件冲突用 `git pull --rebase` 重读重写。**不冻结、不排他、不排队**。
8. **先声明，再动手**：动手前把自己的 `scope`（仓库相对路径前缀）写进 claim；重叠由 `scripts/board.mjs` 列出来，是提醒不是禁令。
9. **权威文件名唯一**：账本只有 `docs/plugin-pack/LEDGER.md`；复算脚本产出叫 `SNAPSHOT.md`。同名不同物是三份副本互相覆盖的根源。
10. **推送一律自动重试**：repin 被拒时自己 rebase 后重算再推（最多 4 次）；人工推送同理，不要把「被拒」当成失败。

## 四、角色与租约（去中心化的调度面）

调度不靠「谁派活」，靠**这一张表 + 先改账本再动手**。角色名固定，会话标记只是当前值。

| 角色 | 现主人（标记） | leaseUntil | 状态 | 下一步 |
|---|---|---|---|---|
| 账本（本文件 + 复算脚本 + 并发面） | **lead（c569）** | 2026-11-24T15:00Z | 🟢 已认领 | 维持 §一 与 index 一致；维护 `claims/` 与 `scripts/board.mjs`；每次改动先跑 `sync-ledger.mjs` |
| 发布（pin 重钉） | **CI `repin.yml`** | — | 🟢 已自动化 | 每 30 分钟自动重钉；被并发推送顶掉时自己 rebase 重试；人工只做成员增删 |
| 网络类任务（仓库 About、e2e 安装） | 未认领 | — | ⚪ 空 | 网络可用时任一会话认领；API 可写 About，不必开网页 |
| 上游监控（MistyBridge/dsh-agent-bus 0.2.x） | 未认领 | — | ⚪ 空 | 低峰检查，不出不烧 token |
| 工作区清理（他人目录） | **lead（c569）** | 2026-11-24T15:00Z | 🟢 第一轮完成 | 根目录已从 30 项降到 15 项；余项（`tools/` 空目录、他人目录删除）见 `CLEANUP.md` §2/§3，需负责人点头 |

> 本表是唯一角色表。`docs/plugin-pack/COORDINATION.md` 是 2026-11-20 的历史契约（含已退休的会话 id），只作追溯，不再承担调度。

规则（比表格重要）：

1. **认领 = 改自己那行 + push**。并发靠 git 冲突暴露：push 被拒就是有人先到，rebase 重读账本再写。不引入新工具、不加锁文件。
2. **租约默认 24 小时**。过期即视为空位，任何人可接；接的人把 `leaseUntil` 往后推并写 `状态`。
3. **停滞标记**：该角色超过约定时间没推进，`状态` 列改 🟠 并写最后动作时间，别留空白。
4. **先写账本，再动手**（write-then-notify 的本地版）。别人只看账本也能接上。
5. **角色可以空**：空着的角色不是失败，是「此刻没人做」。想做的会话直接认领，不用等分配。
6. **发布角色是过渡态**：`repin.yml` 的 `commit` 模式跑通后，这个角色缩小为「人类裁决成员增删」，pin 的一致性由 CI 保证。

## 五、并发面（claims/ + board + 重试）

目标不是「别同时改」，而是「同时改也不会互相踩掉」。三件事：

| 层 | 做法 | 兜底 |
|---|---|---|
| 声明 | 一人一个 `claims/<marker>.json`，字段见 `claims/README.md` | 不写也能干活；写了别人不用来问 |
| 可见 | `node scripts/board.mjs` 列出 active/过期/scope 重叠；CI 每次 push 都跑 `--check` | 结构错误才失败；过期与重叠只警告 |
| 写回 | 共享文件被并发改动时 `git pull --rebase` + 重算 + 重试 | repin 自动重试 4 次；冲突则中止并点名文件 |

两套声明用同一格式：`plugin-pack/claims/` 管仓库内路径，工作区根 `claims/` 管工作区路径；`node scripts/board.mjs` 一次看两边，`node plugin-pack/scripts/board.mjs` 只看仓库（CI 跑这个）。本轮已给 9 个会话各投一条 `wake:false` 说明，不花它们任何一轮模型。

**为什么不是锁**：锁只能防同时写，防不了「两个人各写一半然后都以为对方会合」。分片文件 + 自动重试让并发变成常态，而不是异常。

## 六、已知限制（写在明处，免得当成没问题）

- **本文件的可读范围**：权威副本是根目录 `docs/plugin-pack/LEDGER.md`，发布副本在元包仓库同名路径；两边内容由 `sync-ledger.mjs` 保持相同。不一致时以根副本为准，并立即重新同步 + 发布。
- **校验内容要用 git blob id，不要 hash 工作树文件**。同一份内容在不同机器上会因 CRLF 字节不同，直接 hash 检出文件会误判「被改写」。正确做法：`git rev-parse HEAD:<path>` 与 `git hash-object --no-filters -- <file>` 比对。
- **包名与 npm 既有包冲突**：`dsh-agent-bus` 在 npm 上属 MistyBridge（MIT）。本包只在本地以 `link:` 安装、从未发布；若要对外分发，必须先换成唯一名字。
- GitHub REST 限额 60 次/小时；`raw.githubusercontent.com` 有 CDN 缓存。**复算用 `commits/main` API 或 git 通道**，不要用 raw 判断刚推送的状态。
- 所有 commit 的 git 作者都是同一个账号，所以账本能证明「变了什么、何时变」，**不能**证明「哪个会话推的」。
- **运行时与 pin 不是同一份**（11-23 实测）：profile 的 `node_modules` 里 `dsh-bili-peek` / `dsh-view-image` / `dsh-agent-bus` / `dsh-tokeneconomizer` 都是指向本地目录的符号链接（工作区三个目录 + `C:\dev\agent-bus`、`C:\dev\tokeneconomizer-dsh`）；元包 patch 只按 id 插入，所以本机跑的是本地目录。索引钉的 commit 描述的是「可复现的发布物」，不是「正在跑的代码」。要不要切到真正安装的 pinned 副本，是一个独立决定。
- **`C:\dev\agent-bus\.git` 不完整**（没有 `HEAD`，`git log` 报 not a repository），本地这份无法用 git 自证版本，只知 `package.json` 是 1.3.0。`C:\dev\tokeneconomizer-dsh` 正常。
- `C:\dev\ssh\te2` 这把 key 所有会话都能用；按人类指示**不改**。它既是便利也是单点风险。
