const fs = require('fs');
const path = require('path');

const skills = [
  {
    name: 'using-superpowers', title: '使用 Superpowers', category: '元规则', phase: '入口', level: '强制',
    summary: '每次对话开始时先检查适用技能；只要存在约 1% 的适用可能，就必须先调用技能，再回复、追问或操作。',
    usage: '由会话启动机制自动加载；也可手动调用 `$superpowers:using-superpowers`，随后宣布本轮使用的具体技能并严格执行。',
    input: '当前用户请求、可用技能清单、平台工具与项目级指令。',
    output: '选定并加载相关技能；建立“技能优先于普通执行”的会话规则；把任务转交给正确的流程技能。',
    scenarios: ['新会话开始', '收到任何任务或问题', '不确定是否有技能适用', '计划进入 Plan Mode 前'],
    roles: ['AI 编码代理', '智能体管理员'],
    core: '先检查技能，再做任何事。用户指令高于技能，技能高于默认行为。',
    steps: ['检查是否有相关或被点名的技能', '先调用流程技能，再调用实现技能', '宣布“Using [skill] to [purpose]”', '把技能检查表同步为待办'],
    previous: '会话启动', next: 'brainstorming / systematic-debugging / 其他领域技能',
    example: '$superpowers:using-superpowers 检查这项任务应调用哪些技能，并按优先级执行。'
  },
  {
    name: 'brainstorming', title: '头脑风暴与设计澄清', category: '设计', phase: '设计', level: '强制',
    summary: '任何创造性开发前先理解上下文、逐问澄清、比较方案、分段确认设计，并形成已批准的设计文档。',
    usage: '在写代码、搭组件、增加功能或改变行为之前调用 `$superpowers:brainstorming`；一次只问一个问题，设计获批前不得实施。',
    input: '产品/功能想法、现有项目文件与提交、目标、约束、成功标准、用户对各设计段落的确认。',
    output: '`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`、经自检且由用户批准的设计规格；终态是转入 writing-plans。',
    scenarios: ['新功能或新产品', '组件或交互设计', '行为修改', '需求模糊或范围过大'],
    roles: ['产品负责人', '技术负责人', '设计师', 'AI 编码代理'],
    core: '设计批准前不实施；每个项目都需要设计，简单任务只需更短的设计。',
    steps: ['检查项目上下文并判断是否需拆分', '逐个澄清目的、约束和成功标准', '提出 2–3 个方案及取舍', '分段展示架构、组件、数据流、异常与测试', '写设计文档并做占位符/矛盾/范围/歧义自检', '等待用户审阅书面规格后转 writing-plans'],
    previous: 'using-superpowers', next: 'writing-plans',
    example: '$superpowers:brainstorming 为“团队知识库问答助手”澄清目标用户、范围、方案与验收标准。'
  },
  {
    name: 'writing-plans', title: '编写实施计划', category: '规划', phase: '计划', level: '强制',
    summary: '把已批准规格拆成可独立测试和审查的任务，每一步 2–5 分钟，并写清精确文件、代码、命令和预期结果。',
    usage: '有批准的设计/规格且任务为多步骤时调用 `$superpowers:writing-plans`；先锁定文件职责，再按 RED–GREEN–REFACTOR 拆任务。',
    input: '批准后的设计规格、现有代码结构、技术栈、全局约束、测试与提交规范。',
    output: '`docs/superpowers/plans/YYYY-MM-DD-<feature>-plan.md`；包含目标、架构、技术栈、全局约束、逐任务接口、完整代码、验证与提交步骤。',
    scenarios: ['规格已批准', '多文件实现', '需要交给其他代理执行', '需要可审查的落地路径'],
    roles: ['技术负责人', '开发者', 'AI 规划代理'],
    core: '计划必须让“零上下文工程师”也能照做；禁止 TBD、泛化步骤和未定义接口。',
    steps: ['检查规格是否应拆成独立子项目', '映射将创建/修改的文件职责', '按独立可测交付物切分任务', '为每一步写实际代码、命令和预期输出', '自检规格覆盖、占位符和类型一致性', '提供 SDD 或 Inline Execution 两种执行方式'],
    previous: 'brainstorming', next: 'subagent-driven-development / executing-plans',
    example: '$superpowers:writing-plans 根据已批准的用户登录设计，生成逐任务、逐测试、逐文件的实施计划。'
  },
  {
    name: 'using-git-worktrees', title: '使用 Git Worktree 隔离开发', category: '环境', phase: '准备', level: '强制',
    summary: '在执行实施计划前建立或确认隔离工作区，优先使用平台原生能力，随后完成依赖安装和干净基线测试。',
    usage: '开始需要隔离的功能开发或准备执行计划时调用；先检测当前是否已在 worktree，再征得同意或遵循既有偏好。',
    input: '当前 Git 目录/公共目录、分支、用户的 worktree 偏好、项目依赖文件与测试命令。',
    output: '隔离工作目录、功能分支、完成项目初始化的环境、带测试数量和失败数的基线报告。',
    scenarios: ['开始功能分支', '执行实施计划前', '并行开发', '保护当前工作区'],
    roles: ['开发者', '技术负责人', 'AI 编码代理'],
    core: '先检测现有隔离，再用平台原生工具，最后才回退到 `git worktree`；基线不绿必须先询问。',
    steps: ['比较 GIT_DIR 与 GIT_COMMON，并排除 submodule', '确认用户偏好与目录位置', '优先使用原生 worktree 工具', '回退到 Git 时先验证目录被忽略', '自动安装依赖', '运行完整基线测试并报告'],
    previous: 'brainstorming / writing-plans', next: 'subagent-driven-development / executing-plans',
    example: '$superpowers:using-git-worktrees 为支付重构建立隔离工作区，并验证项目基线测试。'
  },
  {
    name: 'subagent-driven-development', title: '子代理驱动开发', category: '执行', phase: '实施', level: '推荐',
    summary: '在同一会话中按计划逐任务派发全新实现代理，每个任务经过规格与代码质量审查，最后再做全分支审查。',
    usage: '已有实施计划、任务大多独立、平台支持子代理且希望留在当前会话时调用；每个任务使用一个新实现代理，禁止并行改代码。',
    input: '实施计划、任务 brief、全局约束、已有接口决策、基线提交、模型选择和进度 ledger。',
    output: '逐任务实现与提交、实现报告、review package、规格/质量双重结论、`.superpowers/sdd/progress.md`、最终全分支审查结果。',
    scenarios: ['同会话连续实施', '计划含多个相对独立任务', '需要高强度审查', '需要控制上下文污染'],
    roles: ['AI 编排代理', '实现代理', '代码审查代理', '技术负责人'],
    core: '每任务新实现代理 + 每任务双重审查 + 最终全分支审查；不因普通进度而暂停。',
    steps: ['预检计划冲突并建立 todo/ledger', '为任务生成独立 brief 和报告路径', '派发实现代理并处理四种状态', '生成 diff review package', '派发任务审查并修复 Critical/Important', '记录任务完成并继续', '最终审查后转 finishing-a-development-branch'],
    previous: 'writing-plans + using-git-worktrees', next: 'finishing-a-development-branch',
    example: '$superpowers:subagent-driven-development 按 docs/superpowers/plans/search-plan.md 在当前会话逐任务实施并审查。'
  },
  {
    name: 'executing-plans', title: '内联执行计划', category: '执行', phase: '实施', level: '备选',
    summary: '在单一代理中加载并批判性审查书面计划，按待办逐项执行和验证，遇到阻塞立即停止求助。',
    usage: '已有书面计划、需在独立/后续会话执行，或无法使用子代理时调用；有子代理能力时应优先 SDD。',
    input: '书面实施计划、项目环境、逐任务验证命令与用户对计划疑点的澄清。',
    output: '按计划完成并验证的代码、逐任务待办状态；最终转入 finishing-a-development-branch。',
    scenarios: ['无子代理平台', '独立执行会话', '任务强顺序依赖', '按计划批次推进'],
    roles: ['开发者', 'AI 编码代理'],
    core: '先审计划再执行；严格照步骤验证；阻塞或多次验证失败时停止，不猜。',
    steps: ['完整读取并批判计划', '有疑点先向用户提出', '建立任务待办', '逐任务标记、执行、验证、完成', '全部完成后调用 finishing-a-development-branch'],
    previous: 'writing-plans + using-git-worktrees', next: 'finishing-a-development-branch',
    example: '$superpowers:executing-plans 执行 docs/superpowers/plans/import-plan.md，并在每项验证后更新待办。'
  },
  {
    name: 'dispatching-parallel-agents', title: '并行派发独立代理', category: '协作', phase: '实施', level: '条件',
    summary: '把两个以上无共享状态、无顺序依赖的问题按独立领域拆给专门代理并行处理，主代理负责整合和最终验证。',
    usage: '确认多个问题彼此独立后调用；每个代理只负责一个明确文件或子系统，并收到自包含上下文、约束和报告格式。',
    input: '独立问题分组、失败测试/错误信息、允许修改范围、期望返回内容。',
    output: '各独立领域的根因与修复摘要、互不冲突的变更；主代理整合后得到完整测试结果。',
    scenarios: ['多个测试文件不同根因', '多个独立子系统故障', '可并行研究的问题', '无共享编辑状态的任务'],
    roles: ['AI 编排代理', '调试代理', '技术负责人'],
    core: '一个独立问题域对应一个代理；未知根因、相关失败或共享状态时不并行。',
    steps: ['按故障域判断真正独立性', '为每个代理写聚焦、自包含的任务', '同一轮并行派发', '阅读每份总结并检查编辑冲突', '运行完整测试套件'],
    previous: 'systematic-debugging / 实施中的独立任务', next: 'verification-before-completion',
    example: '$superpowers:dispatching-parallel-agents 将三个互不相关的失败测试文件交给三个代理并行调查。'
  },
  {
    name: 'test-driven-development', title: '测试驱动开发（TDD）', category: '质量', phase: '实施', level: '强制',
    summary: '任何功能、修复、重构或行为变化都先写失败测试并亲眼看到正确失败，再写最少代码通过，最后重构。',
    usage: '写任何生产实现前调用；例外只包括经用户明确同意的抛弃式原型、生成代码或配置文件。',
    input: '单一可观察行为、期望 API、测试框架、当前失败/缺失行为。',
    output: '经过 RED–GREEN–REFACTOR 的测试和最小实现；完整测试套件通过且输出无警告。',
    scenarios: ['新功能', 'Bug 修复', '重构', '行为变更'],
    roles: ['开发者', '测试工程师', 'AI 编码代理'],
    core: '没有先失败的测试，就没有生产代码；如果先写了代码，删除并从测试重新开始。',
    steps: ['RED：写一个只描述一个行为的真实测试', '运行并确认它因功能缺失而失败', 'GREEN：只写足够通过的代码', '运行目标测试与相关套件', 'REFACTOR：保持绿灯时整理', '对下一个行为重复'],
    previous: '实施任务 / systematic-debugging Phase 4', next: 'requesting-code-review / verification-before-completion',
    example: '$superpowers:test-driven-development 为“失败请求最多重试 3 次”先写失败测试，再实现最小代码。'
  },
  {
    name: 'systematic-debugging', title: '系统化调试', category: '质量', phase: '调试', level: '强制',
    summary: '遇到任何 Bug、测试失败或异常行为时，必须先完成根因调查，再分析模式、验证单一假设，最后用 TDD 实施修复。',
    usage: '在提出任何修复方案前调用；先可靠复现、读完整错误、检查最近变化，并在多组件边界增加诊断证据。',
    input: '错误信息与完整堆栈、可靠复现步骤、近期 diff、环境配置、跨组件输入/输出证据、可工作的参考实现。',
    output: '明确的根因证据、工作/故障差异、经最小实验确认的假设、带回归测试的单一根因修复。',
    scenarios: ['测试失败', '生产 Bug', '性能问题', '构建或集成失败', '异常行为'],
    roles: ['开发者', '测试工程师', 'SRE/运维', 'AI 调试代理'],
    core: '没有完成根因调查就不修；连续三次修复失败说明可能是架构问题，必须停下讨论。',
    steps: ['Phase 1：读错误、复现、查变更、沿数据流追根因', 'Phase 2：找工作样例并逐项比较差异', 'Phase 3：写出单一假设并做最小实验', 'Phase 4：用 TDD 写回归测试、实施一个修复并验证', '三次失败后停止并质疑架构'],
    previous: '发现异常', next: 'test-driven-development + verification-before-completion',
    example: '$superpowers:systematic-debugging 调查 CI 偶发超时：先定位跨组件断点，不要直接增加 timeout。'
  },
  {
    name: 'requesting-code-review', title: '请求代码审查', category: '审查', phase: '审查', level: '强制',
    summary: '在任务、重大功能或合并前，把明确的实现描述、需求和提交范围交给独立代码审查代理，尽早阻断问题累积。',
    usage: '准备好 BASE_SHA 与 HEAD_SHA 后调用；按模板派发独立 reviewer，并按 Critical、Important、Minor 处理结论。',
    input: '实现描述、计划/需求、BASE_SHA、HEAD_SHA、`code-reviewer.md` 模板。',
    output: '按严重级别组织的审查报告、规格符合性与可继续性判断；需要立即处理的修复项。',
    scenarios: ['SDD 每个任务后', '重大功能完成', '合并 main 前', '复杂修复后或陷入卡点'],
    roles: ['代码审查者', '开发者', '技术负责人', 'AI 审查代理'],
    core: '早审、常审；Critical 立即修，Important 在继续前修，错误反馈要用证据反驳。',
    steps: ['确定基线与头部提交', '填充审查模板的描述、需求与 SHA', '派发独立审查代理', '修复 Critical/Important', '记录 Minor 或用技术证据提出异议'],
    previous: 'TDD 任务完成 / 重大功能完成', next: 'receiving-code-review / 下一任务',
    example: '$superpowers:requesting-code-review 审查 BASE_SHA 到 HEAD_SHA 的搜索索引实现是否符合计划。'
  },
  {
    name: 'receiving-code-review', title: '接收代码审查反馈', category: '审查', phase: '审查', level: '强制',
    summary: '收到评审意见后先完整理解并核对代码事实，再决定接受、追问或用技术证据反驳，禁止表演式认同和盲改。',
    usage: '收到任何代码审查反馈，尤其是含糊、外部来源或技术上可疑时调用；多项反馈先澄清全部疑点，再逐项实现和测试。',
    input: '完整评审意见、当前代码与测试、平台/版本约束、历史架构决策和真实调用关系。',
    output: '逐项技术判断、必要的澄清问题、基于证据的接受或反驳、逐项验证后的修复。',
    scenarios: ['收到 PR Review', '外部 reviewer 建议', '反馈与既有决策冲突', '评审项含糊或可能违反 YAGNI'],
    roles: ['开发者', '代码审查者', '技术负责人', 'AI 编码代理'],
    core: '技术正确性高于社交舒适；先验证、再修改；任何一项不清楚就先停止澄清。',
    steps: ['完整阅读反馈', '用自己的话复述需求或询问', '对照代码和平台事实验证', '评估是否适合本项目', '按阻塞、简单、复杂顺序逐项实施', '每项单独测试并检查回归'],
    previous: 'requesting-code-review / 外部 Review', next: 'verification-before-completion',
    example: '$superpowers:receiving-code-review 核验这组 PR 意见，明确哪些应修、哪些需澄清、哪些应技术性反驳。'
  },
  {
    name: 'verification-before-completion', title: '完成前验证', category: '质量', phase: '验证', level: '强制',
    summary: '任何“已完成、已修复、测试通过”的表述前，都必须在当前消息中运行能证明该结论的完整命令并读取结果。',
    usage: '即将提交、建 PR、标记任务完成或表达正面状态前调用；先识别证明命令，再新鲜执行、核对退出码与失败数。',
    input: '准备声明的具体结论、能证明它的完整验证命令、最新命令输出、需求检查表。',
    output: '带退出码、测试/失败数量和需求覆盖证据的真实状态声明；若证据不支持，则输出实际未完成状态。',
    scenarios: ['声称测试通过', '声称 Bug 已修', '提交或建 PR 前', '接受代理完成报告', '标记需求完成'],
    roles: ['开发者', '测试工程师', '代码审查者', 'AI 编码代理'],
    core: '证据先于断言；旧输出、部分测试、lint 结果或代理口头报告都不能替代当前完整验证。',
    steps: ['识别哪条命令能证明结论', '运行完整且最新的命令', '阅读全部输出、退出码和失败数', '对照结论判断证据是否充分', '只在充分时声明成功，否则报告真实状态'],
    previous: '实现 / 调试 / 审查', next: 'finishing-a-development-branch',
    example: '$superpowers:verification-before-completion 在我说“全部通过”前，运行完整验证并报告退出码与失败数。'
  },
  {
    name: 'finishing-a-development-branch', title: '完成开发分支', category: '收尾', phase: '收尾', level: '强制',
    summary: '实现完成后先验证测试并识别工作区类型，再向用户提供合并、PR、保留或丢弃选项，按选择安全清理。',
    usage: '全部任务和测试完成时调用；失败测试会立即阻断。根据普通仓库、命名 worktree 或 detached HEAD 显示规定菜单。',
    input: '完整测试结果、GIT_DIR/GIT_COMMON、当前与基础分支、提交列表、worktree 来源、用户明确选项。',
    output: '本地合并、推送并创建 PR、保留分支，或经精确确认后丢弃；仅在允许情形清理 worktree/分支。',
    scenarios: ['所有实施任务完成', '准备合并', '准备创建 PR', '决定保留或丢弃实验分支'],
    roles: ['开发者', '技术负责人', '发布负责人', 'AI 编码代理'],
    core: '先验测试，再识别环境，再展示固定选项；丢弃必须输入 `discard`，不能清理非自己创建的 worktree。',
    steps: ['运行完整测试套件', '比较 GIT_DIR/GIT_COMMON 识别环境', '确定基础分支', '展示 4 项或 detached HEAD 的 3 项菜单', '执行用户选择', '仅合并或丢弃时按来源安全清理'],
    previous: 'verification-before-completion', next: '合并 / PR / 保留 / 经确认丢弃',
    example: '$superpowers:finishing-a-development-branch 验证当前功能分支并给出合并、PR、保留或丢弃选项。'
  },
  {
    name: 'writing-skills', title: '编写与验证技能', category: '元规则', phase: '扩展', level: '强制',
    summary: '把技能编写当作过程文档的 TDD：先让无技能代理在压力场景中失败，再写最小技能使其通过，最后堵住新漏洞。',
    usage: '创建、修改或部署技能前调用 `$superpowers:writing-skills`；必须先理解 TDD，并为检查表每一项建立待办。',
    input: '可复用问题、无技能基线压力场景、代理原始失败与合理化话术、技能类型、发现关键词和部署目标。',
    output: '符合 Agent Skills 规范的 `skills/<name>/SKILL.md`、必要的重型参考/工具文件、RED/GREEN/REFACTOR 测试证据与部署检查表。',
    scenarios: ['创建新技能', '编辑现有技能', '验证技能有效性', '优化技能发现率和上下文成本'],
    roles: ['技能作者', '智能体平台工程师', 'AI 评测工程师'],
    core: '没有先看到代理在无技能条件下失败，就不能写技能；描述字段只写触发条件，不概括流程。',
    steps: ['判断问题是否值得做成通用技能', 'RED：运行无技能压力场景并记录失败', 'GREEN：写只针对已观察失败的最小技能', '微测措辞并运行有技能场景', 'REFACTOR：根据新合理化补规则并复测', '逐技能完成质量与部署清单后才写下一个'],
    previous: 'test-driven-development（必需背景）', next: '提交/部署技能',
    example: '$superpowers:writing-skills 为“异步测试等待条件”创建一个经过压力场景验证的新技能。'
  }
];

