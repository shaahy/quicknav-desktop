import { describe, it, expect, vi, beforeEach } from 'vitest'
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
}))

// ── Module mocks ──

vi.mock('electron', () => ({
  dialog: electronMocks.dialog,
  shell: electronMocks.shell,
  BrowserWindow: vi.fn(),
}))

vi.mock('fs', () => fsMocks)

// ── Imports (get mocked modules) ──

import { selectFile, openFile, showItemInFolder, readHtmlTitle } from '../../src/main/shell'

// ── Tests ──

describe('shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks for readHtmlTitle tests
    fsMocks.openSync.mockReturnValue(3)
    fsMocks.closeSync.mockReturnValue(undefined)
  })

  // ── openFile ──
  // Uses child_process.exec on Windows, shell.openPath on macOS

  describe('openFile', () => {
    it('does NOT call fs.existsSync/fs.access/fs.stat before opening (CHK019)', async () => {
      // On Windows, openFile uses child_process.exec and the Promise never
      // resolves in the test because we don't mock exec. But the CHK019 check
      // happens synchronously BEFORE entering the async code path — verify
      // that no pre-check fs calls are made before entering the async block.
      // We test this by calling openFile and checking the mock state immediately
      // (before the promise resolves).
      const promise = openFile('C:\\some\\file.txt')

      // These checks run synchronously — if openFile called fs.existsSync
      // before entering the async block, the mocks would have recorded it
      expect(fsMocks.existsSync).not.toHaveBeenCalled()
      expect(fsMocks.access).not.toHaveBeenCalled()
      expect(fsMocks.stat).not.toHaveBeenCalled()

      // Clean up — we don't await because exec never resolves in tests
      promise.catch(() => {})
    }, 1000)
  })

  // ── showItemInFolder ──

  describe('showItemInFolder', () => {
    it('returns success when called', async () => {
      const result = await showItemInFolder('/path/to/file.txt')

      expect(result).toEqual({})
      expect(electronMocks.shell.showItemInFolder).toHaveBeenCalledWith('/path/to/file.txt')
    })
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

      const result = await readHtmlTitle('/path/to/page.html')

      expect(result).toBe('My Page Title')
    })

    it('returns null when no title tag', async () => {
      fsMocks.readSync.mockImplementation(
        (_fd: number, buffer: Buffer, _offset: number, _length: number, _position: number) => {
          const content = '<html><head></head><body>No title here</body></html>'
          buffer.write(content, 'utf-8')
          return Buffer.byteLength(content, 'utf-8')
        },
      )

      const result = await readHtmlTitle('/path/to/page.html')

      expect(result).toBeNull()
    })

    it('returns null for binary/non-UTF8 file', async () => {
      fsMocks.openSync.mockImplementation(() => {
        throw new Error('Invalid or binary file')
      })

      const result = await readHtmlTitle('/path/to/binary.bin')

      expect(result).toBeNull()
    })
  })

  // ── selectFile ──

  describe('selectFile', () => {
    it('returns file metadata when user selects a file', async () => {
      const mockWindow = {} as any
      electronMocks.dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/document.pdf'],
      })
      fsMocks.statSync.mockReturnValue({
        size: 12345,
        mtimeMs: 67890,
      } as any)

      const result = await selectFile(mockWindow)

      expect(result.canceled).toBe(false)
      expect(result.file).toBeDefined()
      expect(result.file!.absolutePath).toBe('/path/to/document.pdf')
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

      const result = await selectFile(mockWindow)

      expect(result.canceled).toBe(true)
      expect(result.file).toBeUndefined()
    })
  })
})
