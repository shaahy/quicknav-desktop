import * as fs from 'fs'
import * as path from 'path'
import type { AppData, IpcResult } from '../shared/types'
import {
  APP_DATA_FILENAME,
  VIEW_ALL_CARDS,
  VIEW_FAVORITES,
  VIEW_UNCATEGORIZED,
} from '../shared/constants'

export type SaveResult =
  | { success: true }
  | { success: false; error: 'disk-full' | 'permission-denied' | 'locked' | 'unknown' }

export function getDataPath(userDataPath: string): string {
  return path.join(userDataPath, APP_DATA_FILENAME)
}

export function emptyAppData(): AppData {
  return {
    version: 3,
    cards: [],
    categories: [],
    viewOrders: [
      { viewType: VIEW_ALL_CARDS, cardIds: [] },
      { viewType: VIEW_FAVORITES, cardIds: [] },
      { viewType: VIEW_UNCATEGORIZED, cardIds: [] },
    ],
  }
}

export function loadAppData(userDataPath: string): IpcResult<AppData> {
  const filePath = getDataPath(userDataPath)
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true, data: emptyAppData() }
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as any
    if (
      (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) ||
      !Array.isArray(parsed.cards) ||
      !Array.isArray(parsed.categories)
    ) {
      return { success: false, error: 'corrupted' }
    }
    if (
      parsed.cards.some((card: any) =>
        parsed.version === 1
          ? typeof card.fileReference?.absolutePath !== 'string'
          : typeof card.fileReference?.relativePath !== 'string'
      )
    ) {
      return { success: false, error: 'corrupted' }
    }
    const cards = parsed.cards.map((card: any) => {
      const fileReference = parsed.version === 1
        ? (() => {
            const { absolutePath, ...fileMetadata } = card.fileReference
            return {
              ...fileMetadata,
              relativePath: path
                .relative(userDataPath, absolutePath)
                .replace(/\\/g, '/')
                .normalize('NFC'),
            }
          })()
        : card.fileReference

      return {
        ...card,
        fileReference,
        isFavorite: parsed.version === 3 && card.isFavorite === true,
      }
    })

    const favoriteCardIds = new Set(
      cards.filter((card: any) => card.isFavorite).map((card: any) => card.id)
    )
    const existingViewOrders = Array.isArray(parsed.viewOrders) ? parsed.viewOrders : []
    const favoriteViewOrder = existingViewOrders.find(
      (viewOrder: any) => viewOrder.viewType === VIEW_FAVORITES
    )
    const orderedFavoriteIds = Array.isArray(favoriteViewOrder?.cardIds)
      ? favoriteViewOrder.cardIds.filter((id: string) => favoriteCardIds.has(id))
      : []
    const missingFavoriteIds = cards
      .filter((card: any) => card.isFavorite && !orderedFavoriteIds.includes(card.id))
      .map((card: any) => card.id)

    const data: AppData = {
      ...parsed,
      version: 3,
      cards,
      viewOrders: [
        ...existingViewOrders.filter(
          (viewOrder: any) => viewOrder.viewType !== VIEW_FAVORITES
        ),
        {
          viewType: VIEW_FAVORITES,
          cardIds: [...orderedFavoriteIds, ...missingFavoriteIds],
        },
      ],
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
