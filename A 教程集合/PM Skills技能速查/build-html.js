const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = 'C:\\Users\\MSI\\.codex\\plugins\\cache\\pm-skills';
const VERSION = '2.1.0';
const OUT = path.join(__dirname, 'phuryn-pm-skills-v2.1.0-中文速查.html');
const plugins = {
  'pm-product-discovery': ['产品发现', '发现', ['产品经理', '产品设计师', '工程师', '用户研究员']],
  'pm-product-strategy': ['产品战略', '战略', ['产品负责人', '产品经理', '创始人', '战略负责人']],
  'pm-execution': ['产品执行', '执行', ['产品经理', '项目经理', '工程师', 'QA']],
  'pm-market-research': ['市场研究', '研究', ['产品经理', '用户研究员', '市场分析师', '战略负责人']],
  'pm-data-analytics': ['数据分析', '数据', ['产品经理', '数据分析师', '数据科学家']],
  'pm-go-to-market': ['上市与增长', '上市', ['产品经理', 'GTM 负责人', '市场营销', '销售']],
  'pm-marketing-growth': ['营销增长', '增长', ['产品经理', '增长负责人', '产品营销', '品牌负责人']],
  'pm-toolkit': ['通用工具箱', '工具', ['产品经理', '运营', '法务', '求职者']],
  'pm-ai-shipping': ['AI 交付审计', '交付', ['产品经理', '创始人', '工程负责人', '安全审查者']]
};

