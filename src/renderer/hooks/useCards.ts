import { useMemo, useCallback } from 'react'
import type { Card, FileSelectionResult } from '@shared/types'
import { VIEW_ALL_CARDS } from '@shared/constants'
import { normalizePath, isHtmlFile } from '@shared/validation'
import { useAppState, useAppDispatch } from '../contexts/AppState'

export function useCards() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  // ── Derived: visible cards for current view + search ──

  const visibleCards = useMemo<Card[]>(() => {
    // Get ordered card IDs for the current view
    const viewOrder = state.data.viewOrders.find(vo => vo.viewType === state.currentView)
    if (!viewOrder) return []

    // Build card lookup and return in viewOrder sequence
    const cardMap = new Map(state.data.cards.map(c => [c.id, c]))
    const ordered = viewOrder.cardIds
      .map(id => cardMap.get(id))
      .filter((c): c is Card => c !== undefined)

    // Apply search filter
    if (!state.searchQuery) return ordered

    const q = state.searchQuery.toLowerCase()
    return ordered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.note && c.note.toLowerCase().includes(q))
    )
  }, [state.data, state.currentView, state.searchQuery])

  // ── Duplicate check ──

  const findDuplicateByPath = useCallback(
    (normalizedPath: string): Card | undefined => {
      return state.data.cards.find(c => c.fileReference.absolutePath === normalizedPath)
    },
    [state.data.cards]
  )

  // ── addCard ──

  const addCard = useCallback(
    async (
      fileResult: FileSelectionResult,
      name: string,
      categoryIds: string[]
    ): Promise<Card | null> => {
      if (fileResult.canceled || !fileResult.file) return null

      const platform = window.electronAPI.getPlatform()
      const normalized = normalizePath(fileResult.file.absolutePath, platform)

      // Duplicate check
      const existing = findDuplicateByPath(normalized)
      if (existing) return null // caller should handle duplicate feedback

      // Determine card name
      let cardName = name
      if (!cardName && isHtmlFile(fileResult.file.extension)) {
        try {
          const htmlTitle = await window.electronAPI.readHtmlTitle(fileResult.file.absolutePath)
          if (htmlTitle) cardName = htmlTitle
        } catch {
          // ignore HTML title read failure
        }
      }
      if (!cardName) {
        cardName = fileResult.file.fileName
      }

      const now = new Date().toISOString()
      const cardId = crypto.randomUUID()

      const card: Card = {
        id: cardId,
        name: cardName,
        note: null,
        fileReference: {
          absolutePath: normalized,
          fileName: fileResult.file.fileName,
          extension: fileResult.file.extension,
          fileSize: fileResult.file.fileSize,
          mtimeMs: fileResult.file.mtimeMs,
        },
        categoryIds,
        createdAt: now,
        updatedAt: now,
      }

      dispatch({ type: 'ADD_CARD', card })

      // Persist
      try {
        const current = state.data
        const updatedData = {
          ...current,
          cards: [...current.cards, card],
          viewOrders: current.viewOrders.map(vo => {
            if (vo.viewType === VIEW_ALL_CARDS) {
              return { ...vo, cardIds: [...vo.cardIds, cardId] }
            }
            if (categoryIds.some(catId => vo.viewType === `category:${catId}`)) {
              return { ...vo, cardIds: [...vo.cardIds, cardId] }
            }
            return vo
          }),
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure — state is already updated in memory
      }

      return card
    },
    [state.data, dispatch, findDuplicateByPath]
  )

  // ── updateCard ──

  const updateCard = useCallback(
    async (
      cardId: string,
      updates: Partial<Pick<Card, 'name' | 'note' | 'fileReference'>>
    ): Promise<void> => {
      dispatch({ type: 'UPDATE_CARD', cardId, updates })

      try {
        const current = state.data
        const updatedData: typeof current = {
          ...current,
          cards: current.cards.map(c =>
            c.id === cardId
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure — state is already updated in memory
      }
    },
    [state.data, dispatch]
  )

  // ── deleteCard ──

  const deleteCard = useCallback(
    async (cardId: string): Promise<void> => {
      dispatch({ type: 'DELETE_CARD', cardId })

      try {
        const current = state.data
        const updatedData: typeof current = {
          ...current,
          cards: current.cards.filter(c => c.id !== cardId),
          viewOrders: current.viewOrders.map(vo => ({
            ...vo,
            cardIds: vo.cardIds.filter(id => id !== cardId),
          })),
        }
        await window.electronAPI.saveAppData(updatedData)
      } catch {
        // Save failure — state is already updated in memory
      }
    },
    [state.data, dispatch]
  )

  // ── repairFile ──

  const repairFile = useCallback(
    async (cardId: string, fileResult: FileSelectionResult): Promise<void> => {
      if (fileResult.canceled || !fileResult.file) return

      const platform = window.electronAPI.getPlatform()
      const normalized = normalizePath(fileResult.file.absolutePath, platform)

      const fileReference = {
        absolutePath: normalized,
        fileName: fileResult.file.fileName,
        extension: fileResult.file.extension,
        fileSize: fileResult.file.fileSize,
        mtimeMs: fileResult.file.mtimeMs,
      }

      await updateCard(cardId, { fileReference })
    },
    [updateCard]
  )

  return {
    visibleCards,
    addCard,
    updateCard,
    deleteCard,
    repairFile,
    findDuplicateByPath,
  }
}
