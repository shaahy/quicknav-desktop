// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFileRepair } from '../../src/renderer/hooks/useFileRepair'
import type { Card } from '../../src/shared/types'
import { CUMULATIVE_FAILURE_THRESHOLD } from '../../src/shared/constants'

// ── Hoisted mocks ──

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
    isLoading: boolean
    loadError: string | null
    saveError: string | null
  } = {
    data: {
      version: 2,
      cards: [],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: [] },
        { viewType: 'uncategorized', cardIds: [] },
      ],
    },
    currentView: 'allCards',
    searchQuery: '',
    isLoading: false,
    loadError: null,
    saveError: null,
  }

  return {
    state,
    dispatch: vi.fn(),
    electronAPI: {
      selectFile: vi.fn(),
      getPlatform: vi.fn().mockReturnValue('win32'),
      saveAppData: vi.fn().mockResolvedValue({ success: true }),
      openFile: vi.fn(),
      showItemInFolder: vi.fn(),
      readHtmlTitle: vi.fn(),
      getAppData: vi.fn(),
      quitApp: vi.fn(),
    },
  }
})

// ── Module mocks ──

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
      relativePath: '/test.txt',
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
    version: 2,
    cards: [],
    categories: [],
    viewOrders: [
      { viewType: 'allCards', cardIds: [] },
      { viewType: 'uncategorized', cardIds: [] },
    ],
  }
  mocks.state.currentView = 'allCards'
  mocks.state.searchQuery = ''
  mocks.state.isLoading = false
  mocks.state.loadError = null
  mocks.state.saveError = null
}

// ── Tests ──

