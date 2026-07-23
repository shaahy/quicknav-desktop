// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from '../../src/renderer/hooks/useSearch'
import { SEARCH_DEBOUNCE_MS } from '../../src/shared/constants'
import type { Card } from '../../src/shared/types'

// ── Hoisted mocks ──

const mockState = vi.hoisted(() => ({
  searchQuery: '',
  data: {
    version: 1 as const,
    cards: [] as Card[],
    categories: [] as Array<{ id: string; name: string; order: number; type: 'user'; createdAt: string }>,
    viewOrders: [] as Array<{ viewType: string; cardIds: string[] }>,
  },
  currentView: 'allCards' as string,
  isLoading: false,
  loadError: null as string | null,
  saveError: null as string | null,
}))

const mockDispatch = vi.hoisted(() => vi.fn())

vi.mock('../../src/renderer/contexts/AppState', () => ({
  useAppState: () => ({ state: mockState }),
  useAppDispatch: () => mockDispatch,
}))

// ── Helpers ──

function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    name: 'Test Card',
    note: null,
    fileReference: {
      absolutePath: '/test.txt',
      fileName: 'test',
      extension: 'txt',
      fileSize: 100,
      mtimeMs: 0,
    },
    categoryIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function resetState(): void {
  mockState.searchQuery = ''
  mockState.data = {
    version: 1,
    cards: [],
    categories: [],
    viewOrders: [
      { viewType: 'allCards', cardIds: [] },
      { viewType: 'uncategorized', cardIds: [] },
    ],
  }
  mockState.currentView = 'allCards'
  mockState.isLoading = false
  mockState.loadError = null
  mockState.saveError = null
}

