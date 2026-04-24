import type { Message } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-gray-200' : 'bg-blue-600'
        )}
      >
        <span className={cn('text-xs font-bold', isUser ? 'text-gray-600' : 'text-white')}>
          {isUser ? 'VC' : 'IA'}
        </span>
      </div>

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <code className="block bg-gray-100 rounded p-2 text-xs font-mono my-2 overflow-x-auto">
                    {children}
                  </code>
                ) : (
                  <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                )
              },
              h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
