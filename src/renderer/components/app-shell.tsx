import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { FileSelectionResult, CardFormData, MenuItem, ReorderItem, ViewType } from '@shared/types'
import { VIEW_ALL_CARDS, VIEW_UNCATEGORIZED } from '@shared/constants'
import { normalizePath } from '@shared/validation'
import { useAppState, useAppDispatch } from '../contexts/AppState'
import { useCards } from '../hooks/useCards'
import { useCategories } from '../hooks/useCategories'
import { useSearch } from '../hooks/useSearch'
import { useFileRepair } from '../hooks/useFileRepair'
import { CategoryNav } from './category-nav'
import type { CategoryNavView } from './category-nav'
import { ToolbarButton } from './toolbar-button'
import { FileCard } from './file-card'
import { EmptyState } from './empty-state'
import { CardFormDialog } from './card-form-dialog'
import { ActionMenu } from './action-menu'
import { ConfirmationDialog } from './confirmation-dialog'
import { ReorderControl } from './reorder-control'
import { CategoryEditorPopover } from './category-editor-popover'
import { GlobalSearch } from './global-search'
import { ErrorDialog } from './error-dialog'
import { DuplicateDialog } from './duplicate-dialog'
import { StatusBar } from './status-bar'
import '../styles/components/app-shell.css'

export interface AppShellProps {
  /** Determines which top-level state the shell renders. */
  loadingState: 'loading' | 'ready' | 'error'
  /** Called when the user clicks the retry button in error state. */
  retryLoad: () => void
  /** Called when the user clicks the quit button in error state. */
  quitApp: () => void
  /** Load error type (shown in error state). */
  loadError?: string | null
  /** Called when user chooses to rebuild corrupted data (shown after retry). */
  rebuildData?: () => void
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
export function AppShell({ loadingState, retryLoad, quitApp, loadError, rebuildData }: AppShellProps) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const { visibleCards, addCard, updateCard, deleteCard, findDuplicateByPath } = useCards()
  const {
    categories,
    addCategory,
    renameCategory,
    reorderCategories,
  } = useCategories()
  const search = useSearch()
  const {
    repairFile,
    getFailureCount,
    incrementFailure,
    resetFailureCount,
  } = useFileRepair()

  const retryRef = useRef<HTMLButtonElement>(null)

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
  const [pendingInitialName, setPendingInitialName] = useState<string | null>(null)
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

  // ── Existing card names for name-uniqueness validation (FR-006) ──

  const existingCardNames = useMemo<string[]>(
    () => state.data.cards.map(c => c.name),
    [state.data.cards]
  )

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

  // ── Error dialog state (US4: S16 open-failed / S17 locate-failed) ──

  const [errorDialogState, setErrorDialogState] = useState<{
    variant: 'open-failed' | 'locate-failed'
    cardId: string
    cardName: string
    showWarning?: boolean
  } | null>(null)

  // ── Duplicate dialog state ──

  const [duplicateDialogState, setDuplicateDialogState] = useState<{
    existingCardId: string
    existingCardName: string
    /** Set when the duplicate follows a pendingFileResult in the add flow. */
    pendingFileResult?: FileSelectionResult
    /** Set when the duplicate follows a repair attempt. */
    sourceCardId?: string
  } | null>(null)

  // ── Status bar state ──

  const [statusBarState, setStatusBarState] = useState<{
    message: string
    visible: boolean
    /** Unique key to force re-render when showing the same message. */
    messageKey?: number
  }>({ message: '', visible: false })
  const statusBarCountRef = useRef(0)

  /**
   * Show a transient status bar message. Successive calls replace the previous
   * message and restart the auto-dismiss timer.
   */
  const showStatusBar = useCallback((message: string) => {
    statusBarCountRef.current += 1
    setStatusBarState({ message, visible: true, messageKey: statusBarCountRef.current })
  }, [])

  const dismissStatusBar = useCallback(() => {
    setStatusBarState(prev => ({ ...prev, visible: false }))
  }, [])

  // ── Handlers ──

