/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ScanDialog } from '../../src/renderer/components/scan-dialog'
import type { Category } from '../../src/shared/types'

const categories: Category[] = [
  {
    id: 'cat-work',
    name: '工作',
    order: 0,
    type: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

describe('ScanDialog', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('scans recursively returned files, applies one category to all, and submits one batch', async () => {
    vi.spyOn(window.electronAPI, 'selectScanFolder').mockResolvedValue({
      canceled: false,
      folder: {
        relativePath: '../documents',
        displayPath: 'E:\\documents',
      },
    })
    const scanFolder = vi.spyOn(window.electronAPI, 'scanFolder').mockResolvedValue({
      files: [
        {
          relativePath: '../documents/a.md',
          fileName: 'a',
          extension: 'md',
          fileSize: 10,
          mtimeMs: 100,
          isHtml: false,
          suggestedName: '文档 A',
        },
        {
          relativePath: '../documents/nested/b.html',
          fileName: 'b',
          extension: 'html',
          fileSize: 20,
          mtimeMs: 200,
          isHtml: true,
          suggestedName: '网页 B',
        },
      ],
      skippedEntries: 1,
    })
    const onAdd = vi.fn().mockResolvedValue({ addedCount: 2 })
    const onClose = vi.fn()

    render(
      <ScanDialog
        cards={[]}
        categories={categories}
        onAdd={onAdd}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '选择文件夹' }))
    expect(await screen.findByText('E:\\documents')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始扫描' }))
    await waitFor(() => {
      expect(scanFolder).toHaveBeenCalledWith('../documents', [
        'html',
        'word',
        'powerpoint',
        'excel',
        'markdown',
      ])
    })
    expect(await screen.findByDisplayValue('文档 A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('网页 B')).toBeInTheDocument()
    expect(screen.getByText(/1 个项目无法访问或为符号链接/)).toBeInTheDocument()

    const bulkSection = screen.getByText('统一设置类别').closest('section')
    expect(bulkSection).not.toBeNull()
    fireEvent.click(within(bulkSection!).getByRole('checkbox', { name: '工作' }))
    fireEvent.click(within(bulkSection!).getByRole('button', { name: '应用到全部' }))

    expect(screen.getAllByText('已选 1 个类别')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '批量添加（2）' }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1)
      expect(onAdd).toHaveBeenCalledWith([
        expect.objectContaining({ name: '文档 A', categoryIds: ['cat-work'] }),
        expect.objectContaining({ name: '网页 B', categoryIds: ['cat-work'] }),
      ])
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
