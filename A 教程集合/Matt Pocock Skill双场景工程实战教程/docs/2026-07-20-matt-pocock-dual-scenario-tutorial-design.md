# Matt Pocock Skills 双场景工程实战教程设计说明

## 目标

制作一份中文、单文件 HTML 教程，让读者理解如何在 Codex 中把 Matt Pocock Skills 应用于两类真实工程任务：

1. 新项目从模糊想法走到可实施 V1。
2. 已有项目从增量需求走到完成审查与交接。

教程是流程教学，不创建演示代码库，不连接真实 Issue Tracker，不安装或调用 Matt Pocock Skills。

## 目标读者

- 懂产品与技术，但第一次系统使用 Matt Pocock Skills 的 Codex 用户。
- 已经知道 Skill 是什么，需要学习“什么时候调用、如何串联、输入输出如何衔接”的工程实践者。

## 成功标准

- 同一 HTML 中完整呈现“新项目 0→1”和“已有项目增量开发”两条路线。
- 每个阶段固定包含：场景、进入条件、作用、技能、选择理由、输入、Codex 提示词、Codex 动作、输出、人工确认点、完成标准、常见误用、下一阶段。
- 清楚区分主流程技能、条件分支技能、底层参考技能和流程外独立技能。
- 不把 Skill 描述成必须机械执行的线性流水线；展示实际分支条件。
- 提供可直接复制的 Codex 提示词，但不声称这些提示词会触发当前未安装技能。
- 页面支持路线切换、阶段导航、展开教学、提示词复制和“当前该用哪个技能”决策器。
- 在 375px、768px、1440px 下无横向溢出，交互无控制台错误。
- 除官方来源链接外无运行时网络依赖。

## 统一案例

### 路线 A：新项目 0→1

虚构项目为“AI 客户访谈洞察平台”。核心目标：上传访谈记录，提炼客户问题与机会，支持团队标签整理，并输出洞察报告；先交付一个可验证 V1。

路线：

```text
setup-matt-pocock-skills
→ ask-matt
→ wayfinder 或 grill-with-docs
→ research / prototype
→ domain-modeling
→ to-spec
→ to-tickets
→ implement + tdd
→ code-review
→ handoff
```

关键分支：只有当项目大到无法在一个会话中看清路线时才使用 `wayfinder`；范围可以在一次持续讨论中澄清时直接使用 `grill-with-docs`。

### 路线 B：已有项目增量需求

同一平台已上线，新增“团队邀请与角色权限”功能，包含邀请有效期、撤销、重复接受保护和审计记录。

路线：

```text
读取 CONTEXT / ADR / 代码
→ 判断需求来源
→ grill-with-docs 或 triage
→ prototype / codebase-design
→ to-spec
→ to-tickets
→ implement + tdd
→ code-review
→ resolving-merge-conflicts（仅在冲突时）
→ handoff
```

关键分支：内部提出的增量想法走 `grill-with-docs`；外部 Issue/PR 进入 `triage`；如果问题本质是故障，则切换为 `diagnosing-bugs → tdd → code-review`。

## 教学结构

### 1. 首屏

- 教程目标和两条路线概览。
- 先给结论：Skill 是条件路由，不是每次全部执行。
- 显示新项目与增量开发的核心差异。

### 2. 使用前认知

- 用户调用与模型调用的区别。
- Skill 本体、项目配置、工程产物的区别。
- 在 Codex 中通过明确点名 Skill 与完整描述任务来降低误触发。

### 3. 双路线地图

- 点击“新项目 0→1”或“已有项目增量”切换路线。
- 流程节点显示阶段、主技能与条件分支。
- 点击节点滚动到对应教学章节。

### 4. 新项目 0→1 教学

阶段为：准备、路由、消除大范围迷雾、需求澄清、研究/原型、领域语言、规格、Ticket、实现/TDD、审查、交接。

### 5. 已有项目增量教学

阶段为：读取既有事实、判断需求入口、澄清或分诊、验证设计问题、规格、纵向拆解、实现/TDD、审查、冲突处理、交接。

### 6. 条件支线

- Bug：`diagnosing-bugs`。
- 架构缺乏测试 seam：`improve-codebase-architecture` + `codebase-design`。
- 超大型多会话工作：`wayfinder`。
- Merge/Rebase 冲突：`resolving-merge-conflicts`。
- 上下文接近极限：`handoff`。

### 7. Codex 对话实录

分别展示两条路线中最关键的用户消息、Codex 应有行为、用户确认与产物衔接。对话不是伪造真实执行结果，而是教学示范。

### 8. 决策器与速查

读者选择“新项目/已有项目”“想法/Issue/Bug”“单会话/多会话”“是否需要可运行验证”等条件，页面返回推荐 Skill、理由和下一步提示词。

### 9. 流程外工具

说明 `teach`、`writing-great-skills` 等不属于本教程两条工程主流程，避免为了覆盖数量而误导使用。

## 每阶段统一信息模型

```text
stageId
route
stageNumber
title
scene
entryCondition
purpose
primarySkills
whyTheseSkills
inputs
codexPrompt
codexActions
outputs
humanGate
doneWhen
misuses
next
```

HTML 中的阶段卡片、路线统计和搜索均从同一份内嵌数据生成，避免多份流程描述相互矛盾。

## 交互

- 路线切换：新项目 / 增量需求。
- 阶段展开：默认展开当前路线第一阶段，其他按需展开。
- 提示词复制：成功后使用非阻塞状态提示。
- 决策器：通过 3–4 个选择给出推荐 Skill，不执行任何外部操作。
- 对照模式：并排显示两条路线在“起点、探索、规格、实现、异常处理”上的不同。
- 无 JavaScript 时仍保留两条路线的核心静态流程和使用原则。

## 视觉方向

- 工程训练手册风格，强调顺序、分支、输入输出与完成门槛。
- 新项目路线使用蓝色标识，增量路线使用绿色标识，风险与误用使用橙红色。
- 不使用营销式 Hero、渐变背景、装饰性图形或大量阴影卡片。
- 使用本地系统字体与等宽字体，保证离线打开。

## 边界与风险说明

- 官方仓库以 `/skill-name` 表示用户调用；Codex 中实际呈现形式取决于安装器和客户端，教程同时给出“明确点名技能”的自然语言写法。
- `implement` 会内部使用 `tdd` 和 `code-review`；教程会避免让用户重复手动启动同一阶段流程。
- `code-review`、`research` 等技能依赖子代理能力；教程会标明平台条件。
- `resolving-merge-conflicts` 的“始终解决、不 abort”是官方技能立场；教程加入人工确认和可逆性提醒。
- 不与 gstack、Superpowers 混编。本教程只教 Matt 流程，上一份教程负责体系冲突比较。

## 输出与验证

主输出：

`E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\Matt-Pocock-Skills-Codex双场景工程实战教程.html`

验证：

- 两条路线均有完整阶段数据。
- 每个阶段均具备统一信息模型的所有字段。
- 复制、路线切换、阶段展开、决策器正常。
- 375 / 768 / 1440 三视口无横向溢出。
- 无远程脚本、远程字体和浏览器控制台错误。
