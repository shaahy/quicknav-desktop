import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { FileSelectionResult, CardFormData } from '@shared/types'
import { VIEW_ALL_CARDS, VIEW_UNCATEGORIZED } from '@shared/constants'
import { useAppState } from '../contexts/AppState'
import { useCards } from '../hooks/useCards'
import { ViewHeader } from './view-header'
import { ToolbarButton } from './toolbar-button'
import { FileCard } from './file-card'
import { EmptyState } from './empty-state'
import { CardFormDialog } from './card-form-dialog'
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
  const { visibleCards, addCard } = useCards()

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

  // ── Card form dialog state (S10: file-selection flow) ──

  const [pendingFileResult, setPendingFileResult] = useState<FileSelectionResult | null>(null)
  const showFormDialog = pendingFileResult !== null

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

  const handleOpenFile = useCallback(
    async (cardId: string) => {
      const card = state.data.cards.find(c => c.id === cardId)
      if (!card) return
      try {
        const result = await window.electronAPI.openFile(card.fileReference.absolutePath)
        if (result.error) {
          // US4: show error dialog — for now just log
          console.error('Failed to open file:', result.error)
        }
      } catch {
        console.error('Unexpected error opening file')
      }
    },
    [state.data.cards]
  )

  const handleShowMenu = useCallback((_cardId: string) => {
    // Placeholder — card context menu will be implemented in US3
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
  // Full app UI: sidebar + view-header + toolbar + card grid or empty-state.

  const hasCards = visibleCards.length > 0

  return (
    <div className="qc-app-shell">
      <aside className="qc-app-shell__sidebar" aria-label="分类导航">
        <div className="qc-app-shell__nav-item qc-app-shell__nav-item--active">
          全部卡片
        </div>
      </aside>

      <main className="qc-app-shell__main" aria-labelledby="view-header-title">
        <ViewHeader
          title={viewTitle}
          cardCount={visibleCards.length}
          showSortInfo={false}
        />

        <div className="qc-app-shell__toolbar">
          <ToolbarButton
            label="选择文件"
            variant="primary"
            onClick={handleSelectFile}
          />
        </div>

        {hasCards ? (
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

      {showFormDialog && pendingFileResult && (
        <CardFormDialog
          mode="create"
          initialData={null}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
