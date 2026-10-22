import React, { useState } from 'react'
import { Plus, RefreshCw, Eye, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react'
import { useToast } from './Toast'
import { api } from '../services/api'

interface HeaderProps {
  title: string
  subtitle: string
  onRefresh: () => void
  onOpenNovoCliente: () => void
  onOpenAreaClienteSimulacao: () => void
  loading?: boolean
  isMockMode: boolean
  onToggleMockMode: (val: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  onOpenNovoCliente,
  onOpenAreaClienteSimulacao,
  loading = false,
  isMockMode,
  onToggleMockMode,
}) => {
  const { showToast } = useToast()
  const [resetting, setResetting] = useState(false)

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de exemplo da demonstração? Suas alterações locais serão resetadas.')) {
      setResetting(true)
      api.resetMockData()
      setTimeout(() => {
        onRefresh()
        setResetting(false)
        showToast('Demonstração Restaurada', 'Os dados de exemplo foram restaurados com sucesso.', 'success')
      }, 200)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
          {isMockMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Validação Mock</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 hidden sm:block mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Botão de Resetar Dados da Demonstração */}
        {isMockMode && (
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-xs disabled:opacity-50"
            title="Restaurar base de clientes e processos originais da demonstração"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
            <span>Restaurar Mock</span>
          </button>
        )}

        {/* Simulação da Área do Cliente */}
        <button
          onClick={onOpenAreaClienteSimulacao}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs"
          title="Ver como o cliente final visualiza seu processo na Área do Cliente"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Visão Área do Cliente</span>
          <span className="sm:hidden">Portal</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs disabled:opacity-50"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Novo Cliente / Nova Contratação */}
        <button
          onClick={onOpenNovoCliente}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Contratação</span>
        </button>
      </div>
    </header>
  )
}
