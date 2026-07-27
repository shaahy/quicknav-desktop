import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import * as path from 'path'
import { registerIpcHandlers } from './ipc'
import { installBrokenPipeGuards } from './stdio'
import { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../shared/constants'

installBrokenPipeGuards()

function getDataDir(): string {
  // 生产模式: 数据文件放在 exe 同目录下，方便打包分发
  if (app.isPackaged) {
    return path.dirname(app.getPath('exe'))
  }
  // 开发模式: 放在项目根目录
  return app.getAppPath()
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

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

  // Minimize to tray on close — keep process alive, data stays in memory (spec FR-036b, CHK010)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray(): void {
  // Create a lightweight tray icon (1x1 PNG for now; replace with real icon later)
  const icon = nativeImage.createFromBuffer(
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEoSURBVDiNpZMxTsNAEEX/rNeO7RgcATfABbgANBukSJQpU+QC5ABcAokbcAMkLgFHQKJIkSLFihXH6/0U/6wdJ5YiJVrN7s7+mT87K6SUCCEElmVBlgQMw4CU8jxHURQQQkBKSZqmyPMcQggAwBijLEuEYYimabAsC57nwTAMYrquA9B1HSkluq6jaRoYY/2+53kIgoBpmuC6LsYY4zimrmuEEBBC0DQN33WN67oQQtC2Lb7vI4RA0zSIMcZ1XaNtG03TkFJiGAZN0+h5nvdN+r6nbVtM04QQgq7r6K8nSRJkWUaWZYjjGEmSoG1buq4DAEmSIIoiFmmaritNUyiKYpG2bdfiuq4LIYRFGqBeuCp5FEUsYpom7kJmo5RyEe4MJsuyi67rbuYx+C/zG6vOpddEO7/HAAAAAElFTkSuQmCC', 'base64'),
    { width: 16, height: 16 }
  )
  tray = new Tray(icon)
  tray.setToolTip('速查工具')
  tray.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

app.on('ready', () => {
  isQuitting = false
  registerIpcHandlers(() => mainWindow!, getDataDir())
  createTray()
  createWindow()
})

app.on('window-all-closed', () => {
  // Don't quit — stays in tray
})

app.on('before-quit', () => {
  isQuitting = true
})
