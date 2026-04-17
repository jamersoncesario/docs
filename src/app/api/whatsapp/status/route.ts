import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: session } = await serviceClient
    .from('whatsapp_sessions')
    .select('id, is_connected, phone_number, display_name, updated_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { count: unreadCount } = await serviceClient
    .from('whatsapp_messages')
    .select('*', { count: 'exact', head: true })
    .eq('direction', 'inbound')
    .is('read_at', null)

  return NextResponse.json({
    session: session ?? null,
    unreadCount: unreadCount ?? 0,
  })
}
