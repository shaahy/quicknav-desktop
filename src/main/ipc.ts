import { ipcMain, BrowserWindow, app } from 'electron'
import { loadAppData, saveAppData } from './store'
import {
  selectFile,
  selectScanFolder,
  scanFolder,
  openFile,
  showItemInFolder,
  readHtmlTitle,
} from './shell'
import type { ScanFileType } from '../shared/types'
import { IPC_CHANNELS } from '../shared/constants'

export function registerIpcHandlers(getWindow: () => BrowserWindow, userDataPath: string): void {
  ipcMain.handle(IPC_CHANNELS.STORE_LOAD, () => {
    return loadAppData(userDataPath)
  })
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE, (_e, data) => saveAppData(userDataPath, data))
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT, () => selectFile(getWindow(), userDataPath))
  ipcMain.handle(
    IPC_CHANNELS.FOLDER_SELECT_FOR_SCAN,
    () => selectScanFolder(getWindow(), userDataPath),
  )
  ipcMain.handle(
    IPC_CHANNELS.FOLDER_SCAN,
    (_e, relativePath: string, fileTypes: ScanFileType[]) =>
      scanFolder(relativePath, fileTypes, userDataPath),
  )
  ipcMain.handle(
    IPC_CHANNELS.SHELL_OPEN_FILE,
    (_e, relativePath: string) => openFile(relativePath, userDataPath),
  )
  ipcMain.handle(
    IPC_CHANNELS.SHELL_SHOW_IN_FOLDER,
    (_e, relativePath: string) => showItemInFolder(relativePath, userDataPath),
  )
  ipcMain.handle(
    IPC_CHANNELS.FILE_READ_HTML_TITLE,
    (_e, relativePath: string) => readHtmlTitle(relativePath, userDataPath),
  )
  ipcMain.on('app:quit', () => {
    ;(app as any).isQuitting = true
    app.quit()
  })
}
