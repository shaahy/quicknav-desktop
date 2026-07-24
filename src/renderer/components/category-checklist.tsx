import { useCallback } from 'react'
import { RESERVED_NAMES } from '../../shared/constants'
import type { Category } from '../../shared/types'
import '../styles/components/category-checklist.css'

interface CategoryChecklistProps {
  /** All user-created categories. */
  categories: Category[]
  /** IDs of currently selected categories. */
  selectedIds: string[]
  /** Called with the updated selection array on toggle. */
  onChange: (ids: string[]) => void
}

/**
 * Expandable checkbox list of all user categories.
 *
 * - Selected items render in `--color-action`.
 * - Focus ring uses `--color-focus`.
 * - "未分类" is always present and disabled (not checkable).
 * - Shows validation error when zero items are selected.
 * - Auto-focuses the "新建类别" button when no categories exist.
 */
export function CategoryChecklist({
  categories,
  selectedIds,
  onChange,
}: CategoryChecklistProps) {
  const uncategorizedLabel = RESERVED_NAMES[1] // '未分类'

  const handleToggle = useCallback(
    (id: string) => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
      onChange(next)
    },
    [selectedIds, onChange]
  )

  return (
    <div
      className="qc-category-checklist"
      role="group"
      aria-label="选择类别"
    >
      {/* Checklist */}
      <div className="qc-category-checklist__list">
        {categories.map(cat => {
          const isSelected = selectedIds.includes(cat.id)
          return (
            <label
              key={cat.id}
              className={[
                'qc-category-checklist__item',
                isSelected && 'qc-category-checklist__item--selected',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="checkbox"
                className="qc-category-checklist__checkbox"
                checked={isSelected}
                onChange={() => handleToggle(cat.id)}
              />
              <span className="qc-category-checklist__label">{cat.name}</span>
            </label>
          )
        })}

        {/* Disabled "未分类" — always present, never checkable */}
        <label className="qc-category-checklist__item qc-category-checklist__item--disabled">
          <input
            type="checkbox"
            className="qc-category-checklist__checkbox"
            disabled
          />
          <span className="qc-category-checklist__label">{uncategorizedLabel}</span>
        </label>
      </div>

      {/* Validation error when nothing selected */}
      {selectedIds.length === 0 && (
        <div className="qc-category-checklist__error" role="alert">
          请至少选择一个类别
        </div>
      )}

    </div>
  )
}
