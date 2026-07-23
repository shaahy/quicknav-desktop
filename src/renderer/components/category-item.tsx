import React from 'react'
import type { MenuItem } from '@shared/types'
import '../styles/components/category-item.css'

// ── Props ──

interface CategoryItemProps {
  /** Category data: system types ("全部卡片" / "未分类") have type="system". */
  item: { id: string; name: string; type: 'system' | 'user' }
  /** Whether this item is the currently active/selected category. */
  isActive: boolean
  /** Called when the user clicks or activates the row (Enter or Space). */
  onClick: () => void
  /**
   * Menu items for the "更多" button.
   * - `null` for system views ("全部卡片", "未分类") — hides the button.
   * - Non-empty array for user categories — shows the button.
   */
  menuActions: MenuItem[] | null
  /**
   * Called when the "更多" button is clicked.
   * Passes the button's DOMRect for positioning the parent's ActionMenu.
   */
  onShowMenu?: (anchorRect: DOMRect) => void
}

// ── Component ──

/**
 * Single row item in the sidebar category navigation.
 *
 * - Renders the category name plus an optional "更多" button for user categories.
 * - Active state uses `--color-action` background with `--color-on-action` text.
 * - Normal (inactive) state uses `--color-text`.
 * - System items ("全部卡片", "未分类") never show the "更多" button.
 *
 * @example
 * ```tsx
 * <CategoryItem
 *   item={{ id: 'all', name: '全部卡片', type: 'system' }}
 *   isActive={currentView === VIEW_ALL_CARDS}
 *   onClick={() => setCurrentView(VIEW_ALL_CARDS)}
 *   menuActions={null}
 * />
 * ```
 */
export function CategoryItem({
  item,
  isActive,
  onClick,
  menuActions,
  onShowMenu,
}: CategoryItemProps) {
  // ── Keyboard activation (Enter / Space) ──

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  // ── "更多" button handler ──

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onShowMenu?.(rect)
  }

  // ── Decide whether to render the more button ──

  const hasMenu = menuActions !== null && menuActions.length > 0

  // ── Class names ──

  const classNames = [
    'qc-category-item',
    isActive ? 'qc-category-item--active' : '',
    item.type === 'system' ? 'qc-category-item--system' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // ── Render ──

  return (
    <div
      className={classNames}
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="qc-category-item__name">{item.name}</span>

      {hasMenu && (
        <button
          className="qc-category-item__more-btn"
          type="button"
          aria-label={`更多操作：${item.name}`}
          onClick={handleMoreClick}
        >
          更多
        </button>
      )}
    </div>
  )
}
