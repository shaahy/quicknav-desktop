import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { FileSelectionResult, CardFormData, MenuItem, ReorderItem, ViewType } from '@shared/types'
import { VIEW_ALL_CARDS, VIEW_UNCATEGORIZED } from '@shared/constants'
import { useAppState, useAppDispatch } from '../contexts/AppState'
import { useCards } from '../hooks/useCards'
import { useCategories } from '../hooks/useCategories'
import { CategoryNav } from './category-nav'
import type { CategoryNavView } from './category-nav'
import { ViewHeader } from './view-header'
import { ToolbarButton } from './toolbar-button'
import { FileCard } from './file-card'
import { EmptyState } from './empty-state'
import { CardFormDialog } from './card-form-dialog'
import { ActionMenu } from './action-menu'
import { ConfirmationDialog } from './confirmation-dialog'
import { ReorderControl } from './reorder-control'
import { CategoryEditorPopover } from './category-editor-popover'
import { GlobalSearch } from './global-search'
import '../styles/components/app-shell.css'

export interface AppShellProps {
  /** Determines which top-level state the shell renders. */
  loadingState: 'loading' | 'ready' | 'error'
  /** Called when the user clicks the retry button in error state. */
  retryLoad: () => void
  /** Called when the user clicks the quit button in error state. */
  quitApp: () => void
}

/**
 * Root layout component for the QuickLook app.
 *
 * Renders the entire app window as a two-column layout:
 * - Left sidebar (208px fixed width) with category navigation
 * - Main content area with view-header, toolbar, and card grid / empty-state
 *
 * Three top-level states:
 * - loading:  shell skeleton with non-interactive message
 * - error:    blocking error feedback with retry + quit buttons
 * - ready:    full app UI (cards grid or empty-state for first-launch)
 */
