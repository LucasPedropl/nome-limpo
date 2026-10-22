import React, { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import { Cobranca, Assinatura } from '../types'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

interface FinanceiroViewProps {
  cobrancas: Cobranca[]
  assinaturas: Assinatura[]
  onReload: () => void
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  cobrancas,
  onReload,
}) => {
  const { showToast } = useToast()
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const [loadingPayId, setLoadingPayId] = useState<string | null>(null)

  const handleConfirmarPagamento = async (cobrancaId: string) => {
    try {
      setLoadingPayId(cobrancaId)
      await api.confirmarPagamentoCobranca(cobrancaId)
      showToast('Pagamento Confirmado', 'Mensalidade liquidada via PIX e assinatura mantida ativa.', 'success')
      onReload()
    } catch (err: any) {
      showToast('Erro ao Confirmar', err.message || 'Falha ao confirmar pagamento.', 'error')
    } finally {
      setLoadingPayId(null)
    }
  }

  const filteredCobrancas = cobrancas.filter((c) => {
    if (filterStatus === 'Todos') return true
    return c.status === filterStatus
  })

  const totalArrecadado = cobrancas
    .filter((c) => c.status === 'Pago')
    .reduce((acc, curr) => acc + curr.valor, 0)

  const totalPendente = cobrancas
    .filter((c) => c.status === 'Pendente' || c.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.valor, 0)

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mensalidade Recorrente
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
            R$ 100,00
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cobrança mensal via PIX dinâmico por contrato ativo
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Liquidado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalArrecadado)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compensações de mensalidade efetivadas no sistema
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              A Receber / Em Aberto
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800 tabular-nums tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Faturas aguardando liquidação ou confirmação bancária
          </p>
        </div>
      </div>

      {/* Régua de Inadimplência e PagWeb Info Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Política de Cobrança e Inadimplência Integrada (Diretriz PagWeb)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>D-3 a D0 • Preventivo</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Disparo preventivo da chave PIX via WhatsApp e E-mail transacional.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>D+1 a D+5 • Tolerância</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Lembrete cordial. Monitoramento cadastral nos birôs segue ativo.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-semibold text-orange-800">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>D+7 • Suspensão</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Bloqueio preventivo de novos ofícios perante os birôs de crédito.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-semibold text-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>D+30 • Cancelamento</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Cancelamento da prestação continuada com preservação do dossiê.
            </p>
          </div>
        </div>
      </div>

      {/* Cobranças / Faturas Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Lançamentos & Cobranças PIX (R$ 100,00)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Conciliação direta de mensalidades e status bancário
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/60 text-xs">
            {['Todos', 'Pago', 'Pendente', 'Atrasado'].map((st) => {
              const active = filterStatus === st
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Referência</th>
                <th className="py-3 px-5">Cliente / Documento</th>
                <th className="py-3 px-5">Valor</th>
                <th className="py-3 px-5">TxID PIX</th>
                <th className="py-3 px-5">Vencimento</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Ação / Conciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCobrancas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma cobrança encontrada para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredCobrancas.map((cob) => {
                  const statusChip =
                    cob.status === 'Pago'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                      : cob.status === 'Atrasado'
                      ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                      : 'bg-amber-50 text-amber-800 border-amber-200/60'

                  return (
                    <tr key={cob.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-700 font-medium tabular-nums">
                        {cob.referenciaMes}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-900 block">
                          {cob.assinatura?.cliente?.nomeRazaoSocial || 'Cliente Contratante'}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {cob.assinatura?.cliente?.cpfCnpj}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 tabular-nums">
                        R$ {cob.valor.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                        {cob.txId ? (
                          <span title={cob.txId}>
                            {cob.txId.length > 16 ? `${cob.txId.slice(0, 16)}...` : cob.txId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 tabular-nums">
                        {new Date(cob.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusChip}`}>
                          {cob.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {cob.status !== 'Pago' ? (
                          <button
                            onClick={() => handleConfirmarPagamento(cob.id)}
                            disabled={loadingPayId === cob.id}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50"
                          >
                            {loadingPayId === cob.id ? 'Baixando...' : 'Confirmar PIX'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Liquidado</span>
                          </span>
                        )}
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
