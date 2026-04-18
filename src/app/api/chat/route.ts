import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { retrieveContext, formatContextForPrompt } from '@/lib/ai/rag'
import { buildAccountingSystemPrompt } from '@/lib/ai/prompts'
import { z } from 'zod'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  conversationId: z.string().uuid().optional(),
  useRag: z.boolean().optional().default(true),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const { messages, conversationId, useRag } = body

  // Get or create conversation
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let convId = conversationId
  if (!convId) {
    const firstMsg = messages.find((m) => m.role === 'user')
    const title = firstMsg?.content.slice(0, 60) ?? 'Nova conversa'
    const { data: conv } = await serviceClient
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single()
    convId = conv?.id
  }

  // RAG context retrieval
  let systemPrompt = buildAccountingSystemPrompt()
  if (useRag && messages.length > 0) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      try {
        const chunks = await retrieveContext(lastUserMsg.content)
        if (chunks.length > 0) {
          const context = formatContextForPrompt(chunks)
          systemPrompt = buildAccountingSystemPrompt(context)
        }
      } catch (e) {
        console.error('RAG retrieval failed:', e)
      }
    }
  }

  // Save user message
  const lastMsg = messages[messages.length - 1]
  if (convId && lastMsg?.role === 'user') {
    await serviceClient.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: lastMsg.content,
    })
  }

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    async onFinish({ text }) {
      if (convId) {
        await serviceClient.from('messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: text,
        })
      }
    },
  })

  return result.toDataStreamResponse({
    headers: {
      'X-Conversation-Id': convId ?? '',
    },
  })
}