const repoBase = 'https://github.com/obra/superpowers/blob/v6.1.1/skills/';
const pretextPath = path.join(__dirname, '.vendor', 'pretext.iife.js');
const pretext = fs.existsSync(pretextPath) ? fs.readFileSync(pretextPath, 'utf8') : '';
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="obra/superpowers v6.1.1 的 14 个技能中文速查">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23142f3b'/%3E%3Cpath d='M17 18h30v8H27v8h17v8H27v12H17z' fill='%2369c5b6'/%3E%3C/svg%3E">
<title>Superpowers v6.1.1 · 14 技能速查</title>
<style>
:root{--canvas:#f3f0e8;--paper:#fffdf8;--ink:#17211d;--muted:#69726d;--line:#d5d0c5;--navy:#142f3b;--teal:#176b62;--orange:#d2683f;--gold:#c28b2c;--red:#a13d39;--soft:#e8e3d8;--focus:#0b7569;--mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;--sans:Inter,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.62 var(--sans)}button,input,select{font:inherit}a{color:inherit}.shell{min-height:100vh;display:grid;grid-template-columns:260px minmax(0,1fr)}.rail{position:sticky;top:0;height:100vh;padding:28px 22px;background:var(--navy);color:#eef5f0;display:flex;flex-direction:column;gap:25px}.mark{font:800 14px/1 var(--mono);letter-spacing:.08em;color:#90d2c7}.rail h1{font-size:27px;line-height:1.08;margin:8px 0 0}.rail p{color:#b7c8c3;margin:8px 0 0;font-size:13px}.railnav{display:grid;gap:6px}.railnav a{text-decoration:none;color:#c5d4cf;padding:8px 10px;border-left:2px solid transparent}.railnav a:hover,.railnav a:focus-visible{background:#1b3a46;border-left-color:#69c5b6;color:white;outline:0}.source-note{margin-top:auto;color:#9fb3ad;font-size:12px}.source-note a{color:#d7e7e2}.main{min-width:0;padding:34px clamp(20px,4vw,64px) 70px}.hero{border-top:5px solid var(--orange);padding:14px 0 28px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:36px;align-items:end}.kicker{color:var(--orange);font:800 12px/1 var(--mono);letter-spacing:.15em;text-transform:uppercase}.hero h2{font-size:clamp(38px,6vw,76px);line-height:.95;letter-spacing:-.055em;margin:14px 0 18px;max-width:850px}.hero .lead{font-size:18px;color:#46514c;max-width:760px;margin:0}.baseline{border-left:1px solid var(--line);padding-left:22px}.baseline strong{display:block;font:700 30px/1 var(--mono);color:var(--teal)}.baseline span{display:block;margin-top:8px;color:var(--muted)}.stats{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--line)}.stat{padding:20px 18px;border-right:1px solid var(--line)}.stat:last-child{border-right:0}.stat b{display:block;font:800 30px/1 var(--mono);color:var(--navy)}.stat small{display:block;color:var(--muted);margin-top:7px}.section{padding-top:42px;scroll-margin-top:85px}.sectionhead{display:flex;justify-content:space-between;gap:22px;align-items:end;margin-bottom:18px}.sectionhead h3{font-size:28px;line-height:1.15;margin:0}.sectionhead p{max-width:680px;color:var(--muted);margin:0}.flow{display:grid;grid-template-columns:repeat(7,minmax(110px,1fr));border:1px solid var(--line);background:var(--paper);overflow:auto}.flowstep{min-width:120px;padding:16px 14px;border-right:1px solid var(--line);text-align:left;background:none;border-top:0;border-bottom:0;border-left:0;cursor:pointer;color:var(--ink)}.flowstep:last-child{border-right:0}.flowstep:hover,.flowstep:focus-visible{background:#eef5f2;outline:2px solid var(--focus);outline-offset:-2px}.flowstep em{display:block;color:var(--orange);font:700 11px/1 var(--mono);font-style:normal}.flowstep b{display:block;margin:8px 0 4px}.flowstep span{color:var(--muted);font-size:12px}.principles{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}.principle{background:var(--paper);padding:18px}.principle b{color:var(--teal)}.principle p{margin:7px 0 0;color:var(--muted);font-size:13px}.toolbar{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:minmax(260px,1.6fr) repeat(3,minmax(125px,.55fr)) auto;gap:8px;padding:12px 0;background:rgba(243,240,232,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}.toolbar input,.toolbar select{width:100%;border:1px solid #bdb8ad;background:var(--paper);padding:10px 11px;color:var(--ink);outline:0}.toolbar input:focus,.toolbar select:focus{border-color:var(--focus);box-shadow:0 0 0 3px rgba(11,117,105,.14)}.switch{display:flex;border:1px solid #bdb8ad}.switch button{border:0;background:var(--paper);padding:8px 12px;color:var(--muted);cursor:pointer}.switch button.active{background:var(--navy);color:white}.result{display:flex;justify-content:space-between;gap:20px;color:var(--muted);margin:13px 0}.result strong{color:var(--ink)}.cards{display:grid;gap:10px}.skill{background:var(--paper);border:1px solid var(--line);border-left:5px solid var(--teal)}.skill[open]{border-left-color:var(--orange)}.skill summary{list-style:none;cursor:pointer;padding:18px 20px;display:grid;grid-template-columns:minmax(210px,.65fr) minmax(280px,1.35fr) auto;gap:18px;align-items:center}.skill summary::-webkit-details-marker{display:none}.skill summary:focus-visible{outline:3px solid var(--focus);outline-offset:2px}.skill-title{display:flex;align-items:flex-start;gap:10px}.num{font:700 12px/1 var(--mono);color:var(--orange);padding-top:5px}.skill h4{font-size:19px;line-height:1.2;margin:0}.skill-id{font:600 11px/1.4 var(--mono);color:var(--teal);margin-top:5px;word-break:break-all}.skill-summary{margin:0;color:#46514c}.badges{display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap}.badge{padding:3px 7px;background:#e6eee9;color:#245d54;font:700 11px/1.4 var(--mono)}.badge.level{background:#f1e5d4;color:#815223}.chev{font:700 19px/1 var(--mono);color:var(--muted)}details[open] .chev{transform:rotate(45deg)}.detail{padding:0 20px 20px;border-top:1px solid var(--line)}.factgrid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--line);border-left:1px solid var(--line);margin-top:18px}.fact{padding:14px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.fact.full{grid-column:1/-1}.label{display:block;color:var(--orange);font:800 10px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}.steps{margin:0;padding-left:20px}.steps li+li{margin-top:5px}.chips{display:flex;flex-wrap:wrap;gap:5px}.chip{padding:2px 7px;background:var(--soft);font-size:12px}.call{position:relative;background:#172c35;color:#eff7f3;padding:15px 96px 15px 15px;font:13px/1.65 var(--mono);word-break:break-word}.copy{position:absolute;top:9px;right:9px;border:1px solid #5c747a;background:transparent;color:#e8f3ef;padding:5px 9px;cursor:pointer}.copy:hover,.copy:focus-visible{background:#214450;outline:2px solid #87d2c5}.copy.done{background:var(--teal)}.source{display:flex;justify-content:space-between;gap:16px;align-items:center;padding-top:14px;color:var(--muted);font-size:12px}.source a{font-weight:700;color:var(--teal)}.note{min-height:44px;background:#fbf5e8;border:1px dashed #c6ad7e;padding:10px;color:#6f5d3b}.tablewrap{display:none;overflow:auto;border:1px solid var(--line);background:var(--paper)}.tablewrap.show{display:block}.cards.hide{display:none}table{border-collapse:collapse;width:100%;min-width:1250px}th{position:sticky;top:65px;background:var(--navy);color:white;padding:11px;text-align:left;font-size:12px}td{padding:11px;vertical-align:top;border-bottom:1px solid var(--line);font-size:13px}tbody tr:nth-child(even){background:#f7f3eb}td code{font-family:var(--mono);color:var(--teal)}.empty{display:none;padding:50px 20px;border:1px dashed #aaa397;text-align:center;color:var(--muted)}footer{margin-top:42px;border-top:1px solid var(--line);padding-top:20px;color:var(--muted);font-size:13px}.footergrid{display:grid;grid-template-columns:1fr 1fr;gap:30px}footer strong{color:var(--ink)}
@media(max-width:1100px){.shell{grid-template-columns:210px minmax(0,1fr)}.flow{grid-template-columns:repeat(4,1fr)}.principles{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr 1fr 1fr}.toolbar input{grid-column:1/-1}.skill summary{grid-template-columns:minmax(190px,.7fr) minmax(240px,1.3fr)}.badges{grid-column:1/-1;justify-content:flex-start}.stats{grid-template-columns:1fr 1fr}.stat:nth-child(2){border-right:0}}
@media(max-width:768px){.shell{display:block}.rail{position:relative;height:auto;padding:20px}.railnav,.source-note{display:none}.main{padding:24px 16px 50px}.hero{grid-template-columns:1fr}.baseline{border-left:0;border-top:1px solid var(--line);padding:18px 0 0}.flow{display:flex}.principles{grid-template-columns:1fr}.toolbar{position:static;grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}.skill summary{grid-template-columns:1fr;padding:16px}.badges{grid-column:auto}.skill-summary{font-size:14px}.factgrid{grid-template-columns:1fr}.fact.full{grid-column:auto}.footergrid{grid-template-columns:1fr}.sectionhead{display:block}.sectionhead p{margin-top:8px}}
@media(max-width:375px){.main{padding-left:12px;padding-right:12px}.hero h2{font-size:36px}.stats{grid-template-columns:1fr}.stat{border-right:0}.toolbar{grid-template-columns:1fr}.switch{width:100%}.switch button{flex:1}.source{display:block}.source a{display:inline-block;margin-top:8px}}
@media(prefers-color-scheme:dark){:root{--canvas:#111816;--paper:#18211e;--ink:#edf3ef;--muted:#a3aea8;--line:#3a4641;--soft:#2a3530}.hero .lead,.skill-summary{color:#bcc8c2}.toolbar{background:rgba(17,24,22,.95)}.toolbar input,.toolbar select{color:var(--ink);background:var(--paper)}.principle,.flow,.skill,.tablewrap{background:var(--paper)}tbody tr:nth-child(even){background:#202b27}.note{background:#2b271d;color:#dac99f}.call{background:#0d181d}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
@media print{.shell{display:block}.rail{display:none}.main{padding:0}.hero h2{font-size:44px}.toolbar,.switch,.copy,.note{display:none!important}.flow,.principles{break-inside:avoid}.cards{display:block!important}.skill{break-inside:avoid;margin-bottom:10px}.skill summary{grid-template-columns:1fr 1.5fr auto}.skill .detail{display:block}.tablewrap{display:none!important}body{background:white;color:black}.source a:after{content:" (" attr(href) ")"}}
</style>
</head>
<body>
<div class="shell">
<aside class="rail" aria-label="页面导航"><div><div class="mark">OBRA / SUPERPOWERS</div><h1>技能速查</h1><p>14 个组合式技能<br>从想法到安全交付</p></div><nav class="railnav"><a href="#workflow">主工作流</a><a href="#principles">核心纪律</a><a href="#skills">全部技能</a><a href="#evidence">版本与口径</a></nav><div class="source-note">基线：v6.1.1<br>官方 Release：2026-07-02<br><a href="https://github.com/obra/superpowers/tree/v6.1.1" target="_blank" rel="noopener">查看官方仓库 ↗</a></div></aside>
<main class="main">
<header class="hero"><div><div class="kicker">Agentic Development Methodology</div><h2>Superpowers<br>14 技能速查</h2><p class="lead">把“什么时候用、怎么用、需要什么、会产出什么”放进同一张可搜索地图。重点不是记命令，而是知道每个质量门应该在何时出现。</p></div><div class="baseline"><strong>v6.1.1</strong><span>稳定版本快照<br>生成日期 2026-07-21<br>中文归纳 · 官方源码可追溯</span></div></header>
<section class="stats" aria-label="统计"><div class="stat"><b>14</b><small>正式技能</small></div><div class="stat"><b>7</b><small>主工作流阶段</small></div><div class="stat"><b>5</b><small>强制质量门</small></div><div class="stat"><b>1</b><small>单文件离线速查</small></div></section>
<section id="workflow" class="section"><div class="sectionhead"><h3>主工作流</h3><p>点击阶段可直接筛选相关技能。调试、并行派发、接收评审与技能编写是按条件插入的支线。</p></div><div class="flow" role="list">
${[['01','设计','brainstorming'],['02','隔离','using-git-worktrees'],['03','计划','writing-plans'],['04','实施','subagent-driven-development'],['05','TDD','test-driven-development'],['06','审查','requesting-code-review'],['07','收尾','finishing-a-development-branch']].map(([n,label,id])=>`<button class="flowstep" data-jump="${id}" role="listitem"><em>${n}</em><b>${label}</b><span>${id}</span></button>`).join('')}
</div></section>
<section id="principles" class="section"><div class="sectionhead"><h3>四条核心纪律</h3><p>Superpowers 的技能不是建议清单，而是一组互相衔接的执行门槛。</p></div><div class="principles"><article class="principle"><b>设计先于编码</b><p>创造性工作必须先澄清与批准设计。</p></article><article class="principle"><b>测试先于实现</b><p>未看见正确的失败测试，就不能写生产代码。</p></article><article class="principle"><b>根因先于修复</b><p>调试先收集证据并验证假设，不猜修复。</p></article><article class="principle"><b>证据先于完成</b><p>没有当前完整验证输出，就不能声明成功。</p></article></div></section>
<section id="skills" class="section"><div class="sectionhead"><h3>全部技能</h3><p>“输入/输出”是对工作流上下文和产物的结构化归纳，不代表固定 API 参数。所有技能的执行主体均为 AI 编码代理。</p></div>
<div class="toolbar" aria-label="筛选工具"><input id="q" type="search" placeholder="搜索技能、用途、输入、输出、场景或角色…" aria-label="搜索"><select id="phase" aria-label="阶段"><option value="">全部阶段</option></select><select id="category" aria-label="分类"><option value="">全部分类</option></select><select id="role" aria-label="角色"><option value="">全部角色</option></select><div class="switch" aria-label="视图切换"><button id="cardBtn" class="active" type="button">卡片</button><button id="tableBtn" type="button">表格</button></div></div>
<div class="result"><span>显示 <strong id="count">14</strong> / 14 个技能</span><button id="expandBtn" type="button">展开全部</button></div>
<section id="cards" class="cards" aria-live="polite"></section><section id="tablewrap" class="tablewrap"><table><thead><tr><th>技能</th><th>阶段 / 分类</th><th>用途</th><th>如何使用</th><th>输入</th><th>输出</th><th>角色</th><th>来源</th></tr></thead><tbody id="tbody"></tbody></table></section><div id="empty" class="empty">没有匹配技能，请减少筛选条件。</div>
</section>
<footer id="evidence"><div class="footergrid"><div><strong>版本与来源</strong><p>以 obra/superpowers v6.1.1 的 14 个 <code>skills/*/SKILL.md</code> 为主事实源，README 用于主工作流与分类对账。所有源码链接固定到 v6.1.1 tag。</p></div><div><strong>阅读口径</strong><p>“使用角色”描述常见发起者或受益者，不意味着技能由人类手工执行；角色标注和中文标题是为速查而做的归纳。若与未来版本冲突，以对应版本的官方 SKILL.md 为准。</p></div></div></footer>
</main></div>
<script>${pretext}</script>
<script>
const skills=${JSON.stringify(skills)};
const repoBase=${JSON.stringify(repoBase)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order=['入口','设计','准备','计划','实施','调试','审查','验证','收尾','扩展'];
const uniq=arr=>[...new Set(arr)].sort((a,b)=>a.localeCompare(b,'zh-CN'));
const fill=(id,items)=>{const el=document.getElementById(id);items.forEach(v=>el.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'))};
fill('phase',order.filter(x=>skills.some(s=>s.phase===x)));fill('category',uniq(skills.map(s=>s.category)));fill('role',uniq(skills.flatMap(s=>s.roles)));
const source=s=>repoBase+s.name+'/SKILL.md';
function chips(items){return '<div class="chips">'+items.map(x=>'<span class="chip">'+esc(x)+'</span>').join('')+'</div>'}
function card(s,index){return '<details class="skill" data-name="'+esc(s.name)+'"><summary><div class="skill-title"><span class="num">'+String(index+1).padStart(2,'0')+'</span><div><h4>'+esc(s.title)+'</h4><div class="skill-id">'+esc(s.name)+'</div></div></div><p class="skill-summary" data-pretext>'+esc(s.summary)+'</p><div class="badges"><span class="badge">'+esc(s.phase)+'</span><span class="badge">'+esc(s.category)+'</span><span class="badge level">'+esc(s.level)+'</span><span class="chev">＋</span></div></summary><div class="detail"><div class="factgrid"><div class="fact full"><span class="label">核心原则</span><strong>'+esc(s.core)+'</strong></div><div class="fact"><span class="label">如何使用</span>'+esc(s.usage)+'</div><div class="fact"><span class="label">输入</span>'+esc(s.input)+'</div><div class="fact"><span class="label">输出</span>'+esc(s.output)+'</div><div class="fact"><span class="label">使用场景</span>'+chips(s.scenarios)+'</div><div class="fact"><span class="label">使用角色</span>'+chips(s.roles)+'</div><div class="fact"><span class="label">前后关系</span><b>前：</b>'+esc(s.previous)+'<br><b>后：</b>'+esc(s.next)+'</div><div class="fact full"><span class="label">执行步骤</span><ol class="steps">'+s.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div><div class="fact full"><span class="label">调用示例</span><div class="call">'+esc(s.example)+'<button class="copy" type="button" data-copy="'+esc(s.name)+'" aria-label="复制 '+esc(s.name)+' 调用示例">复制</button></div></div><div class="fact full"><span class="label">我的速记（可直接编辑，不会写回磁盘）</span><div class="note editable-note" contenteditable="true" role="textbox" aria-label="'+esc(s.title)+' 的个人速记">点击这里补充你的团队约定或记忆口诀……</div></div></div><div class="source"><code>skills/'+esc(s.name)+'/SKILL.md</code><a href="'+source(s)+'" target="_blank" rel="noopener">核对官方源码 ↗</a></div></div></details>'}
function row(s){return '<tr><td><strong>'+esc(s.title)+'</strong><br><code>'+esc(s.name)+'</code></td><td>'+esc(s.phase)+' / '+esc(s.category)+'<br><span class="badge level">'+esc(s.level)+'</span></td><td>'+esc(s.summary)+'</td><td>'+esc(s.usage)+'</td><td>'+esc(s.input)+'</td><td>'+esc(s.output)+'</td><td>'+s.roles.map(esc).join('、')+'</td><td><a href="'+source(s)+'" target="_blank" rel="noopener">SKILL.md ↗</a></td></tr>'}
const controls={q:document.getElementById('q'),phase:document.getElementById('phase'),category:document.getElementById('category'),role:document.getElementById('role')};
let current=[];
function render(){const q=controls.q.value.trim().toLowerCase();current=skills.filter(s=>{const hay=Object.values(s).flat().join(' ').toLowerCase();return(!q||hay.includes(q))&&(!controls.phase.value||s.phase===controls.phase.value)&&(!controls.category.value||s.category===controls.category.value)&&(!controls.role.value||s.roles.includes(controls.role.value))});document.getElementById('cards').innerHTML=current.map((s,i)=>card(s,skills.indexOf(s))).join('');document.getElementById('tbody').innerHTML=current.map(row).join('');document.getElementById('count').textContent=current.length;document.getElementById('empty').style.display=current.length?'none':'block';setupPretext()}
Object.values(controls).forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>{controls.q.value=btn.dataset.jump;controls.phase.value='';controls.category.value='';controls.role.value='';render();document.getElementById('skills').scrollIntoView()}));
document.getElementById('cards').addEventListener('click',async e=>{const btn=e.target.closest('[data-copy]');if(!btn)return;const s=skills.find(x=>x.name===btn.dataset.copy);if(!s)return;try{await navigator.clipboard.writeText(s.example);btn.textContent='已复制';btn.classList.add('done')}catch(_){const area=document.createElement('textarea');area.value=s.example;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();btn.textContent='已复制';btn.classList.add('done')}setTimeout(()=>{btn.textContent='复制';btn.classList.remove('done')},1300)});
const cards=document.getElementById('cards'),tablewrap=document.getElementById('tablewrap'),cardBtn=document.getElementById('cardBtn'),tableBtn=document.getElementById('tableBtn');cardBtn.onclick=()=>{cards.classList.remove('hide');tablewrap.classList.remove('show');cardBtn.classList.add('active');tableBtn.classList.remove('active')};tableBtn.onclick=()=>{cards.classList.add('hide');tablewrap.classList.add('show');tableBtn.classList.add('active');cardBtn.classList.remove('active')};
let expanded=false;document.getElementById('expandBtn').onclick=e=>{expanded=!expanded;document.querySelectorAll('.skill').forEach(d=>d.open=expanded);e.currentTarget.textContent=expanded?'折叠全部':'展开全部'};
let observer;async function setupPretext(){if(!window.Pretext||!Pretext.prepare||!Pretext.layout)return;await document.fonts.ready;const els=[...document.querySelectorAll('[data-pretext]')];const prepared=new Map();for(const el of els){prepared.set(el,Pretext.prepare(el.textContent,getComputedStyle(el).font))}const relayout=()=>{for(const [el,h] of prepared){const lh=parseFloat(getComputedStyle(el).lineHeight);const r=Pretext.layout(h,el.clientWidth,lh);el.style.minHeight=Math.ceil(r.height)+'px'}};observer&&observer.disconnect();observer=new ResizeObserver(relayout);observer.observe(document.querySelector('.main'));relayout();document.querySelectorAll('.editable-note').forEach(el=>new MutationObserver(()=>relayout()).observe(el,{characterData:true,subtree:true,childList:true}))}
render();
</script>
</body></html>`;

const out = path.join(__dirname, 'obra-superpowers-v6.1.1-14技能速查.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`generated=${out}`);
console.log(`skills=${skills.length}`);
console.log(`pretext_bytes=${Buffer.byteLength(pretext)}`);
