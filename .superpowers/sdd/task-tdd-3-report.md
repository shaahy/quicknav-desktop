# Task TDD-3: useSearch / useSort Reimplementation

## Summary

TDD reimplementation of `useSearch` and `useSort` hooks with updated contracts,
following RED-GREEN-REFACTOR cycle.

## Files Changed

### New
- `tests/unit/useSearch.test.ts` -- 10 tests (matching/scoring + debounce behavior)
- `tests/unit/useSort.test.ts` -- 7 tests (setOrder, commitOrder, reorder mode, external sync)

### Modified
- `src/renderer/hooks/useSearch.ts` -- empty query now returns ALL cards (in allCards view order) instead of `[]`
- `src/renderer/hooks/useSort.ts` -- new API: `localOrder`, `setOrder`, `commitOrder`, `isReorderMode`, `enterReorderMode`, `exitReorderMode`
- `src/renderer/components/reorder-control.tsx` -- adapted from old `useSort` API (`orderedItems`/`moveUp`/`moveDown`/`moveTo`) to new API

## useSearch Hook Contract

| Property | Type | Description |
|---|---|---|
| `searchQuery` | `string` | Current query (from AppState) |
| `setSearchQuery` | `(q: string) => void` | Dispatches SET_SEARCH_QUERY |
| `searchResults` | `Card[]` | Scored/filtered cards; all cards when query empty |
| `isSearching` | `boolean` | True during 200ms debounce |

Scoring: exact match > prefix match > substring match; within-tier by allCards view order.

## useSort Hook Contract

| Property | Type | Description |
|---|---|---|
| `localOrder` | `string[]` | Immediately updated card ID order |
| `setOrder` | `(ids: string[]) => void` | Updates localOrder + ref instantly |
| `commitOrder` | `() => void` | Debounced (500ms) onReorder callback |
| `isReorderMode` | `boolean` | Reorder mode flag |
| `enterReorderMode` | `() => void` | Sets flag |
| `exitReorderMode` | `() => void` | Clears flag + calls commitOrder |

External item mutations are auto-merged (new items appended, removed items dropped).

## Test Results

- 17 new tests: **all pass**
- 82 pre-existing tests: **all pass**
- `npx tsc --noEmit`: **passes**
- One pre-existing failure in `tests/unit/file-card.test.tsx` ("renders card name with heading font" -- missing `role="heading"` in component, unrelated to hooks) was present before this task.
