import { describe, expect, it } from 'vitest'
import { appReducer } from '../../src/renderer/contexts/AppState'
import type { AppData, Card } from '../../src/shared/types'

function makeCard(
  id: string,
  isFavorite: boolean,
  categoryIds: string[] = []
): Card {
  return {
    id,
    name: id,
    note: null,
    fileReference: {
      relativePath: `${id}.txt`,
      fileName: id,
      extension: 'txt',
      fileSize: 1,
      mtimeMs: 0,
    },
    categoryIds,
    isFavorite,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeState(data: AppData) {
  return {
    data,
    currentView: 'allCards' as const,
    searchQuery: '',
    isLoading: false,
    loadError: null,
    loadRetryCount: 0,
    saveError: null,
  }
}

describe('favorite state', () => {
  it('adds and removes favorite membership without changing other view orders', () => {
    const data: AppData = {
      version: 3,
      cards: [makeCard('card-1', false)],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'favorites', cardIds: [] },
        { viewType: 'uncategorized', cardIds: ['card-1'] },
      ],
    }

    const favorited = appReducer(makeState(data), {
      type: 'SET_CARD_FAVORITE',
      cardId: 'card-1',
      isFavorite: true,
    })

    expect(favorited.data.cards[0].isFavorite).toBe(true)
    expect(
      favorited.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'favorites'
      )?.cardIds
    ).toEqual(['card-1'])
    expect(
      favorited.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'allCards'
      )?.cardIds
    ).toEqual(['card-1'])
    expect(
      favorited.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'uncategorized'
      )?.cardIds
    ).toEqual(['card-1'])

    const unfavorited = appReducer(favorited, {
      type: 'SET_CARD_FAVORITE',
      cardId: 'card-1',
      isFavorite: false,
    })
    expect(unfavorited.data.cards[0].isFavorite).toBe(false)
    expect(
      unfavorited.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'favorites'
      )?.cardIds
    ).toEqual([])
  })

  it('rebuilds a missing favorites view from card membership on load', () => {
    const data = {
      version: 3,
      cards: [makeCard('favorite', true), makeCard('plain', false)],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['favorite', 'plain'] },
        { viewType: 'uncategorized', cardIds: ['favorite', 'plain'] },
      ],
    } as AppData

    const loaded = appReducer(makeState(data), { type: 'LOAD', data })

    expect(
      loaded.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'favorites'
      )?.cardIds
    ).toEqual(['favorite'])
  })

  it('deleting a favorite removes it from every view order', () => {
    const data: AppData = {
      version: 3,
      cards: [makeCard('favorite', true)],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['favorite'] },
        { viewType: 'favorites', cardIds: ['favorite'] },
        { viewType: 'uncategorized', cardIds: ['favorite'] },
      ],
    }

    const deleted = appReducer(makeState(data), {
      type: 'DELETE_CARD',
      cardId: 'favorite',
    })

    expect(deleted.data.cards).toEqual([])
    expect(
      deleted.data.viewOrders.every(viewOrder => viewOrder.cardIds.length === 0)
    ).toBe(true)
  })

  it('reorders only the favorites view', () => {
    const data: AppData = {
      version: 3,
      cards: [makeCard('favorite-a', true), makeCard('favorite-b', true)],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['favorite-a', 'favorite-b'] },
        { viewType: 'favorites', cardIds: ['favorite-a', 'favorite-b'] },
        { viewType: 'uncategorized', cardIds: ['favorite-a', 'favorite-b'] },
      ],
    }

    const reordered = appReducer(makeState(data), {
      type: 'REORDER_CARDS',
      viewType: 'favorites',
      cardIds: ['favorite-b', 'favorite-a'],
    })

    expect(
      reordered.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'favorites'
      )?.cardIds
    ).toEqual(['favorite-b', 'favorite-a'])
    expect(
      reordered.data.viewOrders.find(
        viewOrder => viewOrder.viewType === 'allCards'
      )?.cardIds
    ).toEqual(['favorite-a', 'favorite-b'])
  })
})
