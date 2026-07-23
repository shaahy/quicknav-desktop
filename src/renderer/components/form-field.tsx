import React, { useRef, useCallback } from 'react'
import { useTextField } from 'react-aria'

// ── Types ──

type FormFieldType = 'text' | 'textarea' | 'readonly-path'

interface FormFieldProps {
  type: FormFieldType
  label: string
  value: string
  error: string | null
  maxLength: number | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

// ── Component ──

export function FormField(props: FormFieldProps) {
  const { type, label, error, maxLength, placeholder, disabled, value, onChange } = props

  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const isDisabled = disabled || type === 'readonly-path'
  const isTextarea = type === 'textarea'
  const isReadonlyPath = type === 'readonly-path'

  const { labelProps, inputProps, errorMessageProps } = useTextField(
    {
      inputElementType: isTextarea ? 'textarea' : 'input',
      label,
      value,
      onChange,
      isDisabled,
      isInvalid: error !== null,
      errorMessage: error ?? undefined,
      maxLength: maxLength ?? undefined,
      placeholder,
    },
    ref
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).catch(() => {})
  }, [value])

  // ── Styles ──

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-1)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-label)',
    fontWeight: 'var(--font-weight-label)',
    color: 'var(--color-text)',
  }

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: isTextarea ? 'auto' : 'var(--spacing-control-height)',
    minHeight: isTextarea
      ? 'calc(3em * 1.4 + 2 * var(--spacing-3))'
      : undefined,
    padding: isTextarea ? 'var(--spacing-3)' : '0 var(--spacing-3)',
    borderRadius: 'var(--rounded-sm)',
    border: `1px solid ${
      error ? 'var(--color-danger)' : 'var(--color-border)'
    }`,
    backgroundColor: isDisabled ? 'transparent' : 'var(--color-surface)',
    color: isReadonlyPath ? 'var(--color-text-disabled)' : 'var(--color-text)',
    fontFamily: isReadonlyPath ? 'var(--font-family-mono)' : 'var(--font-family-ui)',
    fontSize: 'var(--font-size-body)',
    lineHeight: isTextarea ? '1.4' : undefined,
    resize: isTextarea ? 'vertical' : 'none',
    outline: 'none',
    ...(isReadonlyPath ? { paddingRight: 'var(--spacing-8)' } : {}),
  }

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-meta)',
    color: 'var(--color-danger)',
  }

  const copyBtnStyle: React.CSSProperties = {
    position: 'absolute',
    right: 'var(--spacing-2)',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--spacing-5)',
    height: 'var(--spacing-5)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-action)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: 'var(--font-size-body)',
    padding: 0,
    lineHeight: 1,
  }

  const charCountStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-meta)',
    color: 'var(--color-text-muted)',
    textAlign: 'right',
    marginTop: 'var(--spacing-1)',
  }

  // ── Class names ──

  const inputClasses = [
    'qc-form-field__input',
    isTextarea && 'qc-form-field__input--textarea',
    error && 'qc-form-field__input--error',
  ]
    .filter(Boolean)
    .join(' ')

  // ── Render ──

  return (
    <div style={containerStyle} className="qc-form-field">
      <label
        {...labelProps}
        style={labelStyle}
        className="qc-form-field__label"
      />

      <div
        style={inputWrapperStyle}
        className="qc-form-field__input-wrapper"
      >
        {isTextarea ? (
          <textarea
            {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            style={inputStyle}
            className={inputClasses}
          />
        ) : (
          <input
            {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
            ref={ref as React.Ref<HTMLInputElement>}
            style={inputStyle}
            className={inputClasses}
          />
        )}

        {isReadonlyPath && (
          <button
            type="button"
            onClick={handleCopy}
            style={copyBtnStyle}
            className="qc-form-field__copy-btn"
            aria-label="复制路径"
          >
            复制
          </button>
        )}
      </div>

      {error && (
        <div
          {...errorMessageProps}
          style={errorStyle}
          className="qc-form-field__error"
        >
          {error}
        </div>
      )}

      {isTextarea && maxLength !== null && (
        <div
          style={charCountStyle}
          className="qc-form-field__char-count"
        >
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}
