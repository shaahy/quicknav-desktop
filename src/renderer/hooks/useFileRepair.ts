import { useCallback, useRef } from 'react'
import { normalizePath } from '@shared/validation'
import { CUMULATIVE_FAILURE_THRESHOLD } from '@shared/constants'
import { useCards } from './useCards'
import { useAppState } from '../contexts/AppState'

// ── Public API ──

export interface RepairResult {
  /** Outcome of the repair attempt. */
  result: 'success' | 'duplicate' | 'canceled'
  /**
   * Set when `result === 'duplicate'` — the ID of the card that already
   * references the selected file.
   */
  duplicateCardId?: string
  /** Set when `result === 'duplicate'` — the name of the existing card. */
  duplicateCardName?: string
}

export interface UseFileRepairReturn {
  /**
   * Unified repair flow for S11 (edit replace), S16 (open-failed),
   * and S17 (locate-failed).
   *
   * 1. Opens the native file-selection dialog.
   * 2. Checks for duplicate paths (excluding self).
   * 3. Calls `useCards.repairFile()` to persist the new reference.
   * 4. Resets the cumulative failure counter on success.
   *
   * Retains card name, note, categories, and view orders.
   */
  repairFile: (cardId: string) => Promise<RepairResult>

  /** Current consecutive open-failure count for the given card. */
  getFailureCount: (cardId: string) => number

  /** Increment the failure counter; returns the new count. */
  incrementFailure: (cardId: string) => number

  /** Reset the failure counter (e.g. after repair or app restart). */
  resetFailureCount: (cardId: string) => void

  /** True when the card has reached CUMULATIVE_FAILURE_THRESHOLD consecutive failures. */
  isWarningCard: (cardId: string) => boolean
}

// ── Hook ──

/**
 * File-repair and cumulative-failure tracking hook.
 *
 * - Tracks consecutive open-/locate-failures per card in a `useRef` Map so the
 *   counter does **not** reset on re-renders but **does** reset on repair or
 *   app restart (fresh Map each mount).
 * - The `repairFile` function is the single entry point for all three repair
 *   paths (S11 edit-replace, S16 open-failed, S17 locate-failed).
 */
export function useFileRepair(): UseFileRepairReturn {
  const { state } = useAppState()
  const { repairFile: cardsRepairFile, findDuplicateByPath } = useCards()
  const failureCountsRef = useRef<Map<string, number>>(new Map())

  const getFailureCount = useCallback((cardId: string): number => {
    return failureCountsRef.current.get(cardId) ?? 0
  }, [])

  const incrementFailure = useCallback((cardId: string): number => {
    const count = (failureCountsRef.current.get(cardId) ?? 0) + 1
    failureCountsRef.current.set(cardId, count)
    return count
  }, [])

  const resetFailureCount = useCallback((cardId: string): void => {
    failureCountsRef.current.delete(cardId)
  }, [])

  const isWarningCard = useCallback((cardId: string): boolean => {
    return (failureCountsRef.current.get(cardId) ?? 0) >= CUMULATIVE_FAILURE_THRESHOLD
  }, [])

  const repairFile = useCallback(
    async (cardId: string): Promise<RepairResult> => {
      // 0. Verify the card exists before proceeding
      if (!state.data.cards.some(c => c.id === cardId)) {
        return { result: 'canceled' }
      }

      // 1. Open native file-selection dialog
      const fileResult = await window.electronAPI.selectFile()
      if (fileResult.canceled || !fileResult.file) {
        return { result: 'canceled' }
      }

      // 2. Normalize and check duplicates (skip self)
      const platform = window.electronAPI.getPlatform()
      const normalized = normalizePath(fileResult.file.absolutePath, platform)
      // Pass normalized path; the underlying cardsRepairFile also normalizes
      // internally, but we need it here for the duplicate check.
      const duplicate = findDuplicateByPath(normalized)
      if (duplicate && duplicate.id !== cardId) {
        return {
          result: 'duplicate',
          duplicateCardId: duplicate.id,
          duplicateCardName: duplicate.name,
        }
      }

      // 3. Persist the new file reference (retains name, note, categories, view orders)
      await cardsRepairFile(cardId, fileResult)

      // 4. Reset failure counter on success
      resetFailureCount(cardId)

      return { result: 'success' }
    },
    [cardsRepairFile, findDuplicateByPath, resetFailureCount, state.data.cards]
  )

  return {
    repairFile,
    getFailureCount,
    incrementFailure,
    resetFailureCount,
    isWarningCard,
  }
}
