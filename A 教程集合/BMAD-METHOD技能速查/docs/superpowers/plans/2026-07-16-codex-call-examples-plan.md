# Codex 调用示例与阶段筛选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 52 个技能的【如何使用】替换成可复制的 `$技能名` Codex 实战调用示例，并把阶段筛选固定为“分析、规划、方案、实施、任意阶段”。

**Architecture:** `build-html.js` 仍是唯一页面生成源，技能对象用 `example` 保存调用示例，卡片和表格读取同一字段。复制按钮使用技能唯一名称定位内存数据，并提供 Clipboard API 与隐藏 textarea 两级实现。`validate-html.js` 先定义新行为并在旧页面上失败，再验证生成结果、数据覆盖和前端脚本语法。

**Tech Stack:** Node.js 24、原生 HTML/CSS/JavaScript、PowerShell、无第三方依赖。

## Global Constraints

- 技能总数保持 52，不改变用途、输入、输出、角色、来源和分发口径。
- 52 条调用示例必须以“`$` + 当前技能名”开头。
- 页面不得展示原【如何使用】文案。
- 阶段值只使用：分析、规划、方案、实施、任意阶段。
- 阶段筛选顺序固定为：分析、规划、方案、实施、任意阶段。
- 任务目录不是 Git 仓库；每个任务以测试输出作为检查点，不执行虚假的 commit 步骤。

## File Map

- Modify: `validate-html.js`：新行为的失败测试与回归校验。
- Modify: `build-html.js`：52 条示例、阶段值、复制 UI 和复制逻辑。
- Regenerate: `BMAD-METHOD-v6.10.0-全技能速查.html`：最终单文件交付物。
- Update: `执行计划.md`：记录此次迭代与验证结果。

---

### Task 1: 为新行为建立失败测试

**Files:**
- Modify: `validate-html.js`
- Test: `validate-html.js`

**Interfaces:**
- Consumes: 页面内嵌的 `skills` JSON 与 HTML 源码。
- Produces: 对 `example`、复制按钮、阶段名称和筛选顺序的确定性断言。

- [ ] **Step 1: 将必填字段由 `usage` 改成 `example`**

```js
const required = ['name', 'title', 'module', 'category', 'phase', 'status', 'distribution', 'purpose', 'example', 'input', 'output', 'scenarios', 'roles', 'related', 'source'];
```

- [ ] **Step 2: 添加调用示例、复制功能和阶段顺序断言**

```js
for (const skill of skills) {
  assert(skill.example.startsWith(`$${skill.name}`), `${skill.name} 的调用示例必须以 $${skill.name} 开头`);
  assert(!Object.hasOwn(skill, 'usage'), `${skill.name} 仍包含 usage 字段`);
}
assert(!skills.some((skill) => skill.phase === '方案设计'), '数据中仍存在“方案设计”');
assert(html.includes('<th>调用示例</th>'), '表格列名未改为调用示例');
assert(html.includes('data-copy-name'), '页面缺少复制按钮绑定');
assert(html.includes('copyExample'), '页面缺少复制处理函数');
assert(html.includes("const phaseOrder=['分析','规划','方案','实施','任意阶段']"), '阶段筛选顺序不正确');
```

- [ ] **Step 3: 运行测试，确认旧实现按预期失败**

Run: `node validate-html.js`

Expected: FAIL，至少报告缺少 `example`、仍含 `usage`、缺少复制功能、仍存在“方案设计”或阶段顺序不正确。

---

### Task 2: 迁移数据并实现复制交互

**Files:**
- Modify: `build-html.js:5-59`（技能数据）
- Modify: `build-html.js:68-103`（样式、卡片、表格、筛选和事件）
- Test: `validate-html.js`

**Interfaces:**
- Consumes: 每个技能对象的唯一 `name` 和 `example`。
- Produces: `copyExample(name, button): Promise<void>`；卡片按钮属性 `data-copy-name`；固定 `phaseOrder`。

- [ ] **Step 1: 将 52 个 `usage` 字段替换为独立 `example` 字段**

示例统一采用以下格式，内容根据每个技能原用途、输入和场景具体化：

