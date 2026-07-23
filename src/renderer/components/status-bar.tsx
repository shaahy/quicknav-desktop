import React, { useEffect, useRef, useCallback } from 'react'
import { STATUS_BAR_MIN_MS } from '@shared/constants'
import '../styles/components/status-bar.css'

// ── Props ──

interface StatusBarProps {
  /** 状态消息文本 */
  message: string
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onDismiss: () => void
  /** 触发元素的 ID（关闭后将焦点返回该元素） */
  triggerElementId?: string
}

// ── Component ──

/**
 * Transient status bar anchored to the bottom of the main content area.
 *
 * - Auto-dismisses after STATUS_BAR_MIN_MS (8 seconds).
 * - Hovering or focusing pauses the auto-dismiss timer (remaining time
 *   preserved). Resumes on leave / blur.
 * - On dismiss (auto or manual), focus is returned to `triggerElementId`
 *   so keyboard navigation is not disrupted.
 * - Uses `role="status"` + `aria-live="polite"` for accessibility.
 * - Absolutely positioned at the bottom; does NOT push layout.
 */
export function StatusBar({
  message,
  visible,
  onDismiss,
  triggerElementId,
}: StatusBarProps) {
  // ── Timer refs ──

  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef(0)
  const remainingRef = useRef(STATUS_BAR_MIN_MS)

  // ── Timer helpers ──

  const clearTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current)
      timerIdRef.current = null
    }
  }, [])

  const doDismiss = useCallback(() => {
    // Return focus to the trigger element before notifying the parent
    if (triggerElementId) {
      const trigger = document.getElementById(triggerElementId)
      if (trigger) {
        trigger.focus()
      }
    }
    onDismiss()
  }, [onDismiss, triggerElementId])

  const startTimer = useCallback(() => {
    clearTimer()
    if (remainingRef.current <= 0) return

    startTimeRef.current = Date.now()
    timerIdRef.current = setTimeout(doDismiss, remainingRef.current)
  }, [clearTimer, doDismiss])

  const pauseTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current
      remainingRef.current = Math.max(0, remainingRef.current - elapsed)
      clearTimer()
    }
  }, [clearTimer])

  // ── Effect: manage auto-dismiss cycle ──

  useEffect(() => {
    if (visible) {
      remainingRef.current = STATUS_BAR_MIN_MS
      startTimer()
    } else {
      clearTimer()
    }

    return clearTimer
  }, [visible, message, startTimer, clearTimer])

  // ── Hover / focus handlers ──

  const handleMouseEnter = pauseTimer

  const handleMouseLeave = useCallback(() => {
    if (visible) {
      startTimer()
    }
  }, [visible, startTimer])

  const handleFocusCapture = pauseTimer

  const handleBlurCapture = useCallback(() => {
    if (visible) {
      startTimer()
    }
  }, [visible, startTimer])

  const handleDismissClick = useCallback(() => {
    clearTimer()
    doDismiss()
  }, [clearTimer, doDismiss])

  // ── Render ──

  if (!visible) return null

  return (
    <div
      className="qc-status-bar"
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <span className="qc-status-bar__message">{message}</span>
      <button
        className="qc-status-bar__dismiss"
        onClick={handleDismissClick}
        type="button"
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  )
}
