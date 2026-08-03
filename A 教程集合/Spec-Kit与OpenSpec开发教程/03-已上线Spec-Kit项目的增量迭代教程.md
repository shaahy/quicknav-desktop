# 已上线 Spec Kit 项目的增量迭代教程

> 适用前提：项目已经根据需求文档用 Spec Kit 完成 MVP、已经上线，现在要新增小需求或调整既有需求。本文默认继续使用 Spec Kit，不默认迁移 OpenSpec。

## 1. 先给结论

你后续最好提供三类资料，而且重要性不同：

1. **当前源码和当前线上版本**：回答“系统现在真实做了什么”。这是最高优先级。
2. **现有 Spec Kit 完整产物**：回答“当时承诺做什么、为什么这么设计、任务如何拆分”。不要只提供 `spec.md`、`tasks.md` 两个文件。
3. **本次新增/调整需求和历史需求文档**：回答“现在希望改变什么、原始意图是什么”。

只提供旧需求文档不够，因为上线后的代码可能已经偏离；只提供源码也不够，因为无法判断哪些行为是产品决定、哪些只是实现偶然；只提供几个 Markdown 也不够，因为会丢失 constitution、数据模型、契约、研究和检查表。

推荐把整个项目 Git 仓库的脱敏副本与需求资料放在同一总文件夹中，具体见第四份清单。

## 2. 你的项目当前最适合哪种演进模型

Spec Kit 官方定义了三种模型，而且没有默认值：[Spec Persistence Models](https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md)。

### 推荐：默认采用 Flow-forward

对于“已经上线、现在新增小需求和调整需求”的项目，我建议默认规则是：

> 已完成并上线的 feature 目录作为历史记录保留；每次可独立验收的新增或行为调整，创建新的 feature spec，并通过链接说明它扩展或取代了哪个旧需求。

原因：

- 已上线产物有审计价值，不应反复覆盖。
- 新旧行为可以在 Git diff 和独立目录中清楚比较。
- 回滚时更容易知道哪次变化引入了什么。
- 适合产品负责人逐个批准小需求。

代价是信息会分散，因此必须建立 lineage（演进关系）。

### 例外：什么时候使用 Living spec

如果现有某个 `spec.md` 已经被团队明确当成持续维护的产品契约，而且多人日常都会以它判断当前行为，可以修改原 `spec.md`：

1. 先改 `spec.md`。
2. 再更新或重生成 `plan.md`。
3. 再更新或重生成 `tasks.md`。
4. 运行 `/speckit.analyze`。
5. 实现、测试并 `/speckit.converge`。

风险：重生成 derived artifact 时可能丢失重要技术理由。应先把重要决定转存到 ADR、design decision 或不可覆盖区。

### 例外：什么时候使用 Flow-back

当实现探索很强，开发中很可能发现“需求本身要改”，可以从代码、tasks、plan 或 spec 任一层记录发现，再统一对齐。

只适合：

- 小团队。
- 负责人能及时审查 artifact diff。
- 有明确的“合并前必须重新 analyze/converge”纪律。

它不是“先写代码、以后有空补文档”的许可证。

## 3. 一次增量开发的安全总流程

```text
确认线上基线
    ↓
盘点源码 + 旧 specs + 新需求
    ↓
判断：新建 feature 还是更新 living spec
    ↓
specify/修改 spec → clarify → plan → checklist
    ↓
tasks → analyze
    ↓
人工批准规格、技术方案、迁移和回滚
    ↓
分批 implement + 自动测试 + 人工验收
    ↓
converge，修完剩余缺口
    ↓
预发布、迁移预演、发布、监控、可回滚
```

## 4. 开始之前：把现状冻结成可比较基线

### 4.1 记录线上版本

至少记录：

- 生产环境对应 Git commit SHA。
- 当前版本 tag。
- 数据库 schema/migration 版本。
- 部署环境和关键配置版本。
- 已知线上问题。

示例：

```powershell
git rev-parse HEAD
git tag --points-at HEAD
git status --short
```

如果当前本地源码无法确认对应线上版本，应先解决这个问题，再让 AI 做增量开发。否则所谓“回滚”没有可信起点。

### 4.2 在原始状态运行测试

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

按真实项目替换命令。输出分为：

