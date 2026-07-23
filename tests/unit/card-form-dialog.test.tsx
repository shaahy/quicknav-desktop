/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { CardFormDialog } from '../../src/renderer/components/card-form-dialog'
import type { CardFormData } from '../../src/shared/types'

// ── Mock Radix Dialog ──
// Render inline, no portal. The real Dialog auto-focuses the first
// focusable element; our mock replicates that behaviour.
vi.mock('@radix-ui/react-dialog', async () => {
  const React = await import('react')
  return {
    default: {},
    Root: ({ children, open }: any) =>
      open ? React.createElement('div', { 'data-testid': 'dialog-root' }, children) : null,
    Portal: ({ children }: any) => children,
    Overlay: () => React.createElement('div', { 'data-testid': 'dialog-overlay' }),
    Content: ({ children, role, className, 'aria-labelledby': ariaLabelledby }: any) => {
      const ref = React.useRef(null)
      React.useEffect(() => {
        if (ref.current) {
          const el = ref.current as HTMLElement
          const firstFocusable = el.querySelector<HTMLElement>(
            'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
          )
          firstFocusable?.focus()
        }
      }, [])
      return React.createElement(
        'div',
        { ref, role, className, 'aria-labelledby': ariaLabelledby, 'data-testid': 'dialog-content' },
        children
      )
    },
    Title: ({ children, className, id }: any) =>
      React.createElement('h2', { className, id }, children),
  }
})

// ── Mock FormField ──
vi.mock('../../src/renderer/components/form-field', () => ({
  FormField: ({ type, label, value, error, maxLength, onChange, placeholder }: any) => (
    <div data-testid={`form-field-${label}`} className="qc-form-field">
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea
          data-testid={`input-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : type === 'readonly-path' ? (
        <input
          data-testid={`input-${label}`}
          value={value}
          readOnly
        />
      ) : (
        <input
          data-testid={`input-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {error && <span data-testid={`error-${label}`} role="alert">{error}</span>}
    </div>
  ),
}))

// ── Mock CategoryChecklist ──
vi.mock('../../src/renderer/components/category-checklist', () => ({
  CategoryChecklist: ({ categories, selectedIds, onChange, onCreateNew }: any) => (
    <div data-testid="category-checklist">
      {categories.map((cat: any) => (
        <label key={cat.id}>
          <input
            type="checkbox"
            data-testid={`cat-checkbox-${cat.id}`}
            checked={selectedIds.includes(cat.id)}
            onChange={() => {
              const next = selectedIds.includes(cat.id)
                ? selectedIds.filter((id: string) => id !== cat.id)
                : [...selectedIds, cat.id]
              onChange(next)
            }}
          />
          {cat.name}
        </label>
      ))}
      <button type="button" data-testid="create-category-btn" onClick={onCreateNew}>
        + 新建类别
      </button>
      {selectedIds.length === 0 && (
        <div role="alert" data-testid="category-error">请至少选择一个类别</div>
      )}
    </div>
  ),
}))

// ── Mock useCategories ──
vi.mock('../../src/renderer/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: 'cat-1', name: '工作', order: 0, type: 'user' as const, createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'cat-2', name: '个人', order: 1, type: 'user' as const, createdAt: '2024-01-01T00:00:00.000Z' },
    ],
  }),
}))

describe('CardFormDialog', () => {
  let onSave: ReturnType<typeof vi.fn>
  let onClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSave = vi.fn()
    onClose = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  // ── Test 1: create mode shows name field + category checklist ──
  it('create mode shows name field and category checklist', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    expect(screen.getByTestId('form-field-名称')).toBeInTheDocument()
    expect(screen.getByTestId('category-checklist')).toBeInTheDocument()
    expect(screen.getByText('新建卡片')).toBeInTheDocument()
  })

  // ── Test 2: create mode shows no note field or path field ──
  it('create mode does not show note field or path field', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    expect(screen.queryByTestId('form-field-备注')).not.toBeInTheDocument()
    expect(screen.queryByTestId('form-field-文件路径')).not.toBeInTheDocument()
  })

  // ── Test 3: edit mode shows name + note + category checklist + readonly path ──
  it('edit mode shows name, note, category checklist, and readonly path', () => {
    const initialData: CardFormData = { name: '测试', note: '备注内容', categoryIds: ['cat-1'] }
    render(
      <CardFormDialog
        mode="edit"
        initialData={initialData}
        onSave={onSave}
        onClose={onClose}
        filePath="C:/test/file.pdf"
      />
    )
    expect(screen.getByTestId('form-field-名称')).toBeInTheDocument()
    expect(screen.getByTestId('form-field-备注')).toBeInTheDocument()
    expect(screen.getByTestId('category-checklist')).toBeInTheDocument()
    expect(screen.getByTestId('form-field-文件路径')).toBeInTheDocument()
    expect(screen.getByText('编辑卡片')).toBeInTheDocument()
  })

  // ── Test 4: empty name shows error on save attempt ──
  it('shows name error when saving with empty name', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    // Save button
    const saveBtn = screen.getByText('保存')
    fireEvent.click(saveBtn)
    expect(screen.getByText('名称不能为空')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Test 5: name > 80 chars shows error ──
  it('shows name error when name exceeds 80 characters', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    const nameInput = screen.getByTestId('input-名称')
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(81) } })
    const saveBtn = screen.getByText('保存')
    fireEvent.click(saveBtn)
    expect(screen.getByText('名称最多 80 个字符')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Test 6: no categories selected shows error via CategoryChecklist ──
  it('does not call onSave when no categories selected', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    // Enter a valid name
    const nameInput = screen.getByTestId('input-名称')
    fireEvent.change(nameInput, { target: { value: '有效名称' } })
    // Don't select any category
    const saveBtn = screen.getByText('保存')
    fireEvent.click(saveBtn)
    // onSave should not be called because no categories selected
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Test 7: save button calls onSave with form data when valid ──
  it('calls onSave with form data when all fields valid', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    // Enter valid name
    const nameInput = screen.getByTestId('input-名称')
    fireEvent.change(nameInput, { target: { value: '有效名称' } })
    // Select a category
    const catCheckbox = screen.getByTestId('cat-checkbox-cat-1')
    fireEvent.click(catCheckbox)
    // Click save
    const saveBtn = screen.getByText('保存')
    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      name: '有效名称',
      note: '',
      categoryIds: ['cat-1'],
    })
  })

  // ── Test 8: cancel calls onClose with hasChanges=true when form modified ──
  it('cancel calls onClose with hasChanges=true when form is modified', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    // Modify the name
    const nameInput = screen.getByTestId('input-名称')
    fireEvent.change(nameInput, { target: { value: '修改了' } })
    // Click cancel
    const cancelBtn = screen.getByText('取消')
    fireEvent.click(cancelBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith(true)
  })

  // ── Test 9: cancel calls onClose with hasChanges=false when form unmodified ──
  it('cancel calls onClose with hasChanges=false when form is unmodified', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    const cancelBtn = screen.getByText('取消')
    fireEvent.click(cancelBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith(false)
  })

  // ── Test 10: initial focus is on name field ──
  it('focuses the name field on render', () => {
    render(
      <CardFormDialog
        mode="create"
        initialData={null}
        onSave={onSave}
        onClose={onClose}
      />
    )
    const nameInput = screen.getByTestId('input-名称')
    expect(document.activeElement).toBe(nameInput)
  })
})
