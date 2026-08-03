@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title 速查工具

cd /d "%~dp0"

if not exist "package.json" (
  echo [错误] 当前目录缺少 package.json。
  echo 请确认此 BAT 位于速查工具项目根目录。
  goto :failure
)

if not exist "package-lock.json" (
  echo [错误] 当前目录缺少 package-lock.json，无法进行可重复安装。
  goto :failure
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [错误] 尚未安装 Node.js，或 node.exe 不在 PATH 中。
  echo 请安装 Node.js 24，再重新双击此 BAT：
  echo https://nodejs.org/
  goto :failure
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [错误] 找不到 npm.cmd。请重新安装包含 npm 的 Node.js。
  goto :failure
)

for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24 ? 0 : 1)"
if errorlevel 1 (
  echo [错误] 当前 Node.js 版本为 !NODE_VERSION!，不符合项目要求。
  echo 支持版本：20.19+、22.12+ 或 24+；推荐安装 Node.js 24。
  goto :failure
)

set "LOCK_HASH="
for /f "delims=" %%H in ('node -p "require('crypto').createHash('sha256').update(require('fs').readFileSync('package-lock.json')).digest('hex').toUpperCase()"') do set "LOCK_HASH=%%H"
if not defined LOCK_HASH (
  echo [错误] 无法计算 package-lock.json 的校验值。
  goto :failure
)

set "STAMP_FILE=node_modules\.quicknav-package-lock.sha256"
set "INSTALLED_HASH="
if exist "!STAMP_FILE!" set /p "INSTALLED_HASH="<"!STAMP_FILE!"

set "NEEDS_INSTALL=0"
if not exist "node_modules\.bin\electron-vite.cmd" set "NEEDS_INSTALL=1"
if /i not "!INSTALLED_HASH!"=="!LOCK_HASH!" set "NEEDS_INSTALL=1"

if /i "%~1"=="--check" (
  echo [通过] Node.js !NODE_VERSION! 和 npm 已就绪。
  if "!NEEDS_INSTALL!"=="1" (
    echo [待处理] 依赖尚未安装，或 package-lock.json 已更新。
    exit /b 2
  )
  echo [通过] 当前依赖与 package-lock.json 一致。
  exit /b 0
)

if "!NEEDS_INSTALL!"=="1" (
  echo [准备] 首次运行或依赖版本已变化，开始执行 npm ci。
  echo [提示] 此过程需要网络，耗时取决于下载速度，请不要关闭窗口。
  call npm.cmd ci
  set "NPM_CI_EXIT=!ERRORLEVEL!"
  if not "!NPM_CI_EXIT!"=="0" (
    if exist "!STAMP_FILE!" del /q "!STAMP_FILE!" >nul 2>nul
    echo.
    echo [错误] 依赖安装失败，退出码为 !NPM_CI_EXIT!。
    echo 请先关闭正在运行的速查工具或其他占用本项目 Electron 文件的进程，
    echo 再检查网络、代理和上方 npm 错误信息后重试。
    goto :failure
  )
  >"!STAMP_FILE!" echo !LOCK_HASH!
)

if not exist "node_modules\.bin\electron-vite.cmd" (
  echo [错误] 依赖安装完成后仍找不到 electron-vite。
  echo 请在项目根目录手动执行 npm ci 并检查报错。
  goto :failure
)

if /i "%~1"=="--setup-only" (
  echo [完成] 运行环境和项目依赖已准备好。
  exit /b 0
)

echo [启动] 正在启动速查工具...
call npm.cmd run dev

if errorlevel 1 (
  echo.
  echo [错误] 速查工具启动失败，请查看上方错误信息。
  goto :failure
)

endlocal
exit /b 0

:failure
echo.
echo 可查看项目根目录 README.md 中的“故障排查”。
if not "%~1"=="" (
  endlocal
  exit /b 1
)
pause
endlocal
exit /b 1