```js
{name:'bmad-help', example:'$bmad-help 分析当前 BMAD 项目状态，告诉我下一步应该运行哪个技能。'}
{name:'bmad-prd', example:'$bmad-prd 根据当前产品想法创建一份 PRD，先向我确认目标用户、核心问题和 MVP 范围。'}
{name:'bmad-dev-story', example:'$bmad-dev-story 实现 _bmad-output/implementation-artifacts/1-2-user-login.md，并严格执行其中的任务、验收标准和测试。'}
{name:'brainstorming-coach', example:'$brainstorming-coach 围绕“AI 产品经理工作台”主持一轮头脑风暴，只通过问题帮助我产生想法。'}
```

每条都必须满足：准确技能名、具体任务、可直接粘贴；兼容入口需在示例中提示新入口，例如：

```js
example:'$bmad-create-prd 为当前产品创建 PRD；这是兼容入口，后续请优先改用 $bmad-prd create。'
```

- [ ] **Step 2: 把所有 `phase:'方案设计'` 替换为 `phase:'方案'`**

Expected affected skills: `bmad-agent-architect`、`bmad-architecture`、`bmad-check-implementation-readiness`、`bmad-create-architecture`、`bmad-create-epics-and-stories`、`bmad-generate-project-context`。

- [ ] **Step 3: 增加调用示例容器和复制按钮样式**

```css
.examplebox{position:relative;background:#182330;color:#eef5f7;border-radius:12px;padding:14px 88px 14px 14px;font:13px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;word-break:break-word}
.copybtn{position:absolute;right:8px;top:8px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:12px}
.copybtn.copied{background:#3b7a57}.copybtn.failed{background:#a84343}
```

- [ ] **Step 4: 卡片将【如何使用】替换为【调用示例】**

```js
'<div class="field full"><span class="label">调用示例</span><div class="examplebox">'+esc(s.example)+'<button class="copybtn" type="button" data-copy-name="'+esc(s.name)+'">复制</button></div></div>'
```

- [ ] **Step 5: 表格列名和单元格改用 `example`**

```html
<th>调用示例</th>
```

```js
'<td><code>'+esc(s.example)+'</code></td>'
```

- [ ] **Step 6: 固定阶段筛选顺序**

```js
const phaseOrder=['分析','规划','方案','实施','任意阶段'];
fill('phase',phaseOrder.filter(phase=>skills.some(skill=>skill.phase===phase)));
```

删除原来的：

```js
fill('phase',uniq(skills.map(x=>x.phase)));
```

- [ ] **Step 7: 实现复制与降级逻辑**

```js
async function copyExample(name,button){
  const skill=skills.find(item=>item.name===name);
  if(!skill)return;
  let copied=false;
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(skill.example);
      copied=true;
    }else{
      const area=document.createElement('textarea');
      area.value=skill.example;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      copied=document.execCommand('copy');
      area.remove();
    }
  }catch(_error){copied=false}
  button.textContent=copied?'已复制':'复制失败';
  button.classList.toggle('copied',copied);
  button.classList.toggle('failed',!copied);
  setTimeout(()=>{button.textContent='复制';button.classList.remove('copied','failed')},1500);
}

document.getElementById('cards').addEventListener('click',(event)=>{
  const button=event.target.closest('[data-copy-name]');
  if(button)copyExample(button.dataset.copyName,button);
});
```

- [ ] **Step 8: 重新生成并运行测试**

Run:

```powershell
node --check build-html.js
node build-html.js
node validate-html.js
```

Expected: 三条命令均 exit 0；验证输出包含 `PASS`、`skills=52`、`source_paths_checked=52`。

---

### Task 3: 完整回归与交付记录

**Files:**
- Regenerate: `BMAD-METHOD-v6.10.0-全技能速查.html`
- Update: `执行计划.md`

**Interfaces:**
- Consumes: Task 2 的生成器与验证器。
- Produces: 最终 HTML、覆盖对账、文件哈希和本次迭代记录。

- [ ] **Step 1: 对账源码技能覆盖**

Run the existing PowerShell coverage comparison between the 52 production `SKILL.md` paths and the 52 embedded `source` values.

Expected: `coverage=PASS actual=52 listed=52`。

- [ ] **Step 2: 检查旧标签和旧阶段已消失**

Run:

```powershell
Select-String -Path 'BMAD-METHOD-v6.10.0-全技能速查.html' -Pattern '>如何使用<','方案设计'
```

Expected: 无匹配输出。

- [ ] **Step 3: 检查 52 个示例与复制按钮的渲染契约**

Run `node validate-html.js`。

Expected: `PASS`，52 个 `example` 均以对应 `$name` 开头，页面包含复制按钮和复制函数。

