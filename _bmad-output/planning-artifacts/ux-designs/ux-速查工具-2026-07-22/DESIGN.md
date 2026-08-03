---
name: 速查工具 · 结构化索引
description: 面向 Windows 与 macOS 本地文件导航的浅色视觉系统，以档案绿标、硬边界和高密度秩序表达可靠与可审计。
status: final
sources:
  - ../../prds/prd-速查工具-2026-07-21/prd.md
  - ../../prds/prd-速查工具-2026-07-21/addendum.md
  - ../../prds/prd-速查工具-2026-07-21/review-rubric.md
updated: 2026-07-22
colors:
  canvas: '#F4F3EC'
  surface: '#FFFDF7'
  surface-subtle: '#E8E9E1'
  text: '#1B211D'
  text-muted: '#566158'
  text-disabled: '#747D76'
  border: '#253229'
  border-muted: '#A9AFA9'
  action: '#1F6248'
  action-hover: '#154532'
  on-action: '#FFFFFF'
  focus: '#6D43B5'
  success: '#216E39'
  warning: '#895400'
  danger: '#A52A2A'
  on-danger: '#FFFFFF'
typography:
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: 0em
  heading:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: 0em
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0em
  meta:
    fontFamily: "ui-monospace, 'Cascadia Mono', 'SFMono-Regular', Consolas, monospace"
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: 0em
rounded:
  none: 0px
  sm: 2px
  md: 4px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  sidebar: 208px
  control-height: 36px
  target-min: 44px
components:
  app-shell:
    canvas: '{colors.canvas}'
    surface: '{colors.surface}'
    divider: '{colors.border}'
  category-nav:
    background: '{colors.surface}'
    border: '{colors.border}'
    width: '{spacing.sidebar}'
  category-item:
    foreground: '{colors.text}'
    active-background: '{colors.action}'
    active-foreground: '{colors.on-action}'
    radius: '{rounded.none}'
  view-header:
    foreground: '{colors.text}'
    divider: '{colors.border}'
  global-search:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    focus: '{colors.focus}'
    radius: '{rounded.sm}'
  toolbar-button:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    primary-background: '{colors.action}'
    primary-foreground: '{colors.on-action}'
    border: '{colors.border}'
    radius: '{rounded.sm}'
  file-card:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    focus: '{colors.focus}'
    radius: '{rounded.sm}'
  file-type-mark:
    foreground: '{colors.text-muted}'
    border: '{colors.border-muted}'
    radius: '{rounded.sm}'
  category-tag:
    foreground: '{colors.action}'
    background: '{colors.canvas}'
    border: '{colors.action}'
    radius: '{rounded.sm}'
  action-menu:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    selected-background: '{colors.surface-subtle}'
    radius: '{rounded.sm}'
  card-form-dialog:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  category-editor-popover:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    radius: '{rounded.sm}'
  category-checklist:
    foreground: '{colors.text}'
    selected: '{colors.action}'
    focus: '{colors.focus}'
  confirmation-dialog:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    destructive: '{colors.danger}'
    destructive-foreground: '{colors.on-danger}'
    radius: '{rounded.md}'
  error-dialog:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    signal: '{colors.warning}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  duplicate-dialog:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    signal: '{colors.warning}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  reorder-control:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    focus: '{colors.focus}'
    radius: '{rounded.sm}'
  empty-state:
    foreground: '{colors.text}'
    secondary: '{colors.text-muted}'
    border: '{colors.border-muted}'
  status-bar:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    signal: '{colors.success}'
    border: '{colors.border}'
    radius: '{rounded.sm}'
  form-field:
    background: '{colors.surface}'
    foreground: '{colors.text}'
    border: '{colors.border}'
    focus: '{colors.focus}'
    error: '{colors.danger}'
    radius: '{rounded.sm}'
---

# 速查工具 · Design Spine

`DESIGN.md` 定义视觉身份；行为、状态与旅程由同级 `EXPERIENCE.md` 定义。后续 Mock、线框或导入稿与两份 Spine 冲突时，以 Spine 为准。正式视觉参考为 [首页与整理排序](mockups/key-home.html)、[新增卡片](mockups/key-add-card.html)、[编辑卡片](mockups/key-edit-card.html) 和 [失败修复与重复冲突](mockups/key-repair-failure.html)；它们解释 Spine，不替代契约。`.working/` 中的方向稿、配色稿、IA 闭环文档和预览图仅是过程证据。

## Brand & Style

速查工具采用“结构化索引”而不是文件管理器式拟物。界面像一册长期使用、随时可核对的本地档案索引：硬边界划分对象，紧凑网格承载扫描，少量档案绿只标记行动与当前状态。它应该稳健、沉静、直接；不需要英文编号装饰、品牌口号或情绪化表现来证明专业。

视觉只服务三件事：快速区分导航与内容、明确分离主打开与管理动作、在失败和破坏性操作中清楚表达后果。浅色是 V1 唯一主题。窗口越宽，只增加网格承载量，不把内容包进人为设定的最大宽度。

## Colors

