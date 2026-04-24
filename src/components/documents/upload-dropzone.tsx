'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import type { DocumentFileType } from '@/types'

interface UploadDropzoneProps {
  onSuccess: () => void
}

const FILE_TYPE_OPTIONS: { value: DocumentFileType; label: string }[] = [
  { value: 'nfe', label: 'NF-e (Nota Fiscal Eletrônica)' },
  { value: 'bank_statement', label: 'Extrato Bancário' },
  { value: 'contract', label: 'Contrato' },
  { value: 'other', label: 'Outro' },
]

export function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<DocumentFileType>('nfe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    onDrop: (files) => {
      setFile(files[0] ?? null)
      setError(null)
    },
  })

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao processar documento')
      setLoading(false)
      return
    }

    setFile(null)
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Enviar Documento</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as DocumentFileType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FILE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF ou TXT</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-800 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            'Enviar e Analisar'
          )}
        </button>
      </div>
    </div>
  )
}