  const handleSelectFile = useCallback(async () => {
    const result = await window.electronAPI.selectFile()
    if (result.canceled || !result.file) return

    // FR-003/FR-004: prefill card name from HTML title or filename
    let initialName: string
    if (result.file.isHtml) {
      try {
        const title = await window.electronAPI.readHtmlTitle(result.file.absolutePath)
        initialName = title || result.file.fileName
      } catch {
        initialName = result.file.fileName
      }
    } else {
      initialName = result.file.fileName
    }

    setPendingInitialName(initialName)
    setPendingFileResult(result)
  }, [])

  const handleFormSave = useCallback(
    async (data: CardFormData) => {
      if (!pendingFileResult) return
      if (!pendingFileResult.file) return

      const card = await addCard(pendingFileResult, data.name, data.categoryIds)
      if (card) {
        // Success — close form, show status
        setPendingFileResult(null)
        showStatusBar('已保存')
      } else {
        // Duplicate detected — find the existing card
        const platform = window.electronAPI.getPlatform()
        const normalized = normalizePath(pendingFileResult.file.absolutePath, platform)
        const duplicate = findDuplicateByPath(normalized)
        if (duplicate) {
          setPendingFileResult(null)
          setDuplicateDialogState({
            existingCardId: duplicate.id,
            existingCardName: duplicate.name,
          })
        } else {
          // Unexpected — just close the form
          setPendingFileResult(null)
        }
      }
    },
    [pendingFileResult, addCard, findDuplicateByPath, showStatusBar]
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
      showStatusBar('已移出当前类别')
    },
    [state.currentView, state.data.cards, updateCard, showStatusBar]
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
              .then((locateResult) => {
                if (locateResult && locateResult.error) {
                  const count = incrementFailure(menuCardId)
                  setErrorDialogState({
                    variant: 'locate-failed',
                    cardId: menuCardId,
                    cardName: card.name,
                    showWarning: count >= 3,
                  })
                } else {
                  resetFailureCount(menuCardId)
                }
              })
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
  }, [menuCardId, state.data.cards, state.currentView, handleRemoveFromCategory, incrementFailure, resetFailureCount])

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
      showStatusBar('已保存')
    },
    [editingCardId, updateCard, showStatusBar]
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
    showStatusBar('已保存')
  }, [deletingCardId, deleteCard, showStatusBar])

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

  // ── Open file handler (US4: S16 error handling + cumulative failure) ──

  const handleOpenFile = useCallback(
    async (cardId: string) => {
      const card = state.data.cards.find(c => c.id === cardId)
      if (!card) return
      try {
        console.log('[handleOpenFile] opening:', card.fileReference.absolutePath)
        const result = await window.electronAPI.openFile(card.fileReference.absolutePath)
        console.log('[handleOpenFile] result:', JSON.stringify(result))
        if (result && result.error) {
          const count = incrementFailure(cardId)
          setErrorDialogState({
            variant: 'open-failed',
            cardId,
            cardName: card.name,
            showWarning: count >= 3,
          })
        } else {
          resetFailureCount(cardId)
        }
      } catch (e) {
        console.error('[handleOpenFile] exception:', e)
        incrementFailure(cardId)
        setErrorDialogState({
          variant: 'open-failed',
          cardId,
          cardName: card.name,
        })
      }
    },
    [state.data.cards, incrementFailure, resetFailureCount]
  )

  // ── Error dialog handlers ──

  const handleErrorReSelect = useCallback(
    async (cardId: string) => {
      // Close the error dialog and start repair flow
      setErrorDialogState(null)
      const repairResult = await repairFile(cardId)
      if (repairResult.result === 'success') {
        showStatusBar('已重新关联')
      } else if (repairResult.result === 'duplicate') {
        setDuplicateDialogState({
          existingCardId: repairResult.duplicateCardId!,
          existingCardName: repairResult.duplicateCardName!,
          sourceCardId: cardId,
        })
      }
      // 'canceled' — no action needed
    },
    [repairFile, showStatusBar]
  )

  const handleErrorDelete = useCallback(
    (cardId: string) => {
      // Close the error dialog and route through S14 confirmation dialog (FR-010)
      setErrorDialogState(null)
      setDeletingCardId(cardId)
    },
    []
  )

  const handleErrorClose = useCallback(() => {
    // Show cumulative-failure warning on dismiss if threshold reached
    if (errorDialogState?.showWarning) {
      showStatusBar('文件可能已移动，建议重新关联')
    }
    setErrorDialogState(null)
  }, [errorDialogState, showStatusBar])

  // ── Duplicate dialog handlers ──

  const handleDuplicateViewCard = useCallback(
    (existingCardId: string) => {
      setDuplicateDialogState(null)
      // Dispatch a view switch to show the existing card
      // Switch to allCards view where all cards are visible
      search.setSearchQuery('')
      dispatch({ type: 'SET_CURRENT_VIEW', viewType: VIEW_ALL_CARDS as ViewType })
    },
    [dispatch, search]
  )

  const handleDuplicateReSelect = useCallback(() => {
    // Close duplicate dialog and start a new file selection
    const dupState = duplicateDialogState
    setDuplicateDialogState(null)
    if (dupState?.sourceCardId) {
      // Repair flow — re-trigger repair
      handleErrorReSelect(dupState.sourceCardId)
    } else {
      // Add flow — start a new file selection
      handleSelectFile()
    }
  }, [duplicateDialogState, handleErrorReSelect, handleSelectFile])

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateDialogState(null)
  }, [])

  // ── Search handlers ──

  const handleClearSearch = useCallback(() => {
    search.setSearchQuery('')
  }, [search])

  // ── Save error handler ──

  const handleSaveErrorRetry = useCallback(() => {
    dispatch({ type: 'SET_SAVE_ERROR', error: null })
  }, [dispatch])

  const handleSaveErrorQuit = useCallback(() => {
    quitApp()
  }, [quitApp])

  const handleSaveErrorClose = useCallback(() => {
    dispatch({ type: 'SET_SAVE_ERROR', error: null })
  }, [dispatch])

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

  // ── Derived booleans ──

  const hasActiveSearch = state.searchQuery.trim().length > 0
  const isCategoryView = state.currentView.startsWith('category:')

  // ── Cards to display ──
  // When search is active, use scored results from useSearch (across ALL cards,
  // by name only, with exact/prefix/contains scoring — FR-023/024/025).
  // When inactive, use the current-view-ordered cards from useCards.
  const displayCards = hasActiveSearch ? search.searchResults : visibleCards

  // ── Card reorder handlers (S08) ──

  const handleCardReorderStart = useCallback(() => {
    setCardReorderInit(
      displayCards.map(c => ({ id: c.id, name: c.name }))
    )
    setIsCardReorderMode(true)
  }, [displayCards])

  // Debounced persistence callback for useSort — fires 500ms after the last user action.
  const handleCardReorderPersist = useCallback(
    async (ids: string[]) => {
      dispatch({ type: 'REORDER_CARDS', viewType: state.currentView, cardIds: ids })
      try {
        const current = state.data
        const updatedData = {
          ...current,
          viewOrders: current.viewOrders.map(vo =>
            vo.viewType === state.currentView ? { ...vo, cardIds: ids } : vo
          ),
        }
        const saveResult = await window.electronAPI.saveAppData(updatedData)
        if (saveResult && saveResult.error) {
          dispatch({ type: 'SET_SAVE_ERROR', error: saveResult.error })
        }
      } catch {
        dispatch({ type: 'SET_SAVE_ERROR', error: 'unknown' })
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

  const showErrorOverlay = loadingState === 'error' && loadError != null


  // ── Ready state ──
  // Full app UI: sidebar + search+toolbar row + card grid or reorder or empty-state.

  const hasCards = displayCards.length > 0

  return (
    <div className="qc-app-shell">
      {/* ── Top bar (full width): search + buttons ── */}
      <header className="qc-app-shell__topbar">
        <GlobalSearch />
        {isCardReorderMode ? (
          <div className="qc-app-shell__toolbar-buttons">
            <ToolbarButton label="完成" variant="primary" onClick={handleCardReorderDone} />
            <ToolbarButton label="取消" variant="secondary" onClick={handleCardReorderCancel} />
          </div>
        ) : (
          <div className="qc-app-shell__toolbar-buttons">
            <ToolbarButton label="新建卡片" variant="primary" onClick={handleSelectFile} />
            {hasCards && (
              <ToolbarButton label="整理排序" variant="secondary" onClick={handleCardReorderStart} />
            )}
          </div>
        )}
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="qc-app-shell__body">
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

        <main className="qc-app-shell__main" aria-label="卡片列表">

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
            {displayCards.map((card, index) => (
              <FileCard
                key={card.id}
                card={card}
                index={index}
                total={displayCards.length}
                viewType={state.currentView}
                onOpenFile={handleOpenFile}
                onShowMenu={handleShowMenu}
                isReorderMode={false}
              />
            ))}
          </div>
        ) : hasActiveSearch ? (
          <EmptyState
            variant="no-results"
            searchQuery={state.searchQuery}
            primaryAction={{ label: '清空搜索', onClick: handleClearSearch }}
          />
        ) : (
          <EmptyState
            variant={isCategoryView ? 'category-empty' : 'first-launch'}
            primaryAction={{ label: '新建卡片', onClick: handleSelectFile }}
          />
        )}

        {/* ── Status bar ── */}
        <StatusBar
          key={statusBarState.messageKey ?? 0}
          message={statusBarState.message}
          visible={statusBarState.visible}
          onDismiss={dismissStatusBar}
        />
        </main>
      </div>
      {/* /qc-app-shell__body */}

      {/* ── Dialogs and overlays ── */}

      {showFormDialog && pendingFileResult && (
        <CardFormDialog
          mode="create"
          initialData={null}
          initialName={pendingInitialName}
          onSave={handleFormSave}
          onClose={handleFormClose}
          existingCardNames={existingCardNames}
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
          existingCardNames={existingCardNames}
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

      {/* ── Error dialog (open-failed / locate-failed) ── */}
      {errorDialogState && (
        <ErrorDialog
          variant={errorDialogState.variant}
          cardName={errorDialogState.cardName}
          onReSelect={() => handleErrorReSelect(errorDialogState.cardId)}
          onDelete={() => handleErrorDelete(errorDialogState.cardId)}
          onClose={handleErrorClose}
        />
      )}

      {/* ── Duplicate dialog ── */}
      {duplicateDialogState && (
        <DuplicateDialog
          existingCardName={duplicateDialogState.existingCardName}
          existingCardId={duplicateDialogState.existingCardId}
          onViewCard={handleDuplicateViewCard}
          onReSelect={handleDuplicateReSelect}
          onCancel={handleDuplicateCancel}
        />
      )}

      {/* ── Save-failed dialog (blocking) ── */}
      {state.saveError && (
        <ErrorDialog
          variant="save-failed"
          cardName=""
          errorDetail={state.saveError}
          onReSelect={handleSaveErrorRetry}
          onDelete={() => dispatch({ type: 'SET_SAVE_ERROR', error: null })}
          onClose={handleSaveErrorClose}
          onRetry={handleSaveErrorRetry}
          onQuit={handleSaveErrorQuit}
        />
      )}
      {/* ── Error overlay ── */}
      {showErrorOverlay && (
        <div className="qc-app-shell__error-overlay" role="alertdialog">
          <div className="qc-app-shell__error">
            <h2 className="qc-app-shell__error-title">无法加载本地数据</h2>
            <p className="qc-app-shell__error-description">
              {loadError === 'corrupted'
                ? '数据文件损坏，无法读取'
                : '请检查文件权限后重试'}
            </p>
            <div className="qc-app-shell__error-actions">
              <button ref={retryRef} type="button" className="qc-app-shell__error-btn qc-app-shell__error-btn--primary" onClick={retryLoad}>重试</button>
              {rebuildData && (
                <button type="button" className="qc-app-shell__error-btn qc-app-shell__error-btn--secondary" onClick={rebuildData}>数据已损坏，需要重新开始</button>
              )}
              <button type="button" className="qc-app-shell__error-btn qc-app-shell__error-btn--secondary" onClick={quitApp}>退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
