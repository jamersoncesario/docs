'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, BookOpen, Search, Trash2, FileText } from 'lucide-react'
import { PopUploadDialog } from '@/components/pops/pop-upload-dialog'
import { formatDate } from '@/lib/utils'
import type { Pop } from '@/types'

export default function PopsPage() {
  const [pops, setPops] = useState<Pop[]>([])
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPops = useCallback(async () => {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`/api/pops${params}`)
    const data = await res.json()
    setPops(data.pops ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchPops()
  }, [fetchPops])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este POP?')) return
    await fetch(`/api/pops/${id}`, { method: 'DELETE' })
    fetchPops()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">POPs</h1>
          <p className="text-gray-500 mt-1 text-sm">Procedimentos Operacionais Padrão</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar POP
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar procedimentos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Carregando...</div>
      ) : pops.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'Nenhum POP encontrado' : 'Nenhum POP cadastrado ainda'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Tente outros termos de busca' : 'Adicione os procedimentos do escritório para usar com a IA'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pops.map((pop) => (
            <div
              key={pop.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <button
                  onClick={() => handleDelete(pop.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{pop.title}</h3>
              {pop.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pop.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-auto">
                Criado em {formatDate(pop.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <PopUploadDialog
          onClose={() => setShowDialog(false)}
          onSuccess={fetchPops}
        />
      )}
    </div>
  )
}
