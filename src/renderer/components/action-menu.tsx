import React, { useEffect, useRef, useCallback } from 'react'
import type { MenuItem } from '@shared/types'
import '../styles/components/action-menu.css'

// ── Props ──

interface ActionMenuProps {
  /** Menu items to display. */
  items: MenuItem[]
  /** Bounding rect of the element the menu is anchored to. */
  anchor: DOMRect
  /** Called when the menu should close. */
  onClose: () => void
}

// ── Component ──

/**
 * Compact floating action menu positioned near an anchor element.
 *
 * - Items rendered as buttons with variant styling (default / danger / disabled).
 * - Danger items use --color-danger for text colour (not row background).
 * - Disabled items show a tooltip with `disabledReason` when provided.
 * - Closes on click-outside (capture phase) or Escape key.
 */
export function ActionMenu({ items, anchor, onClose }: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Close on click-outside ──

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    },
    [onClose]
  )

  // ── Close on Escape ──

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown, true)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleMouseDown, handleKeyDown])

  // ── Positioning: right-aligned with anchor, 4px below ──

  const menuWidth = 160
  let left = anchor.right - menuWidth
  if (left < 8) left = 8

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchor.bottom + 4,
    left,
  }

  if (items.length === 0) return null

  // ── Render ──

  return (
    <div
      ref={menuRef}
      className="qc-action-menu"
      style={style}
      role="menu"
      aria-label="操作菜单"
    >
      {items.map(item => {
        const isDisabled = item.variant === 'disabled'

        const classNames = [
          'qc-action-menu__item',
          item.variant === 'danger' ? 'qc-action-menu__item--danger' : '',
          isDisabled ? 'qc-action-menu__item--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={item.id}
            className={classNames}
            type="button"
            role="menuitem"
            disabled={isDisabled}
            title={
              isDisabled && item.disabledReason
                ? item.disabledReason
                : undefined
            }
            onClick={() => {
              if (!isDisabled) {
                item.onClick()
                onClose()
              }
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
