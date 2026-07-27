# Requirements Quality Checklist: 本地文件导航工具

**Purpose**: Validate the quality, clarity, and completeness of requirements in spec.md — NOT implementation correctness.
**Created**: 2026-07-22
**Feature**: [spec.md](../spec.md)
**Depth**: Standard | **Audience**: Author + Reviewer | **Focus**: 完整性、清晰度、一致性、可测试性、权限、异常、安全、体验状态

---

## 1. 需求完整性 (Completeness)

- [ ] CHK001 — 是否明确声明了 V1 范围边界（包含什么、排除什么），且每个排除项都有理由？[Completeness, Spec §Assumptions]
- [ ] CHK002 — 是否所有 4 条 User Journey (UJ-1~UJ-4) 都有对应的 User Story 和验收场景？[Completeness, Spec §User Scenarios]
- [ ] CHK003 — 是否每条 User Story 都定义了"独立可测试"的标准（Independent Test）？[Completeness, Spec §US1~US4]
- [ ] CHK004 — 是否所有 18 个 EXPERIENCE.md 定义的 Surface 都在 spec 中被直接或间接引用？[Completeness, Gap]
- [ ] CHK005 — 是否定义了数据在正常关闭、系统重启、应用升级、卸载后 4 种生命周期场景下的行为？[Completeness, Spec §FR-036]
- [ ] CHK006 — 是否定义了应用启动时的 3 种数据状态（首次空数据、正常加载、加载失败）及其完整处理路径？[Completeness, Spec §US4 Scenario 7-8]

## 2. 需求清晰度 (Clarity)

- [ ] CHK007 — "5 秒、2 次核心操作"是否明确界定了计时起点（用户开始执行查找动作）和终点（文件成功交给操作系统），排除了系统"选择打开方式"等异常路径？[Clarity, Spec §SC-001]
- [ ] CHK008 — "正常升级后保留全部应用数据"中的"正常升级"是否定义了具体含义（覆盖安装 vs 卸载重装 vs 大版本迁移）？[Clarity, Spec §FR-036]
- [ ] CHK009 — ARIA live region 行为描述中"礼貌级播报""短暂输入停顿""可取消、可合并"是否有精确到毫秒或帧的量化定义？[Clarity, Spec §FR-023a]
- [ ] CHK010 — "最小化到系统托盘"行为是否明确了数据保存策略（窗口关闭到托盘时是否实时写盘，还是只在退出时写）？[Clarity, Spec §FR-036b]
- [ ] CHK011 — "设计基线 1024×720，最小约 760×560"中的"约"是否足够精确？是否需要定义 ± 容差范围？[Clarity, Spec §SC-007]
- [ ] CHK012 — HTML title 读取逻辑中"读取文件前 64KB 并解析"的实现细节出现在 research.md 中，spec.md 的需求文本本身是否对该行为有足够清晰的描述？[Clarity, Spec §FR-003]
- [ ] CHK013 — "不设硬上限但也不承诺无限容量"中的容量承诺边界是否有可验证的标准（如"≤500 张卡片性能不退化"）？[Clarity, Spec §Assumptions]

## 3. 需求一致性 (Consistency)

- [ ] CHK014 — FR-020 定义"冷启动进入全部卡片"与 FR-036b "托盘恢复保持关闭前状态"是否在措辞上互不矛盾？[Consistency, Spec §FR-020 vs FR-036b]
- [ ] CHK015 — FR-009 统一了 S11/S16/S17 三种修复场景，但 US4 Scenario 3 仅描述了 S16 的修复路径。US3 Scenario 7 定位失败后的修复行为是否与 FR-009 一致？[Consistency, Spec §FR-009 vs US3 vs US4]
- [ ] CHK016 — FR-022 "排序移动结果立即生效"与 research.md "debounce 500ms 后写盘"之间是否存在 UI 即时反馈与数据持久化时机的不一致？[Consistency, Spec §FR-022 vs research.md]
- [ ] CHK017 — S18 重复冲突对话框在新增（S10）、主动更换（S11）、打开修复（S16）、定位修复（S17）四种触发场景下的行为是否完全一致？[Consistency, Spec §外部系统交互契约]
- [ ] CHK018 — category-checklist 中"未分类不可选"（FR-015）与"仅当未分类自身有卡片时显示"（FR-018）——当未分类无卡片时不可见，此时"不可选"的校验规则是否仍需要存在？[Consistency, Spec §FR-015 vs FR-018]

