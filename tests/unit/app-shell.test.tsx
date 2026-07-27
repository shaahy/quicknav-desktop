/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppShell } from '../../src/renderer/components/app-shell'
import type { Card, Category, ViewType } from '../../src/shared/types'

// ── Shared mutable state for hooks that tests can modify ──
// NOTE: use string literals for ViewType constants because vi.mock
// factories are hoisted and regular imports aren't available yet.

const mockStateRef = vi.hoisted(() => ({
  data: {
    version: 2 as const,
    cards: [] as any[],
    categories: [] as any[],
    viewOrders: [
      { viewType: 'allCards', cardIds: [] as string[] },
      { viewType: 'uncategorized', cardIds: [] as string[] },
    ],
  },
  currentView: 'allCards',
  searchQuery: '',
  isLoading: false,
  loadError: null as string | null,
  saveError: null as string | null,
}))

const mockVisibleCards = vi.hoisted(() => ({ current: [] as Card[] }))
const mockCategories = vi.hoisted(() => ({ current: [] as Category[] }))

// ── Hook mocks ──

vi.mock('../../src/renderer/contexts/AppState', () => ({
  useAppState: () => ({ state: mockStateRef }),
  useAppDispatch: () => vi.fn(),
}))

vi.mock('../../src/renderer/hooks/useCards', () => ({
  useCards: () => ({
    visibleCards: mockVisibleCards.current,
    addCard: vi.fn(),
    addCardsBatch: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    repairFile: vi.fn(),
    findDuplicateByPath: vi.fn(),
  }),
}))

vi.mock('../../src/renderer/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: mockCategories.current,
    uncategorizedCards: [],
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    deleteCategory: vi.fn(),
    reorderCategories: vi.fn(),
  }),
}))

vi.mock('../../src/renderer/components/global-search', () => ({
  GlobalSearch: () => null,
}))

vi.mock('../../src/renderer/hooks/useFileRepair', () => ({
  useFileRepair: () => ({
    repairFile: vi.fn(),
    getFailureCount: vi.fn(),
    incrementFailure: vi.fn(),
    resetFailureCount: vi.fn(),
  }),
}))

// ── Factory helpers ──

