import { NextRequest, NextResponse } from 'next/server'
import { getQrCode, fetchInstance } from '@/lib/evolution/client'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const POLL_INTERVAL_MS = 2500
const MAX_WAIT_MS = 5 * 60 * 1000 // 5 minutes timeout

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const instanceId = request.nextUrl.searchParams.get('instanceId')
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!instanceId || !sessionId) {
    return new NextResponse('Missing instanceId or sessionId', { status: 400 })
  }

  const safeInstanceId: string = instanceId
  const serviceClient = getServiceClient()
  const encoder = new TextEncoder()
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let lastQr = ''

      async function poll() {
        if (Date.now() - startTime > MAX_WAIT_MS) {
          send({ type: 'timeout' })
          controller.close()
          return
        }

        if (request.signal.aborted) {
          controller.close()
          return
        }

        try {
          // Check connection status
          const instance = await fetchInstance(safeInstanceId)
          const status = instance?.connectionStatus ?? instance?.status ?? ''

          if (status === 'open' || status === 'connected') {
            // Update DB
            await serviceClient
              .from('whatsapp_sessions')
              .update({
                is_connected: true,
                phone_number: (instance as unknown as Record<string, string>)?.number ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', sessionId)

            send({ type: 'connected' })
            controller.close()
            return
          }

          // Get QR code
          const qrData = await getQrCode(safeInstanceId)
          const qrBase64 = qrData?.base64 ?? qrData?.code ?? ''

          if (qrBase64 && qrBase64 !== lastQr) {
            lastQr = qrBase64
            // Store latest QR in DB
            await serviceClient
              .from('whatsapp_sessions')
              .update({ qr_code: qrBase64, updated_at: new Date().toISOString() })
              .eq('id', sessionId)
            send({ type: 'qr', data: qrBase64 })
          }
        } catch (e) {
          console.error('QR stream poll error:', e)
        }

        // Schedule next poll
        setTimeout(poll, POLL_INTERVAL_MS)
      }

      request.signal.addEventListener('abort', () => controller.close())
      poll()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
