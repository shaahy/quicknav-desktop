# Implementation Plan: 本地文件导航工具

**Branch**: `001-local-file-navigator` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-local-file-navigator/spec.md`

## Summary

本地文件导航工具是一款 Electron 桌面应用，将用户手动收录的本地文件转化为可命名、可备注、可分类、可排序和可搜索的卡片，通过系统默认方式快速打开。V1 目标：Windows 10+ 与 macOS 12+ 双平台，≤500 张卡片/≤50 个用户类别，JSON 本地存储，WCAG 2.2 AA 完整无障碍基线。

## Technical Context

**Language/Version**: TypeScript 5.x (全栈: Electron main + preload + React renderer)

**Primary Dependencies**:
- **Electron 33+**: 桌面壳 (窗口管理、系统托盘、原生对话框)
- **React 18 + react-aria**: UI 渲染 + 无障碍组件基座（WCAG 2.2 AA 基线）。react-aria 提供 40+ ARIA hooks（useButton, useDialog, useListBox, useGrid 等）
- **@radix-ui/react-dialog, @radix-ui/react-popover**: 模态框与浮层 primitives——react-aria 管理无障碍语义与焦点，radix 管理 DOM 结构、portal 和关闭/打开状态机。两者互补：aria hooks = 行为，radix primitives = 结构
- **Vite 6**: 构建工具 (electron-vite 集成)
- **electron-builder**: 打包分发 (NSIS/DMG)

**Storage**: 单个 JSON 文件 (`app-data.json`)，启动时全量加载到内存，保存时全量写回。路径: `{app.getPath('userData')}/app-data.json`

**Testing**:
- **Vitest**: 单元测试（数据模型、校验逻辑、IPC handler）
- **Playwright + electron-playwright**: E2E（4 条 User Journey, 17 个验收场景）
- **@axe-core/playwright**: 无障碍自动化检查（WCAG 2.2 AA）

**Target Platform**: Windows 10+ (x64) / macOS 12+ (x64 + arm64)

**Project Type**: Desktop app (Electron, 单窗口)

**Performance Goals**:
- 卡片打开: 从点击到文件交给 OS 在 2 秒内完成（spec SC-001: 搜索/切换 + 点击总计 5 秒）
- 搜索: ≤200ms debounce，≤500 张卡片实时筛选无感知延迟
- 排序: 移动结果 UI 下一帧立即生效 (<16ms，用户可见即时反馈)，数据持久化 debounce 500ms 异步写盘
- 应用冷启动到可交互: ≤2 秒

**Constraints**:
- 纯本地应用，无网络请求，无遥测
- 不绕过操作系统安全提示（SmartScreen / Gatekeeper）
- 应用自身 UI 仅简体中文
- 单窗口，无多窗口模式
- JSON 文件全量读写（≤500 卡片规模下 <50ms）
- UI 文案约束: 所有可见文本、aria-label、placeholder、空状态引导和按钮标签不得包含"同步""导入""导出""迁移""共享""云端""多设备"等暗示跨设备能力的词汇（spec FR-035）
- 实现约束: `store:save` 成功后必须调用 `fs.fsyncSync` 确保数据写入磁盘；已知 OS 级不可检测的静默失败（`shell.openPath` 返回成功但文件未打开、OS 缓存丢失）须在 T086 审计脚本中登记为可接受风险

**Scale/Scope**: ≤500 张卡片, ≤50 个用户类别, 单人使用, 本地存储

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 导航不扫描 | ✅ PASS | `selectFile` 仅调用系统文件选择器，无目录遍历或文件监听。HTML title 读取仅限用户选中的文件。 |
| II. 源文件不可变 | ✅ PASS | `openFile` 使用 `shell.openPath` (只读), `showItemInFolder` 仅定位。所有写入操作仅针对 `app-data.json`。删除确认文案已设计。 |
| III. 失败必可见 | ✅ PASS | 所有 IPC 返回统一 IpcResult 结构。加载失败、打开失败、定位失败均有对应 error-dialog/duplicate-dialog Surface。 |
| IV. 跨平台一致 | ✅ PASS | `normalizePath()` 处理 Windows/macOS 路径差异。`shell.openPath`/`shell.showItemInFolder` 跨平台统一 API。electron-builder 分别打包 NSIS/DMG。 |
| V. 无障碍即基线 | ✅ PASS | react-aria 提供 40+ WCAG 2.2 AA hooks。每个组件指定 role + aria-*。axe-core 集成到 E2E pipeline。 |
| VI. V1 严格边界 | ✅ PASS | spec 44 FRs 已覆盖。research.md 每个决策注明 V1 范围。未引入数据库、网络、多用户、深色主题、国际化等 V2 功能。 |

**Post-Phase-1 设计重检**: ✅ 所有原则仍通过。data-model.md 的 JSON 全量读写不引入文件扫描；contracts 的 system-bridge.md 保持 shell 只读封装；component contracts 已嵌入 aria 角色和 WCAG 要求。

## Project Structure

### Documentation (this feature)

```text
specs/001-local-file-navigator/
├── plan.md              # This file
├── research.md          # Phase 0: 7 项技术决策
├── data-model.md        # Phase 1: 实体模型 + 状态转换
├── quickstart.md        # Phase 1: 8 个可运行验证场景
├── contracts/           # Phase 1: 接口契约
│   ├── components.md    #   20 个 UI 组件 props + aria 契约
│   └── system-bridge.md #   IPC 通道 + OS 交互接口
├── spec.md              # 功能规格 (44 FRs, 17 场景, 18 Edge Cases)
└── checklists/
    └── requirements.md  # 质量检查清单
