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
import { getAppDataDir } from './app-data-location'

export function registerIpcHandlers(getWindow: () => BrowserWindow, appDataPath: string): void {
  const appDataDir = getAppDataDir(appDataPath)

  ipcMain.handle(IPC_CHANNELS.STORE_LOAD, () => {
    return loadAppData(appDataDir)
  })
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE, (_e, data) => saveAppData(appDataDir, data))
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT, () => selectFile(getWindow(), appDataDir))
  ipcMain.handle(
    IPC_CHANNELS.FOLDER_SELECT_FOR_SCAN,
    () => selectScanFolder(getWindow(), appDataDir),
  )
  ipcMain.handle(
    IPC_CHANNELS.FOLDER_SCAN,
    (_e, relativePath: string, fileTypes: ScanFileType[]) =>
      scanFolder(relativePath, fileTypes, appDataDir),
  )
  ipcMain.handle(
    IPC_CHANNELS.SHELL_OPEN_FILE,
    (_e, relativePath: string) => openFile(relativePath, appDataPath),
  )
  ipcMain.handle(
    IPC_CHANNELS.SHELL_SHOW_IN_FOLDER,
    (_e, relativePath: string) => showItemInFolder(relativePath, appDataDir),
  )
  ipcMain.handle(
    IPC_CHANNELS.FILE_READ_HTML_TITLE,
    (_e, relativePath: string) => readHtmlTitle(relativePath, appDataDir),
  )
  ipcMain.on('app:quit', () => {
    app.quit()
  })
}
