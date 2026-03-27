'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  input: string
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.closest('form')
        form?.requestSubmit()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        value={input}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
        rows={1}
        className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
        style={{ minHeight: '44px' }}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