## 4. 可测试性 (Testability)

- [ ] CHK019 — "应用不预判文件状态，直接请求操作系统处理"这条需求是否可以客观验证？（如何区分"预判了但失败了"和"没预判但失败了"？）[Measurability, Spec §FR-026]
- [ ] CHK020 — "界面不得以任何形式暗示用户存在同步、迁移、导入、导出或共享能力"是否有可操作的验证标准？（需要枚举所有可能暗示的 UI 元素吗？）[Measurability, Spec §FR-035]
- [ ] CHK021 — "200% 文本缩放或等效条件下无文字裁切、控件遮挡或功能丢失"——"功能丢失"是否可以用 checklist 形式枚举所有功能的通过/失败标准？[Measurability, Spec §SC-007]
- [ ] CHK022 — "所有功能可通过键盘完成"是否有可验证的键盘路径映射表？（Tab 顺序、方向键导航、Esc 行为、Enter/Space 行为）[Measurability, Spec §SC-006]
- [ ] CHK023 — 搜索排序规则（完整名称匹配优先 > 名称开头 > 其他包含）——"同一层级内沿用全部卡片顺序"的可测试性：如何处理跨层级排序的验证？[Measurability, Spec §FR-024]
- [ ] CHK024 — SC-002 要求"静默失败率为 0%"，是否有机制验证在所有操作系统和环境组合下不存在静默失败路径？[Measurability, Spec §SC-002]

## 5. 权限与授权 (Permissions)

- [ ] CHK025 — 单用户场景下，是否需要定义对应用数据文件 (`app-data.json`) 的读写权限要求？[Gap, Permissions]
- [ ] CHK026 — 是否需要定义用户通过文件选择器访问受系统权限保护的文件（如系统目录、其他用户目录）时的行为？[Gap, Permissions]
- [ ] CHK027 — 可执行文件/脚本的收录和打开是否需要任何应用层权限声明（如"您将要运行一个可执行文件"）？spec 明确“不增加额外警告”——是否与安全最佳实践冲突？[Gap, Permissions, Spec §SC-005]
- [ ] CHK028 — 应用是否需要声明自身对文件系统的访问范围（仅限用户显式选择的文件，不遍历目录）？[Gap, Permissions]

## 6. 异常处理 (Exceptions)

- [ ] CHK029 — 是否定义了 JSON 数据文件写入失败（磁盘满、权限不足、文件被锁定）时的用户反馈和恢复路径？[Gap, Exception Flow]
- [ ] CHK030 — 是否定义了用户在系统文件选择器中选择了无法访问的文件（如网络路径断开、权限拒绝）——在此时（非后续打开时）的行为？[Gap, Exception Flow, Spec §X01]
- [ ] CHK031 — 是否定义了系统托盘不可用（某些 Linux 桌面环境或精简 Windows 版本）时的降级行为？[Gap, Exception Flow]
- [ ] CHK032 — 是否定义了同时快速点击两张卡片触发两次系统打开请求时的并发行为？[Gap, Exception Flow]
- [ ] CHK033 — 是否定义了操作系统报告文件打开成功但用户实际看不到应用窗口（如最小化启动）时的反馈？[Gap, Exception Flow, Spec §FR-026]
- [ ] CHK034 — 是否定义了用户在"选择打开方式"（X02）对话框中选择了一个无法处理该文件类型的应用后的行为？[Gap, Exception Flow, Spec §FR-027]

## 7. 安全性 (Security)

- [ ] CHK035 — JSON 数据文件 (`app-data.json`) 存储的相对路径可能包含 `../` 和目录名称——是否有明文路径泄露风险？是否需要定义路径混淆或加密需求？[Gap, Security]
- [ ] CHK036 — 应用通过 `shell.openPath` 可执行任意文件——spec 依赖操作系统安全提示（X04）作为唯一安全边界。是否需要定义应用层面的可执行文件白名单/黑名单？[Gap, Security, Spec §FR-026]
- [ ] CHK037 — `readHtmlTitle` 读取 HTML 文件前 64KB——是否考虑了恶意 HTML 文件（极大文件、二进制伪装的 .html）对读取性能或安全的影响？[Gap, Security]
- [ ] CHK038 — 是否需要定义应用数据文件的完整性校验需求（如 JSON schema validation 之外的文件篡改检测）？[Gap, Security]

