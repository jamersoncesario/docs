import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  area: z.enum(['fiscal', 'dp', 'contabil', 'societario', 'legal']),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurrence: z.enum(['monthly', 'annual']).optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  notify_whatsapp: z.boolean().optional(),
})

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const status = searchParams.get('status')
  const clientId = searchParams.get('clientId')
  const projectId = searchParams.get('projectId')
  const assignedTo = searchParams.get('assignedTo')

  let query = supabase
    .from('tasks')
    .select(`
      *,
      clients:client_id(id, name),
      projects:project_id(id, title),
      assignee:assigned_to(id, full_name)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (area) query = query.eq('area', area)
  if (status) query = query.eq('status', status)
  if (clientId) query = query.eq('client_id', clientId)
  if (projectId) query = query.eq('project_id', projectId)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks: data })
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

  const { data, error } = await getServiceClient()
    .from('tasks')
    .insert({ ...body, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data }, { status: 201 })
}
