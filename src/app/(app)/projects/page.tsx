'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderKanban, Calendar, Building2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import Link from 'next/link'

type Area = 'fiscal' | 'dp' | 'contabil' | 'societario' | 'legal'
type ProjectStatus = 'active' | 'paused' | 'done' | 'cancelled'

interface Project {
  id: string
  title: string
  description: string | null
  area: Area
  status: ProjectStatus
  due_date: string | null
  clients: { id: string; name: string } | null
  created_at: string
}

const AREA_LABEL: Record<Area, string> = {
  fiscal: 'Fiscal', dp: 'DP', contabil: 'Contábil', societario: 'Societário', legal: 'Legal',
}

const AREA_COLOR: Record<Area, string> = {
  fiscal: 'bg-blue-100 text-blue-700',
  dp: 'bg-emerald-100 text-emerald-700',
  contabil: 'bg-violet-100 text-violet-700',
  societario: 'bg-amber-100 text-amber-700',
  legal: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Ativo', paused: 'Pausado', done: 'Concluído', cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: 'text-emerald-600 bg-emerald-50',
  paused: 'text-amber-600 bg-amber-50',
  done: 'text-gray-500 bg-gray-100',
  cancelled: 'text-red-600 bg-red-50',
}

const AREAS: Area[] = ['fiscal', 'dp', 'contabil', 'societario', 'legal']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [areaFilter, setAreaFilter] = useState<Area | ''>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', area: 'fiscal' as Area, due_date: '' })
  const [saving, setSaving] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = areaFilter ? `?area=${areaFilter}&status=active` : '?status=active'
    const res = await fetch(`/api/projects${params}`)
    const data = await res.json()
    setProjects(data.projects ?? [])
    setLoading(false)
  }, [areaFilter])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    fetchProjects()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-1 text-sm">Projetos por área do escritório</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setAreaFilter('')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !areaFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
          Todos
        </button>
        {AREAS.map((a) => (
          <button key={a} onClick={() => setAreaFilter(a)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              areaFilter === a ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
            {AREA_LABEL[a]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum projeto ativo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between mb-3">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', AREA_COLOR[p.area])}>
                  {AREA_LABEL[p.area]}
                </span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[p.status])}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
              {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                {p.clients && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />{p.clients.name}
                  </span>
                )}
                {p.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDate(p.due_date)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Novo Projeto</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required placeholder="Ex: Planejamento Tributário 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value as Area }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {AREAS.map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={!form.title || saving}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Criando…' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