```

### Source Code (repository root)

```text
src/
├── main/                       # Electron 主进程
│   ├── index.ts                # BrowserWindow 创建, 系统托盘, 生命周期
│   ├── ipc.ts                  # IPC handler 注册 (contextBridge)
│   ├── store.ts                # JSON 数据读写 (load/save/corruption)
│   └── shell.ts                # shell.openPath / showItemInFolder / dialog 封装
├── preload/
│   └── index.ts                # contextBridge.exposeInMainWorld('electronAPI', ...)
├── renderer/                   # React 渲染进程
│   ├── App.tsx                 # 根组件: AppState provider + app-shell
│   ├── components/             # 20 个 UI 组件
│   │   ├── app-shell.tsx
│   │   ├── category-nav.tsx
│   │   ├── category-item.tsx
│   │   ├── view-header.tsx
│   │   ├── global-search.tsx
│   │   ├── toolbar-button.tsx
│   │   ├── file-card.tsx
│   │   ├── file-type-mark.tsx
│   │   ├── category-tag.tsx
│   │   ├── action-menu.tsx
│   │   ├── card-form-dialog.tsx
│   │   ├── category-editor-popover.tsx
│   │   ├── category-checklist.tsx
│   │   ├── confirmation-dialog.tsx
│   │   ├── error-dialog.tsx
│   │   ├── duplicate-dialog.tsx
│   │   ├── reorder-control.tsx
│   │   ├── empty-state.tsx
│   │   ├── status-bar.tsx
│   │   └── form-field.tsx
│   ├── hooks/                  # React hooks
│   │   ├── useCards.ts         # 卡片 CRUD + 状态
│   │   ├── useCategories.ts    # 类别 CRUD + 顺序
│   │   ├── useSearch.ts        # 搜索 + debounce + ARIA live
│   │   ├── useSort.ts          # 整理模式 + 播报
│   │   └── useFocus.ts         # 焦点管理 + 归还
│   ├── contexts/
│   │   └── AppState.tsx        # React Context: cards, categories, viewOrders
│   ├── surfaces/               # 18 个 Surface 渲染逻辑
│   │   └── ...                 # 按 EXPERIENCE.md Surface ID 命名
│   └── styles/
│       ├── tokens.css          # CSS variables (DESIGN.md colors/typography/spacing)
│       └── global.css          # 全局 reset + 基础样式
└── shared/                     # 主/渲染进程共享
    ├── types.ts                # Card, Category, FileReference, ViewOrder, AppData
    ├── validation.ts           # 名称/备注/类别校验函数
    └── constants.ts            # 限制常量 (MAX_CARD_NAME=80, MAX_CATEGORY_NAME=30, 等)

tests/
├── unit/                       # Vitest
│   ├── validation.test.ts      # 校验逻辑
│   ├── store.test.ts           # JSON 读写 + 损坏处理
│   └── data-model.test.ts      # 实体创建/删除/排序
├── e2e/                        # Playwright
│   ├── uj1-first-card.spec.ts  # VS-1
│   ├── uj2-quick-open.spec.ts  # VS-2
│   ├── uj3-organize.spec.ts    # VS-3
│   ├── uj4-repair.spec.ts      # VS-4
│   ├── tray.spec.ts            # VS-5
│   ├── persistence.spec.ts     # VS-6
│   ├── keyboard-a11y.spec.ts   # VS-7
│   └── zoom-resize.spec.ts     # VS-8
└── a11y/                       # axe-core 配置
    └── axe-config.ts

specs/                           # Speckit 产物 (已存在)
electron-builder.yml             # 打包配置
package.json
tsconfig.json
vite.config.ts
```

**Structure Decision**: 单项目结构（Option 1），含 `src/main/`（Electron 主进程）、`src/renderer/`（React）、`src/shared/`（共享类型）。选用 electron-vite 作为构建桥接，自动处理 main/preload/renderer 三入口。

## Complexity Tracking

> 无 constitution 违规需要 justify。所有原则在设计阶段通过。

## Key Design Decisions (from research.md)

| # | Decision | Rationale (abbreviated) |
|---|----------|------------------------|
| 1 | Electron 33+ | 系统托盘 API 成熟、无障碍生态完整、`shell.openPath`/`showItemInFolder` 原生映射 FR-026/028 |
| 2 | React 18 + TypeScript | react-aria 提供 WCAG 2.2 AA 基线、20 组件天然映射、TypeScript 类型安全 |
| 3 | JSON file storage | ≤500 卡片全量读写 <50ms、无数据库依赖、人类可读易调试 |
| 4 | 路径归一化 + 文件元信息双重校验 | 轻量、无需文件哈希、覆盖 95% 唯一性场景 |
| 5 | electron-builder (NSIS + DMG) | 标准方案、代码签名集成、V1 无自动更新 |
| 6 | Vitest + Playwright + axe-core | Vite 集成、Electron E2E 支持、无障碍自动化 |
| 7 | 单项目 monorepo | 主/渲染/共享三目录分离、electron-vite 桥接 |
