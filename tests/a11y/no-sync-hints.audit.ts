/**
 * CHK020 — no-sync-hints audit
 *
 * Scans all component and surface source files for forbidden keywords in
 * user-facing text (visible labels, aria-labels, placeholders, button text).
 *
 * Forbidden keywords: 同步 / 导入 / 导出 / 迁移 / 共享 / 云端 / 多设备
 *
 * Constitution C1 forbids any UI text that hints at sync, import, export,
 * migration, sharing, cloud, or multi-device capabilities — this app
 * is strictly a single-device, local-only file navigator.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve } from 'path'

// ── Configuration ──

const FORBIDDEN_KEYWORDS = ['同步', '导入', '导出', '迁移', '共享', '云端', '多设备']

/** Directories to scan for user-facing text content. */
const SCAN_DIRS = [
  resolve(__dirname, '../../src/renderer/components'),
  resolve(__dirname, '../../src/renderer/surfaces'),
]

// ── Types ──

interface TextHit {
  file: string
  line: number
  column: number
  keyword: string
  context: string
}

// ── Scanner ──

export function scanForbiddenKeywords(filePath: string): TextHit[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const hits: TextHit[] = []
  const shortPath = filePath.replace(/\\/g, '/').split('/src/')[1] ?? filePath

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    for (const keyword of FORBIDDEN_KEYWORDS) {
      let idx = 0
      while (true) {
        const pos = line.indexOf(keyword, idx)
        if (pos === -1) break

        // Skip lines that are pure comments (but still flag them — comments
        // referencing these features are also constitution violations)
        const trimmed = line.trimStart()

        // Skip import statements — these cannot be user-visible text
        if (/^\s*import\s+/.test(line)) {
          idx = pos + 1
          continue
        }

        // Skip type declarations and interfaces (these are code, not UI text)
        if (
          /^\s*(interface|type|const enum|enum)\s/.test(line) ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('*')
        ) {
          // We still flag keyword references in type/interface names, but
          // actual code identifiers won't contain Chinese characters so they
          // won't match. Only comment hits would show here.
        }

        hits.push({
          file: shortPath,
          line: i + 1,
          column: pos + 1,
          keyword,
          context: line.trim().substring(0, 120),
        })

        idx = pos + 1
      }
    }
  }

  return hits
}

// ── Test ──

describe('CHK020 — no sync/import/export hints in UI text', () => {
  const allHits: TextHit[] = []

  beforeAll(() => {
    const scannedFiles: string[] = []

    for (const dir of SCAN_DIRS) {
      try {
        if (!statSync(dir).isDirectory()) continue
      } catch {
        continue // Directory does not exist (e.g. empty surfaces/)
      }

      const entries = readdirSync(dir)
      for (const entry of entries) {
        if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue
        const filePath = resolve(dir, entry)
        scannedFiles.push(filePath)
        const hits = scanForbiddenKeywords(filePath)
        allHits.push(...hits)
      }
    }
  })

  it('must have zero forbidden keyword occurrences in UI text', () => {
    if (allHits.length > 0) {
      const detail = allHits
        .map(
          (h) =>
            `  src/${h.file}:${h.line}:${h.column} — found "${h.keyword}" in "${h.context}"`
        )
        .join('\n')
      expect.fail(
        `Found ${allHits.length} forbidden keyword occurrence(s) in UI text:\n${detail}`
      )
    }
  })
})
