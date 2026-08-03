# 实现任务：本地文件导航工具

**输入来源**: `specs/001-local-file-navigator/` 设计文档

**前置文件**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/components.md ✅, contracts/system-bridge.md ✅, checklists/quality.md ✅

**测试要求**: 包含单元测试和 E2E 测试任务（spec 要求 17 个验收场景可独立验证，constitution 要求无障碍基线验证）

**质量门槛**: 已嵌入 `checklists/quality.md` 的 2 项 🔴 高风险 + 3 项 🟠 中风险发现作为对应任务的显式验收条件。spec-analysis.md 的 C1/C2/H1-H4 均已在本版本中修复。

## 任务格式说明: `- [ ] [编号] [P?] [Story] 任务描述 + 文件路径`

- **[P]**: 可并行执行（操作不同文件，无依赖）
- **[Story]**: 所属用户故事 (US1, US2, US3, US4)
- **🔍 CHK###**: 引用 `checklists/quality.md` 条目作为额外验收条件
- **✅ WCAG 自检**: UI 实现任务完成后须用 axe DevTools 扫描本组件，确认无 WCAG 2.2 AA 违规
- UI 任务携带 📐🎨🖐 视觉/交互契约引用

## 路径约定

- **Electron 主进程**: `src/main/`
- **React 渲染进程**: `src/renderer/`
- **共享类型**: `src/shared/`
- **测试**: `tests/unit/`, `tests/e2e/`

---

## 第一阶段：项目搭建

**目标**: 项目脚手架、构建配置、包依赖安装完成，执行 `npm run dev` 可启动空白 Electron 窗口。

- [ ] T001 按 plan.md 安装全部依赖包：electron、react、react-dom、typescript、vite、electron-vite、react-aria、@radix-ui/react-dialog、@radix-ui/react-popover，写入 package.json
- [ ] T002 [P] 配置 electron-vite，设置 main/preload/renderer 三入口，写入 vite.config.ts
- [ ] T003 [P] 配置 TypeScript 严格模式与路径别名，写入 tsconfig.json
- [ ] T004 [P] 配置 electron-builder，Windows 使用 NSIS 安装程序、macOS 使用 DMG 磁盘映像，写入 electron-builder.yml
- [ ] T005 [P] 配置 Vitest 与 Vite 集成，写入 vitest.config.ts
- [ ] T006 [P] 配置 Playwright，使用 electron-playwright 辅助库启动 Electron 进行 E2E 测试，写入 playwright.config.ts
- [ ] T007 [P] 配置 axe-core 的 Playwright 集成，用于无障碍自动化扫描，写入 tests/a11y/axe-config.ts
- [ ] T008 按 plan.md 创建完整项目目录结构：src/main/、src/preload/、src/renderer/components/、src/renderer/hooks/、src/renderer/contexts/、src/renderer/surfaces/、src/renderer/styles/、src/shared/、tests/unit/、tests/e2e/、tests/a11y/

---

## 第二阶段：基础设施（阻塞性前置任务）

**目标**: 共享类型、CSS token、IPC 桥接、数据存储层全部就绪。所有用户故事依赖此阶段完成后方可开始。

### 共享层

- [ ] T009 [P] 定义全部 TypeScript 类型和接口（Card、Category、FileReference、ViewOrder、AppData、ViewType、SurfaceId、ComponentKey、IpcResult<T>），写入 src/shared/types.ts
  - 📐 数据来源: data-model.md 实体定义 + contracts/system-bridge.md IPC 签名
- [ ] T010 [P] 定义全部常量（卡片名最长 80 字符、类别名最长 30 字符、备注最长 500 字符、最多 500 张卡片、最多 50 个类别、保留名称列表等），写入 src/shared/constants.ts
- [ ] T011 [P] 实现全部校验函数（校验卡片名、校验类别名、校验备注、检测是否有未保存修改、检测文件名是否重复），写入 src/shared/validation.ts
  - 📐 数据来源: data-model.md 校验规则 + spec.md FR-006/FR-013/FR-032

### CSS Token

- [ ] T012 将 DESIGN.md 全部 CSS 自定义属性实现为 CSS 变量，写入 src/renderer/styles/tokens.css
  - 🎨 视觉来源: DESIGN.md 前言中的 colors / typography / rounded / spacing / components token
  - 包含: `--color-*`、`--typography-*`、`--rounded-*`、`--spacing-*`、`--component-*` 全部 20 个组件的 token 集合
  - 同时定义全局 focus-visible 外环样式（2px solid `{colors.focus}` + 2px 外偏移）和系统字体栈（system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif）

### Electron 主进程

- [ ] T013 实现 Electron 主进程入口：创建 BrowserWindow（默认 1024×720，最小 760×560），获取单实例锁，重复启动时恢复并聚焦已有窗口，冷启动进入"全部卡片"，写入 src/main/index.ts
  - 🖐 行为来源: spec.md FR-019/FR-020 + contracts/system-bridge.md
- [ ] T014 [P] 实现应用生命周期：关闭窗口时彻底退出主进程及全部 Electron 子进程，不创建系统托盘，应用内"退出"保持相同行为，写入 src/main/index.ts
  - 🖐 行为来源: spec.md FR-036b + Edge Cases 应用生命周期行为
  - 🔍 CHK010: 在生命周期相关代码中明确声明——窗口关闭不得被拦截为后台隐藏
- [ ] T015 [P] 实现 preload 脚本：通过 contextBridge.exposeInMainWorld 暴露全部 6 个 IPC 通道给渲染进程，写入 src/preload/index.ts
  - 📐 接口来源: contracts/system-bridge.md IPC Channel Registry

### 数据存储

- [ ] T016 实现 JSON 数据存储：从 `{app.getPath('userData')}/app-data.json` 加载 AppData，用 JSON.stringify 序列化写回，首次启动返回空数据结构，写入 src/main/store.ts
  - 📐 数据来源: data-model.md AppData 根结构 + research.md 决策 3
- [ ] T017 实现数据损坏处理：JSON.parse 捕获异常 → 返回 `{ success: false, error: 'corrupted' }`，不自动备份、不尝试修复，写入 src/main/store.ts
  - 🖐 行为来源: spec.md FR-036a + 澄清记录 Q1
- [ ] T018 在 IPC 中注册 store 通道：'store:load' 和 'store:save'，写入 src/main/ipc.ts
  - 📐 接口来源: contracts/system-bridge.md getAppData/saveAppData
