import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parsePdf } from '@/lib/documents/parser'
import { v4 as uuidv4 } from 'uuid'

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
  const search = searchParams.get('search')

  let query = supabase
    .from('pops')
    .select('id, title, description, file_path, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pops: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const serviceClient = getServiceClient()
  let filePath: string | null = null
  let content: string | null = null

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    filePath = fileName

    // Upload to Storage
    const { error: uploadError } = await serviceClient.storage
      .from('pops')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    // Parse PDF
    if (file.type === 'application/pdf') {
      try {
        content = await parsePdf(buffer)
      } catch (e) {
        console.error('PDF parse error:', e)
      }
    }
  } else {
    // Text content provided directly
    content = formData.get('content') as string | null
  }

  const { data: pop, error } = await serviceClient
    .from('pops')
    .insert({
      title,
      description: description || null,
      file_path: filePath,
      content,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger embedding in background (if content available)
  if (content && pop.id) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pops/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ popId: pop.id }),
    }).catch((e) => console.error('Embed trigger failed:', e))
  }

  return NextResponse.json({ pop }, { status: 201 })
}