// 每项均以官方 SKILL.md 为事实源；中文字段是便于速查的归纳，不替代原文。
const rows = [
['pm-product-discovery','brainstorm-ideas-existing','存量产品创意','从产品、设计、工程等视角为现有产品生成改进方案。','现有产品、目标问题、用户反馈、约束。','按视角分类的候选想法、价值与风险提示。','已有产品遇到增长、留存或体验问题，需要扩展解法空间。',['产品经理','产品设计师','工程师']],
['pm-product-discovery','brainstorm-ideas-new','新产品创意','围绕新产品机会生成多方向概念并避免过早收敛。','新产品设想、目标用户、问题空间、市场约束。','多组产品概念、核心假设与优先探索方向。','从零探索新产品、创业方向或新业务。',['产品经理','创始人','产品设计师']],
['pm-product-discovery','brainstorm-experiments-existing','存量产品实验','为现有产品的关键假设设计可验证实验。','现有产品、待验证假设、可用用户与数据。','实验方案、假设、指标、成功阈值和成本。','上线前验证价值、可用性、可行性或商业假设。',['产品经理','增长负责人','数据分析师']],
['pm-product-discovery','brainstorm-experiments-new','新产品预型实验','为新产品设计低成本、有真实投入信号的预型实验。','新产品想法、关键假设、目标受众、预算和周期。','预型实验组合、真实行为指标、阈值与学习计划。','投入开发前验证需求真实性和付费意愿。',['创始人','产品经理','增长负责人']],
['pm-product-discovery','identify-assumptions-existing','识别存量产品假设','从价值、易用性、可行性、商业可持续性识别风险假设。','现有功能或方案、用户证据、业务与技术背景。','按风险类别整理的假设清单及证据缺口。','评审功能方案、解释指标异常、准备实验。',['产品经理','产品设计师','工程师']],
['pm-product-discovery','identify-assumptions-new','识别新产品假设','从八类风险系统识别新产品最脆弱的前提。','新产品概念、市场、团队、渠道和商业模式信息。','覆盖价值、市场、团队、战略等类别的假设地图。','创业立项、商业计划或新业务评估。',['创始人','产品负责人','战略负责人']],
['pm-product-discovery','prioritize-assumptions','假设优先级','用影响×风险矩阵决定哪些假设先验证。','假设清单、影响程度、证据强弱、验证成本。','优先级矩阵、最高风险假设及推荐实验。','假设很多但资源有限，需要确定验证顺序。',['产品经理','产品团队','创始人']],
['pm-product-discovery','prioritize-features','功能优先级','综合影响、成本、风险和战略一致性排列功能。','功能清单、用户价值、工作量、风险与战略目标。','排序后的功能列表、评分理由和取舍建议。','路线图、季度规划或需求池治理。',['产品经理','产品负责人','工程负责人']],
['pm-product-discovery','analyze-feature-requests','功能请求分析','对客户功能请求做主题归类、战略匹配和优先级分析。','客户请求、来源、客户分层、频次和产品战略。','主题聚类、需求信号、战略适配度与行动建议。','处理销售、客服或社区收集的大批量需求。',['产品经理','客户成功','产品运营']],
['pm-product-discovery','opportunity-solution-tree','机会解决方案树','把目标、客户机会、解决方案和实验组织成 OST。','单一可衡量目标、用户研究、已有机会或方案。','分层 OST、机会排序、候选方案及验证实验。','避免直接跳到功能，建立持续发现主线。',['产品经理','产品设计师','工程师','用户研究员']],
['pm-product-discovery','interview-script','用户访谈脚本','生成包含 JTBD 深挖问题的结构化访谈提纲。','研究目标、受访者类型、待验证假设、时长。','开场、核心问题、追问、收尾和记录提示。','产品发现、需求验证、流失或购买决策研究。',['用户研究员','产品经理','产品设计师']],
['pm-product-discovery','summarize-interview','访谈总结','把访谈材料整理为 JTBD、满意度信号、洞察和行动项。','访谈录音转写、笔记、研究问题。','结构化摘要、原话证据、主题、机会与后续行动。','单场访谈复盘或多场研究归档。',['用户研究员','产品经理','产品设计师']],
['pm-product-discovery','metrics-dashboard','产品指标看板设计','设计北极星、输入指标、护栏和告警阈值。','产品模式、业务目标、用户旅程、可用数据。','指标体系、口径、看板布局、阈值和复盘节奏。','建立产品经营看板或重构杂乱指标体系。',['产品经理','数据分析师','业务负责人']],

['pm-product-strategy','product-strategy','产品战略画布','用九部分画布形成从愿景到护城河的完整战略。','愿景、客户、市场、竞争、能力和业务目标。','九部分产品战略画布、选择、取舍与战略缺口。','年度战略、新产品方向或战略对齐。',['产品负责人','产品经理','战略负责人']],
['pm-product-strategy','startup-canvas','创业画布','把产品战略与商业模式整合为适合新业务的创业画布。','创业想法、客户问题、解决方案、渠道和收入假设。','完整创业画布、关键假设及验证重点。','创业项目、新业务孵化、融资前梳理。',['创始人','产品负责人','投资分析师']],
['pm-product-strategy','product-vision','产品愿景','创建鼓舞人心、可实现且有情感力量的产品愿景。','长期目标、目标用户、核心问题、价值观和边界。','愿景陈述、解释、原则和校验问题。','战略启动、团队对齐、愿景更新。',['产品负责人','创始人','产品经理']],
['pm-product-strategy','value-proposition','JTBD 价值主张','用六部分 JTBD 模板定义客户为何选择产品。','目标用户、任务、当前替代方案、痛点和期望结果。','Who/Why/Before/How/After/Alternatives 价值主张。','产品定位、PRD、销售沟通或商业模式设计。',['产品经理','产品营销','创始人']],
['pm-product-strategy','lean-canvas','精益画布','用精益画布梳理问题、方案、指标、优势与商业模式。','新产品概念、客户、问题、渠道、成本与收入。','九格精益画布和需要优先验证的风险。','早期创业、快速商业建模、方案比较。',['创始人','产品负责人','战略负责人']],
['pm-product-strategy','business-model','商业模式画布','用九个模块描述组织如何创造、交付和获取价值。','客户、价值、渠道、关系、资源、活动、伙伴和财务。','完整 BMC、模块间矛盾与改进建议。','成熟业务重构、平台商业模式或合作设计。',['战略负责人','产品负责人','商业负责人']],
['pm-product-strategy','monetization-strategy','变现策略','提出多种变现机制并给出验证实验。','产品价值、客户、使用行为、成本结构和竞争信息。','3–5 种变现方案、权衡、风险与实验。','免费产品商业化、新产品收费模式探索。',['产品负责人','商业负责人','增长负责人']],
['pm-product-strategy','pricing-strategy','定价策略','分析定价模型、竞争、支付意愿和价格弹性。','细分客户、价值指标、成本、竞品价格和研究证据。','价格架构、套餐、价值指标、测试和风险。','首次定价、调价、套餐重构或国际化。',['产品负责人','商业负责人','产品营销']],
['pm-product-strategy','swot-analysis','SWOT 分析','把优势、劣势、机会、威胁转化为行动建议。','组织或产品现状、市场、竞争和内部能力。','SWOT 矩阵、交叉策略与优先行动。','战略研讨、竞争应对、年度规划。',['战略负责人','产品负责人','管理层']],
['pm-product-strategy','pestle-analysis','PESTLE 分析','扫描政治、经济、社会、技术、法律和环境因素。','目标市场、地域、行业、时间范围和关键决策。','六维环境分析、影响、概率与应对建议。','进入新市场、政策敏感业务、长期战略。',['战略负责人','市场分析师','产品负责人']],
['pm-product-strategy','porters-five-forces','波特五力','评估行业竞争、买卖双方力量、替代品和新进入者。','行业范围、竞争者、客户、供应链和替代方案。','五力评分、行业吸引力和战略含义。','行业进入、竞争战略、投资判断。',['战略负责人','市场分析师','创始人']],
['pm-product-strategy','ansoff-matrix','安索夫矩阵','从现有/新产品与现有/新市场组合规划增长。','产品组合、客户市场、增长目标、能力和风险偏好。','四象限增长选项、风险和优先路径。','增长战略、产品线扩张、市场进入。',['战略负责人','产品负责人','增长负责人']],

['pm-execution','create-prd','创建 PRD','用八部分模板形成对齐团队的产品需求文档。','问题、目标用户、目标、指标、约束、方案和发布背景。','包含背景、目标、细分、价值、方案和发布计划的 PRD。','把想法或问题转成工程、设计可执行的权威规格。',['产品经理','产品负责人']],
['pm-execution','brainstorm-okrs','设计 OKR','把公司目标转成团队级目标与可衡量关键结果。','公司目标、团队职责、基线数据和周期。','目标、关键结果、指标口径、风险和对齐说明。','季度规划、团队目标重设或跨团队对齐。',['产品负责人','团队负责人','产品经理']],
['pm-execution','outcome-roadmap','结果导向路线图','把功能清单改写为以结果和学习为中心的路线图。','现有功能路线图、战略目标、用户问题和指标。','结果主题、时间视野、信心和学习里程碑。','摆脱功能工厂、向管理层解释路线图。',['产品负责人','产品经理','项目经理']],
['pm-execution','sprint-plan','Sprint 计划','结合容量、优先级、依赖和风险规划迭代。','候选故事、团队容量、历史速度、依赖和 Sprint 目标。','Sprint 目标、选定故事、容量分配、风险和承诺。','迭代启动、临时插单后的重新规划。',['产品经理','项目经理','工程负责人']],
['pm-execution','retro','Sprint 复盘','主持结构化回顾并形成有负责人和期限的改进行动。','Sprint 事件、指标、团队反馈和未完成工作。','亮点、问题、根因、行动项和跟踪机制。','迭代结束、项目阶段复盘、团队协作改进。',['项目经理','团队负责人','产品经理','工程师']],
['pm-execution','release-notes','发布说明','把工单、PRD 或变更日志转成用户可读的发布说明。','功能变化、修复、影响用户、版本和发布时间。','按受众组织的发布说明、升级提示和限制。','版本发布、客户通知、应用商店更新。',['产品经理','产品营销','客户成功']],
['pm-execution','pre-mortem','事前验尸','在执行前假设失败并分类识别风险与防范动作。','PRD、项目计划、发布方案、团队与环境约束。','Tigers/Paper Tigers/Elephants 风险清单和缓解计划。','重要项目启动、发布前、风险评审。',['产品经理','项目经理','风险负责人']],
['pm-execution','stakeholder-map','利益相关者地图','用权力×兴趣矩阵制定差异化沟通策略。','项目目标、相关人员、影响力、关注点和关系。','利益相关者矩阵、沟通频率、信息与负责人。','复杂项目、组织变革、跨部门推进。',['产品经理','项目经理','团队负责人']],
['pm-execution','summarize-meeting','会议总结','把会议转写整理为决定、行动项、问题和后续。','会议录音转写、聊天记录、议程和参会人。','摘要、决定、行动项、负责人、期限和开放问题。','评审会、同步会、客户会议后的快速归档。',['产品经理','项目经理','运营']],
['pm-execution','user-stories','用户故事','按 3C 与 INVEST 把需求写成可讨论、可验收的故事。','功能或用户问题、角色、目标、约束和范围。','用户故事、上下文、验收标准和拆分建议。','需求拆解、Backlog 准备、研发对齐。',['产品经理','业务分析师','工程师']],
['pm-execution','job-stories','Job Stories','用情境—动机—结果表达用户任务，减少角色假设。','触发情境、用户动机、期望结果和证据。','When/I want to/So I can 格式故事及验收提示。','行为驱动产品、用户角色不稳定或多样时。',['产品经理','用户研究员','产品设计师']],
['pm-execution','wwas','Why-What-Acceptance','用 Why、What、Acceptance 编写结果导向 Backlog 项。','业务原因、要改变的能力、成功条件和约束。','WWA 条目、验收条件和依赖。','不想锁死解决方案但需要可执行交付时。',['产品经理','工程师','产品设计师']],
['pm-execution','test-scenarios','测试场景','从用户故事生成正常、边界、错误和恢复路径。','用户故事、验收标准、业务规则和接口约束。','结构化测试场景、前置条件、步骤与预期结果。','研发前测试设计、验收测试、回归补全。',['QA','产品经理','工程师']],
['pm-execution','dummy-dataset','模拟数据集','生成符合业务分布的 CSV、JSON、SQL 或 Python 模拟数据。','字段定义、格式、数量、业务规则、分布和异常比例。','可直接使用的模拟数据及字段说明。','原型、测试、演示、SQL 或分析练习。',['数据分析师','工程师','产品经理','QA']],
['pm-execution','prioritization-frameworks','优先级框架指南','比较并选择 RICE、ICE、Kano、MoSCoW 等九类框架。','决策对象、数据可得性、团队成熟度和决策目标。','推荐框架、计算方式、适用边界和示例。','不确定该用哪种优先级方法或需要统一口径。',['产品经理','产品负责人','项目经理']],
['pm-execution','strategy-red-team','战略红队','对计划做对抗式压力测试，找出承重假设和最便宜验证。','战略、路线图、PRD 或重要计划及已有证据。','承重假设、失败条件、风险排序和廉价测试。','重大决策前反驳自己、避免共识偏误。',['产品负责人','战略负责人','风险负责人']],

['pm-market-research','user-personas','用户画像','基于研究证据构建行为与 JTBD 导向的画像。','访谈、调查、行为数据、细分信息和研究目标。','画像、任务、动机、痛点、行为与证据说明。','研究综合、产品设计、营销对齐。',['用户研究员','产品经理','产品设计师']],
['pm-market-research','market-segments','市场细分','识别 3–5 个具有不同任务和产品适配度的客户细分。','市场范围、客户数据、JTBD、购买行为和约束。','细分定义、规模线索、需求、产品适配和优先级。','选择目标市场、GTM 或产品定位。',['市场分析师','产品负责人','GTM 负责人']],
['pm-market-research','user-segmentation','用户分群','从反馈和行为数据中识别用户群及差异化需求。','用户反馈、行为数据、属性、研究问题。','分群规则、群体特征、JTBD、需求与建议。','精细化运营、体验差异分析、留存研究。',['数据分析师','用户研究员','产品经理']],
['pm-market-research','customer-journey-map','客户旅程地图','映射端到端阶段、触点、情绪、痛点和机会。','目标用户、任务、研究资料、渠道与业务流程。','旅程地图、关键时刻、痛点和机会点。','体验诊断、服务设计、跨部门流程优化。',['产品设计师','用户研究员','产品经理']],
['pm-market-research','market-sizing','市场规模估算','用自上而下与自下而上方法估算 TAM/SAM/SOM。','市场定义、地域、客户数量、价格、渗透率和来源。','双路径估算、假设、区间、敏感性与来源。','商业计划、融资、市场进入和投资排序。',['市场分析师','战略负责人','创始人']],
['pm-market-research','competitor-analysis','竞品分析','比较竞品优势、劣势、定位和可差异化机会。','竞品列表、目标客户、功能、定价、市场证据。','竞品矩阵、战略组、差距、威胁和机会。','产品定位、战略评审、销售支持。',['市场分析师','产品经理','产品营销']],
['pm-market-research','sentiment-analysis','情感与主题分析','从用户反馈中提取情绪、主题、驱动因素和变化。','评论、NPS、工单、访谈或社媒文本。','情感分布、主题、代表证据、趋势和行动建议。','大批量反馈分析、满意度诊断、版本复盘。',['用户研究员','数据分析师','产品运营']],

['pm-data-analytics','sql-queries','自然语言生成 SQL','把业务问题转成 BigQuery、PostgreSQL 或 MySQL 查询。','业务问题、表结构、字段口径、SQL 方言和时间范围。','带解释和校验提示的 SQL 查询。','自助分析、指标取数、数据探索。',['数据分析师','产品经理','工程师']],
['pm-data-analytics','cohort-analysis','队列分析','分析不同队列的留存、采用和参与趋势。','用户级事件数据、队列定义、时间粒度和目标指标。','队列表、留存曲线、差异解释和建议。','留存诊断、版本效果、渠道质量比较。',['数据分析师','产品经理','增长负责人']],
['pm-data-analytics','ab-test-analysis','A/B 测试分析','验证样本量和显著性并给出发布、延长或停止建议。','实验组/对照组数据、指标、样本量、MDE 和周期。','效应、置信区间、显著性、护栏检查与决策。','实验结束决策、样本量评估、结果解读。',['数据分析师','数据科学家','产品经理']],

['pm-go-to-market','gtm-strategy','完整 GTM 策略','形成渠道、信息、指标和上市计划的整体 GTM。','产品、市场、客户、竞争、定价、渠道和目标。','GTM 战略、阶段计划、信息、渠道和成功指标。','新品上市、进入新市场、增长策略重构。',['GTM 负责人','产品营销','产品负责人']],
['pm-go-to-market','beachhead-segment','滩头市场选择','选择最适合最先攻克的细分市场。','候选细分、痛点强度、可达性、竞争与扩张潜力。','细分评分、推荐滩头市场和验证计划。','资源有限的新品上市或创业早期。',['GTM 负责人','创始人','产品负责人']],
['pm-go-to-market','ideal-customer-profile','理想客户画像 ICP','定义最可能成功和购买的理想客户。','现有优质客户、行为、JTBD、公司属性和购买信号。','ICP、资格条件、排除条件、触发器和信息建议。','B2B 获客、销售筛选、市场定位。',['GTM 负责人','销售','产品营销']],
['pm-go-to-market','growth-loops','增长飞轮','设计能自我增强的可持续增长循环。','产品价值、用户行为、分享/供给机制、渠道和约束。','循环图、触发、行动、产出、再投入与指标。','减少对一次性投放依赖、设计产品驱动增长。',['增长负责人','产品经理','GTM 负责人']],
['pm-go-to-market','gtm-motions','GTM Motion 评估','比较产品驱动、销售驱动等 GTM 模式及工具。','产品复杂度、ACV、市场规模、购买流程和团队能力。','适配模式、混合路径、组织/工具要求和风险。','确定获客与销售方式、调整商业组织。',['GTM 负责人','销售负责人','产品负责人']],
['pm-go-to-market','competitive-battlecard','竞争战卡','生成销售可直接使用的竞品对抗与异议处理材料。','我方产品、竞品、客户场景、优势、证据和常见异议。','定位、对比、陷阱问题、异议回应和赢单策略。','销售赋能、竞争激烈的商机、渠道培训。',['销售','产品营销','客户成功']],

['pm-marketing-growth','marketing-ideas','营销创意','提出低成本、可执行的营销渠道、活动和信息创意。','产品、受众、目标、预算、渠道和品牌约束。','创意清单、渠道、信息、成本、指标和优先级。','冷启动、增长实验、营销计划。',['产品营销','增长负责人','创始人']],
['pm-marketing-growth','positioning-ideas','定位角度','生成相对竞品有差异的产品定位方向。','产品价值、目标客户、竞品、替代方案和证据。','多个定位角度、目标受众、理由和测试建议。','品牌升级、上市信息、竞争差异化。',['产品营销','产品负责人','品牌负责人']],
['pm-marketing-growth','value-prop-statements','价值主张文案','为营销、销售和新手引导生成场景化价值主张。','受众、痛点、结果、差异点、证据和使用渠道。','多版本价值主张、文案变体和适用触点。','官网、销售材料、广告和 onboarding。',['产品营销','销售','增长负责人']],
['pm-marketing-growth','product-name','产品命名','围绕品牌价值和受众生成、筛选产品名称。','产品定位、受众、品牌气质、语言和禁用项。','名称候选、命名逻辑、风险和推荐短名单。','新产品、功能、品牌或套餐命名。',['品牌负责人','产品营销','创始人']],
['pm-marketing-growth','north-star-metric','北极星指标','按业务游戏类型定义北极星及输入指标。','产品价值交换、用户行为、商业模式、数据和阶段。','北极星指标、口径、输入指标、护栏与反指标。','指标体系搭建、战略对齐、增长看板。',['产品负责人','增长负责人','数据分析师']],

['pm-toolkit','review-resume','产品经理简历评审','按十项实践检查简历并用 XYZ+S 提升成果表达。','简历、目标岗位、职位描述和职业背景。','问题分级、逐条修改建议、关键词和改写示例。','求职前评审或针对岗位定制简历。',['求职者','招聘经理','职业教练']],
['pm-toolkit','draft-nda','起草保密协议','生成包含适用条款和司法辖区考虑的 NDA 草案。','双方、保密范围、用途、期限、司法辖区和例外。','结构化 NDA 草案、待确认项和法律审阅提醒。','商务洽谈、供应商或合作项目前期。',['法务','商务负责人','创始人']],
['pm-toolkit','privacy-policy','隐私政策','生成覆盖 GDPR/CCPA 关键事项的隐私政策草案。','产品、地区、收集数据、用途、共享方、保留与用户权利。','隐私政策草案、缺口清单和法律审阅提示。','网站或应用上线、数据实践变化。',['法务','产品经理','隐私负责人']],
['pm-toolkit','grammar-check','语法与逻辑校对','检查语法、逻辑、流畅性并提供针对性修订。','待校对文本、受众、语气和风格要求。','问题定位、修改建议和可选修订稿。','公告、PRD、汇报、邮件和营销文案成稿前。',['产品经理','编辑','产品营销']],

['pm-ai-shipping','shipping-artifacts','AI 应用交付文档集','定义让 AI 编写应用可审查所需的核心和条件文档。','代码库、系统边界、用户/权限流程、变量、测试和外部集成。','架构、流程、权限、密钥、测试覆盖等交付文档清单与内容。','vibe-coded 应用交付、接手、审计或上线前。',['产品经理','工程负责人','安全审查者']],
['pm-ai-shipping','intended-vs-implemented','意图与实现差异审计','对照文档意图与代码证据，定位真实偏差。','系统文档、代码库、测试和关键业务规则。','双侧证据引用、差异、风险、置信度和修复建议。','审计 AI 生成代码、权限规则或关键流程是否按设计实现。',['产品经理','工程负责人','安全审查者']]
];

