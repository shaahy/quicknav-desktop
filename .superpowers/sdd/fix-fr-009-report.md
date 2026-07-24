# TDD Report: useFileRepair Hook Unit Tests (FR-009)

## Summary

Added 13 new unit tests for the `useFileRepair` hook across 1 test file. All **138 tests pass** (125 existing + 13 new). `npx tsc --noEmit` clean.

## New Files

- **tests/unit/useFileRepair.test.ts** — 13 tests covering repairFile and failure counter API

## Modified Files

- **src/renderer/hooks/useFileRepair.ts** — Added `useAppState` import + card existence check before file dialog

## TDD Flow (RED -> GREEN)

### Phase 1: Write tests (13 tests)

### Phase 2: RED — 1 test fails

| # | Test | Expected | Actual (before fix) | Status |
|---|------|----------|---------------------|--------|
| 1 | Updates card fileReference | `{ result: 'success' }` + UPDATE_CARD dispatch | Matched | PASS |
| 2 | Preserves name/note/categoryIds | fileReference only in updates | Matched | PASS |
| 3 | Preserves viewOrders | card-1 stays in all viewOrders | Matched | PASS |
| 4 | Returns `{ result: "success" }` on success | `{ result: 'success' }` | Matched | PASS |
| 5 | Returns duplicate result | `{ result: 'duplicate', ... }` | Matched | PASS |
| **6** | **Returns `{ result: "canceled" }` when card not found** | **`{ result: 'canceled' }`** | **`{ result: 'success' }`** | **FAIL** |
| 7 | Normalizes path before duplicate check | duplicate detected | Matched | PASS |
| 8 | Resets failure counter after success | getFailureCount = 0 | Matched | PASS |
| 9-13 | Failure counter helpers (get/increment/reset/isWarning) | Various | Matched | PASS |

### Phase 3: Fix the hook (GREEN)

Added card existence guard in `useFileRepair.repairFile`:
1. Imported `useAppState` from AppState context
2. Added early check: `if (!state.data.cards.some(c => c.id === cardId)) return { result: 'canceled' }`
3. Added `state.data.cards` to useCallback dependency array

The fix ensures that repairing a non-existent card returns `canceled` instead of incorrectly reporting `success`. This prevents the S11/S16/S17 flow from silently succeeding on a deleted or invalid card ID.

### Result: All 138 tests pass.

## Tests That Passed Immediately (No RED Phase)

These 12 tests matched the existing hook behavior and passed without any implementation changes:

| # | Test Description |
|---|-----------------|
| 1 | repairFile updates card fileReference with new file data |
| 2 | repairFile preserves card name, note, and categoryIds |
| 3 | repairFile preserves viewOrders for the card |
| 4 | repairFile returns `{ result: "success" }` on successful repair |
| 5 | repairFile returns duplicate detection result |
| 7 | repairFile normalizes the new path before duplicate check |
| 8 | repairFile resets cumulative failure counter after successful repair |
| 9 | getFailureCount returns 0 for unknown card |
| 10 | incrementFailure increases count and returns new value |
| 11 | resetFailureCount clears the count for a card |
| 12 | isWarningCard returns true when count >= threshold |
| 13 | isWarningCard returns false when count below threshold |

## Test Design

- Uses `vi.hoisted` for mock state, dispatch, and electronAPI (pattern consistent with `useCards.test.ts`)
- Mocks `AppState` context to control card data per test
- Replaces `window.electronAPI` with hoisted mock so `selectFile`/`getPlatform`/`saveAppData` are controllable per test
- Uses `renderHook` from `@testing-library/react` so `useRef` works correctly for failure counter tests
- Each test sets up its own card state and `selectFile` mock return value

## Duplicate Detection Coverage

| Scenario | card-1 path | card-2 path | Selected path | Expected |
|----------|-------------|-------------|---------------|----------|
| Same path | `/old/path.txt` | `/shared/file.pdf` | `/shared/file.pdf` | Duplicate with card-2 |
| Non-normalized vs normalized | new card | `C:/Users/test/document.pdf` | `c:\Users\test\document.pdf` | Duplicate after normalization |
| Self-path same as existing (skip self) | `/shared/file.pdf` | `/shared/file.pdf` | `/shared/file.pdf` | Success (duplicate.id === cardId) |

## Test Counts

| File | Before | After |
|------|--------|-------|
| useFileRepair.test.ts | 0 | 13 |
| **Total** | **125** | **138** |
