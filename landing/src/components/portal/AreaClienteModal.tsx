import { useState, type FormEvent } from 'react'
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<ProcessoConsulta | null>(null)

  const handleBuscar = async (e: FormEvent) => {
    e.preventDefault()
    if (!termo.trim()) return

    setLoading(true)
    setErro('')
    setResultado(null)

    try {
      const cleanTerm = termo.trim()
      const response = await fetch(`${API_URL}/api/public/checkout/consulta/${encodeURIComponent(cleanTerm)}`)

      if (!response.ok) {
        throw new Error('Nenhum processo localizado para os dados informados. Verifique seu CPF/CNPJ ou Protocolo.')
      }

      const data = await response.json()
      setResultado(data)
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar processo.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResultado(null)
    setTermo('')
    setErro('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Área do Cliente — Consulta em Tempo Real"
      description="Acompanhe o andamento da sua regularização e a baixa dos apontamentos nos birôs"
      maxWidth="lg"
    >
      {!resultado ? (
        <form onSubmit={handleBuscar} className="space-y-4">
          <div className="p-4 rounded-xl bg-ink-raised border border-line space-y-2">
            <span className="text-xs font-semibold text-cream block">
              Informe seu CPF/CNPJ ou o Protocolo de Atendimento
            </span>
            <p className="text-xs text-cream-dim">
              Você pode consultar usando seu CPF/CNPJ (ex: 128.459.736-22) ou o protocolo gerado na adesão (ex: NL-2026-1048).
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
              placeholder="Digite seu CPF, CNPJ ou Protocolo (ex: NL-2026-XXXX)..."
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-ink border border-line text-cream placeholder-cream-dim/60 focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !termo.trim()}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-brand hover:bg-brand-light text-ink flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Consultar Andamento'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
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

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-line hover:bg-ink-raised text-cream transition"
            >
              Nova Consulta
            </button>
            <a
              href="https://wa.me/5531993585185"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand hover:bg-brand-light text-ink text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>Falar com Especialista</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </Modal>
  )
}
