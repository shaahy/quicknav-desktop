import { describe, it, expect } from 'vitest'
import { validateCardName, validateCategoryName, validateNote, normalizeNote, isHtmlFile, normalizePath } from '../../src/shared/validation'

describe('validateCardName', () => {
  it('returns error for empty name after trim', () => {
    expect(validateCardName('   ', [])).toBe('名称不能为空')
    expect(validateCardName('', [])).toBe('名称不能为空')
  })
  it('returns error for name > 80 characters', () => {
    expect(validateCardName('a'.repeat(81), [])).toBe('名称最多 80 个字符')
  })
  it('returns null for name exactly 80 characters', () => {
    expect(validateCardName('a'.repeat(80), [])).toBeNull()
  })
  it('returns error for name with newline', () => {
    expect(validateCardName('hello\nworld', [])).toBe('名称不能包含换行')
  })
  it('returns error for duplicate name (case-sensitive)', () => {
    expect(validateCardName('Test', ['Test'])).toBe('该名称已被使用')
    expect(validateCardName('test', ['Test'])).toBeNull()
  })
})

describe('validateCategoryName', () => {
  it('returns error for reserved name', () => {
    expect(validateCategoryName('全部卡片', [])).toBe('保留名称，不可使用')
    expect(validateCategoryName('我的收藏', [])).toBe('保留名称，不可使用')
    expect(validateCategoryName('未分类', [])).toBe('保留名称，不可使用')
  })
  it('returns error for empty after trim', () => {
    expect(validateCategoryName('  ', [])).toBe('名称不能为空')
  })
  it('returns error for > 30 characters', () => {
    expect(validateCategoryName('a'.repeat(31), [])).toBe('名称最多 30 个字符')
  })
  it('returns error for duplicate trimmed name', () => {
    expect(validateCategoryName(' 工作 ', ['工作'])).toBe('该名称已被使用')
  })
})

describe('validateNote', () => {
  it('returns error for > 500 characters including newlines', () => {
    const long = 'a'.repeat(498) + '\n\n\n'
    expect(validateNote(long)).toBe('备注最多 500 个字符')
  })
  it('returns null for valid note', () => {
    expect(validateNote('some note')).toBeNull()
  })
})

describe('normalizeNote', () => {
  it('returns null for whitespace-only', () => {
    expect(normalizeNote('   \n  ')).toBeNull()
  })
  it('returns trimmed text for valid note', () => {
    expect(normalizeNote('  hello world  ')).toBe('hello world')
  })
})

describe('normalizePath', () => {
  it('converts backslashes to forward slashes on win32', () => {
    expect(normalizePath('C:\\Users\\test\\file.txt', 'win32')).toBe('C:/Users/test/file.txt')
  })
  it('uppercases drive letter on win32', () => {
    expect(normalizePath('c:/users/test', 'win32')).toBe('C:/users/test')
  })
  it('preserves POSIX paths on darwin', () => {
    expect(normalizePath('/Users/test/file.txt', 'darwin')).toBe('/Users/test/file.txt')
  })
})
