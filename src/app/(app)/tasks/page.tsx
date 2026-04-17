'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckSquare, Calendar, Flag, User } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type Area = 'fiscal' | 'dp' | 'contabil' | 'societario' | 'legal'

interface Task {
  id: string
  title: string
  description: string | null
  area: Area
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  is_recurring: boolean
  client_id: string | null
  assigned_to: string | null
  clients: { id: string; name: string } | null
  assignee: { id: string; full_name: string } | null
}

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'A Fazer', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'Em Andamento', color: 'bg-blue-50' },
  { key: 'review', label: 'Revisão', color: 'bg-amber-50' },
  { key: 'done', label: 'Concluído', color: 'bg-emerald-50' },
]

const AREAS: { key: Area; label: string }[] = [
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'dp', label: 'DP' },
  { key: 'contabil', label: 'Contábil' },
  { key: 'societario', label: 'Societário' },
  { key: 'legal', label: 'Legal' },
]

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-600',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [areaFilter, setAreaFilter] = useState<Area | ''>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', area: 'fiscal' as Area, priority: 'medium' as TaskPriority,
    due_date: '', description: '', status: 'todo' as TaskStatus,
  })
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = areaFilter ? `?area=${areaFilter}` : ''
    const res = await fetch(`/api/tasks${params}`)
    const data = await res.json()
    setTasks(data.tasks ?? [])
    setLoading(false)
  }, [areaFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir tarefa?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    fetchTasks()
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status)

  const isOverdue = (due: string | null) =>
    due && new Date(due) < new Date() && true

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tarefas</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Gestão de tarefas contábeis esporádicas e recorrentes</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      {/* Area filter */}
      <div className="flex gap-2 mb-5 shrink-0">
        <button onClick={() => setAreaFilter('')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !areaFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
          Todas
        </button>
        {AREAS.map((a) => (
          <button key={a.key} onClick={() => setAreaFilter(a.key)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              areaFilter === a.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando…</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
          {COLUMNS.map((col) => (
            <div key={col.key} className={cn('rounded-xl p-3 flex flex-col', col.color)}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</h2>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {tasksByStatus(col.key).map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                      <button onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0">
                        ×
                      </button>
                    </div>

                    {task.clients && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{task.clients.name}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={cn('text-[10px] font-medium flex items-center gap-0.5', PRIORITY_COLOR[task.priority])}>
                        <Flag className="w-3 h-3" />{PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.due_date && (
                        <span className={cn('text-[10px] flex items-center gap-0.5',
                          isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-600 font-medium' : 'text-gray-400')}>
                          <Calendar className="w-3 h-3" />{formatDate(task.due_date)}
                        </span>
                      )}
                      {task.is_recurring && (
                        <span className="text-[10px] text-purple-600">↺ Recorrente</span>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button key={c.key} onClick={() => handleStatusChange(task.id, c.key)}
                          className="text-[10px] text-gray-400 hover:text-blue-600 underline transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {tasksByStatus(col.key).length === 0 && (
                  <div className="text-center py-6 text-gray-300">
                    <CheckSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New task modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Nova Tarefa</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required placeholder="Ex: Entrega DCTF Maio/2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                  <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value as Area }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
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
                  {saving ? 'Salvando…' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
