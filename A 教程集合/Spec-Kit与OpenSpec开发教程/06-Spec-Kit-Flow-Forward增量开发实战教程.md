# Spec Kit Flow-Forward 增量开发实战教程

> 文档基线：2026-07-14，依据 GitHub Spec Kit 官方 `main` 分支。本文面向“已有项目已经上线，继续使用 Spec Kit 增量开发”的场景，以 Windows PowerShell 和 Codex skills 模式为主要示例。

## 1. 先把 feature 和 Git 分支彻底分清

Flow-forward 中的 **feature** 首先是一个持久化的规格历史单元：

```text
specs/002-add-task-priority/
├─ spec.md
├─ plan.md
├─ tasks.md
├─ research.md
├─ data-model.md
├─ quickstart.md
├─ contracts/
└─ checklists/
```

Git feature branch 是隔离这次规格、代码、测试和迁移修改的临时开发空间：

```text
feat/add-task-priority
```

二者关系：

| 对象 | 是否是 flow-forward 必需概念 | 生命周期 | 合并后怎么处理 |
|---|---|---|---|
| `specs/<feature>/` | 是 | 长期保存 | 保留在默认分支，作为历史记录 |
| Git feature branch | 工程上强烈建议 | 开发到合并 | 合并后可以删除 |
| `.specify/feature.json` | 当前命令定位 feature 的机制 | 当前工作上下文 | 后续命令用它找到 feature 目录 |

