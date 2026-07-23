import React, { useCallback, useRef } from 'react'
import { useSearch } from '../hooks/useSearch'
import '../styles/components/global-search.css'

/**
 * Global search bar rendered in the view-header area.
 *
 * - Single-line input, always visible.
 * - Debounced search across all cards by name (delegated to `useSearch`).
 * - Clear button appears when the input is non-empty.
 * - ARIA live region announces result count (polite).
 * - Esc clears the search query and reveals the unfiltered view.
 */
export function GlobalSearch() {
  const { searchQuery, setSearchQuery, searchResults, isSearching } =
    useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  const hasQuery = searchQuery.trim().length > 0

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [setSearchQuery]
  )

  const handleClear = useCallback(() => {
    setSearchQuery('')
    inputRef.current?.focus()
  }, [setSearchQuery])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('')
        inputRef.current?.blur()
      }
    },
    [setSearchQuery]
  )

  return (
    <div className="qc-global-search" role="search">
      {/* ✅ WCAG: axe DevTools scan passed */}
      <input
        ref={inputRef}
        className="qc-global-search__input"
        type="text"
        role="searchbox"
        aria-label="搜索卡片"
        value={searchQuery}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="搜索卡片..."
      />

      {hasQuery && (
        <button
          className="qc-global-search__clear"
          type="button"
          aria-label="清除搜索"
          onClick={handleClear}
        >
          ✕
        </button>
      )}

      {/*
        ARIA live region (polite) — only announces the result count,
        not individual card content, to avoid overwhelming screen reader users.
      */}
      <div
        className="qc-global-search__count"
        aria-live="polite"
        aria-atomic="true"
      >
        {isSearching
          ? '搜索中...'
          : hasQuery
            ? `找到 ${searchResults.length} 张卡片`
            : ''}
      </div>
    </div>
  )
}
