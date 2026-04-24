import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/evolution/client'
import { z } from 'zod'

const bodySchema = z.object({
  contactId: z.string().uuid(),
  content: z.string().min(1).max(4096),
})

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  // Get contact JID
  const { data: contact } = await serviceClient
    .from('whatsapp_contacts')
    .select('jid')
    .eq('id', body.contactId)
    .single()

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Get active session instance
  const { data: session } = await serviceClient
    .from('whatsapp_sessions')
    .select('evolution_instance_id')
    .eq('is_connected', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) return NextResponse.json({ error: 'No active WhatsApp session' }, { status: 400 })

  // Send via Evolution API
  try {
    await sendTextMessage(session.evolution_instance_id, contact.jid, body.content)
  } catch (e) {
    console.error('Failed to send message:', e)
    return NextResponse.json({ error: 'Falha ao enviar mensagem' }, { status: 500 })
  }

  // Persist outbound message
  const { data: message, error } = await serviceClient
    .from('whatsapp_messages')
    .insert({
      contact_id: body.contactId,
      direction: 'outbound',
      content: body.content,
      message_type: 'text',
      ai_replied: false,
      sent_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message })
}
