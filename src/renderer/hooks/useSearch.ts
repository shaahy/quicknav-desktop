import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { Card } from '@shared/types'
import { VIEW_ALL_CARDS, SEARCH_DEBOUNCE_MS } from '@shared/constants'
import { useAppState, useAppDispatch } from '../contexts/AppState'

// ── Public API ──

export interface UseSearchReturn {
  /** Current search query (updates immediately on user input). */
  searchQuery: string
  /** Update the search query (dispatches to global state). */
  setSearchQuery: (query: string) => void
  /**
   * Match-scored cards across ALL views sorted by relevance:
   *   1. Exact name match
   *   2. Prefix name match
   *   3. Substring name match
   *   Within each tier, sorted by allCards view order.
   * Returns ALL cards when query is empty (or whitespace-only).
   */
  searchResults: Card[]
  /** True while the debounce timer is active (user typing). */
  isSearching: boolean
}

// ── Hook ──

/**
 * Global search hook with debounced match scoring.
 *
 * - Reads/writes `searchQuery` from/to the global AppState so the existing
 *   `useCards` filtering (name + note includes) remains in sync.
 * - Internally debounces by `SEARCH_DEBOUNCE_MS` (200ms) before computing
 *   match-scored `searchResults`, avoiding expensive re-sorts on every keystroke.
 * - Ignores leading/trailing whitespace; case-insensitive (English).
 * - Searches across **all** cards by **name** only.
 * - Returns ALL cards (in allCards view order) when the query is empty.
 */
export function useSearch(): UseSearchReturn {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  // ── Search query (global state, immediate) ──

  const searchQuery = state.searchQuery

  // ── Debounced query (internal, used for searchResults computation) ──

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (searchQuery === '') {
      // Clear immediately when search is emptied (Esc / clear button)
      setDebouncedQuery('')
    } else if (searchQuery !== debouncedQuery) {
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery)
      }, SEARCH_DEBOUNCE_MS)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [searchQuery, debouncedQuery])

  const isSearching =
    searchQuery.trim().length > 0 && searchQuery !== debouncedQuery

  // ── Setter (dispatches to global state) ──

  const setSearchQuery = useCallback(
    (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', query })
    },
    [dispatch]
  )

  // ── Match-scored search results (across ALL cards, by name only) ──

  const searchResults = useMemo<Card[]>(() => {
    const query = debouncedQuery.trim()
    if (!query) {
      // Empty query: return ALL cards in allCards view order
      const allCardsOrder =
        state.data.viewOrders.find(vo => vo.viewType === VIEW_ALL_CARDS)
          ?.cardIds ?? []
      const cardMap = new Map(state.data.cards.map(c => [c.id, c]))
      return allCardsOrder
        .map(id => cardMap.get(id))
        .filter((c): c is Card => c !== undefined)
    }

    const q = query.toLowerCase()

    // Get allCards order for stable sorting within tiers
    const allCardsOrder =
      state.data.viewOrders.find(vo => vo.viewType === VIEW_ALL_CARDS)
        ?.cardIds ?? []
    const orderIndex = new Map(allCardsOrder.map((id, i) => [id, i]))

    type Scored = { card: Card; tier: number; order: number }
    const scored: Scored[] = []

    for (const card of state.data.cards) {
      const name = card.name.toLowerCase()
      let tier: number

      if (name === q) {
        tier = 0 // exact match
      } else if (name.startsWith(q)) {
        tier = 1 // prefix match
      } else if (name.includes(q)) {
        tier = 2 // substring match
      } else {
        continue
      }

      scored.push({
        card,
        tier,
        order: orderIndex.get(card.id) ?? Infinity,
      })
    }

    // Sort by tier (exact -> prefix -> contains), then by allCardsOrder
    scored.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return a.order - b.order
    })

    return scored.map(s => s.card)
  }, [debouncedQuery, state.data])

  return { searchQuery, setSearchQuery, searchResults, isSearching }
}
