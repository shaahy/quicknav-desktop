import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { registerIpcHandlers } from './ipc'
import { installBrokenPipeGuards } from './stdio'
import { resolveAppDataPath } from './app-data-location'
import { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../shared/constants'

installBrokenPipeGuards()

function getAppDataPath(): string {
  return resolveAppDataPath({
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    executablePath: app.getPath('exe'),
    portableExecutableDir: process.env.PORTABLE_EXECUTABLE_DIR,
  })
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: '速查工具',
    show: false,
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('ready', () => {
    registerIpcHandlers(() => mainWindow!, getAppDataPath())
    createWindow()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
