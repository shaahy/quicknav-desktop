import { beforeEach, describe, expect, it, vi } from 'vitest'

const electronMocks = vi.hoisted(() => ({
  handle: vi.fn(),
  on: vi.fn(),
  quit: vi.fn(),
}))

const shellMocks = vi.hoisted(() => ({
  selectFile: vi.fn(),
  selectScanFolder: vi.fn(),
  scanFolder: vi.fn(),
  openFile: vi.fn(),
  showItemInFolder: vi.fn(),
  readHtmlTitle: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: electronMocks.handle,
    on: electronMocks.on,
  },
  BrowserWindow: vi.fn(),
  app: {
    quit: electronMocks.quit,
  },
}))

vi.mock('../../src/main/store', () => ({
  loadAppData: vi.fn(),
  saveAppData: vi.fn(),
}))

vi.mock('../../src/main/shell', () => ({
  ...shellMocks,
}))

import { registerIpcHandlers } from '../../src/main/ipc'
import { IPC_CHANNELS } from '../../src/shared/constants'

describe('app:quit IPC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reaches app.quit without writing to a possibly disconnected pipe first', () => {
    registerIpcHandlers(() => ({}) as any, 'E:/data/app-data.json')
    const quitRegistration = electronMocks.on.mock.calls.find(
      ([channel]) => channel === 'app:quit',
    )
    expect(quitRegistration).toBeDefined()

    const brokenPipe = Object.assign(new Error('broken pipe'), { code: 'EPIPE' })
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      throw brokenPipe
    })

    expect(() => quitRegistration![1]()).not.toThrow()
    expect(electronMocks.quit).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })

  it('opens card paths relative to the authoritative app-data.json path', async () => {
    const appDataPath = 'E:/工具/app-data.json'
    registerIpcHandlers(() => ({}) as any, appDataPath)
    const openRegistration = electronMocks.handle.mock.calls.find(
      ([channel]) => channel === IPC_CHANNELS.SHELL_OPEN_FILE,
    )

    expect(openRegistration).toBeDefined()
    await openRegistration![1]({}, '../A 教程集合/工作记录.md')
    expect(shellMocks.openFile).toHaveBeenCalledWith(
      '../A 教程集合/工作记录.md',
      appDataPath,
    )
  })
})
