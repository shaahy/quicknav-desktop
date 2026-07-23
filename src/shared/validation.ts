import { MAX_CATEGORY_NAME_LENGTH, RESERVED_CATEGORY_NAMES } from './constants';

/**
 * 校验类别名称
 * @param name - 待校验的类别名
 * @param existingNames - 已有类别名列表（用于唯一性检查），可选
 * @returns 校验通过返回 null，否则返回错误文案
 */
export function validateCategoryName(
  name: string,
  existingNames?: string[],
): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return '类别名不能为空';
  }

  if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
    return `类别名不能超过${MAX_CATEGORY_NAME_LENGTH}个字符`;
  }

  if ((RESERVED_CATEGORY_NAMES as readonly string[]).includes(trimmed)) {
    return `"${trimmed}"为保留名称，不可使用`;
  }

  if (existingNames && existingNames.includes(trimmed)) {
    return '该名称已存在';
  }

  return null;
}
