import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import '../styles/components/duplicate-dialog.css'

// ── Props ──

interface DuplicateDialogProps {
  /** 已有卡片的名称 */
  existingCardName: string
  /** 已有卡片的 ID */
  existingCardId: string
  /** 查看原卡片 */
  onViewCard: (id: string) => void
  /** 重新选择文件 */
  onReSelect: () => void
  /** 取消 */
  onCancel: () => void
}

// ── Warning icon SVG ──

function WarningIcon() {
  return (
    <svg
      className="qc-duplicate-dialog__warning-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2L18 17H2L10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="10" cy="12.5" r="1" fill="currentColor" />
      <rect x="9.5" y="7" width="1" height="3.5" fill="currentColor" />
    </svg>
  )
}

// ── Component ──

/**
 * Alert dialog shown when the user tries to add a file that already exists
 * as a card (S10 duplicate detection).
 *
 * Offers:
 * - "查看原卡片" (initial focus) — navigates to the existing card
 * - "重新选择" — returns to file selection
 * - "取消" — closes dialog, no action taken
 */
export function DuplicateDialog({
  existingCardName,
  existingCardId,
  onViewCard,
  onReSelect,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="qc-duplicate-dialog__overlay" />

        <Dialog.Content
          className="qc-duplicate-dialog"
          role="alertdialog"
          aria-labelledby="qc-duplicate-dialog-title"
          aria-describedby="qc-duplicate-dialog-description"
        >
          {/* ── Header with icon ── */}
          <div className="qc-duplicate-dialog__header">
            <WarningIcon />
            <Dialog.Title
              className="qc-duplicate-dialog__title"
              id="qc-duplicate-dialog-title"
            >
              重复文件
            </Dialog.Title>
          </div>

          {/* ── Body ── */}
          <Dialog.Description
            className="qc-duplicate-dialog__body"
            id="qc-duplicate-dialog-description"
          >
            <p className="qc-duplicate-dialog__message">该文件已收录</p>
            <p className="qc-duplicate-dialog__card-name">
              {existingCardName}
            </p>
          </Dialog.Description>

          {/* ── Action buttons ── */}
          <div className="qc-duplicate-dialog__actions">
            {/* Safe action — initial focus */}
            <button
              className="qc-duplicate-dialog__btn qc-duplicate-dialog__btn--primary"
              onClick={() => onViewCard(existingCardId)}
              type="button"
            >
              查看原卡片
            </button>

            <button
              className="qc-duplicate-dialog__btn qc-duplicate-dialog__btn--safe"
              onClick={onReSelect}
              type="button"
            >
              重新选择
            </button>

            <button
              className="qc-duplicate-dialog__btn qc-duplicate-dialog__btn--safe"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
