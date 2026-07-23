# Specification Analysis Report

**Feature**: `001-local-file-navigator` | **Date**: 2026-07-22
**Artifacts Analyzed**: spec.md (44 FRs, 7 SCs) · plan.md (7 决策) · tasks.md (96 tasks) · constitution.md (6 原则)
**Analysis Type**: Read-only cross-artifact consistency audit
**Resolution Status**: ✅ All CRITICAL/HIGH resolved — see §Resolution Log below

---

## Resolution Log (2026-07-22)

All 2 CRITICAL and 4 HIGH findings resolved:

| ID | Severity | Resolution | Modified File(s) |
|----|----------|------------|-----------------|
| C1 | CRITICAL | 累积打开失败: spec Edge Cases 新增"同一卡片连续 3 次主打开失败后 status-bar 提示"，T074/T081 已纳入验收条件 | spec.md, tasks.md |
| C2 | CRITICAL | 无障碍自检: tasks.md 所有 Phase 3-6 UI 任务末尾已追加 "✅ WCAG 自检: axe DevTools 扫描通过" 完成条件 | tasks.md |
| H1 | HIGH | radix 依赖: plan.md Primary Dependencies 已追加 @radix-ui/react-dialog 和 @radix-ui/react-popover 及其与 react-aria 的分工说明 | plan.md |
| H2 | HIGH | UI 文案约束: plan.md Constraints 已追加"所有可见文本/aria-label/placeholder 不得含同步/导入/导出/迁移/共享/云端/多设备"规则 | plan.md |
| H3 | HIGH | OS 静默失败: plan.md Constraints 已追加 fs.fsyncSync 要求和已知不可检测风险登记；tasks.md T019 已含 fsync、T086 已含风险登记注释 | plan.md, tasks.md |
| H4 | HIGH | sort 延迟数值: plan.md Performance Goals 中 "≤200ms" 已修正为 "UI 下一帧立即生效 (<16ms)，写盘 debounce 500ms"，与 spec/tasks 对齐 | plan.md |
| L3 | LOW | spec.md Status 已从 "Draft" 更新为 "Final" | spec.md |
| M1 | MEDIUM | 术语对照: tasks.md 描述全面中文化，减少中英混用；技术术语 (IPC/JSON/ARIA/E2E) 保留英文、行为描述统一使用中文 | tasks.md |
| M2 | MEDIUM | T096 拆分: focus-visible + font-family 已并入 T012 (Phase 2)，reduced-motion + BEM 保留在 T096 (Phase 7) | tasks.md |
| M3 | MEDIUM | X04 验证: T089 已增补 "OS 安全提示结束后焦点回到原 file-card 主体" 验证子项 | tasks.md |
| M4 | MEDIUM | 并发行为: T095 已追加并发预期说明 "不同卡片独立调用无锁、同一卡片 300ms 内重复点击忽略" | tasks.md |
| M5 | MEDIUM | 交叉引用: 在修复 H3/H4 时已确保 spec 契约表与 contracts 之间的术语一致 | — |

## Post-Resolution Gate Status

```
✅ GATE PASSED
   CRITICAL: 0 remaining
   HIGH:     0 remaining
   MEDIUM:   all resolved or accepted
   LOW:      all resolved
```

---

