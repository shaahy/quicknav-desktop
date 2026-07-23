# Component Contracts: 本地文件导航工具

**Feature**: 001-local-file-navigator
**Source**: DESIGN.md Components + EXPERIENCE.md Component Patterns
**Date**: 2026-07-22

> 每个组件必须实现以下 props/行为契约。视觉 token 引用 DESIGN.md 对应键名。
> 组件命名使用 `kebab-case` 作为 React 组件文件名（如 `file-card.tsx`），CSS class 使用 `BEM` 风格前缀 `qc-*`（quick-lookup）。

## app-shell

**Surface**: S01–S09 的单窗口容器

| Prop | Type | Contract |
|------|------|----------|
| `loadingState` | `'loading' \| 'ready' \| 'error'` | 加载中渲染壳+加载文案且禁止交互；失败渲染阻断反馈 |
| `retryLoad` | `() => void` | 加载失败时的重试回调 |
| `quitApp` | `() => void` | 加载失败时的关闭应用回调 |

- 左侧固定宽度 208px `category-nav`，右侧 `main` 区 flex-grow
- 画布色 `{colors.canvas}`，壳与侧栏分割线 `{colors.border}` 1-2px
- 冷启动进入 S01（全部卡片）；托盘恢复保持关闭前的 Surface

## category-nav

**Surface**: 左侧栏常驻

| Prop | Type | Contract |
|------|------|----------|
| `views` | `ViewItem[]` | `[{type: 'allCards'}, ...userCategories, ...uncategorized?]` |
| `currentViewId` | `string` | 当前活跃视图 |
| `onSwitchView` | `(viewId: string) => void` | 切换视图回调 |
| `onCreateCategory` | `() => void` | 打开 S12 新建浮层 |
| `onReorderCategories` | `() => void` | 进入 S09 整理模式 |

- 标题区含"＋"和"整理类别"可见入口
- 全部卡片固定在顶部
- 用户类别按 `order` 排序
- 未分类仅在有卡片时显示在底部
- 当前视图使用 `{colors.action}` 背景 + `{colors.on-action}` 文字
- `role="navigation"`, `aria-label="类别导航"`

## category-item

**Surface**: 系统视图与用户类别

| Prop | Type | Contract |
|------|------|----------|
| `item` | `ViewItem` | 视图对象 |
| `isActive` | `boolean` | 当前是否选中 |
| `onClick` | `() => void)` | 切换视图 |
| `menuActions` | `Action[] \| null` | 全部卡片/未分类为 null |

- 名称区域切换视图，更多按钮独立焦点
- 当前态: `{colors.action}` + `{colors.on-action}`，非当前: `{colors.text}`
- 系统视图无编辑/删除菜单
- `role="option"`, `aria-selected={isActive}`

## view-header

**Surface**: 主区顶部

| Prop | Type | Contract |
|------|------|----------|
| `title` | `string` | 当前视图名称 |
| `cardCount` | `number` | 当前视图卡片数 |
| `showSortInfo` | `boolean` | 是否显示排序辅助信息 |

- 承载常驻 `global-search` 和工具按钮
- 下方 `{colors.border}` 分隔线
- `role="banner"`, 标题作为主内容的 `aria-labelledby`

## global-search

**Surface**: S01–S09 常驻

| Prop | Type | Contract |
|------|------|----------|
| `value` | `string` | 当前输入 |
| `onChange` | `(value: string) => void` | 实时搜索回调 |
| `onClear` | `() => void` | 清空搜索 |

- 单行输入，2px `{colors.border}` 边界
- 聚焦外环 `{colors.focus}`
- 非空时显示清空按钮
- 搜索忽略首尾空格，英文不区分大小写
- 实时结果 ≤200ms debounce
- ARIA live region (礼貌级，仅播报结果数)
- `role="searchbox"`, `aria-label="搜索卡片"`

## toolbar-button

| Prop | Type | Contract |
|------|------|----------|
| `label` | `string` | 按钮文案 |
| `variant` | `'primary' \| 'secondary'` | primary 使用 `{colors.action}` + `{colors.on-action}` |
| `onClick` | `() => void` | action |
| `disabled` | `boolean` | 禁用态需解释原因 |
| `icon` | `IconName \| null` | 可选图标 |

## file-card

**Surface**: S01–S04, S08

