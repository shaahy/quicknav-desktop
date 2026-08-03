# Spec Kit Flow-Forward 增量开发实战教程 PRD

## 1. 问题是什么

需要把 Spec Kit 的 flow-forward 从概念说明深化为一套可直接执行的现有项目增量开发教程，重点回答：

1. “新建 feature”到底是新建 Git 分支，还是新建 `specs/` 目录。
2. 已上线项目如何从默认分支和线上基线开始一次新需求。
3. 每一步在终端和 AI 对话框分别执行什么命令、输入什么任务描述、产生什么文件。
4. 新 feature 如何引用、扩展或替代旧 feature，同时保持旧目录不变。
5. 如何评审、实现、收敛、合并、发布、回滚，再进入下一轮 feature。

## 2. 已确认的官方事实与版本差异

- Flow-forward 的必要动作是通过 `/speckit.specify` 创建新的 feature spec 目录；旧 feature 目录作为历史记录保留。
- 当前 Spec Kit 命令模板将 Git 分支创建定义为可选 `before_specify` hook。
- 如果 hook 已配置并成功执行，它会创建或切换 Git 分支。
- 如果没有该 hook，`/speckit.specify` 仍会创建 `specs/<前缀-短名称>/spec.md`，但不会必然创建 Git 分支。
- Git 分支名和 spec feature 目录名彼此独立，可以相同，也可以不同。
- 当前 spec feature 的解析路径会写入 `.specify/feature.json`，后续 plan/tasks 等命令据此找到 feature，不应只依赖当前 Git 分支名。

因此，本教程会明确区分：

- **Feature artifact**：`specs/00N-add-task-priority/`，这是 flow-forward 的核心历史单元。
- **Git feature branch**：例如 `feat/add-task-priority`，这是隔离和评审代码/文档变更的工程手段。

推荐实践是一项增量 feature 对应一个专用 Git 分支，但不会把“自动建分支”描述为所有安装方式的必然行为。

## 3. 成功标准

- 读者能判断项目是否启用了 `before_specify` 分支 hook。
- 教程分别提供“自动分支”和“手动分支”两条起步路径。
- 每一步包含：目的、执行位置、命令/提示词、预期产物、人工审核点、失败处理。
- 完整走通 `specify → clarify → checklist → plan → tasks → analyze → implement → converge`。
- 覆盖 Git 提交、推送、PR、合并、发布、监控和回滚准备，但不自动替用户执行外部写操作。
- 使用连续两个增量案例展示历史链路：新增任务优先级、随后调整提醒规则。
- 说明什么需求应该新建 feature，什么只是当前 feature 内澄清，什么属于 bug fix。
- 修正已有教程中“手动建分支”未说明可选 hook 的表达。

## 4. 输出范围

计划新增：

- `06-Spec-Kit-Flow-Forward增量开发实战教程.md`

计划同步修订：

- `03-已上线Spec-Kit项目的增量迭代教程.md`
- `README.md`

专题教程章节：

1. Flow-forward 心智模型和目录/分支关系。
2. 适用与不适用场景。
3. 现有项目准备和基线冻结。
4. 判断/配置 Git 分支策略。
5. 第一次增量：新增任务优先级。
6. 规格澄清、质量清单、技术计划、任务和一致性检查。
7. 分批实现、测试与 converge。
8. Git 提交、PR、合并、发布和回滚。
9. 第二次增量：在新基线上调整提醒规则。
10. feature 间的 extends/supersedes/related 链路约定。
11. 中途需求变化、撤销 feature、并行 feature 和冲突处理。
12. 可复制命令速查表与检查清单。

## 5. 约束条件

- 以 2026-07-14 官方 `main` 分支行为为文档基线。
- Codex skills 模式主要使用 `$speckit-*`，同时给出通用 `/speckit.*` 对照。
- Git 默认分支名称不写死为 `main`；示例使用 `<default-branch>` 占位并解释替换。
- 不假设所有项目已安装分支 hook。
- 不把 `specify init --force` 混入日常 feature 开发。
- 不把 Spec Kit 工具升级与产品 feature 迭代放在同一分支。
- 真实测试命令以项目为准，教程示例会标注需替换。

## 6. 初步方案

采用“一条真实 feature 生命周期 + 下一轮迭代”的教程结构：

```text
默认分支/线上基线
    ↓
新 Git 分支（hook 自动或手动）
    ↓
新 specs/00N-feature/ 目录
    ↓
spec → plan → tasks → code → converge
    ↓
PR/合并/发布
    ↓
旧 feature 目录冻结为历史
    ↓
从更新后的默认分支创建下一个 feature
```

每一步统一使用下面的格式：

- **目的**
- **在哪里执行**：PowerShell 或 AI 对话框
- **命令/任务提示词**
- **预期结果**
- **人工审核点**
- **常见失败与恢复**

## 7. 待确认项

建议采用以下默认设置：

1. Git 策略：每个 flow-forward feature 一个专用分支；优先复用项目 hook，未配置时手动创建。
2. 案例：第一次新增任务优先级，第二次调整高优先级任务的提醒规则。
3. 工具：Codex skills 模式为主，括号标出 `/speckit.*` 通用命令。
4. 深度：覆盖产品、规格、工程、测试、Git/PR、发布和回滚的完整闭环。
5. 同步修订旧教程中的分支说明和 README 索引。

## 8. 官方依据

- Spec Kit `Evolving Specs in Existing Projects`。
- Spec Kit `Spec Persistence Models`。
- 当前 `templates/commands/specify.md` 中的 feature directory 与可选 branch hook 行为。
- Spec Kit SDD 方法说明中的标准规格、计划、任务和分支化评审流程。