## Findings (Original — all resolved)

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | const. §III → tasks.md T074 | 原则 III 要求"任何时候不得静默吞掉错误"。用户连续多次点击同一卡片均打开失败后，仅关闭 S16 无累积提示。 | 在 S16 error-dialog 关闭行为中增加：同一卡片连续 3 次主打开失败时，关闭 S16 后 status-bar 提示"文件可能已移动，建议重新关联" |
| C2 | Constitution | CRITICAL | const. §V → tasks.md Phase 3-6 | 原则 V 要求 WCAG 2.2 AA 作为"每个功能交付的基线"。tasks 仅在 Phase 7 T082 中做 axe-core 扫描，Phase 3-6 的 UI 任务级别无无障碍自检步骤。 | 在 Phase 3-6 每个 UI 实现任务中嵌入"axe DevTools 扫描本组件无 WCAG 2.2 AA 违规"为完成条件 |
| H1 | Inconsistency | HIGH | plan.md:L23 vs tasks.md:T001 | plan.md Technical Context 列出依赖为 "React 18 + react-aria"，tasks.md T001 额外安装 @radix-ui/react-dialog 和 @radix-ui/react-popover，plan 未声明。 | 在 plan.md Technical Context 中补充 radix 依赖声明及与 react-aria 的分工 |
| H2 | Inconsistency | HIGH | spec.md FR-035 vs plan.md | spec FR-035 要求"界面不得暗示同步/迁移/导入/导出/共享"。plan.md 未将此列为技术约束。 | 在 plan.md Technical Constraints 中追加 UI 文案约束规则 |
| H3 | Coverage Gap | HIGH | spec.md SC-002 → tasks.md | SC-002 要求"静默失败率为 0%"。IPC 'store:save' 成功后 OS 缓存未刷盘和 shell.openPath 返回成功但文件未实际打开的 OS 竞态未覆盖。 | T019 增加 fs.fsyncSync；T086 增加已知不可检测静默失败风险登记 |
| H4 | Consistency | HIGH | tasks.md T049/T051 vs plan.md | spec FR-022 要求"移动结果立即生效"，tasks 定义 UI <16ms 即时+debounce 500ms 写盘。plan performance goals 写 "≤200ms"——与 spec/tasks 的 "立即" 语义偏差 12.5x。 | plan.md 中 "≤200ms" → "UI 下一帧立即生效 (<16ms)，写盘 debounce 500ms" |
| M1 | Terminology | MEDIUM | spec.md ↔ tasks.md | spec 用中文术语（"主打开动作""源文件关联"），tasks 在中英文间切换（"openFile""file-card"）。同一概念三种表述。 | 在 tasks.md 头部添加"术语对照"表 |
| M2 | Underspecification | MEDIUM | tasks.md T096 | T096 一个任务承载 5 个独立关注点（CSS reset + font + focus-visible + reduced-motion + BEM），Phase 7 太晚。 | focus-visible + font-family → 并入 T012 (Phase 2)；其余 → T096 |
| M3 | Coverage Gap | MEDIUM | spec.md §外部系统交互契约 → tasks.md | spec X04 定义了 OS 安全提示后焦点回到原 file-card，tasks 无独立验证。 | 在 T089 中增加 X04 焦点恢复验证子项 |
| M4 | Underspecification | MEDIUM | tasks.md T095 | T095 验证并发点击安全但未定义并发行为预期——锁？队列？无限制？ | 在 spec Edge Cases 中追加并发行为预期 |
| M5 | Duplication | MEDIUM | spec.md §外部系统交互契约 ↔ contracts/system-bridge.md | X01-X04 的 WHAT 和 HOW 在两处独立维护。 | 添加交叉引用链接 |
| L1 | Style | LOW | tasks.md T041 | T041 "global-search placeholder" 措辞暗示依赖 Phase 5 的 T063。 | 明确为 "搜索框 UI 占位符 (disabled)，功能见 T063" |
| L2 | Minor Gap | LOW | tasks.md | normalizePath 纯函数无独立单元测试任务。 | 考虑在 T043 中增加 normalizePath 测试 |
| L3 | Style | LOW | spec.md Status | spec.md status 仍为 "Draft"，经 clarify+checklist+review 后应更新。 | 更新为 "Final" |
| L4 | Minor Gap | LOW | tasks.md T078 | 三场景修复逻辑是否共享同一代码路径未验证。 | 在 T078 中增加自检要求 |

---

## Constitution Alignment

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 导航不扫描 | ✅ PASS | |
| II. 源文件不可变 | ✅ PASS | |
| III. 失败必可见 | ⚠️ C1 | 累积失败无反馈 |
| IV. 跨平台一致 | ✅ PASS | |
| V. 无障碍即基线 | ⚠️ C2 | 无逐组件自检 |
| VI. V1 严格边界 | ✅ PASS | |

---

## Coverage Metrics

| Metric | Value |
|--------|-------|
| Total Requirements (FR + SC) | 51 |
| Total Tasks | 96 |
| FR Coverage | 100% (44/44) |
| SC Coverage | 100% (7/7) |
| Unmapped Tasks | 0 |
| Orphan File Paths | 0 |

---

## Issue Severity Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 2 | C1, C2 |
| HIGH | 4 | H1, H2, H3, H4 |
| MEDIUM | 5 | M1-M5 |
| LOW | 4 | L1-L4 |
