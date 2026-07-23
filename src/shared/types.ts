// ── Domain Entities ──

export interface Card {
  id: string              // UUID v4
  name: string            // 1-80 chars, single-line, trimmed not empty
  note: string | null     // ≤500 chars, null when empty/whitespace-only
  fileReference: FileReference
  categoryIds: string[]   // at least 1 user category ID, never includes uncategorized
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
}

export interface Category {
  id: string              // UUID v4
  name: string            // 1-30 chars, single-line, not reserved, unique trimmed
  order: number
  type: 'user'
  createdAt: string
}

export interface FileReference {
  absolutePath: string    // normalized: forward slashes, uppercase drive letter, NFC
  fileName: string        // without extension
  extension: string       // without dot, '' if none
  fileSize: number        // bytes, for identity check
  mtimeMs: number         // modification timestamp, for identity check
}

export type ViewType = 'allCards' | `category:${string}` | 'uncategorized'

export interface ViewOrder {
  viewType: ViewType
  cardIds: string[]
}

export interface AppData {
  version: 1
  cards: Card[]
  categories: Category[]
  viewOrders: ViewOrder[]
}

// ── Enums ──

export type SurfaceId =
  | 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06'
  | 'S07' | 'S08' | 'S09' | 'S10' | 'S11' | 'S12'
  | 'S13' | 'S14' | 'S15' | 'S16' | 'S17' | 'S18'

// ── IPC Result Types ──

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; canceled?: boolean }

export interface FileSelectionResult {
  canceled: boolean
  file?: {
    absolutePath: string
    fileName: string
    extension: string
    fileSize: number
    mtimeMs: number
    isHtml: boolean
  }
  error?: string
}

export interface OpenResult {
  error?: 'no-default-app' | 'file-not-found' | 'os-denied' | 'unknown'
}

export interface LocateResult {
  error?: 'not-found' | 'os-denied' | 'unknown'
}

export interface AppDataLoadResult {
  data?: AppData
  error?: 'not-found' | 'corrupted'
}

export interface SaveResult {
  error?: 'disk-full' | 'permission-denied' | 'locked' | 'unknown'
}

// ── UI Types ──

export interface CardFormData {
  name: string
  note: string
  categoryIds: string[]
}

export interface MenuItem {
  id: string
  label: string
  variant?: 'default' | 'danger' | 'disabled'
  disabledReason?: string
  onClick: () => void
}

export interface ReorderItem {
  id: string
  name: string
}

export type ConfirmationVariant = 'delete-category' | 'delete-card' | 'discard-changes'

export interface ConfirmationData {
  categoryName?: string
  totalCards?: number
  uncategorizedCount?: number
}

// ── Electron API ──

export interface ElectronAPI {
  selectFile(): Promise<FileSelectionResult>
  openFile(path: string): Promise<OpenResult>
  showItemInFolder(path: string): Promise<LocateResult>
  readHtmlTitle(path: string): Promise<string | null>
  getAppData(): Promise<AppDataLoadResult>
  saveAppData(data: AppData): Promise<SaveResult>
  quitApp(): void
  getPlatform(): 'win32' | 'darwin'
}