export function AppShell({ loadingState, retryLoad, quitApp }: AppShellProps) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const { visibleCards, addCard, updateCard, deleteCard } = useCards()
  const {
    categories,
    addCategory,
    renameCategory,
    reorderCategories,
  } = useCategories()

  const retryRef = useRef<HTMLButtonElement>(null)

  // ── View title derived from currentView ──

  const viewTitle = useMemo<string>(() => {
    if (state.currentView === VIEW_ALL_CARDS) return '全部卡片'
    if (state.currentView === VIEW_UNCATEGORIZED) return '未分类'
    const cat = state.data.categories.find(
      c => state.currentView === `category:${c.id}`
    )
    return cat?.name ?? '全部卡片'
  }, [state.currentView, state.data.categories])

  // ── CategoryNav views ──

  const categoryNavViews = useMemo<CategoryNavView[]>(() => {
    const result: CategoryNavView[] = [
      { id: VIEW_ALL_CARDS, name: '全部卡片', type: 'system' },
      ...categories.map(c => ({
        id: `category:${c.id}` as const,
        name: c.name,
        type: 'user' as const,
      })),
      { id: VIEW_UNCATEGORIZED, name: '未分类', type: 'system' },
    ]
    return result
  }, [categories])

  // ── View switching ──

  const handleSwitchView = useCallback(
    (viewId: string) => {
      dispatch({ type: 'SET_CURRENT_VIEW', viewType: viewId as ViewType })
    },
    [dispatch]
  )

  // ── Card form dialog state (S10: file-selection flow) ──

  const [pendingFileResult, setPendingFileResult] = useState<FileSelectionResult | null>(null)
  const showFormDialog = pendingFileResult !== null

  // ── Action menu state ──

  const [menuCardId, setMenuCardId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)

  // ── Card editing state (S11) ──

  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  // ── Discard confirmation state (S15) ──

  const [pendingDiscard, setPendingDiscard] = useState(false)

  // ── Card delete confirmation state (S14) ──

  const [deletingCardId, setDeletingCardId] = useState<string | null>(null)

  // ── Category editor state ──

  const [categoryEditorState, setCategoryEditorState] = useState<{
    mode: 'create' | 'rename'
    categoryId?: string
    initialName?: string
  } | null>(null)

  // ── Category reorder mode (S09) ──

  const [isCategoryReorderMode, setIsCategoryReorderMode] = useState(false)
  // Initial items snapshot for entering reorder mode; useSort manages the order internally.
  const [categoryReorderInit, setCategoryReorderInit] = useState<ReorderItem[]>([])

  // ── Card reorder mode (S08) ──

  const [isCardReorderMode, setIsCardReorderMode] = useState(false)
  // Initial items snapshot for entering reorder mode; useSort manages the order internally.
  const [cardReorderInit, setCardReorderInit] = useState<ReorderItem[]>([])

  // ── Existing names for category editor validation ──

  const existingNamesForEditor = useMemo<string[]>(() => {
    if (!categoryEditorState) return []
    if (categoryEditorState.mode === 'create') {
      return state.data.categories.map(c => c.name)
    }
    // For rename, exclude the current category's own name
    return state.data.categories
      .filter(c => c.id !== categoryEditorState.categoryId)
      .map(c => c.name)
  }, [categoryEditorState, state.data.categories])

  // ── Handlers ──

  const handleSelectFile = useCallback(async () => {
    const result = await window.electronAPI.selectFile()
    if (result.canceled || !result.file) return
    setPendingFileResult(result)
  }, [])

  const handleFormSave = useCallback(
    async (data: CardFormData) => {
      if (!pendingFileResult) return
      await addCard(pendingFileResult, data.name, data.categoryIds)
      setPendingFileResult(null)
    },
    [pendingFileResult, addCard]
  )

  const handleFormClose = useCallback(
    (_hasChanges: boolean) => {
      setPendingFileResult(null)
    },
    []
  )

  // ── Action menu (S11 / S14) ──

  const handleShowMenu = useCallback(
    (cardId: string, anchorRect: DOMRect) => {
      setMenuCardId(cardId)
      setMenuAnchor(anchorRect)
    },
    []
  )

  const handleCloseMenu = useCallback(() => {
    setMenuCardId(null)
    setMenuAnchor(null)
  }, [])

  // ── "移出当前类别" handler ──

  const handleRemoveFromCategory = useCallback(
    async (cardId: string) => {
      if (!state.currentView.startsWith('category:')) return
      const categoryId = state.currentView.slice('category:'.length)

      const card = state.data.cards.find(c => c.id === cardId)
      if (!card || card.categoryIds.length <= 1) return

      const newCategoryIds = card.categoryIds.filter(id => id !== categoryId)
      await updateCard(cardId, { categoryIds: newCategoryIds })
    },
    [state.currentView, state.data.cards, updateCard]
  )

  // ── Menu items computed lazily when menu is open ──

  const menuItems = useMemo<MenuItem[]>(() => {
    if (!menuCardId) return []

    const card = state.data.cards.find(c => c.id === menuCardId)
    const isCategoryView = state.currentView.startsWith('category:')
    const categoryId = isCategoryView
      ? state.currentView.slice('category:'.length)
      : null

    const items: MenuItem[] = [
      {
        id: 'edit',
        label: '编辑',
        variant: 'default' as const,
        onClick: () => {
          setEditingCardId(menuCardId)
        },
      },
      {
        id: 'show-in-folder',
        label: '在文件管理器中显示',
        variant: 'default' as const,
        disabledReason: card ? undefined : '卡片数据异常',
        onClick: () => {
          if (card) {
            window.electronAPI
              .showItemInFolder(card.fileReference.absolutePath)
              .catch(() => {})
          }
        },
      },
    ]

    // "移出当前类别" when viewing a category and card has multiple categories
    if (
      categoryId &&
      card &&
      card.categoryIds.includes(categoryId) &&
      card.categoryIds.length > 1
    ) {
      items.push({
        id: 'remove-from-category',
        label: '移出当前类别',
        variant: 'default' as const,
        onClick: () => {
          handleRemoveFromCategory(menuCardId)
        },
      })
    }

    items.push({
      id: 'delete',
      label: '删除',
      variant: 'danger' as const,
      onClick: () => {
        setDeletingCardId(menuCardId)
      },
    })

    return items
  }, [menuCardId, state.data.cards, state.currentView, handleRemoveFromCategory])

  // ── Card editing (S11) ──

  const editingCard = useMemo(() => {
    if (!editingCardId) return null
    return state.data.cards.find(c => c.id === editingCardId) ?? null
  }, [editingCardId, state.data.cards])

  const editInitialData = useMemo<CardFormData | null>(() => {
    if (!editingCard) return null
    return {
      name: editingCard.name,
      note: editingCard.note ?? '',
      categoryIds: editingCard.categoryIds,
    }
  }, [editingCard])

  const handleEditSave = useCallback(
    async (data: CardFormData) => {
      if (!editingCardId) return
      await updateCard(editingCardId, {
        name: data.name,
        note: data.note || null,
        categoryIds: data.categoryIds,
      })
      setEditingCardId(null)
    },
    [editingCardId, updateCard]
  )

  const handleEditClose = useCallback(
    (hasChanges: boolean) => {
      if (hasChanges) {
        setPendingDiscard(true)
      } else {
        setEditingCardId(null)
      }
    },
    []
  )

  // ── Card delete (S14) ──

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCardId) return
    await deleteCard(deletingCardId)
    setDeletingCardId(null)
  }, [deletingCardId, deleteCard])

  const handleDeleteCancel = useCallback(() => {
    setDeletingCardId(null)
  }, [])

  // ── Discard changes (S15) ──

  const handleDiscardConfirm = useCallback(() => {
    setEditingCardId(null)
    setPendingDiscard(false)
  }, [])

  const handleDiscardCancel = useCallback(() => {
    setPendingDiscard(false)
  }, [])

  // ── Open file handler ──

  const handleOpenFile = useCallback(
    async (cardId: string) => {
      const card = state.data.cards.find(c => c.id === cardId)
      if (!card) return
      try {
        const result = await window.electronAPI.openFile(card.fileReference.absolutePath)
        if (result.error) {
          console.error('Failed to open file:', result.error)
        }
      } catch {
        console.error('Unexpected error opening file')
      }
    },
    [state.data.cards]
  )

  // ── Category editor handlers ──

  const handleCreateCategory = useCallback(() => {
    setCategoryEditorState({ mode: 'create' })
  }, [])

  const handleRenameCategory = useCallback(
    (categoryId: string, currentName: string) => {
      setCategoryEditorState({
        mode: 'rename',
        categoryId,
        initialName: currentName,
      })
    },
    []
  )

  const handleCategoryEditorSave = useCallback(
    async (name: string) => {
      if (!categoryEditorState) return
      if (categoryEditorState.mode === 'create') {
        await addCategory(name)
      } else if (
        categoryEditorState.mode === 'rename' &&
        categoryEditorState.categoryId
      ) {
        await renameCategory(categoryEditorState.categoryId, name)
      }
      setCategoryEditorState(null)
    },
    [categoryEditorState, addCategory, renameCategory]
  )

  const handleCategoryEditorClose = useCallback(() => {
    setCategoryEditorState(null)
  }, [])

  // ── Category reorder handlers (S09) ──

  const handleReorderCategoriesStart = useCallback(() => {
    setCategoryReorderInit(
      categories.map(c => ({ id: c.id, name: c.name }))
    )
    setIsCategoryReorderMode(true)
  }, [categories])

  // useSort inside ReorderControl manages internal order and calls onReorder (debounced).
  const handleCategoryReorderDone = useCallback(() => {
    setIsCategoryReorderMode(false)
  }, [])

  const handleCategoryReorderCancel = useCallback(() => {
    setIsCategoryReorderMode(false)
  }, [])

  // ── Card reorder handlers (S08) ──

  const handleCardReorderStart = useCallback(() => {
    setCardReorderInit(
      visibleCards.map(c => ({ id: c.id, name: c.name }))
    )
    setIsCardReorderMode(true)
  }, [visibleCards])

  // Debounced persistence callback for useSort — fires 500ms after the last user action.
  const handleCardReorderPersist = useCallback(
    (ids: string[]) => {
      dispatch({ type: 'REORDER_CARDS', viewType: state.currentView, cardIds: ids })
      try {
        const current = state.data
        const updatedData = {
          ...current,
          viewOrders: current.viewOrders.map(vo =>
            vo.viewType === state.currentView ? { ...vo, cardIds: ids } : vo
          ),
        }
        window.electronAPI.saveAppData(updatedData).catch(() => {})
      } catch {
        // Persist failure — state already updated in memory
      }
    },
    [dispatch, state.currentView, state.data]
  )

  const handleCardReorderDone = useCallback(() => {
    setIsCardReorderMode(false)
  }, [])

  const handleCardReorderCancel = useCallback(() => {
    setIsCardReorderMode(false)
  }, [])

  // ── Focus retry button on error for initial focus ──

  useEffect(() => {
    if (loadingState === 'error' && retryRef.current) {
      retryRef.current.focus()
    }
  }, [loadingState])

  // ── Loading state ──
  // Shell skeleton with non-interactive loading indicator.

  if (loadingState === 'loading') {
    return (
      <div className="qc-app-shell">
        <aside className="qc-app-shell__sidebar" aria-label="分类导航">
          <div className="qc-app-shell__nav-item qc-app-shell__nav-item--active">
            全部卡片
          </div>
        </aside>
        <main className="qc-app-shell__main" aria-label="加载中">
          <div className="qc-app-shell__loading">
            <p className="qc-app-shell__loading-text">正在加载本地数据...</p>
          </div>
        </main>
      </div>
    )
  }

  // ── Error state ──
  // Blocking feedback with retry (initial focus) and quit actions.

  if (loadingState === 'error') {
    return (
      <div className="qc-app-shell">
        <aside className="qc-app-shell__sidebar" aria-label="分类导航">
          <div className="qc-app-shell__nav-item qc-app-shell__nav-item--active">
            全部卡片
          </div>
        </aside>
        <main className="qc-app-shell__main">
          <div className="qc-app-shell__error" role="alert">
            <h2 className="qc-app-shell__error-title">无法加载本地数据</h2>
            <p className="qc-app-shell__error-description">
              请检查文件权限后重试
            </p>
            <div className="qc-app-shell__error-actions">
              <button
                ref={retryRef}
                className="qc-app-shell__error-btn qc-app-shell__error-btn--primary"
                onClick={retryLoad}
                type="button"
              >
                重试
              </button>
              <button
                className="qc-app-shell__error-btn qc-app-shell__error-btn--secondary"
                onClick={quitApp}
                type="button"
              >
                退出
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Ready state ──
  // Full app UI: sidebar + view-header + toolbar + card grid or reorder or empty-state.

  const hasCards = visibleCards.length > 0

  return (
    <div className="qc-app-shell">
      <aside className="qc-app-shell__sidebar" aria-label="分类导航">
        {isCategoryReorderMode ? (
          <div className="qc-app-shell__sidebar-reorder">
            <div className="qc-app-shell__sidebar-reorder-header">
              <h2 className="qc-app-shell__sidebar-reorder-title">整理类别</h2>
              <button
                type="button"
                className="qc-app-shell__sidebar-reorder-done-btn"
                onClick={handleCategoryReorderDone}
              >
                完成
              </button>
            </div>
            <button
              type="button"
              className="qc-app-shell__sidebar-reorder-cancel-btn"
              onClick={handleCategoryReorderCancel}
            >
              取消
            </button>
            <ReorderControl
              items={categoryReorderInit}
              onReorder={reorderCategories}
              itemType="category"
            />
          </div>
        ) : (
          <CategoryNav
            views={categoryNavViews}
            currentViewId={state.currentView}
            onSwitchView={handleSwitchView}
            onCreateCategory={handleCreateCategory}
            onReorderCategories={handleReorderCategoriesStart}
            onRenameCategory={handleRenameCategory}
          />
        )}
      </aside>

      <main className="qc-app-shell__main" aria-labelledby="view-header-title">
        <ViewHeader
          title={viewTitle}
          cardCount={visibleCards.length}
          showSortInfo={isCardReorderMode}
        />

        <GlobalSearch />

        <div className="qc-app-shell__toolbar">
          {isCardReorderMode ? (
            <>
              <ToolbarButton
                label="完成"
                variant="primary"
                onClick={handleCardReorderDone}
              />
              <ToolbarButton
                label="取消"
                variant="secondary"
                onClick={handleCardReorderCancel}
              />
            </>
          ) : (
            <>
              <ToolbarButton
                label="选择文件"
                variant="primary"
                onClick={handleSelectFile}
              />
              {hasCards && (
                <ToolbarButton
                  label="整理排序"
                  variant="secondary"
                  onClick={handleCardReorderStart}
                />
              )}
            </>
          )}
        </div>

        {isCardReorderMode ? (
          <div className="qc-app-shell__reorder-area">
            <ReorderControl
              items={cardReorderInit}
              onReorder={handleCardReorderPersist}
              itemType="card"
            />
          </div>
        ) : hasCards ? (
          <div className="qc-app-shell__grid">
            {visibleCards.map((card, index) => (
              <FileCard
                key={card.id}
                card={card}
                index={index}
                total={visibleCards.length}
                viewType={state.currentView}
                onOpenFile={handleOpenFile}
                onShowMenu={handleShowMenu}
                isReorderMode={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="first-launch"
            primaryAction={{ label: '选择文件', onClick: handleSelectFile }}
          />
        )}
      </main>

      {/* ── Dialogs and overlays ── */}

      {showFormDialog && pendingFileResult && (
        <CardFormDialog
          mode="create"
          initialData={null}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {menuCardId && menuAnchor && (
        <ActionMenu
          items={menuItems}
          anchor={menuAnchor}
          onClose={handleCloseMenu}
        />
      )}

      {editingCardId && editInitialData && (
        <CardFormDialog
          mode="edit"
          initialData={editInitialData}
          filePath={editingCard?.fileReference.absolutePath}
          onSave={handleEditSave}
          onClose={handleEditClose}
        />
      )}

      {pendingDiscard && (
        <ConfirmationDialog
          variant="discard-changes"
          data={{}}
          onConfirm={handleDiscardConfirm}
          onCancel={handleDiscardCancel}
        />
      )}

      {deletingCardId !== null && (
        <ConfirmationDialog
          variant="delete-card"
          data={{}}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {categoryEditorState && (
        <CategoryEditorPopover
          mode={categoryEditorState.mode}
          initialName={categoryEditorState.initialName}
          existingNames={existingNamesForEditor}
          onSave={handleCategoryEditorSave}
          onClose={handleCategoryEditorClose}
          open
        />
      )}
    </div>
  )
}
