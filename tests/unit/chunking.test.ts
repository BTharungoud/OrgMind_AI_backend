import { describe, expect, it } from 'vitest'
import { chunkText } from '../../src/services/chunking.service.js'

describe('chunkText', () => {
  it('returns no chunks for blank input', () => {
    expect(chunkText('   ')).toEqual([])
  })

  it('preserves meaningful content with bounded chunks', () => {
    const input = `${'Alpha sentence. '.repeat(80)}\n${'Beta sentence. '.repeat(80)}`
    const chunks = chunkText(input, 300, 40)
    expect(chunks.length).toBeGreaterThan(2)
    expect(chunks.every(chunk => chunk.content.length <= 301)).toBe(true)
    expect(chunks[0]?.index).toBe(0)
    expect(chunks.at(-1)?.content).toContain('Beta sentence')
  })
})

