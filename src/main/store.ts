import * as fs from 'fs'
import * as path from 'path'
import type { AppData, IpcResult } from '../shared/types'
import { APP_DATA_FILENAME } from '../shared/constants'

export type SaveResult =
  | { success: true }
  | { success: false; error: 'disk-full' | 'permission-denied' | 'locked' | 'unknown' }

export function getDataPath(userDataPath: string): string {
  return path.join(userDataPath, APP_DATA_FILENAME)
}

export function emptyAppData(): AppData {
  return { version: 1, cards: [], categories: [], viewOrders: [] }
}

export function loadAppData(userDataPath: string): IpcResult<AppData> {
  const filePath = getDataPath(userDataPath)
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true, data: emptyAppData() }
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as AppData
    if (data.version !== 1 || !Array.isArray(data.cards) || !Array.isArray(data.categories)) {
      return { success: false, error: 'corrupted' }
    }
    return { success: true, data }
  } catch (e) {
    return { success: false, error: 'corrupted' }
  }
}

export function saveAppData(userDataPath: string, data: AppData): SaveResult {
  const filePath = getDataPath(userDataPath)
  try {
    const json = JSON.stringify(data, null, 2)
    fs.mkdirSync(userDataPath, { recursive: true })
    const fd = fs.openSync(filePath, 'w')
    fs.writeFileSync(fd, json, 'utf-8')
    fs.fsyncSync(fd)
    fs.closeSync(fd)
    return { success: true }
  } catch (e: any) {
    if (e.code === 'ENOSPC') return { success: false, error: 'disk-full' }
    if (e.code === 'EACCES' || e.code === 'EPERM') return { success: false, error: 'permission-denied' }
    if (e.code === 'EBUSY') return { success: false, error: 'locked' }
    return { success: false, error: 'unknown' }
  }
}
