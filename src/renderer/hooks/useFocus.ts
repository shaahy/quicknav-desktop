import { useRef, useCallback } from 'react'
import type { RefObject } from 'react'

export function useFocus() {
  const focusReturnStack = useRef<HTMLElement[]>([])

  /** Save the currently focused element to the return stack. */
  const pushFocus = useCallback((element?: HTMLElement | null): void => {
    const el = element ?? (document.activeElement as HTMLElement | null)
    if (el && typeof el.focus === 'function') {
      focusReturnStack.current.push(el)
    }
  }, [])

  /** Restore focus to the last element in the stack without removing it. */
  const peekFocus = useCallback((): HTMLElement | undefined => {
    const stack = focusReturnStack.current
    return stack.length > 0 ? stack[stack.length - 1] : undefined
  }, [])

  /** Return focus to the most recently saved element and pop it from the stack. */
  const popFocus = useCallback((): void => {
    const el = focusReturnStack.current.pop()
    if (el && typeof el.focus === 'function') {
      el.focus()
    }
  }, [])

  /**
   * Trap Tab / Shift+Tab navigation within a container element.
   * Call this in a `onKeyDown` handler on the container.
   *
   * Usage:
   *   const { trapFocus } = useFocus()
   *   <div onKeyDown={trapFocus(containerRef)} ref={containerRef}>
   */
  const trapFocus = useCallback(
    (containerRef: RefObject<HTMLElement | null>) => {
      return (e: React.KeyboardEvent) => {
        if (e.key !== 'Tab') return
        const container = containerRef.current
        if (!container) return

        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    []
  )

  return { pushFocus, peekFocus, popFocus, trapFocus }
}
