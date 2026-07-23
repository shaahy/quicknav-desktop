import React, { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { FormField } from './form-field'
import { CategoryChecklist } from './category-checklist'
import { useCategories } from '../hooks/useCategories'
import {
  validateCardName,
  validateNote,
  hasUnsavedChanges,
} from '@shared/validation'
import { MAX_CARD_NAME, MAX_NOTE } from '@shared/constants'
import type { CardFormData } from '@shared/types'
import '../styles/components/card-form-dialog.css'

// ── Props ──

interface CardFormDialogProps {
  /** 'create' for new card, 'edit' for existing card. */
  mode: 'create' | 'edit'
  /**
   * For create mode: null (empty form).
   * For edit mode: current CardFormData to populate fields.
   */
  initialData: CardFormData | null
  /** Called with validated form data when user clicks Save. */
  onSave: (data: CardFormData) => void
  /**
   * Called when the dialog is closing (cancel / Escape / overlay click).
   * `hasChanges` indicates whether unsaved edits exist vs `initialData`.
   */
  onClose: (hasChanges: boolean) => void
  /** Absolute file path; shown as readonly field in edit mode. */
  filePath?: string
  /** Called when user clicks "重新选择文件". Optional — button hidden if omitted. */
  onReselectFile?: () => void
}

// ── Component ──

/**
 * Radix dialog for creating or editing a card's form fields.
 *
 * - Create mode: name + category checklist.   Name field auto-focused.
 * - Edit mode:   name + note + category checklist + readonly file path
 *                + "在文件管理器中显示" + "重新选择文件" buttons.
 *
 * "未分类" is always present and disabled in the checklist.
 * Close detection compares current form values against `initialData`.
 */
export function CardFormDialog({
  mode,
  initialData,
  onSave,
  onClose,
  filePath,
  onReselectFile,
}: CardFormDialogProps) {
  const { categories } = useCategories()

  // ── Form state ──

  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)

  // ── Snapshot of initial values for change detection ──

  const [snapshot, setSnapshot] = useState<CardFormData | null>(null)

  // ── Initialise / reset form when dialog opens ──

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setNote(initialData.note)
      setCategoryIds(initialData.categoryIds)
      setSnapshot({ ...initialData })
    } else {
      setName('')
      setNote('')
      setCategoryIds([])
      setSnapshot(null)
    }
    setNameError(null)
    setNoteError(null)
  }, [initialData])

  // ── Handlers ──

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value)
      if (nameError) {
        setNameError(validateCardName(value, []))
      }
    },
    [nameError]
  )

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value)
      if (noteError) {
        setNoteError(validateNote(value))
      }
    },
    [noteError]
  )

  const handleSave = useCallback(() => {
    // Name validation
    const nameErr = validateCardName(name, [])
    if (nameErr) {
      setNameError(nameErr)
      return
    }

    // Note validation
    const noteErr = validateNote(note)
    if (noteErr) {
      setNoteError(noteErr)
      return
    }

    // Category validation — at least one must be selected
    if (categoryIds.length === 0) {
      return
    }

    onSave({
      name: name.trim(),
      note,
      categoryIds,
    })
  }, [name, note, categoryIds, onSave])

  const handleClose = useCallback(() => {
    const current: CardFormData = { name, note, categoryIds }
    const changed = snapshot
      ? hasUnsavedChanges(current, snapshot)
      : name !== '' || note !== '' || categoryIds.length > 0
    onClose(changed)
  }, [name, note, categoryIds, snapshot, onClose])

  const handleShowInFolder = useCallback(() => {
    if (filePath) {
      window.electronAPI.showItemInFolder(filePath).catch(() => {})
    }
  }, [filePath])

  const isCreate = mode === 'create'

  // ── Render ──

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="qc-card-form-dialog__overlay" />
        <Dialog.Content
          className="qc-card-form-dialog"
          role="dialog"
          aria-labelledby="qc-card-form-dialog-title"
        >
          <Dialog.Title
            className="qc-card-form-dialog__title"
            id="qc-card-form-dialog-title"
          >
            {isCreate ? '新建卡片' : '编辑卡片'}
          </Dialog.Title>

          <div className="qc-card-form-dialog__body">
            {/* ── Name field ── */}
            <FormField
              type="text"
              label="名称"
              value={name}
              error={nameError}
              maxLength={MAX_CARD_NAME}
              onChange={handleNameChange}
              placeholder="输入卡片名称"
            />

            {/* ── Note field (edit mode only) ── */}
            {!isCreate && (
              <FormField
                type="textarea"
                label="备注"
                value={note}
                error={noteError}
                maxLength={MAX_NOTE}
                onChange={handleNoteChange}
                placeholder="添加备注（可选）"
              />
            )}

            {/* ── Category checklist ── */}
            <div className="qc-card-form-dialog__section">
              <span className="qc-card-form-dialog__section-label">
                类别
              </span>
              <CategoryChecklist
                categories={categories}
                selectedIds={categoryIds}
                onChange={setCategoryIds}
                onCreateNew={() => {
                  // Parent should provide CategoryEditorPopover integration.
                  // Currently a no-op placeholder.
                }}
              />
            </div>

            {/* ── File path + actions (edit mode only) ── */}
            {!isCreate && filePath !== undefined && (
              <div className="qc-card-form-dialog__file-section">
                <FormField
                  type="readonly-path"
                  label="文件路径"
                  value={filePath}
                  error={null}
                  maxLength={null}
                  onChange={() => {}}
                />
                <div className="qc-card-form-dialog__file-actions">
                  <button
                    type="button"
                    className="qc-card-form-dialog__file-btn"
                    onClick={handleShowInFolder}
                  >
                    在文件管理器中显示
                  </button>
                  {onReselectFile && (
                    <button
                      type="button"
                      className="qc-card-form-dialog__file-btn"
                      onClick={onReselectFile}
                    >
                      重新选择文件
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="qc-card-form-dialog__actions">
            <button
              type="button"
              className="qc-card-form-dialog__btn qc-card-form-dialog__btn--cancel"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              type="button"
              className="qc-card-form-dialog__btn qc-card-form-dialog__btn--save"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
