# OpenSpec 使用场景与实战教程

> 文档基线：2026-07-14，依据 Fission-AI/OpenSpec 官方 `main` 分支和当前 artifact-guided workflow。OpenSpec 更新较快，使用前执行 `openspec --version`，并在升级后运行 `openspec update` 刷新项目内的 AI 指令。

严格说，OpenSpec 也不是“一个 skill”，而是一套 SDD 工作流工具；`openspec init` 会为所选 AI 编码工具安装 `/opsx:*` 命令或等价 skills。本文讨论的是整套工作流。

## 1. 一句话理解

OpenSpec 是放在代码仓库里的轻量“变更协议层”：

- `openspec/specs/` 描述系统现在真实的行为。
- `openspec/changes/<change-name>/` 描述某一次准备发生的变化。
- 变化用 `ADDED`、`MODIFIED`、`REMOVED`、`RENAMED` 这类 delta 表达。
- 实现完成后将 delta 合并回主规格并归档，形成可追溯历史。

它的心智模型可以概括为：先就这次变化达成一致，再写代码；归档时把已经实现的变化折叠成新的系统事实。

官方入口：

- [OpenSpec 仓库](https://github.com/Fission-AI/OpenSpec)
- [Getting Started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md)
- [现有项目使用指南](https://github.com/Fission-AI/OpenSpec/blob/main/docs/existing-projects.md)
- [命令参考](https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md)

## 2. 核心产物

初始化后的典型结构：

```text
openspec/
├─ specs/                         # 当前系统行为，source of truth
│  └─ tasks/
│     └─ spec.md
├─ changes/                       # 尚未完成的变更
│  └─ add-task-priority/
│     ├─ proposal.md              # 为什么改、改什么、边界是什么
│     ├─ design.md                # 技术实现方案和关键决策
│     ├─ tasks.md                 # 实现清单
│     └─ specs/
│        └─ tasks/
│           └─ spec.md            # 只写这次变化的 delta
└─ config.yaml                    # 项目上下文和定制配置
```

各产物的责任：

| 产物 | 回答的问题 | 不应该承载什么 |
|---|---|---|
| `proposal.md` | 为什么做、范围和影响是什么 | 具体类名和代码步骤 |
| change `specs/` | 用户可观察行为发生什么变化 | 纯技术重构细节 |
| `design.md` | 这次变化怎么实现、有什么取舍 | 未批准的新产品需求 |
| `tasks.md` | 按什么顺序完成实现和验证 | 模糊的“完成全部开发” |
| main `specs/` | 系统当前承诺的行为 | 尚未实现的想法 |

## 3. 最适合的使用场景

### 3.1 已上线项目的小步增量

这是 OpenSpec 最自然的场景。现有项目不需要先补写整个系统规格，只需要为“现在要改的那一小块”建立 delta。每次归档后，主规格逐步生长。[官方 brownfield 指南](https://github.com/Fission-AI/OpenSpec/blob/main/docs/existing-projects.md)

典型变化：

- 增加字段、筛选器、权限或通知规则。
- 修改已有超时、排序、计费或状态流转行为。
- 移除旧能力。
- 修复一个会改变用户可观察行为的缺陷。
- 小规模重构，同时需要明确不改变哪些外部行为。

### 3.2 多个变更并行推进

每个 change 有独立文件夹，适合把不同目标拆开评审、实现和归档。需要注意多个 change 同时修改同一 domain spec 时的合并冲突。

### 3.3 产品需求会在实现中持续校正

OpenSpec 的 artifact 是普通 Markdown，可以随时直接修改，也可以让 AI 用 `/opsx:update` 协调多个 artifact。它不把“需求、设计、实现”做成不可返回的单向阶段。

### 3.4 团队需要审计，但不想维护每个功能的大型规格包

归档目录保留 proposal、delta spec、design 和 tasks；main specs 只保留当前事实。历史与当前状态分开，查阅成本较低。

## 4. 不建议使用的场景

- 团队需要非常严格的统一治理、强制模板门槛和大规模需求追踪，而又不准备定制 schema。默认 OpenSpec 较轻。
- 需求尚处于完全开放的探索阶段，却直接 `/opsx:propose`。应先 `/opsx:explore`。
- 希望工具自动证明代码正确。`/opsx:verify` 是 AI 辅助检查，不替代测试、代码评审或生产验证。
- 把所有历史 PRD 一次性导入 OpenSpec。官方明确建议把旧文档当背景材料，只为当前 change 提取相关 delta。
- 只想减少文档数量，但不会评审 proposal/spec/design。轻量不等于可以不做判断。

## 5. 在软件开发各阶段的用法

| 阶段 | 默认核心路径 | 扩展工作流 | 人工判断 |
|---|---|---|---|
| 探索 | `/opsx:explore` | 同左 | 问题是否值得做、范围是否清晰 |
| 提案 | `/opsx:propose` | `/opsx:new` | change 是否单一、命名是否准确 |
| 规格/设计/任务 | propose 一次生成 | `/opsx:continue` 或 `/opsx:ff` | 逐产物评审还是快速生成 |
| 调整 | `/opsx:update` 或直接编辑 | 同左，再 `/opsx:continue` | 是同一目标细化，还是应新建 change |
| 实现 | `/opsx:apply` | 同左 | 是否分批执行、测试是否真实通过 |
| 验证 | CLI validate + 项目测试 | `/opsx:verify` | artifact 与代码是否一致 |
| 同步 | `/opsx:sync`（可选） | 同左 | 是否要在归档前先合并主规格 |
| 归档 | `/opsx:archive` | `/opsx:archive` 或 bulk | specs 是否诚实描述已上线行为 |

## 6. 安装与初始化

### 6.1 前置条件

当前官方要求 Node.js 20.19.0 或更高版本。

```powershell
node --version
npm --version
```

### 6.2 安装

```powershell
npm install -g @fission-ai/openspec@latest
openspec --version
```

如果团队要求可复现，先在测试环境确认新版本，再统一记录版本；不要让成员在同一仓库长期使用差异过大的全局版本。

### 6.3 初始化现有项目

```powershell
Set-Location E:\path\to\task-manager
git status --short
openspec init
```

然后提交 OpenSpec 初始化产物和 AI 工具命令。不同工具的安装位置由 OpenSpec 自动适配；实际可用命令以初始化结果为准。

升级 OpenSpec 后，在每个项目内刷新 AI 指令：

```powershell
npm install -g @fission-ai/openspec@latest
openspec update
```

### 6.4 启用扩展工作流

默认 `core` profile 包含 `propose`、`explore`、`apply`、`update`、`sync`、`archive`。要使用 `new`、`continue`、`ff`、`verify`、`onboard` 等：

```powershell
openspec config profile
openspec update
```

在交互界面选择需要的 workflow。不要在教程之外盲目打开全部命令；团队命令集越多，越需要统一说明。

### 6.5 终端命令与对话命令不要混用

在 PowerShell 运行：

```powershell
openspec init
openspec list
openspec show add-task-priority
openspec validate add-task-priority
openspec view
```

在 Codex、Claude Code 或 Copilot 的 AI 对话框运行：

```text
/opsx:explore
/opsx:propose
/opsx:apply
/opsx:archive
```

OpenSpec 官方文档把混用两类命令列为最常见的新手错误。

## 7. 贯穿案例

仍使用同一个已上线任务管理系统：

1. 新增：任务支持 P0-P3 优先级。
2. 调整：列表默认排序从“创建时间倒序”变为“优先级 → 截止时间 → 创建时间”。
3. 约束：旧任务默认 P2；管理员可关闭入口但保留数据；不得破坏旧 API。

这次 change 名称：`add-task-priority`。

## 8. 默认核心路径实战

### 第 0 步：建立基线

```powershell
git status --short
git switch -c feat/add-task-priority
npm ci
npm test
npm run build
```

记录当前线上 tag/commit 和基线失败项。

### 第 1 步：先探索代码和需求

在 AI 对话框：

```text
/opsx:explore
我们准备在已上线任务管理系统增加 P0-P3 优先级，并调整默认排序。

先不要创建 change，也不要改代码。请读取：
- 任务数据模型与迁移规范；
- 创建/编辑 API；
- 列表查询、筛选、分页和排序；
- 项目功能开关；
- 相关单元、集成和端到端测试。

输出：当前行为、实际文件路径、受影响模块、未知问题、兼容和迁移风险。
把无法从代码确认的内容标为未知，不得猜测。
```

探索阶段不生成 artifact。你要先确认 AI 描述的现有行为与线上事实一致。

### 第 2 步：创建 change

```text
/opsx:propose add-task-priority

目标：成员能设置 P0-P3 优先级，列表按优先级和截止时间排序。

范围：
- 新建、编辑、展示和筛选 priority；
- 默认 P2；
- P0 最高、P3 最低；
- 排序为 priority 升序、due_at 升序、无 due_at 最后、created_at 升序、ID 稳定排序；
- 管理员关闭功能后前端隐藏入口，但后端保留字段和值；
- 旧任务迁移为 P2，迁移可回滚；
- 兼容旧 API 客户端。

不做：自定义等级、自动推断、跨项目模板。
验收：原有权限、分页、筛选和性能不得退化。
```

预期生成：

```text
openspec/changes/add-task-priority/
├─ proposal.md
├─ design.md
├─ tasks.md
└─ specs/
   └─ tasks/
      └─ spec.md
```

### 第 3 步：评审 proposal

五分钟检查：

- change 是否只解决一个主要目标。
- 背景和用户价值是否真实。
- 范围与不做什么是否清楚。
- 是否明确迁移、兼容、回滚和风险。
- 是否出现“顺手重构”或未批准功能。

不满意时使用：

```text
/opsx:update add-task-priority
把管理后台的批量修改优先级移出本次范围；补充旧 API 客户端兼容和回滚要求。先展示各 artifact 将如何受影响，逐项确认后再写入。
```

`/opsx:update` 只调整规划产物，不修改代码。

### 第 4 步：评审 delta spec

一个简化示例：

```markdown
# Delta for Tasks

## ADDED Requirements

### Requirement: Task priority
The system SHALL allow authorized users to assign P0, P1, P2, or P3 to a task.

#### Scenario: Default priority
- GIVEN an authorized user creates a task without specifying priority
- WHEN the task is saved
- THEN the task priority is P2

#### Scenario: Feature disabled
- GIVEN task priority is disabled for the project
- WHEN a user views or edits a task in the UI
- THEN priority controls are not displayed
- AND the stored priority value is preserved

## MODIFIED Requirements

### Requirement: Default task ordering
The system SHALL order tasks by priority ascending, due date ascending with missing dates last, creation time ascending, then task ID.

#### Scenario: Tasks have the same priority and due date
- GIVEN two tasks share the same priority and due date
- WHEN the task list is loaded
- THEN the earlier-created task appears first
- AND task ID resolves any remaining tie deterministically
```

检查规则：

- `ADDED` 是新行为。
- `MODIFIED` 应写出修改后的完整要求，不要只写一句“排序调整”。
- `REMOVED` 必须说明废弃原因和影响。
- 每个 Requirement 至少有能证明行为的 Scenario。
- Scenario 描述用户或系统可观察结果，不写函数内部调用。

### 第 5 步：评审 design

`design.md` 至少回答：

- priority 的数据类型、默认值和约束。
- 旧数据迁移规模、锁表风险、回滚方式。
- API 如何保持兼容。
- 数据库和前端如何实现稳定排序。
- 功能开关关闭后的读写行为。
- 测试策略、发布顺序、监控和回滚信号。
- 被否决方案及原因。

如果 design 与代码架构不符，先改 design，不要让 `/opsx:apply` 自行“灵活处理”。

### 第 6 步：评审 tasks

`tasks.md` 应形成可验证的顺序：

```markdown
## 1. Contract and tests
- [ ] 1.1 Add API compatibility tests for missing and present priority
- [ ] 1.2 Add failing ordering and feature-flag scenarios

## 2. Data
- [ ] 2.1 Add priority column, constraint, and index if justified
- [ ] 2.2 Add forward and rollback migrations
- [ ] 2.3 Verify existing rows become P2

## 3. Backend and frontend
- [ ] 3.1 Implement validation and serialization
- [ ] 3.2 Implement deterministic ordering
- [ ] 3.3 Add UI controls and disabled-state behavior

## 4. Verification and release
- [ ] 4.1 Run regression and performance checks
- [ ] 4.2 Rehearse migration and rollback
- [ ] 4.3 Update release and monitoring notes
```

### 第 7 步：格式验证

在终端运行：

```powershell
openspec list
openspec show add-task-priority
openspec validate add-task-priority
```

`validate` 验证 OpenSpec artifact 格式和结构，不会证明业务需求正确。

### 第 8 步：分批实现

```text
/opsx:apply add-task-priority

分四批执行并在每批后暂停：
1. 契约和失败测试；
2. 数据迁移与回滚；
3. 后端；
4. 前端、回归和发布准备。

每批报告修改文件、已完成 tasks、实际测试命令和结果、偏离 design 的地方。未经确认不得扩大范围。
```

`/opsx:apply` 会从第一条未完成任务继续，并勾选 `tasks.md`。但任务被勾选不等于测试真实通过，仍要检查终端输出和 diff。

### 第 9 步：实现中需求变化

如果仍是同一个目标，只是方案细化：

```text
/opsx:update add-task-priority
数据库不允许新增枚举类型，改为受约束的小整数；产品行为不变。请更新 design 和相关 tasks，不修改 proposal/delta spec 中未受影响的内容。
```

然后：

```text
/opsx:apply add-task-priority
```

如果目标从“增加固定优先级”变成“建设可配置的工作流优先级系统”，应停止当前 change，新建 change。判断规则：

- 同一目标、更好的做法：更新当前 change。
- 缩小范围：更新、完成并归档；后续另建 change。
- 问题本身变了或范围膨胀成另一件事：新建 change。

### 第 10 步：验证

项目自己的质量命令：

```powershell
npm test
npm run lint
npm run typecheck
npm run build
openspec validate add-task-priority
```

启用扩展 workflow 后，在 AI 对话框：

```text
/opsx:verify add-task-priority
```

它检查：

- Completeness：任务、需求和场景是否有实现证据。
- Correctness：实现是否符合规格意图和边界。
- Coherence：设计决策是否反映到代码。

`verify` 的 warning 不会阻止归档，因此团队必须规定：CRITICAL 必须清零，WARNING 必须修复或记录明确的人工豁免。

### 第 11 步：同步与归档

对于快速 change，直接：

```text
/opsx:archive add-task-priority
```

归档会检查 artifact 和 tasks，并在 delta 尚未同步时询问是否同步。确认后：

- delta 合并到 `openspec/specs/tasks/spec.md`。
- change 移入 `openspec/changes/archive/YYYY-MM-DD-add-task-priority/`。

以下情况可先单独同步：

```text
/opsx:sync add-task-priority
```

- change 很长，希望提前评审主规格合并结果。
- 其他并行 change 需要新的主规格作为基线。
- 想把“合并 specs”和“归档”拆成两次审查。

`sync` 不归档，change 仍保持 active。

## 9. 扩展工作流实战

复杂需求需要逐个评审 artifact 时：

```text
/opsx:new add-task-priority
/opsx:continue add-task-priority   # 逐个生成下一个可用 artifact
/opsx:continue add-task-priority
...
/opsx:apply add-task-priority
/opsx:verify add-task-priority
/opsx:archive add-task-priority
```

需求清晰、希望一次生成全部规划产物时：

```text
/opsx:new add-task-priority
/opsx:ff add-task-priority
/opsx:apply add-task-priority
/opsx:verify add-task-priority
/opsx:archive add-task-priority
```

我的建议：

- 小而明确的 change：`propose`。
- 复杂、高风险或多角色 change：`new + continue`。
- 已经经过充分探索、结构明确：`new + ff`。

## 10. 已有 PRD 怎么用

不要把整份历史 PRD 一次性转换为 `openspec/specs/`。正确做法：

1. 将 PRD 作为背景资料。
2. 针对现在要开发的 change，指向相关章节。
3. 让 `/opsx:explore` 对照代码确认当前行为。
4. 只把本次改变写成可测试 delta。
5. 归档后主 specs 才增加这部分真实行为。

示例：

```text
/opsx:explore
请读取 docs/PRD.md 的“任务优先级”章节，并对照当前任务模型、API、列表查询和测试。只分析本次准备实现的差异，不要转换整份 PRD。
```

## 11. 常见失败与处理

### 问题 1：直接在 PowerShell 输入 `/opsx:propose`

处理：`/opsx:*` 输入 AI 对话框；`openspec *` 输入终端。

### 问题 2：为整个旧系统补全 specs 后才开始改需求

处理：停止回填。只为当前要改的切片创建 delta，让主 specs 随真实 change 生长。

### 问题 3：MODIFIED 只写差异句，没有完整新行为

处理：写出修改后的完整 requirement 和 scenario。归档后它要能替换原要求并独立成立。

### 问题 4：手工改了代码，artifact 没改

处理：判断哪一边代表正确决定。如果代码正确，回写 delta/design/tasks；如果 specs 正确，继续修代码。归档前二者必须一致。

### 问题 5：同一 change 不断膨胀

处理：同一目标细化就 update；目标改变或形成独立价值时新建 change。不要把季度项目塞进一个 change。

### 问题 6：tasks 全勾选就直接 archive

处理：运行项目测试、`openspec validate`、人工验收；复杂或高风险 change 再运行 `/opsx:verify`。

### 问题 7：升级 CLI 后对话命令仍是旧版

处理：在项目目录运行 `openspec update`，审查其生成差异后提交。

## 12. Spec Kit 与 OpenSpec 怎么选

| 维度 | Spec Kit | OpenSpec |
|---|---|---|
| 默认流程 | 更阶段化、产物更丰富 | change/delta 驱动、流程更流动 |
| 新项目 | 很强 | 可用 |
| 现有项目小改动 | 可用，需要选规格演进模型 | 默认优势场景 |
| 治理与统一原则 | constitution 很突出 | 依赖 config/schema/团队约定 |
| 当前事实 | 取决于团队选择的持久化模型 | main `specs/` 明确表示当前事实 |
| 变更历史 | feature 目录与 Git 历史 | archive 目录显式保存每次 change |
| Artifact 数量 | 通常更多，设计附件更细 | 默认 proposal/spec/design/tasks |
| 中途返回修改 | 可以，但要主动选择并对齐模型 | 原生鼓励随时编辑与 update |

选择建议：

- 新项目、需求复杂、需要严谨计划和治理：优先 Spec Kit。
- 已上线项目高频小变更、希望 change 级归档：优先 OpenSpec。
- 已经用 Spec Kit 上线且产物完整：先继续 Spec Kit，不要为工具偏好迁移。
- 不要在同一个 feature 上同时运行两套完整流程，会产生两个规格真相来源。

## 13. 最终质量门槛

- [ ] change 只承载一个清晰目标。
- [ ] proposal 的范围和非目标已批准。
- [ ] delta 正确使用 ADDED/MODIFIED/REMOVED/RENAMED。
- [ ] requirement 和 scenario 可独立验证。
- [ ] design 基于真实源码并包含迁移、兼容、回滚。
- [ ] tasks 可执行且覆盖测试与发布验证。
- [ ] `openspec validate <change>` 通过。
- [ ] 代码测试、构建和关键人工验收通过。
- [ ] `/opsx:verify` 的 critical 已清零，高风险 warning 已处理。
- [ ] archive 前 artifact 与实际代码一致。
- [ ] 同步后的 main specs 描述的是已实现事实，而不是愿望。

## 14. 你真正要记住的流程

```text
先探索真实代码
    ↓
proposal：为什么改、改什么
    ↓
delta spec：行为如何变化
    ↓
design：怎么实现
    ↓
tasks：怎么执行和验证
    ↓
apply + 测试 + verify
    ↓
sync/archive：把已实现变化写回当前事实
```

OpenSpec 的最大优点也是它的风险：artifact 很容易改。团队必须把“归档前规格必须诚实反映代码”设为硬门槛，否则灵活会退化成漂移。