describe('useFileRepair', () => {
  beforeAll(() => {
    // Wire up electronAPI mocks so the hook can call them
    window.electronAPI = mocks.electronAPI as unknown as typeof window.electronAPI
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  describe('repairFile', () => {
    // ── Test 1 ──

    it('updates card fileReference with new file data', async () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          fileReference: {
            relativePath: '/old/path.txt',
            fileName: 'old',
            extension: 'txt',
            fileSize: 100,
            mtimeMs: 0,
          },
        }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('card-1')

      expect(repairResult).toEqual({ result: 'success' })
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_CARD',
        cardId: 'card-1',
        updates: {
          fileReference: {
            relativePath: '/new/path.pdf',
            fileName: 'new',
            extension: 'pdf',
            fileSize: 5000,
            mtimeMs: 999999,
          },
        },
      })
    })

    // ── Test 2 ──

    it('preserves card name, note, and categoryIds during repair', async () => {
      mocks.state.data.cards = [
        makeCard({
          id: 'card-1',
          name: 'Original Name',
          note: 'Important notes about this file',
          categoryIds: ['cat-1'],
          fileReference: {
            relativePath: '/old/path.txt',
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

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      await result.current.repairFile('card-1')

      // The UPDATE_CARD dispatch should only contain fileReference in updates
      const updateCall = mocks.dispatch.mock.calls.find(
        (call: unknown[]) => (call[0] as { type: string })?.type === 'UPDATE_CARD'
      )
      expect(updateCall).toBeDefined()
      const updates = (updateCall[0] as { updates: Record<string, unknown> }).updates
      expect(updates).toEqual({
        fileReference: expect.objectContaining({
          relativePath: '/new/path.pdf',
        }),
      })
      expect(updates.name).toBeUndefined()
      expect(updates.note).toBeUndefined()
      expect(updates.categoryIds).toBeUndefined()

      // Verify via saveAppData that the card's non-file fields are preserved
      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const savedCard = savedData.cards.find((c: Card) => c.id === 'card-1')
      expect(savedCard.name).toBe('Original Name')
      expect(savedCard.note).toBe('Important notes about this file')
      expect(savedCard.categoryIds).toEqual(['cat-1'])
    })

    // ── Test 3 ──

    it('preserves viewOrders for the card', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Test Card', categoryIds: ['cat-1'] }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'category:cat-1', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      await result.current.repairFile('card-1')

      const savedData = mocks.electronAPI.saveAppData.mock.calls[0][0]
      const allCardsVo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'allCards'
      )
      expect(allCardsVo.cardIds).toEqual(['card-1'])

      const cat1Vo = savedData.viewOrders.find(
        (vo: { viewType: string }) => vo.viewType === 'category:cat-1'
      )
      expect(cat1Vo.cardIds).toEqual(['card-1'])
    })

    // ── Test 4 ──

    it('returns { result: "success" } on successful repair', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Success Card' }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('card-1')

      expect(repairResult).toEqual({ result: 'success' })
    })

    // ── Test 5 ──

    it('returns { result: "duplicate" } when duplicate source file detected', async () => {
      // card-2 already references the file we are about to select
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'My Card' }),
        makeCard({
          id: 'card-2',
          name: 'Existing Card',
          fileReference: {
            relativePath: '/shared/file.pdf',
            fileName: 'file',
            extension: 'pdf',
            fileSize: 3000,
            mtimeMs: 111111,
          },
        }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1', 'card-2'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/shared/file.pdf',
          fileName: 'file',
          extension: 'pdf',
          fileSize: 3000,
          mtimeMs: 111111,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('card-1')

      expect(repairResult).toEqual({
        result: 'duplicate',
        duplicateCardId: 'card-2',
        duplicateCardName: 'Existing Card',
      })
      // No UPDATE_CARD dispatch should occur on duplicate
      const updateCalls = mocks.dispatch.mock.calls.filter(
        (call: unknown[]) => (call[0] as { type: string })?.type === 'UPDATE_CARD'
      )
      expect(updateCalls).toHaveLength(0)
    })

    // ── Test 6 ──

    it('returns { result: "canceled" } when card not found', async () => {
      // No cards in state — card-1 does not exist
      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/some/file.pdf',
          fileName: 'file',
          extension: 'pdf',
          fileSize: 1000,
          mtimeMs: 12345,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('nonexistent-card')

      expect(repairResult).toEqual({ result: 'canceled' })
      // No dispatch should be called since the card doesn't exist
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    it('returns the file-selection error without changing the card', async () => {
      mocks.state.data.cards = [makeCard({ id: 'card-1', name: 'My Card' })]
      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        error: '无法访问所选文件',
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('card-1')

      expect(repairResult).toEqual({
        result: 'error',
        errorMessage: '无法访问所选文件',
      })
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })

    // ── Test 7 ──

    it('normalizes the new path before duplicate check', async () => {
      // card-2 has the same file stored in normalized form (forward slashes, uppercase drive)
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'My Card' }),
        makeCard({
          id: 'card-2',
          name: 'Existing Card',
          fileReference: {
            relativePath: 'C:/Users/test/document.pdf',
            fileName: 'document',
            extension: 'pdf',
            fileSize: 2048,
            mtimeMs: 1234567890,
          },
        }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1', 'card-2'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      // selectFile returns a non-normalized path (backslashes, lowercase drive)
      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: 'c:\\Users\\test\\document.pdf',
          fileName: 'document',
          extension: 'pdf',
          fileSize: 2048,
          mtimeMs: 1234567890,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())
      const repairResult = await result.current.repairFile('card-1')

      // Duplicate detected because path is normalized before the check
      expect(repairResult).toEqual({
        result: 'duplicate',
        duplicateCardId: 'card-2',
        duplicateCardName: 'Existing Card',
      })
    })

    // ── Test 8 ──

    it('resets cumulative failure counter after successful repair', async () => {
      mocks.state.data.cards = [
        makeCard({ id: 'card-1', name: 'Test Card' }),
      ]
      mocks.state.data.viewOrders = [
        { viewType: 'allCards', cardIds: ['card-1'] },
        { viewType: 'uncategorized', cardIds: [] },
      ]

      mocks.electronAPI.selectFile.mockResolvedValue({
        canceled: false,
        file: {
          relativePath: '/new/path.pdf',
          fileName: 'new',
          extension: 'pdf',
          fileSize: 5000,
          mtimeMs: 999999,
          isHtml: false,
        },
      })

      const { result } = renderHook(() => useFileRepair())

      // Pre-increment failure counter
      result.current.incrementFailure('card-1')
      result.current.incrementFailure('card-1')
      expect(result.current.getFailureCount('card-1')).toBe(2)

      // Act — successful repair
      await result.current.repairFile('card-1')

      // Assert — counter is reset
      expect(result.current.getFailureCount('card-1')).toBe(0)
    })
  })

  // ── Failure counter helpers ──

  describe('failure counter', () => {
    it('getFailureCount returns 0 for unknown card', () => {
      const { result } = renderHook(() => useFileRepair())
      expect(result.current.getFailureCount('nonexistent')).toBe(0)
    })

    it('incrementFailure increases count and returns new value', () => {
      const { result } = renderHook(() => useFileRepair())
      expect(result.current.incrementFailure('card-1')).toBe(1)
      expect(result.current.incrementFailure('card-1')).toBe(2)
      expect(result.current.getFailureCount('card-1')).toBe(2)
    })

    it('resetFailureCount clears the count for a card', () => {
      const { result } = renderHook(() => useFileRepair())
      result.current.incrementFailure('card-1')
      result.current.incrementFailure('card-1')
      expect(result.current.getFailureCount('card-1')).toBe(2)

      result.current.resetFailureCount('card-1')
      expect(result.current.getFailureCount('card-1')).toBe(0)
    })

    it('isWarningCard returns true when count >= CUMULATIVE_FAILURE_THRESHOLD', () => {
      const { result } = renderHook(() => useFileRepair())
      expect(result.current.isWarningCard('card-1')).toBe(false)

      for (let i = 0; i < CUMULATIVE_FAILURE_THRESHOLD; i++) {
        result.current.incrementFailure('card-1')
      }

      expect(result.current.getFailureCount('card-1')).toBe(CUMULATIVE_FAILURE_THRESHOLD)
      expect(result.current.isWarningCard('card-1')).toBe(true)
    })

    it('isWarningCard returns false when count below threshold', () => {
      const { result } = renderHook(() => useFileRepair())
      result.current.incrementFailure('card-1')
      result.current.incrementFailure('card-1')
      expect(result.current.isWarningCard('card-1')).toBe(false)
    })
  })
})
