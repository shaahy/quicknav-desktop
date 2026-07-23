# Code Review: 速查工具 (Local File Navigator)

**Branch:** `worktree-001-local-file-navigator`  
**Base:** `a4fbaa3` (spec initial commit)  
**HEAD:** `c34f20f` (final test commit)  
**Scope:** 82 files, ~21K lines added, 38 commits  
**Reviewer:** Senior Code Reviewer  
**Date:** 2026-07-23

---

## 1. Strengths (What's Well Done)

### Architecture & Separation
- Clean Electron three-layer architecture: `main` (IPC + OS ops) | `preload` (bridge) | `renderer` (React). Each layer has a clear responsibility boundary.
- `shared/types.ts` defines all domain entities, IPC result types (`IpcResult<T>` discriminated union), UI types, and the `ElectronAPI` contract -- single source of truth.
- `useReducer` in `AppState.tsx` for state management is well-suited to this scale. Action types are exhaustive, reducer cases handle each transition cleanly.
- Custom hooks (`useCards`, `useCategories`, `useSearch`, `useSort`, `useFileRepair`) keep domain logic out of components. Memoization discipline (`useMemo`/`useCallback`) is consistent.

### Error Handling & Constitution Compliance
- **Constitution III (No Silent Failures):** Every IPC call goes through discriminated `IpcResult<T>`. Save failure paths distinguish `disk-full`, `permission-denied`, `locked`, `unknown`.
- **Constitution I (Navigate, Don't Scan):** File selection is purely user-driven via X01. No disk scanning anywhere.
- **Constitution II (Source File Immutability):** `shell.openPath` and `shell.showItemInFolder` are the only file operations. No write/delete/move of source files.
- **CHK019 audit** (no pre-check before `shell.openPath` / `shell.showItemInFolder`) thoroughly verifies the no-precheck constraint at the source level.
- **CHK020 audit** (no sync hints) scans all component/surface files for forbidden keywords.
- **Cumulative failure tracking** (`useFileRepair.ts`) with 3-strike warning is correctly implemented via `useRef` (survives re-renders, resets on app restart).
- **Store integrity:** `fsyncSync` after write protects against partial writes. Corruption detection validates `version`, `cards` array, `categories` array.

### Accessibility (WCAG 2.2 AA)
- `axe-core` Playwright integration (`runA11yCheck`) with `wcag22aa` tags.
- `focus-visible` outline on all interactive elements via global CSS.
- `aria-live="polite"` on search results count, sort order announcements, status bar.
- `role="alertdialog"` with `aria-labelledby` + `aria-describedby` on error/confirmation dialogs.
- `prefers-reduced-motion: reduce` media query globally disables animations.
- Contrast ratios documented in `tokens.css` comments (all pass AA, most pass AAA).
- BEM CSS convention with `qc-` prefix for all custom styles.
- 200% text zoom handled via responsive grid (3 col -> 2 col -> 1 col).

### Testing
- **125 unit tests** covering: store (save/load/corruption/error codes), shell (open/show/select/HTML title), validation, useCards, useCategories, useSearch (debounce + scoring), useSort (debounce + external sync), file-card (render/click/keyboard/reorder), card-form-dialog (create/edit/validation/change detection), app-shell (loading/error/ready/empty states).
- **22 E2E tests** covering: tray behavior, persistence round-trip, edge cases, responsive layout, keyboard navigation, concurrent operations.
- **Static audits:** CHK019 (no-precheck) and CHK020 (no-sync-hints) as vitest tests, testing code constraints at the source level.

### Configuration & Build
- `electron-vite` with proper `externalizeDepsPlugin` for main/preload.
- `@shared` and `@renderer` path aliases in both vite and vitest config.
- `tsconfig.json` with strict mode, `react-jsx`.

---

## 2. Issues Found

### CRITICAL (4 issues)

#### C1. Search UI does not use the match-scoring algorithm from `useSearch` -- display uses `useCards.visibleCards` instead

**Location:** `src/renderer/hooks/useCards.ts:11-27`, `src/renderer/components/app-shell.tsx:51,803`

**What's wrong:** `AppShell` renders cards via `visibleCards` from `useCards()`, but `useSearch()` computes independently-scored `searchResults` that are never wired into the display. The `useCards.visibleCards` computation:
1. Filters by `currentView` first (so search shows only cards in the current category, not ALL cards -- violates **FR-023**: "跨全部卡片")
2. Uses simple `.includes()` match with no relevance sorting (violates **FR-024**: exact match first, prefix second, contains last)
3. Also searches `note` field (violates **FR-025**: "备注不参与搜索")

**Fix:** AppShell should switch to using `searchResults` from `useSearch()` when `searchQuery` is non-empty, falling back to `visibleCards` when there is no active search.

**Spec ref:** FR-023, FR-024, FR-025  
**Severity:** CRITICAL

---

#### C2. Name uniqueness is not enforced (FR-006)

**Location:** `src/renderer/components/card-form-dialog.tsx:112-117`, `src/renderer/hooks/useCards.ts:41-48`

**What's wrong:** `CardFormDialog.handleSave()` calls `validateCardName(name, [])` with an empty existing-names array, so duplicate names are never detected at form-submit time. In `useCards.addCard()`, only path-based duplicate detection is performed (via `findDuplicateByPath`), not name-based. The spec requires **FR-006**: "不与已有卡片名称完全相同". Two cards can end up with the same name.

**Fix:** Pass existing card names to `validateCardName` in `CardFormDialog`, and add name uniqueness check in `useCards.addCard()` (could return special status like name-conflict).

**Spec ref:** FR-006  
**Severity:** CRITICAL

---

#### C3. Corruption/data-load error silently recovers with empty data instead of showing blocking error UI (FR-036a)

**Location:** `src/renderer/contexts/AppState.tsx:386-401`, `src/renderer/main.tsx:14-16`

**What's wrong:** The `AppStateProvider` load effect does not check `result.success`. When the store returns `{ success: false, error: 'corrupted' }`, the code falls through to the "fresh start" branch (`INITIAL_APP_DATA`) without any user-facing error. Furthermore, `AppShellWithState` only maps `isLoading -> loading/ready` -- `loadError` state is never read, so even if an error were dispatched the error UI would never render.

The spec requires (FR-036a): "损坏则提示'数据已损坏，需重新开始'，用户确认后以空数据启动" -- a blocking dialog with retry and, after repeated failures, a "start fresh" option. Currently the app silently discards corrupted data.

**Fix:** (1) `AppStateProvider` must dispatch a `LOAD` action with error state or set a dedicated error flag when `result.success === false`. (2) `AppShellWithState` must read `state.loadError` and map to `loadingState: 'error'`. (3) The error UI must offer retry and, after threshold, a "数据已损坏，需重新开始" dialog per spec.

**Spec ref:** FR-036a, US4 Acceptance Scenario 7  
**Severity:** CRITICAL

---

#### C4. Error dialog "delete" bypasses S14 confirmation dialog (FR-010 violation)

**Location:** `src/renderer/components/app-shell.tsx:472-479`

**What's wrong:** `handleErrorDelete` (used by the error dialog's "删除卡片" button) calls `deleteCard()` directly without showing the S14 confirmation dialog first. The spec (FR-010) requires deletion to always go through confirmation: "删除前确认'将从所有类别移除，但不会删除、移动或修改源文件'". The error dialog should route to the confirmation dialog, which should replace the error dialog ("模态不堆叠" principle -- S14 replaces S16/S17).

