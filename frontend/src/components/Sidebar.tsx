import React from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Mail,
  ShieldCheck,
  Sparkles,
  Server,
} from 'lucide-react'

export type TabType = 'dashboard' | 'processos' | 'clientes' | 'financeiro' | 'comunicacoes'

interface SidebarProps {
  currentTab: TabType
  onSelectTab: (tab: TabType) => void
  totalProcessosPendentes?: number
  apiOnline?: boolean
  isMockMode: boolean
  onToggleMockMode: (val: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  totalProcessosPendentes = 0,
  apiOnline = true,
  isMockMode,
  onToggleMockMode,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4 stroke-[2]" />,
    },
    {
      id: 'processos',
      label: 'Processos & Birôs',
      icon: <FileText className="w-4 h-4 stroke-[2]" />,
      badge: totalProcessosPendentes > 0 ? totalProcessosPendentes : undefined,
    },
    {
      id: 'clientes',
      label: 'Base de Clientes',
      icon: <Users className="w-4 h-4 stroke-[2]" />,
    },
    {
      id: 'financeiro',
      label: 'Financeiro & PIX',
      icon: <CreditCard className="w-4 h-4 stroke-[2]" />,
    },
    {
      id: 'comunicacoes',
      label: 'Régua de E-mails',
      icon: <Mail className="w-4 h-4 stroke-[2]" />,
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-20 shadow-xs">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight truncate">Nome Limpo</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Ops
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">Backoffice Jurídico & Operacional</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Módulos Operacionais
          </div>
          {menuItems.map((item) => {
            const active = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={active ? 'text-emerald-700' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold tabular-nums bg-amber-50 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200/80 space-y-3 bg-slate-50/60">
        {/* Validation / Mock Mode Indicator */}
        <div className="rounded-xl bg-white border border-slate-200 p-2.5 text-xs shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modo Validação</span>
            </div>
            <button
              onClick={() => onToggleMockMode(!isMockMode)}
              className="text-[10px] text-emerald-700 hover:underline font-bold"
              title="Alternar entre dados mockados de validação e API .NET 8"
            >
              {isMockMode ? 'Usar API' : 'Usar Mock'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            {isMockMode
              ? 'Ambiente autônomo com dados realistas pré-carregados para testes.'
              : 'Conectado diretamente à API .NET 8 (localhost:5240).'}
          </p>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0">
            OP
          </div>
          <div className="text-xs min-w-0 flex-1">
            <p className="font-semibold text-slate-800 truncate text-[11px]">Operador Geral</p>
            <p className="text-slate-500 text-[10px] truncate">admin@nomelimpo.com.br</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
