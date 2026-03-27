import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

/**
 * Splits text into overlapping chunks for RAG indexing.
 * Uses character count as a proxy for tokens (~4 chars/token for Portuguese).
 */
export function chunkText(
  text: string,
  chunkSize = 1500,
  overlap = 300
): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\s*\n/)
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > chunkSize && current.length > 0) {
      chunks.push(current.trim())
      // keep overlap
      const words = current.split(' ')
      const overlapWords = words.slice(
        Math.max(0, words.length - Math.floor(overlap / 5))
      )
      current = overlapWords.join(' ') + '\n\n' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim())
  }

  // If we ended up with a single chunk larger than chunkSize, split by sentence
  if (chunks.length === 1 && chunks[0].length > chunkSize * 1.5) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text]
    const rechunked: string[] = []
    let buf = ''
    for (const sentence of sentences) {
      if ((buf + sentence).length > chunkSize && buf.length > 0) {
        rechunked.push(buf.trim())
        buf = sentence
      } else {
        buf += sentence
      }
    }
    if (buf.trim()) rechunked.push(buf.trim())
    return rechunked.length > 0 ? rechunked : chunks
  }

  return chunks
}
