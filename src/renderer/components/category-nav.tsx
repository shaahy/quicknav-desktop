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
  /** Opens S12 category editor to create a new category. */
  onCreateCategory: () => void
  /** Enters S09 reorder mode for categories. */
  onReorderCategories: () => void
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
 */
export function CategoryNav({
  views,
  currentViewId,
  onSwitchView,
  onCreateCategory,
  onReorderCategories,
}: CategoryNavProps) {
  const { state } = useAppState()
  const { uncategorizedCards, renameCategory, deleteCategory } = useCategories()

  // ── Menu state ──

  const [menuTargetId, setMenuTargetId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)

  // ── Rename state ──

  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // ── Delete confirmation state ──

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
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

    const result: CategoryNavView[] = []
    if (allCardsView) result.push(allCardsView)
    result.push(...userViews)
    if (uncategorizedView && hasUncategorized) result.push(uncategorizedView)
    return result
  }, [views, state.data.categories, hasUncategorized])

  // ── ActionMenu items (computed when menu is open) ──

  const menuItems = useMemo<MenuItem[]>(() => {
    if (!menuTargetId) return []
    const cat = state.data.categories.find(c => c.id === menuTargetId)
    if (!cat) return []

    return [
      {
        id: 'rename',
        label: '重命名',
        variant: 'default' as const,
        onClick: () => {
          setRenamingCategoryId(menuTargetId)
          setRenameValue(cat.name)
        },
      },
      {
        id: 'delete',
        label: '删除',
        variant: 'danger' as const,
        onClick: () => setDeletingCategoryId(menuTargetId),
      },
    ]
  }, [menuTargetId, state.data.categories])

  // ── Menu handlers ──

  const handleCloseMenu = useCallback(() => {
    setMenuTargetId(null)
    setMenuAnchor(null)
  }, [])

  // ── Rename handlers ──

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingCategoryId) return
    const success = await renameCategory(renamingCategoryId, renameValue)
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

  // ── Delete handlers ──

  const deleteCategoryData = useMemo(() => {
    if (!deletingCategoryId) return null
    const cat = state.data.categories.find(c => c.id === deletingCategoryId)
    if (!cat) return null
    const totalCards = state.data.cards.filter(c =>
      c.categoryIds.includes(deletingCategoryId)
    ).length
    const uncategorizedCount = state.data.cards.filter(
      c =>
        c.categoryIds.includes(deletingCategoryId) &&
        c.categoryIds.length === 1
    ).length
    return { categoryName: cat.name, totalCards, uncategorizedCount }
  }, [deletingCategoryId, state.data.categories, state.data.cards])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCategoryId) return
    await deleteCategory(deletingCategoryId)
    setDeletingCategoryId(null)
  }, [deletingCategoryId, deleteCategory])

  const handleDeleteCancel = useCallback(() => {
    setDeletingCategoryId(null)
  }, [])

  // ── Render ──

  return (
    <nav className="qc-category-nav" role="navigation" aria-label="类别导航">
      {/* Header */}
      <div className="qc-category-nav__header">
        <h2 className="qc-category-nav__title">类别</h2>
        <button
          className="qc-category-nav__add-btn"
          type="button"
          aria-label="新建类别"
          onClick={onCreateCategory}
        >
          +
        </button>
      </div>

      {/* Views list */}
      <div className="qc-category-nav__list">
        {renderedViews.map(view => {
          const isRenaming = renamingCategoryId === view.id

          // ── Rename input mode ──
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

      {/* Delete confirmation dialog */}
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
