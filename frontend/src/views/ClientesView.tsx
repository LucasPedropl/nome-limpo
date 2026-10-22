import React, { useState } from 'react'
import {
  Users,
  Search,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  X,
  Plus,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Cliente } from '../types'
import { api } from '../services/api'

interface ClientesViewProps {
  clientes: Cliente[]
  onOpenNovoCliente: () => void
  onSelectProcessoFromCliente?: (processoId: string) => void
  onReload: () => void
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clientes,
  onOpenNovoCliente,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [, setLoadingDetails] = useState(false)

  const filtered = clientes.filter((c) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    return (
      c.nomeRazaoSocial.toLowerCase().includes(term) ||
      c.cpfCnpj.includes(term) ||
      c.email.toLowerCase().includes(term)
    )
  })

  const handleOpenCliente = async (cliente: Cliente) => {
    try {
      setLoadingDetails(true)
      const full = await api.getClienteById(cliente.id)
      setSelectedCliente(full)
    } catch {
      setSelectedCliente(cliente)
    } finally {
      setLoadingDetails(false)
    }
  }

  const pfCount = clientes.filter((c) => c.tipoPessoa === 'PF').length
  const pjCount = clientes.filter((c) => c.tipoPessoa === 'PJ').length

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, documento ou e-mail..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all shadow-xs"
            />
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] tabular-nums">
              {pfCount} PF
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] tabular-nums">
              {pjCount} PJ
            </span>
          </div>
        </div>

        <button
          onClick={onOpenNovoCliente}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Clientes Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Diretório de Contratantes ({filtered.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Cadastros com assinatura recorrente e processos ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Tipo</th>
                <th className="py-3 px-5">Nome / Razão Social</th>
                <th className="py-3 px-5">CPF / CNPJ</th>
                <th className="py-3 px-5">Contato</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Data de Entrada</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum cliente encontrado com os critérios de busca atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((cli) => {
                  const isPF = cli.tipoPessoa === 'PF'
                  const statusChip =
                    cli.status === 'Ativo'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                      : cli.status === 'Inadimplente'
                      ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                      : 'bg-slate-100 text-slate-700 border-slate-200/60'

                  return (
                    <tr
                      key={cli.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => handleOpenCliente(cli)}
                    >
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            isPF
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                          }`}
                        >
                          {isPF ? (
                            <User className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Building className="w-3 h-3 text-indigo-600" />
                          )}
                          <span>{cli.tipoPessoa}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {cli.nomeRazaoSocial}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600 tabular-nums">
                        {cli.cpfCnpj}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="text-slate-900">{cli.email}</div>
                        <div className="text-slate-500 font-mono text-[11px] tabular-nums">
                          {cli.telefone}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusChip}`}>
                          {cli.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 tabular-nums">
                        {new Date(cli.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCliente(cli)
                          }}
                          className="px-3 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
                        >
                          Visão 360°
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

      {/* Modal Visão 360 do Cliente */}
      {selectedCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-900">
                    {selectedCliente.nomeRazaoSocial}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedCliente.tipoPessoa} • {selectedCliente.cpfCnpj} • ID: {selectedCliente.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Contatos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>E-mail</span>
                  </div>
                  <span className="font-medium text-slate-900 block truncate">
                    {selectedCliente.email}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Telefone / WhatsApp</span>
                  </div>
                  <span className="font-medium text-slate-900 block font-mono tabular-nums">
                    {selectedCliente.telefone}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Nascimento / Fundação</span>
                  </div>
                  <span className="font-medium text-slate-900 block tabular-nums">
                    {selectedCliente.dataNascimentoFundacao || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Processos Vinculados */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Processos de Regularização ({selectedCliente.processos?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {selectedCliente.processos && selectedCliente.processos.length > 0 ? (
                    selectedCliente.processos.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-semibold text-emerald-700 text-xs">
                            {p.protocolo}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Birôs: {p.birosNotificados}
                          </p>
                        </div>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {p.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-slate-500 text-xs">
                      Nenhum processo gerado para este cliente até o momento.
                    </div>
                  )}
                </div>
              </div>

              {/* Assinaturas & Cobranças */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span>Assinatura Mensal (R$ 100,00/mês via PIX)</span>
                </h4>

                <div className="space-y-2">
                  {selectedCliente.assinaturas && selectedCliente.assinaturas.length > 0 ? (
                    selectedCliente.assinaturas.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-slate-900 text-xs">
                            Plano Regularização & Manutenção Cadastral
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                            Próximo vencimento: {new Date(a.proximoVencimento).toLocaleDateString('pt-BR')} (Dia {a.diaVencimento})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 tabular-nums block">
                            R$ {a.valorMensal.toFixed(2)}/mês
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 mt-1 inline-block">
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-slate-500 text-xs">
                      Sem assinatura recorrente ativa registrada.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50/60 flex justify-end">
              <button
                onClick={() => setSelectedCliente(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

