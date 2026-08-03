import React from 'react'
import '../styles/components/empty-state.css'

interface EmptyStateProps {
  /**
   * Determines which message + action layout to render.
   * - `first-launch`: App has no cards at all.
   * - `category-empty`: Current category view has no cards.
   * - `no-results`: Search query matched nothing.
   */
  variant: 'first-launch' | 'category-empty' | 'favorites-empty' | 'no-results'
  /** Search query displayed in the 'no-results' description. */
  searchQuery?: string | null
  /** Primary call-to-action (rendered as solid button or clear-search link). */
  primaryAction?: { label: string; onClick: () => void } | null
  /** Secondary action button shown alongside the primary button. */
  secondaryAction?: { label: string; onClick: () => void } | null
}

export function EmptyState({
  variant,
  searchQuery,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const isNoResults = variant === 'no-results'
  const isFavoritesEmpty = variant === 'favorites-empty'

  return (
    <div className="qc-empty-state" role="status">
      <div className="qc-empty-state__content">
        {isNoResults ? (
          <>
            <p className="qc-empty-state__description">
              未找到匹配
              <span className="qc-empty-state__query-text">「{searchQuery ?? ''}」</span>
              的卡片
            </p>
            {primaryAction && (
              <button
                className="qc-empty-state__clear-link"
                onClick={primaryAction.onClick}
                type="button"
              >
                {primaryAction.label}
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="qc-empty-state__title">
              {isFavoritesEmpty ? '还没有收藏卡片' : '添加常用文件'}
            </h2>
            <p className="qc-empty-state__description">
              {isFavoritesEmpty
                ? '点击卡片右下角的桃心，把常用卡片集中到这里。'
                : '应用不会扫描磁盘。'}
            </p>
            <div className="qc-empty-state__actions">
              {primaryAction && (
                <button
                  className="qc-empty-state__action qc-empty-state__action--primary"
                  onClick={primaryAction.onClick}
                  type="button"
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  className="qc-empty-state__action qc-empty-state__action--secondary"
                  onClick={secondaryAction.onClick}
                  type="button"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
