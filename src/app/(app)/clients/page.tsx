'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  regime: string | null
  areas: string[] | null
  notes: string | null
}

const REGIME_LABEL: Record<string, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
  mei: 'MEI',
  isento: 'Isento',
}

const AREAS = ['fiscal', 'dp', 'contabil', 'societario', 'legal'] as const
const AREA_LABEL: Record<string, string> = {
  fiscal: 'Fiscal', dp: 'DP', contabil: 'Contábil', societario: 'Societário', legal: 'Legal',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  // Form state
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', regime: '', areas: [] as string[], notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`/api/clients${params}`)
    const data = await res.json()
    setClients(data.clients ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchClients() }, [fetchClients])

  function openNew() {
    setEditing(null)
    setForm({ name: '', cnpj: '', email: '', phone: '', regime: '', areas: [], notes: '' })
    setShowForm(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({ name: c.name, cnpj: c.cnpj ?? '', email: c.email ?? '', phone: c.phone ?? '', regime: c.regime ?? '', areas: c.areas ?? [], notes: c.notes ?? '' })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = editing ? `/api/clients/${editing.id}` : '/api/clients'
    const method = editing ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    fetchClients()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    fetchClients()
  }

  function toggleArea(area: string) {
    setForm((f) => ({
      ...f,
      areas: f.areas.includes(area) ? f.areas.filter((a) => a !== area) : [...f.areas, area],
    }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1 text-sm">Carteira de clientes do escritório</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou CNPJ…" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando…</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Regime</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Áreas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.regime ? REGIME_LABEL[c.regime] ?? c.regime : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.areas ?? []).map((a) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{AREA_LABEL[a] ?? a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { label: 'Nome *', key: 'name', placeholder: 'Razão social ou nome' },
                { label: 'CNPJ / CPF', key: 'cnpj', placeholder: '00.000.000/0001-00' },
                { label: 'E-mail', key: 'email', placeholder: 'contato@empresa.com', type: 'email' },
                { label: 'Telefone', key: 'phone', placeholder: '(11) 99999-9999' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
                <select value={form.regime} onChange={(e) => setForm((f) => ({ ...f, regime: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione…</option>
                  {Object.entries(REGIME_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Áreas de Atendimento</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleArea(a)}
                      className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        form.areas.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      )}>
                      {AREA_LABEL[a]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={!form.name || saving} className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
