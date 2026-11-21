# 开发文档

## 部署

`vite.config.ts` 里 `base` 设为 `'./'`，资源全部走相对路径，所以构建产物可以直接放到任意子路径：

- GitHub Pages：`https://<user>.github.io/<repo>/`
- 企业内网静态服务器
- 任意 nginx / Apache 目录

`npm run build` 后把 `dist/` 整个目录上传即可。

**线上地址**：<https://shouxie.newzone.top>（EdgeOne Pages 拉取 `gh-pages` 分支发布，
缓存与安全头由 `public/edgeone.json` 配置，`sw.js` 与 manifest 使用 `no-cache` 以检查更新）。
推送到 `main` 由 `.github/workflows/deploy.yml` 自动构建并发布 `gh-pages`。

EdgeOne Pages 通过构建产物中的 `404.html` 为缺失路径返回 404，避免把首页 HTML 回退到 JS/CSS URL。`/` 与 `/index.html` 使用 `no-store`。部署时保留 `gh-pages` 上已有的 `assets/` 哈希文件，供仍打开的旧页面加载语言包和导出模块。手动清理旧资源前，应先确认已无需要维持兼容的旧页面。

构建会通过 `vite.config.ts` 中的 `offlineShell` 插件，把 `public/sw.js` 源码、入口 HTML、静态 import 依赖的 JS/CSS 清单与全部产物文件名集合一起计算版本哈希，再注入 `dist/sw.js`。首次访问完成后外壳完全离线可用，语言包、字体与导出模块按需缓存。新版 Service Worker 等旧页面关闭后激活；若出现回滚，能保证同一构建的 HTML、静态资源与 Service Worker 一起恢复。

运行 `npm run build` 后，可用已安装 Playwright 和 Chromium 的 Python 环境运行 `python scripts/test-browser-persistence.py`。使用系统 Chrome 时加 `--chrome <Chrome 可执行文件路径>`。测试脚本（27 个用例）覆盖多标签页保存与冲突检测、存储被禁/配额降级、整篇导入/预设/示例替换、TXT 缩进与 GB18030 兜底、移动端编辑/预览切换与 PNG 下载、纸纹与暗角、命名滑块、语言切换竞态、导出快照与打印预览、阿拉伯语排版、PWA 离线/更新/缓存隔离及长文性能冒烟。用 `--case <测试名称片段>` 可单独运行指定用例。

## 分包策略

首屏只加载主 chunk（约 501 kB / gzip 160 kB）与 16.9 kB（gzip 4.2 kB）的 CSS，
外加 1.3 kB 的运行时预加载（入口 HTML 只为 `rolldown-runtime` 生成一条
`modulepreload`，其余模块仍按需加载）。所有重依赖均在用户触发特定操作时按需
动态加载，不增加首屏初始加载耗时：

| 懒加载 chunk | 触发时机 | 体积 (gzip) | 依赖说明 |
| --- | --- | --- | --- |
| `pdfExporter` | 导出 PDF | 130 kB | 封装 `jspdf` 多页 PDF 生成管线与 Canvas 离屏栅格化 |
| `jszip` | 导出 ZIP | 28 kB | 全部页面高分辨率图片批量打包下载 |
| `mammoth`（产物名 `lib`） | 导入 `.docx` | 76 kB | 浏览器端纯本地解析 Word 文档正文与段落，内含其解压依赖 |
| 多语言包 chunk | 切换对应语言 | 11 ~ 14 kB / 语种 | 16 种非内置语言按需拉取（zh-CN 与 en 已内联主包） |

jsPDF 内部可能引用的 `html2canvas`（46 kB）、`canvg`（产物名 `index.es`，48 kB）、`dompurify`（产物名 `purify.es`，11 kB）均为可选模块。本应用纯基于 Canvas 2D API 绘制并输出位图给 jsPDF，不调用其 HTML / SVG 光栅化接口，因此**不会在运行时被加载**。