| Prop | Type | Contract |
|------|------|----------|
| `card` | `Card` | 卡片数据 |
| `index` | `number` | 在当前视图中的位置 (1-based) |
| `total` | `number` | 当前视图卡片总数 |
| `viewType` | `ViewType` | 当前视图类型 |
| `onOpenFile` | `(cardId: string) => void` | 主打开动作 |
| `onShowMenu` | `(cardId: string) => void` | 更多按钮 |
| `isReorderMode` | `boolean` | 整理模式中禁用打开 |

- 主体 onClick → `onOpenFile` (非整理模式)
- 更多按钮独立焦点和 onClick → `onShowMenu`
- 1px `{colors.border}`，焦点 `{colors.focus}` 外环
- 名称+元信息由分隔线组织
- 最多两行备注摘要，无备注不留空位
- category-tag 仅在全部卡片和搜索显示
- 主体 `aria-label="打开：{card.name}"`，更多按钮 `aria-label="更多操作：{card.name}"`
- `role="article"`, 并在集合上下文中暴露位置: `aria-posinset={index}`, `aria-setsize={total}`

## file-type-mark

| Prop | Type | Contract |
|------|------|----------|
| `extension` | `string` | 扩展名（不含点） |
| `fileName` | `string` | 文件名（用于图标推断） |

- 图标 + 扩展名文本
- 使用 `{typography.meta}` 字体
- 色: `{colors.text-muted}`, 边界: `{colors.border-muted}`, 圆角: `{rounded.sm}`
- 不读取文件内容生成缩略图

## category-tag

| Prop | Type | Contract |
|------|------|----------|
| `categories` | `Category[]` | 卡片所属用户类别（最多显示 2 个） |

- 至多 2 个标签 + "+N"
- S02/S03 隐藏
- 不可点击
- 色: `{colors.action}` 文字, `{colors.canvas}` 背景, `{colors.action}` 边框, `{rounded.sm}`

## action-menu

| Prop | Type | Contract |
|------|------|----------|
| `items` | `MenuItem[]` | 菜单项列表 |
| `anchor` | `DOMRect` | 定位锚点 |
| `onClose` | `() => void` | 关闭回调 |

- 硬边界 `{colors.border}`
- 选中行: `{colors.surface-subtle}`
- 危险项: `{colors.danger}` 文字，不整行红底
- 禁用项: `{colors.text-disabled}` + 禁用标记 + 原因文案
- `role="menu"`, 菜单项 `role="menuitem"`

## card-form-dialog

**Surface**: S10 (新增), S11 (编辑)

| Prop | Type | Contract |
|------|------|----------|
| `mode` | `'create' \| 'edit'` | 模式 |
| `initialData` | `CardFormData \| null` | 编辑时的初始值 |
| `onSave` | `(data: CardFormData) => void` | 保存回调 |
| `onClose` | `(hasChanges: boolean) => void` | 关闭请求 → S15 检查 |

- S10: 名称 + 类别选择，初始焦点在名称
- S11: 名称 + 备注 + 类别 + 只读路径 + 复制路径 + 文件管理器中显示 + 重新选择文件
- 类别始终不预选
- 校验失败聚焦首个无效 field
- 有修改关闭 → S15
- `role="dialog"`, `aria-labelledby="form-title"`, `aria-describedby="form-desc"`

## category-editor-popover

**Surface**: S12

| Prop | Type | Contract |
|------|------|----------|
| `mode` | `'create' \| 'rename'` | 模式 |
| `initialName` | `string` | 重命名时的现有名称 |
| `onSave` | `(name: string) => void` | 保存回调 |
| `onClose` | `() => void` | 关闭回调，焦点还给触发者 |
| `anchor` | `DOMRect` | 锚定位置 |

- 单字段浮层，`{colors.border}` 硬边界
- `Esc`/取消还焦触发者
- 创建成功焦点回 S10 并自动选中新类别

## category-checklist

**Surface**: S10/S11 中

| Prop | Type | Contract |
|------|------|----------|
| `categories` | `Category[]` | 可用类别列表 |
| `selectedIds` | `string[]` | 已选类别 ID |
| `onChange` | `(ids: string[]) => void` | 选择变化回调 |
| `onCreateNew` | `() => void` | 打开 S12 新建 |

- 展开式复选列表
- 选中标记: `{colors.action}`
- 焦点: `{colors.focus}`
- 未分类不可选（禁用态）
- 无类别时自动聚焦"新建类别"
- 校验失败: "请至少选择一个类别"
- `role="group"`, `aria-label="选择类别"`

## confirmation-dialog

