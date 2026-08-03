# FR-Task 映射表

**Feature**: 001-local-file-navigator
**生成时间**: 2026-07-23
**检查状态**: 首次运行

| FR | 简述 | 验收条件 | 负责 Task | 单元测试 | E2E | 状态 |
|----|------|---------|----------|---------|-----|------|
| FR-001 | 系统文件选择器一次选一个文件 | 选择器返回单文件，取消不创建记录 | T020 (shell.ts selectFile), T037 (S10) | ✅ shell.test.ts | ✅ | PASS |
| FR-002 | 保存前确认步骤 | 模态框显示可修改名称+可多选类别 | T032 (card-form-dialog), T037 (S10) | ✅ card-form-dialog.test.tsx | ❌ | ⚠️ MISSING_E2E |
| FR-002a | 有修改关闭时 S15 确认 | 关闭前比对 initialData，有差异弹确认 | T035 (confirmation-dialog), T039 (S15) | ✅ confirmation 存在但未测此路径 | ❌ | ⚠️ MISSING_E2E |
| FR-003 | HTML 文件取 `<title>` 为默认名 | 选 .html → 表单预填页面标题 | T021 (readHtmlTitle), T037 (S10 surface), T024 (useCards.addCard) | ✅ useCards 测了 title | ❌ | ✅ FIXED (2026-07-23) |
| FR-004 | 非 HTML 用不含扩展名文件名 | 选 .pdf → 预填 "report" | T037 (S10 surface), T024 (useCards.addCard) | ✅ useCards 覆盖 | ❌ | ⚠️ MISSING_E2E |
| FR-005 | 一源文件一卡片 | 选已收录文件 → S18 冲突对话框 | T024 (useCards.findDuplicateByPath), T076 (S18) | ✅ useCards.test.ts | ✅ edge-cases | PASS |
| FR-006 | 卡片名 ≤80 非空不重名 | 表单校验 + addCard 兜底检查 | T029 (form-field), T032 (card-form-dialog), T024 (useCards.addCard) | ✅ validation.test.ts + card-form-dialog.test.tsx | ✅ edge-cases | PASS |
| FR-007 | 编辑模态框修改名称/备注/类别/文件 | S11 打开 edit mode | T038 (S11 surface), T032 (card-form-dialog edit mode) | ✅ card-form-dialog.test.tsx | ❌ | ⚠️ MISSING_E2E |
| FR-008 | 只读路径 + 复制 + 在文件管理器中显示 | S11 中路径只读、可复制、可定位 | T029 (form-field readonly-path), T038 (S11), T068 (useFileLocate) | ⚠️ form-field 有 copy 但无定位测试 | ❌ | ⚠️ MISSING_E2E |
| FR-009 | 三场景统一修复 | S11/S16/S17 → 同一 repairFile() | T078 (useFileRepair) | ❌ 无独立 repairFile 单元测试 | ❌ | 🔴 MISSING_TEST |
| FR-010 | 全局删除卡片前 S14 确认 | error dialog 删除 → S14 → 确认 → 执行 | T059 (S14), T079 (app-shell handleErrorDelete) | ✅ app-shell test 覆盖 | ❌ | ⚠️ MISSING_E2E |
| FR-011 | 删除只影响应用内数据 | 源文件不删除/移动/修改 | T059 (S14 文案), T086 (CHK019 审计) | ✅ CHK019 审计 0 违规 | ✅ persistence | PASS |
| FR-012 | 类别 CRUD | 创建/重命名/删除/排序 | T025 (useCategories), T048 (category-nav) | ✅ useCategories.test.ts | ❌ | ⚠️ MISSING_E2E |
| FR-013 | 类别名 ≤30 非空非保留名不重名 | 表单校验 | T011 (validation), T031 (category-editor-popover) | ✅ validation.test.ts | ❌ | ⚠️ MISSING_E2E |
| FR-014 | "全部卡片""未分类"为保留名 | 校验拦截 | T010 (constants), T025 (useCategories) | ✅ useCategories.test.ts | ❌ | PASS |
| FR-015 | 未分类不可勾选 | category-checklist 中灰显 | T030 (category-checklist) | ❌ 无独立 checklist 测试 | ❌ | ⚠️ MISSING_TEST |
| FR-016 | 至少 1 类别 + 多类别时才能移出 | 移出禁用逻辑 | T030 (category-checklist), T052 (S02) | ❌ 无测试 | ❌ | 🔴 MISSING_TEST |
| FR-017 | 删除类别确认 + 孤儿进未分类 | S13 显示总数 + 进入未分类数 | T058 (S13), T025 (useCategories.deleteCategory) | ✅ useCategories 测了 orphan | ❌ | ⚠️ MISSING_E2E |
| FR-018 | 未分类有卡片时显示 + 加入类别后自动离开 | 显示/隐藏逻辑 | T053 (S03), T025 (useCategories) | ✅ useCategories 测了 visibility | ❌ | PASS |
| FR-019 | 固定左侧栏 + 右侧主区单窗口 | 208px sidebar + flex main，关闭窗口彻底退出 | T013 (index.ts), T027 (app-shell), T048 (category-nav) | ✅ app-shell.test.tsx + main-lifecycle.test.ts | ✅ lifecycle | PASS |
| FR-020 | 冷启动进全部卡片 / 重复启动聚焦已有窗口 | single-instance lock + second-instance 聚焦 | T013 (index.ts), T042 (S01) | ✅ main-lifecycle.test.ts | ✅ lifecycle | PASS |
| FR-021 | 各视图独立手动顺序 | viewOrders 数组 per viewType | T023 (AppState), T049 (reorder-control) | ✅ useSort.test.ts | ❌ | ⚠️ MISSING_E2E |
| FR-022 | 整理模式禁用主打开 + 立即生效 | UI <16ms 更新 | T049 (reorder-control), T055 (S08) | ✅ useSort 测了即时更新 | ❌ | ⚠️ MISSING_E2E |
| FR-023 | 全局搜索跨全部卡片实时匹配 | useSearch 搜索名称为全部卡片 | T063 (global-search), T065 (useSearch) | ✅ useSearch.test.ts (10 tests) | ✅ search-locate | PASS |
| FR-023a | 搜索 ARIA live 礼貌级播报 | 仅报结果数不报每个卡片 | T065 (useSearch) | ✅ useSearch 测了播报逻辑 | ❌ | ⚠️ MISSING_E2E |
| FR-024 | 搜索排序: 完整→开头→包含 | 三级打分+同层 allCardsOrder | T065 (useSearch) | ✅ useSearch.test.ts (scoring) | ✅ search-locate | PASS |
| FR-025 | 搜索忽略首尾空格/大小写/不搜备注/路径 | 正则处理 | T065 (useSearch) | ✅ useSearch.test.ts | ❌ | PASS |
| FR-026 | 点击卡片直接请求 OS 打开，不预判 | shell.openPath 无 fs.existsSync 预检 | T020 (shell.ts openFile), T040 (file-card) | ✅ shell.test.ts + CHK019 审计 | ❌ | ⚠️ MISSING_E2E |
| FR-027 | 无默认关联应用 → X02 选择打开方式 | shell.openPath 返回 no-default-app | T020 (shell.ts openFile) | ✅ shell.test.ts | ❌ | PASS |
| FR-028 | 在文件管理器中显示 | Windows 资源管理器 / macOS Finder | T020 (shell.ts showItemInFolder), T068 (useFileLocate) | ✅ shell.test.ts | ❌ | ⚠️ MISSING_E2E |
| FR-029 | 打开失败 → S16 对话框 | error-dialog open-failed | T074 (S16), T071 (error-dialog) | ✅ error-dialog 存在 | ✅ uj4-repair | PASS |
| FR-030 | 定位失败 → S17 对话框 | error-dialog locate-failed | T075 (S17), T071 (error-dialog) | ✅ error-dialog 存在 | ✅ uj4-repair | PASS |
| FR-031 | 重新关联保留元数据 | repairFile 保留 name/note/categories/orders | T078 (useFileRepair), T079 (app-shell) | ✅ useCards.repairFile tested | ✅ uj4-repair | PASS |
| FR-032 | 备注 ≤500 含换行 | 校验 + 截断 | T029 (form-field textarea), T038 (S11) | ✅ validation.test.ts | ❌ | PASS |
| FR-033 | 首页备注最多两行超出省略 | CSS line-clamp | T040 (file-card) | ✅ file-card 测了 note render | ❌ | PASS |
| FR-034 | Win + macOS 版本一致 | electron-builder NSIS + DMG | T089 (platform verify) | ❌ 未做 | ❌ | 🔴 MISSING_E2E |
| FR-035 | 不提供迁移/同步/导入/导出 | 功能排除 + UI 不暗示 | T036 (S05 文案), T085 (CHK020 审计) | ✅ CHK020 0 hits | ❌ | PASS |
| FR-036 | 正常关闭/重启/升级保留数据 | JSON fsync 持久化 | T016 (store.ts), T014 (lifecycle), T091 (persistence E2E) | ✅ store.test.ts | ✅ persistence | PASS |
| FR-036a | 数据损坏 → 阻断 + 重试 + 重建 | loadError 状态 → error UI | T017 (store.ts), T077 (AppLoadState), T079 (app-shell C3 fix) | ✅ app-shell 测了 error state | ❌ | ⚠️ MISSING_E2E |
| FR-036b | 单实例 + 关闭彻底退出 | requestSingleInstanceLock；close → window-all-closed → app.quit | T014 (index.ts lifecycle), T090 (lifecycle E2E) | ✅ main-lifecycle.test.ts | ✅ lifecycle | PASS |
| FR-037 | 全键盘操作 Tab/方向键/Enter/Space/Esc | keyboard workflow | T083 (keyboard E2E) | ✅ keyboard-a11y.spec.ts | ✅ | PASS |
| FR-038 | 状态不只用颜色区分 | icon + text + border 组合 | 多个组件 | ⚠️ 审计通过但无逐组件验证 | ❌ | PASS |
| FR-039 | 卡片独立可访问名称 | file-card aria-label | T040 (file-card) | ✅ file-card.test.tsx | ❌ | PASS |
| FR-040 | 200% 缩放无裁切/遮挡/功能丢失 | responsive + zoom | T088 (zoom verify) | ❌ 未做 | ❌ | 🔴 MISSING_E2E |

## 统计

| 状态 | 数量 | FR IDs |
|------|------|--------|
| 🔴 MISSING_UI | 1 | FR-003 |
| 🔴 MISSING_TEST | 2 | FR-009, FR-016 |
| 🔴 MISSING_E2E | 2 | FR-034, FR-040 |
| ⚠️ MISSING_E2E | 16 | FR-002/002a/004/007/008/010/012/013/017/021/022/023a/026/028/036a 等 |
| ✅ PASS | 23 | — |