- [ ] T019 实现数据写入失败处理：磁盘满、权限不足、文件被锁定 → 向渲染进程返回结构化 IpcResult 错误；save 成功后调用 `fs.fsyncSync` 确保数据落盘；写入 src/main/store.ts
  - 🔍 CHK029 (🔴 高风险): 写入失败须区分 'disk-full' / 'permission-denied' / 'locked' 三种错误类型返回；渲染进程收到写入失败后须阻断用户所有操作并显示错误对话框

### IPC Shell 封装

- [ ] T020 实现 Shell 操作：通过系统对话框选择文件 (dialog.showOpenDialog)、通过系统默认方式打开文件 (shell.openPath)、在文件管理器中定位文件 (shell.showItemInFolder)，写入 src/main/shell.ts
  - 📐 接口来源: contracts/system-bridge.md X01/X02/X03
  - 🔍 CHK019 (🟠 中风险): openFile 实现中**不得**调用 `fs.existsSync()` 或任何形式的文件存在性预检查——直接调用 `shell.openPath()`，由操作系统返回结果。在主进程代码注释中显式声明"不预判文件状态"原则以支持代码审查验证
- [ ] T021 [P] 实现 HTML 标题读取：读取文件前 64KB，解析 `<title>` 标签，返回去除首尾空格后的文本；非 UTF-8 或二进制伪装的 .html 文件安全降级返回 null，写入 src/main/shell.ts
  - 📐 接口来源: contracts/system-bridge.md readHtmlTitle + spec.md FR-003
  - 🔍 CHK037 (🟡): 标题读取失败时调用方回退到不含扩展名的文件名——在代码注释中记录此降级策略
- [ ] T022 在 IPC 中注册 Shell 通道：'file:select'、'file:readHtmlTitle'、'shell:openFile'、'shell:showItemInFolder'，写入 src/main/ipc.ts
  - 📐 接口来源: contracts/system-bridge.md IPC Channel Registry

### React 基础设施

- [ ] T023 实现 AppState 上下文提供者：管理 cards[] / categories[] / viewOrders[] / currentView / searchQuery 状态，使用 useReducer 分发模式，写入 src/renderer/contexts/AppState.tsx
  - 📐 数据来源: data-model.md AppData 根结构 + spec.md FR-019/FR-021
- [ ] T024 实现 useCards hook：卡片增删改查操作、源文件重复检测、卡片名唯一性校验、源文件身份比对，写入 src/renderer/hooks/useCards.ts
  - 📐 行为来源: spec.md FR-001~FR-009 + data-model.md Card 实体
- [ ] T025 实现 useCategories hook：类别增删改查、保留名称拦截、未分类显示/隐藏逻辑，写入 src/renderer/hooks/useCategories.ts
  - 📐 行为来源: spec.md FR-012~FR-018 + data-model.md Category 实体
- [ ] T026 实现 useFocus hook：焦点陷阱、焦点归还给触发元素、焦点顺序管理，写入 src/renderer/hooks/useFocus.ts

---

## 第三阶段：用户故事 1 — 文件收录与快速打开（优先级 P1）🎯 MVP

**目标**: 用户可以收录文件创建卡片，并在首页点击卡片由系统默认方式打开文件。15 个验收场景可独立验证。

**独立测试标准**: 从空应用启动 → 选择文件 → 确认卡片名称和类别 → 保存 → 卡片出现在首页 → 点击 → 文件由默认应用打开。验证核心指标：5 秒 / 2 次操作。

### US1 — 组件实现

- [ ] T027 [US1] 实现 app-shell 组件，按契约实现全部 props 和角色，写入 src/renderer/components/app-shell.tsx
  - 📐 契约: contracts/components.md#app-shell（loadingState / retryLoad / quitApp props | role="application"）
  - 🎨 视觉: DESIGN.md → `{components.app-shell}`（canvas / surface / divider）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#app-shell（冷启动进入 S01、重复启动聚焦现有窗口、加载中禁止所有交互）
  - 🔍 CHK019: app-shell 加载完成后，所有文件操作入口**不得**在任何时机调用文件存在性检查——此约束在组件注释中显式声明
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T028 [P] [US1] 实现 toolbar-button 组件，按契约实现全部 props 和视觉变体，写入 src/renderer/components/toolbar-button.tsx
  - 📐 契约: contracts/components.md#toolbar-button（label / variant / onClick / disabled / icon props）
  - 🎨 视觉: DESIGN.md → `{components.toolbar-button}`（primary 使用 action 色 + on-action 文字、secondary 使用 surface 底 + border）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T029 [US1] 实现 form-field 组件，按契约实现全部类型和校验状态，写入 src/renderer/components/form-field.tsx
  - 📐 契约: contracts/components.md#form-field（type / label / value / error / maxLength / onChange props | aria-describedby 关联错误文案）
  - 🎨 视觉: DESIGN.md → `{components.form-field}`（focus / error / border 颜色）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T030 [US1] 实现 category-checklist 组件，按契约实现复选列表和校验行为，写入 src/renderer/components/category-checklist.tsx
  - 📐 契约: contracts/components.md#category-checklist（categories / selectedIds / onChange / onCreateNew props | role="group" | 未分类以禁用态呈现不可勾选）
  - 🎨 视觉: DESIGN.md → `{components.category-checklist}`（selected 使用 action 色、focus 使用 focus 色）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#category-checklist（新增卡片时不预选任何类别、无类别时聚焦"新建类别"按钮、组校验失败时播报错误）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T031 [US1] 实现 category-editor-popover 组件，按契约实现创建/重命名浮层，写入 src/renderer/components/category-editor-popover.tsx
  - 📐 契约: contracts/components.md#category-editor-popover（mode / initialName / onSave / onClose / anchor props | Esc 或取消时焦点归还触发者）
  - 🎨 视觉: DESIGN.md → `{components.category-editor-popover}`（硬边界、错误文字紧贴字段下方）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#category-editor-popover（对应 S12 浮层、创建成功后回到 S10 并自动选中新类别）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T032 [US1] 实现 card-form-dialog 组件，按契约实现新增/编辑两种模式的模态框，写入 src/renderer/components/card-form-dialog.tsx
  - 📐 契约: contracts/components.md#card-form-dialog（mode 区分 create/edit、initialData / onSave / onClose props | role="dialog" | 打开时初始焦点落在名称字段）
  - 🎨 视觉: DESIGN.md → `{components.card-form-dialog}`（surface / border / rounded.md）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#card-form-dialog（S10 新增确认：展示名称+类别选择、HTML 标题优先于文件名；S11 编辑卡片：展示名称+备注+类别+只读路径+复制路径+文件管理器中定位+重新选择文件；有未保存修改关闭时先进入 S15 确认）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T033 [P] [US1] 实现 file-type-mark 组件，按契约显示文件类型图标和扩展名，写入 src/renderer/components/file-type-mark.tsx
  - 📐 契约: contracts/components.md#file-type-mark（extension / fileName props）
  - 🎨 视觉: DESIGN.md → `{components.file-type-mark}`（text-muted 前景、border-muted 边界、rounded.sm、typography.meta 字体）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T034 [US1] 实现 empty-state 组件，按契约支持三种空状态变体，写入 src/renderer/components/empty-state.tsx
  - 📐 契约: contracts/components.md#empty-state（variant 区分 first-launch / category-empty / no-results、primaryAction / secondaryAction props）
  - 🎨 视觉: DESIGN.md → `{components.empty-state}`（text / text-muted / border-muted）
  - 🔍 CHK020 (🟠 中风险): 首次启动空状态文案"添加常用文件。应用不会扫描磁盘。"——不包含任何暗示同步/导入/迁移的图标或提示文案。此约束在组件注释中显式声明
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T035 [US1] 实现 confirmation-dialog 组件，按契约支持三类确认场景，写入 src/renderer/components/confirmation-dialog.tsx
  - 📐 契约: contracts/components.md#confirmation-dialog（variant 区分 delete-category / delete-card / discard-changes、data / onConfirm / onCancel props | role="alertdialog" | 破坏性确认按钮使用 danger 色 | 初始焦点落在安全动作上）
  - 🎨 视觉: DESIGN.md → `{components.confirmation-dialog}`（destructive 使用 colors.danger、destructive-foreground 使用 colors.on-danger、rounded.md）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#confirmation-dialog（S13 删除类别 / S14 删除卡片 / S15 放弃修改，居中显示，不与其他模态堆叠）
  - ✅ WCAG 自检: axe DevTools 扫描通过