- 基线已经失败的问题。
- 本次变更后新增的失败。

不要让 AI 把所有历史失败都算作本次完成条件，也不要把新增失败归咎于历史基线。

### 4.3 建立功能分支

先检查项目是否启用了 Spec Kit Git 扩展：

```powershell
specify extension list
```

如果已经启用 Git 扩展，从干净的默认分支运行 `/speckit.specify`，其 `before_specify` hook 会创建 feature 分支，不要再手动执行一次 `git switch -c`。

如果没有启用 Git 扩展，则手动创建分支：

```powershell
git switch -c feat/add-task-priority
```

这里要严格区分：Spec Kit 的 feature 首先是一个新的 `specs/<编号>-<短名称>/` 规格目录；Git 分支是推荐的交付隔离手段，两者名称和编号不要求相同。每个可独立发布或回滚的需求，建议使用独立分支和独立 feature spec。不要把多个无关“小需求”打包成一个超级 spec。

## 5. 先做项目资料盘点

要求 AI 只读分析，不改文件：

```text
先不要修改代码或 Spec Kit 产物。

请盘点：
1. 当前源码实际行为；
2. `.specify/` 中的 constitution、模板和脚本；
3. `specs/` 中与本次需求相关的历史 feature；
4. 原始需求文档和历史变更记录；
5. 测试、数据库迁移、API、部署和回滚约束。

输出四张表：
- 新需求与当前行为差异；
- 当前行为与旧 spec 差异；
- 本次受影响文件/模块；
- 未知问题和需要产品决定的问题。

所有结论必须标注证据文件路径；不确定就写不确定，不得推测。
```

最终要形成“三态对照”：

| 项目 | 原需求/旧 spec | 当前线上行为 | 本次目标行为 |
|---|---|---|---|
| 优先级字段 | 无 | 无 | P0-P3，默认 P2 |
| 默认排序 | 创建时间倒序 | 截止时间优先、再创建时间 | priority、截止时间、创建时间、ID |
| 关闭能力 | 无 | 无 | 隐藏入口但保留数据 |

如果三态对照不清楚，不要进入 plan。

## 6. 场景 A：新增一个独立小需求

例子：任务增加 P0-P3 优先级。

### 6.1 选择规则

满足下列任一条件，创建新的 feature 目录：

- 用户获得新的可见能力。
- 新增数据字段、API、权限或状态。
- 可以独立验收和发布。
- 需要单独回滚。

### 6.2 创建新 spec

在 AI 对话中：

```text
/speckit.specify
为已上线任务管理系统增加 P0-P3 任务优先级。

这是对历史 feature `00X-task-management-mvp` 的增量扩展，不修改其历史文件。
目标、范围、非目标、默认值、权限、功能开关、旧数据迁移、API兼容和验收标准如下：
[粘贴已批准的新需求]

在新 spec 的“Related/Supersedes”说明中链接相关旧 feature，并明确哪些历史行为保持不变。
只定义产品行为，不提前决定技术实现。
```

预期：

```text
specs/
├─ 00X-task-management-mvp/       # 历史记录，不改
│  ├─ spec.md
│  ├─ plan.md
│  └─ tasks.md
└─ 00Y-add-task-priority/         # 新增需求
   └─ spec.md
```

### 6.3 明确继承和覆盖关系

新 `spec.md` 建议增加项目约定区：

```markdown
## Relationship to Existing Features

- Extends: `specs/00X-task-management-mvp/spec.md`
- Preserves: existing task permissions, pagination and filtering
- Changes: task fields, default ordering and project-level feature controls
- Does not supersede: task creation, assignment and completion workflows
```

这不是 Spec Kit 强制格式，但能解决 flow-forward 的最大问题：上下文分散。

### 6.4 走完整质量链

```text
/speckit.clarify
/speckit.plan
/speckit.checklist
/speckit.tasks
/speckit.analyze
```

产品负责人批准 `spec.md`；技术负责人批准 `plan.md`、迁移和回滚；开发前处理 analyze 的高优先级问题。

### 6.5 分批实现和收敛

```text
/speckit.implement
```

要求按“测试 → 数据 → 后端 → 前端 → 发布验证”分批暂停。

完成后：

```text
/speckit.converge
```