## 8. 体验状态 (Experience States)

- [ ] CHK039 — 是否所有 18 个 Surface 都定义了加载中、正常、空、错误四种基础状态的需求覆盖？[Completeness, Experience States]
- [ ] CHK040 — S01-S09 等主视图 Surface 的键盘焦点顺序是否在 spec 中明确定义，而不仅仅依赖 EXPERIENCE.md？[Gap, Experience States]
- [ ] CHK041 — "模态不堆叠"原则——从 S16 进入 S14，从 S18 进入 S11 等跨 Surface 转换链，是否每个路径的状态变化都有需求覆盖？[Coverage, Experience States, Spec §Edge Cases]
- [ ] CHK042 — 是否定义了系统托盘恢复窗口时，如果原来显示的卡片已被删除或原来所在的类别已被删除——界面的恢复行为？[Gap, Experience States, Spec §FR-036b]
- [ ] CHK043 — 是否定义了应用在后台（最小化到托盘）期间，如果用户通过文件管理器手动删除了源文件——恢复窗口时的行为？[Gap, Experience States]
- [ ] CHK044 — status-bar 的"不遮挡操作、不推动布局"是否有精确的定位和尺寸需求？是否在所有 Surface 和窗口尺寸下一致？[Clarity, Experience States, Spec §Edge Cases]
- [ ] CHK045 — 是否所有交互元素都定义了 disabled/active/focus/hover 四种交互状态的需求？[Completeness, Experience States]

---

## 维度覆盖矩阵

| 维度 | 条目数 | 状态 | 说明 |
|------|--------|------|------|
| 完整性 (Completeness) | 6 (CHK001-006) | 多数 PASS | spec 已覆盖 26 PRD FRs，但"正常升级"定义待澄清 |
| 清晰度 (Clarity) | 7 (CHK007-013) | 3 项有缺口 | 时间量化、托盘策略、容量边界可进一步精确化 |
| 一致性 (Consistency) | 5 (CHK014-018) | 1 项有风险 | 排序"立即生效"与 debounce 写盘之间需明确措辞 |
| 可测试性 (Testability) | 6 (CHK019-024) | 2 项有风险 | "不预判""不暗示"缺乏可验证的操作性定义 |
| 权限 (Permissions) | 4 (CHK025-028) | 均为 Gap | spec 假设单用户=无权限模型，但文件系统与可执行文件边界值得确认 |
| 异常 (Exceptions) | 6 (CHK029-034) | 均为 Gap | 磁盘满、并发点击、托盘不可用等非 happy path 未在需求中显式覆盖 |
| 安全 (Security) | 4 (CHK035-038) | 均为 Gap | 路径泄露、可执行文件、恶意 HTML、数据篡改——V1 可接受但应记录风险 |
| 体验状态 (Experience States) | 7 (CHK039-045) | 2 项有风险 | 后台恢复状态和键盘焦点顺序未完全冻结 |

## 风险优先级

| 优先级 | 条目 | 理由 |
|--------|------|------|
| 🔴 高 | CHK034 | 用户选择无法处理文件类型的应用后无反馈——可能静默失败，违反 SC-002 |
| 🔴 高 | CHK029 | 数据写入失败无恢复路径——可能导致数据丢失，违反 SC-004 |
| 🟠 中 | CHK019 | "不预判文件状态"可测试性差——验收时无法区分预判失败和直接失败 |
| 🟠 中 | CHK020 | "界面不得暗示同步"的可操作性验证标准缺失 |
| 🟠 中 | CHK016 | 排序"立即生效"与 debounce 写盘语义矛盾 |
| 🟡 低 | CHK025-028 | V1 单用户场景权限模型简化——可接受但应记录 |
| 🟡 低 | CHK035-038 | V1 本地工具安全风险可控——应在 plan 中记录风险接受声明 |

---

## Notes

- 总计 45 条需求质量检查项，覆盖 8 个维度
- ≥80% 条目含 `[Spec §X.Y]` 或 `[Gap]` 标记
- CHK029-CHK038（异常+安全）为系统性 Gap——PRD 设计时有意将此类细节推迟到 Architecture 阶段，但 spec 作为需求契约应对异常路径有显式声明
- 建议：将高优先级项（CHK034, CHK029）在 plan 阶段补充为设计决策或风险接受声明