**Fix:** Instead of directly calling `deleteCard`, set a `deletingCardId` state (which triggers the confirmation dialog), and close the error dialog. The confirmation dialog then handles the actual delete.

**Spec ref:** FR-010, FR-011, X01 S16/S17 "删除"  
**Severity:** CRITICAL

---

### IMPORTANT (5 issues)

#### I1. `CardFormDialog` `onCreateNew` is a no-op

**Location:** `src/renderer/components/card-form-dialog.tsx:213-215`

**What's wrong:** The `CategoryChecklist`'s `onCreateNew` prop is connected to a no-op callback `() => {}`. Users cannot create new categories inline while adding/editing a card. This is a UX gap that forces users to exit the card form, create the category, then re-open the card form.

**Fix:** Wire the `onCreateNew` callback to open the parent's `CategoryEditorPopover` state. The popover already supports create mode; it just needs to be connected through the dialog flow.

**Severity:** IMPORTANT

---

#### I2. Status bar loses focus on dismiss; `triggerElementId` never set

**Location:** `src/renderer/components/status-bar.tsx:52-57`, `src/renderer/components/app-shell.tsx:192-199`

**What's wrong:** The `StatusBar` component supports `triggerElementId` for returning focus on dismiss, but `app-shell.tsx` never passes this prop when rendering `<StatusBar>`. On auto-dismiss or manual close, focus is lost to the document root.

