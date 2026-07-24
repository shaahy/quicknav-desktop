/**
 * CHK019 — no-precheck audit
 *
 * Verifies that src/main/shell.ts does NOT call fs.existsSync, fs.access,
 * or fs.statSync before shell.openPath() or shell.showItemInFolder().
 *
 * Constitution III requires that file operations delegate to the OS shell
 * rather than pre-checking file state, because:
 *  - A file may exist at openPath() call time but be deleted before the
 *    shell opens it (TOCTOU race)
 *  - shell.openPath() handles all error cases (file-not-found, permission,
 *    no-default-app) itself
 *  - The app never scans or probes the filesystem (Constitution I)
 *
 * Only openFile() and showItemInFolder() are subject to this check.
 * selectFile() and readHtmlTitle() legitimately use fs calls for
 * metadata extraction and HTML title parsing.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Constants ──

const SHELL_PATH = resolve(__dirname, '../../src/main/shell.ts')
const FORBIDDEN_FS_PATTERNS = ['fs.existsSync', 'fs.access', 'fs.statSync', 'fs.stat']

// ── Helpers ──

/**
 * Find the line range of a named exported async function.
 * Returns `null` if not found.
 */
function findFunctionBounds(
  lines: string[],
  fnName: string
): { start: number; end: number } | null {
  const start = lines.findIndex((l) =>
    l.includes(`export async function ${fnName}(`)
  )
  if (start === -1) return null

  let depth = 0
  let inBody = false
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') {
        depth++
        inBody = true
      }
      if (ch === '}') depth--
    }
    if (inBody && depth === 0) {
      return { start, end: i }
    }
  }
  return null
}

/**
 * Check whether any forbidden fs call pattern appears in the given line range.
 * Lines that are comments (// or /* style) are excluded since they document
 * the CHK019 constraint rather than violating it.
 */
function hasForbiddenFSCall(
  lines: string[],
  start: number,
  end: number,
  targetShellCall: string
): Array<{ line: number; text: string }> {
  // Find the line of the target shell call to establish the "before" boundary
  const shellCallIdx = lines.findIndex(
    (l, i) => i >= start && i <= end && l.includes(targetShellCall)
  )

  if (shellCallIdx === -1) {
    // Shell call not found – this would be a structural issue
    return [{ line: start, text: `Could not find ${targetShellCall} in function body` }]
  }

  const violations: Array<{ line: number; text: string }> = []

  for (let i = start; i < shellCallIdx; i++) {
    const trimmed = lines[i].trim()
    // Skip empty lines, single-line comments, and JSDoc comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue

    for (const pattern of FORBIDDEN_FS_PATTERNS) {
      if (lines[i].includes(pattern)) {
        violations.push({ line: i + 1, text: lines[i].trim() })
      }
    }
  }

  return violations
}

// ── Test ──

describe('CHK019 — no pre-check before shell.openPath / shell.showItemInFolder', () => {
  let shellSource: string
  let lines: string[]

  beforeAll(() => {
    shellSource = readFileSync(SHELL_PATH, 'utf-8')
    lines = shellSource.split('\n')
  })

  it('openFile must not call fs.existsSync/fs.access/fs.stat before executing', () => {
    const bounds = findFunctionBounds(lines, 'openFile')
    expect(bounds).not.toBeNull()
    if (!bounds) return

    // openFile uses child_process.exec on Windows and shell.openPath on macOS
    // Both paths are after the import section, so we check for pre-check calls
    // anywhere before the exec/shell call
    const violations = hasForbiddenFSCall(
      lines,
      bounds.start,
      bounds.end,
      'shell.openPath'
    )

    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  Line ${v.line}: ${v.text}`)
        .join('\n')
      expect.fail(
        `Found pre-check fs call(s) before shell call in openFile():\n${detail}`
      )
    }
  })

  it('showItemInFolder must not call fs.existsSync/fs.access/fs.stat before shell.showItemInFolder', () => {
    const bounds = findFunctionBounds(lines, 'showItemInFolder')
    expect(bounds).not.toBeNull()
    if (!bounds) return

    const violations = hasForbiddenFSCall(
      lines,
      bounds.start,
      bounds.end,
      'shell.showItemInFolder'
    )

    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  Line ${v.line}: ${v.text}`)
        .join('\n')
      expect.fail(
        `Found pre-check fs call(s) before shell.showItemInFolder in showItemInFolder():\n${detail}`
      )
    }
  })
})