如果它向 `tasks.md` 追加缺口任务，则再次 implement 和 converge，直到没有剩余缺口。

## 7. 场景 B：调整一个已上线需求

例子：原来任务到期前 24 小时提醒，现在调整为“高优先级提前 48 小时，其余仍为 24 小时”。

### 7.1 先判断：这是修复、调整还是全新能力

| 判断 | 做法 |
|---|---|
| 代码不符合已批准 spec | 修复代码；通常不改产品 spec |
| 产品决定改变已上线行为 | 创建新 feature 或更新 living spec |
| 原 spec 有歧义，现在只是澄清 | 更新可维护 spec，并记录解释；检查是否影响代码 |
| 目标已经变成另一类产品能力 | 新建独立 feature |

不能把“产品改需求”伪装成 bug fix，否则历史上看不出行为为何变化。

### 7.2 推荐做法：新建调整 feature

```text
/speckit.specify
调整已上线任务提醒规则。

历史来源：`specs/00X-task-reminders/spec.md`。
原行为：所有有截止时间的任务在到期前 24 小时提醒一次。
新行为：P0/P1 在到期前 48 小时提醒，P2/P3 仍为 24 小时；任务优先级改变后应重新计算尚未发送的提醒；已经发送的提醒不重复。

明确：
- 生效时间和存量任务处理；
- 时区和夏令时；
- 优先级变更、截止时间变更、任务完成/取消；
- 重试、去重和失败处理；
- 回滚后如何恢复旧规则。

列出被替代的旧需求编号，以及仍保持不变的历史场景。
```

新 spec 不应只写“提前时间由 24 改 48”。它必须包含完整可验收行为和变更影响。

### 7.3 如果采用 Living spec

先创建分支并提交当前 artifact 快照，再编辑旧 `spec.md`：

```text
/speckit.clarify
请基于新的提醒规则更新当前 spec.md。保留旧行为的变更说明，列出受影响 Requirement 和 Scenario，不修改无关需求。
```

然后依次：

```text
/speckit.plan
/speckit.tasks
/speckit.analyze
/speckit.implement
/speckit.converge
```

重生成前把不可丢失的技术理由转移到 ADR 或保留区，并逐个审查 Markdown diff。

## 8. 场景 C：实现中发现需求或方案需要调整

例子：原 plan 准备使用数据库枚举，但项目部署环境不允许在线修改枚举；需要改为受约束的小整数。

### 8.1 先分层判断

| 发现 | 应更新什么 |
|---|---|
| 只改变实现手段，用户行为不变 | `plan.md`、`tasks.md`，必要时 design/ADR |
| 改变用户可观察行为 | 先更新并批准 `spec.md` |
| 增加实现任务但不改方案 | `tasks.md` |
| 暴露了全新目标 | 暂停当前 feature，另建 feature |

### 8.2 Flow-back 对齐流程

```text
实现中发现数据库枚举方案不适用。

请：
1. 在 plan.md 记录新约束和替代方案；
2. 检查是否影响 spec.md 的外部行为；
3. 更新 tasks.md 中迁移、约束和测试任务；
4. 列出所有发生变化的 artifact；
5. 暂停实现，等待批准。
```

批准后：

```text
/speckit.analyze
/speckit.implement
/speckit.converge
```

严禁只改代码、不改 plan/tasks，然后继续勾选旧任务。

## 9. 小需求是否需要完整 Spec Kit 流程

不是所有小改动都需要同样重量。建议按风险分级：

### L0：纯内部、无行为变化

例子：修正注释、格式、内部变量名。

- 通常不创建 feature spec。
- 走正常代码评审和测试。
- 若重构可能改变行为，升级到 L1。

### L1：小范围、行为明确、无数据迁移

例子：增加一个已有数据的前端展示开关。

- 建立轻量 spec。
- clarify 可在 spec 评审中完成。
- plan/tasks 可以精简，但不能缺验证和回滚判断。
- analyze、测试、converge 仍建议执行。

### L2：有数据、API、权限或多端影响

例子：新增 priority 字段。

- 走完整 specify/clarify/plan/checklist/tasks/analyze/implement/converge。
- 需要迁移预演和回滚。

### L3：高风险或不可逆

例子：计费、资金、权限模型、用户数据删除、跨服务协议变化。

