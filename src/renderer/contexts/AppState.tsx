import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { AppData, Card, Category, ViewType } from '@shared/types'
import { VIEW_ALL_CARDS, VIEW_UNCATEGORIZED } from '@shared/constants'

// ── Action Types ──

type AppAction =
  | { type: 'LOAD'; data: AppData }
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'UPDATE_CARD'; cardId: string; updates: Partial<Pick<Card, 'name' | 'note' | 'fileReference' | 'categoryIds'>> }
  | { type: 'DELETE_CARD'; cardId: string }
  | { type: 'ADD_CATEGORY'; category: Category }
  | { type: 'UPDATE_CATEGORY'; categoryId: string; name: string }
  | { type: 'DELETE_CATEGORY'; categoryId: string }
  | { type: 'REORDER_CARDS'; viewType: ViewType; cardIds: string[] }
  | { type: 'REORDER_CATEGORIES'; categoryIds: string[] }
  | { type: 'ADD_CARD_TO_CATEGORY'; cardId: string; categoryId: string }
  | { type: 'REMOVE_CARD_FROM_CATEGORY'; cardId: string; categoryId: string }
  | { type: 'SET_CURRENT_VIEW'; viewType: ViewType }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_SAVE_ERROR'; error: string | null }
  | { type: 'SET_LOAD_ERROR'; error: string }
  | { type: 'RETRY_LOAD' }
  | { type: 'REBUILD_DATA' }

// ── State ──

interface AppState {
  data: AppData
  currentView: ViewType
  searchQuery: string
  isLoading: boolean
  loadError: string | null
  loadRetryCount: number
  saveError: string | null
}

const INITIAL_APP_DATA: AppData = {
  version: 1,
  cards: [],
  categories: [],
  viewOrders: [
    { viewType: VIEW_ALL_CARDS, cardIds: [] },
    { viewType: VIEW_UNCATEGORIZED, cardIds: [] },
  ],
}

const initialState: AppState = {
  data: INITIAL_APP_DATA,
  currentView: VIEW_ALL_CARDS,
  searchQuery: '',
  isLoading: true,
  loadError: null,
  loadRetryCount: 0,
  saveError: null,
}

