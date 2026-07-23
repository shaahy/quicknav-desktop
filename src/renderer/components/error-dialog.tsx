import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import '../styles/components/error-dialog.css'

// ── Props ──

interface ErrorDialogProps {
  /** 失败类型 */
  variant: 'open-failed' | 'locate-failed' | 'save-failed'
  /** 卡片名称 */
  cardName: string
  /** 错误详情（save-failed 时显示，如"磁盘空间不足"/"权限不足"/"文件被锁定"） */
  errorDetail?: string
  /** 重新选择文件 */
  onReSelect: () => void
  /** 删除卡片（父组件应路由到 S14） */
  onDelete: () => void
  /** 关闭对话框（保留卡片数据） */
  onClose: () => void
  /** 重试保存（仅 save-failed 变体） */
  onRetry?: () => void
  /** 关闭应用（仅 save-failed 变体） */
  onQuit?: () => void
}

// ── Per-variant configuration ──

const MESSAGES: Record<
  ErrorDialogProps['variant'],
  { title: string; body: string; safeLabel: string }
> = {
  'open-failed': {
    title: '打开失败',
    body: '无法打开文件。卡片仍被保留。',
    safeLabel: '重新选择',
  },
  'locate-failed': {
    title: '定位失败',
    body: '无法定位文件。卡片仍被保留。',
    safeLabel: '重新选择',
  },
  'save-failed': {
    title: '保存失败',
    body: '无法保存数据',
    safeLabel: '重试保存',
  },
}

// ── Warning icon SVG ──

function WarningIcon() {
  return (
    <svg
      className="qc-error-dialog__warning-icon"
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
 * Alert dialog for error feedback after file operations fail (S12).
 *
 * Three variants:
 * - `open-failed`:    File could not be opened. Card is preserved.
 * - `locate-failed`:  File could not be located in file system. Card is preserved.
 * - `save-failed`:    App data could not be saved. Shows error detail.
 *
 * Initial focus lands on the safe action (重新选择 / 重试保存).
 */
export function ErrorDialog({
  variant,
  cardName,
  errorDetail,
  onReSelect,
  onDelete,
  onClose,
  onRetry,
  onQuit,
}: ErrorDialogProps) {
  const messages = MESSAGES[variant]
  const isSaveFailed = variant === 'save-failed'

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="qc-error-dialog__overlay" />

        <Dialog.Content
          className="qc-error-dialog"
          role="alertdialog"
          aria-labelledby="qc-error-dialog-title"
          aria-describedby="qc-error-dialog-description"
        >
          {/* ── Header with icon ── */}
          <div className="qc-error-dialog__header">
            <WarningIcon />
            <Dialog.Title
              className="qc-error-dialog__title"
              id="qc-error-dialog-title"
            >
              {messages.title}
            </Dialog.Title>
          </div>

          {/* ── Body ── */}
          <Dialog.Description
            className="qc-error-dialog__body"
            id="qc-error-dialog-description"
          >
            <p className="qc-error-dialog__message">{messages.body}</p>
            <p className="qc-error-dialog__card-name">{cardName}</p>
            {isSaveFailed && errorDetail && (
              <p className="qc-error-dialog__error-detail">{errorDetail}</p>
            )}
          </Dialog.Description>

          {/* ── Action buttons ── */}
          <div className="qc-error-dialog__actions">
            {/* Safe action first for initial focus (重新选择 / 重试保存) */}
            {isSaveFailed ? (
              <button
                className="qc-error-dialog__btn qc-error-dialog__btn--safe"
                onClick={onRetry}
                type="button"
              >
                {messages.safeLabel}
              </button>
            ) : (
              <button
                className="qc-error-dialog__btn qc-error-dialog__btn--safe"
                onClick={onReSelect}
                type="button"
              >
                {messages.safeLabel}
              </button>
            )}

            {/* save-failed: quit app button */}
            {isSaveFailed && (
              <button
                className="qc-error-dialog__btn qc-error-dialog__btn--secondary"
                onClick={onQuit}
                type="button"
              >
                关闭应用
              </button>
            )}

            {/* Destructive — delete card */}
            <button
              className="qc-error-dialog__btn qc-error-dialog__btn--destructive"
              onClick={onDelete}
              type="button"
            >
              删除卡片
            </button>

            {/* Close — preserves card data */}
            <button
              className="qc-error-dialog__btn qc-error-dialog__btn--safe"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
