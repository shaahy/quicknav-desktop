import { describe, it, expect, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { loadAppData, saveAppData, emptyAppData, getDataPath } from '../../src/main/store'

// Make fs mockable for error handling tests (spyOn across mock boundaries)
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual }
})

const tmpDir = path.join(os.tmpdir(), 'qc-store-test-' + Date.now())

describe('store', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
      fileReference: { relativePath: '/test.txt', fileName: 'test', extension: 'txt', fileSize: 100, mtimeMs: 0 },
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

  it('loads version 1 absolute paths as version 2 relative paths', () => {
    fs.mkdirSync(tmpDir, { recursive: true })
    const absolutePath = path.resolve(tmpDir, '..', 'tutorials', 'guide.html')
    const legacyData = {
      version: 1,
      cards: [{
        id: 'legacy-id',
        name: 'Legacy',
        note: null,
        fileReference: {
          absolutePath,
          fileName: 'guide',
          extension: 'html',
          fileSize: 100,
          mtimeMs: 0,
        },
        categoryIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }],
      categories: [],
      viewOrders: [],
    }
    fs.writeFileSync(getDataPath(tmpDir), JSON.stringify(legacyData), 'utf-8')

    const result = loadAppData(tmpDir)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBe(2)
      expect(result.data.cards[0].fileReference.relativePath).toBe(
        path.relative(tmpDir, absolutePath).replace(/\\/g, '/'),
      )
      expect(result.data.cards[0].fileReference).not.toHaveProperty('absolutePath')
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

  // ── Save error handling (mocked fs) ──

  it('saveAppData returns disk-full when write fails with ENOSPC', () => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      const err: any = new Error('No space left on device')
      err.code = 'ENOSPC'
      throw err
    })

    const result = saveAppData(tmpDir, emptyAppData())
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('disk-full')
  })

  it('saveAppData returns permission-denied when write fails with EACCES', () => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      const err: any = new Error('Permission denied')
      err.code = 'EACCES'
      throw err
    })

    const result = saveAppData(tmpDir, emptyAppData())
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('permission-denied')
  })

  it('saveAppData returns locked when write fails with EBUSY', () => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      const err: any = new Error('Resource busy')
      err.code = 'EBUSY'
      throw err
    })

    const result = saveAppData(tmpDir, emptyAppData())
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('locked')
  })

  it('saveAppData calls fs.fsyncSync after successful write (CHK029)', () => {
    const fsyncSpy = vi.spyOn(fs, 'fsyncSync')

    const data = emptyAppData()
    const result = saveAppData(tmpDir, data)

    expect(result.success).toBe(true)
    expect(fsyncSpy).toHaveBeenCalledTimes(1)
  })

  it('saveAppData does NOT corrupt existing file on write failure (original file intact)', () => {
    // First, save some data successfully
    const originalData = emptyAppData()
    originalData.cards.push({
      id: 'existing-id',
      name: 'Original File',
      note: null,
      fileReference: { relativePath: '/test.txt', fileName: 'test', extension: 'txt', fileSize: 100, mtimeMs: 0 },
      categoryIds: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })
    const saveResult = saveAppData(tmpDir, originalData)
    expect(saveResult.success).toBe(true)

    // Read the saved file content as baseline
    const originalContent = fs.readFileSync(getDataPath(tmpDir), 'utf-8')

    // Mock openSync to fail with EACCES (permission denied BEFORE truncation)
    vi.spyOn(fs, 'openSync').mockImplementation(() => {
      const err: any = new Error('Permission denied')
      err.code = 'EACCES'
      throw err
    })

    // Attempt to save new data (should fail because openSync throws)
    const failResult = saveAppData(tmpDir, emptyAppData())
    expect(failResult.success).toBe(false)

    // Verify original file is unchanged
    const afterContent = fs.readFileSync(getDataPath(tmpDir), 'utf-8')
    expect(afterContent).toBe(originalContent)
  })
})
