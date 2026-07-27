# Data Model: 本地文件导航工具

**Feature**: 001-local-file-navigator
**Date**: 2026-07-22
**Storage**: Single JSON file, full-load to memory

## Entity Relationship

```
Category (1) ──< (N) CardCategory (N) >── (1) Card
                                              │
                                              (1)
                                              │
                                        FileReference
```

- Card 与 Category 为多对多关系，通过 CardCategory 关联表
- Card 与 FileReference 为一对一
- "全部卡片"和"未分类"是视图概念，不存储为 Category 实体

## Entities

### Card

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `id` | string (UUID v4) | ✅ | 唯一 | auto |
| `name` | string | ✅ | 1-80 chars, single-line, 去除首尾空格后非空, 不与已有卡片 name 完全相同 | — |
| `note` | string | ❌ | ≤500 chars (含换行), 去除首尾空格后纯空白→null | null |
| `fileReference` | FileReference | ✅ | 一对一 | — |
| `categoryIds` | string[] | ✅ | 至少 1 个用户类别 ID，不含未分类 ID | — |
| `createdAt` | ISO 8601 | ✅ | auto | now |
| `updatedAt` | ISO 8601 | ✅ | auto | now |

**State transitions**:
```
[不存在] ──新增确认保存──▶ [正常]
[正常] ──编辑保存──▶ [正常] (updatedAt 更新)
[正常] ──删除确认──▶ [已删除]
[正常] ──文件打开失败──▶ [正常] (卡片不变，仅触发 S16)
[正常] ──重新关联──▶ [正常] (fileReference 更新)
```

**Validation rules** (from spec FR-006, FR-002a, FR-032):
- name: `trim().length ∈ [1, 80]`, 无换行, 不与已有 name（忽略大小写? 不——spec 明确大小写不同视为不同名称）
- note: `trim() === '' ? null : note`, 截断 ≤500 chars
- categoryIds: `length >= 1`, 所有 ID 在 Category 表中存在且非未分类

### Category

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `id` | string (UUID v4) | ✅ | 唯一 | auto |
| `name` | string | ✅ | 1-30 chars, single-line, 去除首尾空格后非空, 不与已有 category name 完全相同（去除首尾空格后）, 不可为"全部卡片"或"未分类" | — |
| `order` | number | ✅ | 用户类别之间的独立顺序 | 末尾 |
| `type` | enum | ✅ | `'user'` | `'user'` |
| `createdAt` | ISO 8601 | ✅ | auto | now |

**State transitions**:
```
[不存在] ──创建保存──▶ [正常]
[正常] ──重命名保存──▶ [正常]
[正常] ──删除确认──▶ [已删除]
[正常] ──排序调整──▶ [正常] (order 更新)
```

**Note**: 系统视图（"全部卡片"、"未分类"）不存储为 Category 实体，由应用逻辑动态生成：
- "全部卡片": 聚合所有 Card，按 allCardsOrder 排序
- "未分类": 聚合 `categoryIds.length === 0` 的 Card，按 uncategorizedOrder 排序，仅在结果非空时显示

### FileReference

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `relativePath` | string | ✅ | 相对于 `app-data.json` 所在工具目录的路径，分隔符归一化为正斜杠并使用 Unicode NFC；允许 `../` 指向工具目录外的同盘文件，Windows 跨盘文件不允许创建卡片 |
| `fileName` | string | ✅ | 不含扩展名的文件名（用于默认卡片名回退） |
| `extension` | string | ❌ | 扩展名（不含点），用于 file-type-mark |
| `fileSize` | number | ❌ | 字节数，辅助唯一性校验 |
| `mtimeMs` | number | ❌ | 修改时间毫秒时间戳，辅助唯一性校验 |
| `platformId` | string | ❌ | 平台特定标识符，V1 不强制使用 |

**Identity rule** (from research Decision 4):
- 主键 = `normalizePath(relativePath)` — 相对路径归一化 + Unicode NFC
- 唯一性辅助校验 = `{fileSize, mtimeMs}` 组合（快速交叉验证，不做文件哈希）

### ViewOrder

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `viewType` | enum | ✅ | `'allCards' | 'category:{categoryId}' | 'uncategorized'` |
| `cardIds` | string[] | ✅ | 有序列表，只含该视图下的卡片 ID |

**Order semantics**:
- 每个视图独立维护顺序数组
- 新增卡片追加到每个所属视图末尾
- 从类别移出卡片时从该视图移除（但其他视图保持不变）
- 删除卡片时从所有视图移除
- 空视图的 cardIds 为 `[]`

### AppData (Root)

```typescript
interface AppData {
  version: 1;
  cards: Card[];
  categories: Category[];
  viewOrders: ViewOrder[];
  // 衍生视图由应用逻辑计算:
  // - allCards: cards 按 viewOrders[allCards] 排序
  // - uncategorized: cards.filter(c => c.categoryIds.length === 0)
}
```

## Data File

- Path: `{app.getPath('userData')}/app-data.json`
- 启动时全量加载到内存
- 保存时全量序列化写回（JSON.stringify + fs.writeFileSync）
- 数据损坏时: 仅重试读取，不备份，用户确认后以空数据覆盖
- 编码: UTF-8 with BOM (Windows 兼容)
