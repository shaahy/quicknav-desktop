# Matt Pocock Skills 实战教程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一份中文、单文件、离线可用的 Matt Pocock Skills 决策型实战教程，覆盖 22 个技能，并对照本机 gstack 与 Superpowers 给出避冲突方案。

**Architecture:** 以官方 README 与各技能 `SKILL.md` 为事实来源，先形成结构化内容核验表，再把同一份技能数据内嵌到 HTML 中，由原生 JavaScript 完成搜索、筛选、展开和复制。页面使用语义化 HTML 与原生 CSS，核心正文静态存在，脚本只增强交互。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、PowerShell 内容检查、Chromium 截图。

## Global Constraints

- 不安装、运行或修改 Matt Pocock Skills。
- 不覆盖 `E:\元梦工作空间\临时\PM Skills安装与教程` 中的既有文件。
- 输出统一放在 `E:\元梦工作空间\临时\Matt Pocock Skills实战教程`。
- HTML 必须单文件离线可用；外部链接仅用于用户主动访问来源。
- 覆盖官方公开的全部 22 个技能，并区分用户调用与模型调用。
- 对 Matt 技能的事实描述来自官方仓库；采用建议必须明确标记为本教程判断。
- 只比较与 Matt 技能直接相关的 gstack、Superpowers 能力。

---

### Task 1: 建立来源清单与内容核验表

**Files:**
- Create: `E:\元梦工作空间\临时\Matt Pocock Skills实战教程\内容核验清单.md`

**Interfaces:**
- Consumes: 官方 `README.md`、22 个官方 `SKILL.md`、本机 gstack/Superpowers 元数据。
- Produces: 22 行技能核验表和比较结论，供 HTML 文案唯一引用。

- [ ] **Step 1: 获取官方清单**

读取官方 README 的 Reference 段，锁定 17 个 Engineering 和 5 个 Productivity 技能。

- [ ] **Step 2: 核验每个技能**

逐个读取对应 `SKILL.md` 的 frontmatter、触发条件、核心步骤和产物，记录：

```text
name | category | invocation | purpose | whenToUse | inputs | outputs | overlaps | source
```

- [ ] **Step 3: 写入核验清单**

清单必须包含以下断言：

```text
总数 = 22
Engineering = 17
Productivity = 5
User-invoked = 13
Model-invoked = 9
```

- [ ] **Step 4: 验证无缺项**

运行：

```powershell
rg -n '^\| `[^`]+` \|' 'E:\元梦工作空间\临时\Matt Pocock Skills实战教程\内容核验清单.md'
```

预期：输出恰好 22 条技能记录。

### Task 2: 生成单文件教程

**Files:**
- Create: `E:\元梦工作空间\临时\Matt Pocock Skills实战教程\Matt-Pocock-Skills实战教程.html`

**Interfaces:**
- Consumes: Task 1 的 22 项核验内容与设计说明。
- Produces: 静态正文、`skills` 数据数组、`applyFilters()`、`copyPrompt()` 和响应式样式。

- [ ] **Step 1: 建立语义化页面骨架**

页面固定包含：

```html
<header id="top">...</header>
<nav aria-label="教程目录">...</nav>
<main>
  <section id="install">...</section>
  <section id="positioning">...</section>
  <section id="conflicts">...</section>
  <section id="adoption">...</section>
  <section id="lab">...</section>
  <section id="cheatsheet">...</section>
  <section id="rules">...</section>
</main>
<footer id="sources">...</footer>
```

- [ ] **Step 2: 写入安装模型、冲突地图和采用建议**

必须明确写出：技能本体可用户级复用，但 `setup-matt-pocock-skills` 为每仓库配置；避免同时启用两套同阶段编排器。

- [ ] **Step 3: 写入三体系对照案例**

案例统一使用“给现有 SaaS 增加团队邀请功能”，比较需求澄清、规格、实现、测试、审查、交付六阶段，并给出推荐路由：

```text
澄清：grill-with-docs 或 superpowers:brainstorming，二选一
规格：to-spec 或 gstack spec，二选一
实现：implement 或 superpowers executing-plans，二选一
测试：Matt tdd 或 Superpowers TDD，二选一
审查：Matt code-review 或 gstack review，二选一
交付：继续使用 gstack ship/land-and-deploy
```

- [ ] **Step 4: 写入 22 项结构化技能数据**

每项使用一致对象结构：

```javascript
{
  id: "tdd",
  name: "tdd",
  category: "engineering",
  invocation: "model",
  purpose: "以红—绿—重构循环逐个实现垂直切片",
  whenToUse: "实现功能或修复缺陷时",
  inputs: ["已确认的行为或规格", "可运行的测试环境"],
  outputs: ["失败测试", "最小实现", "重构后的通过测试"],
  example: "使用 tdd 按垂直切片实现团队邀请，并先看到测试失败。",
  overlaps: ["superpowers:test-driven-development"],
  conflictLevel: "high",
  recommendation: "与 Superpowers TDD 二选一",
  source: "https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md"
}
```

- [ ] **Step 5: 实现搜索、筛选、展开和复制**

使用以下稳定接口：

```javascript
function applyFilters() { /* 根据 query/category/invocation/conflict 过滤 */ }
async function copyPrompt(text, button) { /* Clipboard API，失败时选中文本 */ }
function renderSkills(items) { /* 生成 details 技能卡 */ }
```

- [ ] **Step 6: 完成响应式与可访问性样式**

断点为 `375px`、`768px`、`1024px`、`1440px`；提供 `:focus-visible` 和 `prefers-reduced-motion`；宽表在窄屏转换为卡片布局。

### Task 3: 自动检查与视觉验证

**Files:**
- Create: `E:\元梦工作空间\临时\Matt Pocock Skills实战教程\教程预览.png`
- Modify: `E:\元梦工作空间\临时\Matt Pocock Skills实战教程\内容核验清单.md`

**Interfaces:**
- Consumes: 完成的 HTML。
- Produces: 内容检查结果、桌面预览图和最终验收记录。

- [ ] **Step 1: 静态内容检查**

运行 PowerShell 检查文件、22 个对象、关键章节与外部依赖：

```powershell
$tutorial = Get-Content -Raw 'E:\元梦工作空间\临时\Matt Pocock Skills实战教程\Matt-Pocock-Skills实战教程.html'
@{
  SkillCount = ([regex]::Matches($tutorial, 'conflictLevel:')).Count
  HasInstall = $tutorial.Contains('id="install"')
  HasLab = $tutorial.Contains('id="lab"')
  HasCheatsheet = $tutorial.Contains('id="cheatsheet"')
  HasRemoteScript = $tutorial -match '<script[^>]+src='
}
```

预期：`SkillCount=22`，三个章节均为 `True`，`HasRemoteScript=False`。

- [ ] **Step 2: 浏览器交互检查**

验证关键词搜索、类别、调用方式和冲突等级筛选；展开技能卡；复制提示词；目录锚点跳转。

- [ ] **Step 3: 三视口检查**

在 375、768、1440 宽度检查：无横向滚动、导航可用、卡片不截断、表格窄屏转换正常。

- [ ] **Step 4: 保存预览并记录结果**

保存 1440px 桌面长截图为 `教程预览.png`，并把各项验证结果追加到 `内容核验清单.md`。

- [ ] **Step 5: 最终文件核验**

运行：

```powershell
Get-ChildItem 'E:\元梦工作空间\临时\Matt Pocock Skills实战教程' | Select-Object Name,Length,LastWriteTime
```

预期：HTML、PNG、Markdown 均存在且非空。
