import { createClient } from '@supabase/supabase-js'
import { embedText } from './embeddings'
import type { RetrievedChunk } from '@/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function retrieveContext(
  query: string,
  matchThreshold = 0.5,
  matchCount = 5
): Promise<RetrievedChunk[]> {
  const supabase = getServiceClient()
  const embedding = await embedText(query)

  const { data, error } = await supabase.rpc('match_pop_chunks', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  })

  if (error) {
    console.error('RAG retrieval error:', error)
    return []
  }

  return (data ?? []) as RetrievedChunk[]
}

export function formatContextForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map(
      (chunk) =>
        `[POP: ${chunk.pop_title}]\n${chunk.content}`
    )
    .join('\n\n---\n\n')
}
