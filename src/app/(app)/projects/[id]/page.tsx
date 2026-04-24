'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FolderKanban, Building2, Calendar, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: string
  due_date: string | null
}

interface Project {
  id: string
  title: string
  description: string | null
  area: string
  status: string
  due_date: string | null
  clients: { name: string } | null
}

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'review', label: 'Revisão' },
  { key: 'done', label: 'Concluído' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => setProject(d.project))
    fetch(`/api/tasks?projectId=${id}`).then((r) => r.json()).then((d) => setTasks(d.tasks ?? []))
  }, [id])

  async function handleDelete() {
    if (!confirm('Excluir este projeto?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  if (!project) return <div className="p-8 text-gray-400 text-sm">Carregando…</div>

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <Link href="/projects" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
            {project.clients && (
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{project.clients.name}</span>
            )}
            {project.due_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(project.due_date)}</span>
            )}
          </div>
        </div>
        <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-5 shrink-0">{project.description}</p>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="bg-gray-50 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{col.label}</h3>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{colTasks.length}</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.due_date && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(task.due_date)}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button key={c.key} onClick={() => moveTask(task.id, c.key)}
                          className="text-[10px] text-gray-400 hover:text-blue-600 underline transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-6 text-gray-300">
                    <FolderKanban className="w-5 h-5 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
