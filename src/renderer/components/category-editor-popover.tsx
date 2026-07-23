import React, { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { validateCategoryName } from '@shared/validation'
import { MAX_CATEGORY_NAME } from '@shared/constants'
import '../styles/components/category-editor-popover.css'

// ── Props ──

interface CategoryEditorPopoverProps {
  /** 'create' for new category, 'rename' for existing category. */
  mode: 'create' | 'rename'
  /** Pre-filled name for rename mode. */
  initialName?: string
  /** Category names that are already taken (for validation). */
  existingNames: string[]
  /** Called with the validated name when user confirms. */
  onSave: (name: string) => void
  /** Called when the dialog is closing without saving. */
  onClose: () => void
  /** Whether the dialog is open. */
  open: boolean
}

// ── Component ──

/**
 * A small dialog (Radix) for creating or renaming a category.
 *
 * - Create mode: empty input, auto-focused.
 * - Rename mode: pre-filled input with text selected, auto-focused.
 * - Validates the name on submit using `validateCategoryName`.
 * - Enter submits, Escape cancels.
 */
export function CategoryEditorPopover({
  mode,
  initialName = '',
  existingNames,
  onSave,
  onClose,
  open,
}: CategoryEditorPopoverProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
      // Auto-focus and select text in rename mode
      const raf = requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          if (mode === 'rename') {
            inputRef.current.select()
          }
        }
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [open, initialName, mode])

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value)
      if (error) {
        setError(null)
      }
    },
    [error]
  )

  const handleSubmit = useCallback(() => {
    const err = validateCategoryName(name, existingNames)
    if (err) {
      setError(err)
      return
    }
    onSave(name.trim())
  }, [name, existingNames, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [handleSubmit, onClose]
  )

  const title = mode === 'create' ? '新建类别' : '重命名类别'
  const saveLabel = mode === 'create' ? '创建' : '保存'

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="qc-category-editor-popover__overlay" />
        <Dialog.Content
          className="qc-category-editor-popover"
          role="dialog"
          aria-labelledby="qc-category-editor-popover-title"
        >
          <Dialog.Title
            className="qc-category-editor-popover__title"
            id="qc-category-editor-popover-title"
          >
            {title}
          </Dialog.Title>

          <div className="qc-category-editor-popover__body">
            <input
              ref={inputRef}
              className="qc-category-editor-popover__input"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_CATEGORY_NAME}
              placeholder="输入类别名称"
              aria-invalid={error !== null}
            />

            {error && (
              <p className="qc-category-editor-popover__error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="qc-category-editor-popover__actions">
            <button
              type="button"
              className="qc-category-editor-popover__btn qc-category-editor-popover__btn--cancel"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className="qc-category-editor-popover__btn qc-category-editor-popover__btn--save"
              onClick={handleSubmit}
            >
              {saveLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
