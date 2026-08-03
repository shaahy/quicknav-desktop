# 速查工具

速查工具是一个 Electron + React 本地文件导航应用。本仓库同时保存应用源码、产品设计与验证产物，以及应用实际使用的 Markdown/HTML 教程内容。

## 仓库内容

- `src/`：Electron 主进程、预加载脚本和 React 界面。
- `tests/`：单元测试、可访问性检查和测试辅助代码。
- `specs/`：产品规格、数据模型、契约和验证清单。
- `_bmad-output/`：需要长期保留的 BMAD 规划与设计产物。
- `A 教程集合/`：应用实际使用的 Markdown、HTML、图片和教程源码，属于核心内容并由 Git 跟踪。
- `app-data.json`：卡片、分类和相对文件路径数据；相对路径以该文件所在目录为基准。

`node_modules/`、构建产物、测试结果、本机 Agent 设置和 Edge QA 浏览器配置不会进入 Git。

## 教程与资料目录

<!-- tutorial-catalog:start -->
> 本节由 `app-data.json` 自动生成。请勿直接编辑标记之间的列表；更新卡片后运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-readme-tutorial-catalog.ps1`。

当前共 **42 张卡片**、**7 个分类**；其中 **38 项**随仓库同步，**4 项**属于本机或相邻工作区。一个卡片可以属于多个分类，因此会在不同分类中重复出现。

### AI开发教程（22）

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

### 新产品开发（4）

- [完整产品开发流程教程](<A 教程集合/完整产品开发流程可视化教程/完整产品开发流程教程.html>) · HTML
- [六套框架选型与实战SOP](<A 教程集合/AI工程化全流程框架调研/index.html>) · HTML
- [BMAD 新产品 0→1 完整教程](<A 教程集合/BMAD新产品0-1完整流程教程/index.html>) · HTML
- [两种 BMAD 产品设计交付](<A 教程集合/两种BMAD产品设计交付.html>) · HTML

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

### 其它（2）

- [Github开源项目榜](<A 教程集合/github-top-repos-100k-stars.html>) · HTML
- [GitHub 项目管理实战教程](<A 教程集合/github-tutorial.html>) · HTML
<!-- tutorial-catalog:end -->

## 运行环境

本项目面向 Windows 10/11。首次在一台电脑上使用时，需要：

- [Git for Windows](https://git-scm.com/download/win)，用于克隆和同步仓库；
- [Node.js](https://nodejs.org/)，推荐 Node.js 24；
- 首次安装依赖和以后依赖更新时可访问 npm 软件源。

支持的 Node.js 版本为：

```text
20.19+
22.12+
24+
```

当前已验证环境为 Node.js 24.15.0、npm 11.12.1。安装后可在 PowerShell 中确认：

```powershell
git --version
node --version
npm --version
```

## 首次安装与启动

克隆仓库后，可以直接双击根目录的 `启动速查.bat`。BAT 会依次：

1. 检查 `package.json` 和 `package-lock.json`；
2. 检查 Node.js、npm 和 Node.js 版本；
3. 比较当前依赖与 `package-lock.json` 的 SHA-256；
4. 首次运行或依赖变化时自动执行 `npm ci`；
5. 安装成功后执行 `npm run dev` 启动应用。

第一次启动需要下载 Electron 和其他依赖，耗时取决于网络速度。以后依赖没有变化时会直接启动。

命令行等价操作：

```powershell
npm ci
npm run dev
```

只安装或更新依赖、不启动应用：

```powershell
.\启动速查.bat --setup-only
```

只检查环境和依赖状态、不安装也不启动：

```powershell
.\启动速查.bat --check
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

## GitHub 仓库与协作权限

当前仓库为公开仓库：[`shaahy/quicknav-desktop`](https://github.com/shaahy/quicknav-desktop)。任何人都可以直接克隆和读取仓库内容，不需要由仓库所有者逐一邀请。

公开访问只代表可读取。其他人若要向本仓库 `push`，仍需由仓库所有者在 GitHub 仓库的 `Settings → Collaborators` 中授予协作者权限。

```powershell
git clone https://github.com/shaahy/quicknav-desktop.git
```

不要共享 GitHub 密码、个人访问令牌或一次性设备码。协作者应使用各自的 GitHub 账号进行身份验证。

## 在另一台电脑使用

1. 安装 Git for Windows 和 Node.js 24。
2. 打开 PowerShell，克隆公开仓库。
3. 进入仓库目录，双击 `启动速查.bat`，或在 PowerShell 中运行该 BAT。

```powershell
git clone https://github.com/shaahy/quicknav-desktop.git
cd quicknav-desktop
.\启动速查.bat
```

由于教程路径相对于 `app-data.json`，请保持仓库内 `app-data.json` 和 `A 教程集合/` 的相对位置不变。

`node_modules/` 不会上传 GitHub。每台电脑会根据同一个 `package-lock.json` 在本机生成依赖，因此不要在电脑之间复制 `node_modules/`。

## 日常同步

开始工作前：

```powershell
git status
git pull --ff-only
```

完成一组可验证的修改后：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-repository-hygiene.ps1
git status
git add --all
git status
git commit -m "说明本次修改"
git push
```

不要在两台电脑上同时保留未推送修改。若 `git pull --ff-only` 提示分支已分叉，先停止操作并检查两边的提交，不要强制覆盖。

拉取更新后可以直接双击 `启动速查.bat`。如果 `package-lock.json` 发生变化，BAT 会自动重新执行 `npm ci`。

## 故障排查

### 提示找不到 Node.js 或 npm

安装 Node.js 24 后关闭并重新打开 PowerShell，再运行：

```powershell
node --version
npm --version
```

如果仍然找不到命令，重新安装 Node.js，并确保安装程序将 Node.js 加入 PATH。

### 提示 Node.js 版本不符合要求

卸载过旧版本并安装 Node.js 24。支持范围是 20.19+、22.12+ 或 24+，不建议使用不在范围内的奇数版本。

### `npm ci` 下载失败

先关闭正在运行的速查工具以及其他可能占用本项目 Electron 文件的进程。如果错误包含 `EBUSY`、`resource busy` 或 `locked`，说明旧进程仍在占用 `node_modules` 中的文件。

确认进程已关闭且网络可以访问 npm 软件源，然后在项目根目录重试：

```powershell
npm ci
.\启动速查.bat
```

不要把其他电脑的 `node_modules/` 复制进来，也不要把它加入 Git。

### BAT 窗口显示启动失败

保留窗口中的完整错误信息，并依次运行：

```powershell
npm run lint
npm test
npm run build
```

如果三项检查通过但界面仍无法启动，记录 Node.js 版本、错误信息和复现步骤后再排查。

### 只想运行应用，不想安装开发环境

源码仓库的 BAT 依赖 Node.js。完全不安装 Node.js 的电脑应使用后续发布到 GitHub Release 的便携版，而不是直接运行源码仓库。

## 添加新教程

1. 将 Markdown、HTML、图片或必要源码放入 `A 教程集合/` 的清晰子目录。
2. 在速查工具中添加或更新卡片与分类，确认 `app-data.json` 已保存。
3. 刷新 README 教程目录：

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-readme-tutorial-catalog.ps1
   ```

4. 不要复制浏览器用户数据目录、缓存、日志、数据库 journal 或其他项目的 `.git`。
5. 运行仓库体检和目录一致性检查：

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-repository-hygiene.ps1
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-readme-tutorial-catalog.ps1 -Check
   ```

6. 使用 `git status` 审核新增文件后再提交。
7. 二进制文件达到 50 MiB 时先评估 Git LFS，不要直接提交。