- **画布 `{colors.canvas}`**：暖灰纸面，承载主工作区背景；不用于按钮强调。
- **表面 `{colors.surface}`**：侧栏、卡片、浮层与对话框的统一底色。
- **正文 `{colors.text}` / 次要文字 `{colors.text-muted}`**：正文与辅助信息的固定层级。禁用态使用 `{colors.text-disabled}`，并必须同时有禁用语义，不靠变浅单独表达。
- **边界 `{colors.border}` / 弱边界 `{colors.border-muted}`**：结构化索引的骨架。主要区块与可操作对象使用硬边界，内部弱分隔才使用弱边界。
- **档案绿 `{colors.action}` / `{colors.action-hover}`**：主行动、当前类别和可操作控件的视觉信号；不是成功色或装饰色。其上的文字使用 `{colors.on-action}`。
- **焦点紫 `{colors.focus}`**：键盘焦点专用，避免与绿色情境选择态混淆。
- **成功 `{colors.success}`、警告 `{colors.warning}`、危险 `{colors.danger}`**：分别用于非阻断成功、可修复失败提示和不可逆应用内删除。状态始终配合标题、图标或文字。

AA 目标组合：`{colors.text}` 在 `{colors.canvas}` / `{colors.surface}` 上的对比度约为 14.73:1 / 16.11:1，`{colors.text-muted}` 约为 5.81:1 / 6.36:1；`{colors.on-action}` 在 `{colors.action}` 上约为 7.24:1，`{colors.on-danger}` 在 `{colors.danger}` 上约为 7.08:1，`{colors.focus}` 在 `{colors.surface}` 上约为 6.62:1。实现阶段仍须对实际字号、字重、悬停、禁用与焦点组合逐项验证 WCAG 2.2 AA；本 Spine 不以静态 token 计算替代组件级验证。

统一焦点外环至少为 2px 实线、至少 2px 外偏移，并直接邻接 `{colors.canvas}` 或 `{colors.surface}`，不得绘制在 `{colors.action}` 当前态内部。active、danger、selected、菜单行和输入错误态都必须在实际组合上验证至少 3:1 的焦点可见变化；必要时增加表面色隔离带，但不改变 `{colors.focus}` 的语义。

## Typography

界面名称、正文、按钮和说明使用 `{typography.body.fontFamily}`，让 Windows 与 macOS 各自选择可读的系统中文无衬线字体；不下载网络字体。视图标题用 `{typography.title}`，卡片名与对话框小标题用 `{typography.heading}`，控件标签用 `{typography.label}`。

数量、排序位置、扩展名和只读路径等辅助信息使用 `{typography.meta}`。等宽字体是审计辅助，不承担卡片名称、长备注或解释性错误文案。文本随系统缩放；控件不得通过固定高度裁切放大后的文字。

## Layout & Spacing

间距采用 4px 基础节奏：`{spacing.1}` / `{spacing.2}` 用于紧密关联，`{spacing.3}` / `{spacing.4}` 用于组件内部，`{spacing.5}` / `{spacing.6}` 用于区块，`{spacing.8}` 只用于主要分区。

应用壳由固定宽度 `{spacing.sidebar}` 的左侧类别导航和可扩展主区域组成。常规设计基线为 1024×720，最小约 760×560；不设 UX 最大宽度。主区域采用均衡紧凑的响应式多列网格：常规窗口约三列，变窄时逐列减少至一列，变宽时继续增加列数；不切换成列表，不提供密度偏好。

对话框在当前应用壳上居中，类别编辑浮层锚定触发位置并避让窗口边缘。最小交互目标参考 `{spacing.target-min}`；标准单行控件以 `{spacing.control-height}` 起步，但文字放大时允许增高。

## Elevation & Depth

层级主要由表面、边界和遮罩表达。卡片不靠阴影浮起；侧栏不使用浮岛；主操作也不使用发光或渐变。浮层和对话框可以使用单一低扩散阴影帮助区分遮挡关系，但阴影不能取代 `{colors.border}`。同一时刻只保留一个顶层模态焦点上下文；从错误进入删除确认时替换而非叠加对话框。

## Shapes

形状以方形和极小圆角为主：结构区块与类别项使用 `{rounded.none}`，输入、按钮、标签、卡片和菜单使用 `{rounded.sm}`，居中模态框可使用 `{rounded.md}`。不使用胶囊按钮、大圆角卡片或圆形装饰容器；圆形只允许图标本身有语义需要时出现。

## Components

下列键名是跨两份 Spine 的规范名称；`EXPERIENCE.md` 使用同名键描述行为。

