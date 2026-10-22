import React, { useState } from 'react'
import {
  ShieldCheck,
  X,
  Clock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import { Cliente, Processo } from '../types'

interface AreaClienteSimulacaoModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
  processos: Processo[]
}

export const AreaClienteSimulacaoModal: React.FC<AreaClienteSimulacaoModalProps> = ({
  isOpen,
  onClose,
  clientes,
  processos,
}) => {
  const [selectedClienteId, setSelectedClienteId] = useState<string>(
    clientes[0]?.id || ''
  )

  if (!isOpen) return null

  const cliente = clientes.find((c) => c.id === selectedClienteId) || clientes[0]
  const processo = processos.find((p) => p.clienteId === cliente?.id) || processos[0]

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar for Operator */}
        <div className="px-6 py-2.5 bg-slate-900 text-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-slate-200">
              Simulador de Visualização do Cliente Final (Área do Cliente)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Visualizar como:</span>
              <select
                value={cliente?.id}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeRazaoSocial} ({c.cpfCnpj})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mocked Client Portal UI */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/80 text-slate-900">
          {/* Header do Portal do Cliente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Nome Limpo Express
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Titular: <span className="text-slate-900 font-medium">{cliente?.nomeRazaoSocial}</span> • Documento:{' '}
                  <span className="font-mono text-slate-700 tabular-nums">{cliente?.cpfCnpj}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                Assinatura Ativa (R$ 100/mês)
              </span>
            </div>
          </div>

          {/* Card Principal de Status do Processo */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Protocolo de Regularização Extrajudicial
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block tabular-nums">
                  {processo?.protocolo || 'NL-2026-1048'}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">Status em Tempo Real</span>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {processo?.status === 'Concluido' ? 'Concluído — Restrições Baixadas' : 'Em Andamento nos Birôs'}
                </span>
              </div>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {[
                { title: 'Contratação & PIX', sub: 'Confirmado no sistema', done: true },
                {
                  title: 'Ofício aos Birôs',
                  sub: 'Serasa, SPC, Boa Vista',
                  done: true,
                },
                {
                  title: 'Auditoria de Baixa',
                  sub: 'Prazo 30–45 dias úteis',
                  done: processo?.status === 'NotificacaoBiro' || processo?.status === 'EmAnalise' || processo?.status === 'Concluido',
                  active: processo?.status === 'EmProcessamento',
                },
                {
                  title: 'Certidão Negativa',
                  sub: 'Dossiê de conclusão',
                  done: processo?.status === 'Concluido',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs ${
                    step.done
                      ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
                      : step.active
                      ? 'bg-amber-50/70 border-amber-200/70 text-amber-900'
                      : 'bg-slate-50 border-slate-200/70 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="font-semibold text-xs">{step.title}</span>
                  </div>
                  <span className="text-[11px] block text-slate-500">{step.sub}</span>
                </div>
              ))}
            </div>

            {/* Garantia Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-900 block">
                  Garantia Contratual Formal (100% de devolução em caso de não cumprimento)
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Conforme estipulado nas condições gerais de prestação de serviços, se os apontamentos negativos cadastrais não deixarem de ser exibidos perante os órgãos de proteção ao crédito no prazo estipulado de 30 a 45 dias úteis, o cliente tem direito à devolução integral dos valores pagos.
                </p>
              </div>
            </div>
          </div>

          {/* Próxima Renovação & Faturas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Manutenção Mensal
                </span>
                <CreditCard className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">R$ 100,00</span>
                <span className="text-xs text-slate-500">/mês via PIX</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                A mensalidade garante o monitoramento 24/7 de novas restrições e preservação da não exibição de apontamentos em consultas externas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Suporte & Atendimento
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Canal direto com o departamento jurídico e operacional para esclarecimento de dúvidas e emissão de certidões.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="https://wa.me/5531993585185"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <span>Chamar Suporte no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
