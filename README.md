# dsh-plugins —— DSH 插件整合包

> **状态：0.1.0 草稿。** 这个仓库同时是「一次装齐」的元包和「按需单装」的市场索引（format 1）。插件源码不在这里：每个插件仍然是独立仓库、独立版本、独立许可证。
>
> 四个插件仓库与元包仓库已上线（ZJ929-max），`index.json` 已可在 raw 地址读取。安装时先用 `git ls-remote https://github.com/ZJ929-max/dsh-plugins.git refs/heads/main` 取当前 main 的 40 位 commit 再固定，不要跟分支。

## 它是什么，不是什么

- **是**一个纯 bundle：`package.json` 用 `dsh.bundle.patch` 指向 `patches/*.yml`，每个文件照抄对应插件的 `cordis.patch.yml` insert 行，保留原 `id` 与 `name`。
- **是**一份 format 1 市场索引：`index.json` 列出每个插件的版本、仓库，以及固定到 40 位 commit 的 git 源。
- **不是**插件代码的合并，不修改任何插件源码，不代替插件的独立发布。
- 元包不发布 npm；安装走 git 固定 commit。

## 安装：元包（一次装齐）

agent 调用 `plugin_manager` 需要 danger-full-access；相对本地路径会被拒绝，本地目录必须是绝对路径。

```
plugin_manager {
  action: "install_bundle",
  target: "github:ZJ929-max/dsh-plugins#<40 位 commit>"
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

装完应出现四个工具面：`tool_fold`、`bili_search` / `bili_video` / `bili_comments`、`view_image`、`agent_bus_post` / `agent_bus_inbox`。

## 互斥规则（必读）

元包 insert 的 `id` 和单插件 insert 的 `id` **完全相同**：`tool-fold` / `bili-peek` / `view-image` / `agent-bus`。

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

## 版本固定

| 插件 | 版本 | 仓库 | commit |
|---|---|---|---|
| dsh-tool-fold | 0.2.0 | ZJ929-max/dsh-tool-fold | `cd2e029e307754b24be23bc305bc2937fac5a536` |
| dsh-bili-peek | 0.1.0 | ZJ929-max/dsh-bili-peek | `7f3850eae70129f71872d9c38da691b1e5919eda` |
| dsh-view-image | 0.1.0 | ZJ929-max/dsh-view-image | `5d220e6ca4a83a73c251887eb511a86c0360a4db` |
| dsh-agent-bus | 1.0.0 | ZJ929-max/dsh-agent-bus | `4c3e752b0ac1f9c144159366dcb2a2d8852eb608` |
| dsh-tokeneconomizer | 0.2.0 | ZJ929-max/tokeneconomizer-dsh | `c338fb440c3d5c95292b85d74993f8f12c6b5944`（仅索引，不随元包安装） |

升级 = 同时改三处：插件仓库的新 commit、元包 `package.json` 的依赖串、`index.json` 的 `versions[].source.commit`（以及 patch 头部注释）。不跟分支、不跟 tag、不写范围。

## 许可证与 AI 披露

- 本仓库（元包 + 索引 + 文档）是 **MPL-2.0**，见 `LICENSE`。
- 每个插件仓库各自带 MPL-2.0 `LICENSE` 与 `AI-DISCLOSURE.md`；本仓库不复制、不改变它们的许可证。
- 本仓库内容由 AI agent 起草、经人类审阅；详见 `AI-DISCLOSURE.md`。

## 目录

```
package.json          元包声明：dsh.bundle.patch + 固定 commit 的依赖
patches/*.yml         四个插件各自的 insert 行（照抄，保留原 id）
index.json            format 1 市场索引
DESIGN-NOTES.md       索引 schema、版本策略、互斥规则、CI、验收证据
AI-DISCLOSURE.md      AI 参与范围与未验证项
.github/workflows/    CI 草案：结构校验 + 公开 commit 可达性
scripts/              零依赖校验器与 git pin 检查
```

## 已知限制

- 端到端安装已在一次性 profile 实测通过（见 `DESIGN-NOTES.md` §8.5）：索引单装零配置；元包需 `blockExoticSubdeps: false` 前置。
- `view-image` 的 patch 里 `codecDir` 是插件作者机器上的默认目录；其他机器可在 profile patch 覆盖，或把解码器放进 `PATH`。
- `dsh-agent-bus` 是高权限插件：它能在同一 profile 的会话之间传递文本。安装前读它的 `AI-DISCLOSURE.md`。
- `dsh-tokeneconomizer`（仅索引，不随元包装）：**工具裁剪只出建议、不自动删工具**；事实注入依赖仓库身份，换远端/换路径会重新学习。
