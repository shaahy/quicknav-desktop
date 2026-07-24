import { ipcMain, BrowserWindow } from 'electron'
import { loadAppData, saveAppData } from './store'
import { selectFile, openFile, showItemInFolder, readHtmlTitle } from './shell'
import { IPC_CHANNELS } from '../shared/constants'

export function registerIpcHandlers(getWindow: () => BrowserWindow, userDataPath: string): void {
  ipcMain.handle(IPC_CHANNELS.STORE_LOAD, () => loadAppData(userDataPath))
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE, (_e, data) => saveAppData(userDataPath, data))
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT, () => selectFile(getWindow()))
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_FILE, (_e, path: string) => openFile(path))
  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_IN_FOLDER, (_e, path: string) => showItemInFolder(path))
  ipcMain.handle(IPC_CHANNELS.FILE_READ_HTML_TITLE, (_e, path: string) => readHtmlTitle(path))
  ipcMain.on('app:quit', () => {
    const { app } = require('electron')
    app.isQuitting = true
    app.quit()
  })
}
