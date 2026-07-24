import React, { useState, useCallback, useMemo } from 'react'
import type { MenuItem } from '@shared/types'
import { VIEW_ALL_CARDS, VIEW_UNCATEGORIZED } from '@shared/constants'
import { useAppState } from '../contexts/AppState'
import { useCategories } from '../hooks/useCategories'
import { CategoryItem } from './category-item'
import { ActionMenu } from './action-menu'
import { ConfirmationDialog } from './confirmation-dialog'
import '../styles/components/category-nav.css'

// ── Public types ──

export interface CategoryNavView {
  id: string
  name: string
  type: 'system' | 'user'
}

export interface CategoryNavProps {
  /** All available views to display in the navigation. */
  views: CategoryNavView[]
  /** The ID of the currently active view. */
  currentViewId: string
  /** Called when the user clicks a navigation item to switch view. */
  onSwitchView: (viewId: string) => void
  /** Opens the category editor to create a new category. */
  onCreateCategory: () => void
  /** Enters S09 reorder mode for categories. */
  onReorderCategories: () => void
  /**
   * When provided, "rename" menu action delegates to parent (popover usage).
   * Otherwise uses inline rename input.
   */
  onRenameCategory?: (categoryId: string, currentName: string) => void
  /**
   * When provided, "delete" menu action delegates to parent.
   * Otherwise uses internal confirmation dialog.
   */
  onDeleteCategory?: (categoryId: string) => void
}

// ── Helpers ──

/**
 * Extract the raw category UUID from a view ID that may be in
 * `category:{uuid}` format. Returns the ID as-is if it does not
 * start with `category:`.
 */
function extractCategoryId(viewId: string): string {
  if (viewId.startsWith('category:')) {
    return viewId.slice('category:'.length)
  }
  return viewId
}

// ── Component ──

/**
 * Sidebar navigation for switching between card views.
 *
 * Renders system views ("全部卡片" at top, "未分类" at bottom) and
 * user-created categories sorted by `order`. Each user category has a
 * "更多" button that opens an action menu with rename and delete options.
 *
 * Uses `role="navigation"` and `aria-label="类别导航"` for accessibility.
 *
 * View IDs for user categories should use `category:{uuid}` format so
 * they double as ViewType values for view switching.
 */
