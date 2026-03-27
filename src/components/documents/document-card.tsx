'use client'

import { useState } from 'react'
import { FileText, Loader2, CheckCircle2, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate, formatFileType, formatStatus, cn } from '@/lib/utils'
import { ExtractedDataView } from './extracted-data-view'
import type { Document } from '@/types'

interface DocumentCardProps {
  document: Document
  onDelete: (id: string) => void
}

const statusIcon = {
  pending: <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
  processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  done: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
}

const statusColor = {
  pending: 'text-gray-500 bg-gray-100',
  processing: 'text-blue-700 bg-blue-100',
  done: 'text-emerald-700 bg-emerald-100',
  error: 'text-red-700 bg-red-100',
}

export function DocumentCard({ document: doc, onDelete }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-violet-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{formatFileType(doc.file_type)}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{formatDate(doc.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[doc.status])}>
            {formatStatus(doc.status)}
          </span>
          {statusIcon[doc.status]}

          {doc.status === 'done' && doc.extracted_data && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => onDelete(doc.id)}
            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && doc.extracted_data && (
        <div className="border-t border-gray-100 p-4">
          <ExtractedDataView
            data={doc.extracted_data as Record<string, unknown>}
            fileType={doc.file_type}
          />
        </div>
      )}
    </div>
  )
}
