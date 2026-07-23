import { useState, useRef, useCallback, useEffect } from 'react'
import type { ReorderItem } from '@shared/types'
import { SAVE_DEBOUNCE_MS } from '@shared/constants'

// ── Public API ──

export interface UseSortReturn {
  /** Immediately updated cardIds in display order. */
  localOrder: string[]
  /** Update localOrder instantly. */
  setOrder: (newOrder: string[]) => void
  /**
   * Debounced (500ms) save callback.
   * Call this after setOrder to persist the current order.
   */
  commitOrder: () => void
  /** Whether the user is currently in reorder mode. */
  isReorderMode: boolean
  /** Enter reorder mode. */
  enterReorderMode: () => void
  /** Exit reorder mode (also commits the current order). */
  exitReorderMode: () => void
}

// ── Hook ──

/**
 * View-specific reorder hook with immediate UI update + debounced persistence.
 *
 * - `localOrder` updates **instantly** on `setOrder` so the next animation frame
 *   (<16 ms) reflects the change.
 * - `commitOrder` debounces the `onReorder` callback by 500 ms so the persistence
 *   layer (disk write / IPC / state update) is not called on every single move.
 * - Automatically merges external mutations (add / delete items) into the local
 *   order without disrupting the user's current drag sequence.
 * - `enterReorderMode` / `exitReorderMode` manage a reorder-mode flag;
 *   `exitReorderMode` also calls `commitOrder` to persist on exit.
 *
 * @param items      The current list of reorderable items (source of truth).
 * @param onReorder  Called with the new ID array **after** the 500 ms debounce
 *                   settles.  The caller should persist this order.
 */
export function useSort(
  items: ReorderItem[],
  onReorder: (newOrder: string[]) => void
): UseSortReturn {
  // ── State ──

  const [localOrder, setLocalOrder] = useState<string[]>(() => items.map(i => i.id))
  const [isReorderMode, setIsReorderMode] = useState(false)

  // ── Refs ──
  //
  // `localOrderRef` is updated on every render so `commitOrder` can always
  // capture the latest value when its timer fires, regardless of closure age.

  const localOrderRef = useRef(localOrder)
  localOrderRef.current = localOrder

  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // ── Public setters ──

  const setOrder = useCallback((newOrder: string[]) => {
    localOrderRef.current = newOrder
    setLocalOrder(newOrder)
  }, [])

  const commitOrder = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onReorderRef.current(localOrderRef.current)
    }, SAVE_DEBOUNCE_MS)
  }, [])

  const enterReorderMode = useCallback(() => {
    setIsReorderMode(true)
  }, [])

  const exitReorderMode = useCallback(() => {
    setIsReorderMode(false)
    commitOrder()
  }, [commitOrder])

  // ── Sync external changes ──
  //
  // When items are added or removed externally (e.g., bulk load, delete), merge
  // the changes into the local order: remove vanished IDs, append new ones at
  // the end.  Local reorder positions are preserved.

  useEffect(() => {
    setLocalOrder(prev => {
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

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { localOrder, setOrder, commitOrder, isReorderMode, enterReorderMode, exitReorderMode }
}
