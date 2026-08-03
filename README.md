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

## 本地开发

```powershell
npm ci
npm run dev
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

```powershell
git clone https://github.com/<你的账号>/<仓库名>.git
cd <仓库名>
npm ci
npm run dev
```

由于教程路径相对于 `app-data.json`，请保持仓库内 `app-data.json` 和 `A 教程集合/` 的相对位置不变。

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

## 添加新教程

1. 将 Markdown、HTML、图片或必要源码放入 `A 教程集合/` 的清晰子目录。
2. 不要复制浏览器用户数据目录、缓存、日志、数据库 journal 或其他项目的 `.git`。
3. 运行仓库体检脚本。
4. 使用 `git status` 审核新增文件后再提交。
5. 二进制文件达到 50 MiB 时先评估 Git LFS，不要直接提交。
