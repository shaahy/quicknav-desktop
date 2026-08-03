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
      categoryIds: [], isFavorite: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    })
    const saveResult = saveAppData(tmpDir, data)
    expect(saveResult.success).toBe(true)
    const loadResult = loadAppData(tmpDir)
    expect(loadResult.success).toBe(true)
    if (loadResult.success) {
      expect(loadResult.data!.cards).toHaveLength(1)
    }
  })

  it('loads version 1 absolute paths as version 3 relative paths with favorites initialized', () => {
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
      expect(result.data.version).toBe(3)
      expect(result.data.cards[0].fileReference.relativePath).toBe(
        path.relative(tmpDir, absolutePath).replace(/\\/g, '/'),
      )
      expect(result.data.cards[0].fileReference).not.toHaveProperty('absolutePath')
      expect(result.data.cards[0].isFavorite).toBe(false)
      expect(result.data.viewOrders).toContainEqual({
        viewType: 'favorites',
        cardIds: [],
      })
    }
  })

  it('keeps mixed relative and cross-drive absolute paths unchanged on round-trip', () => {
    const data = emptyAppData()
    const now = new Date().toISOString()
    data.cards.push(
      {
        id: 'relative-card', name: 'relative', note: null,
        fileReference: { relativePath: '../docs/relative.txt', fileName: 'relative', extension: 'txt', fileSize: 1, mtimeMs: 0 },
        categoryIds: [], isFavorite: false, createdAt: now, updatedAt: now,
      },
      {
        id: 'absolute-card', name: 'absolute', note: null,
        fileReference: { relativePath: 'C:/Users/MSI/Desktop/absolute.txt', fileName: 'absolute', extension: 'txt', fileSize: 1, mtimeMs: 0 },
        categoryIds: [], isFavorite: false, createdAt: now, updatedAt: now,
      },
    )

    expect(saveAppData(tmpDir, data).success).toBe(true)
    const result = loadAppData(tmpDir)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cards.map(card => card.fileReference.relativePath)).toEqual([
        '../docs/relative.txt',
        'C:/Users/MSI/Desktop/absolute.txt',
      ])
    }
  })

  it('loads version 2 data as version 3 without changing existing relationships or order', () => {
    fs.mkdirSync(tmpDir, { recursive: true })
    const legacyData = {
      version: 2,
      cards: [{
        id: 'legacy-v2',
        name: 'Legacy V2',
        note: null,
        fileReference: {
          relativePath: '../guide.html',
          fileName: 'guide',
          extension: 'html',
          fileSize: 100,
          mtimeMs: 0,
        },
        categoryIds: ['cat-1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }],
      categories: [{
        id: 'cat-1',
        name: '资料',
        order: 0,
        type: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
      }],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['legacy-v2'] },
        { viewType: 'category:cat-1', cardIds: ['legacy-v2'] },
        { viewType: 'uncategorized', cardIds: [] },
      ],
    }
    fs.writeFileSync(getDataPath(tmpDir), JSON.stringify(legacyData), 'utf-8')

    const result = loadAppData(tmpDir)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBe(3)
      expect(result.data.cards[0]).toMatchObject({
        id: 'legacy-v2',
        categoryIds: ['cat-1'],
        isFavorite: false,
      })
      expect(result.data.viewOrders).toEqual([
        { viewType: 'allCards', cardIds: ['legacy-v2'] },
        { viewType: 'category:cat-1', cardIds: ['legacy-v2'] },
        { viewType: 'uncategorized', cardIds: [] },
        { viewType: 'favorites', cardIds: [] },
      ])
    }
  })

  it('reconciles version 3 favorite membership with favorite view order', () => {
    fs.mkdirSync(tmpDir, { recursive: true })
    const data = {
      version: 3,
      cards: [
        {
          id: 'favorite-a',
          name: 'A',
          note: null,
          fileReference: { relativePath: 'a.txt', fileName: 'a', extension: 'txt', fileSize: 1, mtimeMs: 0 },
          categoryIds: [],
          isFavorite: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'favorite-b',
          name: 'B',
          note: null,
          fileReference: { relativePath: 'b.txt', fileName: 'b', extension: 'txt', fileSize: 1, mtimeMs: 0 },
          categoryIds: [],
          isFavorite: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'plain',
          name: 'Plain',
          note: null,
          fileReference: { relativePath: 'plain.txt', fileName: 'plain', extension: 'txt', fileSize: 1, mtimeMs: 0 },
          categoryIds: [],
          isFavorite: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      categories: [],
      viewOrders: [
        { viewType: 'allCards', cardIds: ['favorite-a', 'favorite-b', 'plain'] },
        { viewType: 'favorites', cardIds: ['plain', 'favorite-b'] },
        { viewType: 'uncategorized', cardIds: ['favorite-a', 'favorite-b', 'plain'] },
      ],
    }
    fs.writeFileSync(getDataPath(tmpDir), JSON.stringify(data), 'utf-8')

    const result = loadAppData(tmpDir)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(
        result.data.viewOrders.find(viewOrder => viewOrder.viewType === 'favorites')
      ).toEqual({
        viewType: 'favorites',
        cardIds: ['favorite-b', 'favorite-a'],
      })
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
      isFavorite: false,
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
