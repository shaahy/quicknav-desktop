import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import type { Card, Category } from '../../src/shared/types'
import { useCategories } from '../../src/renderer/hooks/useCategories'
import { appReducer } from '../../src/renderer/contexts/AppState'

// ── Hoisted mocks ──

const mocks = vi.hoisted(() => {
  const state: {
    data: {
      version: number
      cards: Card[]
      categories: Category[]
      viewOrders: { viewType: string; cardIds: string[] }[]
    }
    currentView: string
    searchQuery: string
  } = {
    data: {
      version: 1,
      cards: [],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: [] },
        { viewType: 'uncategorized', cardIds: [] },
      ],
    },
    currentView: 'allCards',
    searchQuery: '',
  }

  return {
    state,
    dispatch: vi.fn(),
    electronAPI: {
      saveAppData: vi.fn().mockResolvedValue({ success: true }),
      getAppData: vi.fn().mockResolvedValue({ data: undefined }),
    },
    randomUUID: vi.fn().mockReturnValue('00000000-0000-0000-0000-000000000001'),
  }
})

// ── Module mocks ──

vi.mock('../../src/renderer/contexts/AppState', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/renderer/contexts/AppState')>()
  return {
    ...actual,
    useAppState: () => ({ state: mocks.state }),
    useAppDispatch: () => mocks.dispatch,
  }
})

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: <T>(fn: () => T): T => fn(),
    useCallback: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  }
})

// ── Helpers ──