### US1 — Surface 实现与集成

- [ ] T036 [US1] 实现 S05（首次无卡片空状态）Surface：展示引导文案 + "选择文件"主按钮，写入 src/renderer/surfaces/S05-FirstLaunchEmpty.tsx
  - 📐 数据来源: spec.md US1 场景 1-2 + EXPERIENCE.md State Patterns S05
  - 使用组件: empty-state（variant=first-launch）、toolbar-button（primary "选择文件"）

- [ ] T037 [US1] 实现 S10（新增卡片确认模态框）Surface：集成 card-form-dialog + category-checklist + category-editor-popover + form-field。编排完整流程——系统文件选择器返回 → HTML 标题读取 → 名称预填 → 类别选择 → 校验 → 保存，写入 src/renderer/surfaces/S10-AddCard.tsx
  - 📐 数据来源: spec.md US1 场景 1-5、9-13 + EXPERIENCE.md State Patterns S10
  - 🖐 关键行为: HTML 文件优先采用页面标题→无效时回退到不含扩展名的文件名、无类别时可在当前步骤创建并自动选中、卡片名称 ≤80 字符+唯一性+非空校验、至少选择 1 个类别、源文件重复→跳转 S18、取消且有修改→跳转 S15、保存成功→卡片出现在"全部卡片"和每个所属类别末尾
  - 🔍 CHK034 (🔴 高风险): 保存时调用 IPC 'store:save'，若返回写入失败→阻断用户所有操作，显示 error-dialog（variant='save-failed'），提供"重试保存 / 关闭应用"。不得静默继续使用

- [ ] T038 [US1] 实现 S11（卡片编辑模态框）Surface：集成 card-form-dialog（mode=edit）+ form-field（名称/备注/只读路径）+ category-checklist。编排复制路径、在文件管理器中显示、重新选择文件流程，写入 src/renderer/surfaces/S11-EditCard.tsx
  - 📐 数据来源: spec.md FR-007/FR-008/FR-009 + EXPERIENCE.md State Patterns S11
  - 🖐 关键行为: 路径只读显示+可复制+可请求系统定位、重新选择文件→系统文件选择器→更新路径、更换冲突→跳转 S18、保存保留未变数据和各视图顺序、有未保存修改关闭→跳转 S15
  - 🔍 CHK034: 保存同 S10——写入失败→阻断 + error-dialog

- [ ] T039 [US1] 实现 S15（放弃未保存修改确认）Surface：用户在 S10/S11 中有实际修改后关闭模态框时，弹出 confirmation-dialog（variant=discard-changes），写入 src/renderer/surfaces/S15-DiscardChanges.tsx
  - 📐 数据来源: spec.md US1 场景 14 + FR-002a + EXPERIENCE.md State Patterns S15
  - 🖐 关键行为: 无实际修改时直接关闭（不弹确认）、"继续编辑"→回到表单且所有已填数据完整保留、"放弃修改"→关闭模态框回到触发前的上下文

### US1 — 卡片主视图

- [ ] T040 [US1] 实现 file-card 组件，按契约实现卡片展示和主打开行为，写入 src/renderer/components/file-card.tsx
  - 📐 契约: contracts/components.md#file-card（card / index / total / viewType / onOpenFile / onShowMenu / isReorderMode props | role="article" | aria-posinset / aria-setsize | 主体 aria-label="打开：{卡片名}" | 更多按钮 aria-label="更多操作：{卡片名}"）
  - 🎨 视觉: DESIGN.md → `{components.file-card}`（surface / border / focus / rounded.sm、名称与元信息用分隔线组织）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#file-card（单击/Enter = 主打开动作、更多按钮独立焦点和点击区域、备注最多展示两行超出省略、无备注不留空位、category-tag 仅在"全部卡片"和搜索结果中显示）
  - 🔍 CHK034: onClick 触发 IPC 'shell:openFile'。若返回 'no-default-app' → 触发 X02（系统"选择打开方式"对话框）；用户在 X02 中选择不兼容应用后的行为由操作系统决定——在代码注释中记录此已知限制
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T041 [US1] 实现 view-header 组件，按契约展示视图标题和辅助信息，写入 src/renderer/components/view-header.tsx
  - 📐 契约: contracts/components.md#view-header（title / cardCount / showSortInfo props | role="banner" | 标题作为主内容的 aria-labelledby）
  - 🎨 视觉: DESIGN.md → `{components.view-header}`（text 前景、下方 border 分隔线）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T042 [US1] 实现 S01（全部卡片正常态）Surface：集成 view-header + 搜索框 UI 占位（disabled 状态，功能实现在 T063）+ toolbar（"选择文件"主按钮）+ file-card 响应式多列网格 + 无卡片时降级到 S05 空状态 + 数据加载中状态，写入 src/renderer/surfaces/S01-AllCards.tsx
  - 📐 数据来源: spec.md US1 场景 6-8 + EXPERIENCE.md State Patterns S01
  - 🎨 视觉: DESIGN.md → Layout & Spacing（1024×720 基准三列网格，窗口缩放自动增减列数，不设最大宽度）
  - 🖐 关键行为: 首次启动数据为空→展示 S05、加载中→展示壳且禁止所有交互控件聚焦/激活、加载失败→阻断反馈"无法加载本地数据"（重试仅重读同一文件 + 关闭应用）、加载成功后按 左栏→标题/搜索/工具→网格 建立焦点顺序、单击卡片主体执行主打开、卡片主体与更多按钮分离焦点