// ── Reducer ──

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD': {
      const loadedData = action.data

      // Ensure viewOrders always includes VIEW_ALL_CARDS and VIEW_UNCATEGORIZED
      // (fix for legacy/stale data that may lack these entries).
      if (!loadedData.viewOrders.some(vo => vo.viewType === VIEW_ALL_CARDS)) {
        loadedData.viewOrders.push({
          viewType: VIEW_ALL_CARDS,
          cardIds: loadedData.cards.map(c => c.id),
        })
      }
      if (!loadedData.viewOrders.some(vo => vo.viewType === VIEW_UNCATEGORIZED)) {
        loadedData.viewOrders.push({
          viewType: VIEW_UNCATEGORIZED,
          cardIds: loadedData.cards
            .filter(c => c.categoryIds.length === 0)
            .map(c => c.id),
        })
      }

      return {
        ...state,
        data: loadedData,
        isLoading: false,
        loadError: null,
        loadRetryCount: 0,
        saveError: null,
      }
    }

    case 'SET_LOAD_ERROR': {
      return {
        ...state,
        isLoading: false,
        loadError: action.error,
      }
    }

    case 'RETRY_LOAD': {
      return {
        ...state,
        isLoading: true,
        loadError: null,
        loadRetryCount: state.loadRetryCount + 1,
      }
    }

    case 'REBUILD_DATA': {
      return {
        ...state,
        data: INITIAL_APP_DATA,
        isLoading: false,
        loadError: null,
        loadRetryCount: 0,
      }
    }

    case 'ADD_CARD': {
      const { card } = action
      const updatedViewOrders = state.data.viewOrders.map(vo => {
        if (vo.viewType === VIEW_ALL_CARDS) {
          return { ...vo, cardIds: [...vo.cardIds, card.id] }
        }
        // For each category the card belongs to, append to that category viewOrder
        if (card.categoryIds.some(catId => vo.viewType === `category:${catId}`)) {
          return { ...vo, cardIds: [...vo.cardIds, card.id] }
        }
        return vo
      })
      return {
        ...state,
        data: {
          ...state.data,
          cards: [...state.data.cards, card],
          viewOrders: updatedViewOrders,
        },
      }
    }

    case 'UPDATE_CARD': {
      const { cardId, updates } = action
      const oldCard = state.data.cards.find(c => c.id === cardId)
      if (!oldCard) return state

      let updatedViewOrders = state.data.viewOrders

      if (updates.categoryIds) {
        const oldIds = oldCard.categoryIds
        const newIds = updates.categoryIds
        const removedFromCategories = oldIds.filter(id => !newIds.includes(id))
        const addedToCategories = newIds.filter(id => !oldIds.includes(id))

        if (removedFromCategories.length > 0 || addedToCategories.length > 0) {
          updatedViewOrders = updatedViewOrders.map(vo => {
            // Remove card from categories it left
            if (
              removedFromCategories.some(
                catId => vo.viewType === (`category:${catId}` as ViewType)
              )
            ) {
              return { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
            }
            // Add card to categories it joined
            if (
              addedToCategories.some(
                catId => vo.viewType === (`category:${catId}` as ViewType)
              ) &&
              !vo.cardIds.includes(cardId)
            ) {
              return { ...vo, cardIds: [...vo.cardIds, cardId] }
            }
            return vo
          })

          // Handle uncategorized view
          if (oldIds.length === 0 && newIds.length > 0) {
            // Was uncategorized, now has categories
            updatedViewOrders = updatedViewOrders.map(vo =>
              vo.viewType === VIEW_UNCATEGORIZED
                ? { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
                : vo
            )
          } else if (oldIds.length > 0 && newIds.length === 0) {
            // Had categories, now has none
            updatedViewOrders = updatedViewOrders.map(vo =>
              vo.viewType === VIEW_UNCATEGORIZED && !vo.cardIds.includes(cardId)
                ? { ...vo, cardIds: [...vo.cardIds, cardId] }
                : vo
            )
          }
        }
      }

      return {
        ...state,
        data: {
          ...state.data,
          cards: state.data.cards.map(c =>
            c.id === cardId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
          viewOrders: updatedViewOrders,
        },
      }
    }

    case 'DELETE_CARD': {
      const { cardId } = action
      return {
        ...state,
        data: {
          ...state.data,
          cards: state.data.cards.filter(c => c.id !== cardId),
          viewOrders: state.data.viewOrders.map(vo => ({
            ...vo,
            cardIds: vo.cardIds.filter(id => id !== cardId),
          })),
        },
      }
    }

    case 'ADD_CATEGORY': {
      const { category } = action
      return {
        ...state,
        data: {
          ...state.data,
          categories: [...state.data.categories, category],
          viewOrders: [
            ...state.data.viewOrders,
            { viewType: `category:${category.id}` as ViewType, cardIds: [] },
          ],
        },
      }
    }

    case 'UPDATE_CATEGORY': {
      const { categoryId, name } = action
      return {
        ...state,
        data: {
          ...state.data,
          categories: state.data.categories.map(c =>
            c.id === categoryId ? { ...c, name } : c
          ),
        },
      }
    }

    case 'DELETE_CATEGORY': {
      const { categoryId } = action
      const categoryViewType: ViewType = `category:${categoryId}`

      // Track which cards had the deleted category
      const affectedCardIds = new Set(
        state.data.cards
          .filter(c => c.categoryIds.includes(categoryId))
          .map(c => c.id)
      )

      // Remove categoryId from affected cards and detect orphans
      const updatedCards = state.data.cards.map(c => {
        if (!affectedCardIds.has(c.id)) return c
        const remaining = c.categoryIds.filter(id => id !== categoryId)
        return { ...c, categoryIds: remaining }
      })

      // Cards that now have 0 user categories
      const nowOrphanIds = updatedCards
        .filter(c => affectedCardIds.has(c.id) && c.categoryIds.length === 0)
        .map(c => c.id)

      return {
        ...state,
        data: {
          ...state.data,
          categories: state.data.categories.filter(c => c.id !== categoryId),
          cards: updatedCards,
          viewOrders: state.data.viewOrders
            .filter(vo => vo.viewType !== categoryViewType)
            .map(vo => {
              if (vo.viewType === VIEW_UNCATEGORIZED) {
                const existing = new Set(vo.cardIds)
                const toAdd = nowOrphanIds.filter(id => !existing.has(id))
                return toAdd.length > 0
                  ? { ...vo, cardIds: [...vo.cardIds, ...toAdd] }
                  : vo
              }
              return vo
            }),
        },
      }
    }

    case 'REORDER_CARDS': {
      const { viewType, cardIds } = action
      return {
        ...state,
        data: {
          ...state.data,
          viewOrders: state.data.viewOrders.map(vo =>
            vo.viewType === viewType ? { ...vo, cardIds } : vo
          ),
        },
      }
    }

    case 'REORDER_CATEGORIES': {
      const { categoryIds } = action
      return {
        ...state,
        data: {
          ...state.data,
          categories: categoryIds.map((id, index) => {
            const existing = state.data.categories.find(c => c.id === id)
            return existing ? { ...existing, order: index } : existing
          }).filter((c): c is Category => c !== undefined),
        },
      }
    }

    case 'ADD_CARD_TO_CATEGORY': {
      const { cardId, categoryId } = action
      const categoryViewType: ViewType = `category:${categoryId}`

      // Add categoryId to the card
      const updatedCards = state.data.cards.map(c => {
        if (c.id === cardId && !c.categoryIds.includes(categoryId)) {
          return { ...c, categoryIds: [...c.categoryIds, categoryId] }
        }
        return c
      })

      // Add cardId to the category viewOrder
      let updatedViewOrders = state.data.viewOrders.map(vo => {
        if (vo.viewType === categoryViewType && !vo.cardIds.includes(cardId)) {
          return { ...vo, cardIds: [...vo.cardIds, cardId] }
        }
        return vo
      })

      // If card now has categories (was orphan), remove from uncategorized
      const card = updatedCards.find(c => c.id === cardId)
      if (card && card.categoryIds.length === 1) {
        // Card just got its first category, remove from uncategorized if present
        updatedViewOrders = updatedViewOrders.map(vo => {
          if (vo.viewType === VIEW_UNCATEGORIZED && vo.cardIds.includes(cardId)) {
            return { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
          }
          return vo
        })
      }

      return {
        ...state,
        data: {
          ...state.data,
          cards: updatedCards,
          viewOrders: updatedViewOrders,
        },
      }
    }

    case 'REMOVE_CARD_FROM_CATEGORY': {
      const { cardId, categoryId } = action
      const categoryViewType: ViewType = `category:${categoryId}`

      const card = state.data.cards.find(c => c.id === cardId)
      if (!card) return state

      // Guard: card must have at least 1 user category at all times (FR-016)
      if (card.categoryIds.includes(categoryId) && card.categoryIds.length === 1) {
        return state
      }

      // Remove categoryId from the card
      const updatedCards = state.data.cards.map(c => {
        if (c.id === cardId) {
          return { ...c, categoryIds: c.categoryIds.filter(id => id !== categoryId) }
        }
        return c
      })

      // Remove cardId from the category viewOrder
      const updatedViewOrders = state.data.viewOrders.map(vo => {
        if (vo.viewType === categoryViewType) {
          return { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
        }
        return vo
      })

      return {
        ...state,
        data: {
          ...state.data,
          cards: updatedCards,
          viewOrders: updatedViewOrders,
        },
      }
    }

    case 'SET_CURRENT_VIEW': {
      return { ...state, currentView: action.viewType }
    }

    case 'SET_SEARCH_QUERY': {
      return { ...state, searchQuery: action.query }
    }

    case 'SET_SAVE_ERROR': {
      return { ...state, saveError: action.error }
    }

    default:
      return state
  }
}

// ── Context ──

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

// ── Provider ──

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load app data on mount and on retry
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await window.electronAPI.getAppData()
        console.log('[AppState] getAppData result:', JSON.stringify({ success: (result as any).success, hasData: !!(result as any).data, error: (result as any).error }))
        if (cancelled) return
        if (result.data) {
          dispatch({ type: 'LOAD', data: result.data })
        } else if (result.error === 'corrupted') {
          // Data is corrupted — show blocking error (FR-036a)
          dispatch({ type: 'SET_LOAD_ERROR', error: 'corrupted' })
        } else {
          // 'not-found' — first launch, start with empty data
          dispatch({ type: 'LOAD', data: INITIAL_APP_DATA })
        }
      } catch (e) {
        console.error('[AppState] load failed:', e)
        if (!cancelled) {
          dispatch({ type: 'SET_LOAD_ERROR', error: 'unknown' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [state.loadRetryCount])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hooks ──

export function useAppState(): { state: AppState; dispatch: React.Dispatch<AppAction> } {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return ctx
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppDispatch must be used within an AppStateProvider')
  }
  return ctx.dispatch
}
