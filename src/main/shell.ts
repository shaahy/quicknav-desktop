import { dialog, shell, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import type { FileSelectionResult, OpenResult, LocateResult } from '../shared/types'
import { HTML_READ_SIZE } from '../shared/constants'

export async function selectFile(parentWindow: BrowserWindow): Promise<FileSelectionResult> {
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
    return {
      canceled: false,
      file: {
        absolutePath: filePath,
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

export async function openFile(absolutePath: string): Promise<OpenResult> {
  // CRITICAL: Do NOT pre-check file existence (CHK019, constitution III)
  // Use pathToFileURL for proper encoding of spaces, Chinese chars, etc.
  // Then shell.openExternal works reliably with ALL third-party apps.
  console.log('[openFile] path:', absolutePath)
  try {
    const fileUrl = pathToFileURL(absolutePath).href
    console.log('[openFile] opening via openExternal:', fileUrl)
    await shell.openExternal(fileUrl)
    return {}
  } catch (e) {
    console.error('[openFile] exception:', e)
    return { error: 'unknown' }
  }
}

export async function showItemInFolder(absolutePath: string): Promise<LocateResult> {
  // Do NOT pre-check file existence (CHK019)
  // shell.showItemInFolder returns void in Electron 33, so we cannot detect failure
  shell.showItemInFolder(absolutePath)
  return {}
}

export async function readHtmlTitle(absolutePath: string): Promise<string | null> {
  try {
    const fd = fs.openSync(absolutePath, 'r')
    const buffer = Buffer.alloc(HTML_READ_SIZE)
    fs.readSync(fd, buffer, 0, HTML_READ_SIZE, 0)
    fs.closeSync(fd)
    const content = buffer.toString('utf-8')
    const match = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (!match || !match[1]) return null
    const title = match[1].trim()
    return title || null
  } catch {
    // Binary or non-UTF8 file: return null, caller falls back to fileName
    return null
  }
}
