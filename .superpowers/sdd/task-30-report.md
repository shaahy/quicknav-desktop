# Task 30 Report — Implement error-dialog, duplicate-dialog, and status-bar components

## Summary

Implemented three US4 components (error dialog, duplicate dialog, status bar) for the 速查工具 Electron app, each with its own CSS module and TypeScript interface.

## Changes

### New file: `src/renderer/components/error-dialog.tsx`

Props: `variant`, `cardName`, `errorDetail?`, `onReSelect`, `onDelete`, `onClose`, `onRetry?`, `onQuit?`

- Uses `@radix-ui/react-dialog` with `role="alertdialog"` for WCAG compliance.
- Three variants (`open-failed`, `locate-failed`, `save-failed`) with distinct title/body/safe-label messages.
- Warning triangle icon SVG colored with `--color-warning`.
- Initial focus on the non-destructive action (`重新选择` / `重试保存`) via DOM order.
- `save-failed` shows error detail in a monospace-styled code block and adds `关闭应用` / `重试保存` buttons.
- `删除卡片` routes to `onDelete` (parent should route to S14); `关闭` preserves card data.

### New file: `src/renderer/styles/components/error-dialog.css`

BEM block: `qc-error-dialog`. Surface background, border, `--rounded-md` radius, same overlay z-index stack as other dialogs. Button variants: `--safe`, `--secondary`, `--destructive`.

### New file: `src/renderer/components/duplicate-dialog.tsx`

Props: `existingCardName`, `existingCardId`, `onViewCard`, `onReSelect`, `onCancel`

- Uses `@radix-ui/react-dialog` with `role="alertdialog"`.
- Title "重复文件", body "该文件已收录" + existingCardName.
- `查看原卡片` (initial focus via DOM order) calls `onViewCard(existingCardId)`.
- `重新选择` and `取消` close without action.
- Warning icon with `--color-warning`.

### New file: `src/renderer/styles/components/duplicate-dialog.css`

BEM block: `qc-duplicate-dialog`. Matches error-dialog surface styling. Button variants: `--primary` (action-colored), `--safe`.

### New file: `src/renderer/components/status-bar.tsx`

Props: `message`, `visible`, `onDismiss`, `triggerElementId?`

- `role="status"` + `aria-live="polite"` for accessibility.
- Auto-dismisses after `STATUS_BAR_MIN_MS` (8000ms).
- Pause/resume timer on hover/focus with remaining-time tracking via refs.
- On dismiss, returns focus to `triggerElementId` via `document.getElementById`.
- Positioned fixed at the bottom of the main area (left offset = `--spacing-sidebar`), does NOT push layout.
- Close button with `aria-label="关闭"`.

### New file: `src/renderer/styles/components/status-bar.css`

BEM block: `qc-status-bar`. Fixed positioning at bottom, `2px solid var(--color-success)` top border, success-colored message text.

## Verification

- `npx tsc --noEmit` passes with 0 errors.
- All three components are independent, no import changes to existing files.
