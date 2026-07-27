# Technical Research: 本地文件导航工具

**Feature**: 001-local-file-navigator
**Date**: 2026-07-22
**Status**: Complete

## Decision 1: 桌面框架 — Electron

**Decision**: Electron 33+

**Rationale**:
- **System tray**: Electron `Tray` API 成熟稳定，直接满足 spec FR-036b（关闭→托盘）需求。Tauri 的 tray 支持在 v2 中仍标记为 experimental。
- **文件系统集成**: `shell.openPath()` 和 `shell.showItemInFolder()` 直接映射 FR-026（系统默认方式打开）和 FR-028（在文件管理器中显示），无需 Rust 原生层桥接。
- **无障碍**: Electron + React 可复用 Web 无障碍生态（ARIA live region、focus management），直接支持 constitution Principle V 的 WCAG 2.2 AA 基线。Tauri 的 WebView 对辅助技术暴露有限。
- **开发速度**: 单开发者（怡哥），TypeScript 全栈，无需学习 Rust。20 个 UI 组件 + 复杂状态管理的项目，Web 生态的 UI 库和调试工具链显著加速。
- **跨平台构建**: electron-builder 对 Windows (NSIS/portable) 和 macOS (DMG) 的开箱支持最好。

**Alternatives considered**:
- **Tauri v2**: 包体小（~5MB vs ~150MB）、内存低（~20MB vs ~200MB），但系统托盘为 experimental、无障碍支持弱、需 Rust 知识。V1 个人工具不优先优化包体和内存，可评估为 V2 迁移目标。
- **PWA (Web-only)**: 无系统文件选择器原生集成、无系统托盘、无法调用 `shell.openPath()` 等关键 API。不满足桌面应用的核心需求。

## Decision 2: UI 框架 — React 18 + TypeScript

**Decision**: React 18 + TypeScript 5.x

**Rationale**:
- **无障碍生态**: `react-aria` (Adobe) 提供 40+ 个 WCAG 2.2 AA 级别的 hooks 和组件（useButton, useDialog, useListBox, useGrid 等），直接映射 spec FR-037~040。`@radix-ui/react-dialog`、`@radix-ui/react-popover` 用于模态和浮层焦点管理。
- **状态管理**: React Context + `useReducer` 足够 ≤500 张卡片的应用内状态，无需引入 Redux。
- **组件化**: 20 个 DESIGN/EXPERIENCE 组件天然映射为 React 组件树，props 即 token。
- **TypeScript**: spec 中大量字符串枚举（Surface ID、组件键名、校验规则）需要类型安全；VSCode/WebStorm 对 TSX 的 IntelliSense 最佳。

**Alternatives considered**:
- **Vue 3**: 无障碍生态弱于 React（vue-aria 社区维护、功能不全）；Composition API 对复杂状态机的 DX 不如 React hooks。
- **Svelte**: 无障碍组件需手写，生态太小；构建配置不如 Vite+React 成熟。
- **Vanilla JS**: 手动管理 20 个组件的 DOM 更新和焦点流过于脆弱，不值得节省依赖。

## Decision 3: 数据存储 — JSON 文件

**Decision**: 单个 JSON 文件 (`app-data.json`)，启动时全量加载到内存，保存时全量写回。

**Rationale**:
- spec clarification Q2 确定 V1 规模 ≤500 张卡片、≤50 个类别。JSON 全量读写在此规模上 <50ms，不会成为瓶颈。
- 无数据库依赖，应用安装包无需捆绑 SQLite native module。
- 全量内存加载实现实时搜索（FR-023）和排序（FR-021）零 I/O。
- 人类可读，V1 用户可手动检查/备份数据文件（虽然应用不提供该功能）。
- 数据损坏策略为"仅重试"（Q1），JSON 损坏比 SQLite 损坏更容易被用户感知和重建。

**Save timing**:
- 正常关闭/退出: 全量写回（FR-036）
- 托盘最小化: 保持在内存，不写盘（功率和 I/O 优化）
- 排序操作: 立即写盘（spec US2 场景 9 "立即生效"）—— 实际可采用 500ms debounce
- 新增/编辑删除: 确认保存后立即写盘

**Alternatives considered**:
- **SQLite (better-sqlite3)**: 增量写入效率高、支持查询，但 ≤500 记录的 JSON 全量读写可忽略性能差。引入 native module 增加构建复杂度和平台兼容风险。V2 如扩展规模可迁移。
- **IndexedDB / localStorage**: 浏览器存储 API 受限于 Chromium 实现，桌面应用直接文件 I/O 更可靠，且不受缓存清除影响。

