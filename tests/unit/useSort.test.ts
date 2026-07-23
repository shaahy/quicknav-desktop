// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSort } from '../../src/renderer/hooks/useSort'
import type { ReorderItem } from '../../src/shared/types'
import { SAVE_DEBOUNCE_MS } from '../../src/shared/constants'

// ── Helpers ──

function makeReorderItem(id: string, name?: string): ReorderItem {
  return { id, name: name ?? `Item ${id}` }
}

// ── Tests ──

describe('useSort', () => {
  describe('setOrder', () => {
    it('setOrder updates localOrder immediately (synchronous)', () => {
      const items = [makeReorderItem('a'), makeReorderItem('b'), makeReorderItem('c')]
      const onReorder = vi.fn()

      const { result } = renderHook(() => useSort(items, onReorder))

      expect(result.current.localOrder).toEqual(['a', 'b', 'c'])

      act(() => {
        result.current.setOrder(['c', 'a', 'b'])
      })

      expect(result.current.localOrder).toEqual(['c', 'a', 'b'])
    })
  })

  describe('commitOrder', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('commitOrder is debounced by 500ms', () => {
      const items = [makeReorderItem('a'), makeReorderItem('b')]
      const onReorder = vi.fn()

      const { result } = renderHook(() => useSort(items, onReorder))

      act(() => {
        result.current.setOrder(['b', 'a'])
        result.current.commitOrder()
      })

      // Timer not yet fired
      expect(onReorder).not.toHaveBeenCalled()

      // Advance by less than debounce — still not called
      act(() => {
        vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 100)
      })
      expect(onReorder).not.toHaveBeenCalled()

      // Advance past debounce threshold
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(onReorder).toHaveBeenCalledTimes(1)
      expect(onReorder).toHaveBeenCalledWith(['b', 'a'])
    })

    it('rapid setOrder calls — only last commitOrder fires (debounce resets)', () => {
      const items = [makeReorderItem('a'), makeReorderItem('b'), makeReorderItem('c')]
      const onReorder = vi.fn()

      const { result } = renderHook(() => useSort(items, onReorder))

      act(() => {
        result.current.setOrder(['b', 'a', 'c'])
        result.current.commitOrder()
        result.current.setOrder(['c', 'b', 'a'])
        result.current.commitOrder() // resets debounce timer
      })

      // Only the last order should be committed when timer fires
      act(() => {
        vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
      })

      expect(onReorder).toHaveBeenCalledTimes(1)
      expect(onReorder).toHaveBeenCalledWith(['c', 'b', 'a'])
    })
  })

  describe('reorder mode', () => {
    it('enterReorderMode sets isReorderMode=true', () => {
      const items = [makeReorderItem('a'), makeReorderItem('b')]
      const onReorder = vi.fn()

      const { result } = renderHook(() => useSort(items, onReorder))

      expect(result.current.isReorderMode).toBe(false)

      act(() => {
        result.current.enterReorderMode()
      })

      expect(result.current.isReorderMode).toBe(true)
    })

    it('exitReorderMode sets isReorderMode=false and commits', () => {
      vi.useFakeTimers()
      const items = [makeReorderItem('a'), makeReorderItem('b')]
      const onReorder = vi.fn()

      const { result } = renderHook(() => useSort(items, onReorder))

      act(() => {
        result.current.enterReorderMode()
        result.current.setOrder(['b', 'a'])
        result.current.exitReorderMode()
      })

      // isReorderMode should be false immediately
      expect(result.current.isReorderMode).toBe(false)

      // exitReorderMode should trigger commitOrder (debounced)
      act(() => {
        vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
      })
      expect(onReorder).toHaveBeenCalledWith(['b', 'a'])

      vi.useRealTimers()
    })
  })

  describe('external item changes', () => {
    it('when external items are added, localOrder merges new items at end', () => {
      const initialItems = [makeReorderItem('a'), makeReorderItem('b')]
      const onReorder = vi.fn()

      const { result, rerender } = renderHook(
        ({ items }: { items: ReorderItem[] }) => useSort(items, onReorder),
        { initialProps: { items: initialItems } }
      )

      expect(result.current.localOrder).toEqual(['a', 'b'])

      // Add new item 'c'
      rerender({ items: [...initialItems, makeReorderItem('c')] })

      expect(result.current.localOrder).toEqual(['a', 'b', 'c'])
    })

    it('when external items are removed, localOrder removes them', () => {
      const initialItems = [makeReorderItem('a'), makeReorderItem('b'), makeReorderItem('c')]
      const onReorder = vi.fn()

      const { result, rerender } = renderHook(
        ({ items }: { items: ReorderItem[] }) => useSort(items, onReorder),
        { initialProps: { items: initialItems } }
      )

      // Reorder first
      act(() => {
        result.current.setOrder(['c', 'a', 'b'])
      })
      expect(result.current.localOrder).toEqual(['c', 'a', 'b'])

      // Remove item 'b'
      rerender({ items: [makeReorderItem('a'), makeReorderItem('c')] })

      expect(result.current.localOrder).toEqual(['c', 'a'])
    })
  })
})
