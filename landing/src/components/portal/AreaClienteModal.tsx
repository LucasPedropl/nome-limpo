import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Clock, LogOut, MessageCircle, Search, ShieldCheck, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { pagwebService, type ClientSession } from '@/services/pagwebService'
import { contractService, type ContractData } from '@/services/contractService'
import { SALES_WHATSAPP_RAW, SALES_WHATSAPP_DISPLAY } from '@/content/site'

interface AreaClienteModalProps {
  isOpen: boolean
  onClose: () => void
}

function whatsappUrl(message: string): string {
  return `https://wa.me/${SALES_WHATSAPP_RAW}?text=${encodeURIComponent(message)}`
}

/**
 * Área do Cliente sem servidor próprio: mostra a assinatura feita neste aparelho e leva o
 * acompanhamento do processo para o WhatsApp da equipe, com CPF/CNPJ ou protocolo já escritos.
 */
export function AreaClienteModal({ isOpen, onClose }: AreaClienteModalProps) {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [termo, setTermo] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setSession(pagwebService.getSession())
    setContract(contractService.getActiveContract())
  }, [isOpen])

  const handleLogout = () => {
    pagwebService.clearSession()
    setSession(null)
  }

  const handleConsultar = (e: FormEvent) => {
    e.preventDefault()
    if (!termo.trim()) return
    window.open(
      whatsappUrl(`Olá! Quero acompanhar meu processo no Seu Nome Limpo. CPF/CNPJ ou protocolo: ${termo.trim()}`),
      '_blank',
      'noopener,noreferrer'
    )
  }

  const assinatura = session && contract && contract.protocolNumber === session.protocolo ? contract : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Área do Assinante' : 'Área do Cliente'}
      description={
        session
          ? `Bem-vindo(a), ${session.cliente.nomeRazaoSocial.split(' ')[0]}! Veja os dados da sua assinatura.`
          : 'Acompanhe o andamento da sua regularização com a nossa equipe'
      }
      maxWidth="lg"
    >
      {session && (
        <div className="mb-4 p-3.5 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/20 text-brand-light">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <span className="font-bold text-cream block">{session.cliente.nomeRazaoSocial}</span>
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

      {assinatura ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-ink-raised border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cream flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand" />
                {assinatura.planName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-light">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assinatura ativa
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-cream-dim">Protocolo</dt>
                <dd className="font-mono font-bold text-cream">{assinatura.protocolNumber}</dd>
              </div>
              <div>
                <dt className="text-cream-dim">Mensalidade</dt>
                <dd className="font-bold text-cream">{assinatura.planAmountFormatted}</dd>
              </div>
              <div>
                <dt className="text-cream-dim">Início</dt>
                <dd className="text-cream">{assinatura.contractDate}</dd>
              </div>
              <div>
                <dt className="text-cream-dim">Previsão de conclusão</dt>
                <dd className="text-cream flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-light" />
                  {assinatura.estimatedCompletionDate}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-cream-dim leading-relaxed">{assinatura.warrantyTerms}</p>
          </div>

          <a
            href={whatsappUrl(`Olá! Quero acompanhar meu processo no Seu Nome Limpo. Protocolo: ${assinatura.protocolNumber}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-brand hover:bg-brand-light text-ink flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Acompanhar meu processo no WhatsApp
          </a>
        </div>
      ) : (
        <form onSubmit={handleConsultar} className="space-y-4">
          <div className="p-4 rounded-xl bg-ink-raised border border-line space-y-2">
            <span className="text-xs font-semibold text-cream block">Informe seu CPF/CNPJ ou o Protocolo de Atendimento</span>
            <p className="text-xs text-cream-dim">
              Nossa equipe responde pelo WhatsApp {SALES_WHATSAPP_DISPLAY} com o andamento da sua regularização nos birôs.
              O protocolo (ex: NL-2026-1048) chegou no seu WhatsApp quando o pagamento foi confirmado.
            </p>
          </div>

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
            disabled={!termo.trim()}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-brand hover:bg-brand-light text-ink flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition disabled:opacity-50"
          >
            Consultar pelo WhatsApp
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </Modal>
  )
}
