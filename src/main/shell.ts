import { dialog, shell, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type {
  FileSelectionResult,
  OpenResult,
  LocateResult,
  ScanFileType,
  ScanFolderResult,
  ScanFolderSelectionResult,
  ScannedFile,
} from '../shared/types'
import { HTML_READ_SIZE } from '../shared/constants'
import { resolveRelativeToAppData, resolveStoredPath } from './app-data-location'

const DEV_RENDERER_ENV_KEYS = ['ELECTRON_RENDERER_URL', 'VITE_DEV_SERVER_URL'] as const
let openPathQueue: Promise<void> = Promise.resolve()

function resolveFromDataDir(dataDir: string, relativePath: string): string {
  return resolveStoredPath(dataDir, relativePath)
}

function makeStoredPath(dataDir: string, absolutePath: string): string {
  const relativePath = path.relative(dataDir, absolutePath)
  const storedPath = path.isAbsolute(relativePath) ? absolutePath : relativePath
  return storedPath.replace(/\\/g, '/').normalize('NFC')
}

const SCAN_EXTENSIONS: Record<ScanFileType, ReadonlySet<string>> = {
  html: new Set(['html', 'htm']),
  word: new Set(['doc', 'docx']),
  powerpoint: new Set(['ppt', 'pptx']),
  excel: new Set(['xls', 'xlsx']),
  markdown: new Set(['md']),
}

const MAX_SCAN_DEPTH = 1

function readHtmlTitleFromAbsolutePath(absolutePath: string): string | null {
  try {
    const fd = fs.openSync(absolutePath, 'r')
    try {
      const buffer = Buffer.alloc(HTML_READ_SIZE)
      const bytesRead = fs.readSync(fd, buffer, 0, HTML_READ_SIZE, 0)
      const content = buffer.subarray(0, bytesRead).toString('utf-8')
      const match = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      if (!match || !match[1]) return null
      const title = match[1].trim()
      return title || null
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return null
  }
}

export async function selectFile(
  parentWindow: BrowserWindow,
  dataDir: string,
): Promise<FileSelectionResult> {
  const result = await dialog.showOpenDialog(parentWindow, {
    properties: ['openFile'],
    title: '选择文件'
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }
  const filePath = result.filePaths[0]
  try {
    const stat = fs.statSync(filePath)
    const ext = path.extname(filePath).replace('.', '').toLowerCase()
    const relativePath = makeStoredPath(dataDir, filePath)
    return {
      canceled: false,
      file: {
        relativePath,
        fileName: path.basename(filePath, path.extname(filePath)),
        extension: ext,
        fileSize: stat.size,
        mtimeMs: stat.mtimeMs,
        isHtml: ext === 'html' || ext === 'htm'
      }
    }
  } catch (e) {
    return { canceled: false, error: '无法访问所选文件' }
  }
}

export async function selectScanFolder(
  parentWindow: BrowserWindow,
  dataDir: string,
): Promise<ScanFolderSelectionResult> {
  const result = await dialog.showOpenDialog(parentWindow, {
    properties: ['openDirectory'],
    title: '选择扫描文件夹',
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const displayPath = result.filePaths[0]
  const relativePath = makeStoredPath(dataDir, displayPath)

  return {
    canceled: false,
    folder: {
      relativePath,
      displayPath,
    },
  }
}

export async function scanFolder(
  relativeFolderPath: string,
  fileTypes: ScanFileType[],
  dataDir: string,
): Promise<ScanFolderResult> {
  const selectedExtensions = new Set<string>()
  for (const fileType of fileTypes) {
    const extensions = SCAN_EXTENSIONS[fileType]
    if (!extensions) continue
    for (const extension of extensions) selectedExtensions.add(extension)
  }
  if (selectedExtensions.size === 0) {
    return { files: [], skippedEntries: 0, error: '请至少选择一种扫描类型' }
  }

  const rootPath = resolveFromDataDir(dataDir, relativeFolderPath)
  const files: ScannedFile[] = []
  let skippedEntries = 0

  const visit = async (directoryPath: string, depth: number): Promise<void> => {
    let entries: fs.Dirent[]
    try {
      entries = await fs.promises.readdir(directoryPath, { withFileTypes: true })
    } catch {
      skippedEntries += 1
      return
    }

    entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name)
      if (entry.isSymbolicLink()) {
        skippedEntries += 1
        continue
      }
      if (entry.isDirectory()) {
        if (depth < MAX_SCAN_DEPTH) {
          await visit(absolutePath, depth + 1)
        }
        continue
      }
      if (!entry.isFile()) continue

      const extension = path.extname(entry.name).replace('.', '').toLowerCase()
      if (!selectedExtensions.has(extension)) continue

      try {
        const stat = await fs.promises.stat(absolutePath)
        const relativePath = makeStoredPath(dataDir, absolutePath)
        const fileName = path.basename(entry.name, path.extname(entry.name))
        const isHtml = extension === 'html' || extension === 'htm'
        const suggestedName = isHtml
          ? readHtmlTitleFromAbsolutePath(absolutePath) || fileName
          : fileName
        files.push({
          relativePath,
          fileName,
          extension,
          fileSize: stat.size,
          mtimeMs: stat.mtimeMs,
          isHtml,
          suggestedName,
        })
      } catch {
        skippedEntries += 1
      }
    }
  }

  try {
    const rootStat = await fs.promises.stat(rootPath)
    if (!rootStat.isDirectory()) {
      return { files: [], skippedEntries: 0, error: '所选路径不是文件夹' }
    }
  } catch {
    return { files: [], skippedEntries: 0, error: '无法访问所选文件夹' }
  }

  await visit(rootPath, 0)
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath, 'zh-CN'))
  return { files, skippedEntries }
}

export async function openFile(relativePath: string, appDataPath: string): Promise<OpenResult> {
  // CRITICAL: Do NOT pre-check file existence (CHK019, constitution III)
  const absolutePath = resolveRelativeToAppData(appDataPath, relativePath)
  const nativePath = process.platform === 'win32'
    ? absolutePath.replace(/\//g, '\\')
    : absolutePath

  const task = openPathQueue.then(async () => {
    const savedValues = DEV_RENDERER_ENV_KEYS.map(key => [key, process.env[key]] as const)
    const savedNodeEnv = process.env.NODE_ENV
    for (const key of DEV_RENDERER_ENV_KEYS) {
      delete process.env[key]
    }
    process.env.NODE_ENV = 'production'

    try {
      // Electron-based default apps must not inherit this app's development URL.
      // Otherwise they may load our Vite renderer instead of the requested file.
      return await shell.openPath(nativePath)
    } finally {
      for (const [key, value] of savedValues) {
        if (value === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = value
        }
      }
      if (savedNodeEnv === undefined) {
        delete process.env.NODE_ENV
      } else {
        process.env.NODE_ENV = savedNodeEnv
      }
    }
  })
  openPathQueue = task.then(
    () => undefined,
    () => undefined,
  )

  try {
    const error = await task
    if (!error) return {}
    const normalizedError = error.toLowerCase()
    if (
      normalizedError.includes('no default app') ||
      normalizedError.includes('no application') ||
      normalizedError.includes('not associated') ||
      normalizedError.includes('没有关联') ||
      normalizedError.includes('未关联')
    ) {
      return { error: 'no-default-app' }
    }
    return { error: 'unknown' }
  } catch {
    return { error: 'unknown' }
  }
}

export async function showItemInFolder(
  relativePath: string,
  dataDir: string,
): Promise<LocateResult> {
  // Do NOT pre-check file existence (CHK019)
  // shell.showItemInFolder returns void in Electron 33, so we cannot detect failure
  const absolutePath = resolveFromDataDir(dataDir, relativePath)
  shell.showItemInFolder(absolutePath)
  return {}
}

export async function readHtmlTitle(
  relativePath: string,
  dataDir: string,
): Promise<string | null> {
  const absolutePath = resolveFromDataDir(dataDir, relativePath)
  return readHtmlTitleFromAbsolutePath(absolutePath)
}
