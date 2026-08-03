import * as path from 'path'
import { describe, expect, it } from 'vitest'
import {
  getAppDataDir,
  resolveAppDataPath,
  resolveRelativeToAppData,
} from '../../src/main/app-data-location'

describe('app-data location', () => {
  it('uses the project directory in development', () => {
    const appPath = path.resolve('project')

    expect(resolveAppDataPath({
      isPackaged: false,
      appPath,
      executablePath: path.resolve('unused', 'app.exe'),
    })).toBe(path.join(appPath, 'app-data.json'))
  })

  it('uses the installed executable directory for a regular packaged app', () => {
    const executablePath = path.resolve('installed', '速查工具.exe')

    expect(resolveAppDataPath({
      isPackaged: true,
      appPath: path.resolve('unused'),
      executablePath,
    })).toBe(path.join(path.dirname(executablePath), 'app-data.json'))
  })

  it('uses the external executable directory for a portable packaged app', () => {
    const portableDir = path.resolve('portable-copy')

    expect(resolveAppDataPath({
      isPackaged: true,
      appPath: path.resolve('temporary', 'resources', 'app.asar'),
      executablePath: path.resolve('temporary', '速查工具.exe'),
      portableExecutableDir: portableDir,
    })).toBe(path.join(portableDir, 'app-data.json'))
  })

  it('resolves a card path from the directory containing app-data.json', () => {
    const appDataPath = path.join('E:\\', '工具', 'app-data.json')

    expect(getAppDataDir(appDataPath)).toBe(path.join('E:\\', '工具'))
    expect(resolveRelativeToAppData(
      appDataPath,
      '../A 教程集合/工作记录.md',
    )).toBe(path.join('E:\\', 'A 教程集合', '工作记录.md'))
  })

  it('follows the new app-data.json location after the portable bundle moves', () => {
    const relativePath = '../A 教程集合/工作记录.md'
    const firstAppDataPath = path.resolve('first-copy', '工具', 'app-data.json')
    const movedAppDataPath = path.resolve('moved-copy', '工具', 'app-data.json')

    expect(resolveRelativeToAppData(firstAppDataPath, relativePath)).toBe(
      path.resolve('first-copy', 'A 教程集合', '工作记录.md'),
    )
    expect(resolveRelativeToAppData(movedAppDataPath, relativePath)).toBe(
      path.resolve('moved-copy', 'A 教程集合', '工作记录.md'),
    )
  })

  it('keeps a cross-drive Windows absolute path independent of app-data.json', () => {
    const appDataPath = 'E:\\速查工具\\app-data.json'
    const absolutePath = 'C:/Users/MSI/Desktop/工作记录.md'

    expect(resolveRelativeToAppData(appDataPath, absolutePath)).toBe(
      path.win32.normalize(absolutePath),
    )
  })
})