function makeCard(id: string, name: string): Card {
  return {
    id,
    name,
    note: null,
    fileReference: {
      relativePath: `C:/test/${name}.pdf`,
      fileName: name,
      extension: 'pdf',
      fileSize: 1024,
      mtimeMs: 1234567890,
    },
    categoryIds: ['cat-1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeCategory(id: string, name: string, order: number): Category {
  return {
    id,
    name,
    order,
    type: 'user' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('AppShell', () => {
  let retryLoad: ReturnType<typeof vi.fn>
  let quitApp: ReturnType<typeof vi.fn>

  beforeEach(() => {
    retryLoad = vi.fn()
    quitApp = vi.fn()
    // Reset shared mutable state
    mockStateRef.data = {
      version: 2,
      cards: [],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: [] },
        { viewType: 'uncategorized', cardIds: [] },
      ],
    }
    mockStateRef.currentView = 'allCards'
    mockStateRef.searchQuery = ''
    mockStateRef.isLoading = false
    mockStateRef.loadError = null
    mockStateRef.saveError = null
    mockVisibleCards.current = []
    mockCategories.current = []
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // ── Test 1: loading state shows loading text, no interactive controls ──
  it('shows loading text and no interactive controls in loading state', () => {
    render(
      <AppShell loadingState="loading" retryLoad={retryLoad} quitApp={quitApp} />
    )
    expect(screen.getByText('正在加载本地数据...')).toBeInTheDocument()
    // No buttons or focusable controls in loading state
    const buttons = document.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('transitions from loading to ready without changing the hook order', () => {
    const { rerender } = render(
      <AppShell loadingState="loading" retryLoad={retryLoad} quitApp={quitApp} />
    )

    expect(screen.getByText('正在加载本地数据...')).toBeInTheDocument()

    expect(() => {
      rerender(
        <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
      )
    }).not.toThrow()
    expect(screen.getAllByText('新建卡片').length).toBe(2)
  })

  // ── Test 2: error overlay shows error title with retry and quit buttons ──
  it('shows error overlay with retry and quit buttons in error state', () => {
    render(
      <AppShell loadingState="error" loadError="unknown" retryLoad={retryLoad} quitApp={quitApp} />
    )
    expect(screen.getByText('无法加载本地数据')).toBeInTheDocument()
    expect(screen.getByText('重试')).toBeInTheDocument()
    expect(screen.getByText('退出')).toBeInTheDocument()
  })

  // ── Test 3: error overlay retry button calls retryLoad ──
  it('retry button in error overlay calls retryLoad', () => {
    render(
      <AppShell loadingState="error" loadError="unknown" retryLoad={retryLoad} quitApp={quitApp} />
    )
    const retryBtn = screen.getByText('重试')
    fireEvent.click(retryBtn)
    expect(retryLoad).toHaveBeenCalledTimes(1)
  })

  it('quit button in error overlay calls quitApp', () => {
    render(
      <AppShell loadingState="error" loadError="unknown" retryLoad={retryLoad} quitApp={quitApp} />
    )

    fireEvent.click(screen.getByText('退出'))

    expect(quitApp).toHaveBeenCalledTimes(1)
  })

  // ── Test 4: ready + no cards shows empty-state with "新建卡片" ──
  it('shows empty state with new-card button when ready and no cards', () => {
    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )
    expect(screen.getAllByText('新建卡片').length).toBe(2)
    // Should not render any file card articles
    const articles = document.querySelectorAll('[role="article"]')
    expect(articles.length).toBe(0)
  })

  it('opens the scan dialog from the top toolbar', () => {
    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )

    fireEvent.click(screen.getByRole('button', { name: '扫描' }))

    expect(
      screen.getByRole('dialog', { name: '扫描批量添加卡片' })
    ).toBeInTheDocument()
    expect(screen.getByText('扫描类型（可多选）')).toBeInTheDocument()
  })

  it('places the scan button after organize when cards exist', () => {
    const card = makeCard('card-1', '文档一')
    mockStateRef.data.cards = [card]
    mockStateRef.data.viewOrders = [
      { viewType: 'allCards', cardIds: ['card-1'] },
      { viewType: 'uncategorized', cardIds: [] },
    ]
    mockVisibleCards.current = [card]

    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )

    const toolbar = document.querySelector('.qc-app-shell__toolbar-buttons')
    const labels = Array.from(toolbar?.querySelectorAll('button') ?? [])
      .map(button => button.textContent)
    expect(labels).toEqual(['新建卡片', '整理排序', '扫描'])
  })

  // ── Test 5: ready + has cards shows file card grid with correct count ──
  it('shows card grid with correct number of cards when ready and has cards', () => {
    const cards = [
      makeCard('card-1', '文档一'),
      makeCard('card-2', '文档二'),
      makeCard('card-3', '文档三'),
    ]
    mockStateRef.data.cards = cards
    mockStateRef.data.viewOrders = [
      { viewType: 'allCards', cardIds: ['card-1', 'card-2', 'card-3'] },
      { viewType: 'uncategorized', cardIds: [] },
    ]
    mockVisibleCards.current = cards
    mockCategories.current = [makeCategory('cat-1', '工作', 0)]

    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )
    const articles = screen.getAllByRole('article')
    expect(articles.length).toBe(3)
  })

  it('passes the exact relative markdown path to electronAPI when 工作记录 is opened', async () => {
    const workRecord = makeCard('work-record', '工作记录')
    workRecord.fileReference = {
      ...workRecord.fileReference,
      relativePath: '../A 教程集合/工作记录.md',
      fileName: '工作记录',
      extension: 'md',
    }
    mockStateRef.data.cards = [workRecord]
    mockStateRef.data.viewOrders = [
      { viewType: 'allCards', cardIds: ['work-record'] },
      { viewType: 'uncategorized', cardIds: [] },
    ]
    mockVisibleCards.current = [workRecord]
    const openFile = vi.spyOn(window.electronAPI, 'openFile').mockResolvedValue({})

    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )
    fireEvent.click(screen.getByRole('button', { name: '打开：工作记录' }))

    await waitFor(() => {
      expect(openFile).toHaveBeenCalledWith(
        '../A 教程集合/工作记录.md',
      )
    })
  })

  it('shows the file-selection error without opening the card form', async () => {
    vi.spyOn(window.electronAPI, 'selectFile').mockResolvedValue({
      canceled: false,
      error: '所选文件与工具不在同一磁盘，无法创建相对路径',
    })

    render(
      <AppShell loadingState="ready" retryLoad={retryLoad} quitApp={quitApp} />
    )
    fireEvent.click(screen.getAllByText('新建卡片')[0])

    expect(
      await screen.findByText('所选文件与工具不在同一磁盘，无法创建相对路径'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