**Spec ref:** FR-037 (keyboard operations), spec Edge Cases "Status-bar 计时与交互" -- "若焦点位于其中则回到触发该状态的稳定控件"

**Severity:** IMPORTANT

---

#### I3. Error dialog does not display `cardName` in `aria-describedby` content

**Location:** `src/renderer/components/error-dialog.tsx:131-132`

**What's wrong:** The alert dialog's `aria-describedby` references `#qc-error-dialog-description`, which contains the generic message ("无法打开文件") and the card name as a `<p>`. While the card name is rendered visually, the description's semantic value for screen readers should include the card name within the described text. Currently the card name has no `id` reference, so it may not be announced as part of the dialog description by all screen readers.

**Severity:** IMPORTANT

---

#### I4. `clearTimeout` inconsistency in `useSearch` -- race condition on rapid clear

**Location:** `src/renderer/hooks/useSearch.ts:55`

**What's wrong:** When `searchQuery === ''`, the debounce timer is bypassed and `debouncedQuery` is set immediately. But if the user types and clears rapidly, the timer from a previous typing burst might still fire after `debouncedQuery` has already been set to `''`. The guard `searchQuery !== debouncedQuery` on line 58 prevents some re-entrant cases, but the broader issue is that `debouncedQuery` is not managed via `useRef` but through `useState`, so stale closures from `setTimeout` callbacks could update state after the component has moved on.

**Severity:** IMPORTANT

---

#### I5. `shell.showItemInFolder` cannot detect failure in Electron 33 (returns `void`)

**Location:** `src/main/shell.ts:46-51`

**What's wrong:** The code documents this limitation: "shell.showItemInFolder returns void in Electron 33, so we cannot detect failure". When `LocateResult` always returns `{}` (empty success), the renderer's `showItemInFolder` handler in `app-shell.tsx:306` checks `locateResult.error` which is always `undefined`. This means:
1. Locate failures are never detected
2. The S17 dialog never appears for locate failures
3. The cumulative failure counter is never incremented for locate failures

**Spec ref:** FR-030, US3 Acceptance Scenario 7

**Severity:** IMPORTANT

---

### MINOR (7 issues)

#### M1. `icon` prop on `ToolbarButton` has default `null` but the JSX only checks `icon != null` (both correct but confusing)

**File:** `src/renderer/components/toolbar-button.tsx`

#### M2. `AppShell` has no aria-live region for status bar announcements when status bar is not rendered

**File:** `src/renderer/components/status-bar.tsx` -- Status bar returns `null` when not visible, so no live region exists. Screen readers won't hear "文件可能已移动" or other non-blocking updates.

#### M3. `save-failed` variant of `ErrorDialog` includes "删除卡片" button which is semantically wrong for save failures

**File:** `src/renderer/components/error-dialog.tsx:171-177` -- Deleting a card does not fix a disk-full or permission-denied save error. The button should not be present for `save-failed` (or should be disabled with explanation).

#### M4. E2E test helper `launchMockedApp` re-registers IPC handlers but does not clean up after test

**File:** `tests/e2e/helpers.ts:127-146` -- Handlers registered via `ipcMain.handle` persist across app lifetime. Tests that expect fresh handlers could get stale results if a prior test registered a custom handler.

#### M5. `CategoryEditorPopover` lacks `aria-describedby` for error message

**File:** `src/renderer/components/category-editor-popover.tsx` -- The error message (`<p role="alert">`) is announced by role=alert, but the dialog itself doesn't reference it via `aria-describedby`.