### US1 — 测试

- [ ] T043 [P] [US1] 编写校验函数单元测试（validateCardName 覆盖空值/最大长度/重名/换行等边界、validateCategoryName、validateNote），写入 tests/unit/validation.test.ts
- [ ] T044 [P] [US1] 编写 useCards hook 单元测试（卡片增删改查全生命周期、名称唯一性校验、源文件身份比对），写入 tests/unit/useCards.test.ts
- [ ] T045 [US1] 编写 UJ-1 E2E 测试（首次收录：启动→选择文件→确认名称→创建类别→保存→卡片出现在首页），写入 tests/e2e/uj1-first-card.spec.ts
  - 📐 验证标准: quickstart.md VS-1
- [ ] T046 [US1] 编写 UJ-2 E2E 测试（快速打开：点击卡片→文件由默认应用打开、切换类别、验证 5 秒/2 次操作指标），写入 tests/e2e/uj2-quick-open.spec.ts
  - 📐 验证标准: quickstart.md VS-2

---

## 第四阶段：用户故事 2 — 分类管理与卡片排序（优先级 P2）

**目标**: 用户可创建/重命名/删除/排序类别，卡片可属于多个类别，每个视图拥有独立的卡片顺序。14 个验收场景可独立验证。

**独立测试标准**: 在已有若干卡片和类别的前提下，创建/重命名/删除类别、将卡片加入多个类别、进入整理模式调整顺序、验证各视图顺序相互独立。

### US2 — 组件实现

- [ ] T047 [US2] 实现 category-item 组件，按契约展示类别项和当前选中态，写入 src/renderer/components/category-item.tsx
  - 📐 契约: contracts/components.md#category-item（item / isActive / onClick / menuActions props | role="option" | aria-selected）
  - 🎨 视觉: DESIGN.md → `{components.category-item}`（普通态使用 text 色、当前态使用 action 背景 + on-action 文字）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#category-item（名称区域点击切换视图、更多按钮独立焦点、系统视图无编辑/删除菜单项）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T048 [US2] 实现 category-nav 组件，按契约实现固定左侧栏导航，写入 src/renderer/components/category-nav.tsx
  - 📐 契约: contracts/components.md#category-nav（views / currentViewId / onSwitchView / onCreateCategory / onReorderCategories props | role="navigation" | aria-label="类别导航"）
  - 🎨 视觉: DESIGN.md → `{components.category-nav}`（固定宽度 208px、surface 背景、1-2px border 右边界、标题区+"＋"+系统视图+用户类别+未分类 垂直索引布局）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#category-nav（"全部卡片"固定顶部、"未分类"仅在有卡片时显示在底部、用户类别按用户设定顺序排列、当前类别通过程序化当前态表达、不可折叠或转为顶部导航）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T049 [US2] 实现 reorder-control 组件，按契约支持拖拽和键盘排序，写入 src/renderer/components/reorder-control.tsx
  - 📐 契约: contracts/components.md#reorder-control（items / onReorder / itemType props | role="listbox" | aria-posinset / aria-setsize | 首尾边界按钮以禁用态呈现）
  - 🎨 视觉: DESIGN.md → `{components.reorder-control}`（surface / text / border / focus / rounded.sm）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#reorder-control（拖动手柄 + 键盘上移/下移按钮、拖拽与按钮结果等价、移动后焦点留在被移动项上）
  - 🔍 CHK016 (🟠 中风险): UI 层 onReorder 回调**必须**在下一帧 (<16ms) 内更新 viewOrders state，使视觉结果即时可见。持久化写盘在 store.ts 中独立执行 debounce 500ms，不阻塞 UI 更新。在 reorder-control 的 JSDoc 和 store.ts 的 save 注释中分别声明"UI 即时生效，写盘异步 debounce"语义
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T050 [US2] 实现 action-menu 组件，按契约实现卡片和类别的右键/更多操作菜单，写入 src/renderer/components/action-menu.tsx
  - 📐 契约: contracts/components.md#action-menu（items / anchor / onClose props | role="menu" | 菜单项 role="menuitem"）
  - 🎨 视觉: DESIGN.md → `{components.action-menu}`（硬边界、选中行使用 surface-subtle 背景、危险操作使用 colors.danger 文字但不整行红底、禁用项使用 text-disabled 色+禁用标记+原因说明文案）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#action-menu（卡片菜单含 编辑/在文件管理器中显示/删除/移出当前类别、类别菜单含 重命名/删除、菜单操作不得触发卡片主打开）
  - ✅ WCAG 自检: axe DevTools 扫描通过

### US2 — Surface 实现

- [ ] T051 [US2] 实现 useSort hook：管理视图级排序逻辑，UI 即时更新 + 写盘异步 debounce，礼貌级 ARIA 播报"位置 N/总数"，S08/S09 模式切换，写入 src/renderer/hooks/useSort.ts
  - 🔍 CHK016: 此 hook 是 CHK016 的核心实现——`dispatch({ type: 'REORDER', viewId, newOrder })` 立即更新 UI state（<16ms），`debounce(saveAppData, 500)` 异步写盘。hook 的 JSDoc 必须声明此 UI 即时/持久化异步的分离语义

- [ ] T052 [US2] 实现 S02（用户类别正常态）Surface：category-nav 高亮当前类别 + 按类别过滤的 file-card 网格 + 无卡片时降级到 S06 空状态 + 整理排序模式切换，写入 src/renderer/surfaces/S02-CategoryView.tsx
  - 📐 数据来源: spec.md US2 场景 1-14 + EXPERIENCE.md State Patterns S02
  - 🖐 关键行为: 保留独立顺序、在当前类别中移出卡片→卡片从网格消失并显示 status-bar

