export const MAX_CARD_NAME = 80
export const MAX_CATEGORY_NAME = 30
export const MAX_NOTE = 500
export const MAX_CARDS = 500
export const MAX_CATEGORIES = 50
export const MAX_CATEGORY_TAGS = 2

export const RESERVED_NAMES = ['全部卡片', '未分类'] as const

export const VIEW_ALL_CARDS = 'allCards'
export const VIEW_UNCATEGORIZED = 'uncategorized'

export const SEARCH_DEBOUNCE_MS = 200
export const SAVE_DEBOUNCE_MS = 500
export const STATUS_BAR_MIN_MS = 8000
export const CUMULATIVE_FAILURE_THRESHOLD = 3

export const MIN_WINDOW_WIDTH = 760
export const MIN_WINDOW_HEIGHT = 560
export const DEFAULT_WINDOW_WIDTH = 1340
export const DEFAULT_WINDOW_HEIGHT = 880
export const SIDEBAR_WIDTH = 208
export const CONTROL_HEIGHT = 36
export const TARGET_MIN = 44

export const HTML_READ_SIZE = 65536 // 64KB

export const IPC_CHANNELS = {
  FILE_SELECT: 'file:select',
  FOLDER_SELECT_FOR_SCAN: 'folder:selectForScan',
  FOLDER_SCAN: 'folder:scan',
  FILE_READ_HTML_TITLE: 'file:readHtmlTitle',
  SHELL_OPEN_FILE: 'shell:openFile',
  SHELL_SHOW_IN_FOLDER: 'shell:showItemInFolder',
  STORE_LOAD: 'store:load',
  STORE_SAVE: 'store:save',
} as const

export const APP_DATA_FILENAME = 'app-data.json'
