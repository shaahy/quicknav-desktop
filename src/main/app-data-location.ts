import * as path from 'path'
import { APP_DATA_FILENAME } from '../shared/constants'

export interface AppDataLocationOptions {
  isPackaged: boolean
  appPath: string
  executablePath: string
  portableExecutableDir?: string
}

/**
 * Returns the single authoritative app-data.json path for the running app.
 *
 * electron-builder portable apps run Electron from a temporary extraction
 * directory. PORTABLE_EXECUTABLE_DIR points back to the directory containing
 * the portable executable and its external app-data.json.
 */
export function resolveAppDataPath(options: AppDataLocationOptions): string {
  const portableDir = options.portableExecutableDir?.trim()
  const dataDir = options.isPackaged
    ? portableDir || path.dirname(options.executablePath)
    : options.appPath

  return path.resolve(dataDir, APP_DATA_FILENAME)
}

export function getAppDataDir(appDataPath: string): string {
  return path.dirname(path.resolve(appDataPath))
}

/**
 * Resolves a persisted card/folder path without changing its storage mode.
 * Same-drive entries remain relative to app-data.json; cross-drive entries
 * are stored as absolute paths and must not be joined to the data directory.
 */
export function resolveStoredPath(baseDir: string, storedPath: string): string {
  if (path.isAbsolute(storedPath)) return path.normalize(storedPath)
  if (path.win32.isAbsolute(storedPath)) return path.win32.normalize(storedPath)
  return path.resolve(baseDir, storedPath)
}

export function resolveRelativeToAppData(
  appDataPath: string,
  relativePath: string,
): string {
  return resolveStoredPath(getAppDataDir(appDataPath), relativePath)
}