当前 `/speckit.specify` 一定会创建新的 feature 目录和 `spec.md`；是否自动创建 Git 分支，取决于项目是否启用了可选 Git 扩展的 `before_specify` hook。当前模板还明确规定：**Git 分支名与 feature 目录名彼此独立**。[当前 Specify 命令模板](https://github.com/github/spec-kit/blob/main/templates/commands/specify.md)

所以：

- “创建新 feature”不等于“只创建 Git 分支”。
- “Git 分支合并并删除”不等于“删除 feature”。
- 真正的 flow-forward 历史存在 `specs/` 中，而不是只存在远程分支列表里。

## 2. Flow-forward 的核心规则

### 规则 1：已完成 feature 不再原地改写

假设 MVP 已经上线：

```text
specs/001-task-manager-mvp/
```

现在新增优先级，不修改 `001`，而是创建：

```text
specs/002-add-task-priority/
```

之后调整提醒规则，再创建：

```text
specs/003-adjust-priority-reminders/
```

### 规则 2：新 feature 说明与旧 feature 的关系

新 feature 应明确：

- `Extends`：扩展旧能力。
- `Supersedes`：替代旧规则。
- `Preserves`：哪些旧行为保持不变。
- `Related`：相关但没有被改变的 feature。

### 规则 3：一次 feature 必须能独立验收

不要把“本周十个小需求”打成一个 feature。一个 feature 应具备：

- 单一主要目标。
- 明确的验收标准。
- 可独立评审。
- 可独立发布或回滚。
- 范围变化时能判断继续当前 feature 还是新建下一个。

### 规则 4：旧目录是历史，不一定是当前状态快照

Flow-forward 保存的是变化序列。要了解当前行为，可能需要阅读 `001 → 002 → 003` 的演进链。因此必须使用清晰命名、交叉链接，最好再维护一个轻量索引。

官方对 flow-forward 的定义同样是：新需求创建新 feature spec，旧目录保持不变，用于审计、比较和解释项目演进。[Evolving Specs in Existing Projects](https://github.com/github/spec-kit/blob/main/docs/guides/evolving-specs.md)

## 3. 什么时候新建 feature

### 应该新建

- 新增用户可见能力。
- 修改已经上线的产品行为。
- 新增或改变数据字段、API、权限、状态流转。
- 有独立验收、发布或回滚需求。
- 原 feature 已经合并或上线，现在出现后续需求。
- 原目标发生实质变化，继续修改会让历史含义混乱。

### 不必立即新建

- 当前 feature 尚未合并，只是在澄清同一目标。
- 技术实现方案改变，但用户行为和范围不变。
- tasks 中发现漏项，仍属于已批准的 spec/plan。
- 代码没有实现已批准 spec，这是修复实现偏差。
- 纯内部重构，确定不改变外部行为。

### 必须先判断的灰区

| 情况 | 建议 |
|---|---|
| 当前 feature 开发中，需求小幅细化 | 更新当前 feature artifact，再 analyze |
| 当前 feature 开发中，范围扩大成独立价值 | 拆出新 feature，当前 feature 保持原范围 |
| 上线代码违反原 spec | 修代码，不伪装成产品新需求 |
| 产品决定改变原 spec 中的行为 | 创建新 flow-forward feature |
| 上线后要撤销一个功能 | 创建“revert/disable”新 feature，保留原历史 |

## 4. 本教程案例和初始状态

已有项目：任务管理系统 MVP。

```text
项目根目录/
├─ .specify/
├─ specs/
│  └─ 001-task-manager-mvp/
│     ├─ spec.md
│     ├─ plan.md
│     └─ tasks.md
├─ src/
├─ tests/
└─ package.json
```

当前情况：

- `001-task-manager-mvp` 已上线。
- 线上版本对应 `v1.0.0`。
- 默认分支示例为 `main`；真实项目应替换成实际默认分支。
- 第一次增量：新增 P0-P3 任务优先级。
- 第二次增量：高优先级任务提前提醒。

预期演进：

```text
specs/
├─ 001-task-manager-mvp/
├─ 002-add-task-priority/
└─ 003-adjust-priority-reminders/
```

## 5. 命令名称对照

Codex skills 模式通常使用：

```text
$speckit-specify
$speckit-clarify
$speckit-plan
$speckit-checklist
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

其他集成通常使用：

```text
/speckit.specify
/speckit.clarify
/speckit.plan
/speckit.checklist
/speckit.tasks
/speckit.analyze
/speckit.implement
/speckit.converge
```

下面主要展示 `/speckit.*`，Codex skills 模式按上面的映射替换。`/speckit.*` 或 `$speckit-*` 输入 AI 对话框；`git`、`specify`、`npm` 命令输入 PowerShell。

当前官方生产级推荐顺序：

```text
constitution
→ specify
→ clarify
→ plan
→ checklist
→ tasks
→ analyze
→ implement
→ converge
```

## 6. 步骤 0：确认项目现在能继续开发

### 目的

确认你操作的是正确仓库、正确线上基线，且当前失败不是本次 feature 引入的。

### 在 PowerShell 执行

```powershell
Set-Location E:\path\to\your-project

git status --short
git branch --show-current
git remote -v
git rev-parse HEAD
git tag --points-at HEAD
specify version
specify self check
```

如果 `git status --short` 有输出，先判断这些改动属于谁。不要删除、覆盖或混入新 feature。

### 建立测试基线

示例命令，按真实项目替换：

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

### 记录结果

建议在本次需求说明里记录：

```markdown
## Baseline

- Production tag: v1.0.0
- Production commit: <SHA>
- Default branch: main
- Baseline tests: 128 passed, 2 known failures
- Known production issues: ...
```

### 审核门槛

- 当前源码能对应到线上版本。
- 工作树干净，或已有改动已被单独处理。
- 基线测试结果已记录。
- 本轮不顺手升级 Spec Kit 项目模板。

## 7. 步骤 1：确认采用 Flow-forward

### 目的

避免团队成员有人修改旧 spec，有人新建 spec。

### 检查 constitution 或协作说明

```powershell
Get-Content -Encoding utf8 .specify\memory\constitution.md
```

如果尚未写入规则，可在单独治理变更中加入类似内容：

```markdown
## Specification Persistence

The project uses flow-forward specifications.

- Completed and merged feature directories are immutable historical records.
- New user-visible capabilities and post-release behavior changes require a new feature directory.
- New features MUST link to the historical features they extend or supersede.
- Git branch names and feature directory names may differ.
- Implementation MUST converge before merge.
```

不要在一个紧急 feature 中顺手大改 constitution；治理修改应单独评审。

## 8. 步骤 2：判断 Git 分支由谁创建

### 目的

避免手动创建一次分支后，`/speckit.specify` 的 hook 又尝试创建第二个分支。

### 检查扩展

在 PowerShell 执行：

```powershell
specify extension list
```

如果输出中 `git` 显示 installed/enabled，再检查：

```powershell
Get-Content -Encoding utf8 .specify\extensions.yml
Get-Content -Encoding utf8 .specify\extensions\git\git-config.yml
```

重点确认是否存在启用的 `before_specify` hook。官方 Git 扩展会通过该 hook 在 specification 前创建 feature branch，且自动提交默认关闭。[Git Branching Workflow Extension](https://github.com/github/spec-kit/blob/main/extensions/git/README.md)

### 路径 A：Git 扩展已启用

不要提前手动 `git switch -c`。先回到干净的默认分支：

```powershell
git switch main
git pull --ff-only
git status --short
```

然后直接进入步骤 3 的 `/speckit.specify`。hook 将在生成 spec 前创建/切换 feature branch。

### 路径 B：没有 Git 扩展

手动创建分支：

```powershell
git switch main
git pull --ff-only
git status --short
git switch -c feat/add-task-priority
```

这里的分支可以叫 `feat/add-task-priority`；随后生成的 spec 目录可能叫 `specs/002-add-task-priority/`，二者不必完全相同。

### 是否现在安装 Git 扩展

官方安装命令是：

```powershell
specify extension add git
```

但不建议在同一个产品 feature 分支临时安装。更稳妥的做法是：

1. 建立单独的工具/流程分支。
2. 安装并审查 `.specify/extensions/`、commands/skills 和配置差异。
3. 验证团队所有 AI 工具都能加载。
4. 合并该治理变更。
5. 后续 feature 再统一使用自动分支路径。

本次没有扩展就走手动路径，不影响 flow-forward。

## 9. 步骤 3：创建新的 feature spec

### 目的

为本次增量建立新的历史单元，不修改 `001-task-manager-mvp`。

### 在 AI 对话框执行

```text
/speckit.specify

为已上线的任务管理系统新增任务优先级能力。

历史关系：
- Extends: specs/001-task-manager-mvp/spec.md
- Preserves: 现有任务创建、负责人分配、完成状态、权限、分页和筛选
- Changes: 任务字段、默认排序和项目级功能开关
- Does not supersede: MVP 的其他任务管理行为

目标用户：普通项目成员、项目管理员。

目标行为：
1. 任务支持 P0、P1、P2、P3；P0 最高，P3 最低；
2. 创建任务未指定优先级时默认为 P2；
3. 有权限的用户可以创建和编辑优先级；
4. 默认排序为优先级升序、截止时间升序、无截止时间最后、创建时间升序、任务 ID 稳定排序；
5. 管理员可以按项目关闭优先级入口，关闭后保留已有数据；
6. 旧任务迁移为 P2；
7. 现有 API 客户端保持兼容。

非范围：
- 自定义优先级；
- AI 自动推断；
- 跨项目优先级模板；
- 批量修改。

成功标准：
- 所有规则均可通过自动化测试或明确的人工验收验证；
- 原有权限、筛选、分页和性能不退化；
- 数据迁移可预演、可回滚。

只定义 WHAT 和 WHY。未知事项标记出来，不得猜测技术实现。
```

Codex skills 模式使用：

```text
$speckit-specify [同样的需求内容]
```

### 预期结果

可能创建：

```text
specs/002-add-task-priority/spec.md
.specify/feature.json
```

启用 Git 扩展时，还会自动创建类似：

```text
002-add-task-priority
```

### 在 PowerShell 核验

```powershell
git branch --show-current
git status --short
Get-Content -Encoding utf8 .specify\feature.json
Get-ChildItem specs -Directory | Sort-Object Name
Get-Content -Encoding utf8 specs\002-add-task-priority\spec.md
```

目录编号和名称以实际生成结果为准，不要机械假设一定是 `002`。

### 关键解释

当前模板会把实际 feature directory 写入 `.specify/feature.json`。后续 `/speckit.plan`、`tasks` 等据此找到 feature。不要因为 Git branch 名和目录名不同就手工重命名。

### 产品审核点

- 是否准确引用 `001`。
- 是否把原有行为全部重写进新 spec。Flow-forward 不要求复制整份旧 spec，只描述本次 feature 的完整边界和关系。
- 每条需求能否验证。
- 默认值、权限、关闭、存量数据、异常路径是否完整。
- 是否混入未批准功能。
- 是否残留 `[NEEDS CLARIFICATION]`。

## 10. 步骤 4：澄清需求

### 目的

在技术计划前消除产品歧义。

### 在 AI 对话框执行

```text
/speckit.clarify

针对任务优先级重点澄清：
- P0/P1/P2/P3 的展示名称是否固定；
- 谁可以修改优先级；
- 无截止时间、相同截止时间和相同创建时间的稳定排序；
- 关闭功能后 API 是否仍返回 priority；
- 关闭期间是否允许 API 写入 priority；
- 恢复功能后历史值如何显示；
- 旧任务迁移的生效时间和回滚行为；
- 对现有移动端或外部 API 客户端的影响。

逐项提出需要产品决定的问题。不得自行选择看似合理的答案。
```

### 产品决策示例

```text
1. 展示名称固定为 P0-P3，本期不做别名；
2. 具有任务编辑权限的成员可修改；
3. 无截止时间最后；完全同序时按任务 ID 升序；
4. 关闭后 API 仍返回字段，旧客户端可忽略；
5. 关闭期间 API 拒绝修改 priority，但保留已有值；
6. 恢复后显示历史值；
7. 迁移失败则回滚本次发布，不接受部分项目成功。
```

### 核验

```powershell
git diff -- specs\002-add-task-priority\spec.md
rg -n "NEEDS CLARIFICATION" specs\002-add-task-priority
```

如果 `rg` 找到尚未决定的问题，不进入 plan。

## 11. 步骤 5：生成技术计划

### 目的

把已批准的产品行为翻译成基于真实代码的技术方案。

### 在 AI 对话框执行

```text
/speckit.plan

请先读取现有源码，不得虚构文件或架构。重点分析：
- 当前任务数据模型与 migration 规范；
- 创建、更新、序列化和权限逻辑；
- 列表查询、筛选、分页和排序；
- 项目功能开关；
- API contract 和客户端兼容测试；
- 现有单元、集成、端到端测试；
- 当前部署、灰度和回滚能力。

约束：
- 沿用现有技术栈，不新增框架；
- 不修改与优先级无关的模块；
- 数据迁移必须包含前向、回滚和大表影响分析；
- API 必须向后兼容；
- 排序必须稳定，并评估索引和性能；
- 给出测试、监控、发布和回滚方案；
- 记录被否决方案及理由。
```

### 预期产物

```text
specs/002-add-task-priority/
├─ spec.md
├─ plan.md
├─ research.md
├─ data-model.md
├─ quickstart.md
└─ contracts/
```

实际产物取决于模板和需求，不要求每个 feature 都机械产生空文件。

### 工程审核点

- 引用的源文件路径是否真实。
- 是否复用了项目现有模式。
- migration 是否会锁表或阻塞生产。
- 索引是否支持新的稳定排序。
- API 新字段对旧客户端是否兼容。
- 关闭功能后的读写规则是否一致。
- 是否有发布失败和回滚路径。
- 是否为未来需求过度设计。

## 12. 步骤 6：生成需求质量检查表

### 目的

检查需求和计划是否完整、明确、一致。它不是代码测试执行报告。

当前官方生产级推荐流程把 checklist 放在 plan 之后、tasks 之前。

### 在 AI 对话框执行

```text
/speckit.checklist

为任务优先级 feature 生成质量检查表，重点覆盖：
- Requirement 是否可测试；
- 权限与功能关闭状态；
- 空值和默认值；
- 稳定排序和分页；
- 旧数据迁移与回滚；
- API 向后兼容；
- 性能和监控；
- 范围外功能是否被排除。

检查的是规格文本质量，不要假装执行尚未存在的代码测试。
```

### 预期产物

```text
specs/002-add-task-priority/checklists/
```

### 审核门槛

检查表里的阻塞项必须在生成 tasks 前处理；无法处理的项要记录负责人和原因。

## 13. 步骤 7：生成可执行任务

### 目的

把 plan 拆为有依赖关系、可验证、可暂停的任务。

### 在 AI 对话框执行

```text
/speckit.tasks

任务必须：
- 按测试/契约、数据、后端、前端、验证和发布准备分组；
- 先写证明需求的测试，再写实现；
- 标注可安全并行的任务；
- 每个任务给出明确文件或模块范围；
- 包含前向迁移、回滚迁移和迁移预演；
- 包含 API 兼容、回归、性能和人工验收；
- 不包含本 feature 非范围内容。
```

### 理想任务示例

```markdown
## 1. Contract and failing tests

- [ ] T001 Update task API contract with optional priority field
- [ ] T002 Add compatibility tests for clients that omit priority
- [ ] T003 Add failing tests for default value and permissions
- [ ] T004 Add failing tests for deterministic ordering

## 2. Data

- [ ] T005 Add priority field and constraints
- [ ] T006 Add forward migration and rollback migration
- [ ] T007 Rehearse migration with production-like volume

## 3. Application

- [ ] T008 Implement backend validation and serialization
- [ ] T009 Implement deterministic ordering
- [ ] T010 Implement project feature-control behavior
- [ ] T011 Add frontend create/edit/display controls

## 4. Verification and release

- [ ] T012 Run regression, type, lint and build checks
- [ ] T013 Verify query performance and indexes
- [ ] T014 Complete product acceptance scenarios
- [ ] T015 Document rollout, monitoring and rollback
```

### 审核门槛

- 每个 spec requirement 能映射到至少一个 task 和验证方式。
- 不存在只有实现、没有测试的行为变化。
- 不存在没有 requirement 来源的“顺便任务”。

## 14. 步骤 8：实现前一致性分析

### 目的

在写代码前发现 spec、plan、tasks 和 constitution 之间的矛盾。

### 在 AI 对话框执行

```text
/speckit.analyze

重点报告：
- spec 中没有 plan 覆盖的需求；
- plan 中未经 spec 批准的产品行为；
- tasks 漏掉的迁移、兼容、测试、发布或回滚；
- 默认值、权限和排序规则不一致；
- 违反 constitution 的设计；
- 无需求来源的任务；
- 无测试或验收证据的 requirement。

按 CRITICAL、HIGH、MEDIUM、LOW 分类，不修改代码。
```

### 处理循环

```text
修正 spec/plan/tasks
    ↓
/speckit.analyze
    ↓
直到 CRITICAL/HIGH 清零
```

AI 报告“无问题”也要人工抽查关键映射。

## 15. 步骤 9：提交规划产物检查点

Git 扩展的自动提交默认关闭，不能假设 artifact 已经提交。

### 在 PowerShell 检查

```powershell
git status --short
git diff -- .specify\feature.json specs\002-add-task-priority
```

确认后只暂存本 feature 的文件：

```powershell
git add .specify\feature.json
git add specs\002-add-task-priority
git commit -m "docs: specify task priority feature"
```

如果 `.specify/feature.json` 被项目约定为本地状态而未纳入 Git，以仓库现有规则为准，不要擅自改变跟踪策略。

### 为什么这里提交

- 实现前有清晰的批准基线。
- 后续能区分 artifact 变化和代码变化。
- 如果实现发现方案问题，可以准确审查回写内容。

## 16. 步骤 10：分批实现

### 目的

避免 AI 一次执行全部任务，让每个高风险阶段可审查、可停止。

### 在 AI 对话框执行

```text
/speckit.implement

按 tasks.md 执行，但必须分五个检查点暂停：
1. contract 和失败测试；
2. 数据模型、前向迁移和回滚迁移；
3. 后端行为；
4. 前端行为；
5. 回归、性能、发布与回滚准备。

每个检查点结束时报告：
- 完成的 Task ID；
- 修改的文件；
- 实际运行的测试命令和结果；
- 与 plan 的偏差；
- 新发现的问题；
- 下一阶段准备做什么。

未获得确认前不要继续下一个检查点，不得修改本 feature 范围外的代码。
```

### 每个阶段的人工动作

```powershell
git status --short
git diff --stat
git diff
```

按模块运行相关测试。例如：

```powershell
npm test -- task-priority
```

命令必须替换成项目真实测试方式。

### 测试优先检查

对于新增行为，先确认测试在实现前能失败，再确认实现后通过。否则测试可能没有真正覆盖需求。

## 17. 步骤 11：实现中发现变化怎么办

### 只改变技术方案

例如数据库不允许新增 enum，改为受约束的小整数：

```text
暂停实现。

发现：当前数据库发布规范不允许在线修改 enum。
产品行为不变。

请：
1. 更新 plan.md 的数据表示和迁移方案；
2. 更新 data-model.md 和相关 tasks；
3. 检查 contracts/spec 是否不受影响；
4. 列出 artifact diff；
5. 等待确认，不继续实现。
```

确认后重新：

```text
/speckit.analyze
/speckit.implement
```

### 改变用户行为，但仍是同一目标

先更新 `spec.md` 并获得产品批准，再传播到 plan/tasks，运行 analyze 后继续。

### 目标已经变了

例如“固定 P0-P3”变为“可配置的工作流优先级系统”：

- 停止扩大当前 feature。
- 保持 `002` 的既定范围，或明确取消它。
- 新建后续 feature。
- 不把两种目标揉进同一个历史目录。

## 18. 步骤 12：运行完整验证

### 在 PowerShell 执行

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

按项目补充：

- 数据迁移 dry run。
- 回滚迁移演练。
- API contract tests。
- E2E。
- 性能基准。
- 安全扫描。

### 产品验收

至少验证：

1. 创建任务默认 P2。
2. 有权限用户能设置 P0-P3。
3. 无权限用户不能修改。
4. 排序在分页和完全同序条件下稳定。
5. 无截止时间排在有截止时间之后。
6. 关闭功能后入口隐藏、数据保留、API 行为符合 spec。
7. 恢复功能后历史优先级可见。
8. 旧任务正确迁移为 P2。
9. 旧客户端不传 priority 仍可工作。
10. 回滚路径可执行。

## 19. 步骤 13：Converge 收敛

### 目的

检查“承诺了什么”和“实际完成了什么”，并把真实缺口追加为 tasks。

### 在 AI 对话框执行

```text
/speckit.converge

对照当前 feature 的 spec.md、plan.md、tasks.md、contracts、测试和实际代码，检查：
- 每条 requirement 是否有实现和验证证据；
- 所有 tasks 是否真实完成；
- 数据迁移和回滚是否存在且已验证；
- API 兼容、权限、功能开关和稳定排序是否符合 spec；
- plan 中的设计是否反映到代码；
- 是否存在越界实现；
- 发布、监控和回滚准备是否完整。

只把属于本 feature 的真实缺口追加到 tasks.md，不扩大范围。
```

### 收敛循环

```text
/speckit.converge
    ↓ 如果追加 tasks
/speckit.implement
    ↓
重新运行真实测试
    ↓
/speckit.converge
    ↓
直到无剩余缺口
```

Converge 不是测试替代品；它主要检查 artifact 与实现覆盖关系。

## 20. 步骤 14：最终 Git 检查和提交

### 检查范围

```powershell
git status --short
git diff --stat main...HEAD
git diff main...HEAD -- specs\001-task-manager-mvp
```

最后一条应该没有输出，因为旧 feature 不应被修改。如果有输出，必须解释并通常应撤销该修改或改为新 feature 内容。

检查本次 feature：

```powershell
git diff main...HEAD -- specs\002-add-task-priority
```

### 明确暂存文件

不要使用 `git add .` 掩盖无关改动。按真实文件分组：

```powershell
git add specs\002-add-task-priority
git add src\path\to\changed-files
git add tests\path\to\changed-tests
git add migrations\path\to\migration-files
git commit -m "feat: add task priority"
```

若路径不同，按真实项目替换。

## 21. 步骤 15：推送、PR 和评审

### 推送分支

先确认远程和分支：

```powershell
git remote -v
git branch --show-current
git push -u origin HEAD
```

### PR 建议结构

```markdown
## Product change

- Adds P0-P3 task priority
- Default: P2
- Updates deterministic task ordering
- Adds project-level feature control

## Spec Kit artifacts

- New: `specs/002-add-task-priority/`
- Extends: `specs/001-task-manager-mvp/`
- Historical feature modified: No

## Data and compatibility

- Migration:
- Rollback:
- API compatibility:

## Verification

- Unit:
- Integration:
- E2E:
- Build:
- Migration rehearsal:
- Product acceptance:
- Converge result:

## Release and rollback

- Rollout:
- Monitoring:
- Rollback trigger:
```

如果使用 GitHub CLI，可在确认 PR 内容后执行：

```powershell
$branch = git branch --show-current
gh pr create --base main --head $branch
```

也可以在 GitHub 网页创建。不要让 AI 未经确认代你发布或合并。

### 推荐评审顺序

1. `spec.md`：产品行为是否正确。
2. `plan.md`：方案、迁移、兼容、回滚是否合理。
3. `tasks.md`：是否漏项或越界。
4. 测试：是否证明核心场景。
5. 代码：是否忠实实现。
6. `converge` 结果和发布方案。

## 22. 步骤 16：合并和发布

### 合并前门槛

- [ ] 旧 feature 目录未被修改。
- [ ] 新 feature artifact 完整且已批准。
- [ ] CRITICAL/HIGH analyze 问题清零。
- [ ] 自动化测试和构建通过。
- [ ] migration 和 rollback 已预演。
- [ ] 产品验收通过。
- [ ] converge 无剩余缺口。
- [ ] 监控和回滚触发条件明确。

### 合并后

```powershell
git switch main
git pull --ff-only
```

确认新 feature 已进入默认分支：

```powershell
Test-Path specs\002-add-task-priority\spec.md
git log --oneline -n 10
```

Git feature branch 可以按团队规则删除，但 `specs/002-add-task-priority/` 必须保留。

### 发布后

- 记录实际生产 commit/tag。
- 运行关键冒烟测试。
- 核对 migration 数量和异常。
- 观察错误率、延迟和业务指标。
- 如果线上行为与 spec 不一致，不能只在聊天中备注。

## 23. 第二次迭代：创建下一个 feature

第一次 feature 上线后，产品提出：

> P0/P1 任务应在截止前 48 小时提醒，P2/P3 保持提前 24 小时；已发送提醒不得重复。

这是已上线行为的实质调整，创建新的 feature，不修改 `002`。

### 从最新默认分支开始

```powershell
git switch main
git pull --ff-only
git status --short
```

无 Git 扩展时：

```powershell
git switch -c feat/adjust-priority-reminders
```

有 Git 扩展时不手动建分支，直接运行 specify。

### 创建新 feature

```text
/speckit.specify

调整任务提醒规则，使提醒时间与任务优先级关联。

历史关系：
- Extends: specs/002-add-task-priority/spec.md
- Supersedes: specs/001-task-manager-mvp/spec.md 中“所有任务统一提前 24 小时提醒”的规则
- Preserves: 任务创建、优先级编辑、原有通知渠道和权限

目标行为：
- P0/P1 提前 48 小时提醒；
- P2/P3 提前 24 小时提醒；
- 优先级或截止时间改变时，重新计算尚未发送的提醒；
- 已发送提醒不重复；
- 完成或取消的任务不再提醒；
- 明确时区、夏令时、重试和去重规则；
- 存量任务在功能发布后按新规则重新计算；
- 回滚后恢复统一提前 24 小时规则。

不修改旧 feature 目录。只定义产品行为和验收标准。
```

预期：

```text
specs/
├─ 001-task-manager-mvp/
├─ 002-add-task-priority/
└─ 003-adjust-priority-reminders/
```

然后完整重复：

```text
/speckit.clarify
/speckit.plan
/speckit.checklist
/speckit.tasks
/speckit.analyze
/speckit.implement
/speckit.converge
```

这就是 flow-forward：每次已上线后的实质变化继续向前生成新历史，而不是把旧 feature 改成仿佛当初就知道今天的需求。

## 24. 建立 feature 演进索引

Flow-forward 最大的代价是当前行为分散在历史链中。建议维护 `specs/README.md`：

```markdown
# Feature Evolution Index

## Task management

| Feature | Status | Relationship | Released |
|---|---|---|---|
| 001-task-manager-mvp | released | base | v1.0.0 |
| 002-add-task-priority | released | extends 001 | v1.1.0 |
| 003-adjust-priority-reminders | released | extends 002; supersedes reminder rule in 001 | v1.2.0 |
```

这个索引是团队约定，不是 Spec Kit 强制文件。它只保存导航和状态，不复制完整需求。

如果维护索引，应把更新索引作为每个 feature 的发布任务。

## 25. Feature 回滚怎么记录

### PR 尚未合并

放弃分支即可，默认分支没有新增 feature 历史。删除分支前确认没有需要保留的决策或代码。

### 已合并但尚未发布

通过新的 revert PR 恢复代码和 artifact 到正确状态。是否保留 feature 历史取决于团队审计要求，但不要偷偷改写默认分支历史。

### 已经发布后回滚

原 feature 已经是发生过的历史，不应删除。例如 `002` 发布后因性能问题回滚，应创建：

```text
specs/003-revert-task-priority/
```

新 feature 说明：

- 为什么撤销。
- 哪些行为被禁用或恢复。
- 数据是否保留。
- 对 API 和客户端的影响。
- 重新启用需要满足什么条件。

代码回滚和产品事实变化要一起被记录。

## 26. 并行 feature 与编号冲突

两个团队从同一基线同时创建 sequential feature，可能争用相同编号。建议：

1. 创建前 `git fetch` 并更新默认分支。
2. 使用 Git 扩展，让它检查本地和远程分支。
3. 团队并发很高时考虑 timestamp feature numbering。
4. PR 中检查 `specs/<编号-名称>/` 是否冲突。
5. 不要在冲突发生后只改目录名而忘记 `.specify/feature.json` 和引用链接。

当前模板支持在 `.specify/init-options.json` 中使用：

```json
{
  "feature_numbering": "timestamp"
}
```

这样目录可能为：

```text
specs/20260714-153000-add-task-priority/
```

编号策略属于团队级设置，应单独评审，不要在某个 feature 中临时切换。

## 27. 常见错误与恢复

### 错误 1：手动建分支后 Git hook 又建分支

原因：没有先检查 `git` 扩展。

恢复：暂停，不继续生成；确认当前两个分支和未提交文件所在位置，再选择正确分支。不要用 `git reset --hard` 处理。

### 错误 2：新需求直接修改 `001/spec.md`

原因：把 flow-forward 当成 living spec。

恢复：把修改内容移入新 feature spec；旧目录恢复到默认分支原样；在新 spec 中添加 extends/supersedes 链接。

### 错误 3：分支名和 spec 目录名不同，以为工具坏了

这是当前允许的正常行为。检查：

```powershell
Get-Content -Encoding utf8 .specify\feature.json
```

以下游命令解析到的 feature directory 为准。

### 错误 4：从旧 feature 分支创建下一个 feature

这样会让第二个 feature 隐含依赖尚未合并的代码。

恢复：判断是否有意做 stacked branch。如果不是，回到最新默认分支后重新创建。不要在不清楚提交关系时强行 rebase。

### 错误 5：tasks 全勾选就合并

任务清单本身可能漏项。必须运行真实测试、人工验收和 `/speckit.converge`。

### 错误 6：工具升级和产品 feature 混在一个 PR

拆成两个变更：Spec Kit 工具/模板升级 PR，与产品 feature PR。强制刷新前保护 constitution、templates 和 scripts。

### 错误 7：旧 feature 目录永久冻结，但没人知道当前行为

维护 feature relationship 和 `specs/README.md` 导航；重大规则被替代时在新 feature 明确写 `Supersedes`。

## 28. 可复制的完整命令速查

### 路径 A：已启用 Git 扩展

PowerShell：

```powershell
git switch main
git pull --ff-only
git status --short
specify extension list
```

AI 对话框：

```text
/speckit.specify [新 feature 需求]
/speckit.clarify [澄清重点]
/speckit.plan [现有架构与技术约束]
/speckit.checklist [质量维度]
/speckit.tasks [任务约束]
/speckit.analyze
/speckit.implement [要求分阶段暂停]
/speckit.converge
```

PowerShell：

```powershell
git branch --show-current
Get-Content -Encoding utf8 .specify\feature.json
git status --short
npm test
npm run lint
npm run typecheck
npm run build
git push -u origin HEAD
```

### 路径 B：未启用 Git 扩展

PowerShell：

```powershell
git switch main
git pull --ff-only
git status --short
git switch -c feat/add-task-priority
```

然后执行与路径 A 相同的 Spec Kit 命令链。

## 29. 每个步骤的完成定义

| 步骤 | 完成定义 |
|---|---|
| 基线 | 线上版本、默认分支、测试基线明确 |
| 分支 | 当前 feature 在独立 Git 分支中 |
| Specify | 新 feature 目录创建，旧目录未改 |
| Clarify | 无未解决的关键歧义 |
| Plan | 基于真实源码，迁移/兼容/回滚明确 |
| Checklist | 需求质量阻塞项已处理 |
| Tasks | Requirement 能映射到 task 和验证 |
| Analyze | CRITICAL/HIGH 已解决 |
| Implement | 分阶段完成，测试有真实输出 |
| Converge | 无剩余缺口或越界实现 |
| PR | Artifact、代码、测试、发布信息齐全 |
| Release | 线上版本、监控、回滚和冒烟验证完成 |

## 30. 最终推荐的团队约定

```markdown
# Flow-Forward Working Agreement

1. Every post-release user-visible change gets a new feature directory.
2. Completed feature directories are immutable historical records.
3. Every feature uses a dedicated Git branch.
4. The Git extension owns branch creation when enabled; otherwise developers create branches manually before specify.
5. Branch names and feature directory names are independent.
6. Every new feature links to the features it extends or supersedes.
7. Spec Kit tooling upgrades are separate from product feature work.
8. Analyze runs before implementation.
9. Implementation is reviewed in phases.
10. Tests and converge must pass before merge.
11. Released rollbacks are recorded as new forward features.
12. `specs/README.md` tracks the feature evolution chain.
```

## 31. 最重要的理解

Flow-forward 不是“每次新开一个 Git 分支”这么简单。它真正建立的是一条不可覆盖的产品和工程演进链：

```text
历史 feature 001
    ↓ 被 002 扩展
历史 feature 002
    ↓ 某条规则被 003 替代
历史 feature 003
```

Git 分支负责隔离本次工作；feature spec 目录负责解释为什么做、做了什么、如何实现以及项目如何走到今天。分支可以消失，历史目录不能消失。
