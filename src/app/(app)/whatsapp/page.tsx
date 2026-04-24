'use client'

import { useEffect, useState } from 'react'
import { QrPairing } from '@/components/whatsapp/qr-pairing'
import { WhatsAppInbox } from '@/components/whatsapp/inbox'
import { CheckCircle2, WifiOff, Loader2 } from 'lucide-react'

type SessionStatus = 'loading' | 'disconnected' | 'connected'

export default function WhatsAppPage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading')
  const [showPairing, setShowPairing] = useState(false)

  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then((r) => r.json())
      .then((data) => {
        setSessionStatus(data.session?.is_connected ? 'connected' : 'disconnected')
      })
      .catch(() => setSessionStatus('disconnected'))
  }, [])

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (sessionStatus === 'connected') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div>
            <h1 className="font-semibold text-gray-900">WhatsApp</h1>
            <p className="text-xs text-gray-500">Caixa compartilhada do escritório</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Conectado
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <WhatsAppInbox />
        </div>
      </div>
    )
  }

  // Disconnected state
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">WhatsApp</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Conecte o WhatsApp do escritório para atendimento com IA
        </p>
      </div>

      <div className="max-w-md">
        {!showPairing ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-semibold text-gray-900 mb-1">Nenhum WhatsApp conectado</h2>
            <p className="text-gray-500 text-sm mb-6">
              Conecte um número para receber e responder mensagens dos clientes com suporte de IA.
            </p>
            <button
              onClick={() => setShowPairing(true)}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Conectar WhatsApp
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <h2 className="font-semibold text-gray-900 text-center mb-6">
              Conectar WhatsApp
            </h2>
            <QrPairing onConnected={() => setSessionStatus('connected')} />
          </div>
        )}
      </div>
    </div>
  )
}
