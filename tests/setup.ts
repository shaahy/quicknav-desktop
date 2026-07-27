import '@testing-library/jest-dom/vitest'

// Mock electronAPI
const mockElectronAPI = {
  selectFile: async () => ({ canceled: true }),
  selectScanFolder: async () => ({ canceled: true }),
  scanFolder: async () => ({ files: [], skippedEntries: 0 }),
  openFile: async () => ({}),
  showItemInFolder: async () => ({}),
  readHtmlTitle: async () => null,
  getAppData: async () => ({ data: { version: 2, cards: [], categories: [], viewOrders: [] } }),
  saveAppData: async () => ({}),
  quitApp: () => {},
  getPlatform: () => 'win32' as const,
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true,
})
