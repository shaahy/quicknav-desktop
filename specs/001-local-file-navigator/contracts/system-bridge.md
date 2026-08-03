# System Bridge Contracts: 本地文件导航工具

**Feature**: 001-local-file-navigator
**Source**: EXPERIENCE.md 外部系统交互 + spec 外部系统交互契约
**Date**: 2026-07-22

> 本文件定义 Electron 主进程与操作系统之间的交互接口。所有接口通过 IPC 从渲染进程调用。
> 实现文件: `src/main/shell.ts` + `src/main/ipc.ts`

## IPC Channel Registry

所有渲染进程→主进程通信通过 `contextBridge` 暴露的 `window.electronAPI`：

```typescript
interface ElectronAPI {
  // 文件操作
  selectFile(): Promise<FileSelectionResult>;
  openFile(path: string): Promise<OpenResult>;
  showItemInFolder(path: string): Promise<LocateResult>;
  readHtmlTitle(path: string): Promise<string | null>;

  // 应用生命周期
  getAppData(): Promise<AppDataLoadResult>;
  saveAppData(data: AppData): Promise<SaveResult>;
  quitApp(): void;

  // 系统信息
  getPlatform(): 'win32' | 'darwin';
}
```

## X01: selectFile — 系统文件选择器

```
IPC: 'file:select'
Renderer → Main: { title?: string }
Main → Renderer: FileSelectionResult
```

```typescript
interface FileSelectionResult {
  success: boolean;
  canceled: boolean;
  file?: {
    relativePath: string;     // 同盘为相对路径，Windows 跨盘为绝对路径
    fileName: string;          // 不含扩展名
    extension: string;         // 扩展名（不含点）
    fileSize: number;          // 字节
    mtimeMs: number;           // 修改时间
    isHtml: boolean;           // 是否为 .html/.htm
  };
  error?: string;              // 取消以外的失败原因
}
```

**Behavior**:
- 调用 `dialog.showOpenDialog({ properties: ['openFile'] })` — 单文件选择
- 取消: `{ success: false, canceled: true }`
- 失败: `{ success: false, error: "..." }`
- 成功后自动读取文件元信息（fs.statSync）
- Main 进程以 `app-data.json` 所在目录为基准：同盘选择结果转换成相对路径，Windows 跨盘结果保存为规范化绝对路径
- 路径统一使用正斜杠和 Unicode NFC；跨盘选择不再因无法生成相对路径而失败
- 不在此阶段读取 HTML title（留给 `readHtmlTitle`）

## X02: openFile — 系统默认方式打开

```
IPC: 'shell:openFile'
Renderer → Main: { relativePath: string }
Main → Renderer: OpenResult
```

```typescript
interface OpenResult {
  success: boolean;
  error?: 'no-default-app' | 'file-not-found' | 'os-denied' | 'unknown';
}
```

**Behavior**:
- Main 进程先以 `app-data.json` 所在目录解析绝对路径，再调用 `shell.openPath(resolvedPath)`
- 成功: `{ success: true }` (shell.openPath 返回空字符串表示成功)
- 失败: 解析 `shell.openPath` 的错误码
- 不预检查文件是否存在（spec FR-026: 不预判文件状态）

## X03: showItemInFolder — 文件管理器中定位

```
IPC: 'shell:showItemInFolder'
Renderer → Main: { relativePath: string }
Main → Renderer: LocateResult
```

```typescript
interface LocateResult {
  success: boolean;
  error?: 'not-found' | 'os-denied' | 'unknown';
}
```

**Behavior**:
- Main 进程统一解析持久化路径：相对路径以 `app-data.json` 所在目录为基准，绝对路径保持原目标；随后调用 `shell.showItemInFolder(resolvedPath)`
- Windows: 资源管理器中定位
- macOS: Finder 中定位
- 不预检查文件存在

## X04: 操作系统安全提示

不可编程接口——由操作系统在以下情况自动触发：
- Windows: 下载的可执行文件 → SmartScreen / "打开文件 - 安全警告"对话框
- macOS: 未签名应用/脚本首次执行 → Gatekeeper 提示

Electron `shell.openPath` 会自然触发这些提示，应用不需要（也不应该）做任何额外处理。

## readHtmlTitle — HTML 标题读取

```
IPC: 'file:readHtmlTitle'
Renderer → Main: { relativePath: string }
Main → Renderer: string | null
```

**Behavior**:
- 仅在 `selectFile` 返回 `isHtml: true` 时调用
- Main 进程统一解析持久化路径：相对路径以 `app-data.json` 所在目录为基准，绝对路径保持原目标
- 读取文件前 64KB 并解析 `<title>...</title>`
- 返回去除首尾空格后的内容
- 无法读取、缺少 `<title>`、标题为空或仅含空白 → `null`
- 调用方回退到 `fileName`（spec FR-003/FR-004）

## getAppData / saveAppData — 数据持久化

```
IPC: 'store:load'
Main → Renderer: AppDataLoadResult

IPC: 'store:save'
Renderer → Main: { data: AppData }
Main → Renderer: SaveResult
```

```typescript
interface AppDataLoadResult {
  success: boolean;
  data?: AppData;
  error?: 'not-found' | 'corrupted';
  // 'corrupted' 时用户可选重建
}

interface SaveResult {
  success: boolean;
  error?: 'disk-full' | 'permission-denied' | 'unknown';
}
```

**Load behavior**（spec FR-036a）:
- 文件不存在: `{ success: true, data: emptyAppData() }`
- 文件存在且 JSON 解析成功: `{ success: true, data }`
- JSON 解析失败: `{ success: false, error: 'corrupted' }`
- 不尝试备份、不尝试修复
- 渲染进程显示阻断反馈: "无法加载本地数据" + 重试/关闭
- 用户确认重建: 调用 `saveAppData(emptyAppData())` 后用空数据继续

**Save behavior**（spec FR-036）:
- `JSON.stringify(data, null, 2)` → `fs.writeFileSync`
- 数据变更时调用；关闭窗口和应用内退出均结束进程（FR-036b）
- 不提供托盘最小化或后台驻留路径
- 排序操作 debounce 500ms 后调用

## Error Handling Convention

所有 IPC 调用遵循统一错误模式：

```typescript
type IpcResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; canceled?: boolean };
```

- `canceled: true` 表示用户主动取消（非错误，不显示反馈）
- `success: false` + `canceled: false/undefined` → 进入对应错误 Surface (S16/S17/加载阻断)
