# DESIGN-NOTES —— 元包 + 索引（第一轮骨架）

> 版本 0.1.0 · 2026-11-20 · 写作用域仅 `plugin-pack/`。
> 本文件记录设计决定、索引 schema、版本固定策略、互斥规则、CI 草案，以及第一轮的只读比对证据。

## 1. 本轮结论

1. 元包是**纯 bundle**：没有运行时代码，只有 `package.json`、`patches/*.yml`、索引和文档。
2. 元包依赖四个插件，全部固定到 40 位 commit：dsh-tool-fold、dsh-bili-peek、dsh-view-image、dsh-agent-bus。
3. `index.json` 是 format 1，收录五个插件（多一个仅索引的 dsh-tokeneconomizer），已用 DSH 自带解析器校验通过。
4. 四个 patch 文件与插件仓库的 `cordis.patch.yml` **语义逐字段相等**（见 §6）。
5. 未执行 `install_bundle`，未改 profile，未碰 `C:\Users\zij10\.dsh`，未改任何插件源码。
6. 账号动作（建 GitHub 空仓、push、发布索引 URL）全部留待下一轮，需要人类操作或授权。

## 2. 目录

```
plugin-pack/
├─ package.json                 元包：dsh.bundle.patch 数组 + 四个 git 依赖
├─ patches/
│  ├─ 10-tool-fold.yml
│  ├─ 20-bili-peek.yml
│  ├─ 30-view-image.yml
│  └─ 40-agent-bus.yml
├─ index.json                   format 1 市场索引（5 个插件）
├─ README.md                    安装 / 互斥 / 许可
├─ AI-DISCLOSURE.md
├─ DESIGN-NOTES.md              本文件
├─ LICENSE                      MPL-2.0（与工作区 MPL-2.0.txt 逐字节一致）
├─ .gitignore
├─ .github/workflows/validate.yml
└─ scripts/
   ├─ validate.mjs              零依赖结构校验
   └─ check-pins.sh             无需 token 的公开 commit 可达性检查
```

## 3. 索引 schema（format 1）

权威定义在 DSH 的 `@deepseek-ai/dsh-plugin-market-index`（0.2.2-rc.3 随安装包分发）。本轮直接加载了该模块的 `parseMarketIndex` 做校验，而不是只照文档手写。规则要点：

```jsonc
{
  "format": 1,                          // 必须严格等于数字 1
  "title": { "en": "…", "zh": "…" },    // 必填；LocalizedText，含 en
  "description": { "en": "…" },         // 可选；给对象时也必须含 en
  "metadata": {                         // 可选；category/label/sortKey 先声明再引用
    "categories": { "tools": { "title": { "en": "Tools" } } }
  },
  "plugins": [
    {
      "name": "dsh-tool-fold",          // 合法 npm 包名，全局唯一
      "title": { "en": "Tool Fold" },   // 可选
      "description": { "en": "…" },     // 可选
      "homepage": "https://…",          // 可选；http(s)，允许 fragment
      "repository": { "url": "https://…" }, // 可选；directory 可选
      "versions": [                     // 必填、非空；读取方按 SemVer 降序排序
        {
          "version": "0.2.0",           // 精确 SemVer，不能写范围
          "publishTimestamp": 1795157526, // 整数 Unix 秒，[0, 1e11)
          "source": {
            "type": "git",              // npm | git
            "url": "https://github.com/ZJ929-max/dsh-tool-fold", // canonical https，≥2 段路径
            "commit": "cd2e029e307754b24be23bc305bc2937fac5a536" // 小写 40 位
          }
        }
      ]
    }
  ]
}
```

未定义的成员会被解析器忽略并丢弃；`icon` 可省略（本轮没有托管图标）。本轮 `index.json` 未使用 `metadata`，因此没有 category/label 的声明负担。

### 3.1 本轮校验结果

用安装包里同一份解析器执行：

```text
parseMarketIndex(index, "https://raw.githubusercontent.com/ZJ929-max/dsh-plugins/main/index.json")
→ OK, plugins = 5
target dsh-tool-fold      → git+https://github.com/ZJ929-max/dsh-tool-fold.git#cd2e029…
target dsh-bili-peek      → git+https://github.com/ZJ929-max/dsh-bili-peek.git#7f3850e…
target dsh-view-image     → git+https://github.com/ZJ929-max/dsh-view-image.git#5d220e6…
target dsh-agent-bus   → git+https://github.com/ZJ929-max/dsh-agent-bus.git#0657ea9…
target dsh-tokeneconomizer→ git+https://github.com/ZJ929-max/tokeneconomizer-dsh.git#c338fb4…
```

安装参数由 `marketInstallTarget()` 生成，和索引里的 source 一致。**索引本身还不能被远端读取**：仓库未建，URL 未上线。

## 4. 版本固定策略

