/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { FileCard } from '../../src/renderer/components/file-card'
import type { Card, ViewType } from '../../src/shared/types'

// ── Mock FileTypeMark to render extension text for easy querying ──
vi.mock('../../src/renderer/components/file-type-mark', () => ({
  FileTypeMark: ({ extension }: { extension: string; fileName: string }) => (
    <span data-testid="file-type-mark">{extension}</span>
  ),
}))

const VIEW_ALL: ViewType = 'allCards'

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    name: '测试卡片',
    note: '第一行备注\n第二行备注\n第三行备注',
    fileReference: {
      absolutePath: 'C:/test/file.pdf',
      fileName: 'file',
      extension: 'pdf',
      fileSize: 1024,
      mtimeMs: 1234567890,
    },
    categoryIds: ['cat-1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('FileCard', () => {
  let onOpenFile: ReturnType<typeof vi.fn>
  let onShowMenu: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onOpenFile = vi.fn()
    onShowMenu = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  // ── Test 1: renders card name with heading font ──
  it('renders card name with heading font', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('测试卡片')
  })

  // ── Test 2: renders file-type-mark with correct extension ──
  it('renders file-type-mark with correct extension', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    expect(screen.getByTestId('file-type-mark')).toHaveTextContent('pdf')
  })

  // ── Test 3: renders note when note exists ──
  it('renders note when note exists', () => {
    const card = createCard({ note: '第一行\n第二行' })
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const noteEl = document.querySelector('.qc-file-card__note')
    expect(noteEl).toBeInTheDocument()
    expect(noteEl?.textContent).toBe('第一行\n第二行')
  })

  // ── Test 4: does NOT render note placeholder when note is null ──
  it('does not render note when note is null', () => {
    const card = createCard({ note: null })
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    // There should be no paragraph element with class qc-file-card__note
    const noteEls = document.querySelectorAll('.qc-file-card__note')
    expect(noteEls.length).toBe(0)
  })

  // ── Test 5: card body click calls onOpenFile with card.id ──
  it('card body click calls onOpenFile with card.id', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const body = document.querySelector('.qc-file-card__body') as HTMLElement
    expect(body).not.toBeNull()
    fireEvent.click(body)
    expect(onOpenFile).toHaveBeenCalledTimes(1)
    expect(onOpenFile).toHaveBeenCalledWith('card-1')
  })

  // ── Test 6: card body Enter key calls onOpenFile ──
  it('card body Enter key calls onOpenFile', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const body = document.querySelector('.qc-file-card__body') as HTMLElement
    expect(body).not.toBeNull()
    fireEvent.keyDown(body, { key: 'Enter' })
    expect(onOpenFile).toHaveBeenCalledTimes(1)
    expect(onOpenFile).toHaveBeenCalledWith('card-1')
  })

  // ── Test 7: body click does NOT call onOpenFile when isReorderMode=true ──
  it('does not call onOpenFile on click when isReorderMode is true', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={true}
      />
    )
    const body = document.querySelector('.qc-file-card__body') as HTMLElement
    expect(body).not.toBeNull()
    fireEvent.click(body)
    expect(onOpenFile).not.toHaveBeenCalled()
  })

  // ── Test 8: more button click calls onShowMenu ──
  it('more button click calls onShowMenu', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const moreBtn = screen.getByRole('button', { name: `更多操作：${card.name}` })
    fireEvent.click(moreBtn)
    expect(onShowMenu).toHaveBeenCalledTimes(1)
    expect(onShowMenu).toHaveBeenCalledWith('card-1', expect.any(Object))
  })

  // ── Test 9: has correct ARIA: role="article", aria-posinset, aria-setsize ──
  it('has correct ARIA attributes: article role, posinset, setsize', () => {
    const card = createCard()
    render(
      <FileCard
        card={card}
        index={2}
        total={10}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-posinset', '2')
    expect(article).toHaveAttribute('aria-setsize', '10')
  })

  // ── Test 10: body aria-label is "打开：{card.name}" ──
  it('body aria-label is "打开：{card.name}"', () => {
    const card = createCard({ name: '测试文档' })
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const body = document.querySelector('.qc-file-card__body') as HTMLElement
    expect(body).toHaveAttribute('aria-label', '打开：测试文档')
  })

  // ── Test 11: more button aria-label is "更多操作：{card.name}" ──
  it('more button aria-label is "更多操作：{card.name}"', () => {
    const card = createCard({ name: '测试文档' })
    render(
      <FileCard
        card={card}
        index={0}
        total={5}
        viewType={VIEW_ALL}
        onOpenFile={onOpenFile}
        onShowMenu={onShowMenu}
        isReorderMode={false}
      />
    )
    const moreBtn = screen.getByRole('button', { name: /更多操作/ })
    expect(moreBtn).toHaveAttribute('aria-label', '更多操作：测试文档')
  })
})
