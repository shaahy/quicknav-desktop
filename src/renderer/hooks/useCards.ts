import { useMemo, useCallback } from 'react'
import type {
  BatchAddResult,
  BatchCardInput,
  Card,
  FileSelectionResult,
} from '@shared/types'
import {
  MAX_CARD_NAME,
  MAX_CARDS,
  VIEW_ALL_CARDS,
  VIEW_UNCATEGORIZED,
} from '@shared/constants'
import { normalizePath, isHtmlFile } from '@shared/validation'
import { useAppState, useAppDispatch } from '../contexts/AppState'

export function useCards() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  const visibleCards = useMemo<Card[]>(() => {
    const viewOrder = state.data.viewOrders.find(vo => vo.viewType === state.currentView)
    if (!viewOrder) return []

    const cardMap = new Map(state.data.cards.map(c => [c.id, c]))
    const ordered = viewOrder.cardIds
      .map(id => cardMap.get(id))
      .filter((c): c is Card => c !== undefined)

    if (!state.searchQuery) return ordered

    const q = state.searchQuery.toLowerCase()
    return ordered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.note && c.note.toLowerCase().includes(q))
    )
  }, [state.data, state.currentView, state.searchQuery])

  const findDuplicateByPath = useCallback(
    (normalizedPath: string): Card | undefined => {
      return state.data.cards.find(c => c.fileReference.relativePath === normalizedPath)
    },
    [state.data.cards]
  )

  const addCard = useCallback(
    async (
      fileResult: FileSelectionResult,
      name: string,
      categoryIds: string[]
    ): Promise<Card | null> => {
      if (fileResult.canceled || !fileResult.file) return null

      const platform = window.electronAPI.getPlatform()
      const normalized = normalizePath(fileResult.file.relativePath, platform)

      const existing = findDuplicateByPath(normalized)
      if (existing) return null

      let cardName = name
      if (!cardName && isHtmlFile(fileResult.file.extension)) {
        try {
          const htmlTitle = await window.electronAPI.readHtmlTitle(fileResult.file.relativePath)
          if (htmlTitle) cardName = htmlTitle
        } catch {
          // ignore HTML title read failures
        }
      }
      if (!cardName) {
        cardName = fileResult.file.fileName
      }

      // Name uniqueness check — FR-006 defense-in-depth (form validation is primary gate)
      if (state.data.cards.some(c => c.name === cardName)) return null

      const now = new Date().toISOString()
      const cardId = crypto.randomUUID()

      const card: Card = {
        id: cardId,
        name: cardName,
        note: null,
        fileReference: {
          relativePath: normalized,
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
        const saveResult = await window.electronAPI.saveAppData(updatedData)
        if (saveResult && saveResult.error) {
          dispatch({ type: 'SET_SAVE_ERROR', error: saveResult.error })
        }
      } catch {
        dispatch({ type: 'SET_SAVE_ERROR', error: 'unknown' })
      }

      return card
    },
    [state.data, dispatch, findDuplicateByPath]
  )

  const addCardsBatch = useCallback(
    async (inputs: BatchCardInput[]): Promise<BatchAddResult> => {
      if (inputs.length === 0) {
        return { addedCount: 0, error: '没有可添加的卡片' }
      }
      if (state.data.cards.length + inputs.length > MAX_CARDS) {
        return { addedCount: 0, error: `卡片总数不能超过 ${MAX_CARDS}` }
      }

      const platform = window.electronAPI.getPlatform()
      const existingPaths = new Set(
        state.data.cards.map(card =>
          normalizePath(card.fileReference.relativePath, platform)
        )
      )
      const existingNames = new Set(state.data.cards.map(card => card.name))
      const validCategoryIds = new Set(state.data.categories.map(category => category.id))
      const batchPaths = new Set<string>()
      const batchNames = new Set<string>()

      for (const input of inputs) {
        const name = input.name.trim()
        const normalizedPath = normalizePath(input.file.relativePath, platform)
        if (!name || name.length > MAX_CARD_NAME || /[\r\n]/.test(name)) {
          return { addedCount: 0, error: `卡片名称“${input.name}”无效` }
        }
        if (existingNames.has(name) || batchNames.has(name)) {
          return { addedCount: 0, error: `卡片名称“${name}”重复` }
        }
        if (existingPaths.has(normalizedPath) || batchPaths.has(normalizedPath)) {
          return { addedCount: 0, error: `文件“${input.file.fileName}”已经添加` }
        }
        if (
          input.categoryIds.length === 0 ||
          input.categoryIds.some(categoryId => !validCategoryIds.has(categoryId))
        ) {
          return { addedCount: 0, error: `请为“${name}”选择有效类别` }
        }
        batchNames.add(name)
        batchPaths.add(normalizedPath)
      }

      const now = new Date().toISOString()
      const cards: Card[] = inputs.map(input => ({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        note: null,
        fileReference: {
          relativePath: normalizePath(input.file.relativePath, platform),
          fileName: input.file.fileName,
          extension: input.file.extension,
          fileSize: input.file.fileSize,
          mtimeMs: input.file.mtimeMs,
        },
        categoryIds: [...input.categoryIds],
        createdAt: now,
        updatedAt: now,
      }))

      const updatedData = {
        ...state.data,
        cards: [...state.data.cards, ...cards],
        viewOrders: state.data.viewOrders.map(viewOrder => {
          const appendedIds = cards
            .filter(card => {
              if (viewOrder.viewType === VIEW_ALL_CARDS) return true
              if (viewOrder.viewType === VIEW_UNCATEGORIZED) {
                return card.categoryIds.length === 0
              }
              return card.categoryIds.some(
                categoryId => viewOrder.viewType === `category:${categoryId}`
              )
            })
            .map(card => card.id)
          return appendedIds.length > 0
            ? { ...viewOrder, cardIds: [...viewOrder.cardIds, ...appendedIds] }
            : viewOrder
        }),
      }

      try {
        const saveResult = await window.electronAPI.saveAppData(updatedData)
        if (saveResult && saveResult.error) {
          return { addedCount: 0, error: saveResult.error }
        }
      } catch {
        return { addedCount: 0, error: 'unknown' }
      }

      dispatch({ type: 'ADD_CARDS_BATCH', cards })
      return { addedCount: cards.length }
    },
    [state.data, dispatch]
  )

  const updateCard = useCallback(
    async (
      cardId: string,
      updates: Partial<Pick<Card, 'name' | 'note' | 'fileReference' | 'categoryIds'>>
    ): Promise<void> => {
      dispatch({ type: 'UPDATE_CARD', cardId, updates })

      try {
        const current = state.data
        let updatedViewOrders = current.viewOrders

        if (updates.categoryIds) {
          const oldCard = current.cards.find(c => c.id === cardId)
          if (oldCard) {
            const oldIds = oldCard.categoryIds
            const newIds = updates.categoryIds
            const removedFromCategories = oldIds.filter(id => !newIds.includes(id))
            const addedToCategories = newIds.filter(id => !oldIds.includes(id))

            if (removedFromCategories.length > 0 || addedToCategories.length > 0) {
              updatedViewOrders = updatedViewOrders.map(vo => {
                if (
                  removedFromCategories.some(
                    catId => vo.viewType === (`category:${catId}` as const)
                  )
                ) {
                  return { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
                }
                if (
                  addedToCategories.some(
                    catId => vo.viewType === (`category:${catId}` as const)
                  ) &&
                  !vo.cardIds.includes(cardId)
                ) {
                  return { ...vo, cardIds: [...vo.cardIds, cardId] }
                }
                return vo
              })

              if (oldIds.length === 0 && newIds.length > 0) {
                updatedViewOrders = updatedViewOrders.map(vo =>
                  vo.viewType === VIEW_UNCATEGORIZED
                    ? { ...vo, cardIds: vo.cardIds.filter(id => id !== cardId) }
                    : vo
                )
              } else if (oldIds.length > 0 && newIds.length === 0) {
                updatedViewOrders = updatedViewOrders.map(vo =>
                  vo.viewType === VIEW_UNCATEGORIZED && !vo.cardIds.includes(cardId)
                    ? { ...vo, cardIds: [...vo.cardIds, cardId] }
                    : vo
                )
              }
            }
          }
        }

        const updatedData = {
          ...current,
          cards: current.cards.map(c =>
            c.id === cardId
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
          viewOrders: updatedViewOrders,
        }
        const saveResult = await window.electronAPI.saveAppData(updatedData)
        if (saveResult && saveResult.error) {
          dispatch({ type: 'SET_SAVE_ERROR', error: saveResult.error })
        }
      } catch {
        dispatch({ type: 'SET_SAVE_ERROR', error: 'unknown' })
      }
    },
    [state.data, dispatch]
  )

  const deleteCard = useCallback(
    async (cardId: string): Promise<void> => {
      dispatch({ type: 'DELETE_CARD', cardId })

      try {
        const current = state.data
        const updatedData = {
          ...current,
          cards: current.cards.filter(c => c.id !== cardId),
          viewOrders: current.viewOrders.map(vo => ({
            ...vo,
            cardIds: vo.cardIds.filter(id => id !== cardId),
          })),
        }
        const saveResult = await window.electronAPI.saveAppData(updatedData)
        if (saveResult && saveResult.error) {
          dispatch({ type: 'SET_SAVE_ERROR', error: saveResult.error })
        }
      } catch {
        dispatch({ type: 'SET_SAVE_ERROR', error: 'unknown' })
      }
    },
    [state.data, dispatch]
  )

  const repairFile = useCallback(
    async (cardId: string, fileResult: FileSelectionResult): Promise<void> => {
      if (fileResult.canceled || !fileResult.file) return

      const platform = window.electronAPI.getPlatform()
      const normalized = normalizePath(fileResult.file.relativePath, platform)

      const fileReference = {
        relativePath: normalized,
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
    addCardsBatch,
    updateCard,
    deleteCard,
    repairFile,
    findDuplicateByPath,
  }
}
