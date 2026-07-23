import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import type { Card } from '../../src/shared/types'
import { useCards } from '../../src/renderer/hooks/useCards'

// ── Hoisted mocks ──
// These are created before module mocks run, so vi.mock factories can close over them.

const mocks = vi.hoisted(() => {
  const state: {
    data: {
      version: number
      cards: Card[]
      categories: { id: string; name: string; order: number; type: 'user'; createdAt: string }[]
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
      getPlatform: vi.fn().mockReturnValue('win32'),
      saveAppData: vi.fn().mockResolvedValue({ success: true }),
      readHtmlTitle: vi.fn().mockResolvedValue(null),
      getAppData: vi.fn().mockResolvedValue({ data: undefined }),
    },
    randomUUID: vi.fn().mockReturnValue('00000000-0000-0000-0000-000000000001'),
  }
})

// ── Module mocks ──
// Must be at top level — vitest hoists these above imports.

vi.mock('../../src/renderer/contexts/AppState', () => ({
  useAppState: () => ({ state: mocks.state }),
  useAppDispatch: () => mocks.dispatch,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: <T>(fn: () => T): T => fn(),
    useCallback: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  }
})

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

describe('useCards', () => {
  beforeAll(() => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID })
    vi.stubGlobal('window', { electronAPI: mocks.electronAPI })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  // ── addCard ──

  describe('addCard', () => {
    it('creates card with proper defaults (UUID, createdAt, etc.)', async () => {
      const { addCard } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: 'C:\\Users\\test\\document.pdf',
          fileName: 'document',
          extension: 'pdf',
          fileSize: 2048,
          mtimeMs: 1234567890,
        },
      }

      const result = await addCard(fileResult, 'My Document', ['cat-1'])

      expect(result).not.toBeNull()
      expect(result!.id).toBe('00000000-0000-0000-0000-000000000001')
      expect(result!.name).toBe('My Document')
      expect(result!.note).toBeNull()
      expect(result!.categoryIds).toEqual(['cat-1'])
      // path should be normalized (backslash -> forward slash, drive letter uppercased)
      expect(result!.fileReference.absolutePath).toBe('C:/Users/test/document.pdf')
      expect(result!.fileReference.fileName).toBe('document')
      expect(result!.fileReference.extension).toBe('pdf')
      expect(result!.fileReference.fileSize).toBe(2048)
      expect(result!.fileReference.mtimeMs).toBe(1234567890)
      // timestamps are valid ISO strings
      expect(result!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(result!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // dispatch was called with ADD_CARD action
      expect(mocks.dispatch).toHaveBeenCalledTimes(1)
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'ADD_CARD',
        card: expect.objectContaining({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'My Document',
          categoryIds: ['cat-1'],
        }),
      })

      // saveAppData was called for persistence
      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      expect(savedData.cards).toHaveLength(1)
      expect(savedData.cards[0].id).toBe('00000000-0000-0000-0000-000000000001')

      // readHtmlTitle should NOT be called for non-HTML files
      expect(mocks.electronAPI.readHtmlTitle).not.toHaveBeenCalled()
    })

    it('extracts HTML title for HTML files when name is empty', async () => {
      mocks.electronAPI.readHtmlTitle.mockResolvedValueOnce('HTML Page Title')

      const { addCard } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: '/Users/test/page.html',
          fileName: 'page',
          extension: 'html',
          fileSize: 5000,
          mtimeMs: 1234567890,
        },
      }

      const result = await addCard(fileResult, '', ['cat-1'])

      expect(result).not.toBeNull()
      expect(result!.name).toBe('HTML Page Title')
      expect(mocks.electronAPI.readHtmlTitle).toHaveBeenCalledWith('/Users/test/page.html')
    })

    it('falls back to filename when name is empty and no HTML title', async () => {
      const { addCard } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: '/Users/test/report.pdf',
          fileName: 'report',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 1234567890,
        },
      }

      const result = await addCard(fileResult, '', ['cat-1'])

      expect(result).not.toBeNull()
      expect(result!.name).toBe('report')
    })

    it('returns null when file selection is canceled', async () => {
      const { addCard } = useCards()
      const result = await addCard(
        { canceled: true },
        'Canceled',
        []
      )
      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('detects duplicate source file via normalized path', async () => {
      // Set up state with an existing card
      mocks.state.data.cards = [
        makeCard({
          id: 'existing-1',
          name: 'Existing Doc',
          fileReference: {
            absolutePath: 'C:/Users/test/existing.txt',
            fileName: 'existing',
            extension: 'txt',
            fileSize: 512,
            mtimeMs: 2000,
          },
          categoryIds: ['cat-1'],
        }),
      ]

      const { addCard } = useCards()

      // Same path but with backslashes and lowercase drive letter — should normalize to match
      const fileResult = {
        canceled: false,
        file: {
          absolutePath: 'c:\\Users\\test\\existing.txt',
          fileName: 'existing',
          extension: 'txt',
          fileSize: 512,
          mtimeMs: 2000,
        },
      }

      const result = await addCard(fileResult, 'Duplicate Attempt', ['cat-2'])

      expect(result).toBeNull()
      expect(mocks.dispatch).not.toHaveBeenCalled()
      expect(mocks.electronAPI.saveAppData).not.toHaveBeenCalled()
    })

    it('allows adding a file with different normalized path', async () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'existing-1',
          fileReference: {
            absolutePath: 'C:/different/path.txt',
            fileName: 'path',
            extension: 'txt',
            fileSize: 100,
            mtimeMs: 0,
          },
        }),
      ]

      const { addCard } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: 'C:/Users/test/new.txt',
          fileName: 'new',
          extension: 'txt',
          fileSize: 200,
          mtimeMs: 3000,
        },
      }

      const result = await addCard(fileResult, 'New File', ['cat-1'])
      expect(result).not.toBeNull()
      expect(mocks.dispatch).toHaveBeenCalledTimes(1)
    })
  })

  // ── updateCard ──

  describe('updateCard', () => {
    it('updates card name and note correctly', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Old Name', note: 'Old note' }),
      ]

      const { updateCard } = useCards()

      await updateCard('card-1', { name: 'New Name', note: 'New note content' })

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CARD',
        cardId: 'card-1',
        updates: { name: 'New Name', note: 'New note content' },
      })

      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const updated = savedData.cards.find((c: Card) => c.id === 'card-1')
      expect(updated.name).toBe('New Name')
      expect(updated.note).toBe('New note content')
    })

    it('updates categoryIds and adjusts viewOrders accordingly', async () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          name: 'Multi Category',
          categoryIds: ['cat-old'],
        }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'category:cat-old', cardIds: ['card-1'] },
        { viewType: 'category:cat-new', cardIds: [] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      const { updateCard } = useCards()

      await updateCard('card-1', { categoryIds: ['cat-new'] })

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CARD',
        cardId: 'card-1',
        updates: { categoryIds: ['cat-new'] },
      })

      // saveAppData should reflect view order changes
      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const catOldVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'category:cat-old'
      )
      expect(catOldVo.cardIds).not.toContain('card-1')
      const catNewVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'category:cat-new'
      )
      expect(catNewVo.cardIds).toContain('card-1')
    })
  })

  // ── deleteCard ──

  describe('deleteCard', () => {
    it('removes card and removes it from all viewOrders', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'To Delete', categoryIds: ['cat-1'] }),
        makeCard({ id: 'card-2', name: 'Keep Me' }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1', 'card-2'] },
        { viewType: 'category:cat-1', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      const { deleteCard } = useCards()

      await deleteCard('card-1')

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'DELETE_CARD',
        cardId: 'card-1',
      })

      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]

      // Card removed from cards array
      expect(savedData.cards).toHaveLength(1)
      expect(savedData.cards[0].id).toBe('card-2')

      // Card removed from all viewOrders
      const allCardsVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'allCards'
      )
      expect(allCardsVo.cardIds).toEqual(['card-2'])

      const cat1Vo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'category:cat-1'
      )
      expect(cat1Vo.cardIds).not.toContain('card-1')
    })
  })

  // ── visibleCards ──

  describe('visibleCards', () => {
    const sharedCards: Card[] = [
      makeCard({ id: 'card-a', name: 'Alpha', categoryIds: ['cat-1'] }),
      makeCard({ id: 'card-b', name: 'Beta', categoryIds: ['cat-2'] }),
      makeCard({ id: 'card-c', name: 'Gamma', categoryIds: ['cat-1'] }),
    ]

    it('returns cards in viewOrder sequence for the current view', () => {
      mocks.state.data.cards = sharedCards
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-c', 'card-b'] },
        { viewType: 'category:cat-1', cardIds: ['card-c', 'card-a'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.state.currentView = 'category:cat-1'

      const { visibleCards } = useCards()

      expect(visibleCards).toHaveLength(2)
      // Order respects viewOrder.cardIds sequence
      expect(visibleCards[0].id).toBe('card-c')
      expect(visibleCards[1].id).toBe('card-a')
    })

    it('returns empty array when no viewOrder exists for current view', () => {
      mocks.state.data.cards = sharedCards
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-b', 'card-c'] },
      ]

      mocks.state.currentView = 'category:nonexistent'

      const { visibleCards } = useCards()
      expect(visibleCards).toEqual([])
    })

    it('filters by searchQuery (case-insensitive, matches name)', () => {
      mocks.state.data.cards = sharedCards
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-b', 'card-c'] },
      ]

      mocks.state.searchQuery = 'beta'

      const { visibleCards } = useCards()
      expect(visibleCards).toHaveLength(1)
      expect(visibleCards[0].id).toBe('card-b')
    })

    it('filters by searchQuery (matches note content)', () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-a', name: 'Alpha', note: 'important document' }),
        makeCard({ id: 'card-b', name: 'Beta', note: 'just a draft' }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-b'] },
      ]

      mocks.state.searchQuery = 'important'

      const { visibleCards } = useCards()
      expect(visibleCards).toHaveLength(1)
      expect(visibleCards[0].id).toBe('card-a')
    })

    it('filters by searchQuery within a category view', () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-a', name: 'Alpha Project', note: null, categoryIds: ['cat-1'] }),
        makeCard({ id: 'card-b', name: 'Beta App', note: 'alpha component', categoryIds: ['cat-1'] }),
        makeCard({ id: 'card-c', name: 'Gamma Tool', note: null, categoryIds: ['cat-1'] }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-b', 'card-c'] },
        { viewType: 'category:cat-1', cardIds: ['card-a', 'card-b', 'card-c'] },
      ]

      mocks.state.currentView = 'category:cat-1'
      mocks.state.searchQuery = 'alpha'

      const { visibleCards } = useCards()
      expect(visibleCards).toHaveLength(2)
      expect(visibleCards.map((c) => c.id)).toEqual(['card-a', 'card-b'])
    })

    it('returns all cards when searchQuery is empty', () => {
      mocks.state.data.cards = sharedCards
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-b', 'card-c'] },
      ]

      mocks.state.searchQuery = ''

      const { visibleCards } = useCards()
      expect(visibleCards).toHaveLength(3)
    })

    it('skips orphan card IDs (card missing from cards array)', () => {
      mocks.state.data.cards = [makeCard({ id: 'card-a', name: 'Alpha' })]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-a', 'card-missing'] },
      ]

      const { visibleCards } = useCards()
      expect(visibleCards).toHaveLength(1)
      expect(visibleCards[0].id).toBe('card-a')
    })
  })

  // ── repairFile ──

  describe('repairFile', () => {
    it('updates fileReference while preserving name, note, categoryIds, and orders', async () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          name: 'Original Name',
          note: 'Some notes',
          categoryIds: ['cat-1'],
          fileReference: {
            absolutePath: '/old/path.txt',
            fileName: 'old',
            extension: 'txt',
            fileSize: 100,
            mtimeMs: 0,
          },
        }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'category:cat-1', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      const { repairFile } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      }

      await repairFile('card-1', fileResult)

      // dispatch was called with UPDATE_CARD and only fileReference
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CARD',
        cardId: 'card-1',
        updates: {
          fileReference: {
            absolutePath: '/new/path.pdf',
            fileName: 'new',
            extension: 'pdf',
            fileSize: 5000,
            mtimeMs: 999999,
          },
        },
      })

      // saveAppData was called
      expect(mocks.electronAPI.saveAppData).toHaveBeenCalledTimes(1)
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const updatedCard = savedData.cards.find((c: { id: string }) => c.id === 'card-1')
      // name preserved
      expect(updatedCard.name).toBe('Original Name')
      // note preserved
      expect(updatedCard.note).toBe('Some notes')
      // categoryIds preserved
      expect(updatedCard.categoryIds).toEqual(['cat-1'])
      // fileReference updated
      expect(updatedCard.fileReference.absolutePath).toBe('/new/path.pdf')
      expect(updatedCard.fileReference.fileName).toBe('new')
      expect(updatedCard.fileReference.extension).toBe('pdf')
      expect(updatedCard.fileReference.fileSize).toBe(5000)
      expect(updatedCard.fileReference.mtimeMs).toBe(999999)
    })

    it('normalizes the file path during repair', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'To Repair' }),
      ]

      const { repairFile } = useCards()

      const fileResult = {
        canceled: false,
        file: {
          absolutePath: 'c:\\Users\\test\\repaired.docx',
          fileName: 'repaired',
          extension: 'docx',
          fileSize: 3000,
          mtimeMs: 55555,
          isHtml: false,
        },
      }

      await repairFile('card-1', fileResult)

      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CARD',
        cardId: 'card-1',
        updates: {
          fileReference: expect.objectContaining({
            absolutePath: 'C:/Users/test/repaired.docx',
          }),
        },
      })
    })

    it('returns early when file selection is canceled', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Test' }),
      ]

      const { repairFile } = useCards()

      await repairFile('card-1', { canceled: true })

      expect(mocks.dispatch).not.toHaveBeenCalled()
      expect(mocks.electronAPI.saveAppData).not.toHaveBeenCalled()
    })

    it('returns early when file is missing from result', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Test' }),
      ]

      const { repairFile } = useCards()

      await repairFile('card-1', { canceled: false })

      expect(mocks.dispatch).not.toHaveBeenCalled()
      expect(mocks.electronAPI.saveAppData).not.toHaveBeenCalled()
    })
  })

  // ── findDuplicateByPath ──

  describe('findDuplicateByPath', () => {
    it('returns the matching card when a file with the same path exists', () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          fileReference: { absolutePath: '/same/path.txt', fileName: 'path', extension: 'txt', fileSize: 100, mtimeMs: 0 },
        }),
      ]

      const { findDuplicateByPath } = useCards()
      const found = findDuplicateByPath('/same/path.txt')
      expect(found).not.toBeUndefined()
      expect(found!.id).toBe('card-1')
    })

    it('returns undefined when no card has the given path', () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          fileReference: { absolutePath: '/other/path.txt', fileName: 'other', extension: 'txt', fileSize: 100, mtimeMs: 0 },
        }),
      ]

      const { findDuplicateByPath } = useCards()
      expect(findDuplicateByPath('/nonexistent.txt')).toBeUndefined()
    })
  })
})
