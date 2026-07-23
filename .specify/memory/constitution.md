<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (6 principles)
    - Technical Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed (generic template)
    - .specify/templates/spec-template.md ✅ no changes needed (generic template)
    - .specify/templates/tasks-template.md ✅ no changes needed (generic template)
  Follow-up TODOs: none
-->

# 速查工具 Constitution

## Core Principles

### I. 导航不扫描 (Navigate, Don't Scan)

应用是导航工具，不是文件管理器或搜索引擎。用户通过系统文件选择器**明确选择**单个源文件来创建卡片；应用不得扫描磁盘、遍历目录、自动发现文件或批量导入。V1 不做任何形式的自动文件发现。

**规则：**
- 所有卡片必须由用户通过 X01（系统文件选择器）主动创建
- 不得实现目录扫描、文件系统监听或自动导入功能
- 不得根据文件内容推断、建议或预填充卡片信息（HTML `<title>` 除外）
- "全部卡片"是唯一汇总视图，不可移除或重命名

### II. 源文件不可变 (Source File Immutability)

应用**只维护导航元数据**（卡片名称、备注、类别关系和视图顺序），不得对源文件执行删除、移动、重命名、修改或内容写入操作。这是不可协商的安全边界。

**规则：**
- 新增、编辑、删除卡片不得修改源文件
- 删除卡片确认文案必须声明"不会删除、移动或修改源文件"
- 删除类别只影响类别及其关系，不影响卡片和源文件
- 所有产品文案在提及删除时必须区分"应用内数据"和"源文件"
- 不得在应用内提供源文件内容预览、渲染或编辑能力

### III. 失败必可见 (No Silent Failures)

每一个可能失败的操作都必须提供**明确、可操作的反馈**。用户绝不能面对无响应的界面猜测发生了什么。所有失败状态都有定义的 Surface 和后续动作。

**规则：**
- 主打开失败 → S16（无法打开文件对话框），提供重新选择、删除、关闭
- 定位失败 → S17（无法定位文件对话框），提供重新选择、删除、关闭
- 校验失败 → 就地错误文案+聚焦首个无效字段，清楚说明修复方式
- 重复源文件冲突 → S18（重复冲突对话框），提供查看原卡片入口
- 加载失败 → 非技术化阻断反馈，初始焦点在"重试"
- 任何时候不得静默吞掉错误或显示空白状态代替失败反馈

### IV. 跨平台一致 (Cross-Platform Parity)

Windows 与 macOS 构建版本必须保持**相同的能力、业务规则和验收标准**。平台差异严格限制在操作系统原生交互层面。

**规则：**
- 所有 FR（功能需求）和 NFR（非功能需求）在两个平台上验收结果一致
- 平台差异仅限于：系统文件选择器、选择打开方式、资源管理器/Finder、安全提示和窗口控制
- 产品 UI 不得包含平台专属业务流程或功能入口
- 不可绕过或屏蔽操作系统的安全提示（X04）
- 两端独立维护本地数据，不迁移、不同步、不导入导出

### V. 无障碍即基线 (Accessibility as Baseline)

WCAG 2.2 AA 不是 stretch goal，而是**每个功能交付的基线要求**。每项功能必须有完整的键盘路径，状态不能仅靠颜色区分，辅助技术必须能感知所有 Surface 的状态变化。

**规则：**
- 每项功能可用 Tab、方向键、Enter、Space、Esc 完成，不依赖全局组合快捷键
- 焦点可见外环使用 `{colors.focus}`（紫色），不与 `{colors.action}`（绿色）当前态混淆
- 错误、成功、警告、禁用和选中状态必须同时有非颜色信号（图标、文字、边框变化）
- 搜索结果更新、排序变化、status-bar 使用礼貌级 ARIA live region 播报
- 阻断对话框打开时播报标题和关键后果
- 200% 文本缩放下无文字裁切、控件遮挡或功能丢失
- 每张卡片主体与更多按钮具有独立可访问名称

### VI. V1 严格边界 (Strict V1 Boundary)

PRD 第 6 节"范围与非目标"是功能边界的**唯一权威来源**。超出范围的需求属于后续版本，不得在 V1 实现中引入。

**规则：**
- 范围内：单文件收录、卡片管理、多类别归属、手动排序、全局名称搜索、系统打开、失败修复、双平台运行
- 明确排除（V1 不做）：自动扫描、文件夹导入、批量操作、富文本备注、Markdown、标签、收藏、最近打开、团队共享、云同步、深色主题、密度偏好、数据导入导出
- 任何提议超出 PRD 范围的功能必须在 plan 阶段明确标记为 V2+，不得"顺手做掉"
- 容量声明：V1 不设硬上限，但也不承诺无限容量；实际承载由 plan 阶段估算

## Technical Constraints

以下技术决策在当前阶段未被冻结，必须在 `speckit-plan` 阶段收敛并记录于 plan.md：

- **桌面框架：** Electron 或 Tauri 二选一，决策依据包括包体积、内存占用、原生集成度和跨平台构建复杂度
- **数据存储：** 本地文件（JSON/SQLite/其他），只存储卡片元数据，不存储源文件副本
- **文件唯一性算法：** 跨平台规范化的源文件身份判定方式
- **构建与分发：** 安装包格式、代码签名策略、自动更新机制
- **测试框架：** 与所选技术栈匹配的单元测试、集成测试和 E2E 测试方案

**不可协商的技术约束：**
- 纯本地应用，无云后端依赖，无遥测或用户行为追踪
- 单窗口桌面应用，不引入浏览器或移动端 UI 范式
- 必须遵循操作系统安全边界，可执行文件与脚本允许收录但不得绕过 OS 安全提示
- 产品自身 UI 仅简体中文，系统原生界面跟随系统语言

## Development Workflow

项目采用 **spec-driven** 开发流程：

```
constitution → spec → plan → tasks → implement → review
```

1. **Constitution（本文档）：** 定义不可协商的原则和约束，所有后续文档和代码必须遵守
2. **Spec：** 基于 PRD + DESIGN + EXPERIENCE 生成简洁的功能规格 `SPEC.md`，锁定 WHAT
3. **Plan：** 技术方案、架构决策、数据模型、组件树、路由设计
4. **Tasks：** 按用户故事拆解可独立实现和测试的任务，标注并行性与依赖
5. **Implement：** 逐任务实现，每个任务完成后验证
6. **Review：** 代码审查确认符合 constitution 原则和 design/experience spine

**质量门禁：**
- PRD 中的 26 个 FR 和 7 个 NFR 必须在 spec 中被覆盖
- DESIGN.md 和 EXPERIENCE.md 是视觉与交互的权威契约，实现偏差必须在 code review 中标记
- 每次 review 需对照 constitution 六项原则做合规检查
- 源文件安全（原则 II）和无障碍基线（原则 V）的违反是阻塞性问题

## Governance

本 Constitution 是项目最高决策依据，优先级高于任何单次对话中的临时决定。

**修订流程：**
1. 提议修订并说明理由（为什么现有原则不适用或缺失）
2. 评估对已有 spec/plan/tasks 的影响
3. 更新 constitution 并递增版本号
4. 按 Sync Impact Report 同步更新受影响的模板和文档

**版本策略：**
- MAJOR：移除或重新定义核心原则，导致向下不兼容的治理变更
- MINOR：新增原则或实质性扩展已有指导
- PATCH：澄清措辞、修正笔误、非语义精炼

**合规审查：**
- 每次 spec 产出前对照 constitution 做原则合规检查
- 每次 plan 产出前确认技术约束已收敛
- Code review 必须验证实现不违反源文件安全和无障碍基线

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
