import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/evolution/client'
import { generateWhatsAppReply } from '@/lib/ai/provider'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface EvolutionMessage {
  key: { id: string; remoteJid: string; fromMe: boolean }
  message?: { conversation?: string; extendedTextMessage?: { text?: string } }
  pushName?: string
  messageType?: string
}

interface EvolutionPayload {
  event: string
  instance: string
  data?: {
    messages?: EvolutionMessage[]
    instance?: { state?: string }
  }
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as EvolutionPayload
  const serviceClient = getServiceClient()

  // ─── Connection status update ───────────────────────────────────────────────
  if (payload.event === 'connection.update' || payload.event === 'CONNECTION_UPDATE') {
    const state = payload.data?.instance?.state ?? ''
    const isConnected = state === 'open'

    await serviceClient
      .from('whatsapp_sessions')
      .update({ is_connected: isConnected, updated_at: new Date().toISOString() })
      .eq('evolution_instance_id', payload.instance)

    return NextResponse.json({ ok: true })
  }

  // ─── Incoming message ───────────────────────────────────────────────────────
  if (payload.event === 'messages.upsert' || payload.event === 'MESSAGES_UPSERT') {
    const messages = payload.data?.messages ?? []

    for (const msg of messages) {
      // Skip outbound (sent by us) and non-text messages
      if (msg.key.fromMe) continue

      const text =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        ''

      if (!text) continue

      const jid = msg.key.remoteJid
      const phone = jid.split('@')[0]
      const pushName = msg.pushName ?? null

      // Upsert contact
      const { data: contact } = await serviceClient
        .from('whatsapp_contacts')
        .upsert({ jid, name: pushName, phone }, { onConflict: 'jid' })
        .select('id, name, client_id')
        .single()

      if (!contact) continue

      // Save inbound message
      await serviceClient.from('whatsapp_messages').insert({
        message_id: msg.key.id,
        contact_id: contact.id,
        direction: 'inbound',
        content: text,
        message_type: 'text',
      })

      // Generate AI reply
      let replyText: string
      try {
        replyText = await generateWhatsAppReply(text, contact.name ?? pushName ?? undefined)
      } catch (e) {
        console.error('AI reply generation failed:', e)
        continue
      }

      if (!replyText) continue

      // Send reply via Evolution API
      try {
        await sendTextMessage(payload.instance, jid, replyText)
      } catch (e) {
        console.error('Failed to send WhatsApp reply:', e)
        continue
      }

      // Save outbound AI message
      await serviceClient.from('whatsapp_messages').insert({
        contact_id: contact.id,
        direction: 'outbound',
        content: replyText,
        message_type: 'text',
        ai_replied: true,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
