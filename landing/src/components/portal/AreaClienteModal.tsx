import { useState, useEffect, type FormEvent } from 'react'
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  LogOut,
  UserCheck,
  LayoutDashboard,
  KeyRound,
  Mail,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { pagwebService, type ClientSession } from '@/services/pagwebService'

interface AreaClienteModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProcessoConsulta {
  protocolo: string
  nomeCliente: string
  cpfCnpj: string
  status: string
  birosNotificados: string
  dataInicio: string
  dataPrevistaConclusao: string
  dataConclusao?: string
  garantiaValida: boolean
  historico: Array<{
    titulo: string
    descricao: string
    data: string
    autor: string
  }>
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'

export function AreaClienteModal({ isOpen, onClose }: AreaClienteModalProps) {
  const [termo, setTermo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [etapa, setEtapa] = useState<'identificar' | 'codigo'>('identificar')
  const [aviso, setAviso] = useState('')
  const [simulatedCode, setSimulatedCode] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<ProcessoConsulta | null>(null)
  const [session, setSession] = useState<ClientSession | null>(null)

  // Ao abrir o modal, verifica se já existe sessão ativa do cliente
  useEffect(() => {
    if (!isOpen) return

    const currentSession = pagwebService.getSession()
    setSession(currentSession)

    if (currentSession) {
      carregarMeuProcesso(currentSession.token)
    }
  }, [isOpen])

  const carregarMeuProcesso = async (token: string) => {
    setLoading(true)
    setErro('')
    try {
      const response = await fetch(`${API_URL}/api/public/checkout/meu-processo`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        pagwebService.clearSession()
        setSession(null)
        setEtapa('identificar')
        setErro('Sua sessão expirou. Entre novamente com o código enviado ao seu e-mail ou WhatsApp.')
        return
      }

      if (!response.ok) {
        throw new Error('Nenhum processo localizado para a sua assinatura ainda. Fale com a gente pelo WhatsApp.')
      }

      const data = await response.json()
      setResultado(data)
    } catch (err: any) {
      // Em desenvolvimento, com sessão ativa, gera fallback com os dados da sessão
      const currentSession = pagwebService.getSession()
      if (currentSession && import.meta.env.DEV) {
        setResultado({
          protocolo: currentSession.protocolo,
          nomeCliente: currentSession.cliente.nomeRazaoSocial,
          cpfCnpj: currentSession.cliente.cpfCnpj,
          status: 'EmProcessamento',
          birosNotificados: 'Serasa Experian, SPC Brasil, Boa Vista SCPC',
          dataInicio: new Date().toLocaleDateString('pt-BR'),
          dataPrevistaConclusao: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          garantiaValida: true,
          historico: [
            {
              titulo: '1ª Mensalidade Liquidada & Ofícios Expedidos',
              descricao: 'Pagamento da 1ª mensalidade de R$ 100,00 identificado. Pedidos de exclusão de restrições encaminhados.',
              data: new Date().toLocaleString('pt-BR'),
              autor: 'Sistema Nome Limpo Express',
            },
          ],
        })
      } else {
        setErro(
          err instanceof TypeError
            ? 'Não foi possível consultar seu processo agora. Tente novamente em alguns minutos.'
            : err.message || 'Erro ao consultar processo.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitarCodigo = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!termo.trim()) return
    setLoading(true)
    setErro('')
    try {
      const res = await pagwebService.solicitarCodigoLogin(termo.trim())
      setAviso(res.message)
      setSimulatedCode(res.simulatedCode)
      setCodigo('')
      setEtapa('codigo')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o código agora.')
    } finally {
      setLoading(false)
    }
  }

  const handleEntrar = async (e: FormEvent) => {
    e.preventDefault()
    if (codigo.length !== 6) return
    setLoading(true)
    setErro('')
    try {
      const novaSessao = await pagwebService.loginCliente(termo.trim(), codigo)
      setSession(novaSessao)
      setEtapa('identificar')
      setCodigo('')
      setSimulatedCode(undefined)
      await carregarMeuProcesso(novaSessao.token)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    pagwebService.clearSession()
    setSession(null)
    setResultado(null)
    setTermo('')
    setCodigo('')
    setEtapa('identificar')
    setErro('')
  }

  const handleReset = () => {
    if (session) {
      handleLogout()
    } else {
      setResultado(null)
      setTermo('')
      setErro('')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Área do Assinante — Sessão Ativa' : 'Área do Cliente — Consulta em Tempo Real'}
      description={
        session
          ? `Bem-vindo(a), ${session.cliente.nomeRazaoSocial.split(' ')[0]}! Acompanhe seus ofícios e status nos birôs.`
          : 'Acompanhe o andamento da sua regularização e a baixa dos apontamentos nos birôs'
      }
      maxWidth="lg"
    >
      {/* Banner de Sessão Ativa se estiver logado */}
      {session && (
        <div className="mb-4 p-3.5 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/20 text-brand-light">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <span className="font-bold text-cream block">
                {session.cliente.nomeRazaoSocial}
              </span>
              <span className="text-cream-dim text-[11px] font-mono">
                CPF/CNPJ: {session.cliente.cpfCnpj} • Protocolo: {session.protocolo}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-cream-dim hover:text-red-400 hover:border-red-500/40 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      )}

      {!resultado ? (
        session ? (
          <div className="space-y-4">
            {erro ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{erro}</span>
              </div>
            ) : (
              <p className="p-4 rounded-xl bg-ink-raised border border-line text-xs text-cream-dim text-center">
                {loading ? 'Carregando seu processo...' : 'Nenhum processo carregado.'}
              </p>
            )}
          </div>
        ) : etapa === 'identificar' ? (
          <form onSubmit={handleSolicitarCodigo} className="space-y-4">
            <div className="p-4 rounded-xl bg-ink-raised border border-line space-y-2">
              <span className="text-xs font-semibold text-cream block">
                Informe seu CPF/CNPJ, e-mail ou o Protocolo de Atendimento
              </span>
              <p className="text-xs text-cream-dim">
                Vamos enviar um código de 6 dígitos para o e-mail (e o WhatsApp, se disponível) cadastrado na assinatura. Use o CPF/CNPJ (ex: 128.459.736-22) ou o protocolo gerado na adesão (ex: NL-2026-1048).
              </p>
            </div>

            {erro && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{erro}</span>
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-cream-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Digite seu CPF, CNPJ, e-mail ou Protocolo (ex: NL-2026-XXXX)..."
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-ink border border-line text-cream placeholder-cream-dim/60 focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !termo.trim()}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-brand hover:bg-brand-light text-ink flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition disabled:opacity-50"
            >
              {loading ? 'Enviando código...' : 'Receber Código no E-mail'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEntrar} className="space-y-4">
            <div className="p-4 rounded-xl bg-ink-raised border border-line space-y-2">
              <span className="text-xs font-semibold text-cream flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand" />
                Código de acesso
              </span>
              <p className="text-xs text-cream-dim">{aviso}</p>
            </div>

            {simulatedCode && (
              <div className="p-3 rounded-xl bg-brand/10 border border-brand/40 flex items-center justify-between text-xs">
                <span className="text-brand-light font-mono">Código de teste recebido:</span>
                <button
                  type="button"
                  onClick={() => setCodigo(simulatedCode)}
                  className="rounded-lg bg-brand px-2.5 py-1 font-mono font-black text-ink hover:bg-brand-light transition"
                >
                  Preencher {simulatedCode}
                </button>
              </div>
            )}

            {erro && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{erro}</span>
              </div>
            )}

            <div className="relative">
              <KeyRound className="w-4 h-4 text-cream-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setErro('')
                }}
                placeholder="000000"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono tracking-[0.35em] bg-ink border border-line text-cream placeholder-cream-dim/60 focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading || codigo.length !== 6}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-brand hover:bg-brand-light text-ink flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar na Área do Cliente'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setEtapa('identificar')
                  setErro('')
                }}
                className="text-cream-dim hover:text-cream transition"
              >
                ← Corrigir dados
              </button>
              <button
                type="button"
                onClick={() => handleSolicitarCodigo()}
                disabled={loading}
                className="font-mono text-brand-light hover:underline disabled:opacity-50"
              >
                Reenviar código
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Header do Processo */}
          <div className="p-5 rounded-2xl bg-ink-raised border border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider block">
                  Protocolo Oficial
                </span>
                <span className="text-xl font-black font-mono text-cream mt-0.5 block">
                  {resultado.protocolo}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/30">
                {resultado.status === 'Concluido' ? 'Concluído nos Birôs' : 'Em Processamento'}
              </span>
            </div>

            <div className="pt-2 border-t border-line/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-cream-dim block">Titular</span>
                <span className="font-semibold text-cream">{resultado.nomeCliente}</span>
              </div>
              <div>
                <span className="text-cream-dim block">Documento</span>
                <span className="font-mono text-cream">{resultado.cpfCnpj}</span>
              </div>
            </div>
          </div>

          {/* Stepper Visual dos Birôs */}
          <div className="p-4 rounded-2xl bg-ink border border-line space-y-3">
            <span className="text-xs font-bold text-cream block">
              Birôs Notificados: <span className="text-brand font-normal">{resultado.birosNotificados}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-ink-raised border border-brand/30 text-brand">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Adesão & Ofícios</span>
                </div>
                <span className="text-[11px] text-cream-dim mt-1 block">Iniciado em {resultado.dataInicio}</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  resultado.status !== 'EmProcessamento'
                    ? 'bg-ink-raised border-brand/30 text-brand'
                    : 'bg-ink-raised border-accent/40 text-accent'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>2. Baixa nos Birôs</span>
                </div>
                <span className="text-[11px] text-cream-dim mt-1 block">Prazo até {resultado.dataPrevistaConclusao}</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  resultado.status === 'Concluido'
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-ink-raised border-line text-cream-dim'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Regularização</span>
                </div>
                <span className="text-[11px] text-cream-dim mt-1 block">
                  {resultado.dataConclusao ? `Concluído em ${resultado.dataConclusao}` : 'Em andamento'}
                </span>
              </div>
            </div>
          </div>

          {/* Histórico das Movimentações */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-cream block">Histórico de Tramitações</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {resultado.historico && resultado.historico.length > 0 ? (
                resultado.historico.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-ink-raised border border-line text-xs space-y-1">
                    <div className="flex items-center justify-between text-cream-dim">
                      <span className="font-bold text-cream">{h.titulo}</span>
                      <span className="font-mono text-[11px]">{h.data}</span>
                    </div>
                    <p className="text-cream-dim leading-relaxed">{h.descricao}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-cream-dim">Processo em fase inicial de protocolo.</p>
              )}
            </div>
          </div>

          {/* Termo de Garantia */}
          <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 text-xs text-cream-dim flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p>
              <strong className="text-cream">Garantia Ativa:</strong> Prazo operacional de 30 a 45 dias úteis com devolução integral dos valores caso os apontamentos não deixem de ser exibidos em consultas externas.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-line hover:bg-ink-raised text-cream transition"
            >
              {session ? 'Desconectar da Conta' : 'Nova Consulta'}
            </button>

            <a
              href="http://localhost:5242"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-line bg-ink-raised hover:border-brand/40 text-cream text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>Painel Ops (5242)</span>
              <LayoutDashboard className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://wa.me/5531993585185"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand hover:bg-brand-light text-ink text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </Modal>
  )
}