const commandTitles = {
'discover':'完整产品发现','brainstorm':'头脑风暴工作流','triage-requests':'需求请求分诊','interview':'访谈准备/总结','setup-metrics':'指标体系搭建',
'strategy':'产品战略工作流','business-model':'商业模式工作流','value-proposition':'价值主张工作流','market-scan':'市场环境扫描','pricing':'定价工作流',
'write-prd':'撰写 PRD','plan-okrs':'规划 OKR','transform-roadmap':'路线图转型','sprint':'Sprint 生命周期','pre-mortem':'事前验尸工作流','red-team-prd':'PRD/战略红队','meeting-notes':'会议纪要','stakeholder-map':'利益相关者规划','write-stories':'编写故事','test-scenarios':'生成测试场景','generate-data':'生成模拟数据',
'research-users':'用户研究综合','competitive-analysis':'竞争分析工作流','analyze-feedback':'反馈分析工作流','write-query':'自然语言写 SQL','analyze-cohorts':'队列分析工作流','analyze-test':'A/B 测试分析工作流',
'plan-launch':'上市规划','growth-strategy':'增长策略','battlecard':'竞争战卡工作流','market-product':'市场化创意组合','north-star':'北极星指标工作流',
'review-resume':'简历评审工作流','tailor-resume':'岗位定制简历','draft-nda':'NDA 工作流','privacy-policy':'隐私政策工作流','proofread':'校对工作流',
'ship-check':'AI 应用交付检查','document-app':'反向生成系统文档','derive-tests':'从意图推导测试','security-audit-static':'静态安全审计','performance-audit-static':'静态性能审计'
};

