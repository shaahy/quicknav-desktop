import { EventEmitter } from 'events'
import { describe, expect, it } from 'vitest'
import { guardBrokenPipe } from '../../src/main/stdio'

describe('guardBrokenPipe', () => {
  it('swallows EPIPE emitted by a disconnected output stream', () => {
    const stream = new EventEmitter()
    guardBrokenPipe(stream)

    const error = Object.assign(new Error('broken pipe'), { code: 'EPIPE' })
    expect(() => stream.emit('error', error)).not.toThrow()
  })

  it('does not hide unrelated output stream errors', () => {
    const stream = new EventEmitter()
    guardBrokenPipe(stream)

    const error = Object.assign(new Error('bad descriptor'), { code: 'EBADF' })
    expect(() => stream.emit('error', error)).toThrow(error)
  })
})