function makeCategory(overrides: Partial<Category> & { id: string }): Category {
  return {
    name: 'Test Category',
    order: 0,
    type: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

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

const RESERVED_ALL_CARDS = '全部卡片'
const RESERVED_UNCATEGORIZED = '未分类'

function resetState(): void {
  mocks.state.data = {
    version: 1,
    cards: [],
    categories: [],
    viewOrders: [
      { viewType: 'allCards', cardIds: [] },
      { viewType: 'uncategorized', cardIds: [] },
    ],
  }
  mocks.state.currentView = 'allCards'
  mocks.state.searchQuery = ''
}

// ── Tests ──

describe('useCategories', () => {
  beforeAll(() => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID })
    vi.stubGlobal('window', { electronAPI: mocks.electronAPI })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  // ── categories (sorted) ──

  describe('categories', () => {
    it('returns categories sorted by order', () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-2', name: 'Work', order: 2 }),
        makeCategory({ id: 'cat-0', name: 'Personal', order: 0 }),
        makeCategory({ id: 'cat-1', name: 'Archive', order: 1 }),
      ]

      const { categories } = useCategories()

      expect(categories).toHaveLength(3)
      expect(categories[0].id).toBe('cat-0')
      expect(categories[1].id).toBe('cat-1')
      expect(categories[2].id).toBe('cat-2')
    })
  })

  // ── addCategory ──

  describe('addCategory', () => {
    it('creates category with proper defaults', async () => {
      const { addCategory } = useCategories()

      const result = await addCategory('Work')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('00000000-0000-0000-0000-000000000001')
      expect(result!.name).toBe('Work')
      expect(result!.order).toBe(0)
      expect(result!.type).toBe('user')
      expect(result!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // dispatch was called
      expect(mocks.dispatch).toHaveBeenCalledTimes(1)
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'ADD_CATEGORY',
        category: expect.objectContaining({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Work',
          order: 0,
          type: 'user',
        }),
      })

      // saveAppData was called with updated categories and viewOrder
      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      expect(savedData.categories).toHaveLength(1)
      expect(savedData.categories[0].name).toBe('Work')
      expect(savedData.viewOrders).toContainEqual({
        viewType: 'category:00000000-0000-0000-0000-000000000001',
        cardIds: [],
      })
    })

    it('trims whitespace from name', async () => {
      const { addCategory } = useCategories()

      const result = await addCategory('   Development  ')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Development')
    })

    it('rejects reserved name "全部卡片"', async () => {
      const { addCategory } = useCategories()

      const result = await addCategory(RESERVED_ALL_CARDS)
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
      expect(mocks.electronAPI.saveAppData).not.toHaveBeenCalled()
    })

    it('rejects reserved name "未分类"', async () => {
      const { addCategory } = useCategories()

      const result = await addCategory(RESERVED_UNCATEGORIZED)
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('rejects empty name after trim', async () => {
      const { addCategory } = useCategories()

      const result = await addCategory('   ')
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('rejects duplicate name against existing categories', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: '工作' }),
      ]

      const { addCategory } = useCategories()

      const result = await addCategory('工作')
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('rejects duplicate name even with different whitespace', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: '工作' }),
      ]

      const { addCategory } = useCategories()

      const result = await addCategory('  工作  ')
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('increments order based on existing categories length', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'First', order: 0 }),
        makeCategory({ id: 'cat-2', name: 'Second', order: 1 }),
      ]

      const { addCategory } = useCategories()

      const result = await addCategory('Third')
      expect(result).not.toBeNull()
      expect(result!.order).toBe(2)
    })
  })

  // ── renameCategory ──

  describe('renameCategory', () => {
    it('updates category name', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
      ]

      const { renameCategory } = useCategories()

      const success = await renameCategory('cat-1', 'Office')

      expect(success).toBe(true)
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CATEGORY',
        categoryId: 'cat-1',
        name: 'Office',
      })

      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const renamed = savedData.categories.find((c: Category) => c.id === 'cat-1')
      expect(renamed.name).toBe('Office')
    })

    it('trims whitespace from renamed name', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
      ]

      const { renameCategory } = useCategories()

      const success = await renameCategory('cat-1', '   Office  ')
      expect(success).toBe(true)
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CATEGORY',
        categoryId: 'cat-1',
        name: 'Office',
      })
    })

    it('rejects rename to a reserved name', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
      ]

      const { renameCategory } = useCategories()

      const result = await renameCategory('cat-1', RESERVED_ALL_CARDS)
      expect(result).toBe(false)
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('rejects rename to an existing duplicate name', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
        makeCategory({ id: 'cat-2', name: 'Personal' }),
      ]

      const { renameCategory } = useCategories()

      const result = await renameCategory('cat-1', 'Personal')
      expect(result).toBe(false)
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('allows rename to own current name (no conflict with self)', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
      ]

      const { renameCategory } = useCategories()

      const result = await renameCategory('cat-1', 'Work')
      expect(result).toBe(true)
      expect(mocks.dispatch).toHaveBeenCalled()
    })
  })

  // ── deleteCategory ──

  describe('deleteCategory', () => {
    it('removes category and its viewOrder', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'To Delete' }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: [] },
        { viewType: 'category:cat-1', cardIds: [] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      const { deleteCategory } = useCategories()

      await deleteCategory('cat-1')

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'DELETE_CATEGORY',
        categoryId: 'cat-1',
      })

      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]

      expect(savedData.categories).toHaveLength(0)
      expect(savedData.viewOrders).not.toContainEqual(
        expect.objectContaining({ viewType: 'category:cat-1' })
      )
    })

    it('removes categoryId from affected cards and moves orphans to uncategorized', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
        makeCategory({ id: 'cat-2', name: 'Personal' }),
      ]
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Only Work', categoryIds: ['cat-1'] }),
        makeCard({ id: 'card-2', name: 'Both Cats', categoryIds: ['cat-1', 'cat-2'] }),
        makeCard({ id: 'card-3', name: 'Only Personal', categoryIds: ['cat-2'] }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1', 'card-2', 'card-3'] },
        { viewType: 'category:cat-1', cardIds: ['card-1', 'card-2'] },
        { viewType: 'category:cat-2', cardIds: ['card-2', 'card-3'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      const { deleteCategory } = useCategories()

      await deleteCategory('cat-1')

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'DELETE_CATEGORY',
        categoryId: 'cat-1',
      })

      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]

      // cat-1 removed from categories
      expect(savedData.categories.map((c: Category) => c.id)).toEqual(['cat-2'])

      // cat-1 viewOrder removed
      expect(savedData.viewOrders.map((vo: { viewType: string }) => vo.viewType)).not.toContain(
        'category:cat-1'
      )

      // card-1 lost its only category -> becomes orphan → moves to uncategorized
      expect(savedData.cards.find((c: Card) => c.id === 'card-1')!.categoryIds).toEqual([])
      const uncatVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'uncategorized'
      )
      expect(uncatVo.cardIds).toContain('card-1')

      // card-2 still has cat-2 → not orphan
      expect(savedData.cards.find((c: Card) => c.id === 'card-2')!.categoryIds).toEqual(['cat-2'])
      expect(uncatVo.cardIds).not.toContain('card-2')

      // card-3 unaffected
      expect(savedData.cards.find((c: Card) => c.id === 'card-3')!.categoryIds).toEqual(['cat-2'])
    })

    it('does not duplicate card IDs in uncategorized viewOrder', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-1', name: 'Work' }),
      ]
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Lone', categoryIds: ['cat-1'] }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'category:cat-1', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: ['card-1'] }, // already present
      ]

      const { deleteCategory } = useCategories()

      await deleteCategory('cat-1')

      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const uncatVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'uncategorized'
      )
      // Should still contain card-1 exactly once
      expect(uncatVo.cardIds.filter((id: string) => id === 'card-1')).toHaveLength(1)
    })
  })

  // ── reorderCategories ──

  describe('reorderCategories', () => {
    it('updates category order based on provided id sequence', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-a', name: 'Alpha', order: 0 }),
        makeCategory({ id: 'cat-b', name: 'Beta', order: 1 }),
        makeCategory({ id: 'cat-c', name: 'Gamma', order: 2 }),
      ]

      const { reorderCategories } = useCategories()

      await reorderCategories(['cat-c', 'cat-a', 'cat-b'])

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'REORDER_CATEGORIES',
        categoryIds: ['cat-c', 'cat-a', 'cat-b'],
      })

      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)

      // saveAppData receives reordered categories
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const orders = savedData.categories.map((c: Category) => ({ id: c.id, order: c.order }))
      expect(orders).toEqual([
        { id: 'cat-c', order: 0 },
        { id: 'cat-a', order: 1 },
        { id: 'cat-b', order: 2 },
      ])
    })

    it('preserves all category properties after reorder', async () => {
      mocks.state.data.categories = [
        makeCategory({ id: 'cat-a', name: 'First', order: 0, createdAt: '2024-01-01T00:00:00.000Z' }),
        makeCategory({ id: 'cat-b', name: 'Second', order: 1, createdAt: '2024-01-02T00:00:00.000Z' }),
      ]

      const { reorderCategories } = useCategories()

      await reorderCategories(['cat-b', 'cat-a'])

      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const catB = savedData.categories.find((c: Category) => c.id === 'cat-b')
      expect(catB.name).toBe('Second')
      expect(catB.type).toBe('user')
      expect(catB.createdAt).toBe('2024-01-02T00:00:00.000Z')
    })
  })

  // ── uncategorizedCards ──

  describe('uncategorizedCards', () => {
    it('returns cards from the uncategorized viewOrder', () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Orphan 1' }),
        makeCard({ id: 'card-2', name: 'Orphan 2' }),
        makeCard({ id: 'card-3', name: 'Categorized', categoryIds: ['cat-1'] }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1', 'card-2', 'card-3'] },
        { viewType: 'uncategorized', cardIds: ['card-1', 'card-2'] },
      ]

      const { uncategorizedCards } = useCategories()

      expect(uncategorizedCards).toHaveLength(2)
      expect(uncategorizedCards.map((c) => c.id)).toEqual(['card-1', 'card-2'])
    })

    it('returns empty array when no uncategorized viewOrder exists', () => {
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: [] },
      ]

      const { uncategorizedCards } = useCategories()
      expect(uncategorizedCards).toEqual([])
    })

    it('skips card IDs missing from the cards array', () => {
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: [] },
        { viewType: 'uncategorized', cardIds: ['card-1', 'card-missing'] },
      ]
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Present' }),
      ]

      const { uncategorizedCards } = useCategories()
      expect(uncategorizedCards).toHaveLength(1)
      expect(uncategorizedCards[0].id).toBe('card-1')
    })
  })

  // ── FR-016: REMOVE_CARD_FROM_CATEGORY reducer guard ──

  describe('REMOVE_CARD_FROM_CATEGORY', () => {
    const defaultState = {
      data: {
        version: 1 as const,
        cards: [] as Card[],
        categories: [] as Category[],
        viewOrders: [
          { viewType: 'allCards' as const, cardIds: [] as string[] },
          { viewType: 'uncategorized' as const, cardIds: [] as string[] },
        ],
      },
      currentView: 'allCards' as const,
      searchQuery: '',
      isLoading: false,
      loadError: null as string | null,
      loadRetryCount: 0,
      saveError: null as string | null,
    }

    it('blocks removing a card from its only category', () => {
      const state = {
        ...defaultState,
        data: {
          ...defaultState.data,
          cards: [
            makeCard({ id: 'card-1', name: 'Lone Card', categoryIds: ['cat-1'] }),
          ],
          categories: [
            makeCategory({ id: 'cat-1', name: 'Only Category' }),
          ],
          viewOrders: [
            { viewType: 'allCards' as const, cardIds: ['card-1'] },
            { viewType: 'category:cat-1' as const, cardIds: ['card-1'] },
            { viewType: 'uncategorized' as const, cardIds: [] },
          ],
        },
      }

      const next = appReducer(state, {
        type: 'REMOVE_CARD_FROM_CATEGORY',
        cardId: 'card-1',
        categoryId: 'cat-1',
      })

      // Card must retain its only category
      expect(next.data.cards[0].categoryIds).toEqual(['cat-1'])
      // Card still in that category's viewOrder
      const catViewOrder = next.data.viewOrders.find(
        vo => vo.viewType === 'category:cat-1'
      )
      expect(catViewOrder!.cardIds).toContain('card-1')
      // Card not moved to uncategorized
      const uncatViewOrder = next.data.viewOrders.find(
        vo => vo.viewType === 'uncategorized'
      )
      expect(uncatViewOrder!.cardIds).not.toContain('card-1')
    })

    it('succeeds removing a card from a category when it has 2+ categories', () => {
      const state = {
        ...defaultState,
        data: {
          ...defaultState.data,
          cards: [
            makeCard({
              id: 'card-1',
              name: 'Multi Cat Card',
              categoryIds: ['cat-1', 'cat-2'],
            }),
          ],
          categories: [
            makeCategory({ id: 'cat-1', name: 'Work' }),
            makeCategory({ id: 'cat-2', name: 'Personal' }),
          ],
          viewOrders: [
            { viewType: 'allCards' as const, cardIds: ['card-1'] },
            { viewType: 'category:cat-1' as const, cardIds: ['card-1'] },
            { viewType: 'category:cat-2' as const, cardIds: ['card-1'] },
            { viewType: 'uncategorized' as const, cardIds: [] },
          ],
        },
      }

      const next = appReducer(state, {
        type: 'REMOVE_CARD_FROM_CATEGORY',
        cardId: 'card-1',
        categoryId: 'cat-1',
      })

      // Card still has the other category
      expect(next.data.cards[0].categoryIds).toEqual(['cat-2'])
      // Card removed from cat-1 viewOrder
      const cat1Vo = next.data.viewOrders.find(
        vo => vo.viewType === 'category:cat-1'
      )
      expect(cat1Vo!.cardIds).not.toContain('card-1')
      // Card still in cat-2 viewOrder
      const cat2Vo = next.data.viewOrders.find(
        vo => vo.viewType === 'category:cat-2'
      )
      expect(cat2Vo!.cardIds).toContain('card-1')
    })

    it('removes card from category viewOrder after successful removal', () => {
      const state = {
        ...defaultState,
        data: {
          ...defaultState.data,
          cards: [
            makeCard({
              id: 'card-1',
              name: 'Card A',
              categoryIds: ['cat-1', 'cat-2'],
            }),
            makeCard({
              id: 'card-2',
              name: 'Card B',
              categoryIds: ['cat-1'],
            }),
          ],
          categories: [
            makeCategory({ id: 'cat-1', name: 'Work' }),
            makeCategory({ id: 'cat-2', name: 'Personal' }),
          ],
          viewOrders: [
            { viewType: 'allCards' as const, cardIds: ['card-1', 'card-2'] },
            { viewType: 'category:cat-1' as const, cardIds: ['card-1', 'card-2'] },
            { viewType: 'category:cat-2' as const, cardIds: ['card-1'] },
            { viewType: 'uncategorized' as const, cardIds: [] },
          ],
        },
      }

      const next = appReducer(state, {
        type: 'REMOVE_CARD_FROM_CATEGORY',
        cardId: 'card-1',
        categoryId: 'cat-1',
      })

      // cat-1 viewOrder no longer contains card-1
      const cat1Vo = next.data.viewOrders.find(
        vo => vo.viewType === 'category:cat-1'
      )
      expect(cat1Vo!.cardIds).toEqual(['card-2'])
      // cat-2 viewOrder unchanged for card-1
      const cat2Vo = next.data.viewOrders.find(
        vo => vo.viewType === 'category:cat-2'
      )
      expect(cat2Vo!.cardIds).toEqual(['card-1'])
      // allCards viewOrder unaffected
      const allVo = next.data.viewOrders.find(
        vo => vo.viewType === 'allCards'
      )
      expect(allVo!.cardIds).toEqual(['card-1', 'card-2'])
    })
  })
})