- [ ] T053 [US2] 实现 S03（未分类正常态）Surface：category-nav 底部"未分类"高亮 + 仅含零个用户类别的卡片网格，写入 src/renderer/surfaces/S03-Uncategorized.tsx
  - 📐 数据来源: spec.md US2 场景 8 + EXPERIENCE.md State Patterns S03
  - 🖐 关键行为: 仅在含至少一张卡片时显示、不可主动将卡片加入、卡片加入任一用户类别后自动离开

- [ ] T054 [US2] 实现 S06（用户类别空状态）Surface：empty-state（variant=category-empty）+ 主行动"选择文件"+ 次行动"查看全部卡片"，写入 src/renderer/surfaces/S06-CategoryEmpty.tsx
  - 📐 数据来源: spec.md US2 场景 14 + EXPERIENCE.md State Patterns S06

- [ ] T055 [US2] 实现 S08（卡片整理排序模式）Surface：reorder-control 集成到当前视图、禁用卡片主打开、UI 即时重排 + 异步写盘、礼貌级播报名称+位置+总数，写入 src/renderer/surfaces/S08-ReorderCards.tsx
  - 📐 数据来源: spec.md US2 场景 9-10 + EXPERIENCE.md State Patterns S08
  - 🖐 关键行为: 仅改变当前视图（不跨视图）、UI 移动下一帧即时生效（CHK016）、整理模式中卡片主体不可触发打开

- [ ] T056 [US2] 实现 S09（类别整理排序模式）Surface：reorder-control 仅对用户类别启用排序，"全部卡片"固定在顶部、"未分类"固定在底部，写入 src/renderer/surfaces/S09-ReorderCategories.tsx
  - 📐 数据来源: spec.md US2 场景 13 + EXPERIENCE.md State Patterns S09

- [ ] T057 [US2] 实现 S12（新建/重命名类别浮层）集成：category-editor-popover 锚定触发位置、窗口边缘自动避让、Enter 保存 Esc 取消并归还焦点，写入 src/renderer/surfaces/S12-CategoryEditor.tsx
  - 📐 数据来源: spec.md US2 场景 1-3 + EXPERIENCE.md State Patterns S12
  - 🖐 关键行为: 名称 ≤30 字符+非空+非保留名+不重名（去除首尾空格后）、创建成功后焦点回到"＋"按钮、重命名成功后类别名称即时更新

- [ ] T058 [US2] 实现 S13（删除类别确认）Surface：显示类别包含的卡片总数和将进入"未分类"的卡片数、确认后删除类别并将孤儿卡片移入"未分类"末尾、若删除的是当前视图→切换到 S01，写入 src/renderer/surfaces/S13-DeleteCategory.tsx
  - 📐 数据来源: spec.md US2 场景 5-7 + EXPERIENCE.md State Patterns S13

- [ ] T059 [US2] 实现 S14（删除卡片确认）Surface：全局删除警告 + "不会删除、移动或修改源文件"声明、确认后移除全部类别关系和视图顺序、取消则全部状态不变，写入 src/renderer/surfaces/S14-DeleteCard.tsx
  - 📐 数据来源: spec.md FR-010/FR-011 + EXPERIENCE.md State Patterns S14

### US2 — 测试

- [ ] T060 [P] [US2] 编写 useCategories hook 单元测试（类别增删改查全生命周期、保留名称拦截、未分类显示/隐藏逻辑），写入 tests/unit/useCategories.test.ts
- [ ] T061 [P] [US2] 编写 useSort hook 单元测试（UI 即时更新与异步持久化分离——CHK016 关键验证），写入 tests/unit/useSort.test.ts
- [ ] T062 [US2] 编写 UJ-3 E2E 测试（整理排序：多类别归属、排序调整、移出当前类别、各视图独立顺序验证），写入 tests/e2e/uj3-organize.spec.ts
  - 📐 验证标准: quickstart.md VS-3

---

## 第五阶段：用户故事 3 — 全局搜索与文件定位（优先级 P2）

**目标**: 用户可不切换类别按卡片名称搜索任意卡片，搜索结果实时筛选并按规则排序；可在文件管理器中定位任意卡片。8 个验收场景可独立验证。

**独立测试标准**: 在已有若干卡片的条件下，输入搜索词验证实时筛选和排序规则；对任意卡片执行"在文件管理器中显示"验证系统定位行为。

### US3 — 组件实现

- [ ] T063 [US3] 实现 global-search 组件，按契约实现常驻搜索框及 ARIA 播报，写入 src/renderer/components/global-search.tsx
  - 📐 契约: contracts/components.md#global-search（value / onChange / onClear props | role="searchbox" | aria-label="搜索卡片"）
  - 🎨 视觉: DESIGN.md → `{components.global-search}`（surface / text / border / focus / rounded.sm、非空时显示清空按钮）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#global-search（实时筛选 ≤200ms debounce、忽略首尾空格和英文大小写、排序规则: 完整名称匹配优先→名称开头匹配次之→其他包含匹配最后、同层级沿用"全部卡片"顺序、ARIA live region 礼貌级仅播报结果数）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T064 [P] [US3] 实现 category-tag 组件，按契约在"全部卡片"和搜索结果中展示关联类别，写入 src/renderer/components/category-tag.tsx
  - 📐 契约: contracts/components.md#category-tag（categories props、最多显示 2 个 + "+N" 溢出标记）
  - 🎨 视觉: DESIGN.md → `{components.category-tag}`（action 前景、canvas 背景、action 边框、rounded.sm）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#category-tag（仅在 S01 全部卡片和 S04 搜索结果中显示、S02/S03 隐藏、不可点击仅作识别）
  - ✅ WCAG 自检: axe DevTools 扫描通过

### US3 — Surface 实现

- [ ] T065 [US3] 实现 useSearch hook：带 debounce 的过滤逻辑、三级匹配打分（完整名称 > 名称开头 > 其他包含）、同层级按 allCardsOrder 排序、ARIA live region 礼貌级仅播报最新结果数（不播报每张卡片内容），写入 src/renderer/hooks/useSearch.ts
  - 📐 数据来源: spec.md FR-023/FR-024/FR-025/FR-023a + EXPERIENCE.md State Patterns S04

- [ ] T066 [US3] 实现 S04（全局搜索结果）Surface：global-search 输入框 + 过滤后的 file-card 网格 + category-tag 展示 + 无结果时降级到 S07 空状态 + ARIA live region，写入 src/renderer/surfaces/S04-SearchResults.tsx
  - 📐 数据来源: spec.md US3 场景 1-5、8 + EXPERIENCE.md State Patterns S04
  - 🖐 关键行为: 跨全部卡片实时匹配、同一张卡片在结果中只出现一次、左侧当前类别不变、清空搜索或 Esc 回到原类别视图

