import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { validateCategoryName } from '../../shared/validation';
import { MAX_CATEGORY_NAME_LENGTH } from '../../shared/constants';

const CLASS_PREFIX = 'qc-category-editor-popover';

export interface CategoryEditorPopoverProps {
  /** 创建 / 重命名模式 */
  mode: 'create' | 'rename';
  /** 重命名模式下的初始名称（创建模式传空字符串） */
  initialName: string;
  /** 保存回调，仅在验证通过后调用 */
  onSave: (name: string) => void;
  /** 关闭回调，归还焦点给触发元素 */
  onClose: () => void;
  /** 定位锚点（触发元素的 DOMRect） */
  anchor: DOMRect;
  /** 已有的类别名列表，用于唯一性校验 */
  existingNames: string[];
}

/**
 * category-editor-popover 组件
 *
 * 使用 @radix-ui/react-popover 实现的浮动浮层，用于类别创建和重命名。
 * CSS class 统一使用 'qc-category-editor-popover' 前缀。
 *
 * 行为契约:
 * - 单文本字段，打开时自动聚焦并全选
 * - Enter 键保存（经过校验），Esc / 点击外部 / 取消按钮关闭并归还焦点
 * - 校验规则: 非空、≤30 字符、非保留名称、不与其他类别名重复
 * - 错误文案紧贴输入框下方显示
 */
export function CategoryEditorPopover({
  mode,
  initialName,
  onSave,
  onClose,
  anchor,
  existingNames,
}: CategoryEditorPopoverProps): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const [name, setName] = React.useState(initialName);
  const [error, setError] = React.useState<string | null>(null);

  /* ------ 锚点定位 ------ */
  React.useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    el.style.left = `${anchor.left}px`;
    el.style.top = `${anchor.top}px`;
    el.style.width = `${anchor.width}px`;
    el.style.height = `${anchor.height}px`;
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.margin = '0';
    el.style.padding = '0';
  }, [anchor]);

  /* ------ 自动聚焦输入框 ------ */
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ------ 校验与保存 ------ */
  const handleSave = React.useCallback(() => {
    const trimmed = name.trim();

    // 重命名模式排除当前名称，以避免自身重复误报
    const excludeSelf =
      mode === 'rename' && initialName
        ? [initialName.trim()]
        : [];
    const checkNames = existingNames.filter(
      (n) => !excludeSelf.includes(n),
    );

    const validationError = validateCategoryName(trimmed, checkNames);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(trimmed);
  }, [name, mode, initialName, existingNames, onSave]);

  /* ------ 关闭（Esc / 点击外部） ------ */
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  /* ------ 键盘交互 ------ */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      // Escape 由 Radix Popover 通过 onOpenChange 处理
    },
    [handleSave],
  );

  /* ------ 输入变化 ------ */
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (error) setError(null);
    },
    [error],
  );

  /* ------ UI 文案 ------ */
  const title = mode === 'create' ? '新建类别' : '重命名类别';
  const labelId = `${CLASS_PREFIX}__label`;
  const errorId = `${CLASS_PREFIX}__error`;

  return (
    <Popover.Root open={true} onOpenChange={handleOpenChange}>
      <Popover.Anchor asChild>
        <span ref={anchorRef} />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className={CLASS_PREFIX}
          style={contentStyle}
          aria-labelledby={labelId}
        >
          {/* 标题 */}
          <label
            id={labelId}
            className={`${CLASS_PREFIX}__label`}
            style={labelStyle}
          >
            {title}
          </label>

          {/* 输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'create' ? '输入类别名称' : '输入新名称'}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            style={inputStyle(!!error)}
            className={`${CLASS_PREFIX}__input`}
          />

          {/* 错误文案 */}
          {error && (
            <div
              id={errorId}
              role="alert"
              className={`${CLASS_PREFIX}__error`}
              style={errorStyle}
            >
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div
            className={`${CLASS_PREFIX}__actions`}
            style={actionsStyle}
          >
            <button
              type="button"
              onClick={onClose}
              className={`${CLASS_PREFIX}__btn ${CLASS_PREFIX}__btn--cancel`}
              style={cancelBtnStyle}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`${CLASS_PREFIX}__btn ${CLASS_PREFIX}__btn--save`}
              style={saveBtnStyle}
            >
              保存
            </button>
          </div>

          {/* Radix Popover 箭头 */}
          <Popover.Arrow
            className={`${CLASS_PREFIX}__arrow`}
            style={{ fill: 'var(--color-surface, #ffffff)' }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ========== 内联样式 ========== */

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  border: '1px solid var(--color-border, #d0d0d0)',
  borderRadius: 'var(--rounded-md, 6px)',
  background: 'var(--color-surface, #ffffff)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  minWidth: '240px',
  zIndex: 50,
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text, #1a1a1a)',
  userSelect: 'none',
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '6px 8px',
  fontSize: '14px',
  lineHeight: 1.4,
  border: `1px solid ${
    hasError
      ? 'var(--color-danger, #d32f2f)'
      : 'var(--color-border, #d0d0d0)'
  }`,
  borderRadius: '4px',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--color-canvas, #fafafa)',
  color: 'var(--color-text, #1a1a1a)',
  transition: 'border-color 0.15s ease',
});

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-danger, #d32f2f)',
  lineHeight: 1.3,
  margin: 0,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '4px',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '13px',
  lineHeight: 1.4,
  border: '1px solid var(--color-border, #d0d0d0)',
  borderRadius: '4px',
  background: 'var(--color-surface, #fff)',
  color: 'var(--color-text, #1a1a1a)',
  cursor: 'pointer',
  userSelect: 'none',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '13px',
  lineHeight: 1.4,
  border: '1px solid var(--color-action, #1976d2)',
  borderRadius: '4px',
  background: 'var(--color-action, #1976d2)',
  color: 'var(--color-on-action, #fff)',
  cursor: 'pointer',
  userSelect: 'none',
};
