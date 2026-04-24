'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Loader2, CheckCircle2, Smartphone } from 'lucide-react'

interface QrPairingProps {
  onConnected: () => void
}

export function QrPairing({ onConnected }: QrPairingProps) {
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'timeout' | 'error'>('loading')

  useEffect(() => {
    let es: EventSource | null = null

    async function start() {
      try {
        const res = await fetch('/api/whatsapp/connect', { method: 'POST' })
        const data = await res.json()

        if (data.alreadyConnected) {
          setStatus('connected')
          onConnected()
          return
        }

        if (!data.sseUrl) {
          setStatus('error')
          return
        }

        es = new EventSource(data.sseUrl)

        es.onmessage = (event) => {
          const payload = JSON.parse(event.data) as { type: string; data?: string }

          if (payload.type === 'qr' && payload.data) {
            setQrValue(payload.data)
            setStatus('qr')
          } else if (payload.type === 'connected') {
            setStatus('connected')
            es?.close()
            onConnected()
          } else if (payload.type === 'timeout') {
            setStatus('timeout')
            es?.close()
          }
        }

        es.onerror = () => {
          setStatus('error')
          es?.close()
        }
      } catch {
        setStatus('error')
      }
    }

    start()
    return () => es?.close()
  }, [onConnected])

  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        <p className="font-semibold text-gray-900">WhatsApp conectado!</p>
        <p className="text-sm text-gray-500">A caixa de mensagens está pronta.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-500">Gerando QR Code…</p>
      </div>
    )
  }

  if (status === 'timeout' || status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-red-600">
          {status === 'timeout' ? 'Tempo esgotado. Tente novamente.' : 'Erro ao conectar.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {qrValue ? (
          <QRCode value={qrValue} size={220} />
        ) : (
          <div className="w-[220px] h-[220px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-800 flex items-center gap-2 justify-center">
          <Smartphone className="w-4 h-4" />
          Escaneie com o WhatsApp do celular
        </p>
        <ol className="text-xs text-gray-500 text-left space-y-0.5 mt-2">
          <li>1. Abra o WhatsApp no celular</li>
          <li>2. Toque em ⋮ → Aparelhos conectados</li>
          <li>3. Toque em "Conectar um aparelho"</li>
          <li>4. Aponte a câmera para o QR acima</li>
        </ol>
      </div>
    </div>
  )
}
