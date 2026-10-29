export interface TextChunk {
  index: number
  content: string
}

export const chunkText = (input: string, maximumCharacters = 1_800, overlap = 200): TextChunk[] => {
  const normalized = input.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  if (!normalized) return []

  const chunks: TextChunk[] = []
  let cursor = 0
  while (cursor < normalized.length) {
    let end = Math.min(cursor + maximumCharacters, normalized.length)
    if (end < normalized.length) {
      const paragraph = normalized.lastIndexOf('\n', end)
      const sentence = normalized.lastIndexOf('. ', end)
      const boundary = Math.max(paragraph, sentence)
      if (boundary > cursor + Math.floor(maximumCharacters * 0.5)) end = boundary + 1
    }
    const content = normalized.slice(cursor, end).trim()
    if (content) chunks.push({ index: chunks.length, content })
    if (end >= normalized.length) break
    cursor = Math.max(end - overlap, cursor + 1)
  }
  return chunks
}

