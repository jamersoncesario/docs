import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare, FileText, BookOpen, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: docsCount }, { count: popsCount }, { count: msgsCount }] =
    await Promise.all([
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('pops').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ])

  const cards = [
    {
      href: '/chat',
      icon: MessageSquare,
      title: 'Assistente IA',
      description: 'Converse com a IA sobre questões contábeis e fiscais',
      stat: msgsCount ?? 0,
      statLabel: 'mensagens',
      color: 'bg-blue-500',
    },
    {
      href: '/pops',
      icon: BookOpen,
      title: 'POPs',
      description: 'Gerencie os Procedimentos Operacionais Padrão',
      stat: popsCount ?? 0,
      statLabel: 'procedimentos',
      color: 'bg-emerald-500',
    },
    {
      href: '/documents',
      icon: FileText,
      title: 'Documentos',
      description: 'Analise NF-e, extratos bancários e contratos com IA',
      stat: docsCount ?? 0,
      statLabel: 'documentos',
      color: 'bg-violet-500',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Bem-vindo, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Assistente inteligente para o seu escritório de contabilidade
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <h2 className="font-semibold text-gray-900 mb-1">{card.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{card.description}</p>
              <p className="text-2xl font-bold text-gray-900">
                {card.stat}{' '}
                <span className="text-sm font-normal text-gray-500">{card.statLabel}</span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