function walk(dir, name, out = []) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, name, out); else if (e.name === name) out.push(p);
  }
  return out;
}
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/); const o = {};
  if (!m) return o;
  for (const line of m[1].split(/\r?\n/)) {
    const x = line.match(/^([\w-]+):\s*(.*)$/); if (x) o[x[1]] = x[2].replace(/^['"]|['"]$/g,'');
  }
  return o;
}
function pluginFrom(file) { return file.split(path.sep).find(x => Object.hasOwn(plugins, x)); }
function relSource(file) {
  const plugin = pluginFrom(file); const marker = path.join(plugin, VERSION) + path.sep;
  return plugin + '/' + file.slice(file.indexOf(marker) + marker.length).split(path.sep).join('/');
}
const skillFiles = walk(SOURCE_ROOT, 'SKILL.md').filter(f => f.includes(path.sep + VERSION + path.sep + 'skills' + path.sep));
const commandFiles = [];
for (const plugin of Object.keys(plugins)) {
  const dir = path.join(SOURCE_ROOT, plugin, VERSION, 'commands');
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) commandFiles.push(path.join(dir,f));
}
const profile = new Map(rows.map(r => [r[0] + ':' + r[1], r]));
const skills = skillFiles.map(file => {
  const text = fs.readFileSync(file,'utf8'), fm = frontmatter(text), plugin = pluginFrom(file), name = path.basename(path.dirname(file));
  const r = profile.get(plugin + ':' + name);
  if (!r) throw new Error('缺少中文速查数据：' + plugin + ':' + name);
  return {plugin, pluginTitle:plugins[plugin][0], phase:plugins[plugin][1], name, title:r[2], purpose:r[3], input:r[4], output:r[5], scenario:r[6], roles:r[7], description:fm.description || '', source:relSource(file), invocation:`$${plugin}:${name} 请结合我的目标、背景材料与约束执行，并先指出缺失信息。`};
}).sort((a,b) => Object.keys(plugins).indexOf(a.plugin)-Object.keys(plugins).indexOf(b.plugin) || a.name.localeCompare(b.name));

