# AGENTS.md — 在本仓库工作的 agent 须知

本项目是 [365 开源计划](https://github.com/rockbenben/365opensource) 第 **#039** 号项目：**手写文稿生成器 (Text2Handwriting)**。
基于 React 19 + TypeScript + Vite + Canvas 2D，纯前端将普通文本排版为高拟真手写文稿，支持中文避头尾排版、字迹随机扰动、拟真涂改纠错、多种纸张与实拍质感，并支持 PNG / JPG / PDF / ZIP 批量导出与高精度打印。

**动手前先读本文档与 `docs/development.md`**。本文档汇集在本仓库开发时最容易踩坑、踩了必须返工的硬规则。

---

## 1. 核心命令 (Commands)

```bash
npm install                     # 安装依赖（使用 package-lock.json）
npm run dev                     # 启动本地开发服务器（http://localhost:5173/）
npm test                        # 运行 Vitest 单元测试集（40 个测试套件，183 个测试）
npm run lint                    # 运行 oxlint 静态代码检查（0 errors & 0 warnings）
npm run build                   # 生产环境构建（tsc -b && vite build）
npm run preview                 # 预览构建产物
python scripts/test-browser-persistence.py  # 浏览器 E2E 持久化与离线多标签测试（需 Playwright）
```

> **门禁原则**：提交任何代码或文档改动前，必须确保 `npm run lint && npm test && npm run build` 全部绿灯通过。

---

## 2. 架构设计与目录分工 (Architecture)

```
src/
├── engine/                     # 核心排版与渲染引擎（纯逻辑，无 React UI 依赖）
│   ├── types.ts                # 核心接口（PaperConfig, HandwritingConfig, RenderChar, PageLayout 等）
│   ├── random.ts               # Mulberry32 种子伪随机数与 Box-Muller 高斯分布
│   ├── typeset.ts              # 核心排版：中文避头尾、行尾标点挤压、自动分页、落款右对齐、内联标记解析
│   ├── paper.ts                # 纸张底纹、4种物理笔型墨迹、环境光/折痕/暗角质感、Canvas 渲染流水线
│   ├── paperGeometry.ts        # 纸张方格/网格几何尺寸计算与边界约束
│   ├── arabicLayout.ts         # 阿拉伯语/RTL 双向文本检测、首强方向判断、括号保护折行
│   ├── presets.ts              # 预设模板与 4 种书写人格（工整学霸 / 随性笔记 / 匆忙赶工 / 规范作业）
│   ├── typoEngine.ts           # 拟真随机错字、同音/形近字替换与划改纠正
│   ├── doodle.ts               # 纸面手绘图层（贝塞尔平滑运笔、几何橡皮擦）
│   ├── fontLoader.ts           # 字体元数据清单、去重、自定义字体装载
│   ├── fontScanner.ts          # 本机字体枚举（Local Font Access API + Canvas 探测兜底）
│   ├── docParser.ts            # .docx / .txt / .md 纯前端解析（UTF-8 严格校验 + GB18030 兜底）
│   ├── exporter.ts             # 单页 PNG/JPG 导出、ZIP 批量打包、隐藏 iframe 真实毫米打印
│   ├── pdfExporter.ts          # 多页 PDF 导出独立 chunk（动态 import，封装 jsPDF）
│   ├── storage.ts              # localStorage 读写、旧键迁移、配额保护、脏数据防御
│   └── __tests__/              # Vitest 单元测试集
├── components/                 # React UI 组件
│   ├── Header.tsx              # 顶栏：品牌与统计、语言/预设/GitHub（窄屏收进「更多」菜单）、画质与导出下拉
│   ├── EditorPanel.tsx         # 左侧面板外壳：Tab 切换、文件导入与覆盖确认、字体扫描/上传、底图压缩
│   ├── editor/                 # 四大配置选项卡（TextTab, HandwritingTab, PaperTab, PhotoTab）与 sections/ 九组设置
│   ├── PreviewPanel.tsx        # 右侧实时预览：超采样 Canvas、缩放 / 整页、画笔与橡皮、边距参考线、分页缩略图
│   ├── PresetModal.tsx         # 预设模板选择弹窗
│   └── ErrorBoundary.tsx       # 全局错误边界（拦截渲染异常，守护未落盘文稿）
├── i18n/                       # 18 语种国际化体系（zh-CN/en 内联，其余 16 种异步 chunk）
├── useDraftPersistence.ts      # Web Locks 跨标签页并发持久化、冲突检测与 beforeunload 兜底
├── usePaperBackground.ts       # 自定义底图异步预加载、CORS 保护与竞态防御
├── App.tsx                     # 根组件：全局状态流转、导出任务调度、窄屏编辑 / 预览切换
└── main.tsx                    # 入口：优先初始化 i18n 再挂载 React
```

---

## 3. 铁律与安全红线 (Invariants & Hard Rules)

1. **100% 纯本地隐私 (Zero Server Upload)**：
   - 本工具承诺**全程浏览器本地运行，不上传任何服务器**。
   - 严禁引入任何向外部服务器上传用户正文、上传图片或生成结果的远程 API。
2. **严禁在首屏 bundle 静态引入重依赖 (Code Splitting)**：
   - `jspdf` (~130 kB gzip)、`jszip` (~28 kB gzip)、`mammoth` (~76 kB gzip) 必须保持**动态按需加载** (`await import(...)`)。
   - 严禁在 `src/App.tsx`、`src/engine/exporter.ts` 或顶层组件中静态 `import` 这些依赖。
3. **字体持久化安全 (Session-Only Fonts Protection)**：
   - 本地文件导入的字体（带有 `CustomFont_` 前缀）其二进制数据仅驻留在内存中。
   - `saveStoredCustomFonts` 和 `saveStoredSettings` 严禁将此类临时字体持久化到 `localStorage`，否则页面重开后下拉框会残留失效字体导致显示错乱。
4. **存储配额与并发防冲 (Storage & Concurrency Safety)**：
   - 自定义底图 base64 字符数超过阈值（`CUSTOM_BG_PERSIST_MAX_CHARS` = 2,000,000）时不持久化至 `localStorage`，优先保全正文。
   - 跨标签页保存必须使用 `navigator.locks.request('text2handwriting-draft')` 互斥锁。写入前必须核对 `expectedText`，检测到多标签冲突时上报 `draftConflict`，严禁无感覆盖另一标签页的新内容。
   - 保持向后兼容：读取配置必须经过 `migrateLegacyStorage`，平滑兼容 `autohand_*` 历史键。
5. **Canvas 2D 渲染与跨域污染保护 (Canvas Taint Defense)**：
   - 加载外部底图必须配置 `image.crossOrigin = 'anonymous'`，防止 `canvas.toBlob` 抛出 `SecurityError` 导致导出静默失效。
   - 导出与排版前必须等待 `document.fonts.ready`，确保字体字形度量（Metrics）准确。
   - 多页 PDF 导出必须在每页渲染后调用 `yieldForProgressPaint()` 让出主线程，保障浏览器能够重绘进度条，防止页面无响应冻结。
6. **代码风格与注释规范**：
   - 严格遵循 TypeScript strict 规范。
   - 注释重点解释**“为什么这样做（Why & Trade-offs）”**，记录边界情况、浏览器兼容考量与公式推导，避免复述显而易见的“做了什么”。
   - 保持零 oxlint 警告，严禁滥用 `any` 或写空的 `catch {}` 吞掉关键异常。
7. **Git 提交纪律 (Conventional Commits)**：
   - 提交信息必须遵循 Conventional Commits 规范，**message 与 body 均使用英文**（如 `feat(typeset): ...`, `fix(storage): ...`）。
   - **绝对禁止添加任何 AI 生成签名**（如 `Co-Authored-By: ...`, `Generated with ...`, Claude / ChatGPT / Gemini session 尾注等）。
8. **文档与文案同步 (Docs & Copy Sync)**：
   - README / README.en.md 的功能、数量、限制变化必须同步 `docs/i18n/README.*.md` 的 16 个翻译版；界面新增文案必须补齐 18 个 locale（`npm test` 的 i18n 键集测试会拦截缺键）。
   - 架构、构建产物体积、脚本用法的变化必须同步 `docs/development.md`；体积数字以 `npm run build` 实测为准，不要沿用旧值。

---

## 4. 常见隐蔽陷阱 (Silent Pitfalls)

- **字宽估算与换行**：中文是严格全角等宽（`fontSize`），标点有压缩与避头尾法则；英文单词通过回溯空格防止中途断词；阿拉伯文是整行连笔，必须走 `arabicLayout.ts` 的双向折行与整行整形绘制，切勿拆单字渲染。
- **方格纸几何尺寸计算**：方格（作文格）单元格必须是严格正方形（`cellHeight === cellWidth`），且受内容有效区与页边距严格限制，计算必须通过 `getGridCells`。
- **自定义拍纸导出尺寸**：手机拍纸上传后比例各异。导出 PDF 时若直接按宽 210mm 等比缩放，竖拍 3:2 / 16:9（高:宽）的超高纸张会超出 A4 页面底部被裁切。`getPdfPageFormat` 中对超高比例采用“整页等比缩入 A4 边框”的换算逻辑。
- **DOM Range 双向标注定位**：在阿拉伯语整行连笔文本中绘制涂改或下划线时，必须使用隐藏 DOM 的 `document.createRange().getClientRects()` 获取真实的视觉分段坐标，不能依赖逻辑字符串索引直接计算像素位移。
- **主题与首屏元信息同步**：`:root` 是浅色纸感主题（`color-scheme: light`）。改主题色时必须同步 `index.html` 的 `theme-color` / `color-scheme` / iOS `apple-mobile-web-app-status-bar-style` 与 `public/manifest.webmanifest` 的 `theme_color` / `background_color`；只改 CSS 会让系统控件、状态栏或安装图标仍是深色。
- **窄屏单栏使用同一套 DOM**：≤900px 时通过 `.app-main[data-mobile-view=...]` 只显示编辑或预览其中一栏，不要复制两套 EditorPanel / PreviewPanel —— 重复挂载会带来双份 Canvas 渲染与草稿状态。
- **内置字体的 offline 标记**：只有 `public/fonts/` 里真的随包提供 `.ttf` 的字体才能标 `offline: true`；另外 4 款是 Google Fonts 在线加载，离线会回退系统字体，README 与字体下拉分组都依赖这个标记。
