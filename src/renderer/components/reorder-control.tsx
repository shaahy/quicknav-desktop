import React, { useRef, useState, useCallback } from 'react'
import { useSort } from '../hooks/useSort'
import type { ReorderItem } from '@shared/types'
import '../styles/components/reorder-control.css'

// ── Props ──

interface ReorderControlProps {
  /** Ordered list of items to display and reorder. */
  items: ReorderItem[]
  /**
   * Called with the new ID order after the debounce settles (500 ms).
   * UI updates immediately on user action; this callback is for persistence.
   */
  onReorder: (newOrder: string[]) => void
  /** Affects the aria-label on the listbox and announcement messages. */
  itemType: 'card' | 'category'
}

// ── Labels ──

const ITEM_TYPE_LABELS: Record<ReorderControlProps['itemType'], string> = {
  card: '卡片',
  category: '分类',
}

const ITEM_TYPE_SINGULAR: Record<ReorderControlProps['itemType'], string> = {
  card: '卡片',
  category: '分类',
}

// ── Component ──

/**
 * Reorderable list control with drag handle and up/down buttons.
 *
 * - **Immediate visual feedback**: UI updates on the next animation frame
 *   (<16 ms) — no async wait.
 * - **Debounced persistence**: `onReorder` is called after a 500 ms quiet
 *   period so the save layer isn't hit on every single move.
 * - **ARIA**: `role="listbox"` / `role="option"` with `aria-posinset` /
 *   `aria-setsize`; polite live-region announcements on each move.
 * - **Disabled states**: up button is disabled on the first item, down button
 *   on the last item (styled with `--color-text-disabled`).
 *
 * @example
 * ```tsx
 * <ReorderControl
 *   items={categories.map(c => ({ id: c.id, name: c.name }))}
 *   onReorder={(ids) => reorderCategories(ids)}
 *   itemType="category"
 * />
 * ```
 */
export function ReorderControl({
  items,
  onReorder,
  itemType,
}: ReorderControlProps) {
  const { orderedItems, moveUp, moveDown, moveTo } = useSort(items, onReorder)

  // ── Refs ──

  const liveRef = useRef<HTMLDivElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  // ── Drag-over visual indicator ──

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // ── ARIA live-region announcement ──
  //
  // Uses a two-step clear-and-set pattern to force screen readers to detect
  // the change even when the new text matches the previous announcement text.

  const announce = useCallback((message: string) => {
    const el = liveRef.current
    if (!el) return
    el.textContent = ''
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }, [])

  // ── Up button handler ──

  const handleMoveUp = useCallback(
    (index: number) => {
      const item = orderedItems[index]
      if (!item) return
      moveUp(index)
      // After moveUp, the item lands at position `index` (1-based)
      announce(`${item.name}, 位置 ${index}/${orderedItems.length}`)
    },
    [orderedItems, moveUp, announce]
  )

  // ── Down button handler ──

  const handleMoveDown = useCallback(
    (index: number) => {
      const item = orderedItems[index]
      if (!item) return
      moveDown(index)
      // After moveDown, the item lands at position `index + 2` (1-based)
      announce(`${item.name}, 位置 ${index + 2}/${orderedItems.length}`)
    },
    [orderedItems, moveDown, announce]
  )

  // ── Drag-and-drop handlers ──

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      dragIndexRef.current = index
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index))
    },
    []
  )

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      // Ignore drag events that didn't originate from within this list
      if (dragIndexRef.current === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    },
    []
  )

  const handleDrop = useCallback(
    (targetIndex: number) => (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverIndex(null)

      const fromIndex = dragIndexRef.current
      if (fromIndex === null || fromIndex === targetIndex) {
        dragIndexRef.current = null
        return
      }

      moveTo(fromIndex, targetIndex)

      const item = orderedItems[fromIndex]
      if (item) {
        announce(`${item.name}, 位置 ${targetIndex + 1}/${orderedItems.length}`)
      }

      dragIndexRef.current = null
    },
    [orderedItems, moveTo, announce]
  )

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }, [])

  // ── Derived values ──

  const total = orderedItems.length
  const label = ITEM_TYPE_LABELS[itemType]

  // ── Render ──

  if (total === 0) {
    return (
      <div className="qc-reorder-control qc-reorder-control--empty">
        暂无内容
      </div>
    )
  }

  return (
    <div
      className="qc-reorder-control"
      role="listbox"
      aria-label={`重新排序${label}`}
    >
      {/* Visually hidden ARIA live region for polite announcements */}
      <div
        ref={liveRef}
        className="qc-reorder-control__live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {orderedItems.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === total - 1

        return (
          <div
            key={item.id}
            className={
              'qc-reorder-control__item' +
              (dragOverIndex === index ? ' qc-reorder-control__item--drag-over' : '')
            }
            role="option"
            aria-posinset={index + 1}
            aria-setsize={total}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <span
              className="qc-reorder-control__drag-handle"
              draggable
              onDragStart={handleDragStart(index)}
              aria-hidden="true"
              tabIndex={-1}
            >
              ⠿
            </span>

            {/* Item name */}
            <span className="qc-reorder-control__name">{item.name}</span>

            {/* Move up button */}
            <button
              className="qc-reorder-control__btn"
              type="button"
              aria-label={`上移 ${item.name}`}
              disabled={isFirst}
              title={
                isFirst
                  ? `已是第一个${ITEM_TYPE_SINGULAR[itemType]}`
                  : undefined
              }
              onClick={() => handleMoveUp(index)}
            >
              上
            </button>

            {/* Move down button */}
            <button
              className="qc-reorder-control__btn"
              type="button"
              aria-label={`下移 ${item.name}`}
              disabled={isLast}
              title={
                isLast
                  ? `已是最后一个${ITEM_TYPE_SINGULAR[itemType]}`
                  : undefined
              }
              onClick={() => handleMoveDown(index)}
            >
              下
            </button>
          </div>
        )
      })}
    </div>
  )
}
