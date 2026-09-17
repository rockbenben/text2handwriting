# 开发文档

## 部署

`vite.config.ts` 里 `base` 设为 `'./'`，资源全部走相对路径，所以构建产物可以直接放到任意子路径：

- GitHub Pages：`https://<user>.github.io/<repo>/`
- 企业内网静态服务器
- 任意 nginx / Apache 目录

`npm run build` 后把 `dist/` 整个目录上传即可。

**线上地址**：<https://shouxie.newzone.top>（EdgeOne Pages 拉取 `gh-pages` 分支发布，
缓存与安全头由 `public/edgeone.json` 配置；`sw.js` 与 manifest 已设 `no-cache` 保证 PWA 即时更新）。
推送到 `main` 由 `.github/workflows/deploy.yml` 自动构建并发布 `gh-pages`。

## 分包策略

首屏只加载主 chunk（约 483 kB / gzip 153 kB）与 10.9 kB 的 CSS
（入口 HTML 不生成 `modulepreload`，所以没有别的 chunk 被提前拉取）。三个重依赖
都在用户点击时才按需加载，不占首屏：

| 懒加载 chunk | 触发时机 | 体积 (gzip) |
| --- | --- | --- |
| `jspdf` | 导出 PDF | 130 kB |
| `jszip` | 导出 ZIP | 28 kB |
| `mammoth`（含传递依赖 bluebird） | 导入 `.docx` | 98 kB |

jsPDF 还会带出三个可选依赖 chunk：`html2canvas`（47 kB）、`canvg`（产物名
`index.es`，49 kB）、`dompurify`（产物名 `purify.es`，11 kB）。本应用不调用其
HTML / SVG 光栅化接口，因此**不会被加载**。

> 以上体积为 `npm run build` 实测输出，会随依赖版本浮动，不必严格对齐。

## 项目结构

```
src/
├── engine/                 # 核心排版与手写算法
│   ├── types.ts            # 核心数据结构接口
│   ├── random.ts           # Mulberry32 伪随机数生成器 & Box-Muller 高斯分布
│   ├── typeset.ts          # 避头尾排版、自动分页、内联标记解析、笔迹扰动
│   ├── paper.ts            # 纸张底纹绘制与 Canvas 渲染管道
│   ├── presets.ts          # 场景预设模板 & 4 种书写人格
│   ├── typoEngine.ts       # 随机错字 / 笔误生成引擎
│   ├── doodle.ts           # 预览上的手绘标注层（贝塞尔运笔、按半径擦除）
│   ├── fontLoader.ts       # 字体清单、去重、自定义字体加载
│   ├── fontScanner.ts      # 本机字体扫描 (Local Font Access API + Canvas 探测)
│   ├── docParser.ts        # .docx / .txt / .md 解析 (含 GBK 兜底)
│   ├── exporter.ts         # PNG / JPG / ZIP / PDF 导出
│   ├── storage.ts          # localStorage 持久化、旧键迁移与配额保护
│   └── __tests__/          # 单元测试集
├── components/
│   ├── Header.tsx          # 顶部导航、语言切换、画质选择、导出操作
│   ├── EditorPanel.tsx     # 左侧编辑面板外壳：Tab 切换、文件拖放、导出参数
│   ├── editor/             # 四个设置 Tab（从 EditorPanel 拆出）
│   │   ├── TextTab.tsx         # 正文、示例、标记语法、文档导入
│   │   ├── HandwritingTab.tsx  # 笔迹：人格 / 字体 / 笔 / 排版 / 扰动 / 涂改 / 标注
│   │   ├── PaperTab.tsx        # 纸张：类型、尺寸、纹理、页边距、底图
│   │   ├── PhotoTab.tsx        # 实拍质感与自定义背景
│   │   └── sections/           # 9 个设置分组，全部由 HandwritingTab 使用
│   ├── PreviewPanel.tsx    # 右侧实时 Canvas 预览、缩放、手绘、分页缩略图
│   ├── PresetModal.tsx     # 预设模板选择弹窗
│   └── ErrorBoundary.tsx   # 渲染崩溃兜底（保留已存文稿与设置）
├── i18n/
│   ├── index.ts            # i18next 初始化、语言切换、<head> 元信息同步
│   ├── languages.ts        # 语言清单、RTL 标记、FULLY_TRANSLATED 集合
│   ├── loaders.ts          # 语言包按需加载（zh-CN / en 内联，其余独立 chunk）
│   └── locales/            # 18 种语言包 JSON
├── App.tsx                 # 应用主控制器
├── main.tsx                # 入口（先 await i18n 初始化再挂载 React）
└── index.css               # 设计令牌、样式、@font-face、响应式与打印样式
```

仓库根目录另有：

| 目录 | 用途 |
| --- | --- |
| `public/` | 免构建静态资源：4 个 OFL 手写字体、PWA 图标、`sw.js`、`manifest.webmanifest`、`edgeone.json`、社交卡 |
| `scripts/` | 文档资源生成脚本，用后即弃、不进构建产物：`render-icons.mjs`（PWA 图标）、`render-social-card.mjs`（og:image）、`capture-hero.mjs`（README 首屏图，用法见脚本头部注释） |
| `docs/` | 本文件，以及 README 引用的截图 |
| `.github/workflows/` | `ci.yml`（PR 检查）、`deploy.yml`（推 main 后发布 gh-pages） |

## 多语言界面

顶栏语言切换器，选择存 localStorage，刷新保持；阿拉伯语自动 RTL。

- **已完整翻译**：简体中文、繁體中文（台灣用語）、English
- **其余 15 种**（日/韩/德/西/法/意/葡/俄/阿拉伯/印地/孟加拉/印尼/泰/越/土）当前**回落到英文**，选择器里以 `(EN)` 标记，补全后自动去掉标记
- 语言包按需加载：只有 zh-CN 与 en（回落语言）打进主包，其余各是独立小 chunk，切换时才下载

**新增/补全一种语言**：

1. 复制 `src/i18n/locales/zh-CN.json`，翻译全部键值（保留 `{{var}}` 占位符）
2. 在 `src/i18n/languages.ts` 把语言代码加进 `FULLY_TRANSLATED`
3. `npm run test` 会用 i18n 键齐全度 / 占位符一致性测试把关

翻译范围含界面 UI（按钮、滑块、菜单、提示、错误信息、文件名）以及预设/人格名称、
徽标、纸张预设和示例正文——切语言后「重置示例 / 套用预设 / 首访默认文稿」都会跟随语言。
标记语法用的 token 名（`~~`、`[del:]`、`[u]` 等）保持不变，只翻译其中的示例词。
系统已安装字体名（如「华文行楷」）是真实字体标识，不翻译。

预设与示例以 `presets.ts` 内置中文为源兜底，界面通过 i18n key 覆盖；
新增预设时需在三种完整语言包的 `presetData` / `samples` 等节同步补翻译。