> 主 chunk 略高于 Vite 默认的 500 kB 警告线，属预期体积（React + 应用代码 + zh-CN/en 两份内联语言包）；该警告不影响构建结果。
> 以上体积为 `npm run build` 实测输出，会随依赖包版本升级产生微小浮动。

## 项目结构

```
src/
├── engine/                 # 核心排版与手写算法
│   ├── types.ts            # 核心数据结构接口（PaperConfig, HandwritingConfig 等）
│   ├── random.ts           # Mulberry32 伪随机数生成器 & Box-Muller 高斯分布
│   ├── typeset.ts          # 避头尾排版、自动分页、内联标记解析、笔迹扰动、双向折行
│   ├── paper.ts            # 纸张底纹绘制、四种物理笔型墨迹模拟、Canvas 渲染管道
│   ├── paperGeometry.ts    # 纸张方格/网格几何尺寸计算与边界约束
│   ├── arabicLayout.ts     # 阿拉伯语/RTL 双向文本检测、首强方向判断与段落断词
│   ├── presets.ts          # 场景预设模板 & 4 种书写人格（工整学霸 / 随性笔记 / 匆忙赶工 / 规范作业）
│   ├── typoEngine.ts       # 随机错字 / 笔误生成引擎
│   ├── doodle.ts           # 预览上的手绘标注层（贝塞尔运笔、按半径擦除）
│   ├── fontLoader.ts       # 字体清单、去重、自定义字体加载
│   ├── fontScanner.ts      # 本机字体扫描 (Local Font Access API + Canvas 探测)
│   ├── docParser.ts        # .docx / .txt / .md 解析 (含 UTF-8 严格校验与 GB18030 兜底)
│   ├── exporter.ts         # 单页 PNG / JPG 导出、ZIP 打包、iframe 高精度打印
│   ├── pdfExporter.ts      # 多页 PDF 异步导出独立 chunk（按需动态 import）
│   ├── storage.ts          # localStorage 持久化、旧键迁移、配额保护与会话字体过滤
│   └── __tests__/          # 单元测试集（engine 39 套件 / 179 tests；全仓 40 / 183）
├── components/
│   ├── Header.tsx          # 顶栏：品牌与统计、语言/预设/GitHub（窄屏收进「更多」菜单）、画质与导出下拉
│   ├── EditorPanel.tsx     # 左侧面板外壳：Tab 切换、文档导入与覆盖确认、字体扫描/上传、底图压缩
│   ├── editor/             # 四个设置 Tab（从 EditorPanel 拆出）
│   │   ├── TextTab.tsx         # 正文、示例、标记语法、文档导入、一键清空
│   │   ├── HandwritingTab.tsx  # 笔迹：人格 / 字体 / 笔 / 排版 + 高级折叠（扰动 / 物理 / 涂改 / 标注 / 粗糙度）
│   │   ├── PaperTab.tsx        # 纸张：类型、尺寸、纹理、页边距、方格列数联动
│   │   ├── PhotoTab.tsx        # 实拍质感（环境光、泛黄、折痕、暗角）与自定义背景
│   │   └── sections/           # 9 个设置分组；前 4 组常显，后 5 组收进「高级笔迹设置」折叠区
│   ├── PreviewPanel.tsx    # 右侧实时 Canvas 预览：缩放 / 整页、画笔与橡皮、边距参考线、分页缩略图
│   ├── PresetModal.tsx     # 预设模板选择弹窗
│   └── ErrorBoundary.tsx   # 渲染崩溃兜底（保留已存文稿与设置）
├── i18n/
│   ├── index.ts            # i18next 初始化、语言切换、<head> 元信息与 HTML dir/lang 同步
│   ├── languages.ts        # 语言清单、RTL 标记、FULLY_TRANSLATED 集合
│   ├── loaders.ts          # 语言包按需加载（zh-CN / en 内联，其余独立 chunk）
│   └── locales/            # 18 种语言包 JSON（中/繁/英/日/韩/德/西/法/意/葡/俄/阿/印地/孟/印尼/泰/越/土）
├── useDraftPersistence.ts  # Web Locks API 跨标签页并发持久化、冲突检测与 beforeunload 兜底
├── usePaperBackground.ts   # 自定义背景底图异步预加载、CORS 保护与竞态防御
├── App.tsx                 # 应用主控制器、导出/打印流水线调度与窄屏编辑/预览切换
├── main.tsx                # 入口（先 await i18n 初始化再挂载 React）
└── index.css               # 设计令牌、样式、@font-face、响应式与打印样式
```

