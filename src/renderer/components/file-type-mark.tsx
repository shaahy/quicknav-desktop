import React from 'react'
import '../styles/components/file-type-mark.css'

interface FileTypeMarkProps {
  /** File extension without dot, e.g. 'pdf', 'docx' */
  extension: string
  /** File name (used for icon inference / title attribute) */
  fileName: string
}

// ── Icon map: extension → emoji ──

const ICON_MAP: Record<string, string> = {
  // Documents
  pdf: '📄',
  doc: '📄',
  docx: '📄',
  txt: '📄',
  rtf: '📄',
  odt: '📄',
  // Images
  jpg: '🖼',
  jpeg: '🖼',
  png: '🖼',
  gif: '🖼',
  bmp: '🖼',
  svg: '🖼',
  webp: '🖼',
  ico: '🖼',
  // Audio
  mp3: '🎵',
  wav: '🎵',
  ogg: '🎵',
  flac: '🎵',
  aac: '🎵',
  wma: '🎵',
  m4a: '🎵',
  // Video
  mp4: '🎬',
  avi: '🎬',
  mkv: '🎬',
  mov: '🎬',
  wmv: '🎬',
  flv: '🎬',
  webm: '🎬',
  // Archives
  zip: '📦',
  rar: '📦',
  '7z': '📦',
  tar: '📦',
  gz: '📦',
  bz2: '📦',
  xz: '📦',
  // Code / Scripts
  js: '⚙',
  ts: '⚙',
  py: '⚙',
  rb: '⚙',
  go: '⚙',
  rs: '⚙',
  java: '⚙',
  c: '⚙',
  cpp: '⚙',
  h: '⚙',
  hpp: '⚙',
  html: '⚙',
  css: '⚙',
  scss: '⚙',
  less: '⚙',
  json: '⚙',
  xml: '⚙',
  yaml: '⚙',
  yml: '⚙',
  toml: '⚙',
  sh: '⚙',
  bash: '⚙',
  bat: '⚙',
  ps1: '⚙',
}

function getIcon(extension: string): string {
  return ICON_MAP[extension.toLowerCase()] ?? '❓'
}

export function FileTypeMark({ extension, fileName }: FileTypeMarkProps) {
  const icon = getIcon(extension)

  return (
    <span className="qc-file-type-mark" title={fileName}>
      <span className="qc-file-type-mark__icon" aria-hidden="true">{icon}</span>
      <span className="qc-file-type-mark__ext">{extension.toUpperCase()}</span>
    </span>
  )
}