- 完整流程。
- 增加安全/合规评审、灰度、双写或回填验证。
- 不可逆操作必须单独人工确认。

“需求小”不等于“风险低”。一个字段可能触发迁移、API 兼容、排序性能和旧客户端问题。

## 10. 不要把 Spec Kit 升级和功能开发混在一起

Spec Kit 有两个独立变化源：

1. 工具本身和项目管理文件升级。
2. `specs/` 中产品 feature artifact 演进。

功能分支里优先只做第 2 类。如果确实要升级：

```powershell
specify self check
specify self upgrade --dry-run
```

另建工具升级分支，保护：

- `.specify/memory/constitution.md`
- `.specify/templates/` 下的定制
- `.specify/scripts/` 下的定制
- AI 工具命令/skills 目录

然后才考虑：

```powershell
specify init --here --force --integration codex --integration-options="--skills"
```

逐文件审查差异并单独合并。官方也明确提示强制刷新可能覆盖共享项目文件，而 `specs/` 不属于模板包。[Evolving Specs 指南](https://github.com/github/spec-kit/blob/main/docs/guides/evolving-specs.md)

## 11. PR/代码评审应看到什么

一份完整增量 PR 建议包含：

- 新建或更新的 `spec.md`。
- `plan.md` 和必要的 `research.md`、`data-model.md`、`contracts/`。
- `tasks.md` 及完成状态。
- 源码和测试。
- 数据库迁移与回滚迁移。
- 发布/灰度/监控说明。
- 与旧 feature 的关系链接。
- `/speckit.analyze` 和 `/speckit.converge` 结论摘要。

评审顺序建议：

1. 先看 spec：改了什么行为。
2. 再看 plan：如何实现、风险和取舍。
3. 再看 tasks：是否漏工作。
4. 再看测试：是否证明场景。
5. 最后看代码：是否忠实实现且没有越界。

直接从代码 diff 开始，很容易错过“代码完整实现了一个错误需求”。

## 12. 发布与回滚门槛

### 发布前

- [ ] 线上基线 commit/tag 已记录。
- [ ] spec、plan、tasks、代码、测试一致。
- [ ] 数据迁移已在接近生产规模的数据上预演。
- [ ] 回滚迁移或前向修复策略可执行。
- [ ] 新旧 API/客户端兼容已验证。
- [ ] 功能开关、灰度和监控已配置。
- [ ] 自动化测试、构建、关键人工验收通过。
- [ ] `/speckit.converge` 无未处理缺口。

### 发布后

- [ ] 核对关键业务指标和错误率。
- [ ] 核对迁移数据数量和异常记录。
- [ ] 执行核心用户路径冒烟测试。
- [ ] 记录真实上线版本。
- [ ] 如线上现实导致规格调整，回写 artifact，不能只留在聊天或口头。

## 13. 是否要迁移到 OpenSpec

当前不建议立刻迁移。先观察 3-5 次真实增量迭代，再用证据判断。

考虑 OpenSpec 的信号：

- 每次都是小 change，Spec Kit 全套产物明显过重。
- 团队希望主 specs 明确表示“系统当前行为”。
- 希望 proposal/delta/design/tasks 按 change 归档。
- 实现中频繁返回调整 artifact，希望流程更流动。

继续 Spec Kit 的信号：

- constitution、完整 plan 和设计附件对质量很重要。
- 现有产物已形成团队工作习惯。
- 需求复杂，需要强澄清、checklist 和一致性门槛。
- 迁移会制造两个并存的规格真相来源。

如果未来迁移，建议从一个低风险新 change 试点，不要批量转换全部历史 spec；旧 Spec Kit 产物保持只读历史，明确迁移日期和新的 source of truth。

## 14. 给你的下一步操作

1. 按第四份文档整理项目资料。
2. 提供一个真实的新增/调整需求，不需要一次提供全部 backlog。
3. 我先做只读盘点，输出三态对照和受影响面。
4. 你确认采用 flow-forward 还是 living spec。
5. 再为真实项目生成专属 spec 输入、命令顺序、审核问题和发布清单。

在未看到源码、旧 artifacts 和新需求前，我不会判断应该修改哪个具体 `spec.md`，也不会推测项目架构。
