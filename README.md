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

## 首次上传 GitHub（手动操作）

建议在 GitHub 网站创建私有仓库。创建时保持仓库为空，不要勾选自动生成 README、`.gitignore` 或 License。

完成本地文件审查和提交后，在 PowerShell 中手动执行：

```powershell
git status
git add --all
git status
git commit -m "chore: 整理项目并纳入教程内容"
git remote add origin https://github.com/<你的账号>/<仓库名>.git
git remote -v
git push -u origin master
```

执行 `git add --all` 后必须再次检查 `git status`，确认没有缓存、凭据、无关数据库或意外的大文件，再执行提交。

如果 Git Credential Manager 打开浏览器，请在浏览器中完成 GitHub 登录授权。不要在命令或文件中保存 GitHub 密码和访问令牌。

## 在另一台电脑使用

1. 安装 Git for Windows 和 Node.js 24。
2. 打开 PowerShell，克隆私有仓库。
3. 进入仓库目录，双击 `启动速查.bat`，或在 PowerShell 中运行该 BAT。

```powershell
git clone https://github.com/<你的账号>/<仓库名>.git
cd <仓库名>
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
2. 不要复制浏览器用户数据目录、缓存、日志、数据库 journal 或其他项目的 `.git`。
3. 运行仓库体检脚本。
4. 使用 `git status` 审核新增文件后再提交。
5. 二进制文件达到 50 MiB 时先评估 Git LFS，不要直接提交。
