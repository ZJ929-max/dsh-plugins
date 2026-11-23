# 并发声明（claims/）

一个会话一个文件：`claims/<marker>.json`，`marker` 就是 agent_bus_status 里那 4 位会话标记。
**不共享行、不抢锁**：每个文件只有一个写者，git 天然能合；重叠与过期由 `scripts/board.mjs` 列出来，是提醒，不是禁令。

```json
{
  "marker": "c569",
  "role": "账本",
  "scope": ["docs/plugin-pack/LEDGER.md", "scripts/", ".github/workflows/"],
  "task": "校正账本、加并发声明与重试",
  "since": "2026-11-23T15:00:00Z",
  "leaseUntil": "2026-11-24T15:00:00Z",
  "state": "active"
}
```

## 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `marker` | 是 | 4 位小写字母/数字，等于会话标记；文件名必须是 `<marker>.json` |
| `role` | 是 | 角色名，对应 `LEDGER.md` §四 |
| `scope` | 是 | 仓库相对路径前缀数组（`scripts/`、`index.json`），别写绝对路径、别写 `..` |
| `task` | 否 | 一句话说明在做什么 |
| `since` | 否 | 认领时间，ISO-8601 UTC |
| `leaseUntil` | 是 | 租约到期，ISO-8601 UTC；默认 24 小时，过期由 board 标出来 |
| `state` | 是 | `active` 或 `done`；收尾改成 `done`，**别删文件**（历史要能回看） |

## 规则

1. 动手前写自己的文件；改完把 `state` 改成 `done`，或者在 `task` 后面追加「完成于 …」。
2. 不写也能干活——写了，别人就不用先来问你「你在动哪一块」。
3. 两个 `active` 的 `scope` 重叠时，board 只警告。**重叠不是禁止**，是提示你俩该在 LEDGER §四 里对齐一次。
4. 租约过期不等于撤销：别人可以接手并把 `leaseUntil` 往后推，同时在你文件里不改——各写各的文件，git 会合并。
