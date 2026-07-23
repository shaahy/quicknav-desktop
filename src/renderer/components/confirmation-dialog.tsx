import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { ConfirmationVariant, ConfirmationData } from '@shared/types'
import '../styles/components/confirmation-dialog.css'

// ── Props ──

interface ConfirmationDialogProps {
  /** 确认类型 */
  variant: ConfirmationVariant
  /** 上下文数据（categoryName / totalCards / uncategorizedCount） */
  data: ConfirmationData
  /** 确认回调 */
  onConfirm: () => void
  /** 取消回调 */
  onCancel: () => void
}

// ── Per-variant messages ──

const MESSAGES: Record<
  ConfirmationVariant,
  { title: string; body: string; confirmLabel: string; cancelLabel: string }
> = {
  'delete-category': {
    title: '', // overridden dynamically in render
    body: '',  // overridden dynamically in render
    confirmLabel: '确认删除',
    cancelLabel: '取消',
  },
  'delete-card': {
    title: '删除卡片',
    body: '将从所有类别移除，但不会删除、移动或修改源文件',
    confirmLabel: '确认删除',
    cancelLabel: '取消',
  },
  'discard-changes': {
    title: '放弃修改',
    body: '已修改的内容将不会保存',
    confirmLabel: '放弃',
    cancelLabel: '继续编辑',
  },
}

// ── Component ──

export function ConfirmationDialog({
  variant,
  data,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const messages = MESSAGES[variant]

  const title =
    variant === 'delete-category'
      ? `删除类别「${data.categoryName ?? ''}」`
      : messages.title

  const body =
    variant === 'delete-category'
      ? `${data.totalCards ?? 0} 张卡片属于此类别，其中 ${data.uncategorizedCount ?? 0} 张将移入未分类`
      : messages.body

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="qc-confirmation-dialog__overlay" />

        <Dialog.Content
          className="qc-confirmation-dialog"
          role="alertdialog"
          aria-labelledby="qc-confirmation-dialog-title"
        >
          <Dialog.Title
            className="qc-confirmation-dialog__title"
            id="qc-confirmation-dialog-title"
          >
            {title}
          </Dialog.Title>

          <Dialog.Description className="qc-confirmation-dialog__body">
            {body}
          </Dialog.Description>

          <div className="qc-confirmation-dialog__actions">
            {/* Safe action first so Radix auto-focuses it (cancel/continue) */}
            <button
              className="qc-confirmation-dialog__btn qc-confirmation-dialog__btn--safe"
              onClick={onCancel}
              type="button"
            >
              {messages.cancelLabel}
            </button>

            <button
              className="qc-confirmation-dialog__btn qc-confirmation-dialog__btn--destructive"
              onClick={onConfirm}
              type="button"
            >
              {messages.confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
