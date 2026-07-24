import { dialog, shell, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
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
  const nativePath = process.platform === 'win32'
    ? absolutePath.replace(/\//g, '\\')
    : absolutePath
  console.log('[openFile] path:', nativePath)
  try {
    if (process.platform === 'win32') {
      // shell.openPath hangs with Chinese paths on some Windows configs.
      // Use child_process.exec with cmd /c start — this is Windows' native
      // file-open mechanism and handles all characters correctly.
      const { exec } = await import('child_process')
      const cmd = `start "" "${nativePath}"`
      console.log('[openFile] exec:', cmd)
      exec(cmd, { shell: 'cmd.exe', windowsHide: true }, (err) => {
        if (err) console.error('[openFile] exec error:', err.message)
        else console.log('[openFile] exec ok')
      })
      return {}
    }
    const error = await shell.openPath(nativePath)
    if (!error) return {}
    if (error.includes('No default app') || error.includes('no application')) {
      return { error: 'no-default-app' }
    }
    return { error: 'unknown' }
  } catch (e: any) {
    console.error('[openFile] exception:', e?.message ?? e)
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