- **唯一粒度是 commit**：依赖串 `github:owner/repo#<40-hex>`；索引 `source.commit` 同一个值；patch 头部注释引用同一个 commit 的 `cordis.patch.yml`。不跟分支、tag 或 semver 范围。
- **为什么不用 tag**：索引只认 40 位 commit；tag 可以被移动，commit 不会。
- **升级流程**（仓库上线后）：
  1. 在插件仓库提交并 push，得到新的 40 位 SHA；
  2. 改 `package.json` 对应依赖串；
  3. 改 `index.json` 对应 `versions[0]`：`version`、`publishTimestamp`（新提交的 Unix 秒）、`source.commit`；
  4. 改对应 patch 头部注释里的 commit；
  5. 跑 `node scripts/validate.mjs` + CI 的 `check-pins.sh`；
  6. 元包仓库自身打一个新的 commit（不要求 tag；安装串写死 commit）。
- **索引版本降序**：每个插件现在只有一个版本；将来加版本时，解析器会按 SemVer 排序，但源文件里也应按降序写，便于人读。
- **元包自身的版本**：`package.json` 的 `version`（0.1.0）只是元包的人读标识；安装不按它解析，按安装串里的 commit。

## 5. 元包与单插件互斥

机制（0.2.2-rc.3 源码调研结论）：

- 元包与单插件都会 insert 同一个 `id`（`tool-fold` / `bili-peek` / `view-image` / `agent-bus`）。
- 同一个 id 被两个 bundle insert 时，**不报错、不去重**；loader 以 id 为键，**后应用的层生效**。
- 层序：`dsh.profile.bundles` 数组序 → profile `cordis.patch.yml` → home/--patch。因此谁最后装/最后改，谁覆盖，过程是静默的。
- 元包的 `dependencies` 只负责把包装进 node_modules；如果用户另外把单插件作为 bundle 安装，它会多出一层同 id 的 insert —— 冲突就是这样发生的。
- 实现前提：DSH 初始化 profile 时写入的 pnpm 配置含 `nodeLinker: hoisted`（见 `@deepseek-ai/dsh-app-boot` 的 `PROFILE_PNPM_WORKSPACE`），元包的传递依赖因此提升到 profile 根，patch 里的 `name` 才能在 profile 的 node_modules 里解析到。

### 5.1 只读组合实验（本轮）

不安装、不改 profile，只用 DSH 自己的组合函数复现层叠加：

- 用 `bundlePatchPaths(plugin-pack, pkg.dsh.bundle)` 得到 4 个 patch 文件，逐个 `loadOverlayPatches`，再 `composeEntries` → **4 行、0 条 warning**，id 为 `tool-fold` / `bili-peek` / `view-image` / `agent-bus`。
- 在同一组合里再拼入 `tool-fold/cordis.patch.yml` → **5 行、0 条 warning**，id 序列为 `tool-fold` / `bili-peek` / `view-image` / `agent-bus` / `tool-fold`；按 id 建 `Map` 后是 4 行，`tool-fold` 取最后一层。

结论：组合层确实不去重、也不报警，后拼入的同 id 行排在后面（与源码调研的「后者生效」一致）。真实 loader 的挂载覆盖仍需双装实验确认，因此 README 把「二选一」写成硬规则而不是可选项。

## 6. Patch 只读比对（本轮证据）

方法：用 `yaml` 解析器分别读取插件仓库的 `cordis.patch.yml` 与本仓库的 patch 文件，`JSON.stringify` 后比较；同时用官方 `parseMarketIndex` 验证索引。比对时间：2026-11-20 14:5x（Asia/Hong_Kong）。

| 插件 | 插件源文件:行 | 元包文件:行 | id / name / config | 结果 |
|---|---|---|---|---|
| dsh-tool-fold 0.2.0 | `tool-fold/cordis.patch.yml:2-6` | `plugin-pack/patches/10-tool-fold.yml:5-9` | `tool-fold` / `dsh-tool-fold` / `{enabled: true}` | 语义相等 ✅ |
| dsh-bili-peek 0.1.0 | `bili-peek/cordis.patch.yml:2-4` | `plugin-pack/patches/20-bili-peek.yml:4-6` | `bili-peek` / `dsh-bili-peek` / 无 config | 语义相等 ✅ |
| dsh-view-image 0.1.0 | `view-image/cordis.patch.yml:2-9` | `plugin-pack/patches/30-view-image.yml:5-12` | `view-image` / `dsh-view-image` / `{enabled, defaultMaxWidth, codecDir, cacheMaxAgeDays}` | 语义相等 ✅ |
| dsh-agent-bus 1.0.0 | `agent-bus/cordis.patch.yml:1-3` | `plugin-pack/patches/40-agent-bus.yml:4-6` | `agent-bus` / `dsh-agent-bus` / 无 config | 语义相等 ✅ |
| dsh-tokeneconomizer 0.2.0 | `C:\dev\tokeneconomizer-dsh\cordis.patch.yml:1-7` | 不随元包安装 | `tokeneconomizer` / `dsh-tokeneconomizer` / `{enabled, facts, loopguard}` | 仅登记索引，不复制 |

