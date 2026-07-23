import { useMemo, useCallback } from 'react'
import type { Card, Category } from '@shared/types'
import { validateCategoryName } from '@shared/validation'
import { useAppState, useAppDispatch } from '../contexts/AppState'

export function useCategories() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  // ── Categories sorted by order ──

  const categories = useMemo<Category[]>(() => {
    return [...state.data.categories].sort((a, b) => a.order - b.order)
  }, [state.data.categories])

  // ── Uncategorized cards (0 user categories) ──

  const uncategorizedCards = useMemo<Card[]>(() => {
    const uncategorizedViewOrder = state.data.viewOrders.find(
      vo => vo.viewType === 'uncategorized'
    )
    if (!uncategorizedViewOrder) return []

    const cardMap = new Map(state.data.cards.map(c => [c.id, c]))
    return uncategorizedViewOrder.cardIds
      .map(id => cardMap.get(id))
      .filter((c): c is Card => c !== undefined)
  }, [state.data])

  // ── addCategory ──

  const addCategory = useCallback(
    async (name: string): Promise<Category | null> => {
      const trimmed = name.trim()
      const existingNames = state.data.categories.map(c => c.name)
      const validationError = validateCategoryName(trimmed, existingNames)
      if (validationError) return null

      const now = new Date().toISOString()
      const category: Category = {
        id: crypto.randomUUID(),
        name: trimmed,
        order: state.data.categories.length,
        type: 'user',
        createdAt: now,
      }

      dispatch({ type: 'ADD_CATEGORY', category })

      // Persist
      try {
        const current = state.data
        const updatedData = {
          ...current,
          categories: [...current.categories, category],
          viewOrders: [
            ...current.viewOrders,
            { viewType: `category:${category.id}` as const, cardIds: [] },
          ],
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure — state is already updated in memory
      }

      return category
    },
    [state.data, dispatch]
  )

  // ── renameCategory ──

  const renameCategory = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const trimmed = name.trim()
      const otherNames = state.data.categories
        .filter(c => c.id !== id)
        .map(c => c.name)
      const validationError = validateCategoryName(trimmed, otherNames)
      if (validationError) return false

      dispatch({ type: 'UPDATE_CATEGORY', categoryId: id, name: trimmed })

      try {
        const current = state.data
        const updatedData = {
          ...current,
          categories: current.categories.map(c =>
            c.id === id ? { ...c, name: trimmed } : c
          ),
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure
      }

      return true
    },
    [state.data, dispatch]
  )

  // ── deleteCategory ──

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: 'DELETE_CATEGORY', categoryId: id })

      try {
        const current = state.data
        const categoryViewType = `category:${id}` as const

        // Track orphan cards
        const affectedIds = new Set(
          current.cards.filter(c => c.categoryIds.includes(id)).map(c => c.id)
        )
        const updatedCards = current.cards.map(c => {
          if (!affectedIds.has(c.id)) return c
          const remaining = c.categoryIds.filter(catId => catId !== id)
          return { ...c, categoryIds: remaining }
        })
        const nowOrphanIds = updatedCards
          .filter(c => affectedIds.has(c.id) && c.categoryIds.length === 0)
          .map(c => c.id)

        const updatedData = {
          ...current,
          categories: current.categories.filter(c => c.id !== id),
          cards: updatedCards,
          viewOrders: current.viewOrders
            .filter(vo => vo.viewType !== categoryViewType)
            .map(vo => {
              if (vo.viewType === 'uncategorized') {
                const existing = new Set(vo.cardIds)
                const toAdd = nowOrphanIds.filter(cardId => !existing.has(cardId))
                return toAdd.length > 0
                  ? { ...vo, cardIds: [...vo.cardIds, ...toAdd] }
                  : vo
              }
              return vo
            }),
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure
      }
    },
    [state.data, dispatch]
  )

  // ── reorderCategories ──

  const reorderCategories = useCallback(
    async (ids: string[]): Promise<void> => {
      dispatch({ type: 'REORDER_CATEGORIES', categoryIds: ids })

      try {
        const current = state.data
        const reordered = ids
          .map((id, index) => {
            const existing = current.categories.find(c => c.id === id)
            return existing ? { ...existing, order: index } : null
          })
          .filter((c): c is Category => c !== null)

        const updatedData = { ...current, categories: reordered }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure
      }
    },
    [state.data, dispatch]
  )

  return {
    categories,
    uncategorizedCards,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  }
}
