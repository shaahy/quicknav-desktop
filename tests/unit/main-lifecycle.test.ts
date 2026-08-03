import { beforeEach, describe, expect, it, vi } from 'vitest'

const electronMocks = vi.hoisted(() => {
  const appHandlers = new Map<string, (...args: any[]) => void>()
  const windowHandlers = new Map<string, (...args: any[]) => void>()
  const window = {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      windowHandlers.set(event, handler)
    }),
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
  }

  return {
    appHandlers,
    windowHandlers,
    window,
    appOn: vi.fn((event: string, handler: (...args: any[]) => void) => {
      appHandlers.set(event, handler)
    }),
    quit: vi.fn(),
    requestSingleInstanceLock: vi.fn(() => true),
    browserWindow: vi.fn(() => window),
    tray: vi.fn(),
  }
})

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: vi.fn(() => 'E:/project'),
    getPath: vi.fn(() => 'E:/project/electron.exe'),
    on: electronMocks.appOn,
    quit: electronMocks.quit,
    requestSingleInstanceLock: electronMocks.requestSingleInstanceLock,
  },
  BrowserWindow: Object.assign(electronMocks.browserWindow, {
    getAllWindows: vi.fn(() => []),
  }),
  Tray: electronMocks.tray,
  Menu: {
    buildFromTemplate: vi.fn(),
  },
  nativeImage: {
    createFromBuffer: vi.fn(),
  },
}))

vi.mock('../../src/main/ipc', () => ({
  registerIpcHandlers: vi.fn(),
}))

vi.mock('../../src/main/stdio', () => ({
  installBrokenPipeGuards: vi.fn(),
}))

describe('main process lifecycle', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    electronMocks.appHandlers.clear()
    electronMocks.windowHandlers.clear()
    electronMocks.requestSingleInstanceLock.mockReturnValue(true)
    electronMocks.window.isMinimized.mockReturnValue(false)
  })

  it('acquires a single-instance lock and registers second-launch handling', async () => {
    await import('../../src/main/index')

    expect(electronMocks.requestSingleInstanceLock).toHaveBeenCalledTimes(1)
    expect(electronMocks.appHandlers.has('second-instance')).toBe(true)
  })

  it('quits immediately when another instance already owns the lock', async () => {
    electronMocks.requestSingleInstanceLock.mockReturnValue(false)

    await import('../../src/main/index')

    expect(electronMocks.quit).toHaveBeenCalledTimes(1)
    expect(electronMocks.appHandlers.has('ready')).toBe(false)
  })

  it('does not create a tray or intercept the window close action', async () => {
    await import('../../src/main/index')
    electronMocks.appHandlers.get('ready')?.()

    expect(electronMocks.tray).not.toHaveBeenCalled()
    expect(electronMocks.windowHandlers.has('close')).toBe(false)
  })

  it('quits after the last window closes', async () => {
    await import('../../src/main/index')

    electronMocks.appHandlers.get('window-all-closed')?.()

    expect(electronMocks.quit).toHaveBeenCalledTimes(1)
  })

  it('restores and focuses the existing window after a second launch', async () => {
    await import('../../src/main/index')
    electronMocks.appHandlers.get('ready')?.()
    electronMocks.window.isMinimized.mockReturnValue(true)

    electronMocks.appHandlers.get('second-instance')?.()

    expect(electronMocks.window.restore).toHaveBeenCalledTimes(1)
    expect(electronMocks.window.show).toHaveBeenCalled()
    expect(electronMocks.window.focus).toHaveBeenCalledTimes(1)
  })
})