补充说明：

- `view-image` 的 `codecDir: 'C:\dev\tools\codecs'` 是插件自己的默认值（见 `view-image/README.md:28` 与 `view-image/README.md:76`），不是元包另加的机器路径；其他机器可用 profile patch 覆盖。
- `dsh-agent-bus` 的 `package.json` 带 `"private": true`。作为 git 依赖安装通常不受影响，但**发布前建议由 owner 评估是否去掉**；本轮不改别人的文件。
- `dsh-tool-fold` 的源码目录是 `tool-fold/`，其 `package.json` 的 name 是 `dsh-tool-fold`；`dsh-tool-fold/` 目录只有 patch 等文件，不是仓库根，故比对以 `tool-fold/` 为准。

## 7. CI 草案（GitHub Actions，无需额外 token）

文件：`.github/workflows/validate.yml`，两个 job：

1. **structure**：`node scripts/validate.mjs`。零依赖，检查：
   - `package.json` 的 license、非 private、`dsh.bundle.patch` 数组、`files` 含 patches；
   - 每个依赖是 `github:owner/repo#<40-hex>`，且每个依赖恰好被一个 patch 覆盖；
   - patch 的 id 唯一、`name` 是依赖名、头部注释 commit 与依赖 pin 一致；
   - `index.json`：format 1、title 含 en、name 合法且唯一、versions 非空降序、精确 SemVer、整数 publishTimestamp、git source 为 canonical https + 40 位 commit；
   - 索引与依赖交叉核对：同一插件的 commit/URL 必须一致；除 `dsh-tokeneconomizer`（仅索引）外，索引条目必须是元包依赖。
2. **pinned-commits**：`bash scripts/check-pins.sh`。对每个依赖做匿名 HTTPS `git fetch --filter=blob:none`（所有分支与 tag），再 `git cat-file -e <commit>^{commit}`。仓库不存在或 commit 不可达 → job 失败。不用 token、不读 secret；`permissions: contents: read` 只够 checkout 本仓库。

已知限制：

- 本机 DSH 沙箱拒绝子进程命名管道，`git` 无法在本地跑 `check-pins.sh`；该脚本的执行证据只能在 CI 或正常桌面 shell 里取得。本轮只对脚本做了静态检查。
- CI 的 `validate.mjs` 是官方解析器的**近似**，不是官方实现。本轮已在本地用 DSH 自带的 `@deepseek-ai/dsh-plugin-market-index` 做过权威校验（§3.1）；将来若确认该包在 npm 公网可用，可把官方解析器加成 devDependency，作为 CI 的第二道闸。在确认之前不写进 workflow，避免 CI 因装不到包而红。

## 8. 开放问题 / 下一轮

1. **建仓（阻塞发布）**：dsh-tool-fold、dsh-bili-peek、dsh-view-image、dsh-agent-bus、dsh-plugins 五个空仓。需要人类在 GitHub UI 建，或提供 token；本轮未做任何账号操作。建仓时不要勾 README / .gitignore / license：本地 commit 的 SHA 才会在 push 后保持不变；若远端先有提交、必须 force push 才能替换，SHA 变了就要把依赖串、索引和 patch 头三处一起重钉。
2. **索引托管 URL**：默认 `raw.githubusercontent.com/.../main/index.json`；raw 有缓存延迟，可改 GitHub Pages。等仓库有 main 分支后再写进 README 的可用状态。
3. **端到端安装实测**：在一次性 profile（不碰 `C:\Users\zij10\.dsh`）里装元包，核对四个工具面、四个 id、以及互斥双装的实际行为。
4. **官方解析器进 CI**：先验证 `@deepseek-ai/dsh-plugin-market-index` 的公网 npm 可用性与版本。
5. **发布前清理**：agent-bus 的 `private: true`；元包 `index.json` 的 `publishTimestamp` 是否改用实际的发布时间（当前用的是对应 commit 的时间）。
6. **图标**：如需要 Discover 图标，给每个插件加托管 SVG/PNG 并填 `icon`；不阻塞功能。

## 9. 验收清单（交给 lead）

- [x] `plugin-pack/` 下文件齐全：package.json、patches/*.yml、index.json、README、LICENSE、AI-DISCLOSURE、DESIGN-NOTES、.gitignore、CI、scripts。
- [x] 未 `git init`；未执行 `install_bundle`；未改 profile 或 `C:\Users\zij10\.dsh`；未改四个插件目录。
- [x] `index.json` 通过 DSH 自带 `parseMarketIndex`；四个 patch 与插件源文件语义相等；四个依赖 pin 通过 `parseInstallSpec` / `pinnedGitOrigin`。
- [ ] 远端仓库与索引 URL 上线（下一轮，需要人类）。
- [ ] 一次性 profile 的端到端安装实测（下一轮）。
