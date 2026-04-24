'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { BookOpen } from 'lucide-react'

export function ChatInterface() {
  const [useRag, setUseRag] = useState(true)
  const [conversationId, setConversationId] = useState<string | undefined>()

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      api: '/api/chat',
      body: { conversationId, useRag },
      onResponse(response) {
        const convId = response.headers.get('X-Conversation-Id')
        if (convId && !conversationId) {
          setConversationId(convId)
        }
      },
    })

  function handleNewChat() {
    setConversationId(undefined)
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="font-semibold text-gray-900">Assistente IA</h1>
          <p className="text-xs text-gray-500">Powered by Claude</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="rounded"
            />
            <BookOpen className="w-3.5 h-3.5" />
            Usar POPs
          </label>
          <button
            onClick={handleNewChat}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Nova conversa
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Como posso ajudar?
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Faça perguntas sobre legislação fiscal, obrigações contábeis,
              procedimentos do escritório e muito mais.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                'Qual é o prazo para entrega da DCTF mensal?',
                'Como calcular o IRPJ pelo lucro presumido?',
                'Quais obrigações acessórias do eSocial?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                  }}
                  className="text-left text-sm px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
