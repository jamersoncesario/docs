'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  FileText,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  CheckSquare,
  FolderKanban,
  Users,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then((r) => r.json())
      .then((d) => { if (d.unreadCount) setUnreadCount(d.unreadCount) })
      .catch(() => {})
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavLink({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: number }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          active
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    )
  }

  function Divider() {
    return <div className="my-2 border-t border-gray-700/60" />
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white">
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">P</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">PRIME CONECT</p>
            <p className="text-xs text-gray-400 mt-0.5">Escritório Inteligente</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/chat" icon={MessageSquare} label="Assistente IA" />

        <Divider />

        <NavLink href="/whatsapp" icon={MessageCircle} label="WhatsApp" badge={unreadCount} />

        <Divider />

        <NavLink href="/tasks" icon={CheckSquare} label="Tarefas" />
        <NavLink href="/projects" icon={FolderKanban} label="Projetos" />

        <Divider />

        <NavLink href="/clients" icon={Users} label="Clientes" />
        <NavLink href="/documents" icon={FileText} label="Documentos" />
        <NavLink href="/pops" icon={BookOpen} label="POPs" />
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
