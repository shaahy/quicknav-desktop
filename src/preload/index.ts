import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'
import { IPC_CHANNELS } from '../shared/constants'

const electronAPI: ElectronAPI = {
  selectFile: () => ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT),
  openFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_FILE, filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_SHOW_IN_FOLDER, filePath),
  readHtmlTitle: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_READ_HTML_TITLE, filePath),
  getAppData: () => ipcRenderer.invoke(IPC_CHANNELS.STORE_LOAD),
  saveAppData: (data) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SAVE, data),
  quitApp: () => {
    console.log('[preload] quitApp called, sending app:quit')
    ipcRenderer.send('app:quit')
  },
  getPlatform: () => process.platform as 'win32' | 'darwin',
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
