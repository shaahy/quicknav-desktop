import '../styles/components/view-header.css'

export interface ViewHeaderProps {
  /** Current view title displayed as a heading. */
  title: string
  /** Number of cards in the current view, shown when showSortInfo is false. */
  cardCount: number
  /** When true, show sorting helper text instead of card count. */
  showSortInfo: boolean
}

/**
 * Banner header for the current card view.
 * The title element carries id="view-header-title" for use as
 * `aria-labelledby` on the main content area.
 */
export function ViewHeader({ title, cardCount, showSortInfo }: ViewHeaderProps) {
  const subtitle = showSortInfo ? '拖拽调整排序' : `共 ${cardCount} 张卡片`

  return (
    <header className="qc-view-header" role="banner">
      <h1 className="qc-view-header__title" id="view-header-title">
        {title}
      </h1>
      <span className="qc-view-header__subtitle" aria-live="polite">
        {subtitle}
      </span>
    </header>
  )
}