| Component | Visual contract |
|---|---|
| `app-shell` | `{components.app-shell.canvas}` 主画布、`{components.app-shell.surface}` 侧栏与内容表面，以 `{components.app-shell.divider}` 划分两区；不使用卡片化外壳。 |
| `category-nav` | 固定宽度 `{components.category-nav.width}`，`{components.category-nav.background}` 表面和 1–2px `{components.category-nav.border}` 右边界；标题、“＋”、系统视图与用户类别形成纵向索引。 |
| `category-item` | 单行名称与独立更多按钮；普通态 `{components.category-item.foreground}`，当前态使用 `{components.category-item.active-background}` / `{components.category-item.active-foreground}`；系统视图与用户类别通过位置和操作可用性区分。 |
| `view-header` | 视图名称、数量/排序辅助信息、`global-search` 与主工具区共享一条清晰水平基线，下方以 `{components.view-header.divider}` 分隔网格。 |
| `global-search` | 常驻单行输入，2px `{components.global-search.border}` 边界；聚焦以 `{components.global-search.focus}` 外环显示，非空时出现清空按钮。 |
| `toolbar-button` | 次级按钮为表面底+硬边框；“选择文件”使用 `{components.toolbar-button.primary-background}` / `{components.toolbar-button.primary-foreground}`。文字标签优先于仅图标按钮。 |
| `file-card` | 均衡紧凑的方形索引卡；1px `{components.file-card.border}`，名称与元信息由分隔线组织。常驻更多按钮与卡片主体视觉分离；焦点用 `{components.file-card.focus}` 外环。 |
| `file-type-mark` | 小型线性文件图标和等宽扩展名共同出现，使用 `{components.file-type-mark.foreground}`；不根据文件内容生成缩略图。 |
| `category-tag` | 仅在“全部卡片”和搜索结果显示；至多两个，更多显示“+N”。细边框、极小圆角，不做可点击外观。 |
| `action-menu` | 紧贴更多按钮的硬边界菜单，选中行用 `{components.action-menu.selected-background}`；危险项文字可用 `{colors.danger}`，但不整行红底。禁用项使用 `{colors.text-disabled}`、不可用图标/标记与可见原因文案共同表达，保持原布局和可读边界，不得仅降低整行透明度。 |
| `card-form-dialog` | 新增与编辑共用视觉骨架；标题、字段组、只读路径区和底部操作分区明确。宽度由内容与最小窗口约束，不形成独立页面。 |
| `category-editor-popover` | 单字段紧凑浮层，使用 `{components.category-editor-popover.border}` 硬边界；错误文字紧贴字段，按钮顺序稳定。 |
| `category-checklist` | 展开式复选列表；选中标记用 `{components.category-checklist.selected}`，键盘焦点用 `{components.category-checklist.focus}`，两者不可只靠颜色区分。 |
| `confirmation-dialog` | 用于删除类别、删除卡片和放弃修改。标题与后果说明保持正文色；唯一破坏性按钮用 `{components.confirmation-dialog.destructive}` / `{components.confirmation-dialog.destructive-foreground}`。 |
| `error-dialog` | 打开失败与定位失败共用骨架；左侧/顶部警告标记使用 `{components.error-dialog.signal}`，正文保持高对比，修复行动不使用危险色。 |
| `duplicate-dialog` | 重复源文件冲突用 `{components.duplicate-dialog.signal}` 标记；原卡片名称作为正文重点，“查看原卡片”是主行动。 |
| `reorder-control` | 整理模式中的拖动手柄及“上移 / 下移”按钮；具备硬边界和独立焦点，不与卡片打开态混用。到达首尾边界时，对应按钮使用 `{colors.text-disabled}`、禁用标记和不可激活语义，按钮轮廓仍可辨认，不得仅依赖颜色或透明度。 |
| `empty-state` | 位于主区阅读起点，短标题、边界说明和最多两个行动；首次空状态仅一个主行动，类别空状态可有主次两个入口。 |
| `status-bar` | 锚定主区域底部，不推动布局、不遮挡卡片；成功标记用 `{components.status-bar.signal}`，正文用 `{components.status-bar.foreground}`，带关闭按钮。 |
| `form-field` | 单行名称、备注文本区和只读路径共享标签与错误节奏；聚焦用 `{components.form-field.focus}`，错误用 `{components.form-field.error}` 并同时显示文字。 |

## Do's and Don'ts

| Do | Don't |
|---|---|
| 用硬边界、稳定位置和清楚标签建立索引秩序 | 用阴影、渐变、装饰编号或英文标签制造“专业感” |
| 让档案绿只承担行动与当前项 | 把绿色同时当成功、装饰和类别随机色 |
| 让卡片主体与更多按钮成为两个清楚的焦点目标 | 用悬停才出现的管理入口，或让菜单点击触发主打开 |
| 文件类型用图标+扩展名，备注最多两行 | 读取文件内容生成预览、缩略图或富文本摘要 |
| 所有错误、禁用、成功和焦点状态同时有非颜色信号 | 只用红/绿/紫区分状态 |
| 保持浅色单主题和统一跨平台产品界面 | 在 UX 阶段冻结 UI 实现库、Electron、Tauri、JSON、数据库或打包方案 |
| 大窗口增加网格列数，小窗口减少至一列 | 设置人为最大内容宽度、自动切列表或折叠固定侧栏 |
| 动效短且功能化；减少动态时即时切换 | 卡片弹跳、入场编排、装饰性转场或持续动画 |
