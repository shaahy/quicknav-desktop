import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { ReorderItem } from '@shared/types'

// ── Public API ──

export interface UseSortReturn {
  /** Items sorted by current local order (immediate UI state). */
  orderedItems: ReorderItem[]
  /** Move item at the given index one position up (no-op if already first). */
  moveUp: (index: number) => void
  /** Move item at the given index one position down (no-op if already last). */
  moveDown: (index: number) => void
  /** Move item from `fromIndex` to `toIndex` (for drag-and-drop). */
  moveTo: (fromIndex: number, toIndex: number) => void
}

// ── Hook ──

/**
 * View-specific reorder hook with immediate UI update + debounced persistence.
 *
 * - Maintains a local ordering that updates **instantly** on user action so the
 *   next animation frame (<16 ms) reflects the change.
 * - Debounces the `onReorder` callback by 500 ms so the persistence layer
 *   (disk write / IPC / state update) is not called on every single move.
 * - Automatically merges external mutations (add / delete items) into the local
 *   order without disrupting the user's current drag sequence.
 *
 * @param items    The current list of reorderable items (source of truth).
 * @param onReorder  Called with the new ID array **after** the 500 ms debounce
 *                   settles.  The caller should persist this order.
 *
 * @example
 * ```tsx
 * const { orderedItems, moveUp, moveDown, moveTo } = useSort(
 *   categories,
 *   (newOrder) => dispatch({ type: 'REORDER_CATEGORIES', categoryIds: newOrder })
 * )
 * ```
 */
export function useSort(
  items: ReorderItem[],
  onReorder: (newOrder: string[]) => void
): UseSortReturn {
  // ── Local order state (immediate UI) ──

  const [order, setOrder] = useState<string[]>(() => items.map(i => i.id))

  // ── Refs ──

  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  // ── Sync external changes ──
  //
  // When items are added or removed externally (e.g., bulk load, delete), merge
  // the changes into the local order: remove vanished IDs, append new ones at
  // the end.  Local reorder positions are preserved.

  useEffect(() => {
    setOrder(prev => {
      const validIds = new Set(items.map(i => i.id))

      // Drop items that no longer exist
      const filtered = prev.filter(id => validIds.has(id))

      // Append items we haven't seen yet
      const existing = new Set(filtered)
      const result = [...filtered]
      for (const item of items) {
        if (!existing.has(item.id)) {
          result.push(item.id)
        }
      }

      // Bail out if the result is identical (avoids unnecessary re-render)
      if (result.length === prev.length && result.every((id, i) => id === prev[i])) {
        return prev
      }
      return result
    })
  }, [items])

  // ── Debounced save ──

  const scheduleSave = useCallback((newOrder: string[]) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onReorderRef.current(newOrder)
    }, 500)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Move actions ──

  const moveUp = useCallback(
    (index: number) => {
      setOrder(prev => {
        if (index <= 0 || index >= prev.length) return prev
        const next = [...prev]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const moveDown = useCallback(
    (index: number) => {
      setOrder(prev => {
        if (index < 0 || index >= prev.length - 1) return prev
        const next = [...prev]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const moveTo = useCallback(
    (fromIndex: number, toIndex: number) => {
      setOrder(prev => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length
        ) {
          return prev
        }
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  // ── Derived ordered items ──

  const orderedItems = useMemo<ReorderItem[]>(() => {
    const orderIdx = new Map(order.map((id, i) => [id, i]))
    return [...items].sort(
      (a, b) => (orderIdx.get(a.id) ?? Infinity) - (orderIdx.get(b.id) ?? Infinity)
    )
  }, [items, order])

  return { orderedItems, moveUp, moveDown, moveTo }
}