- [ ] T067 [US3] 实现 S07（搜索无结果状态）Surface：显示当前查询词 + 提供"清空搜索"操作，写入 src/renderer/surfaces/S07-NoSearchResults.tsx
  - 📐 数据来源: spec.md US3 场景 4 + EXPERIENCE.md State Patterns S07

- [ ] T068 [US3] 实现文件定位集成：串联 file-card 更多菜单和 S11 路径区域的"在文件管理器中显示"操作 → IPC 'shell:showItemInFolder' → 成功归还焦点 / 失败进入 S17，写入 src/renderer/hooks/useFileLocate.ts
  - 📐 数据来源: spec.md FR-028 + contracts/system-bridge.md X03

### US3 — 测试

- [ ] T069 [P] [US3] 编写 useSearch hook 单元测试（匹配打分逻辑、debounce 行为、排序规则、ARIA 播报逻辑），写入 tests/unit/useSearch.test.ts
- [ ] T070 [US3] 编写搜索与定位 E2E 测试（实时筛选、排序规则验证、清空/Esc 恢复、在文件管理器中显示），写入 tests/e2e/search-locate.spec.ts

---

## 第六阶段：用户故事 4 — 失败处理与卡片修复（优先级 P3）

**目标**: 文件打开失败/定位失败时明确反馈，允许重新关联文件而不丢失元数据；重复文件检测并引导查看原卡片；数据加载失败时阻断反馈；数据保存失败时阻断所有操作。8 个验收场景 + CHK029/CHK034 可独立验证。

**独立测试标准**: 模拟源文件不可访问（如重命名/移动文件），点击卡片验证失败反馈；通过"重新选择文件"修复关联，验证原有元数据完整保留；模拟磁盘满验证保存失败时的阻断行为。

### US4 — 组件实现

- [ ] T071 [US4] 实现 error-dialog 组件，按契约实现打开失败/定位失败/保存失败三种对话框变体，写入 src/renderer/components/error-dialog.tsx
  - 📐 契约: contracts/components.md#error-dialog（variant 区分 open-failed / locate-failed、cardName / onReSelect / onDelete / onClose props | role="alertdialog"）
  - 🎨 视觉: DESIGN.md → `{components.error-dialog}`（signal 使用 colors.warning、surface / text / border、rounded.md）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#error-dialog（标题区分打开失败与定位失败、初始焦点落在非破坏性的"重新选择文件"、删除操作必须转 S14 不可直接执行、关闭后卡片完整保留可再次点击重试）
  - 🔍 CHK029: error-dialog 新增 variant='save-failed'——标题"无法保存数据"、正文区分磁盘满 / 权限不足 / 文件被锁定三种原因、提供"重试保存 / 关闭应用"两个操作
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T072 [P] [US4] 实现 duplicate-dialog 组件，按契约实现源文件冲突对话框，写入 src/renderer/components/duplicate-dialog.tsx
  - 📐 契约: contracts/components.md#duplicate-dialog（existingCardName / existingCardId / onViewCard / onReSelect / onCancel props | role="alertdialog"）
  - 🎨 视觉: DESIGN.md → `{components.duplicate-dialog}`（signal 使用 colors.warning）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#duplicate-dialog（S18 冲突对话框、初始焦点落在"查看原卡片"、不创建第二张卡片且不覆盖已有关联、"重新选择"回到系统文件选择器、"取消"保持原关联不变）
  - ✅ WCAG 自检: axe DevTools 扫描通过

- [ ] T073 [US4] 实现 status-bar 组件，按契约实现非阻断成功反馈条，写入 src/renderer/components/status-bar.tsx
  - 📐 契约: contracts/components.md#status-bar（message / visible / onDismiss / triggerElementId props | role="status" | aria-live="polite"）
  - 🎨 视觉: DESIGN.md → `{components.status-bar}`（surface / text / signal 使用 colors.success / border / rounded.sm、锚定主区域底部不推动布局不遮挡卡片）
  - 🖐 行为: EXPERIENCE.md → Component Patterns#status-bar（至少保持 8 秒、可手动关闭、键盘焦点位于状态条内或指针悬停时暂停自动消失、关闭后焦点归还 triggerElementId 且不重复播报）
  - ✅ WCAG 自检: axe DevTools 扫描通过

### US4 — Surface 实现

- [ ] T074 [US4] 实现 S16（无法打开文件对话框）Surface：error-dialog（variant=open-failed）+ 重新选择→系统文件选择器→修复流程 + 删除→跳转 S14 + 关闭→保留卡片。同一卡片连续 3 次主打开失败后，关闭 S16 时 status-bar 提示"文件可能已移动，建议重新关联"，写入 src/renderer/surfaces/S16-OpenFailed.tsx
  - 📐 数据来源: spec.md US4 场景 1-6 + EXPERIENCE.md State Patterns S16 + spec Edge Cases 累积打开失败

- [ ] T075 [US4] 实现 S17（无法定位文件对话框）Surface：error-dialog（variant=locate-failed）+ 与 S16 共享修复机制，写入 src/renderer/surfaces/S17-LocateFailed.tsx
  - 📐 数据来源: spec.md US3 场景 7 + EXPERIENCE.md State Patterns S17
  - 🖐 关键行为: 与 S16 使用完全相同的修复代码路径、不预检查文件状态

- [ ] T076 [US4] 实现 S18（重复源文件冲突对话框）Surface：duplicate-dialog + 查看原卡片→跳转 S11 + 重新选择→系统文件选择器 + 取消→保持原关联，写入 src/renderer/surfaces/S18-DuplicateConflict.tsx
  - 📐 数据来源: spec.md US4 场景 4 + EXPERIENCE.md State Patterns S18

- [ ] T077 [US4] 实现应用数据加载状态（S01 加载中/加载失败）：加载中显示壳且所有交互控件不可聚焦/激活、加载失败显示非技术化阻断反馈"无法加载本地数据"+"重试"（仅重读同一文件不执行修复）+"关闭应用"、用户确认重建后以空数据覆盖并启动，写入 src/renderer/surfaces/AppLoadState.tsx
  - 📐 数据来源: spec.md US4 场景 7-8 + FR-036a + spec Edge Cases 数据文件损坏

- [ ] T078 [US4] 实现文件修复流程：统一的重新关联逻辑，覆盖 S11（编辑时主动更换）、S16（打开失败后修复）、S17（定位失败后修复）三种触发场景 → 系统文件选择器 → 校验无重复 → 更新 fileReference → 保留名称/备注/类别/各视图顺序 → status-bar 提示"已重新关联"。三种场景**必须调用同一函数**而非三个独立实现，写入 src/renderer/hooks/useFileRepair.ts
  - 📐 数据来源: spec.md FR-009（三场景统一修复）+ FR-031 + contracts/system-bridge.md X01 全部来源-落点映射表

