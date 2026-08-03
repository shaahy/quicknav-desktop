import React, { useCallback, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type {
  BatchAddResult,
  BatchCardInput,
  Card,
  Category,
  ScanFileType,
  ScannedFile,
} from '@shared/types'
import { MAX_CARDS } from '@shared/constants'
import { normalizePath, validateCardName } from '@shared/validation'
import '../styles/components/scan-dialog.css'

interface ScanDialogProps {
  cards: Card[]
  categories: Category[]
  onAdd: (inputs: BatchCardInput[]) => Promise<BatchAddResult>
  onClose: () => void
}

interface ScanDraft {
  file: ScannedFile
  name: string
  categoryIds: string[]
}

const FILE_TYPE_OPTIONS: Array<{
  id: ScanFileType
  label: string
  extensions: string
}> = [
  { id: 'html', label: 'HTML', extensions: 'html / htm' },
  { id: 'word', label: 'Word', extensions: 'doc / docx' },
  { id: 'powerpoint', label: 'PowerPoint', extensions: 'ppt / pptx' },
  { id: 'excel', label: 'Excel', extensions: 'xls / xlsx' },
  { id: 'markdown', label: 'Markdown', extensions: 'md' },
]

const ALL_FILE_TYPES = FILE_TYPE_OPTIONS.map(option => option.id)

export function ScanDialog({
  cards,
  categories,
  onAdd,
  onClose,
}: ScanDialogProps) {
  const [folder, setFolder] = useState<{
    relativePath: string
    displayPath: string
  } | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<ScanFileType[]>(ALL_FILE_TYPES)
  const [drafts, setDrafts] = useState<ScanDraft[]>([])
  const [bulkCategoryIds, setBulkCategoryIds] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanCompleted, setScanCompleted] = useState(false)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [skippedEntries, setSkippedEntries] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const platform = window.electronAPI.getPlatform()
  const existingNames = useMemo(() => cards.map(card => card.name), [cards])
  const existingPaths = useMemo(
    () => new Set(
      cards.map(card => normalizePath(card.fileReference.relativePath, platform))
    ),
    [cards, platform]
  )

  const nameCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const draft of drafts) {
      const name = draft.name.trim()
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return counts
  }, [drafts])

  const getNameError = useCallback(
    (draft: ScanDraft): string | null => {
      const validationError = validateCardName(draft.name, existingNames)
      if (validationError) return validationError
      return (nameCounts.get(draft.name.trim()) ?? 0) > 1
        ? '扫描结果中的名称重复'
        : null
    },
    [existingNames, nameCounts]
  )

  const remainingCapacity = MAX_CARDS - cards.length
  const invalidDraftCount = drafts.filter(
    draft => getNameError(draft) !== null || draft.categoryIds.length === 0
  ).length
  const overCapacity = drafts.length > remainingCapacity
  const canSave =
    drafts.length > 0 &&
    invalidDraftCount === 0 &&
    !overCapacity &&
    !isSaving

  const handleSelectFolder = useCallback(async () => {
    setError(null)
    try {
      const result = await window.electronAPI.selectScanFolder()
      if (result.error) {
        setError(result.error)
        return
      }
      if (!result.canceled && result.folder) {
        setFolder(result.folder)
        setDrafts([])
        setScanCompleted(false)
        setDuplicateCount(0)
        setSkippedEntries(0)
      }
    } catch {
      setError('无法打开文件夹选择器')
    }
  }, [])

  const handleToggleType = useCallback((fileType: ScanFileType) => {
    setSelectedTypes(current =>
      current.includes(fileType)
        ? current.filter(item => item !== fileType)
        : [...current, fileType]
    )
    setDrafts([])
    setScanCompleted(false)
    setDuplicateCount(0)
    setSkippedEntries(0)
    setError(null)
  }, [])

  const handleScan = useCallback(async () => {
    if (!folder || selectedTypes.length === 0) return
    setIsScanning(true)
    setError(null)
    try {
      const result = await window.electronAPI.scanFolder(
        folder.relativePath,
        selectedTypes
      )
      if (result.error) {
        setError(result.error)
        setDrafts([])
        return
      }

      let duplicates = 0
      const nextDrafts: ScanDraft[] = []
      for (const file of result.files) {
        const normalizedPath = normalizePath(file.relativePath, platform)
        if (existingPaths.has(normalizedPath)) {
          duplicates += 1
          continue
        }
        nextDrafts.push({
          file,
          name: file.suggestedName,
          categoryIds: [],
        })
      }
      setDrafts(nextDrafts)
      setDuplicateCount(duplicates)
      setSkippedEntries(result.skippedEntries)
      setScanCompleted(true)
    } catch {
      setError('扫描失败，请检查文件夹访问权限')
      setDrafts([])
    } finally {
      setIsScanning(false)
    }
  }, [existingPaths, folder, platform, selectedTypes])

  const handleNameChange = useCallback((relativePath: string, name: string) => {
    setDrafts(current => current.map(draft =>
      draft.file.relativePath === relativePath ? { ...draft, name } : draft
    ))
  }, [])

  const handleCategoryToggle = useCallback(
    (relativePath: string, categoryId: string) => {
      setDrafts(current => current.map(draft => {
        if (draft.file.relativePath !== relativePath) return draft
        const categoryIds = draft.categoryIds.includes(categoryId)
          ? draft.categoryIds.filter(id => id !== categoryId)
          : [...draft.categoryIds, categoryId]
        return { ...draft, categoryIds }
      }))
    },
    []
  )

  const handleBulkCategoryToggle = useCallback((categoryId: string) => {
    setBulkCategoryIds(current =>
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    )
  }, [])

  const handleApplyCategoriesToAll = useCallback(() => {
    if (bulkCategoryIds.length === 0) return
    setDrafts(current => current.map(draft => ({
      ...draft,
      categoryIds: [...bulkCategoryIds],
    })))
  }, [bulkCategoryIds])

  const handleRemoveDraft = useCallback((relativePath: string) => {
    setDrafts(current =>
      current.filter(draft => draft.file.relativePath !== relativePath)
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setIsSaving(true)
    setError(null)
    try {
      const result = await onAdd(drafts.map(draft => ({
        file: draft.file,
        name: draft.name.trim(),
        categoryIds: draft.categoryIds,
      })))
      if (result.error) {
        setError(`批量添加失败：${result.error}`)
        setIsSaving(false)
        return
      }
      onClose()
    } catch {
      setError('批量添加失败：unknown')
      setIsSaving(false)
    }
  }, [canSave, drafts, onAdd, onClose])

  return (
    <Dialog.Root open onOpenChange={open => { if (!open && !isSaving) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="qc-scan-dialog__overlay" />
        <Dialog.Content
          className="qc-scan-dialog"
          aria-labelledby="qc-scan-dialog-title"
        >
          <header className="qc-scan-dialog__header">
            <div>
              <Dialog.Title id="qc-scan-dialog-title" className="qc-scan-dialog__title">
                扫描批量添加卡片
              </Dialog.Title>
              <Dialog.Description className="qc-scan-dialog__description">
                扫描根目录及一级子文件夹，确认名称与类别后一次性添加。
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="qc-scan-dialog__close"
                aria-label="关闭扫描界面"
                disabled={isSaving}
              >
                ×
              </button>
            </Dialog.Close>
          </header>

          <div className="qc-scan-dialog__setup">
            <section className="qc-scan-dialog__folder-section">
              <span className="qc-scan-dialog__section-label">扫描文件夹</span>
              <div className="qc-scan-dialog__folder-row">
                <div className="qc-scan-dialog__folder-path" title={folder?.displayPath}>
                  {folder?.displayPath ?? '尚未选择文件夹'}
                </div>
                <button
                  type="button"
                  className="qc-scan-dialog__secondary-btn"
                  onClick={handleSelectFolder}
                  disabled={isScanning || isSaving}
                >
                  选择文件夹
                </button>
              </div>
            </section>

            <fieldset className="qc-scan-dialog__types">
              <legend className="qc-scan-dialog__section-label">扫描类型（可多选）</legend>
              <div className="qc-scan-dialog__type-options">
                {FILE_TYPE_OPTIONS.map(option => (
                  <label key={option.id} className="qc-scan-dialog__type-option">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(option.id)}
                      onChange={() => handleToggleType(option.id)}
                      disabled={isScanning || isSaving}
                    />
                    <span>{option.label}</span>
                    <small>{option.extensions}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="qc-scan-dialog__scan-btn"
              onClick={handleScan}
              disabled={!folder || selectedTypes.length === 0 || isScanning || isSaving}
            >
              {isScanning ? '正在扫描…' : '开始扫描'}
            </button>
          </div>

          {error && (
            <div className="qc-scan-dialog__error" role="alert">{error}</div>
          )}

          {scanCompleted && (
            <div className="qc-scan-dialog__summary" role="status">
              待添加 {drafts.length} 个文件
              {duplicateCount > 0 && `；已排除 ${duplicateCount} 个已添加文件`}
              {skippedEntries > 0 && `；${skippedEntries} 个项目无法访问或为符号链接`}
            </div>
          )}

          {drafts.length > 0 && (
            <>
              <section className="qc-scan-dialog__bulk-categories">
                <div>
                  <span className="qc-scan-dialog__section-label">统一设置类别</span>
                  <div className="qc-scan-dialog__bulk-options">
                    {categories.length > 0
                      ? categories.map(category => (
                          <label key={category.id}>
                            <input
                              type="checkbox"
                              checked={bulkCategoryIds.includes(category.id)}
                              onChange={() => handleBulkCategoryToggle(category.id)}
                              disabled={isSaving}
                            />
                            {category.name}
                          </label>
                        ))
                      : <span className="qc-scan-dialog__field-error">请先创建类别</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="qc-scan-dialog__secondary-btn"
                  onClick={handleApplyCategoriesToAll}
                  disabled={bulkCategoryIds.length === 0 || isSaving}
                >
                  应用到全部
                </button>
              </section>

              <div className="qc-scan-dialog__table-wrap">
                <table className="qc-scan-dialog__table">
                  <thead>
                    <tr>
                      <th>文件</th>
                      <th>卡片名称</th>
                      <th>类别</th>
                      <th><span className="qc-scan-dialog__sr-only">操作</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map(draft => {
                      const nameError = getNameError(draft)
                      return (
                        <tr key={draft.file.relativePath}>
                          <td>
                            <div className="qc-scan-dialog__file-name">
                              {draft.file.fileName}.{draft.file.extension}
                            </div>
                            <div
                              className="qc-scan-dialog__file-path"
                              title={draft.file.relativePath}
                            >
                              {draft.file.relativePath}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="qc-scan-dialog__name-input"
                              value={draft.name}
                              onChange={event =>
                                handleNameChange(draft.file.relativePath, event.target.value)
                              }
                              aria-invalid={nameError !== null}
                              disabled={isSaving}
                            />
                            {nameError && (
                              <div className="qc-scan-dialog__field-error">{nameError}</div>
                            )}
                          </td>
                          <td>
                            <details className="qc-scan-dialog__category-picker">
                              <summary>
                                {draft.categoryIds.length > 0
                                  ? `已选 ${draft.categoryIds.length} 个类别`
                                  : '请选择类别'}
                              </summary>
                              <div className="qc-scan-dialog__category-options">
                                {categories.map(category => (
                                  <label key={category.id}>
                                    <input
                                      type="checkbox"
                                      checked={draft.categoryIds.includes(category.id)}
                                      onChange={() =>
                                        handleCategoryToggle(
                                          draft.file.relativePath,
                                          category.id
                                        )
                                      }
                                      disabled={isSaving}
                                    />
                                    {category.name}
                                  </label>
                                ))}
                              </div>
                            </details>
                            {draft.categoryIds.length === 0 && (
                              <div className="qc-scan-dialog__field-error">请至少选择一个类别</div>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="qc-scan-dialog__remove-btn"
                              onClick={() => handleRemoveDraft(draft.file.relativePath)}
                              disabled={isSaving}
                            >
                              移除
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {scanCompleted && drafts.length === 0 && !error && (
            <div className="qc-scan-dialog__empty">
              没有发现可添加的目标文件。
            </div>
          )}

          <footer className="qc-scan-dialog__footer">
            <div className="qc-scan-dialog__validation-summary" aria-live="polite">
              {overCapacity
                ? `超出容量：当前最多还能添加 ${remainingCapacity} 张卡片`
                : invalidDraftCount > 0
                  ? `还有 ${invalidDraftCount} 项需要完善名称或类别`
                  : drafts.length > 0
                    ? `${drafts.length} 项已可添加`
                    : ''}
            </div>
            <div className="qc-scan-dialog__footer-actions">
              <button
                type="button"
                className="qc-scan-dialog__secondary-btn"
                onClick={onClose}
                disabled={isSaving}
              >
                取消
              </button>
              <button
                type="button"
                className="qc-scan-dialog__primary-btn"
                onClick={handleSave}
                disabled={!canSave}
              >
                {isSaving ? '正在添加…' : `批量添加${drafts.length > 0 ? `（${drafts.length}）` : ''}`}
              </button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
