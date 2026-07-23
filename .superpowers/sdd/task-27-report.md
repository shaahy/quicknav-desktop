# Task 27 Report — Implement reorder-control component and useSort hook

## Summary

Implemented the `ReorderControl` React component and `useSort` hook for the 速查工具 Electron app. The component provides a reorderable list with drag handle, up/down buttons, immediate UI updates, debounced persistence, and full ARIA support.

## Changes

### New file: `src/renderer/hooks/useSort.ts`

- Generic reorder hook with immediate UI state + 500 ms debounced persistence.
- `moveUp(index)`, `moveDown(index)`, `moveTo(fromIndex, toIndex)` — each updates local state instantly and schedules a debounced `onReorder` callback.
- Automatically merges external item mutations (add/delete) into local order without disrupting user's current drag.
- Memoized `orderedItems` derived from local order + source items.
- Returns `{ orderedItems, moveUp, moveDown, moveTo }`.

### New file: `src/renderer/components/reorder-control.tsx`

- Props: `items: ReorderItem[]`, `onReorder: (newOrder: string[]) => void`, `itemType: 'card' | 'category'`.
- Uses `useSort` hook for all reorder logic (immediate UI + debounced save).
- Each item row: drag handle (⠿, `draggable` for HTML5 drag-and-drop), item name, up button, down button.
- First item: up button disabled with `--color-text-disabled` and title explaining reason.
- Last item: down button disabled with similar treatment.
- Drag-and-drop support: `dragstart`/`dragover`/`drop`/`dragend` handlers with visual `--drag-over` class.
- Polite ARIA announcements via `role="status" aria-live="polite"` live region — announces `"{item name}, 位置 {N}/{total}"` on each move.
- `role="listbox"` container, `role="option"` items with `aria-posinset` and `aria-setsize`.
- Calls `onReorder` after 500 ms debounce (UI updates immediately in `useSort`).

### Rewritten file: `src/renderer/styles/components/reorder-control.css`

- Full BEM structure: `qc-reorder-control`, `qc-reorder-control__item`, `qc-reorder-control__drag-handle`, `qc-reorder-control__name`, `qc-reorder-control__btn`, `qc-reorder-control__live-region`, `qc-reorder-control__item--drag-over`.
- Uses design tokens: `--color-surface` bg, `--color-text` text, `--color-border` border, `--color-focus` focus, `--rounded-sm`, `--color-text-disabled` for disabled buttons, `--color-text-muted` for drag handle.
- Disabled button: `opacity: 0.5`, `color: var(--color-text-disabled)`, `cursor: not-allowed`.
- Live region: visually hidden via `clip: rect(0,0,0,0)` + `overflow: hidden`.

### Modified file: `src/renderer/components/app-shell.tsx`

- Updated both `ReorderControl` callers to include required `itemType` prop:
  - Category reorder section: `itemType="category"`
  - Card reorder section: `itemType="card"`

## Verification

- `npx tsc --noEmit` passes with 0 errors.
- Commit message: `feat: implement reorder-control component and useSort hook`