- [ ] T079 [US4] 实现保存失败阻断 Surface：拦截 store:save IPC 返回的写入错误 → error-dialog（variant=save-failed）阻断用户所有操作直到解决；"重试保存"重试写入、"关闭应用"不保存直接退出，写入 src/renderer/surfaces/SaveFailed.tsx
  - 🔍 CHK029 (🔴 高风险): 保存失败时阻断所有操作——用户不得在不知情的情况下继续操作导致数据丢失。此 Surface 是 CHK029 的渲染端实现

### US4 — 测试

- [ ] T080 [P] [US4] 编写 JSON store 单元测试（数据损坏处理、空数据初始化、正常加载/保存循环、写入失败三种模式: disk-full / permission-denied / locked → 验证返回结构化错误而非静默），写入 tests/unit/store.test.ts
  - 🔍 CHK029: 覆盖 save 返回 `{ success: false }` 时不静默的断言、fsync 调用验证
- [ ] T081 [US4] 编写 UJ-4 E2E 测试（修复全流程：打开失败→重新选择→元数据保留验证、定位失败→同上修复流程、保存失败→阻断对话框验证、X02 选择不兼容应用后的系统行为验证、同一卡片连续 3 次打开失败→status-bar 累积提示验证），写入 tests/e2e/uj4-repair.spec.ts
  - 📐 验证标准: quickstart.md VS-4
  - 🔍 CHK029 + CHK034 + C1: 覆盖保存失败阻断 + X02 系统行为 + 累积失败提示

---

## 第七阶段：润色与跨领域关注点

**目标**: 无障碍审计、跨平台一致性、应用生命周期、响应式布局、边界案例、性能验证、需求质量合规审计。

### 无障碍审计

- [ ] T082 对 18 个 Surface 全部运行 axe-core 无障碍扫描，修复所有 WCAG 2.2 AA 违规，输出通过报告于 tests/a11y/
  - 📐 基线标准: spec.md FR-037~FR-040 + EXPERIENCE.md Accessibility Floor + constitution 原则 V
- [ ] T083 验证全键盘操作：Tab/Shift+Tab/方向键/Enter/Space/Esc 覆盖全部 4 条用户旅程（UJ-1~UJ-4），修复任何键盘陷阱，写入 tests/e2e/keyboard-a11y.spec.ts
  - 📐 验证标准: spec.md SC-006 + quickstart.md VS-7
- [ ] T084 验证屏幕阅读器播报：搜索结果数（礼貌级）、排序位置变化（礼貌级）、status-bar 提示（礼貌级）、对话框打开（阻断播报标题+关键后果）、表单校验错误（与字段关联）、保存失败阻断（CHK029），覆盖全部屏幕阅读器场景

### 需求质量合规审计（🔍 来自 checklists/quality.md）

- [ ] T085 审计全部 18 个 Surface 的文案是否符合"不得暗示同步/导入/导出/迁移/共享"规则（CHK020 🟠）：扫描每个 Surface 组件的可见文本、aria-label、placeholder、空状态引导和按钮标签，用正则匹配 同步/迁移/导入/导出/共享/云端/多设备 等关键词，命中则报错。通过标准: 0 个命中，写入 tests/a11y/no-sync-hints.audit.ts
  - 🔍 CHK020: 自动审计脚本，集成到 CI。预期结果: 0 个违规
- [ ] T086 审计全部文件操作代码路径是否符合"不预判文件状态"原则（CHK019 🟠）：验证 `shell.openPath()` 或 `shell.showItemInFolder()` 调用之前不存在 `fs.existsSync()`、`fs.access()` 或 `fs.stat()` 调用。编写 grep/ESLint 规则集成到 CI。通过标准: 0 个违规，写入 tests/a11y/no-precheck.audit.ts
  - 🔍 CHK019: 自动审计脚本。同时在本任务注释中登记已知不可检测的 OS 级静默失败风险——`shell.openPath` 返回成功但文件因 OS 竞态条件未实际打开、OS 缓存未刷盘导致数据文件写入后丢失——这两种情况应用层面无法检测，已记录为 V1 可接受风险（plan.md Constraints）

### 响应式与平台

- [ ] T087 验证响应式布局：1024×720 设计基线→三列卡片网格、760×560 最小窗口→一列卡片纵向滚动、大于常规窗口→按可用宽度增加列数；主内容区无横向滚动条；左侧栏固定 208px 不折叠，写入 src/renderer/styles/
  - 📐 验证标准: spec.md SC-007 + EXPERIENCE.md Responsive & Platform
- [ ] T088 验证 200% 文本/显示缩放等效条件：无文字裁切、无控件遮挡、无功能丢失；模态框内容可滚动且操作区始终可达，写入验证报告
  - 📐 验证标准: spec.md SC-007 + quickstart.md VS-8
- [ ] T089 跨平台验证：在 Windows 10+ (x64) 和 macOS 12+ (x64+arm64) 上分别执行全部 4 条用户旅程 E2E 测试；验证系统原生对话框（X01/X02/X03/X04）遵循各平台规范；增补 X04 子验证项——OS 安全提示结束后焦点回到原 file-card 主体，不落在对话框或空白区域（CHK M3）
  - 📐 验证标准: spec.md SC-005 + FR-034

### 单实例与退出生命周期

- [ ] T090 验证应用生命周期：关闭窗口→全部相关进程退出、应用内"退出"→全部相关进程退出、重复启动→不新增进程组并聚焦已有窗口、冷启动→进入"全部卡片"，写入 tests/e2e/lifecycle.spec.ts
  - 📐 验证标准: spec.md FR-036b + quickstart.md VS-5
  - 🔍 CHK042: 重复启动时已有窗口最小化→恢复、显示并聚焦同一窗口

### 数据持久化

- [ ] T091 验证数据持久化：创建若干卡片和类别→退出→重启→验证全部数据恢复、系统重启→验证、模拟正常升级→验证，写入 tests/e2e/persistence.spec.ts
  - 📐 验证标准: spec.md SC-004 + FR-036 + quickstart.md VS-6

### 性能与边界

- [ ] T092 验证搜索性能：加载 500 张卡片后搜索 debounce ≤200ms、排序 UI 即时更新 <16ms
  - 📐 性能基准: plan.md Performance Goals