**Surface**: S13 (删除类别), S14 (删除卡片), S15 (放弃修改)

| Prop | Type | Contract |
|------|------|----------|
| `variant` | `'delete-category' \| 'delete-card' \| 'discard-changes'` | 确认类型 |
| `data` | `ConfirmationData` | 上下文数据 |
| `onConfirm` | `() => void` | 确认回调 |
| `onCancel` | `() => void` | 取消回调 |

- 居中模态
- 破坏性按钮: `{colors.danger}` + `{colors.on-danger}`
- 初始焦点在安全动作（取消/继续编辑）
- 居中，不堆叠
- `role="alertdialog"`, `aria-labelledby` 关联标题

## error-dialog

**Surface**: S16 (无法打开), S17 (无法定位)

| Prop | Type | Contract |
|------|------|----------|
| `variant` | `'open-failed' \| 'locate-failed'` | 失败类型 |
| `cardName` | `string` | 卡片名称 |
| `onReSelect` | `() => void` | 重新选择文件 |
| `onDelete` | `() => void` | 删除卡片 → S14 |
| `onClose` | `() => void` | 关闭 |

- 警告标记: `{colors.warning}`
- 初始焦点在"重新选择文件"（非破坏性）
- 删除必须转 S14
- 关闭后卡片保留，可再次点击
- `role="alertdialog"`

## duplicate-dialog

**Surface**: S18

| Prop | Type | Contract |
|------|------|----------|
| `existingCardName` | `string` | 已收录的原卡片名称 |
| `existingCardId` | `string` | 原卡片 ID |
| `onViewCard` | `(id: string) => void` | 查看原卡片 → S11 |
| `onReSelect` | `() => void` | 重新选择文件 |
| `onCancel` | `() => void` | 取消 |

- `{colors.warning}` 标记
- 初始焦点在"查看原卡片"
- `role="alertdialog"`

## reorder-control

**Surface**: S08 (卡片排序), S09 (类别排序)

| Prop | Type | Contract |
|------|------|----------|
| `items` | `ReorderItem[]` | 项目列表 |
| `onReorder` | `(newOrder: string[]) => void` | 排序完成回调 |
| `itemType` | `'card' \| 'category'` | 排序对象类型 |

- 拖动手柄 + 上移/下移按钮
- 移动结果立即生效 (≤200ms UI 更新)
- 播报: "[item 名称], 位置 [N]/[total]" (礼貌级)
- 首尾边界按钮禁用态: `{colors.text-disabled}` + 禁用标记
- `role="listbox"`, 项目 `role="option"` + `aria-posinset`/`aria-setsize`

## empty-state

**Surface**: S05, S06, S07

| Prop | Type | Contract |
|------|------|----------|
| `variant` | `'first-launch' \| 'category-empty' \| 'no-results'` | 空状态类型 |
| `searchQuery` | `string \| null` | S07 的查询词 |
| `primaryAction` | `Action \| null` | 主行动 |
| `secondaryAction` | `Action \| null` | 次行动 (S06) |

- S05: 仅"选择文件"，说明"添加常用文件。应用不会扫描磁盘。"
- S06: "选择文件" + "查看全部卡片"
- S07: 显示查询词 + "清空搜索"
- 不展示虚构示例卡片
- 位于主区阅读起点

## status-bar

**Surface**: 非阻断成功反馈

| Prop | Type | Contract |
|------|------|----------|
| `message` | `string` | 反馈文案 |
| `visible` | `boolean` | 显示状态 |
| `onDismiss` | `() => void` | 关闭回调 |
| `triggerElementId` | `string \| null` | 焦点归还目标 |

- 锚定主区底部，不推布局，不遮挡
- 至少 8 秒、可关闭
- 悬停/聚焦时暂停消失
- 关闭后焦点回 triggerElementId
- `role="status"`, `aria-live="polite"`

## form-field

**Surface**: S10–S12 中

| Prop | Type | Contract |
|------|------|----------|
| `type` | `'text' \| 'textarea' \| 'readonly-path'` | 字段类型 |
| `label` | `string` | 标签 |
| `value` | `string` | 当前值 |
| `error` | `string \| null` | 错误文案 |
| `maxLength` | `number \| null` | 最大字符数 |
| `onChange` | `(value: string) => void` | 变化回调 |

- 聚焦: `{colors.focus}`
- 错误: `{colors.danger}` 边界 + 关联文字
- 错误与字段通过 `aria-describedby` 关联
- 提交失败聚焦首个无效字段
