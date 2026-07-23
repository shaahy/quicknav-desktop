# Task 29 Report — Implement global-search + useSearch hook

## Summary

Implemented the global search bar component and its backing `useSearch` hook for the 速查工具 Electron app. The search is always visible in the view-header area, debounced by 200ms, and scores matches by relevance (exact name > prefix > substring) sorted by the all-cards order.

## Changes

### New file: `src/renderer/hooks/useSearch.ts`

Custom hook managing search state:

- **`searchQuery` / `setSearchQuery`** — reads/writes `searchQuery` from/to the global AppState via `SET_SEARCH_QUERY` dispatch, keeping `useCards` filtering in sync.
- **Debounced filter** — uses `SEARCH_DEBOUNCE_MS` (200ms) before computing `searchResults`, avoiding expensive re-sorts on every keystroke.
- **Match scoring** — searches ALL cards by name (ignoring leading/trailing whitespace, case-insensitive). Tier 0 = exact match, Tier 1 = prefix match, Tier 2 = substring match. Within each tier, cards are sorted by the `allCards` view order. Cards with no view-order entry sort to the end of their tier.
- **`isSearching`** — true when the user has typed a non-empty query but the debounce hasn't settled.
- **Immediate clear** — when the query is emptied (Esc / clear button), the debounced query resets synchronously on the next render cycle so the UI responds instantly.

### New file: `src/renderer/components/global-search.tsx`

Props: none (reads search state via `useSearch` hook).

- Single-line `<input>` with `role="searchbox"` and `aria-label="搜索卡片"`.
- Clear button (✕) appears when the input is non-empty; resets search and re-focuses the input.
- `aria-live="polite"` region announces the result count ("找到 N 张卡片") or a brief "搜索中..." status; never announces individual card content.
- `Escape` key clears the search and blurs the input, returning to the unfiltered view.
- Styled with BEM prefix `qc-global-search`.

### New file: `src/renderer/styles/components/global-search.css`

- Flex layout spanning full width between the ViewHeader and toolbar.
- Input uses `2px solid var(--color-border)`, switching to `var(--color-focus)` on focus for the focus ring.
- Clear button meets `--spacing-target-min` (44px) touch target.
- Result count text styled with `--font-size-label` / `--color-text-muted`.

### Modified file: `src/renderer/components/app-shell.tsx`

- Added `import { GlobalSearch } from './global-search'`.
- Rendered `<GlobalSearch />` immediately after `<ViewHeader />`, so it sits between the view header and the toolbar in the main content column.

## Verification

- `npx tsc --noEmit` passes with 0 errors.
- Existing `useCards` continues to filter visible cards by `state.searchQuery` (name + note includes), complementing the new match-scored search.
- Commit message: `feat: implement global-search and useSearch hook`