#### M6. `confirmation-dialog.tsx` uses `aria-labelledby` but no `aria-describedby` for the body

**File:** `src/renderer/components/confirmation-dialog.tsx` -- The dialog title is referenced by `aria-labelledby`, but the body (which contains the key consequence: "X cards will move to uncategorized") has no `aria-describedby` association.

#### M7. `ReorderControl` drag-and-drop has no keyboard alternative beyond up/down buttons

**File:** `src/renderer/components/reorder-control.tsx` -- The drag handle with `draggable` is set `aria-hidden` (correct), but there is no documented keyboard shortcut for drag operations beyond the up/down buttons (which are keyboard accessible). This is acceptable for V1 but worth noting.

---

## 3. Spec Compliance Assessment

| US   | Status       | Issues |
|------|-------------|--------|
| US1  | FAIL (2 CRITICAL) | C2 (name uniqueness), C3 (corruption silent recovery) |
| US2  | PASS with notes | I1 (onCreateNew no-op), category reorder works, multi-category works |
| US3  | FAIL (1 CRITICAL) | C1 (search scoring/scope not wired), I5 (locate failure undetectable) |
| US4  | FAIL (1 CRITICAL) | C4 (delete bypasses confirmation), C3 (corruption recovery) |

**Total FR coverage:** 44 FRs specified, ~40 implemented correctly, 4 with critical deviation (FR-006, FR-023, FR-024, FR-025, FR-010, FR-036a).

### Key Compliance Gaps

| FR    | Status | Detail |
|-------|--------|--------|
| FR-006 | FAIL | Name uniqueness not enforced |
| FR-009 | PASS | Re-associate works across S11/S16/S17 |
| FR-010 | FAIL | Error dialog delete bypasses confirmation |
| FR-016 | PASS | Category validation works (with no-inline-error gap) |
| FR-023 | FAIL | Search does not show across all cards |
| FR-024 | FAIL | Search scoring not wired to display |
| FR-025 | FAIL | Note field searched despite spec exclusion |
| FR-036a | FAIL | Corruption silent-recovery instead of blocking error |
| FR-036b | PASS | Tray minimize/restore/quit fully implemented |

### Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| I (Navigate, don't scan) | PASS | No disk scanning anywhere |
| II (Source file immutability) | PASS | No source file writes/deletes |
| III (No silent failures) | MINOR FAIL | Corruption data silent recovery (C3) |
| IV (Cross-platform parity) | PASS | Platform checks, path normalization |
| V (Accessibility baseline) | PASS WITH NOTES | See I3, I2, M5, M6 |
| VI (Strict V1 boundary) | PASS | No V2 features introduced |

---

## 4. Test Coverage Assessment

### Good Coverage
- **Store:** Save/load/corruption/detailed error codes/fsync/atomicity -- 8 tests, thorough.
- **Shell:** Open (success/no-default-app/unknown/no-precheck), showItemInFolder, HTML title extraction, selectFile -- 8 tests.
- **Validation:** All name, note, path validation rules -- 12 tests.
- **useCards:** Add card (normal/HTML title/duplicate/normalized path), update card categories/name/note, delete card, dispatching + persistence -- comprehensive.
- **useCategories:** Add/rename/delete/reserved names/sort/reorder -- comprehensive.
- **useSearch:** Matching/scoring (exact/prefix/contains/view order tiebreaker), debounce timing, whitespace trimming -- thorough.
- **useSort:** Immediate vs debounced order, reorder mode, external item sync -- thorough.
- **FileCard:** Render states, click/keyboard open, reorder mode blocking, more-menu -- 8+ tests.
- **CardFormDialog:** Create/edit rendering, validation, unsaved changes detection -- thorough.
- **AppShell:** Loading/error/ready/empty/card-grid states -- 5 tests.