const commands = commandFiles.map(file => {
  const text=fs.readFileSync(file,'utf8'), fm=frontmatter(text), plugin=pluginFrom(file), name=path.basename(file,'.md');
  const skillsUsed=[...new Set([...text.matchAll(/\*\*([a-z][a-z0-9-]+)\*\*\s+skill/gi)].map(m=>m[1]).concat([...text.matchAll(/`([a-z][a-z0-9-]+)`\s+skill/gi)].map(m=>m[1])))];
  const hint=fm['argument-hint'] || '<任务描述或资料>';
  return {plugin,pluginTitle:plugins[plugin][0],name,title:commandTitles[name]||name,description:fm.description||'',hint,skillsUsed,source:relSource(file),claude:`/${name} ${hint}`,codex:`请运行“${commandTitles[name]||name}”工作流，任务是：<填写目标或附加资料>。按步骤推进，步骤间需要决策时暂停确认。`};
}).sort((a,b)=>Object.keys(plugins).indexOf(a.plugin)-Object.keys(plugins).indexOf(b.plugin)||a.name.localeCompare(b.name));

if (skills.length !== 68) throw new Error(`Skills 应为 68，实际 ${skills.length}`);
if (commands.length !== 42) throw new Error(`Commands 应为 42，实际 ${commands.length}`);
if (new Set(skills.map(s=>s.plugin+':'+s.name)).size !== 68) throw new Error('Skills 存在重复');
if (new Set(commands.map(s=>s.plugin+':'+s.name)).size !== 42) throw new Error('Commands 存在重复');
for (const s of skills) for (const k of ['title','purpose','input','output','scenario','roles','source','invocation']) if (!s[k] || !s[k].length) throw new Error(`${s.name} 缺少 ${k}`);

