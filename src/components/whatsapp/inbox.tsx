'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface Contact {
  id: string
  jid: string
  name: string | null
  phone: string | null
  client_id: string | null
  lastMessage?: string
  lastAt?: string
  unread?: number
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  content: string
  ai_replied: boolean
  created_at: string
}

export function WhatsAppInbox() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase
      .from('whatsapp_contacts')
      .select('id, jid, name, phone, client_id')
      .order('updated_at', { ascending: false })
    setContacts((data as Contact[]) ?? [])
  }, [supabase])

  const fetchMessages = useCallback(async (contactId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('id, direction, content, ai_replied, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages((data as Message[]) ?? [])

    // Mark as read
    await supabase
      .from('whatsapp_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('contact_id', contactId)
      .eq('direction', 'inbound')
      .is('read_at', null)
  }, [supabase])

  useEffect(() => {
    fetchContacts()

    // Realtime subscription for new messages
    const channel = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, () => {
        fetchContacts()
        if (selected) fetchMessages(selected.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchContacts, fetchMessages, selected, supabase])

  useEffect(() => {
    if (selected) fetchMessages(selected.id)
  }, [selected, fetchMessages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !reply.trim() || sending) return
    setSending(true)

    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: selected.id, content: reply }),
    })

    setReply('')
    setSending(false)
    fetchMessages(selected.id)
  }

  return (
    <div className="flex h-full">
      {/* Contact list */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">Conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhuma conversa ainda
            </div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                  selected?.id === c.id && 'bg-blue-50 border-l-2 border-l-blue-500'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-emerald-700">
                      {(c.name ?? c.phone ?? '?').slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.name ?? c.phone ?? c.jid}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{c.phone}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="px-5 py-3 bg-white border-b border-gray-200">
            <p className="font-semibold text-gray-900 text-sm">
              {selected.name ?? selected.phone ?? selected.jid}
            </p>
            <p className="text-xs text-gray-500">{selected.phone}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[70%] px-3 py-2 rounded-2xl text-sm',
                    m.direction === 'outbound'
                      ? 'bg-emerald-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  )}
                >
                  <p>{m.content}</p>
                  <div className={cn('flex items-center gap-1 mt-0.5',
                    m.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  )}>
                    <span className={cn('text-[10px]',
                      m.direction === 'outbound' ? 'text-emerald-100' : 'text-gray-400'
                    )}>
                      {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.ai_replied && (
                      <span className="text-[10px] text-emerald-200">· IA</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!reply.trim() || sending}
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {sending ? '…' : 'Enviar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        </div>
      )}
    </div>
  )
}
