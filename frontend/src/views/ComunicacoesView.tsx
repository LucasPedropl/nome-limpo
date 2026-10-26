import React, { useState } from 'react'
import {
  Mail,
  Send,
  Smartphone,
  CheckCircle2,
  X,
  MessageSquare,
} from 'lucide-react'
import { LogComunicacao, Cliente } from '../types'
import { api } from '../services/api'
import { useToast } from '../components/Toast'
import { WhatsAppPanel } from './WhatsAppPanel'

interface ComunicacoesViewProps {
  logs: LogComunicacao[]
  clientes: Cliente[]
  onReload: () => void
}

export const ComunicacoesView: React.FC<ComunicacoesViewProps> = ({
  logs,
  clientes,
  onReload,
}) => {
  const { showToast } = useToast()
  const [filterCanal, setFilterCanal] = useState<string>('Todos')

  // Disparo manual form modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState('')
  const [tipoMsg, setTipoMsg] = useState('AvisoVencimento')
  const [canalMsg, setCanalMsg] = useState<'Email' | 'WhatsApp'>('Email')
  const [assuntoMsg, setAssuntoMsg] = useState('')
  const [conteudoMsg, setConteudoMsg] = useState('')
  const [sending, setSending] = useState(false)

  const tiposRegua = [
    { id: 'ConfirmacaoCadastro', label: '1. Confirmação Cadastro' },
    { id: 'TokenValidacao', label: '2. Validação OTP' },
    { id: 'CobrancaPix', label: '3. Emissão PIX' },
    { id: 'ConfirmacaoPagamento', label: '4. Confirmação Pagto' },
    { id: 'AtivacaoServico', label: '5. Ativação Serviço' },
    { id: 'AvisoVencimento', label: '6. Vencimento (D-3)' },
    { id: 'ConfirmacaoRenovacao', label: '7. Renovação' },
    { id: 'ConclusaoProcesso', label: '8. Conclusão Baixa' },
  ]

  const filteredLogs = logs.filter((log) => {
    if (filterCanal === 'Todos') return true
    return log.canal === filterCanal
  })

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClienteId || !assuntoMsg || !conteudoMsg) return

    try {
      setSending(true)
      await api.dispararComunicacao({
        clienteId: selectedClienteId,
        tipo: tipoMsg,
        canal: canalMsg,
        assunto: assuntoMsg,
        mensagem: conteudoMsg,
      })
      showToast('Notificação Disparada', `Mensagem de "${tipoMsg}" enviada via ${canalMsg}.`, 'success')
      onReload()
      setShowModal(false)
      setAssuntoMsg('')
      setConteudoMsg('')
    } catch (err: any) {
      showToast('Erro no Disparo', err.message || 'Falha ao disparar comunicação.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Disparo Button */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Motor de Mensageria & Régua Transacional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notificações transacionais automáticas via E-mail e WhatsApp em conformidade com o escopo
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Disparar Notificação Manual</span>
        </button>
      </div>

      <WhatsAppPanel onChanged={onReload} />

      {/* Regua Specs Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {tiposRegua.map((t) => {
          const count = logs.filter((l) => l.tipo === t.id).length
          return (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                {t.label}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {count}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">envios</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter and Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Histórico de Disparos ({filteredLogs.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Filtrar canal:</span>
            <select
              value={filterCanal}
              onChange={(e) => setFilterCanal(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            >
              <option value="Todos">Todos os Canais</option>
              <option value="Email">E-mail</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Canal</th>
                <th className="py-3 px-5">Tipo da Régua</th>
                <th className="py-3 px-5">Destinatário</th>
                <th className="py-3 px-5">Assunto / Prévia</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum disparo registrado no histórico.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isWhatsApp = log.canal === 'WhatsApp'
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            isWhatsApp
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                              : 'bg-sky-50 text-sky-800 border-sky-200/60'
                          }`}
                        >
                          {isWhatsApp ? (
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Mail className="w-3 h-3 text-sky-600" />
                          )}
                          <span>{log.canal}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        {log.tipo}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600 tabular-nums">
                        {log.destinatario}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900">{log.assunto}</div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">
                          {log.conteudo}
                        </p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-500 tabular-nums text-[11px]">
                        {new Date(log.dataEnvio).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Disparo Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-700" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Disparar Mensagem Transacional
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendManual} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium mb-1 block">
                  Cliente Destinatário
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900 shadow-xs"
                >
                  <option value="">Selecione o cliente destinatário...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomeRazaoSocial} ({c.cpfCnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium mb-1 block">
                    Gatilho da Régua
                  </label>
                  <select
                    value={tipoMsg}
                    onChange={(e) => setTipoMsg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900 shadow-xs"
                  >
                    {tiposRegua.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium mb-1 block">
                    Canal de Envio
                  </label>
                  <select
                    value={canalMsg}
                    onChange={(e) => setCanalMsg(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900 shadow-xs"
                  >
                    <option value="Email">E-mail Transacional</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium mb-1 block">
                  Assunto da Mensagem
                </label>
                <input
                  type="text"
                  value={assuntoMsg}
                  onChange={(e) => setAssuntoMsg(e.target.value)}
                  placeholder="Ex: Atualização sobre seu processo de nome limpo"
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900 shadow-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium mb-1 block">
                  Corpo do Texto / Mensagem
                </label>
                <textarea
                  rows={4}
                  value={conteudoMsg}
                  onChange={(e) => setConteudoMsg(e.target.value)}
                  placeholder="Digite o texto da notificação..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900 shadow-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {sending ? 'Disparando...' : 'Enviar Notificação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