// ── Tests ──

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  // ── Matching & scoring (no debounce concerns) ──

  describe('matching and scoring', () => {
    it('empty query returns all cards as results', () => {
      const cards = [
        makeCard({ id: 'card-a', name: 'Alpha' }),
        makeCard({ id: 'card-b', name: 'Beta' }),
      ]
      mockState.data.cards = cards
      mockState.data.viewOrders[0].cardIds = ['card-a', 'card-b']
      mockState.searchQuery = ''

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(2)
      expect(result.current.searchResults[0].id).toBe('card-a')
      expect(result.current.searchResults[1].id).toBe('card-b')
    })

    it('query matches card name case-insensitively', () => {
      mockState.data.cards = [
        makeCard({ id: 'card-1', name: 'HelloWorld' }),
        makeCard({ id: 'card-2', name: 'Something Else' }),
      ]
      mockState.data.viewOrders[0].cardIds = ['card-1', 'card-2']
      mockState.searchQuery = 'helloworld'

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(1)
      expect(result.current.searchResults[0].id).toBe('card-1')
    })

    it('full name exact match scores highest (first in results)', () => {
      mockState.data.cards = [
        makeCard({ id: 'card-a', name: 'AbcXyz' }),
        makeCard({ id: 'card-b', name: 'Abc' }),
        makeCard({ id: 'card-c', name: 'XAbc' }),
      ]
      mockState.data.viewOrders[0].cardIds = ['card-a', 'card-b', 'card-c']
      mockState.searchQuery = 'Abc'

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(3)
      // Exact match first
      expect(result.current.searchResults[0].id).toBe('card-b')
    })

    it('prefix match scores second (after exact matches)', () => {
      mockState.data.cards = [
        makeCard({ id: 'card-a', name: 'XAbc' }),      // contains
        makeCard({ id: 'card-b', name: 'AbcDef' }),     // prefix
        makeCard({ id: 'card-c', name: 'Abc' }),        // exact
      ]
      mockState.data.viewOrders[0].cardIds = ['card-a', 'card-b', 'card-c']
      mockState.searchQuery = 'Abc'

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(3)
      // exact, prefix, contains
      expect(result.current.searchResults[0].id).toBe('card-c') // exact
      expect(result.current.searchResults[1].id).toBe('card-b') // prefix
      expect(result.current.searchResults[2].id).toBe('card-a') // contains
    })

    it('contains match scores last', () => {
      mockState.data.cards = [
        makeCard({ id: 'card-a', name: 'BBBAAA' }),     // prefix (starts with BBB)
        makeCard({ id: 'card-b', name: 'XBBBCC' }),     // contains only
        makeCard({ id: 'card-c', name: 'YBBBCC' }),     // contains only
      ]
      mockState.data.viewOrders[0].cardIds = ['card-b', 'card-c', 'card-a']
      mockState.searchQuery = 'BBB'

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(3)
      // prefix match first
      expect(result.current.searchResults[0].id).toBe('card-a')
      // then contains matches sorted by view order (card-b before card-c)
      expect(result.current.searchResults[1].id).toBe('card-b')
      expect(result.current.searchResults[2].id).toBe('card-c')
    })

    it('same-tier results sorted by allCards view order', () => {
      const cards = [
        makeCard({ id: 'card-a', name: 'XBBBCC' }),
        makeCard({ id: 'card-b', name: 'YBBBCC' }),
        makeCard({ id: 'card-c', name: 'ZBBBCC' }),
      ]
      mockState.data.cards = cards
      // All three contain 'BBB' but none starts with it → same tier (contains)
      // View order: card-c, card-a, card-b
      mockState.data.viewOrders[0].cardIds = ['card-c', 'card-a', 'card-b']
      mockState.searchQuery = 'BBB'

      const { result } = renderHook(() => useSearch())

      expect(result.current.searchResults).toHaveLength(3)
      // All same tier, sorted by view order
      expect(result.current.searchResults[0].id).toBe('card-c')
      expect(result.current.searchResults[1].id).toBe('card-a')
      expect(result.current.searchResults[2].id).toBe('card-b')
    })

    it('whitespace in query is trimmed before matching', () => {
      mockState.data.cards = [
        makeCard({ id: 'card-1', name: 'HelloWorld' }),
        makeCard({ id: 'card-2', name: 'Other' }),
      ]
      mockState.data.viewOrders[0].cardIds = ['card-1', 'card-2']
      mockState.searchQuery = '  HelloWorld  '

      const { result } = renderHook(() => useSearch())

      // After trim, query is 'HelloWorld' which should match card-1
      expect(result.current.searchResults).toHaveLength(1)
      expect(result.current.searchResults[0].id).toBe('card-1')
    })
  })

  // ── Debounce behavior ──

  describe('debounce behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('search is debounced by 200ms (fast consecutive calls produce one result)', () => {
      mockState.searchQuery = ''

      const { result, rerender } = renderHook(() => useSearch())

      // Initial: no search
      expect(result.current.isSearching).toBe(false)

      // Set first query
      mockState.searchQuery = 'alpha'
      rerender()

      // Debounce active
      expect(result.current.isSearching).toBe(true)

      // Fast consecutive call before debounce settles
      mockState.searchQuery = 'alphabeta'
      rerender()

      // Still debouncing (timer reset)
      expect(result.current.isSearching).toBe(true)

      // Advance timer — only the LAST query should apply
      act(() => {
        vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
      })

      // Debounce settled
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchQuery).toBe('alphabeta')
    })

    it('clearing search (empty string) immediately resets results, no debounce', () => {
      // Start with an active search
      const cards = [
        makeCard({ id: 'card-1', name: 'Matching Result' }),
        makeCard({ id: 'card-2', name: 'Other' }),
      ]
      mockState.data.cards = cards
      mockState.data.viewOrders[0].cardIds = ['card-1', 'card-2']
      mockState.searchQuery = 'Matching'

      const { result, rerender } = renderHook(() => useSearch())

      // Search is settled (debouncedQuery === searchQuery from initial state)
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toHaveLength(1)

      // Clear search
      mockState.searchQuery = ''
      rerender()

      // Should be immediate — no debounce timer
      // Empty query returns all cards
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toHaveLength(2)

      // Verify no timer was set (advancing time does not change results)
      act(() => {
        vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
      })
      expect(result.current.searchResults).toHaveLength(2)
    })

    it('isSearching is true during debounce, false after', () => {
      mockState.searchQuery = ''

      const { result, rerender } = renderHook(() => useSearch())

      // Not searching initially
      expect(result.current.isSearching).toBe(false)

      // Set search query
      mockState.searchQuery = 'test'
      rerender()

      // Debounce active
      expect(result.current.isSearching).toBe(true)

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
      })

      // Debounce settled
      expect(result.current.isSearching).toBe(false)
    })
  })
})
