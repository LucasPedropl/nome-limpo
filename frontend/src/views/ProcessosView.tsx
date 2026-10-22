import React, { useState } from 'react'
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  X,
  User,
  Building,
  ChevronRight,
} from 'lucide-react'
import { Processo } from '../types'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

interface ProcessosViewProps {
  processos: Processo[]
  selectedProcesso: Processo | null
  onSelectProcesso: (p: Processo | null) => void
  onReload: () => void
}

export const ProcessosView: React.FC<ProcessosViewProps> = ({
  processos,
  selectedProcesso,
  onSelectProcesso,
  onReload,
}) => {
  const { showToast } = useToast()
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)

  // Form states for update
  const [novoStatus, setNovoStatus] = useState('')
  const [tituloHist, setTituloHist] = useState('')
  const [descHist, setDescHist] = useState('')
  const [novaNota, setNovaNota] = useState('')

  const statusList = [
    { id: 'Todos', label: 'Todos' },
    { id: 'EmProcessamento', label: 'Em Processamento' },
    { id: 'NotificacaoBiro', label: 'Ofício aos Birôs' },
    { id: 'EmAnalise', label: 'Em Análise' },
    { id: 'Concluido', label: 'Concluídos' },
    { id: 'Cancelado', label: 'Cancelados' },
  ]

  const filtered = processos.filter((p) => {
    const matchStatus = filterStatus === 'Todos' || p.status === filterStatus
    const term = searchTerm.toLowerCase().trim()
    const matchSearch =
      !term ||
      p.protocolo.toLowerCase().includes(term) ||
      (p.cliente?.nomeRazaoSocial || '').toLowerCase().includes(term) ||
      (p.cliente?.cpfCnpj || '').includes(term)

    return matchStatus && matchSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluido':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'NotificacaoBiro':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'EmAnalise':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200'
      case 'Cancelado':
        return 'bg-rose-50 text-rose-800 border-rose-200'
      default:
        return 'bg-sky-50 text-sky-800 border-sky-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Concluido':
        return 'Concluído'
      case 'NotificacaoBiro':
        return 'Ofícios aos Birôs'
      case 'EmAnalise':
        return 'Em Análise'
      case 'Cancelado':
        return 'Cancelado'
      default:
        return 'Em Processamento'
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProcesso || !novoStatus) return

    try {
      setLoadingAction(true)
      const updated = await api.atualizarStatusProcesso(selectedProcesso.id, {
        novoStatus,
        titulo: tituloHist || `Transição para ${getStatusLabel(novoStatus)}`,
        descricao: descHist || 'Atualização operacional de rotina.',
        autor: 'Operador Backoffice',
      })
      onSelectProcesso(updated)
      onReload()
      setNovoStatus('')
      setTituloHist('')
      setDescHist('')
      showToast('Status Atualizado', `Processo alterado para "${getStatusLabel(novoStatus)}".`, 'success')
    } catch (err: any) {
      showToast('Erro ao Atualizar', err.message || 'Falha ao atualizar status.', 'error')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProcesso || !novaNota.trim()) return

    try {
      setLoadingAction(true)
      const updated = await api.adicionarNotaProcesso(selectedProcesso.id, novaNota)
      onSelectProcesso(updated)
      setNovaNota('')
      onReload()
      showToast('Nota Registrada', 'Observação jurídica anexada ao processo com sucesso.', 'success')
    } catch (err: any) {
      showToast('Erro ao Anotar', err.message || 'Falha ao registrar nota.', 'error')
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusList.map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por protocolo, titular ou CPF/CNPJ..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Protocolo</th>
                <th className="py-3.5 px-4">Titular do Processo</th>
                <th className="py-3.5 px-4">Birôs Notificados</th>
                <th className="py-3.5 px-4">Fase Atual</th>
                <th className="py-3.5 px-4">Data Início</th>
                <th className="py-3.5 px-4">Prazo da Garantia (45d)</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum processo localizado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filtered.map((proc) => {
                  const dataIni = new Date(proc.dataInicio).toLocaleDateString('pt-BR')
                  const dataPrev = new Date(proc.dataPrevistaConclusao).toLocaleDateString('pt-BR')

                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectProcesso(proc)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {proc.protocolo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {proc.cliente?.tipoPessoa === 'PJ' ? (
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">
                              {proc.cliente?.nomeRazaoSocial || 'Cliente Desconhecido'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {proc.cliente?.cpfCnpj}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {proc.birosNotificados}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(proc.status)}`}>
                          {getStatusLabel(proc.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{dataIni}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dataPrev}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectProcesso(proc)
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gestão Operacional do Processo */}
      {selectedProcesso && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {selectedProcesso.protocolo}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedProcesso.status)}`}>
                      {getStatusLabel(selectedProcesso.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Titular: <strong className="text-slate-800 font-semibold">{selectedProcesso.cliente?.nomeRazaoSocial}</strong> • {selectedProcesso.cliente?.cpfCnpj}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectProcesso(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Metadados do Caso */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 font-medium block">Birôs Notificados</span>
                  <span className="text-xs font-semibold text-slate-900 mt-1 block">
                    {selectedProcesso.birosNotificados}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 font-medium block">Data de Contratação</span>
                  <span className="text-xs font-semibold text-slate-900 mt-1 block font-mono">
                    {new Date(selectedProcesso.dataInicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 font-medium block">Prazo Final da Garantia</span>
                  <span className="text-xs font-semibold text-emerald-800 mt-1 block font-mono">
                    {new Date(selectedProcesso.dataPrevistaConclusao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Formulário de Alteração de Fase */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Avançar Fase ou Atualizar Status da Tramitação</span>
                </h4>
                <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Nova Fase</label>
                    <select
                      value={novoStatus}
                      onChange={(e) => setNovoStatus(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
                    >
                      <option value="">Selecione...</option>
                      <option value="EmProcessamento">Em Processamento (Triagem)</option>
                      <option value="NotificacaoBiro">Notificado aos Birôs (Ofícios)</option>
                      <option value="EmAnalise">Em Análise (Aguardando Resposta)</option>
                      <option value="Concluido">Concluído (Baixa Efetuada)</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Título do Evento</label>
                    <input
                      type="text"
                      value={tituloHist}
                      onChange={(e) => setTituloHist(e.target.value)}
                      placeholder="Ex: Resposta acatada pela Boa Vista"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loadingAction || !novoStatus}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {loadingAction ? 'Gravando...' : 'Salvar Alteração'}
                    </button>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Despacho / Detalhes</label>
                    <input
                      type="text"
                      value={descHist}
                      onChange={(e) => setDescHist(e.target.value)}
                      placeholder="Descreva a providência tomada perante os órgãos de crédito..."
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </form>
              </div>

              {/* Linha do Tempo de Histórico */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Histórico Cronológico de Despachos e Notificações</span>
                </h4>
                <div className="space-y-2.5 pl-4 border-l-2 border-slate-200">
                  {selectedProcesso.historico && selectedProcesso.historico.length > 0 ? (
                    selectedProcesso.historico.map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white" />
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{h.titulo}</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {new Date(h.data).toLocaleString('pt-BR')} • {h.autor}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{h.descricao}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs">Nenhum evento registrado.</p>
                  )}
                </div>
              </div>

              {/* Anotações Operacionais Internas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Anotações Internas da Equipe</span>
                </h4>
                {selectedProcesso.observacoes && (
                  <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedProcesso.observacoes}
                  </pre>
                )}
                <form onSubmit={handleAddNota} className="flex gap-2">
                  <input
                    type="text"
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    placeholder="Adicionar nota jurídica ou operacional interna..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loadingAction || !novaNota.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  >
                    Salvar Nota
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
