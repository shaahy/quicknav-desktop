import { beforeEach, describe, expect, it, vi } from 'vitest'

const electronMocks = vi.hoisted(() => ({
  handle: vi.fn(),
  on: vi.fn(),
  quit: vi.fn(),
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
  selectFile: vi.fn(),
  openFile: vi.fn(),
  showItemInFolder: vi.fn(),
  readHtmlTitle: vi.fn(),
}))

import { registerIpcHandlers } from '../../src/main/ipc'

describe('app:quit IPC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reaches app.quit without writing to a possibly disconnected pipe first', () => {
    registerIpcHandlers(() => ({}) as any, 'E:/data')
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
})
