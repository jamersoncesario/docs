import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parsePdf } from '@/lib/documents/parser'
import { extractDocumentData } from '@/lib/documents/extractor'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import type { DocumentFileType } from '@/types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FILE_TYPES: DocumentFileType[] = ['nfe', 'bank_statement', 'contract', 'other']

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, file_type, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ documents: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const fileType = (formData.get('fileType') as string) ?? 'other'

  if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })
  if (!FILE_TYPES.includes(fileType as DocumentFileType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const serviceClient = getServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = `${user.id}/${fileName}`

  // Upload to Storage
  const { error: uploadError } = await serviceClient.storage
    .from('documents')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
  }

  // Insert pending document record
  const { data: doc, error: insertError } = await serviceClient
    .from('documents')
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: fileType,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Process synchronously (parse PDF → extract data)
  try {
    await serviceClient
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', doc.id)

    let rawText = ''
    if (file.type === 'application/pdf') {
      rawText = await parsePdf(buffer)
    } else {
      rawText = buffer.toString('utf-8')
    }

    const extractedData = await extractDocumentData(rawText, fileType as DocumentFileType)

    await serviceClient
      .from('documents')
      .update({
        status: 'done',
        raw_text: rawText.slice(0, 50000), // limit stored text
        extracted_data: extractedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)

    return NextResponse.json({ document: { ...doc, status: 'done', extracted_data: extractedData } }, { status: 201 })
  } catch (e) {
    console.error('Document processing error:', e)
    await serviceClient
      .from('documents')
      .update({ status: 'error', updated_at: new Date().toISOString() })
      .eq('id', doc.id)

    return NextResponse.json({ document: { ...doc, status: 'error' } }, { status: 201 })
  }
}