const skillJson=JSON.stringify(skills).replace(/</g,'\\u003c');
const commandJson=JSON.stringify(commands).replace(/</g,'\\u003c');
const pluginJson=JSON.stringify(plugins).replace(/</g,'\\u003c');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>phuryn/pm-skills v2.1.0 中文速查</title>
<meta name="description" content="phuryn/pm-skills 的 68 个 Skills 与 42 个 Commands 中文速查，含使用、输入、输出、场景和角色。">
<style>
:root{--bg:#f3f1eb;--paper:#fffdf8;--ink:#17212b;--muted:#68727c;--line:#d8d3c9;--navy:#15364a;--teal:#23746a;--coral:#d86f52;--sand:#e8c88c;--soft:#eaf1ef;--shadow:0 12px 34px rgba(26,38,46,.08)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}button,input,select{font:inherit}a{color:var(--teal)}.wrap{max-width:1480px;margin:auto;padding:28px 26px 64px}.hero{position:relative;overflow:hidden;background:var(--navy);color:#fff;border-radius:22px;padding:38px 42px;box-shadow:var(--shadow)}.hero:after{content:"PM";position:absolute;right:24px;bottom:-56px;font:900 180px/1 Georgia,serif;color:rgba(255,255,255,.055)}.eyebrow{color:var(--sand);font-size:12px;font-weight:800;letter-spacing:.16em}.hero h1{font:800 clamp(32px,4.5vw,58px)/1.08 Georgia,"Noto Serif SC",serif;margin:9px 0 14px;max-width:950px}.hero p{max-width:900px;color:#d7e3e8;font-size:17px;margin:0}.meta,.chips,.badges{display:flex;flex-wrap:wrap;gap:7px}.meta{margin-top:22px}.pill,.chip,.badge{border-radius:999px;padding:4px 9px;font-size:12px}.pill{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:16px 0}.stat{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:16px 18px}.stat strong{display:block;color:var(--navy);font-size:28px;line-height:1.1}.stat span{font-size:12px;color:var(--muted)}.note{border-left:5px solid var(--sand);background:#fff8e8;border-radius:12px;padding:13px 16px;margin:16px 0;color:#594a2d}.tabs{display:flex;gap:8px;margin:18px 0 0}.tabs button{border:1px solid var(--line);background:var(--paper);color:var(--muted);border-radius:12px 12px 0 0;padding:10px 18px;cursor:pointer;font-weight:750}.tabs button.active{background:var(--navy);border-color:var(--navy);color:#fff}.toolbar{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:minmax(260px,1.8fr) repeat(3,minmax(150px,.7fr)) auto;gap:9px;padding:13px 0;background:rgba(243,241,235,.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(23,33,43,.1)}.toolbar input,.toolbar select{width:100%;background:#fff;border:1px solid #c9c4ba;border-radius:10px;padding:10px 12px;outline:none}.toolbar input:focus,.toolbar select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(35,116,106,.12)}.view{display:flex;border:1px solid #c9c4ba;border-radius:10px;overflow:hidden}.view button{border:0;background:#fff;color:var(--muted);padding:9px 12px;cursor:pointer}.view button.active{background:var(--teal);color:#fff}.result{display:flex;justify-content:space-between;gap:12px;margin:17px 0 11px;color:var(--muted)}.result strong{color:var(--ink)}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:var(--paper);border:1px solid var(--line);border-radius:17px;padding:19px;box-shadow:0 7px 22px rgba(25,34,42,.045);break-inside:avoid}.cardhead{display:flex;justify-content:space-between;gap:12px}.card h2{font-size:20px;line-height:1.25;margin:0}.id{font:600 12px/1.45 ui-monospace,Consolas,monospace;color:var(--teal);word-break:break-all;margin-top:4px}.badge{background:#e7efed;color:#1d635b;font-weight:750}.badge.phase{background:#f3e8d3;color:#775620}.purpose{margin:14px 0;color:#303b45}.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{padding-top:8px;border-top:1px dashed #dcd6cc}.field.full{grid-column:1/-1}.label{display:block;color:var(--muted);font-size:11px;font-weight:850;letter-spacing:.08em;margin-bottom:3px}.codebox{position:relative;background:#eef3f2;color:#173e3a;border-radius:10px;padding:12px 82px 12px 12px;font:12.5px/1.55 ui-monospace,Consolas,monospace;word-break:break-word}.copy{position:absolute;right:7px;top:7px;border:1px solid #b9cbc7;background:#fff;color:var(--teal);border-radius:7px;padding:4px 8px;cursor:pointer}.copy.ok{background:var(--teal);color:#fff}.chip{background:#efede7}.source{display:flex;justify-content:space-between;gap:10px;margin-top:13px;padding-top:9px;border-top:1px solid var(--line);font-size:12px}.source code{color:var(--muted);word-break:break-all}.source a{text-decoration:none;font-weight:750}.original{margin-top:8px;color:var(--muted);font-size:12px}.original summary{cursor:pointer;font-weight:700}.tablewrap{display:none;overflow:auto;background:var(--paper);border:1px solid var(--line);border-radius:14px}.tablewrap.show{display:block}.cards.hide{display:none}table{border-collapse:collapse;width:100%;min-width:1550px}th{position:sticky;top:70px;background:var(--navy);color:#fff;text-align:left;padding:9px;font-size:12px}td{vertical-align:top;border-bottom:1px solid var(--line);padding:9px;font-size:12.5px}tbody tr:nth-child(even){background:#f8f6f1}.empty{display:none;text-align:center;padding:54px;background:var(--paper);border:1px dashed var(--line);border-radius:15px;color:var(--muted)}.commands-help{display:none}.commands-help.show{display:block}.skills-help.hide{display:none}footer{margin-top:30px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:13px}
@media(max-width:1050px){.stats{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr 1fr 1fr}.toolbar input{grid-column:1/-1}.cards{grid-template-columns:1fr}}@media(max-width:650px){.wrap{padding:14px 12px 42px}.hero{padding:27px 21px}.hero:after{display:none}.stats{grid-template-columns:1fr 1fr}.toolbar{position:static;grid-template-columns:1fr 1fr}.fields{grid-template-columns:1fr}.field.full{grid-column:auto}.cardhead{display:block}.badges{margin-top:8px}.result{display:block}}
@media print{body{background:#fff}.wrap{max-width:none;padding:0}.hero{border-radius:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar,.tabs,.view,.copy,.note{display:none!important}.cards{grid-template-columns:1fr 1fr;gap:9px}.card{box-shadow:none;padding:13px}.tablewrap{display:none!important}.source a:after{content:" (" attr(href) ")"}}
</style></head><body><main class="wrap">
<header class="hero"><div class="eyebrow">PHURYN / PM-SKILLS · QUICK REFERENCE</div><h1>PM Skills 中文速查</h1><p>覆盖 9 个插件中的 68 个 Skills 与 42 个 Commands。每个 Skill 均整理了用途、调用方式、输入、输出、使用场景和适用角色。</p><div class="meta"><span class="pill">稳定版 v2.1.0</span><span class="pill">68 Skills</span><span class="pill">42 Commands</span><span class="pill">生成日期 2026-07-21</span></div></header>
<section class="stats"><div class="stat"><strong>68</strong><span>可复用 Skills</span></div><div class="stat"><strong>42</strong><span>Claude Commands / 工作流</span></div><div class="stat"><strong>9</strong><span>领域插件</span></div><div class="stat"><strong>110</strong><span>页面内可检索能力入口</span></div></section>
<aside class="note"><strong>先分清两类入口：</strong>Skill 是单项框架或能力，在 Codex 中可用 <code>$插件名:技能名</code> 调用；Command 是串联多个步骤的 Claude 工作流。Codex 当前不会把仓库中的 <code>/slash command</code> 当作原生命令运行，因此 Commands 卡片同时给出等价自然语言提示词。</aside>
<nav class="tabs" aria-label="内容类型"><button id="skillTab" class="active">Skills · 68</button><button id="commandTab">Commands · 42</button></nav>
<section class="toolbar" aria-label="筛选工具"><input id="q" type="search" placeholder="搜索名称、用途、输入、输出、场景、角色…"><select id="plugin"><option value="">全部插件</option></select><select id="phase"><option value="">全部阶段</option></select><select id="role"><option value="">全部角色</option></select><div class="view"><button id="cardBtn" class="active">卡片</button><button id="tableBtn">表格</button></div></section>
<div class="result"><span>显示 <strong id="count">68</strong> / <span id="total">68</span> 项</span><span id="modeHelp" class="skills-help">复制示例后，替换任务描述即可调用</span><span class="commands-help" id="cmdHelp">Claude 用斜杠命令；Codex 使用等价自然语言提示词</span></div>
<section id="cards" class="cards"></section><section id="tablewrap" class="tablewrap"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></section><div id="empty" class="empty">没有匹配结果，请调整搜索或筛选条件。</div>
<footer><strong>口径与来源：</strong>以 <a href="https://github.com/phuryn/pm-skills/tree/v2.1.0" target="_blank" rel="noopener">phuryn/pm-skills v2.1.0</a> 的正式 <code>skills/*/SKILL.md</code> 与 <code>commands/*.md</code> 为事实源。中文字段为方便速查的结构化归纳；如需完整方法与细节，请点击每项源码。页面不依赖外部脚本，可直接离线打开。仓库后续更新时，数量与内容可能变化。</footer>
</main><script>
const skills=${skillJson};const commands=${commandJson};const pluginMeta=${pluginJson};
const repo='https://github.com/phuryn/pm-skills/blob/v2.1.0/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'zh-CN'));const $=id=>document.getElementById(id);
Object.entries(pluginMeta).forEach(([k,v])=>$('plugin').insertAdjacentHTML('beforeend','<option value="'+esc(k)+'">'+esc(v[0])+' · '+esc(k)+'</option>'));
uniq(skills.map(s=>s.phase)).forEach(v=>$('phase').insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
uniq(skills.flatMap(s=>s.roles)).forEach(v=>$('role').insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
let mode='skills',view='card';
function chips(a){return a.map(x=>'<span class="chip">'+esc(x)+'</span>').join('')}
function source(s,label){return '<div class="source"><code>'+esc(s.source)+'</code><a href="'+repo+s.source+'" target="_blank" rel="noopener">'+label+' ↗</a></div>'}
function skillCard(s){return '<article class="card"><div class="cardhead"><div><h2>'+esc(s.title)+'</h2><div class="id">$'+esc(s.plugin)+':'+esc(s.name)+'</div></div><div class="badges"><span class="badge">'+esc(s.pluginTitle)+'</span><span class="badge phase">'+esc(s.phase)+'</span></div></div><p class="purpose">'+esc(s.purpose)+'</p><div class="fields"><div class="field full"><span class="label">调用示例</span><div class="codebox">'+esc(s.invocation)+'<button class="copy" data-copy="'+esc(s.invocation)+'">复制</button></div></div><div class="field"><span class="label">输入</span>'+esc(s.input)+'</div><div class="field"><span class="label">输出</span>'+esc(s.output)+'</div><div class="field full"><span class="label">使用场景</span>'+esc(s.scenario)+'</div><div class="field full"><span class="label">适用角色</span><div class="chips">'+chips(s.roles)+'</div></div></div><details class="original"><summary>官方英文说明</summary>'+esc(s.description)+'</details>'+source(s,'查看 SKILL.md')+'</article>'}
function commandCard(s){return '<article class="card"><div class="cardhead"><div><h2>'+esc(s.title)+'</h2><div class="id">/'+esc(s.name)+'</div></div><div class="badges"><span class="badge">'+esc(s.pluginTitle)+'</span><span class="badge phase">工作流</span></div></div><p class="purpose">'+esc(s.description)+'</p><div class="fields"><div class="field full"><span class="label">Claude 调用</span><div class="codebox">'+esc(s.claude)+'<button class="copy" data-copy="'+esc(s.claude)+'">复制</button></div></div><div class="field full"><span class="label">Codex 等价提示词</span><div class="codebox">'+esc(s.codex)+'<button class="copy" data-copy="'+esc(s.codex)+'">复制</button></div></div><div class="field"><span class="label">输入提示</span>'+esc(s.hint)+'</div><div class="field"><span class="label">显式引用的 Skills</span>'+(s.skillsUsed.length?chips(s.skillsUsed):'请查看工作流原文')+'</div></div>'+source(s,'查看 Command')+'</article>'}
function skillRow(s){return '<tr><td><strong>'+esc(s.title)+'</strong><div class="id">'+esc(s.plugin)+':'+esc(s.name)+'</div></td><td>'+esc(s.pluginTitle)+'<br>'+esc(s.phase)+'</td><td>'+esc(s.purpose)+'</td><td><code>'+esc(s.invocation)+'</code></td><td>'+esc(s.input)+'</td><td>'+esc(s.output)+'</td><td>'+esc(s.scenario)+'</td><td>'+s.roles.map(esc).join('、')+'</td><td><a href="'+repo+s.source+'" target="_blank">源码 ↗</a></td></tr>'}
function commandRow(s){return '<tr><td><strong>'+esc(s.title)+'</strong><div class="id">/'+esc(s.name)+'</div></td><td>'+esc(s.pluginTitle)+'</td><td>'+esc(s.description)+'</td><td><code>'+esc(s.claude)+'</code></td><td><code>'+esc(s.codex)+'</code></td><td>'+esc(s.hint)+'</td><td>'+(s.skillsUsed.length?s.skillsUsed.map(esc).join('、'):'见原文')+'</td><td><a href="'+repo+s.source+'" target="_blank">源码 ↗</a></td></tr>'}
function filtered(){const q=$('q').value.trim().toLowerCase(),p=$('plugin').value,ph=$('phase').value,r=$('role').value;const data=mode==='skills'?skills:commands;return data.filter(x=>{const hay=Object.values(x).flat().join(' ').toLowerCase();return(!q||hay.includes(q))&&(!p||x.plugin===p)&&(mode==='commands'||!ph||x.phase===ph)&&(mode==='commands'||!r||x.roles.includes(r))})}
function render(){const list=filtered();$('cards').innerHTML=list.map(mode==='skills'?skillCard:commandCard).join('');$('thead').innerHTML=mode==='skills'?'<tr><th>Skill</th><th>插件/阶段</th><th>用途</th><th>调用</th><th>输入</th><th>输出</th><th>场景</th><th>角色</th><th>来源</th></tr>':'<tr><th>Command</th><th>插件</th><th>用途</th><th>Claude</th><th>Codex</th><th>输入</th><th>Skills</th><th>来源</th></tr>';$('tbody').innerHTML=list.map(mode==='skills'?skillRow:commandRow).join('');$('count').textContent=list.length;$('total').textContent=mode==='skills'?68:42;$('empty').style.display=list.length?'none':'block'}
function setMode(next){mode=next;$('skillTab').classList.toggle('active',mode==='skills');$('commandTab').classList.toggle('active',mode==='commands');$('phase').disabled=mode==='commands';$('role').disabled=mode==='commands';$('modeHelp').classList.toggle('hide',mode==='commands');$('cmdHelp').classList.toggle('show',mode==='commands');render()}
async function copy(text,b){let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);ok=true}else{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();ok=document.execCommand('copy');t.remove()}}catch(e){}b.textContent=ok?'已复制':'复制失败';b.classList.toggle('ok',ok);setTimeout(()=>{b.textContent='复制';b.classList.remove('ok')},1300)}
['q','plugin','phase','role'].forEach(id=>$(id).addEventListener(id==='q'?'input':'change',render));$('cards').addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b)copy(b.dataset.copy,b)});$('skillTab').onclick=()=>setMode('skills');$('commandTab').onclick=()=>setMode('commands');$('cardBtn').onclick=()=>{view='card';$('cards').classList.remove('hide');$('tablewrap').classList.remove('show');$('cardBtn').classList.add('active');$('tableBtn').classList.remove('active')};$('tableBtn').onclick=()=>{view='table';$('cards').classList.add('hide');$('tablewrap').classList.add('show');$('tableBtn').classList.add('active');$('cardBtn').classList.remove('active')};render();
</script></body></html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`generated=${OUT}`);
console.log(`skills=${skills.length}`);
console.log(`commands=${commands.length}`);
console.log(`bytes=${Buffer.byteLength(html)}`);