仓库根目录另有：

| 目录 | 用途 |
| --- | --- |
| `public/` | 免构建静态资源：4 个 OFL 手写字体、PWA 图标、`sw.js`、`manifest.webmanifest`、`edgeone.json`、社交卡 |
| `scripts/` | 辅助脚本：`test-browser-persistence.py`（端到端持久化与离线测试）、`render-icons.mjs`（PWA 图标生成）、`render-social-card.mjs`（og:image）、`capture-hero.mjs`（README 视觉首屏抓取） |
| `docs/` | 开发文档与社交预览卡资源 |
| `.github/workflows/` | `ci.yml`（PR 测试与 Lint 门禁）、`deploy.yml`（推 main 自动构建发布 gh-pages） |

## 草稿持久化与跨标签页同步

为确保用户输入的文字与精心微调的排版参数绝对不丢，应用采用分级容灾持久化架构：

1. **多标签页并发安全 (Web Locks API)**：
   - 多个标签页同时打开编辑器时，保存逻辑在 `navigator.locks.request('text2handwriting-draft')` 互斥临界区执行。
   - 写入前校验前置正文版本（`expectedText`）。若另一个标签页已写入了更新的正文，当前标签页将保留输入并提示 `draftConflict`，绝不无感冲掉另一标签页的成果。
2. **250ms 防抖与差异增量落盘**：
   - 击键过程进行 250ms 防抖，且仅针对发生变更的子配置键（如 `text`、`paper`、`handwriting`）独立序列化，降低主线程 I/O 开销。
3. **安全离场保证**：
   - `visibilitychange`（切后台或最小化）：立即触发一次落盘；支持 Web Locks 时写入在异步互斥临界区内完成，不支持时才同步写入。
   - `beforeunload`（关闭标签页）：等不到异步锁完成，只能尽力 flush 一次，随后拦截关闭事件并弹出原生防误关确认框。
4. **存储配额保护与脏数据防御**：
   - 自定义背景图超过阈值（2,000,000 字符，约 2MB base64）时不写入 `localStorage`，避免撑满 5MB 浏览器配额导致核心正文无法存储；配额不足时自动降级剥离底图仅保留排版参数。
   - 动态文件导入的字体（带有 `CustomFont_` 前缀）仅驻留内存，持久化时严格过滤，避免刷新后留存无效字体引用。
   - 历史旧键迁移：从早期版本代号 `autohand_*` 键无损平滑迁移至 `text2handwriting_*` 键。

## 响应式与移动端

- 宽屏为左右分栏；`max-width: 900px` 起进入单栏模式。`App.tsx` 用 `mobilePreview` 状态写入 `.app-main[data-mobile-view]`，只显示编辑器或预览其中一栏，避免移动端同时挂两份 Canvas。
- 预览区用 `ResizeObserver` 监听容器尺寸并自动整页缩放；切换分栏、缩略图条出现等不触发 `resize` 的变化也能重新适配。
- 700 / 560 / 360px 三个断点逐级压缩顶栏、工具栏与字号；`@media print` 隐藏编辑区与工具栏，只输出纸面。

## 阿拉伯语与双向排版 (BiDi & Arabic Support)

手写文稿通常面临复杂文字连笔排版的挑战。针对阿拉伯语等 RTL（从右至左）文字系统：

1. **自动强方向与文字检测**：
   - 利用 Unicode 属性转义 `\p{Script_Extensions=Arabic}` 自动检测正文中是否存在阿拉伯字符。
   - 分析段落首个强方向性字符（First Strong Directional Character），准确判定段落基础方向（`rtl` 或 `ltr`）。
