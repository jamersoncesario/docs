'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { UploadDropzone } from '@/components/documents/upload-dropzone'
import { DocumentCard } from '@/components/documents/document-card'
import type { Document } from '@/types'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/documents')
    const data = await res.json()
    setDocuments(data.documents ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    fetchDocuments()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Documentos</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Envie NF-e, extratos bancários e contratos para análise automática com IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload panel */}
        <div className="lg:col-span-1">
          <UploadDropzone onSuccess={fetchDocuments} />
        </div>

        {/* Document list */}
        <div className="lg:col-span-2">
          <h2 className="font-medium text-gray-900 mb-4">
            Documentos Enviados
            {documents.length > 0 && (
              <span className="ml-2 text-sm text-gray-400 font-normal">({documents.length})</span>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum documento enviado</p>
              <p className="text-gray-400 text-sm mt-1">
                Envie um documento ao lado para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
