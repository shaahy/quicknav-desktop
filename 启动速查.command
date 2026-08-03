#!/bin/bash

set -u

ARG_COUNT=$#
MODE="${1:-}"

pause_if_double_click() {
  if [ "$ARG_COUNT" -eq 0 ] && [ -t 0 ]; then
    printf '\n按回车键关闭此窗口...'
    IFS= read -r _
  fi
}

fail() {
  exit_code="$1"
  shift
  printf '\n[错误] %s\n' "$*"
  printf '%s\n' '可查看项目根目录 README.md 中的“故障排查”。'
  pause_if_double_click
  exit "$exit_code"
}

case "$MODE" in
  ""|--check|--setup-only)
    ;;
  *)
    fail 1 "不支持的参数：$MODE"
    ;;
esac

if [ "$ARG_COUNT" -gt 1 ]; then
  fail 1 '一次只能使用一个参数：--check 或 --setup-only。'
fi

case "$0" in
  */*) SCRIPT_PARENT=${0%/*} ;;
  *) SCRIPT_PARENT='.' ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "$SCRIPT_PARENT" 2>/dev/null && pwd)
if [ -z "$SCRIPT_DIR" ] || ! cd -- "$SCRIPT_DIR"; then
  fail 1 '无法进入速查工具项目目录。'
fi

if [ ! -f 'package.json' ]; then
  fail 1 '当前目录缺少 package.json。请确认此文件位于速查工具项目根目录。'
fi

if [ ! -f 'package-lock.json' ]; then
  fail 1 '当前目录缺少 package-lock.json，无法进行可重复安装。'
fi

if ! command -v node >/dev/null 2>&1; then
  fail 1 '尚未安装 Node.js，或 node 不在 PATH 中。请安装 Node.js 24：https://nodejs.org/'
fi

if ! command -v npm >/dev/null 2>&1; then
  fail 1 '找不到 npm。请重新安装包含 npm 的 Node.js。'
fi

NODE_VERSION=$(node --version 2>/dev/null)
if [ -z "$NODE_VERSION" ]; then
  fail 1 '无法读取 Node.js 版本。'
fi

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24 ? 0 : 1)'
node_version_exit=$?
if [ "$node_version_exit" -ne 0 ]; then
  fail 1 "当前 Node.js 版本为 $NODE_VERSION，不符合项目要求。支持版本：20.19+、22.12+ 或 24+；推荐安装 Node.js 24。"
fi

LOCK_HASH=$(node -e 'const crypto = require("crypto"); const fs = require("fs"); process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync("package-lock.json")).digest("hex").toUpperCase())' 2>/dev/null)
if [ -z "$LOCK_HASH" ]; then
  fail 1 '无法计算 package-lock.json 的校验值。'
fi

STAMP_FILE='node_modules/.quicknav-package-lock.sha256'
INSTALLED_HASH=''
if [ -f "$STAMP_FILE" ]; then
  IFS= read -r INSTALLED_HASH < "$STAMP_FILE" || true
  INSTALLED_HASH=${INSTALLED_HASH%$'\r'}
fi

NEEDS_INSTALL=0
if [ ! -f 'node_modules/.bin/electron-vite' ]; then
  NEEDS_INSTALL=1
fi
if [ "$INSTALLED_HASH" != "$LOCK_HASH" ]; then
  NEEDS_INSTALL=1
fi

if [ "$MODE" = '--check' ]; then
  printf '[通过] Node.js %s 和 npm 已就绪。\n' "$NODE_VERSION"
  if [ "$NEEDS_INSTALL" -eq 1 ]; then
    printf '%s\n' '[待处理] 依赖尚未安装，或 package-lock.json 已更新。'
    exit 2
  fi
  printf '%s\n' '[通过] 当前依赖与 package-lock.json 一致。'
  exit 0
fi

if [ "$NEEDS_INSTALL" -eq 1 ]; then
  printf '%s\n' '[准备] 首次运行或依赖版本已变化，开始执行 npm ci。'
  printf '%s\n' '[提示] 此过程需要网络，耗时取决于下载速度，请不要关闭窗口。'
  npm ci
  npm_exit=$?
  if [ "$npm_exit" -ne 0 ]; then
    rm -f -- "$STAMP_FILE"
    fail "$npm_exit" "依赖安装失败，退出码为 $npm_exit。请关闭正在运行的速查工具，再检查网络和上方 npm 错误后重试。"
  fi
  printf '%s\n' "$LOCK_HASH" > "$STAMP_FILE"
fi

if [ ! -f 'node_modules/.bin/electron-vite' ]; then
  fail 1 '依赖安装完成后仍找不到 electron-vite。请在项目根目录手动执行 npm ci 并检查报错。'
fi

if [ "$MODE" = '--setup-only' ]; then
  printf '%s\n' '[完成] 运行环境和项目依赖已准备好。'
  exit 0
fi

printf '%s\n' '[启动] 正在启动速查工具...'
npm run dev
dev_exit=$?
if [ "$dev_exit" -ne 0 ]; then
  fail "$dev_exit" '速查工具启动失败，请查看上方错误信息。'
fi

exit 0
