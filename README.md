# 速查工具

速查工具是一个 Electron + React 本地文件导航应用。本仓库同时保存应用源码、产品设计与验证产物，以及应用实际使用的 Markdown/HTML 教程内容。

## 仓库内容

- `src/`：Electron 主进程、预加载脚本和 React 界面。
- `tests/`：单元测试、可访问性检查和测试辅助代码。
- `A 教程集合/`：应用实际使用的 Markdown、HTML、图片和教程源码，属于核心内容并由 Git 跟踪。
- `app-data.json`：卡片、分类和相对文件路径数据；相对路径以该文件所在目录为基准。

## 教程与资料目录

<!-- tutorial-catalog:start -->
> 本节由 `app-data.json` 自动生成。请勿直接编辑标记之间的列表；更新卡片后运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-readme-tutorial-catalog.ps1`。

当前共 **54 张卡片**、**9 个分类**；其中 **50 项**随仓库同步，**4 项**属于本机或相邻工作区。一个卡片可以属于多个分类，因此会在不同分类中重复出现。

### AI开发教程（24）

- [完整产品开发流程教程](<A 教程集合/完整产品开发流程可视化教程/完整产品开发流程教程.html>) · HTML
- [六套框架选型与实战SOP](<A 教程集合/AI工程化全流程框架调研/index.html>) · HTML
- [Matt Pocock Skills 工程实战教程](<A 教程集合/Matt Pocock Skill双场景工程实战教程/Matt-Pocock-Skills-Codex双场景工程实战教程.html>) · HTML
- [Bmad 产物地图](<A 教程集合/BMAD-产物地图-流程教程.html>) · HTML
- [BMAD Bug 修复与功能 Fix 教程](<A 教程集合/BMAD Bug与功能Fix教程/index.html>) · HTML
- [BMAD Quick Dev 增量开发教程](<A 教程集合/BMAD Quick Dev已有V1增量开发教程/index.html>) · HTML
- [BMAD 新产品 0→1 完整教程](<A 教程集合/BMAD新产品0-1完整流程教程/index.html>) · HTML
- [BMAD 已上线 V1 增量开发教程](<A 教程集合/BMAD已上线V1增量开发教程/index.html>) · HTML
- [OpenSpec 使用场景与实战教程](<A 教程集合/OpenSpec使用场景与实战教程/OpenSpec使用场景与实战教程.html>) · HTML
- [Spec Kit Flow-Forward｜增量开发实战](<A 教程集合/Spec-kit Flow Forward使用场景与实战教程/Spec-Kit-Flow-Forward-使用场景与实战教程.html>) · HTML
- [Spec Kit 使用场景与实战教程](<A 教程集合/Spec-Kit使用场景与实战教程/Spec-Kit使用场景与实战教程.html>) · HTML
- [Matt Pocock Skills 实战教程](<A 教程集合/Matt Pocock Skills实战教程/Matt-Pocock-Skills实战教程.html>) · HTML
- [Bug 修复：三种 AI 开发方式怎么选](<A 教程集合/MVP-Bug与功能修复三种方式对比/MVP-Bug与功能修复方式全面对比.html>) · HTML
- [增量迭代：五种开发方式怎么选](<A 教程集合/MVP-V1.0增量迭代方式对比教程/index.html>) · HTML
- [OpenSpec 增量开发实战](<A 教程集合/OpenSpec已上线MVP-V1增量开发实战教程/OpenSpec已上线MVP-V1增量开发实战教程.html>) · HTML
- [Superpowers 增量开发实战](<A 教程集合/Superpowers上线MVP增量开发教程/superpowers-mvp-incremental-development.html>) · HTML
- [两种 BMAD 产品设计交付](<A 教程集合/两种BMAD产品设计交付.html>) · HTML
- [四种组合开发流程对比](<A 教程集合/四种组合开发流程对比.html>) · HTML
- [Langflow 教程](<A 教程集合/langflow-complete-tutorial.html>) · HTML
- [n8n 自动化工程手册](<A 教程集合/n8n-complete-guide.html>) · HTML
- [Ollama 教程](<A 教程集合/ollama-guide.html>) · HTML
- [Agent Skill 实战教程](<A 教程集合/Agent Skill实战教程/Agent Skill实战教程.html>) · HTML
- [Ponytail × Codex 桌面端｜简明实战教程](<A 教程集合/Ponytail实战教程.html>) · HTML
- [Matt+UX+SP完整开发流程](<A 教程集合/Matt-UIUX-Pro-Max-Superpowers工作流教程.html>) · HTML

### 技能速查（9）

- [Matt Pocock Skills 技能速查](<A 教程集合/Matt Pocock Skills 技能速查/mattpocock-skills-cheatsheet.html>) · HTML
- [BMAD技能速查](<A 教程集合/BMAD-METHOD技能速查/BMAD-METHOD-v6.10.0-全技能速查.html>) · HTML
- [gstack 技能速查](<A 教程集合/gstack技能速查/gstack-skills-cheatsheet.html>) · HTML
- [Superpowers 技能速查](<A 教程集合/obra-superpowers技能速查/obra-superpowers-v6.1.1-14技能速查.html>) · HTML
- [OpenSpec 技能速查](<A 教程集合/OpenSpec技能速查/OpenSpec-OPSX-技能速查.html>) · HTML
- [pm-skills 技能速查](<A 教程集合/PM Skills技能速查/phuryn-pm-skills-v2.1.0-中文速查.html>) · HTML
- [Spec Kit  技能速查](<A 教程集合/Spec-Kit技能速查/Spec-Kit-v0.8.15-技能速查.html>) · HTML
- [OpenMontage｜技能速查 + 工作流程图](<A 教程集合/openmontage-skill-quicklook.html>) · HTML
- [Agent Skills 技能速查](<A 教程集合/Agent Skills技能速查/Agent Skills 技能速查.html>) · HTML

### 新产品开发（5）

- [完整产品开发流程教程](<A 教程集合/完整产品开发流程可视化教程/完整产品开发流程教程.html>) · HTML
- [六套框架选型与实战SOP](<A 教程集合/AI工程化全流程框架调研/index.html>) · HTML
- [BMAD 新产品 0→1 完整教程](<A 教程集合/BMAD新产品0-1完整流程教程/index.html>) · HTML
- [两种 BMAD 产品设计交付](<A 教程集合/两种BMAD产品设计交付.html>) · HTML
- [Matt+UX+SP完整开发流程](<A 教程集合/Matt-UIUX-Pro-Max-Superpowers工作流教程.html>) · HTML

### UX设计（4）

- [三款 UI 设计对比与选型教程](<A 教程集合/三款UI设计技能对比与选型教程.html>) · HTML
- [Taste Skill  教程](<A 教程集合/Taste Skill 项目教程.html>) · HTML
- [UI UX Pro Max 教程](<A 教程集合/UI UX Pro Max 项目教程.html>) · HTML
- [BMAD 新产品 0→1 完整教程](<A 教程集合/BMAD新产品0-1完整流程教程/index.html>) · HTML

### 增量开发（6）

- [增量迭代：五种开发方式怎么选](<A 教程集合/MVP-V1.0增量迭代方式对比教程/index.html>) · HTML
- [BMAD Quick Dev 增量开发教程](<A 教程集合/BMAD Quick Dev已有V1增量开发教程/index.html>) · HTML
- [BMAD 已上线 V1 增量开发教程](<A 教程集合/BMAD已上线V1增量开发教程/index.html>) · HTML
- [Spec Kit Flow-Forward｜增量开发实战](<A 教程集合/Spec-kit Flow Forward使用场景与实战教程/Spec-Kit-Flow-Forward-使用场景与实战教程.html>) · HTML
- [OpenSpec 增量开发实战](<A 教程集合/OpenSpec已上线MVP-V1增量开发实战教程/OpenSpec已上线MVP-V1增量开发实战教程.html>) · HTML
- [Superpowers 增量开发实战](<A 教程集合/Superpowers上线MVP增量开发教程/superpowers-mvp-incremental-development.html>) · HTML

### bug修复（2）

- [Bug 修复：三种 AI 开发方式怎么选](<A 教程集合/MVP-Bug与功能修复三种方式对比/MVP-Bug与功能修复方式全面对比.html>) · HTML
- [BMAD Bug 修复与功能 Fix 教程](<A 教程集合/BMAD Bug与功能Fix教程/index.html>) · HTML

### 工作文档（9）

- [工作记录](<A 教程集合/工作记录.md>) · MD
- [AGENTS-卡帕西-开发用](<A 教程集合/AGENTS-卡帕西版本-开发用.md>) · MD
- [AGENTS-日常工作](<A 教程集合/AGENTS-日常工作用.md>) · MD
- 内网资源总览 · MD · **本机/外部工作区资料，未随本仓库同步**
- [原型提示词](<A 教程集合/原型提示词.txt>) · TXT
- CI-CD标准化流程文档 · MD · **本机/外部工作区资料，未随本仓库同步**
- 16个场景内容 · MD · **本机/外部工作区资料，未随本仓库同步**
- 四个阶段规划 · MD · **本机/外部工作区资料，未随本仓库同步**
- [常用提示词](<A 教程集合/常用提示词.md>) · MD

### 去AI味（3）

- [说人话技能教程](<A 教程集合/说人话技能 Codex 桌面端实战教程.html>) · HTML
- [dbskill内容与逐字稿](<A 教程集合/dbskill-Codex桌面端实战教程.html>) · HTML
- [Humanizer-zh 去AI味](<A 教程集合/Humanizer-zh技能实战教程.html>) · HTML

### 其它（6）

- [Github开源项目榜](<A 教程集合/github-top-repos-100k-stars.html>) · HTML
- [GitHub 项目管理实战教程](<A 教程集合/github-tutorial.html>) · HTML
- [LangChain 离线实战教程](<A 教程集合/LangChain实战教程.html>) · HTML
- [Langflow 实战教程](<A 教程集合/Langflow实战教程.html>) · HTML
- [LangGraph 实战教程](<A 教程集合/LangGraph实战教程.html>) · HTML
- [Monorepo 工作流实战教程](<A 教程集合/Monorepo工作流实战教程.html>) · HTML
<!-- tutorial-catalog:end -->

## 运行环境

本项目面向 Windows 10/11 和 macOS。首次在一台电脑上使用时，需要：

- [Git](https://git-scm.com/downloads)，用于克隆和同步仓库；
- [Node.js](https://nodejs.org/)，推荐 Node.js 24；
- 首次安装依赖和以后依赖更新时可访问 npm 软件源。

支持的 Node.js 版本为：

```text
20.19+
22.12+
24+
```

当前已验证的 Windows 环境为 Node.js 24.15.0、npm 11.12.1。macOS 启动流程仍需在真实 Mac 上完成最终验收。安装后可在 PowerShell 或 macOS 终端中确认：

```shell
git --version
node --version
npm --version
```

## 首次安装与启动

克隆仓库后，Windows 可以双击 `启动速查.bat`，macOS 可以双击 `启动速查.command`。两个启动文件都会依次：

1. 检查 `package.json` 和 `package-lock.json`；
2. 检查 Node.js、npm 和 Node.js 版本；
3. 比较当前依赖与 `package-lock.json` 的 SHA-256；
4. 首次运行或依赖变化时自动执行 `npm ci`；
5. 安装成功后执行 `npm run dev` 启动应用。

第一次启动需要下载 Electron 和其他依赖，耗时取决于网络速度。以后依赖没有变化时会直接启动。

命令行等价操作：

```shell
npm ci
npm run dev
```

### Windows 启动参数

```powershell
.\启动速查.bat --setup-only
.\启动速查.bat --check
```

### macOS 启动参数

只安装或更新依赖、不启动应用：

```shell
./启动速查.command --setup-only
```

只检查环境和依赖状态、不安装也不启动：

```shell
./启动速查.command --check
```

仓库会记录 `.command` 的可执行权限。若 macOS 仍提示 `Permission denied`，在项目根目录执行一次：

```shell
chmod +x ./启动速查.command
```

提交前运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-repository-hygiene.ps1
npm run lint
npm test
npm run build
git diff --check
```

