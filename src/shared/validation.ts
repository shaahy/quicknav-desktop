import { MAX_CARD_NAME, MAX_CATEGORY_NAME, MAX_NOTE, RESERVED_NAMES } from './constants'

export function validateCardName(name: string, existingNames: string[]): string | null {
  const trimmed = name.trim()
  if (!trimmed) return '名称不能为空'
  if (trimmed.includes('\n')) return '名称不能包含换行'
  if (trimmed.length > MAX_CARD_NAME) return `名称最多 ${MAX_CARD_NAME} 个字符`
  if (existingNames.includes(trimmed)) return '该名称已被使用'
  return null
}

export function validateCategoryName(name: string, existingNames: string[]): string | null {
  const trimmed = name.trim()
  if (!trimmed) return '名称不能为空'
  if (trimmed.includes('\n')) return '名称不能包含换行'
  if (trimmed.length > MAX_CATEGORY_NAME) return `名称最多 ${MAX_CATEGORY_NAME} 个字符`
  if ((RESERVED_NAMES as readonly string[]).includes(trimmed)) return '保留名称，不可使用'
  if (existingNames.map(n => n.trim()).includes(trimmed)) return '该名称已被使用'
  return null
}

export function validateNote(note: string): string | null {
  if (note.length > MAX_NOTE) return `备注最多 ${MAX_NOTE} 个字符`
  return null
}

export function normalizeNote(note: string): string | null {
  const trimmed = note.trim()
  return trimmed ? trimmed : null
}

export function isHtmlFile(extension: string): boolean {
  return extension === 'html' || extension === 'htm'
}

export function normalizePath(p: string, platform: 'win32' | 'darwin'): string {
  if (platform === 'win32') {
    let normalized = p.replace(/\\/g, '/')
    if (/^[a-z]:\//i.test(normalized)) {
      normalized = normalized[0].toUpperCase() + normalized.slice(1)
    }
    return normalized
  }
  return p
}

export function hasUnsavedChanges(
  current: { name: string; note: string; categoryIds: string[] },
  initial: { name: string; note: string; categoryIds: string[] }
): boolean {
  return (
    current.name !== initial.name ||
    current.note !== initial.note ||
    JSON.stringify([...current.categoryIds].sort()) !== JSON.stringify([...initial.categoryIds].sort())
  )
}
