# dsh-plugins —— DSH 插件整合包

> **状态：0.1.0 草稿。** 这个仓库同时是「一次装齐」的元包和「按需单装」的市场索引（format 1）。插件源码不在这里：每个插件仍然是独立仓库、独立版本、独立许可证。
>
> 四个插件仓库与元包仓库已上线（ZJ929-max）。**元包默认自动跟随各插件 main 的最新版**（不钉 commit）；索引侧仍按 40 位 commit 固定，供需要可复现版本的人单装。agent-bus 已移出（原因见下）。

## 它是什么，不是什么

- **是**一个纯 bundle：`package.json` 用 `dsh.bundle.patch` 指向 `patches/*.yml`，每个文件照抄对应插件的 `cordis.patch.yml` insert 行，保留原 `id` 与 `name`。
- **是**一份 format 1 市场索引：`index.json` 列出每个插件的版本、仓库，以及固定到 40 位 commit 的 git 源。
- **不是**插件代码的合并，不修改任何插件源码，不代替插件的独立发布。
- 元包不发布 npm；安装跟 main 最新；索引侧钉 commit。

## 安装：元包（一次装齐）

agent 调用 `plugin_manager` 需要 danger-full-access；相对本地路径会被拒绝，本地目录必须是绝对路径。

```
plugin_manager {
  action: "install_bundle",
  target: "github:ZJ929-max/dsh-plugins"
}
```

或者 clone 后按绝对目录安装：

```bash
git clone https://github.com/ZJ929-max/dsh-plugins.git
git -C dsh-plugins checkout <40 位 commit>
```

```
plugin_manager { action: "install_bundle", target: "C:\\absolute\\path\\to\\dsh-plugins" }
```

元包的 `dependencies` 会把四个插件装进 profile 的 node_modules；真正让它们挂载的是 `patches/*.yml` 里的 insert 行。依赖本身不是独立的 bundle 层。

> **前置条件（2026-11-20 实测）**：pnpm 默认禁止「依赖里的 git 子依赖」，会报 `ERR_PNPM_EXOTIC_SUBDEP`。元包依赖四个 git 插件，所以 profile 根目录的 `pnpm-workspace.yaml` 要加一行：`blockExoticSubdeps: false`；或安装时用 `dsh plugin --profile <name> install --config.blockExoticSubdeps=false`。**单插件安装（索引路径）不需要这行**。

装完应出现四个工具面：`tool_fold`、`bili_search` / `bili_video` / `bili_comments`、`view_image`、`tokeneconomizer`。

## 互斥规则（必读）

元包 insert 的 `id` 和单插件 insert 的 `id` **完全相同**：`tool-fold` / `bili-peek` / `view-image` / `tokeneconomizer`。

安装前自检：确认 profile 的 `dsh.profile.bundles` 里没有 `tool-fold` / `bili-peek` / `view-image` / `agent-bus` 这四个 id 的单独来源，`package.json` 里也没有同名单插件依赖。规则是「同一 plugin id 只允许一个来源注入」。

**不要把元包和任何单插件同时安装或启用。** 同一个 id 被两个 bundle insert 时，DSH 不会报错、也不会去重；loader 以 id 为键，后应用的那层生效——结果是静默覆盖，看起来像「插件没装上」。

- 从单插件换到元包：先移除单插件的安装项（或把它从 profile 的 `dsh.profile.bundles` 里去掉），确认它不再提供对应 id，再安装元包。
- 从元包换到单插件：先移除元包，再安装单插件。
- 只装索引里的单插件、或只装元包，二选一。

## 安装：索引（按需单装）

`index.json` 是 format 1 市场索引。用法：

1. 先让 profile 挂上 DSH 自带的 `plugin-market` 行（可选 bundle，默认不挂；它提供 Discover 与索引读取）。
2. 在 Discover / 设置里添加索引 URL，或在 profile patch 里写：

