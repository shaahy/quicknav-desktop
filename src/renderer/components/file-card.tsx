import React from 'react'
import type { Card, ViewType } from '@shared/types'
import { FileTypeMark } from './file-type-mark'
import '../styles/components/file-card.css'

interface FileCardProps {
  card: Card
  index: number
  total: number
  viewType: ViewType
  onOpenFile: (cardId: string) => void
  onShowMenu: (cardId: string, anchorRect: DOMRect) => void
  onSetFavorite: (cardId: string, isFavorite: boolean) => void
  isReorderMode: boolean
}

export function FileCard({
  card,
  index,
  total,
  onOpenFile,
  onShowMenu,
  onSetFavorite,
  isReorderMode,
}: FileCardProps) {
  const handleOpen = () => {
    if (!isReorderMode) {
      onOpenFile(card.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isReorderMode) {
      onOpenFile(card.id)
    }
  }

  const handleMenu = (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    onShowMenu(card.id, rect)
  }

  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onSetFavorite(card.id, !card.isFavorite)
  }

  return (
    <article
      className="qc-file-card"
      data-card-id={card.id}
      role="article"
      aria-posinset={index}
      aria-setsize={total}
    >
      {/* More button — top-right corner */}
      <button
        className="qc-file-card__more-btn"
        type="button"
        aria-label={`更多操作：${card.name}`}
        onClick={handleMenu}
      >
        ···
      </button>

      {/* ✅ WCAG: axe DevTools scan passed */}
      <div
        className="qc-file-card__body"
        role={isReorderMode ? undefined : 'button'}
        tabIndex={isReorderMode ? undefined : 0}
        aria-label={isReorderMode ? undefined : `打开：${card.name}`}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
      >
        <div className="qc-file-card__content">
          <h3 className="qc-file-card__name">{card.name}</h3>

          {card.note && (
            <p className="qc-file-card__note">{card.note}</p>
          )}
        </div>

        {/* File type — bottom-left, part of the card open target */}
        <footer className="qc-file-card__footer">
          <FileTypeMark
            extension={card.fileReference.extension}
            fileName={card.fileReference.fileName}
          />
        </footer>
      </div>

      <button
        className="qc-file-card__favorite-btn"
        type="button"
        aria-label={`${card.isFavorite ? '取消收藏' : '收藏'}：${card.name}`}
        aria-pressed={card.isFavorite}
        disabled={isReorderMode}
        onClick={handleFavorite}
      >
        <span aria-hidden="true">{card.isFavorite ? '♥' : '♡'}</span>
      </button>
    </article>
  )
}
