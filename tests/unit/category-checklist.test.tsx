/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { CategoryChecklist } from '../../src/renderer/components/category-checklist'
import type { Category } from '../../src/shared/types'

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

// ── Tests ──

describe('CategoryChecklist', () => {
  let onChange: ReturnType<typeof vi.fn>
  let onCreateNew: ReturnType<typeof vi.fn>

  const categories: Category[] = [
    makeCategory({ id: 'cat-1', name: '工作' }),
    makeCategory({ id: 'cat-2', name: '个人' }),
  ]

  beforeEach(() => {
    onChange = vi.fn()
    onCreateNew = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  // ── FR-015: 未分类 is disabled ──

  it('renders "未分类" item with disabled checkbox', () => {
    render(
      <CategoryChecklist
        categories={categories}
        selectedIds={['cat-1']}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    )

    // The 未分类 checkbox should be rendered and disabled
    const uncategorizedCheckbox = screen.getByRole('checkbox', { name: '未分类' })
    expect(uncategorizedCheckbox).toBeInTheDocument()
    expect(uncategorizedCheckbox).toBeDisabled()

    // Regular category checkboxes should NOT be disabled
    const workCheckbox = screen.getByRole('checkbox', { name: '工作' })
    expect(workCheckbox).not.toBeDisabled()
  })

  it('clicking "未分类" does NOT toggle its selection or call onChange', () => {
    render(
      <CategoryChecklist
        categories={categories}
        selectedIds={['cat-1']}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    )

    const uncategorizedCheckbox = screen.getByRole('checkbox', { name: '未分类' })
    expect(uncategorizedCheckbox).toBeDisabled()

    // Attempt to click the disabled checkbox
    fireEvent.click(uncategorizedCheckbox)

    // onChange should NOT have been called because the input is disabled
    expect(onChange).not.toHaveBeenCalled()
  })

  it('regular user category checkboxes are clickable and toggle normally', () => {
    render(
      <CategoryChecklist
        categories={categories}
        selectedIds={['cat-1']}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    )

    // Click the unselected "个人" checkbox → should select it
    const personalCheckbox = screen.getByRole('checkbox', { name: '个人' })
    expect(personalCheckbox).not.toBeDisabled()
    fireEvent.click(personalCheckbox)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['cat-1', 'cat-2'])

    // Click the selected "工作" checkbox → should deselect it
    onChange.mockClear()
    const workCheckbox = screen.getByRole('checkbox', { name: '工作' })
    expect(workCheckbox).toBeChecked()
    fireEvent.click(workCheckbox)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([])
  })
})