仓库体检会阻止以下问题被忽略：

- 项目根目录以外出现嵌套 `.git` 仓库；
- `A 教程集合/` 中重新出现 Edge QA 浏览器配置目录；
- 待跟踪文件中出现 50 MiB 及以上的大文件。

## 故障排查

### 提示找不到 Node.js 或 npm

安装 Node.js 24 后关闭并重新打开 PowerShell 或 macOS 终端，再运行：

```shell
node --version
npm --version
```

如果仍然找不到命令，重新安装 Node.js，并确保安装程序将 Node.js 加入 PATH。

### 提示 Node.js 版本不符合要求

卸载过旧版本并安装 Node.js 24。支持范围是 20.19+、22.12+ 或 24+，不建议使用不在范围内的奇数版本。

### `npm ci` 下载失败

先关闭正在运行的速查工具以及其他可能占用本项目 Electron 文件的进程。如果错误包含 `EBUSY`、`resource busy` 或 `locked`，说明旧进程仍在占用 `node_modules` 中的文件。

确认进程已关闭且网络可以访问 npm 软件源，然后在项目根目录重试：

```shell
npm ci
```

安装成功后重新双击对应系统的启动文件。

不要把其他电脑的 `node_modules/` 复制进来，也不要把它加入 Git。

### 启动窗口显示失败

保留窗口中的完整错误信息，并依次运行：

```shell
npm run lint
npm test
npm run build
```

如果三项检查通过但界面仍无法启动，记录 Node.js 版本、错误信息和复现步骤后再排查。

### 只想运行应用，不想安装开发环境

源码仓库的 BAT 和 `.command` 都依赖 Node.js。完全不安装 Node.js 的电脑应使用后续发布到 GitHub Release 的 Windows 便携版或 macOS 应用包，而不是直接运行源码仓库。
