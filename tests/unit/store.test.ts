import { describe, it, expect, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { loadAppData, saveAppData, emptyAppData, getDataPath } from '../../src/main/store'

const tmpDir = path.join(os.tmpdir(), 'qc-store-test-' + Date.now())

describe('store', () => {
  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  })

  it('load returns empty data when file does not exist', () => {
    const result = loadAppData(tmpDir)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(emptyAppData())
    }
  })

  it('save and load round-trip', () => {
    const data = emptyAppData()
    data.cards.push({
      id: 'test-id', name: 'test', note: null,
      fileReference: { absolutePath: '/test.txt', fileName: 'test', extension: 'txt', fileSize: 100, mtimeMs: 0 },
      categoryIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    })
    const saveResult = saveAppData(tmpDir, data)
    expect(saveResult.success).toBe(true)
    const loadResult = loadAppData(tmpDir)
    expect(loadResult.success).toBe(true)
    if (loadResult.success) {
      expect(loadResult.data!.cards).toHaveLength(1)
    }
  })

  it('load returns corrupted for invalid JSON', () => {
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(getDataPath(tmpDir), 'not json', 'utf-8')
    const result = loadAppData(tmpDir)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('corrupted')
  })

  it('save returns error when path is unwritable', () => {
    // Create a file where the data directory should be, so mkdirSync fails
    const blockedDir = path.join(fs.realpathSync(os.tmpdir()), 'qc-blocked-' + Date.now())
    fs.writeFileSync(blockedDir, '')
    const result = saveAppData(blockedDir, emptyAppData())
    expect(result.success).toBe(false)
    fs.rmSync(blockedDir)
  })
})