export function CategoryNav({
  views,
  currentViewId,
  onSwitchView,
  onCreateCategory,
  onReorderCategories,
  onRenameCategory,
  onDeleteCategory,
}: CategoryNavProps) {
  const { state } = useAppState()
  const { uncategorizedCards, renameCategory, deleteCategory } = useCategories()

  // ── Menu state ──

  const [menuTargetId, setMenuTargetId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)

  // ── Rename state (inline fallback when onRenameCategory is not provided) ──

  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // ── Delete confirmation state (internal fallback when onDeleteCategory is not provided) ──

  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  // ── Render order: 全部卡片 → user categories (sorted by order) → 未分类 ──

  const hasUncategorized = uncategorizedCards.length > 0

  const renderedViews = useMemo<CategoryNavView[]>(() => {
    const allCardsView = views.find(v => v.id === VIEW_ALL_CARDS)
    const uncategorizedView = views.find(v => v.id === VIEW_UNCATEGORIZED)

    // Sort user categories by their order property
    const orderMap = new Map(state.data.categories.map(c => [c.id, c.order]))
    const userViews = [...views]
      .filter(v => v.type === 'user')
      .sort((a, b) => {
        const aId = extractCategoryId(a.id)
        const bId = extractCategoryId(b.id)
        return (orderMap.get(aId) ?? 0) - (orderMap.get(bId) ?? 0)
      })

    const result: CategoryNavView[] = []
    if (allCardsView) result.push(allCardsView)
    result.push(...userViews)
    if (uncategorizedView && hasUncategorized) result.push(uncategorizedView)
    return result
  }, [views, state.data.categories, hasUncategorized])

  // ── ActionMenu items (computed when menu is open) ──

  const menuItems = useMemo<MenuItem[]>(() => {
    if (!menuTargetId) return []
    const rawId = extractCategoryId(menuTargetId)
    const cat = state.data.categories.find(c => c.id === rawId)
    if (!cat) return []

    return [
      {
        id: 'rename',
        label: '重命名',
        variant: 'default' as const,
        onClick: () => {
          if (onRenameCategory) {
            onRenameCategory(cat.id, cat.name)
          } else {
            setRenamingCategoryId(menuTargetId)
            setRenameValue(cat.name)
          }
        },
      },
      {
        id: 'delete',
        label: '删除',
        variant: 'danger' as const,
        onClick: () => {
          if (onDeleteCategory) {
            onDeleteCategory(cat.id)
          } else {
            setDeletingCategoryId(menuTargetId)
          }
        },
      },
    ]
  }, [menuTargetId, state.data.categories, onRenameCategory, onDeleteCategory])

  // ── Menu handlers ──

  const handleCloseMenu = useCallback(() => {
    setMenuTargetId(null)
    setMenuAnchor(null)
  }, [])

  // ── Inline rename handlers (fallback) ──

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingCategoryId) return
    const rawId = extractCategoryId(renamingCategoryId)
    const success = await renameCategory(rawId, renameValue)
    if (success) {
      setRenamingCategoryId(null)
    }
  }, [renamingCategoryId, renameValue, renameCategory])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleRenameSubmit()
      } else if (e.key === 'Escape') {
        setRenamingCategoryId(null)
      }
    },
    [handleRenameSubmit]
  )

  // ── Inline delete handlers (fallback) ──

  const deleteCategoryData = useMemo(() => {
    if (!deletingCategoryId) return null
    const rawId = extractCategoryId(deletingCategoryId)
    const cat = state.data.categories.find(c => c.id === rawId)
    if (!cat) return null
    const totalCards = state.data.cards.filter(c =>
      c.categoryIds.includes(rawId)
    ).length
    const uncategorizedCount = state.data.cards.filter(
      c =>
        c.categoryIds.includes(rawId) &&
        c.categoryIds.length === 1
    ).length
    return { categoryName: cat.name, totalCards, uncategorizedCount }
  }, [deletingCategoryId, state.data.categories, state.data.cards])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCategoryId) return
    const rawId = extractCategoryId(deletingCategoryId)
    await deleteCategory(rawId)
    setDeletingCategoryId(null)
  }, [deletingCategoryId, deleteCategory])

  const handleDeleteCancel = useCallback(() => {
    setDeletingCategoryId(null)
  }, [])

  // ── Card counts per view ──

  const cardCounts = useMemo(() => {
    const totalCards = state.data.cards.length

    const perCategory = new Map<string, number>()
    for (const card of state.data.cards) {
      for (const catId of card.categoryIds) {
        perCategory.set(catId, (perCategory.get(catId) ?? 0) + 1)
      }
    }

    const uncategorizedCount = state.data.cards.filter(
      c => c.categoryIds.length === 0
    ).length

    return { totalCards, perCategory, uncategorizedCount }
  }, [state.data.cards])

  // ── Check if we should show inline rename (only when no callback provided) ──

  const showInlineRename = !onRenameCategory

  // ── Render ──

  return (
    <nav className="qc-category-nav" role="navigation" aria-label="类别导航">
      {/* Header — height aligned with main toolbar */}
      <div className="qc-category-nav__header">
        <h2 className="qc-category-nav__title">类别</h2>
        <div className="qc-category-nav__actions">
          <button
            type="button"
            className="qc-category-nav__icon-btn"
            aria-label="整理类别"
            onClick={onReorderCategories}
          >
            ≡
          </button>
          <button
            className="qc-category-nav__add-btn"
            type="button"
            aria-label="新建类别"
            onClick={onCreateCategory}
          >
            +
          </button>
        </div>
      </div>

      {/* Views list */}
      <div className="qc-category-nav__list">
        {renderedViews.map(view => {
          const isRenaming = showInlineRename && renamingCategoryId === view.id

          // ── Inline rename input mode ──
          if (isRenaming) {
            return (
              <div key={view.id} className="qc-category-nav__rename-row">
                <input
                  className="qc-category-nav__rename-input"
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameSubmit}
                  maxLength={30}
                  autoFocus
                />
              </div>
            )
          }

          return (
            <CategoryItem
              key={view.id}
              item={view}
              isActive={currentViewId === view.id}
              onClick={() => onSwitchView(view.id)}
              menuActions={view.type === 'user' ? [{ id: '_show', label: '', variant: 'default', onClick: () => {} }] : null}
              onShowMenu={
                view.type === 'user'
                  ? (rect) => {
                      setMenuTargetId(view.id)
                      setMenuAnchor(rect)
                    }
                  : undefined
              }
              cardCount={
                view.id === VIEW_ALL_CARDS
                  ? cardCounts.totalCards
                  : view.id === VIEW_UNCATEGORIZED
                    ? cardCounts.uncategorizedCount
                    : cardCounts.perCategory.get(extractCategoryId(view.id)) ?? 0
              }
            />
          )
        })}
      </div>

      {/* ActionMenu for user category actions */}
      {menuTargetId && menuAnchor && (
        <ActionMenu
          items={menuItems}
          anchor={menuAnchor}
          onClose={handleCloseMenu}
        />
      )}

      {/* Delete confirmation dialog (internal fallback) */}
      {deletingCategoryId && deleteCategoryData && (
        <ConfirmationDialog
          variant="delete-category"
          data={deleteCategoryData}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </nav>
  )
}
