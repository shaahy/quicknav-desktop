# TDD Report: Shell Operations + Store Save Error Handling

## Summary

Added 15 new unit tests (10 shell + 5 store) across 2 test files. All 82 tests pass. `npx tsc --noEmit` clean.

## New Files

- **tests/unit/shell.test.ts** — 10 tests, mocked `electron` and `fs` modules via vitest
- **tests/unit/store.test.ts** (modified) — 5 new tests added, `vi.mock('fs', ...)` makes fs mockable while preserving real impls by default

## Shell Tests (tests/unit/shell.test.ts)

| # | Test | Status |
|---|------|--------|
| 1 | `openFile` returns success empty error | PASS |
| 2 | `openFile` returns no-default-app | PASS |
| 3 | `openFile` returns unknown | PASS |
| 4 | `openFile` does not call fs.existsSync/access/stat (CHK019) | PASS |
| 5 | `showItemInFolder` returns success | PASS |
| 6 | `readHtmlTitle` extracts title from valid HTML | PASS |
| 7 | `readHtmlTitle` returns null when no title tag | PASS |
| 8 | `readHtmlTitle` returns null for binary/non-UTF8 file | PASS |
| 9 | `selectFile` returns file metadata | PASS |
| 10 | `selectFile` returns canceled | PASS |

## Store Save Error Tests (tests/unit/store.test.ts)

| # | Test | Status |
|---|------|--------|
| 1 | `saveAppData` returns `disk-full` on ENOSPC | PASS |
| 2 | `saveAppData` returns `permission-denied` on EACCES | PASS |
| 3 | `saveAppData` returns `locked` on EBUSY | PASS |
| 4 | `saveAppData` calls `fs.fsyncSync` after successful write (CHK029) | PASS |
| 5 | `saveAppData` does NOT corrupt existing file on write failure | PASS |

## TDD Compliance Verification

All 15 tests were verified to **fail** when their corresponding implementation was temporarily disabled. Details:

| Test Group | How Implementation Was Broken | Tests Failed |
|------------|------------------------------|--------------|
| `openFile` (3 behavioral) | Stub always returns `{ error: 'file-not-found' }` | 3/3 |
| `openFile` CHK019 (contract) | Negative test — call count assertion on fs functions | N/A (contract test; a no-op stub also doesn't call fs) |
| `showItemInFolder` | Stub always returns `{ error: 'not-found' }` | 1/1 |
| `readHtmlTitle` (3) | Stub always returns `'SOME_FIXED_TITLE'` | 3/3 |
| `selectFile` (2) | Stub always returns `{ canceled: false }` | 2/2 |
| `saveAppData` ENOSPC | Commented out `e.code === 'ENOSPC'` handler | 1/1 |
| `saveAppData` EACCES | Commented out `e.code === 'EACCES'` handler | 1/1 |
| `saveAppData` EBUSY | Commented out `e.code === 'EBUSY'` handler | 1/1 |
| `saveAppData` CHK029 fsync | Removed `fs.fsyncSync(fd)` call | 1/1 |
| `saveAppData` no-corrupt | Added `fs.writeFileSync('')` before `openSync` to truncate on failure | 1/1 |

Note: Test 4 (CHK019) is a negative/contract test — it asserts that certain fs functions are NEVER called. A no-op stub also doesn't call them, so this test cannot "fail" in the traditional TDD sense. The test PREVENTS regression: a future developer adding `fs.existsSync` pre-check would see it fail.

## Test Counts

| File | Before | After |
|------|--------|-------|
| validation.test.ts | 16 | 16 |
| store.test.ts | 4 | 9 |
| useCategories.test.ts | 23 | 23 |
| useCards.test.ts | 21 | 21 |
| shell.test.ts | 0 | 10 |
| a11y audits | 3 | 3 |
| **Total** | **67** | **82** |

## Mock Strategy

- **electron**: `vi.mock('electron', () => ({ dialog, shell, BrowserWindow }))` with `vi.hoisted` mock references
- **fs** (shell): `vi.mock('fs', () => fsMocks)` with all functions as `vi.fn()` 
- **fs** (store): `vi.mock('fs', async (importOriginal) => { ...actual })` — wraps real module so `vi.spyOn` works across mocked module boundaries