```yaml
- id: plugin-market
  config:
    indexes:
      - https://raw.githubusercontent.com/ZJ929-max/dsh-plugins/main/index.json
```

3. 索引里每个版本都固定到 40 位 commit；客户端安装参数形如 `git+https://github.com/ZJ929-max/dsh-tool-fold.git#cd2e029...`。

注意：

- `indexes` 只接受 `http(s)`；本地文件路径无效。
- `raw.githubusercontent.com` 有缓存延迟；刚更新的索引可能几分钟后才可见，急用可换 GitHub Pages。
- 索引 URL 在仓库创建前不存在；上线前请勿把这条 URL 配进 profile。

## 为什么没有 agent-bus

上游已有成熟实现：[MistyBridge/dsh-agent-bus](https://github.com/MistyBridge/dsh-agent-bus)（npm `dsh-agent-bus`，MIT，2026-08 起，包含 note / task / flow / panel / ledger）。我们在 2026-11-20 也写过一个同功能插件，但核心投递与其重合；按「重合就不重复造」的原则，本整合包**不再包含 agent-bus**，也不再占用该 npm 包名。需要多会话编排请直接用上游。

## 版本固定

| 插件 | 版本 | 仓库 | commit |
|---|---|---|---|
| dsh-tool-fold | 0.2.0 | ZJ929-max/dsh-tool-fold | `cd2e029e307754b24be23bc305bc2937fac5a536` |
| dsh-bili-peek | 0.1.0 | ZJ929-max/dsh-bili-peek | `7f3850eae70129f71872d9c38da691b1e5919eda` |
| dsh-view-image | 0.1.0 | ZJ929-max/dsh-view-image | `5d220e6ca4a83a73c251887eb511a86c0360a4db` |
| dsh-tokeneconomizer | 0.2.0 | ZJ929-max/tokeneconomizer-dsh | `c338fb440c3d5c95292b85d74993f8f12c6b5944`（索引固定；元包跟 main 最新） |

升级分两条路：**元包**的依赖写 `github:ZJ929-max/<repo>`（跟 main 最新），装一次就是当时最新；**索引**继续按 40 位 commit 固定，升级时改 `index.json` 的 `versions[].source.commit`。元包不追求可复现，索引追求可复现。

## 许可证与 AI 披露

- 本仓库（元包 + 索引 + 文档）是 **MPL-2.0**，见 `LICENSE`。
- 每个插件仓库各自带 MPL-2.0 `LICENSE` 与 `AI-DISCLOSURE.md`；本仓库不复制、不改变它们的许可证。
- 本仓库内容由 AI agent 起草、经人类审阅；详见 `AI-DISCLOSURE.md`。

## 目录

```
package.json          元包声明：dsh.bundle.patch + 跟 main 的依赖
patches/*.yml         四个插件各自的 insert 行（照抄，保留原 id）
index.json            format 1 市场索引
DESIGN-NOTES.md       索引 schema、版本策略、互斥规则、CI、验收证据
AI-DISCLOSURE.md      AI 参与范围与未验证项
.github/workflows/    CI 草案：结构校验 + 公开 commit 可达性
scripts/              零依赖校验器与 git pin 检查
docs/plugin-pack/     协调账本（LEDGER.md；索引 pin 与仓库 HEAD 的 SSOT，只读复算 GitHub）
```

## 已知限制

- 端到端安装已在一次性 profile 实测通过（见 `DESIGN-NOTES.md` §8.5）：索引单装零配置；元包需 `blockExoticSubdeps: false` 前置。
- `view-image` 的 patch 里 `codecDir` 是插件作者机器上的默认目录；其他机器可在 profile patch 覆盖，或把解码器放进 `PATH`。
- `dsh-tokeneconomizer`（随元包，跟 main）：**工具裁剪只出建议、不自动删工具**；事实注入依赖仓库身份，换远端/换路径会重新学习。
