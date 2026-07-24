import { ipcMain, BrowserWindow, app } from 'electron'
import { loadAppData, saveAppData } from './store'
import { selectFile, openFile, showItemInFolder, readHtmlTitle } from './shell'
import { IPC_CHANNELS } from '../shared/constants'

export function registerIpcHandlers(getWindow: () => BrowserWindow, userDataPath: string): void {
  ipcMain.handle(IPC_CHANNELS.STORE_LOAD, () => {
    console.log('[ipc] store:load, path:', userDataPath)
    const result = loadAppData(userDataPath)
    console.log('[ipc] store:load result:', JSON.stringify({ success: result.success, hasData: !!((result as any).data), error: (result as any).error }))
    return result
  })
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE, (_e, data) => saveAppData(userDataPath, data))
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT, () => selectFile(getWindow()))
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_FILE, (_e, path: string) => openFile(path))
  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_IN_FOLDER, (_e, path: string) => showItemInFolder(path))
  ipcMain.handle(IPC_CHANNELS.FILE_READ_HTML_TITLE, (_e, path: string) => readHtmlTitle(path))
  ipcMain.on('app:quit', () => {
    console.log('[ipc] app:quit received')
    ;(app as any).isQuitting = true
    app.quit()
    console.log('[ipc] app.quit() called')
  })
}