2. **标点与括号保护折行 (`wrapArabicParagraph`)**：
   - 保持成对标点和括号短语完整，避免双向算法将成对括号镜像断开。
3. **连笔文字整形 (Cursive Joining) 与标记解耦**：
   - 阿拉伯字母具有复杂的上下文连笔形态。若拆分成单字绘制，连笔会彻底断裂。
   - 排版引擎将整行文本交由 Canvas 原生双向整形（Native Shaping）一次性连笔绘制；
   - 涂改（strikethrough）、纠正字、波浪下划线等标记层通过隐藏 DOM Range 获取物理视觉矩形（`getClientRects`）实现精确定位覆盖，兼顾纯正连笔美感与手写涂改拟真度。

## 离线与 PWA 支持 (Offline & Service Worker)

应用支持纯离线运行与 PWA 安装：

1. **自动化外壳打包 (`offlineShell`)**：
   - Vite 构建阶段自动收集入口 HTML 及其静态 import 依赖的 JS/CSS chunk，计算「入口 HTML + 静态依赖清单 + 全部产物文件名」的哈希版本号（chunk 内容变化会改变文件名，因此可代表整包版本），将外壳清单注入 `dist/sw.js`。
2. **精细缓存策略**：
   - 静态外壳（Shell）：`cache-first`。预载时验证 HTTP 状态及 JS/CSS 的媒体类型，任一资源校验或写入失败就删除不完整的新版缓存。
   - 构建哈希产物（`assets/*`）：`cache-first`，跳过媒体类型错误的 JS/CSS 响应。
   - 本地字体（`fonts/*`）：`stale-while-revalidate`，首次使用后沉淀缓存。
   - 品牌与静态资产（`favicon`、PWA 图标、`apple-touch-icon`、`social-card`、`manifest`）：`network-first`，确保版本更新时品牌图标与描述即时同步。
   - Google Fonts（`fonts.gstatic.com` / `fonts.googleapis.com`）：`stale-while-revalidate`，先用缓存字体再后台更新。
   - 新旧版本隔离：Service Worker 激活时自动清理前序版本的外壳与运行时缓存，避免旧版残留。

## 多语言界面

顶栏语言切换器（窄屏自动收进「更多」菜单），选择存 localStorage，刷新保持；阿拉伯语自动应用 RTL 界面镜像。

- **18 门语言全量完整翻译**：简体中文 (zh-CN)、繁體中文 (zh-TW)、English (en)、日本語 (ja)、한국어 (ko)、Deutsch (de)、Español (es)、Français (fr)、Italiano (it)、Português (pt)、Русский (ru)、العربية (ar)、हिन्दी (hi)、বাংলা (bn)、Bahasa Indonesia (id)、ไทย (th)、Tiếng Việt (vi)、Türkçe (tr)。全部 18 种语言均已纳入 `FULLY_TRANSLATED` 集合，词条键集与插值占位符经 Vitest 单元测试 100% 对齐验证。
- 语言包按需加载：只有 zh-CN 与 en（兜底语言）打进主包，其余各是独立小 chunk（约 11 ~ 14 kB gzip），切换时才异步下载。

**新增/维护一种语言**：

1. 复制 `src/i18n/locales/zh-CN.json`，翻译全部键值（保留 `{{var}}` 占位符）
2. 在 `src/i18n/languages.ts` 把语言代码加进 `FULLY_TRANSLATED`
3. `npm run test` 会用 i18n 键齐全度 / 占位符一致性测试把关

翻译范围含界面 UI（按钮、滑块、菜单、提示、错误信息、文件名）以及预设/人格名称、
徽标、纸张预设和示例正文——切语言后「重置示例 / 套用预设 / 首访默认文稿」都会跟随语言。
标记语法用的 token 名（`~~`、`[del:]`、`[u]` 等）保持不变，只翻译其中的示例词。
系统已安装字体名（如「华文行楷」）是真实字体标识，不翻译。

预设与示例以 `presets.ts` 内置中文为源兜底，界面通过 i18n key 覆盖；
新增预设时需在完整语言包的 `presetData` / `samples` 等节同步补翻译。
