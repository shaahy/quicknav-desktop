interface ErrorEventSource {
  on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): unknown
}

/**
 * Keep a disconnected parent pipe from crashing the Electron main process.
 * Non-EPIPE stream failures remain fatal so unexpected I/O faults are visible.
 */
export function guardBrokenPipe(stream: ErrorEventSource | undefined): void {
  stream?.on('error', (error) => {
    if (error.code === 'EPIPE') return
    throw error
  })
}

export function installBrokenPipeGuards(): void {
  guardBrokenPipe(process.stdout)
  guardBrokenPipe(process.stderr)
}