- [ ] T093 验证 JSON 存储性能：500 张卡片/50 个类别的全量写入+读取循环 <50ms
  - 📐 性能基准: plan.md Constraints
- [ ] T094 验证边界案例：模态不堆叠、长卡片名称仅视觉截断（可访问名称完整）、长备注两行截断、类别名截断时可访问名称完整、快速开关对话框等，写入 tests/e2e/edge-cases.spec.ts
- [ ] T095 验证并发点击安全性：快速点击两张不同卡片→触发两次独立打开请求（互不干扰）；快速双击同一张卡片→不触发两次系统打开对话框，写入 tests/e2e/concurrent.spec.ts
  - 🔍 CHK032 (🟡): E2E 验证并发点击安全。并发预期: 不同卡片独立调用 openFile 无锁、同一卡片 300ms 内重复点击忽略后续调用

### 全局样式

- [ ] T096 编写全局 CSS：CSS reset + BEM 命名约定（前缀 `qc-*`）+ reduced-motion 媒体查询（关闭非必要过渡动画，状态立即切换），写入 src/renderer/styles/global.css
  - 🎨 视觉来源: DESIGN.md Do's and Don'ts + Brand & Style
  - 🖐 行为来源: EXPERIENCE.md Interaction Primitives 动效（焦点/悬停/浮层出现保持短过渡，系统"减少动态效果"开启时取消过渡）

---

## 任务依赖关系

```
第一阶段（搭建）
    │
    ▼
第二阶段（基础设施）← T019（CHK029 写入失败处理）、T020（CHK019 不预检原则）
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
第三阶段（US1: P1）🎯 MVP           （US1 测试可独立执行）
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
第四阶段（US2: P2）                 第五阶段（US3: P2）
    │                                      │
    └──────────────┬───────────────────────┘
                   ▼
           第六阶段（US4: P3）← T079（保存失败阻断 Surface）、T071（error-dialog 新增 save-failed 变体）
                   │
                   ▼
           第七阶段（润色）← T085（CHK020 文案审计）、T086（CHK019 代码路径审计）、T090（CHK042 单实例聚焦）、T095（CHK032 并发安全）
```

- **第四和第五阶段可并行开发**（不同文件、不同 Surface、无代码依赖）
- **第六阶段依赖第三阶段的 file-card + card-form-dialog**（错误对话框从卡片触发，修复回写卡片关联）
- **T079（保存失败阻断 Surface）依赖 T019（store 写入错误返回）+ T071（error-dialog 新增变体）**

## 并行执行示例

### 第二阶段内并行:
```bash
# 5 个共享层文件可同时开发:
T009 types.ts
T010 constants.ts
T011 validation.ts
T012 tokens.css  ← 含 focus-visible + font-family
T015 preload/index.ts
```

### 第三阶段内并行:
```bash
# 4 个无依赖组件可同时开发:
T027 app-shell.tsx
T028 toolbar-button.tsx
T033 file-type-mark.tsx
T034 empty-state.tsx
```

### 第四阶段 + 第五阶段跨 Story 并行:
```bash
# Agent A: US2 分类管理
T047 category-item.tsx → T048 category-nav.tsx → T049 reorder-control.tsx → ...

# Agent B: US3 搜索定位
T063 global-search.tsx → T065 useSearch.ts → T066 S04-SearchResults.tsx → ...
```

## 实现策略

### MVP 交付（第一 + 第二 + 第三阶段）

**目标**: 完成 US1（文件收录与快速打开），应用可运行并交付核心价值。

```
T001-T008（搭建，8 个任务）
    → T009-T026（基础设施，18 个任务）← 含 T019 CHK029 写入失败处理
    → T027-T042（US1 组件 + Surface，16 个任务）← 含 T037/T038 CHK034 保存阻断
    → T043-T046（US1 测试，4 个任务）
= 46 个任务 → 可工作的 MVP（收录文件 + 快速打开 + 保存失败保护）
```

### 增量交付路线

1. **MVP** (US1): 收录文件 → 创建卡片 → 点击打开。价值: 不再翻找路径。
2. **+US2**: 分类 + 排序（CHK016 即时 UI + debounce 写盘）。价值: 规模化组织。
3. **+US3**: 搜索 + 定位。价值: 快速发现。
4. **+US4**: 失败修复 + 保存失败阻断（CHK029/CHK034 完整闭环）+ 累积失败提示（C1）。价值: 韧性。
5. **+润色**: 无障碍审计 + 跨平台验证 + 需求质量合规审计（CHK019/CHK020/CHK042/CHK032）。价值: 质量基线。

---

## 任务统计

| 阶段 | 所属 Story | 任务数 | Checklist 覆盖 |
|------|-----------|--------|---------------|
| 1: 搭建 | — | 8 (T001-T008) | — |
| 2: 基础设施 | — | 18 (T009-T026) | 🔴 CHK029 (T019)、🟠 CHK019 (T020)、CHK010 (T014)、🟡 CHK037 (T021) |
| 3: US1 (P1) 🎯 | 收录与打开 | 20 (T027-T046) | 🔴 CHK034 (T037/T038)、🟠 CHK020 (T034)、🟠 CHK019 (T027) |
| 4: US2 (P2) | 分类与排序 | 16 (T047-T062) | 🟠 CHK016 (T049, T051) |
| 5: US3 (P2) | 搜索与定位 | 8 (T063-T070) | — |
| 6: US4 (P3) | 失败与修复 | 11 (T071-T081) | 🔴 CHK029 (T071, T079, T080, T081)、🔴 CHK034 (T081)、C1 (T074, T081) |
| 7: 润色 | — | 15 (T082-T096) | 🟠 CHK020 (T085)、🟠 CHK019 (T086)、CHK042 (T090)、CHK032 (T095) |
| **总计** | | **96** | 2🔴 + 3🟠 + 3🟡 + C1/C2 = 全部已覆盖 |

## 视觉/行为/质量合规对照

| 前缀 | 引用文件 | 含义 |
|------|---------|------|
| 📐 契约 | `contracts/components.md` | Props 签名、ARIA 角色和属性 |
| 🎨 视觉 | `DESIGN.md` | 颜色/字体/间距/圆角 token |
| 🖐 行为 | `EXPERIENCE.md` | 焦点管理、键盘交互、Surface 状态转换、ARIA live region |
| 🔍 质量 | `checklists/quality.md` | 需求质量审计——CHK### 条目作为额外验收条件 |
| ✅ WCAG 自检 | constitution 原则 V | 每个 UI 组件完成后必须用 axe DevTools 扫描确认无 WCAG 2.2 AA 违规 |
