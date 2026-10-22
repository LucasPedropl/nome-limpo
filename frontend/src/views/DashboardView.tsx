import React from 'react'
import {
  Users,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { DashboardMetrics, Processo } from '../types'

interface DashboardViewProps {
  metrics: DashboardMetrics | null
  processos: Processo[]
  onSelectProcesso: (p: Processo) => void
  onNavigateTab: (tab: any) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  processos,
  onSelectProcesso,
  onNavigateTab,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const kpis = [
    {
      title: 'Clientes Ativos',
      value: metrics ? metrics.clientesAtivos : '—',
      sub: `${metrics?.totalClientes || 0} cadastrados no sistema`,
      icon: <Users className="w-4 h-4 text-slate-500" />,
      tag: 'Adimplentes',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Processos em Tramitação',
      value: metrics ? metrics.processosEmAndamento : '—',
      sub: 'Ofícios protocolados nos birôs',
      icon: <FileText className="w-4 h-4 text-slate-500" />,
      tag: 'Garantia 45d',
      tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Receita Recorrente (MRR)',
      value: metrics ? formatCurrency(metrics.receitaMensalRecorrente) : '—',
      sub: 'Assinaturas ativas R$ 100/mês',
      icon: <DollarSign className="w-4 h-4 text-slate-500" />,
      tag: 'PIX Mensal',
      tagColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      title: 'Regularizações Concluídas',
      value: metrics ? metrics.processosConcluidos : '—',
      sub: `Taxa de êxito de ${metrics?.taxaSucessoPercentual || 98.4}%`,
      icon: <CheckCircle2 className="w-4 h-4 text-slate-500" />,
      tag: 'Baixa Total',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ]

  // Pipeline counts
  const emProcessamento = processos.filter((p) => p.status === 'EmProcessamento').length
  const notificacaoBiro = processos.filter((p) => p.status === 'NotificacaoBiro').length
  const emAnalise = processos.filter((p) => p.status === 'EmAnalise').length
  const concluidos = processos.filter((p) => p.status === 'Concluido').length

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

  return (
    <div className="space-y-6">
      {/* Informative Banner / Context Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operação de Regularização
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Garantia Legal de 30 a 45 dias úteis ativa
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Painel de Tramitações e Acompanhamento nos Birôs
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Monitoramento das notificações extrajudiciais de baixa e ocultação de apontamentos cadastrais (Serasa Experian, SPC Brasil e Boa Vista SCPC) com gestão de faturas de R$ 100,00/mês.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5">
          <div className="text-left md:text-right">
            <span className="text-[11px] font-medium text-slate-400 block">Mensalidade Padrão</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">R$ 100,00</span>
            <span className="text-[10px] text-slate-500 block">PIX Recorrente</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${kpi.tagColor}`}>
                {kpi.tag}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {kpi.value}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Esteira Operacional nos Birôs */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Esteira Operacional por Fase</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição dos processos nas etapas de atendimento</p>
          </div>
          <button
            onClick={() => onNavigateTab('processos')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <span>Ver listagem completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">1. Triagem & Inicial</span>
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                {emProcessamento}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Documentação recepcionada e minuta dos ofícios.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">2. Ofício aos Birôs</span>
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                {notificacaoBiro}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 leading-tight">Protocolado perante Serasa, SPC e Boa Vista.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">3. Auditoria de Baixa</span>
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200">
                {emAnalise}
              </span>
            </div>
            <p className="text-[11px] text-indigo-800/80 leading-tight">Aguardando decurso do prazo regulatório de resposta.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">4. Regularizado</span>
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
                {concluidos}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 leading-tight">Apontamentos baixados e sem restrição externa.</p>
          </div>
        </div>
      </div>

      {/* Tabela de Atenção aos Processos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Processos Recentes em Tramitação</h3>
            <p className="text-xs text-slate-500 mt-0.5">Acompanhamento dos prazos legais e garantia contratual</p>
          </div>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            {processos.length} registros ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Protocolo</th>
                <th className="py-3 px-4">Titular / Documento</th>
                <th className="py-3 px-4">Birôs Notificados</th>
                <th className="py-3 px-4">Fase Atual</th>
                <th className="py-3 px-4">Início</th>
                <th className="py-3 px-4">Prazo Previsto (45d)</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum processo cadastrado no momento.
                  </td>
                </tr>
              ) : (
                processos.slice(0, 5).map((proc) => {
                  const dataIni = new Date(proc.dataInicio).toLocaleDateString('pt-BR')
                  const dataPrev = new Date(proc.dataPrevistaConclusao).toLocaleDateString('pt-BR')

                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectProcesso(proc)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {proc.protocolo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {proc.cliente?.nomeRazaoSocial || 'Cliente Desconhecido'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {proc.cliente?.cpfCnpj}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {proc.birosNotificados}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(proc.status)}`}>
                          {getStatusLabel(proc.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{dataIni}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dataPrev}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectProcesso(proc)
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors"
                        >
                          Abrir
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
    </div>
  )
}
