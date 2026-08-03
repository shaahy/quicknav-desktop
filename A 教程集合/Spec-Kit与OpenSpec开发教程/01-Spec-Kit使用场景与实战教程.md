# Spec Kit 使用场景与实战教程

> 文档基线：2026-07-14，依据 GitHub Spec Kit 官方 `main` 分支。Spec Kit 仍在快速演进，实际使用前先执行 `specify self check`。

严格说，Spec Kit 不是“一个 skill”，而是一套 SDD 工具包；初始化后，它会按 Codex、Claude Code、Copilot 等集成方式安装一组 skills 或 slash commands。本文讨论的是整套工作流。

## 1. 一句话理解

Spec Kit 是一套“规格驱动开发”（SDD）工具：先把产品意图写成可验收的 `spec.md`，再生成技术 `plan.md`、可执行 `tasks.md`，最后让 AI 按这些受版本控制的产物实现和收敛，而不是直接拿一段需求让 AI 一次性写代码。

它解决的核心问题不是“让 AI 写得更快”，而是让产品目标、技术方案、任务拆分、测试和代码之间有可追溯关系。

官方入口：

- [Spec Kit 仓库与快速开始](https://github.com/github/spec-kit)
- [规格驱动开发方法说明](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [现有项目规格演进指南](https://github.com/github/spec-kit/blob/main/docs/guides/evolving-specs.md)

## 2. 最适合的使用场景

### 2.1 从 0 到 1 的新产品或新模块

适合需求尚未工程化，但已经能描述目标用户、核心场景和成功标准的项目。Spec Kit 会迫使团队把“做一个任务管理系统”继续细化为用户故事、边界条件、验收场景和可衡量结果。

典型例子：

- 新建 SaaS MVP。
- 在成熟系统里增加一个边界清晰的新模块。
- 同一需求需要比较两种技术实现。
- 需求要交给不同开发者或不同 AI 模型执行。

### 2.2 需求复杂、歧义成本高

当一个需求涉及多角色、多状态、权限、数据迁移、异常路径或非功能指标时，直接编码很容易把产品假设偷偷变成代码。`/speckit.clarify` 和 `/speckit.checklist` 能在开发前暴露这些空白。

### 2.3 有明确工程原则的团队

`.specify/memory/constitution.md` 可以保存项目不可轻易突破的约束，例如：

- 必须先写测试。
- API 必须向后兼容。
- 数据库变更必须支持回滚。
- 不允许引入未经批准的云服务。
- 页面性能、可访问性、安全扫描必须达到什么门槛。

这些原则会进入后续计划和一致性检查，而不是只停留在团队 Wiki。

### 2.4 已上线项目的增量开发

Spec Kit 官方已定义三种现有项目演进方式：

| 模型 | 怎么改 | 适合 | 主要风险 |
|---|---|---|---|
| Flow-forward | 为新变化创建新的 feature 目录，旧产物不动 | 上线系统、重视审计与回溯 | 相关信息散落在多个目录 |
| Living spec | 先更新现有 `spec.md`，再重生成 `plan.md`、`tasks.md` | 把规格当长期产品契约 | 重生成时可能丢失技术理由 |
| Flow-back | 允许从代码、任务、计划或规格任一层开始，再统一对齐 | 小团队、高探索性开发 | 容易产生静默漂移 |

这三种模式是团队约定，不是 CLI 开关。必须把选择写进 constitution 或团队开发说明。[官方规格持久化模型](https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md)

## 3. 不建议使用的场景

- 一两行、行为完全明确、风险很低的修复。完整流程可能比修改本身更重。
- 团队不会评审规格，只想把 Markdown 当作“喂给 AI 的提示词”。这会制造形式上的完整、实际上的错误。
- 项目无法运行测试，也无法验证实现结果。规格不能替代验证环境。
- 线上事故正在止血。应先按事故流程恢复服务，再补规格和根因修复。
- 需求每天彻底反转且还没形成产品判断。此时先做原型或探索，不要过早生成全套任务。

## 4. 它在软件开发各阶段做什么

| 阶段 | 主要动作 | 核心产物 | 人工必须判断什么 |
|---|---|---|---|
| 项目治理 | `/speckit.constitution` | `constitution.md` | 哪些原则不可妥协 |
| 需求定义 | `/speckit.specify` | `spec.md` | 做什么、为什么、为谁做 |
| 需求澄清 | `/speckit.clarify` | 更新后的 `spec.md` | 假设是否正确、边界是否完整 |
| 技术设计 | `/speckit.plan` | `plan.md` 及设计附件 | 架构、依赖、迁移、回滚是否合理 |
| 需求质检 | `/speckit.checklist` | 质量检查表 | 规格与技术方案是否明确、完整、可测 |
| 工作拆分 | `/speckit.tasks` | `tasks.md` | 顺序、并行性、测试任务是否充分 |
| 一致性检查 | `/speckit.analyze` | 分析报告 | spec/plan/tasks 是否矛盾或漏项 |
| 实现 | `/speckit.implement` | 代码、测试、任务勾选 | 是否按任务分批评审、是否出现越界改动 |
| 收敛 | `/speckit.converge` | 追加的缺口任务 | 规格与代码是否真的一致 |
| 发布 | 项目自身 CI/CD | 构建物、发布记录 | 验收、回滚、监控是否到位 |

## 5. 准备环境

### 5.1 前置条件

- Git。
- Python 3.11+。
- `uv`（官方推荐）或 `pipx`。
- 一个受支持的 AI 编码工具，如 Codex、Claude Code、GitHub Copilot。
- 项目本身可运行的安装、构建和测试环境。

### 5.2 安装 Specify CLI

官方推荐从明确的发布标签安装，不建议在团队项目里长期追踪未固定的 `main`：

```powershell
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
specify --version
specify self check
```

将 `vX.Y.Z` 替换成官方 Releases 中的实际版本，保留开头的 `v`。

升级前先预演：

```powershell
specify self upgrade --dry-run
```

确认后升级：

```powershell
specify self upgrade
```

升级 CLI 和更新项目内 Spec Kit 文件是两件事。已上线项目不要在功能分支里顺手强制刷新模板，详见第三份教程。

### 5.3 初始化项目

新项目：

```powershell
specify init task-manager --integration codex --integration-options="--skills"
Set-Location task-manager
```

已存在项目：

```powershell
Set-Location E:\path\to\existing-project
specify init --here --integration codex --integration-options="--skills"
```

非空目录需要强制初始化时，先提交或备份当前工作，再使用：

```powershell
specify init --here --force --integration codex --integration-options="--skills"
```

`--force` 可能刷新 Spec Kit 管理的命令、模板、脚本和共享 memory 文件。不要在未检查差异的情况下对已定制项目执行。

### 5.4 不同 AI 工具如何触发命令

本教程统一用官方 slash command 名称表达流程：

```text
/speckit.specify
/speckit.plan
/speckit.tasks
```

如果 Codex 以 skills 模式初始化，对应调用通常显示为：

```text
$speckit-specify
$speckit-plan
$speckit-tasks
```

Claude Code、Copilot 等通常使用 `/speckit.*`。以初始化后工具实际列出的命令/技能为准，不要把 `/speckit.*` 输入 PowerShell；它们应输入 AI 对话框。

## 6. 贯穿案例

假设已有一个任务管理系统，现在开发一个相对独立的新版本：

> 用户可以给任务设置 P0、P1、P2、P3 优先级；任务列表默认按优先级和截止时间排序；旧任务迁移后默认为 P2；项目管理员可关闭优先级功能。此次不做自定义优先级、不做跨项目优先级模板。

可验收目标：

- 创建和编辑任务时可以选择 P0-P3。
- 列表默认排序：优先级升序，再按截止时间升序，无截止时间最后。
- 关闭功能后不展示优先级入口，但历史数据保留。
- 旧任务迁移为 P2，迁移可回滚。
- 原有筛选、分页和权限逻辑不退化。

## 7. 从需求到上线的完整实战

### 第 0 步：建立安全工作区

```powershell
git status --short
git switch -c feat/task-priority
```

确认：

- 工作树干净。
- 当前线上版本有 tag 或 commit 可追溯。
- 测试基线在未修改前可以通过。

示例：

```powershell
npm ci
npm test
npm run build
```

不要把“基线测试本来就失败”留到实现结束才发现。

### 第 1 步：建立或复核项目宪法

在 AI 对话中：

```text
/speckit.constitution
为本项目建立开发原则：
1. 数据库变更必须提供前向迁移、回滚方案和旧数据处理策略；
2. 对外 API 默认向后兼容；破坏性变化必须显式批准；
3. 每个用户故事必须有自动化测试或说明无法自动化的原因；
4. 不允许顺手重构无关模块；
5. 上线前必须通过单元、集成、构建和关键路径验收；
6. 产品行为以已批准 spec.md 为准，技术发现如改变产品行为必须回写规格。
```

评审 `.specify/memory/constitution.md`：原则必须能判断“通过/不通过”，不能只写“保持高质量”。

### 第 2 步：创建功能规格

```text
/speckit.specify
为已上线任务管理系统增加任务优先级。

目标用户：普通成员和项目管理员。
用户价值：成员能识别紧急任务，列表能稳定呈现执行顺序。

范围：
- 任务支持 P0、P1、P2、P3；
- 创建和编辑时可选择，默认 P2；
- 默认排序为优先级升序、截止时间升序、无截止时间最后；
- 管理员可按项目关闭该能力；关闭后隐藏入口但保留数据；
- 旧任务迁移为 P2。

不做：自定义等级、跨项目模板、自动推断优先级。

成功标准：
- 新旧任务行为符合上述规则；
- 原有权限、分页、筛选和性能不退化；
- 数据迁移可回滚。

请只定义 WHAT/WHY 和可验证行为，不提前决定技术栈。
```

预期生成新的功能分支和类似目录：

```text
specs/
└─ 00N-task-priority/
   └─ spec.md
```

产品负责人评审 `spec.md` 时重点看：

- 每个需求是否能写成测试。
- 默认值、权限、空值、关闭功能、历史数据是否说清。
- 是否出现未批准的“顺便功能”。
- 是否残留 `[NEEDS CLARIFICATION]`。
- 成功标准是否描述结果，而非技术实现。

### 第 3 步：澄清歧义

```text
/speckit.clarify
重点检查：
- P0 是否比 P1 更优先；
- 没有截止时间时如何排序；
- 管理员关闭功能后 API 是否仍返回 priority；
- 恢复功能时历史值如何处理；
- 并列任务的稳定排序规则；
- 迁移失败时如何回滚。
不要自行猜测，请把需要产品决定的事项逐项提出。
```

一个合理的产品决策示例：

```text
P0 最高、P3 最低；同优先级先按截止时间升序，无截止时间最后；
截止时间相同按创建时间升序，再按任务 ID 稳定排序。
关闭功能后 API 仍保留 priority 字段，前端不展示；恢复后沿用历史值。
```

### 第 4 步：生成技术计划

```text
/speckit.plan
沿用当前项目技术栈和既有架构，不新增框架。
请先读取源码、数据库迁移规范、现有任务 API、列表查询和项目功能开关实现。

计划必须包含：
- 受影响模块和依赖关系；
- 数据字段、默认值、索引与迁移/回滚；
- API 兼容策略；
- 排序实现及稳定排序；
- 功能开关的前后端行为；
- 单元、集成、端到端测试；
- 性能风险、观测指标和发布方案；
- 明确列出不修改的模块。
```

可能生成：

```text
specs/00N-task-priority/
├─ spec.md
├─ plan.md
├─ research.md
├─ data-model.md
├─ quickstart.md
└─ contracts/
```

工程评审必须检查：

- 计划是否真的读取了现有代码，而不是虚构文件名和架构。
- 数据迁移是否锁表、是否影响大表、能否分批。
- API 返回值变化是否影响旧客户端。
- 是否有回滚路径。
- 是否引入不必要的抽象或依赖。

### 第 5 步：生成需求质量检查表

```text
/speckit.checklist
为任务优先级生成需求质量检查表，覆盖：权限、排序稳定性、空值、旧数据迁移、开关前后行为、API兼容、性能和回滚。检查的是需求与设计文本质量，不是代码测试结果。
```

这里要反对一种常见误用：checklist 不是“功能测试用例执行表”，而是确认需求和设计是否完整、明确、一致、可测。

### 第 6 步：生成任务

```text
/speckit.tasks
```

理想 `tasks.md` 应体现依赖顺序：

```markdown
## 1. 契约与测试基线
- [ ] T001 更新任务 API 契约与兼容性测试
- [ ] T002 为默认值、排序和功能开关增加失败测试

## 2. 数据层
- [ ] T003 新增 priority 字段与约束
- [ ] T004 编写前向迁移和回滚迁移
- [ ] T005 验证旧任务迁移为 P2

## 3. 服务端
- [ ] T006 实现创建/更新校验
- [ ] T007 实现稳定排序
- [ ] T008 接入项目功能开关

## 4. 前端与验收
- [ ] T009 增加选择器和列表标识
- [ ] T010 验证关闭/恢复功能行为
- [ ] T011 运行回归、性能与构建检查
```

如果任务只有“实现后端、实现前端、测试”三条，说明拆分还不具备可执行性。

### 第 7 步：实现前一致性分析

```text
/speckit.analyze
```

不要只看“通过/失败”，要处理以下类型：

- spec 有验收行为，plan 没有实现路径。
- plan 引入新 API，spec 没批准行为变化。
- tasks 漏掉数据迁移、测试或回滚。
- constitution 要求兼容，但 plan 设计了破坏性变更。
- 同一默认值在多个文件里不一致。

修正文档后重新分析，直到高优先级问题清零。

### 第 8 步：分批实现

```text
/speckit.implement
```

对已上线项目，不建议让 AI 不停顿地执行到最后。更安全的提示是：

```text
按 tasks.md 实现，但分四个检查点暂停：
1. 测试与契约；
2. 数据迁移；
3. 后端行为；
4. 前端与回归。
每个检查点完成后列出修改文件、测试结果、尚未解决问题，等待确认再继续。
不得修改任务范围外的代码。
```

每个检查点至少执行相关测试，最后执行完整质量门槛：

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

命令按真实项目替换，不要机械照抄。

### 第 9 步：收敛规格与实现

```text
/speckit.converge
对照当前 feature 的 spec.md、plan.md、tasks.md 和实际代码，检查功能、测试、迁移、回滚、兼容性与非功能要求。只把真实缺口追加为任务，不扩大范围。
```

如果追加了任务：

```text
/speckit.implement
/speckit.converge
```

循环到没有剩余缺口。Converge 不是替代测试，它是检查“承诺过什么、实际做了什么”。

### 第 10 步：人工验收与发布

产品验收至少覆盖：

1. 新建任务默认 P2。
2. P0-P3 显示、编辑和权限正确。
3. 排序在分页、筛选、相同时间下保持稳定。
4. 关闭功能后入口消失但数据保留。
5. 恢复功能后历史值恢复显示。
6. 旧任务迁移正确。
7. 回滚迁移可执行。
8. 旧客户端或旧 API 调用不受破坏。

工程发布前保留：

- CI 结果。
- 数据迁移预演结果。
- 发布和回滚步骤。
- 监控指标与告警阈值。
- 需求验收记录。
- Spec Kit 产物与代码在同一 PR 中的差异。

## 8. 高频提示词模板

### 8.1 让 AI 先读代码再计划

```text
在生成技术计划前，先定位本需求涉及的入口、数据模型、API、权限、测试和配置。列出实际文件路径与当前行为；无法从代码确认的内容标记为未知，不得猜测。
```

### 8.2 阻止范围膨胀

```text
把发现的问题分为：本需求阻塞项、相关但可后置项、无关项。只有阻塞项进入本次 plan/tasks，其余记录但不实施。
```

### 8.3 检查规格漂移

```text
逐条建立 Requirement → Plan section → Task ID → Test → Code file 映射。找出无任务的需求、无需求来源的任务和无测试的行为变化。
```

## 9. 常见失败与处理

### 问题 1：`spec.md` 写了技术方案

处理：把框架、数据库、类名和文件路径移到 `plan.md`。`spec.md` 保留用户行为、业务规则、约束和可测结果。

### 问题 2：AI 根据需求文档直接改代码

处理：停止实现，先补 `specify → clarify → plan → tasks → analyze`。已写代码不要当成正确答案，只作为现状证据。

### 问题 3：重跑命令覆盖了重要人工决定

处理：在重生成前提交当前产物；把不可丢失的理由放入 ADR、constitution 或明确的设计决策区；重生成后审查 Markdown diff。

### 问题 4：`tasks.md` 全部勾选，但功能仍不完整

处理：运行 `/speckit.converge`，同时执行真实测试与人工验收。任务完成只表示执行过清单，不表示清单本身完整。

### 问题 5：强制初始化覆盖项目定制

处理：先备份 `.specify/memory/constitution.md` 和 `.specify/templates/`、`.specify/scripts/` 下的定制，再在独立分支执行 `specify init --here --force ...` 并逐文件审查差异。

### 问题 6：不同人不知道应该修改旧 spec 还是新建 spec

处理：在 constitution 或 `CONTRIBUTING.md` 明确采用 flow-forward、living spec 或 flow-back。不要靠口头默契。

## 10. 最终质量门槛

- [ ] `spec.md` 只定义 WHAT/WHY，所有行为可验证。
- [ ] 不存在未解决的 `[NEEDS CLARIFICATION]`。
- [ ] plan 基于真实代码与项目约束。
- [ ] tasks 覆盖实现、测试、迁移、回滚和发布验证。
- [ ] `/speckit.analyze` 的高优先级矛盾已解决。
- [ ] 代码修改没有超出批准范围。
- [ ] 自动化测试、构建和关键人工验收通过。
- [ ] `/speckit.converge` 没有剩余缺口。
- [ ] 规格、代码、迁移和发布说明在同一变更中可追溯。

## 11. 你真正要记住的流程

```text
constitution
    ↓
specify → clarify → plan → checklist
    ↓
tasks → analyze
    ↓
implement（分批评审）
    ↓
测试 + converge
    ↓
验收、发布、监控、回滚准备
```

Spec Kit 的价值来自这些人工检查点。如果跳过评审，只保留命令，流程会退化成“让 AI 生成更多 Markdown 后继续猜”。
