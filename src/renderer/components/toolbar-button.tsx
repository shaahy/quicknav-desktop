import { useRef } from 'react'
import { useButton } from 'react-aria'
import '../styles/components/toolbar-button.css'

export interface ToolbarButtonProps {
  /** Button label / accessible name */
  label: string
  /** Visual variant: primary uses action color, secondary uses surface + border */
  variant?: 'primary' | 'secondary'
  /** Press handler */
  onClick: () => void
  /** Disables interaction; when true, disabledReason is shown on hover/tooltip */
  disabled?: boolean
  /** Explanation shown via tooltip when disabled (optional) */
  disabledReason?: string
  /** Unicode icon character rendered before the label */
  icon?: string | null
}

export function ToolbarButton({
  label,
  variant = 'secondary',
  onClick,
  disabled = false,
  disabledReason,
  icon = null,
}: ToolbarButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const { buttonProps } = useButton(
    {
      onPress: onClick,
      isDisabled: disabled,
      'aria-label': label,
    },
    ref
  )

  const className = [
    'qc-toolbar-button',
    `qc-toolbar-button--${variant}`,
    disabled ? 'qc-toolbar-button--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={className}
      title={disabled && disabledReason ? disabledReason : undefined}
    >
      {icon != null && (
        <span className="qc-toolbar-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="qc-toolbar-button__label">{label}</span>
    </button>
  )
}
