# FR-015 / FR-016 TDD Report

## Summary

Added 6 new tests covering the "uncategorized" disabled state in the category checklist and the multi-category removal guard in the reducer.

## Test Results

- **Total tests**: 144 (was 138)
- **All tests pass**: Yes
- **TypeScript (`tsc --noEmit`)**: Clean

## FR-016: At Least 1 User Category + Multi-Category Removal

**Target file**: `tests/unit/useCategories.test.ts` (3 new tests)

| Test | Verifies |
|------|----------|
| blocks removing a card from its only category | Reducer guard returns unchanged state when `REMOVE_CARD_FROM_CATEGORY` targets a card's sole category |
| succeeds removing a card from a category when it has 2+ categories | Card retains remaining categories after removal |
| removes card from category viewOrder after successful removal | ViewOrder for the source category no longer contains the card; other viewOrders unaffected |

**Production code changes** (`src/renderer/contexts/AppState.tsx`):

- Exported `appReducer` for direct testing (previously file-local)
- Added FR-016 guard in the `REMOVE_CARD_FROM_CATEGORY` case: if removing the last user category from a card, the reducer returns the state unchanged (defense-in-depth — the form dialog also blocks zero-category saves)
- Removed the now-unreachable uncategorized-move logic (the guard prevents ever reaching 0 categories via this action)

**Mock change** (`tests/unit/useCategories.test.ts`):

- Updated the `vi.mock('../../src/renderer/contexts/AppState')` factory from a sync stub to an async `importOriginal` pattern so that `appReducer` is available from the real module while `useAppState` / `useAppDispatch` remain mocked.

## FR-015: "Disables" not Selectable in Checklist

**New file**: `tests/unit/category-checklist.test.tsx` (3 new tests)

| Test | Verifies |
|------|----------|
| renders "Disables" item with disabled checkbox | `getByRole('checkbox', { name: 'Disables' })` returns a disabled input; regular category checkboxes are not disabled |
| clicking "Disables" does NOT toggle its selection or call onChange | Disabled checkbox receives click; `onChange` prop is never invoked |
| regular user category checkboxes are clickable and toggle normally | Clicking an unselected category calls `onChange` with it added; clicking a selected category calls `onChange` with it removed |

**Files changed**:
- `src/renderer/contexts/AppState.tsx` — exported `appReducer` + FR-016 guard
- `tests/unit/useCategories.test.ts` — FR-016 reducer tests + mock update
- `tests/unit/category-checklist.test.tsx` — FR-015 component tests (new)