## Decision 4: 文件唯一性算法

**Decision**: 路径归一化 + 文件元信息双重校验

**Algorithm**:
1. 主键: 相对于 `app-data.json` 所在目录的路径归一化（正斜杠 + Unicode NFC）
2. 辅助校验（防路径别名）: 文件大小 (bytes) + 修改时间 (mtime ms) 组合
3. 跨平台: Windows 路径反斜杠归一化、盘符大写；macOS 使用 POSIX 路径
4. 不校验文件哈希——对任意大小的文件延迟不可控

**Rationale**:
- 路径归一化是最轻量的唯一性方案，覆盖 95% 使用场景
- 文件大小+mtime 提供低成本交叉校验，防止同路径不同文件
- 不需要读取文件内容（constitution Principle I: 导航不扫描）
- 不覆盖硬链接和符号链接场景（PRD 未要求）

**Alternatives considered**:
- **文件内容哈希 (SHA-256)**: 最精确，但大文件（GB 级视频/磁盘镜像）计算延迟无法满足 5 秒 UX 指标
- **平台 inode / file index**: Windows `nFileIndex` 和 macOS inode 精度高，但跨卷移动后失效，且 API 不统一

## Decision 5: 构建与分发

**Decision**: electron-builder + NSIS (Windows) + DMG (macOS)

**Rationale**:
- `electron-builder` 是 Electron 生态标准，同时支持 NSIS 安装程序（Windows）和 DMG 磁盘映像（macOS）
- NSIS 支持静默安装、开始菜单快捷方式和卸载入口
- macOS DMG 满足沙盒要求，代码签名通过 `electron-notarize` 集成
- V1 不实现自动更新（spec 未要求，PRD 明确无网络能力）

**Alternatives considered**:
- **electron-forge**: 官方推荐但构建配置不如 builder 灵活，不支持 NSIS 的细节定制
- **Windows Store / Mac App Store**: 需额外沙盒权限配置，V1 不需要

## Decision 6: 测试框架

**Decision**: Vitest (单元) + Playwright (E2E) + axe-core (无障碍自动化)

**Rationale**:
- **Vitest**: 与 Vite 构建工具零配置集成，TypeScript 原生支持，速度快
- **Playwright**: Electron 官方推荐 E2E 方案（`electron-playwright` helper），支持 Windows/macOS 跨平台测试，支持多窗口和系统对话框模拟
- **axe-core**: 可通过 `@axe-core/playwright` 在每个 E2E 场景中自动运行 WCAG 2.2 AA 检查，满足 constitution Principle V 的无障碍基线要求
- **测试金字塔**: 单元测试覆盖数据模型和校验逻辑，E2E 覆盖 4 条 User Story 的验收场景，axe-core 覆盖无障碍基线

**Alternatives considered**:
- **Jest**: Electron 生态常用但配置复杂，不如 Vitest 与 Vite 的原生集成
- **Spectron**: Electron 旧版官方方案，已不维护
- **Cypress**: E2E 框架但 Electron 支持不如 Playwright 成熟

## Decision 7: 项目代码结构

**Decision**: 单项目结构 (Monorepo-Lite)

```
root/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts    # 应用入口、窗口管理、托盘
│   │   ├── ipc.ts      # IPC 通道注册
│   │   ├── store.ts    # JSON 数据读写
│   │   └── shell.ts    # shell.openPath / showItemInFolder 封装
│   ├── preload/        # 预加载脚本 (contextBridge)
│   │   └── index.ts
│   ├── renderer/       # React 渲染进程
│   │   ├── components/ # 20 个 UI 组件（按 DESIGN token 命名）
│   │   ├── hooks/      # useCards, useCategories, useSearch, useSort
│   │   ├── contexts/   # AppState, CurrentView, FocusManager
│   │   ├── surfaces/   # 18 个 Surface 状态实现
│   │   └── styles/     # CSS variables (DESIGN.md tokens)
│   └── shared/         # 共享类型和常量
│       ├── types.ts    # Card, Category, Surface, Component 枚举
│       └── validation.ts # 名称/备注/类别校验规则
├── tests/
│   ├── unit/           # 数据模型、校验逻辑
│   ├── e2e/            # 4 条 User Journey
│   └── a11y/           # axe-core 配置和基线报告
├── specs/              # (已存在)
└── electron-builder.yml
```
