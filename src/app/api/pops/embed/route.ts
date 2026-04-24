import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { embedText, chunkText } from '@/lib/ai/embeddings'
import { z } from 'zod'

const bodySchema = z.object({ popId: z.string().uuid() })

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { popId } = body
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch POP content
  const { data: pop, error } = await supabase
    .from('pops')
    .select('content')
    .eq('id', popId)
    .single()

  if (error || !pop?.content) {
    return NextResponse.json({ error: 'POP not found or has no content' }, { status: 404 })
  }

  // Delete existing chunks
  await supabase.from('pop_chunks').delete().eq('pop_id', popId)

  // Split into chunks and embed
  const chunks = chunkText(pop.content)
  const rows = []

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i])
    rows.push({
      pop_id: popId,
      chunk_index: i,
      content: chunks[i],
      embedding,
    })
  }

  const { error: insertError } = await supabase.from('pop_chunks').insert(rows)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ chunksCreated: rows.length })
}
