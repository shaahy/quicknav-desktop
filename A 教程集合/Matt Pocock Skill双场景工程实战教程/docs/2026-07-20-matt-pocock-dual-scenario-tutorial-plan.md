# Matt Pocock Skills Codex 双场景教程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一份单文件中文 HTML，通过新项目 0→1与已有项目增量开发两条路线，教授用户在 Codex 中选择和串联 Matt Pocock Skills。

**Architecture:** HTML 内嵌两条路线的结构化阶段数据，原生 JavaScript 负责路线切换、阶段卡片渲染、提示词复制和技能决策器。核心原则与路线概览使用静态 HTML，确保禁用 JavaScript 时仍能理解主要流程。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、PowerShell 静态检查、Playwright + 本机 Edge 浏览器验证。

## Global Constraints

- 只生成教程，不创建演示代码库，不连接真实 Issue Tracker。
- 不安装、运行或修改 Matt Pocock Skills。
- 主输出为 `E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\Matt-Pocock-Skills-Codex双场景工程实战教程.html`。
- 页面单文件离线可用，不加载远程脚本或字体。
- 新项目路线和增量开发路线均使用已核验的官方 Skill 行为。
- 每个阶段包含设计说明定义的 15 个字段。
- Codex 示例是教学提示词，不伪造真实执行结果。
- 不与 gstack 或 Superpowers 混编。

---

### Task 1: 建立双路线阶段数据

**Files:**
- Create: `E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\Matt-Pocock-Skills-Codex双场景工程实战教程.html`

**Interfaces:**
- Consumes: 已批准的设计说明、上一份教程的官方内容核验清单。
- Produces: `routes`、`stages`、`branches` 三组内嵌数据，供页面所有流程组件复用。

- [ ] **Step 1: 定义新项目路线**

新项目数据必须覆盖以下阶段：

```text
01 项目级准备
02 选择路线
03 判断是否需要 Wayfinder
04 需求访谈与领域建模
05 研究与原型验证
06 固化领域语言
07 生成 Spec
08 拆成纵向 Tickets
09 Implement + TDD
10 双轴审查
11 交接与下一会话
```

- [ ] **Step 2: 定义已有项目增量路线**

增量数据必须覆盖以下阶段：

```text
01 读取现有事实
02 判断需求来源
03 内部澄清或外部分诊
04 验证状态与模块接口
05 生成增量 Spec
06 拆成纵向 Tickets
07 Implement + TDD
08 双轴审查
09 条件式冲突处理
10 交接与收尾
```

- [ ] **Step 3: 定义五条条件支线**

```text
bug → diagnosing-bugs
no-seam → improve-codebase-architecture + codebase-design
huge-fog → wayfinder
merge-conflict → resolving-merge-conflicts
context-limit → handoff
```

- [ ] **Step 4: 保证字段完整**

每个阶段对象都必须包含：

```javascript
{
  stageId, route, stageNumber, title, scene, entryCondition,
  purpose, primarySkills, whyTheseSkills, inputs, codexPrompt,
  codexActions, outputs, humanGate, doneWhen, misuses, next
}
```

### Task 2: 构建教程页面与交互

**Files:**
- Modify: `E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\Matt-Pocock-Skills-Codex双场景工程实战教程.html`

**Interfaces:**
- Consumes: Task 1 的 `routes`、`stages`、`branches`。
- Produces: `selectRoute(routeId)`、`renderStages(routeId)`、`copyPrompt(text, button)`、`recommendSkill()`。

- [ ] **Step 1: 写入静态教学骨架**

页面必须包含：

```html
<header id="top">教程定位与双路线结论</header>
<nav aria-label="教程目录">...</nav>
<main>
  <section id="mental-model">使用前认知</section>
  <section id="route-map">双路线地图</section>
  <section id="stage-teaching">阶段实战教学</section>
  <section id="branches">条件支线</section>
  <section id="dialogues">Codex 对话教学</section>
  <section id="decision-helper">Skill 决策器</section>
  <section id="comparison">两条路线对照</section>
  <section id="checklist">实践检查清单</section>
</main>
<footer id="sources">边界与来源</footer>
```

- [ ] **Step 2: 实现路线切换和阶段渲染**

```javascript
function selectRoute(routeId) {
  activeRoute = routeId;
  renderRouteMap(routeId);
  renderStages(routeId);
  updateRouteButtons(routeId);
}
```

阶段卡片使用 `<details>`，摘要显示场景、技能和进入条件，展开后显示输入、Codex 提示词、动作、输出、人工确认和完成标准。

- [ ] **Step 3: 实现提示词复制**

```javascript
async function copyPrompt(text, button) {
  await navigator.clipboard.writeText(text);
  button.textContent = "已复制";
}
```

文件协议下 Clipboard API 失败时，使用隐藏 `textarea` 和 `document.execCommand("copy")` 回退。

- [ ] **Step 4: 实现 Skill 决策器**

决策器输入为项目状态、任务类型、任务规模、是否需要运行验证，输出推荐 Skill、理由和下一条可复制提示词。核心规则：

```text
new + huge → wayfinder
new + scoped → grill-with-docs
existing + incoming-issue → triage
existing + feature → grill-with-docs
existing + bug → diagnosing-bugs
any + runnable-question → prototype
any + context-limit → handoff
```

- [ ] **Step 5: 完成响应式与可访问性**

使用本地字体、语义化标题、44px 触控目标、`:focus-visible`、`prefers-reduced-motion`，并针对 375、768、1024、1440px 调整路线图、双列阶段卡与对照表。

### Task 3: 自动验证与最终验收

**Files:**
- Create: `E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\docs\validate-dual-scenario-tutorial.mjs`

**Interfaces:**
- Consumes: 完成的 HTML。
- Produces: 三视口验证 JSON 输出；验证期间截图写入系统临时目录，不作为教程交付物。

- [ ] **Step 1: 静态检查**

检查：HTML 存在、两条路线、21 个主阶段、5 个支线、无远程脚本与字体。

- [ ] **Step 2: Playwright 交互检查**

验证：路线切换后阶段数变化、第一阶段默认展开、复制反馈、决策器覆盖 new/feature/bug 三类、无控制台错误。

- [ ] **Step 3: 三视口检查**

在 `375×812`、`768×1024`、`1440×1000` 检查无横向溢出，路线按钮、阶段卡和决策器可见可用。

- [ ] **Step 4: 最终内容断言**

```powershell
$html = Get-Content -Raw 'E:\元梦工作空间\临时\Matt Pocock Skill双场景工程实战教程\Matt-Pocock-Skills-Codex双场景工程实战教程.html'
@{
  Routes = ([regex]::Matches($html, 'id: "route-')).Count
  Stages = ([regex]::Matches($html, 'stageId: "')).Count
  Branches = ([regex]::Matches($html, 'branchId: "')).Count
  RemoteScripts = ([regex]::Matches($html, '<script[^>]+src=')).Count
}
```

预期：`Routes=2`、`Stages=21`、`Branches=5`、`RemoteScripts=0`。
