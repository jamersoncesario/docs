import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createInstance, setWebhook } from '@/lib/evolution/client'
import { v4 as uuidv4 } from 'uuid'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = getServiceClient()

  // Check if there's already a connected session
  const { data: existing } = await serviceClient
    .from('whatsapp_sessions')
    .select('id, evolution_instance_id, is_connected')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing?.is_connected) {
    return NextResponse.json({
      alreadyConnected: true,
      sessionId: existing.id,
    })
  }

  // Create new Evolution API instance
  const instanceName = `prime-conect-${uuidv4().slice(0, 8)}`

  try {
    await createInstance(instanceName)
  } catch (e) {
    console.error('Failed to create Evolution instance:', e)
    return NextResponse.json({ error: 'Falha ao criar instância WhatsApp' }, { status: 500 })
  }

  // Set webhook so Evolution calls us on new messages
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`
  try {
    await setWebhook(instanceName, webhookUrl)
  } catch (e) {
    console.error('Failed to set webhook:', e)
  }

  // Persist session record
  const { data: session, error } = await serviceClient
    .from('whatsapp_sessions')
    .insert({
      evolution_instance_id: instanceName,
      is_connected: false,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sseUrl = `/api/whatsapp/qr-stream?instanceId=${encodeURIComponent(instanceName)}&sessionId=${session.id}`

  return NextResponse.json({ sseUrl, sessionId: session.id })
}
