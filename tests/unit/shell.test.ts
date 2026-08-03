import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'path'
import { HTML_READ_SIZE } from '../../src/shared/constants'

// ── Hoisted mocks ──

const electronMocks = vi.hoisted(() => ({
  dialog: { showOpenDialog: vi.fn() },
  shell: {
    openPath: vi.fn<(path: string) => Promise<string>>(),
    openExternal: vi.fn<(url: string) => Promise<void>>(),
    showItemInFolder: vi.fn(),
  },
}))

const fsMocks = vi.hoisted(() => ({
  statSync: vi.fn(),
  openSync: vi.fn(),
  readSync: vi.fn(),
  closeSync: vi.fn(),
  existsSync: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}))

// ── Module mocks ──

vi.mock('electron', () => ({
  dialog: electronMocks.dialog,
  shell: electronMocks.shell,
  BrowserWindow: vi.fn(),
}))

vi.mock('fs', () => fsMocks)

// ── Imports (get mocked modules) ──

import {
  selectFile,
  selectScanFolder,
  scanFolder,
  openFile,
  showItemInFolder,
  readHtmlTitle,
} from '../../src/main/shell'

// ── Tests ──

describe('shell', () => {
  const dataDir = path.resolve('quick-nav-data')

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks for readHtmlTitle tests
    fsMocks.openSync.mockReturnValue(3)
    fsMocks.closeSync.mockReturnValue(undefined)
  })

  // ── openFile ──
  // Uses Electron's OS integration and never pre-checks the file.

  describe('openFile', () => {
    it('opens a Chinese markdown path with the system default application', async () => {
      electronMocks.shell.openPath.mockResolvedValue('')

      const relativePath = '../A 教程集合/工作记录.md'
      const appDataPath = path.join(dataDir, 'app-data.json')
      const result = await openFile(relativePath, appDataPath)

      expect(result).toEqual({})
      expect(electronMocks.shell.openPath).toHaveBeenCalledWith(
        path.resolve(dataDir, relativePath),
      )
    })

    it('resolves the same stored path against the current tool directory', async () => {
      electronMocks.shell.openPath.mockResolvedValue('')
      const firstDataDir = path.resolve('clone-a')
      const secondDataDir = path.resolve('clone-b')

      await openFile('tutorials/guide.html', path.join(firstDataDir, 'app-data.json'))
      await openFile('tutorials/guide.html', path.join(secondDataDir, 'app-data.json'))

      expect(electronMocks.shell.openPath).toHaveBeenNthCalledWith(
        1,
        path.resolve(firstDataDir, 'tutorials/guide.html'),
      )
      expect(electronMocks.shell.openPath).toHaveBeenNthCalledWith(
        2,
        path.resolve(secondDataDir, 'tutorials/guide.html'),
      )
    })

    it.runIf(process.platform === 'win32')(
      'opens a stored cross-drive absolute path without prefixing the tool directory',
      async () => {
        electronMocks.shell.openPath.mockResolvedValue('')

        await openFile('C:/Users/MSI/Desktop/notes.md', 'E:\\quick-nav\\app-data.json')

        expect(electronMocks.shell.openPath).toHaveBeenCalledWith(
          'C:\\Users\\MSI\\Desktop\\notes.md',
        )
      },
    )

    it('does not leak the Electron dev renderer URL into the default application', async () => {
      const originalRendererUrl = process.env.ELECTRON_RENDERER_URL
      const originalNodeEnv = process.env.NODE_ENV
      let inheritedRendererUrl: string | undefined
      let inheritedNodeEnv: string | undefined
      process.env.ELECTRON_RENDERER_URL = 'http://localhost:5173'
      process.env.NODE_ENV = 'development'
      electronMocks.shell.openPath.mockImplementation(async () => {
        inheritedRendererUrl = process.env.ELECTRON_RENDERER_URL
        inheritedNodeEnv = process.env.NODE_ENV
        return ''
      })

      try {
        const result = await openFile(
          '../A 教程集合/工作记录.md',
          path.join(dataDir, 'app-data.json'),
        )

        expect(result).toEqual({})
        expect(inheritedRendererUrl).toBeUndefined()
        expect(inheritedNodeEnv).toBe('production')
        expect(process.env.ELECTRON_RENDERER_URL).toBe('http://localhost:5173')
        expect(process.env.NODE_ENV).toBe('development')
      } finally {
        if (originalRendererUrl === undefined) {
          delete process.env.ELECTRON_RENDERER_URL
        } else {
          process.env.ELECTRON_RENDERER_URL = originalRendererUrl
        }
        if (originalNodeEnv === undefined) {
          delete process.env.NODE_ENV
        } else {
          process.env.NODE_ENV = originalNodeEnv
        }
      }
    })

    it('maps a missing default application to no-default-app', async () => {
      electronMocks.shell.openPath.mockResolvedValue(
        'No application is associated with the specified file for this operation.',
      )

      const result = await openFile('../notes/work.md', path.join(dataDir, 'app-data.json'))

      expect(result).toEqual({ error: 'no-default-app' })
    })

    it('maps other system launch failures to unknown', async () => {
      electronMocks.shell.openPath.mockResolvedValue('Access denied')

      const result = await openFile('../notes/work.md', path.join(dataDir, 'app-data.json'))

      expect(result).toEqual({ error: 'unknown' })
    })

    it('maps an unexpected shell exception to unknown', async () => {
      electronMocks.shell.openPath.mockRejectedValue(new Error('shell unavailable'))

      const result = await openFile('../notes/work.md', path.join(dataDir, 'app-data.json'))

      expect(result).toEqual({ error: 'unknown' })
    })

    it('does NOT call fs.existsSync/fs.access/fs.stat before opening (CHK019)', async () => {
      electronMocks.shell.openPath.mockResolvedValue('')

      await openFile('../some/file.txt', path.join(dataDir, 'app-data.json'))

      expect(fsMocks.existsSync).not.toHaveBeenCalled()
      expect(fsMocks.access).not.toHaveBeenCalled()
      expect(fsMocks.stat).not.toHaveBeenCalled()
    })
  })

  // ── showItemInFolder ──

  describe('showItemInFolder', () => {
    it('returns success when called', async () => {
      const result = await showItemInFolder('tutorials/file.txt', dataDir)

      expect(result).toEqual({})
      expect(electronMocks.shell.showItemInFolder).toHaveBeenCalledWith(
        path.resolve(dataDir, 'tutorials/file.txt'),
      )
    })

    it.runIf(process.platform === 'win32')(
      'locates a stored cross-drive absolute path without prefixing the tool directory',
      async () => {
        await showItemInFolder('C:/Users/MSI/Desktop/notes.md', 'E:\\quick-nav')

        expect(electronMocks.shell.showItemInFolder).toHaveBeenCalledWith(
          'C:\\Users\\MSI\\Desktop\\notes.md',
        )
      },
    )
  })

  // ── readHtmlTitle ──

  describe('readHtmlTitle', () => {
    it('extracts title from valid HTML', async () => {
      fsMocks.readSync.mockImplementation(
        (_fd: number, buffer: Buffer, _offset: number, _length: number, _position: number) => {
          const content = '<html><head><title>My Page Title</title></head><body>Hello</body></html>'
          buffer.write(content, 'utf-8')
          return Buffer.byteLength(content, 'utf-8')
        },
      )

      const result = await readHtmlTitle('tutorials/page.html', dataDir)

      expect(result).toBe('My Page Title')
    })

    it.runIf(process.platform === 'win32')(
      'reads an HTML title from a stored cross-drive absolute path',
      async () => {
        fsMocks.readSync.mockImplementation(
          (_fd: number, buffer: Buffer) => {
            const content = '<title>桌面文档</title>'
            buffer.write(content, 'utf-8')
            return Buffer.byteLength(content, 'utf-8')
          },
        )

        const result = await readHtmlTitle(
          'C:/Users/MSI/Desktop/page.html',
          'E:\\quick-nav',
        )

        expect(result).toBe('桌面文档')
        expect(fsMocks.openSync).toHaveBeenCalledWith(
          'C:\\Users\\MSI\\Desktop\\page.html',
          'r',
        )
      },
    )

    it('returns null when no title tag', async () => {
      fsMocks.readSync.mockImplementation(
        (_fd: number, buffer: Buffer, _offset: number, _length: number, _position: number) => {
          const content = '<html><head></head><body>No title here</body></html>'
          buffer.write(content, 'utf-8')
          return Buffer.byteLength(content, 'utf-8')
        },
      )

      const result = await readHtmlTitle('tutorials/page.html', dataDir)

      expect(result).toBeNull()
    })

    it('returns null for binary/non-UTF8 file', async () => {
      fsMocks.openSync.mockImplementation(() => {
        throw new Error('Invalid or binary file')
      })

      const result = await readHtmlTitle('tutorials/binary.bin', dataDir)

      expect(result).toBeNull()
    })
  })

  // ── selectFile ──

  describe('selectFile', () => {
    it('returns file metadata when user selects a file', async () => {
      const mockWindow = {} as any
      const selectedPath = path.resolve(dataDir, 'tutorials/document.pdf')
      electronMocks.dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [selectedPath],
      })
      fsMocks.statSync.mockReturnValue({
        size: 12345,
        mtimeMs: 67890,
      } as any)

      const result = await selectFile(mockWindow, dataDir)

      expect(result.canceled).toBe(false)
      expect(result.file).toBeDefined()
      expect(result.file!.relativePath).toBe('tutorials/document.pdf')
      expect(result.file!.fileName).toBe('document')
      expect(result.file!.extension).toBe('pdf')
      expect(result.file!.fileSize).toBe(12345)
      expect(result.file!.mtimeMs).toBe(67890)
      expect(result.file!.isHtml).toBe(false)
    })

    it('returns canceled when user cancels', async () => {
      const mockWindow = {} as any
      electronMocks.dialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      const result = await selectFile(mockWindow, dataDir)

      expect(result.canceled).toBe(true)
      expect(result.file).toBeUndefined()
    })

    it('allows selecting a file outside the tool directory', async () => {
      const mockWindow = {} as any
      const selectedPath = path.resolve(dataDir, '..', 'personal', 'notes.md')
      electronMocks.dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [selectedPath],
      })
      fsMocks.statSync.mockReturnValue({ size: 10, mtimeMs: 20 } as any)

      const result = await selectFile(mockWindow, dataDir)

      expect(result.file?.relativePath).toBe(
        path.relative(dataDir, selectedPath).replace(/\\/g, '/'),
      )
      expect(result.file?.relativePath.startsWith('../')).toBe(true)
    })

    it.runIf(process.platform === 'win32')(
      'stores an absolute path when a file is on a different Windows drive',
      async () => {
        const mockWindow = {} as any
        electronMocks.dialog.showOpenDialog.mockResolvedValue({
          canceled: false,
          filePaths: ['C:\\personal\\notes.md'],
        })
        fsMocks.statSync.mockReturnValue({ size: 10, mtimeMs: 20 } as any)

        const result = await selectFile(mockWindow, 'E:\\quick-nav')

        expect(result.error).toBeUndefined()
        expect(result.file?.relativePath).toBe('C:/personal/notes.md')
      },
    )
  })

  describe('folder scanning', () => {
    it('selects a folder and stores a path relative to the data directory', async () => {
      const mockWindow = {} as any
      const selectedPath = path.resolve(dataDir, '..', 'documents')
      electronMocks.dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [selectedPath],
      })

      const result = await selectScanFolder(mockWindow, dataDir)

      expect(result).toEqual({
        canceled: false,
        folder: {
          relativePath: path.relative(dataDir, selectedPath).replace(/\\/g, '/'),
          displayPath: selectedPath,
        },
      })
      expect(electronMocks.dialog.showOpenDialog).toHaveBeenCalledWith(
        mockWindow,
        expect.objectContaining({ properties: ['openDirectory'] }),
      )
    })

    it.runIf(process.platform === 'win32')(
      'stores an absolute folder path when the scan folder is on another drive',
      async () => {
        const mockWindow = {} as any
        electronMocks.dialog.showOpenDialog.mockResolvedValue({
          canceled: false,
          filePaths: ['C:\\documents'],
        })

        const result = await selectScanFolder(mockWindow, 'E:\\quick-nav')

        expect(result).toEqual({
          canceled: false,
          folder: {
            relativePath: 'C:/documents',
            displayPath: 'C:\\documents',
          },
        })
      },
    )

    it.runIf(process.platform === 'win32')(
      'returns absolute file paths when scanning a folder on another drive',
      async () => {
        fsMocks.promises.stat.mockImplementation(async (targetPath: string) => ({
          isDirectory: () => targetPath === 'C:\\documents',
          size: 100,
          mtimeMs: 123,
        }))
        fsMocks.promises.readdir.mockResolvedValue([
          {
            name: 'readme.md',
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
          },
        ])

        const result = await scanFolder(
          'C:/documents',
          ['markdown'],
          'E:\\quick-nav',
        )

        expect(result.error).toBeUndefined()
        expect(result.files).toHaveLength(1)
        expect(result.files[0].relativePath).toBe('C:/documents/readme.md')
      },
    )

    it('scans the root and first-level folders without entering deeper folders', async () => {
      const rootPath = path.resolve(dataDir, 'documents')
      const nestedPath = path.join(rootPath, 'nested')
      const deepPath = path.join(nestedPath, 'deep')
      const dirent = (
        name: string,
        kind: 'file' | 'directory' | 'symlink',
      ) => ({
        name,
        isFile: () => kind === 'file',
        isDirectory: () => kind === 'directory',
        isSymbolicLink: () => kind === 'symlink',
      })

      fsMocks.promises.stat.mockImplementation(async (targetPath: string) => ({
        isDirectory: () => targetPath === rootPath,
        size: targetPath.endsWith('.html') ? 200 : 100,
        mtimeMs: 123,
      }))
      fsMocks.promises.readdir.mockImplementation(async (targetPath: string) => {
        if (targetPath === rootPath) {
          return [
            dirent('page.html', 'file'),
            dirent('readme.md', 'file'),
            dirent('slides.pptx', 'file'),
            dirent('nested', 'directory'),
            dirent('linked', 'symlink'),
          ]
        }
        if (targetPath === nestedPath) {
          return [
            dirent('note.md', 'file'),
            dirent('deep', 'directory'),
          ]
        }
        if (targetPath === deepPath) {
          return [dirent('should-not-be-scanned.md', 'file')]
        }
        throw new Error('unexpected directory')
      })
      fsMocks.readSync.mockImplementation(
        (_fd: number, buffer: Buffer) => {
          const content = '<title>HTML 标题</title>'
          buffer.write(content, 'utf-8')
          return Buffer.byteLength(content, 'utf-8')
        },
      )

      const result = await scanFolder(
        'documents',
        ['html', 'markdown'],
        dataDir,
      )

      expect(result.error).toBeUndefined()
      expect(result.skippedEntries).toBe(1)
      expect(result.files).toHaveLength(3)
      expect(result.files.map(file => file.extension).sort()).toEqual([
        'html',
        'md',
        'md',
      ])
      expect(result.files.find(file => file.extension === 'html')?.suggestedName)
        .toBe('HTML 标题')
      expect(result.files.some(file => file.fileName === 'slides')).toBe(false)
      expect(result.files.some(file => file.fileName === 'note')).toBe(true)
      expect(result.files.some(file => file.fileName === 'should-not-be-scanned')).toBe(false)
      expect(fsMocks.promises.readdir).not.toHaveBeenCalledWith(
        deepPath,
        { withFileTypes: true },
      )
    })

    it('rejects a scan when no file type is selected', async () => {
      const result = await scanFolder('documents', [], dataDir)

      expect(result).toEqual({
        files: [],
        skippedEntries: 0,
        error: '请至少选择一种扫描类型',
      })
      expect(fsMocks.promises.readdir).not.toHaveBeenCalled()
    })
  })
})