### Gaps
- **No tests for:** `useFileRepair`, `ErrorDialog`, `DuplicateDialog`, `ConfirmationDialog`, `CategoryEditorPopover`, `CategoryNav`, `CategoryItem`, `ActionMenu`, `StatusBar`, `ReorderControl`, `FileTypeMark`, `EmptyState`, `FormField`, `ToolbarButton`, `ViewHeader`.
- **No AppStateProvider context test** (data load, corruption handling, load flow).
- **No E2E test for:** search flow with correct scoring, corrupted data recovery, cumulative failure threshold (3-strike), delete-card from error dialog, category reorder persistence.
- **No integration test** for the gap between `useSearch` and `useCards.visibleCards`.
- **Static audits** (CHK019/CHK020) are good but limited -- they test constant source-level constraints, not runtime behavior.

**Overall:** ~100 unit tests across core logic (good depth), ~22 E2E tests (moderate coverage). The renderer component gap means the "last mile" of UI rendering/testing is less thoroughly covered. The architectural disconnect between search hooks is untested.

---

## 5. Architecture Assessment

### Sound Elements
- **Main/Preload/Renderer separation** with `contextIsolation: true` and `nodeIntegration: false`.
- **`IpcResult<T>` discriminated union** for all IPC boundaries -- no raw throws across processes.
- **`useReducer` + `Context`** for global state -- simple, predictable, testable.
- **Custom hooks as domain boundaries:** Each hook owns a clear slice (`useCards` owns CRUD + search filtering, `useCategories` owns category CRUD, `useSearch` owns scoring, `useSort` owns reorder, `useFileRepair` owns failure tracking).
- **CSS tokens + BEM** -- consistent styling with documented contrast.

### Architectural Weaknesses
1. **Search has two parallel implementations** (`useCards.visibleCards` and `useSearch.searchResults`) that disagree on scope and sorting, with neither fully correct per spec. This is the single biggest architectural defect.
2. **Error state propagation is broken:** `AppState` defines `loadError` but nothing ever reads it. The loading/error/ready state machine in `AppShell` does not connect to the context's error state -- it only uses the props from `AppShellWithState`.
3. **View-order logic is duplicated** between `AppState` reducer (`UPDATE_CARD` case) and `useCards.updateCard` persistence function, with slightly different implementations. A single source of truth would reduce risk.
4. **No auto-save mechanism** -- every mutation calls `saveAppData` imperatively after the dispatch. If the app crashes between dispatch and save, in-memory state is lost. This is acceptable for V1 but fragile.
5. **`useSort` external merge logic** (adding/removing items from local order) has a subtle issue: when the same item reappears after being removed, it reappends at the end rather than at its previous position. For V1 this is acceptable.

---

## 6. Overall Verdict

### Needs Rework

**Rationale:** 4 critical issues (C1-C4) directly violate spec functional requirements (FR-006, FR-010, FR-023, FR-024, FR-025, FR-036a). The search system has a fundamental architectural flaw where the display (useCards.visibleCards) and the scoring engine (useSearch) are disconnected. Data corruption silently destroys user data instead of showing the spec-mandated blocking error. Name uniqueness -- a core data integrity requirement -- is not enforced. The error dialog's delete action bypasses the mandatory confirmation dialog.

These issues are not cosmetic; they directly impact core user journeys (US1, US3, US4) and data integrity. The application should not ship in its current state.

### Required Fixes Before Ship

1. **C1:** Wire `searchResults` from `useSearch()` into the card display when search is active. Remove note-field filtering from `useCards.visibleCards`.
2. **C2:** Add name-uniqueness validation at both form level and `addCard`/`renameCard` level.
3. **C3:** Fix `AppStateProvider` to propagate load errors to the UI. Fix `AppShellWithState` to render the error state. Implement the spec's two-stage error flow (retry -> "数据已损坏" dialog).
4. **C4:** Route "delete" from error dialogs through the S14 confirmation dialog.

### Recommended After Fixes
- Add unit tests for all untested components (see section 4 gaps).
- Add E2E test for the corrected search flow, verifying exact/prefix/contains scoring and all-cards scope.
- Re-verify all US acceptance scenarios after fixes.

---

**Report generated:** 2026-07-23  
**Review scope:** `a4fbaa3..c34f20f` (82 files, ~21K lines)  
**Review method:** Line-by-line reading of all 82 source files, 12 test files, 4 config files, 2 static audit files, 7 E2E test files.