- [ ] **Step 4: 更新执行计划并记录 SHA-256**

在 `执行计划.md` 追加本次迭代内容、验证命令和最终哈希；不得修改原始版本基线说明。

- [ ] **Step 5: 执行最终全量验证**

Run:

```powershell
node --check build-html.js
node build-html.js
node validate-html.js
Get-FileHash 'BMAD-METHOD-v6.10.0-全技能速查.html' -Algorithm SHA256
```

Expected: 全部 exit 0，并输出新的 SHA-256。

---

## Appendix A: 52 条确定调用示例

| 技能 | `example` 精确内容 |
|---|---|
| bmad-advanced-elicitation | `$bmad-advanced-elicitation 使用第一性原理和事前验尸方法，深化我刚才的会员增长方案。` |
| bmad-brainstorming | `$bmad-brainstorming 围绕“AI 产品经理工作台”主持一轮头脑风暴，帮助我产生并整理候选方向。` |
| bmad-customize | `$bmad-customize 为 bmad-agent-dev 增加一条团队级持久规则：所有代码修改前必须先运行相关测试。` |
| bmad-editorial-review-prose | `$bmad-editorial-review-prose 审查 docs/product-guide.md 的表达清晰度，并以三列表格给出修改建议。` |
| bmad-editorial-review-structure | `$bmad-editorial-review-structure 审查 docs/architecture.md 的结构，找出应删除、合并、移动或压缩的内容。` |
| bmad-forge-idea | `$bmad-forge-idea 压力测试“面向产品经理的 AI 工作台”这个想法，判断它应该强化、调整还是放弃。` |
| bmad-help | `$bmad-help 分析当前 BMAD 项目状态，告诉我下一步应该运行哪个技能。` |
| bmad-index-docs | `$bmad-index-docs 为 docs 目录生成或更新 index.md，并为每个文件添加简短说明。` |
| bmad-party-mode | `$bmad-party-mode 让 Mary、John 和 Winston 围绕“是否应先做企业版”展开一轮多角色讨论。` |
| bmad-review-adversarial-general | `$bmad-review-adversarial-general 对 specs/payment-flow.md 做一次对抗审查，至少找出 10 个缺失或错误。` |
| bmad-review-edge-case-hunter | `$bmad-review-edge-case-hunter 检查 src/payment.ts 的所有分支和边界条件，只报告未处理的案例。` |
| bmad-shard-doc | `$bmad-shard-doc 将 docs/large-prd.md 按二级标题拆分到独立文件夹，并生成 index.md。` |
| bmad-spec | `$bmad-spec 将 docs/product-brief.md 提炼成 SPEC.md 和必要的伴随文件，锁定 WHAT 而不设计 HOW。` |
| bmad-agent-analyst | `$bmad-agent-analyst 以 Mary 的身份分析这款产品的目标用户、核心问题和关键业务假设。` |
| bmad-agent-tech-writer | `$bmad-agent-tech-writer 以 Paige 的身份为当前项目编写一份面向新开发者的部署指南。` |
| bmad-agent-pm | `$bmad-agent-pm 以 John 的身份追问我的产品想法，帮助我明确用户价值、范围和成功指标。` |
| bmad-agent-ux-designer | `$bmad-agent-ux-designer 以 Sally 的身份分析当前 PRD，并提出需要进一步设计的核心用户流程。` |
| bmad-agent-architect | `$bmad-agent-architect 以 Winston 的身份评估当前需求的架构约束、技术风险和关键权衡。` |
| bmad-agent-dev | `$bmad-agent-dev 以 Amelia 的身份检查下一条待开发故事，并说明实现前需要确认的技术条件。` |
| bmad-document-project | `$bmad-document-project 扫描当前棕地项目，生成项目概览、源码树和关键模块文档。` |
| bmad-prfaq | `$bmad-prfaq 对“AI 产品经理工作台”运行 Working Backwards PRFAQ 挑战，验证客户价值和可行性。` |
| bmad-product-brief | `$bmad-product-brief 根据我的产品想法创建产品简报，重点明确问题、用户、价值和成功标准。` |
| bmad-domain-research | `$bmad-domain-research 研究中国文旅权益卡行业的术语、业务链条、监管重点和技术趋势。` |
| bmad-market-research | `$bmad-market-research 研究中国文旅权益卡市场的目标客户、主要竞争者、痛点和购买决策。` |
| bmad-technical-research | `$bmad-technical-research 比较多租户 SaaS 中 RBAC 与 ABAC 的适用场景、实现成本和架构风险。` |
| bmad-create-prd | `$bmad-create-prd 为当前产品创建 PRD；这是兼容入口，后续请优先改用 $bmad-prd create。` |
| bmad-edit-prd | `$bmad-edit-prd 根据最新范围变更更新现有 PRD；这是兼容入口，后续请优先改用 $bmad-prd update。` |
| bmad-prd | `$bmad-prd 根据当前产品想法创建一份 PRD，先向我确认目标用户、核心问题和 MVP 范围。` |
| bmad-ux | `$bmad-ux 根据 docs/prd.md 设计核心用户旅程、交互模式、关键界面和体验规则。` |
| bmad-validate-prd | `$bmad-validate-prd 验证 docs/prd.md；这是兼容入口，后续请优先改用 $bmad-prd validate。` |
| bmad-architecture | `$bmad-architecture 根据 SPEC、PRD 和 UX 产物创建架构主干，明确关键不变量、约束和技术决策。` |
| bmad-check-implementation-readiness | `$bmad-check-implementation-readiness 检查 PRD、UX、架构和史诗故事是否完整对齐并可进入实施。` |
| bmad-create-architecture | `$bmad-create-architecture 为当前项目创建架构；这是兼容入口，后续请优先改用 $bmad-architecture。` |
| bmad-create-epics-and-stories | `$bmad-create-epics-and-stories 根据 PRD、UX 和架构拆分可实现的史诗、故事及验收标准。` |
| bmad-generate-project-context | `$bmad-generate-project-context 扫描当前代码库和架构文档，生成供实现智能体使用的 project-context.md。` |
| bmad-checkpoint-preview | `$bmad-checkpoint-preview 带我逐步审查当前分支相对 main 的变更，说明目的、风险和验证方法。` |
| bmad-code-review | `$bmad-code-review 审查当前故事对应的代码变更，核对验收标准、边界案例、测试和回归风险。` |
| bmad-correct-course | `$bmad-correct-course 评估“会员体系延期到下一版本”对当前 PRD、架构、史诗和 Sprint 的影响。` |
| bmad-create-story | `$bmad-create-story 从 sprint-status.yaml 创建下一条 ready-for-dev 故事，并汇总实现所需上下文。` |
| bmad-dev-auto | `$bmad-dev-auto 无人值守完成“为登录接口增加速率限制”这一轮开发，包括计划、代码、测试和自审。` |
| bmad-dev-story | `$bmad-dev-story 实现 _bmad-output/implementation-artifacts/1-2-user-login.md，并严格执行其中的任务、验收标准和测试。` |
| bmad-qa-generate-e2e-tests | `$bmad-qa-generate-e2e-tests 为登录、退出和会话过期流程生成 API 与端到端自动化测试。` |
| bmad-quick-dev | `$bmad-quick-dev 修复用户列表分页后筛选条件丢失的问题，完成澄清、实现、测试和自审。` |
| bmad-retrospective | `$bmad-retrospective 复盘 epic-1 的交付结果、问题、经验和下一史诗的准备情况。` |
| bmad-sprint-planning | `$bmad-sprint-planning 读取当前 epics 文档并生成 sprint-status.yaml，按依赖关系安排故事顺序。` |
| bmad-sprint-status | `$bmad-sprint-status 汇总当前 Sprint 的故事状态、阻塞、风险和建议运行的下一个技能。` |
| brainstorming-coach | `$brainstorming-coach 围绕“AI 产品经理工作台”主持一轮头脑风暴，只通过问题帮助我产生想法。` |
| market-and-industry-research | `$market-and-industry-research 研究中国文旅权益卡市场，形成 Deep Research 任务并综合竞争、客户和监管结论。` |
| prd-coach | `$prd-coach 在 Canvas 中引导我创建“AI 产品经理工作台”的 PRD，不替我擅自决定 MVP 范围。` |
| prfaq-coach | `$prfaq-coach 使用 Working Backwards 方法挑战“AI 产品经理工作台”，完成新闻稿、FAQ 和最终判断。` |
| product-brief-coach | `$product-brief-coach 在 Canvas 中引导我创建产品简报，逐步确认用户、问题、价值和未知项。` |
| ux-coach | `$ux-coach 根据当前 PRD 引导我完成核心用户流程、DESIGN 视觉主干和 EXPERIENCE 行为主干。` |
