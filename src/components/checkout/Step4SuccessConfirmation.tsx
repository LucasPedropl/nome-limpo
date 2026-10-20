import { CheckCircle2, ShieldCheck, Mail, Calendar, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfettiEffect } from '@/components/ui/ConfettiEffect'
import type { ContractData } from '@/services/contractService'
import { SALES_WHATSAPP_RAW } from '@/content/site'

interface Step4Props {
  contract: ContractData
  onClose: () => void
}

export function Step4SuccessConfirmation({ contract, onClose }: Step4Props) {
  const whatsappUrl =
    `https://wa.me/${SALES_WHATSAPP_RAW}?text=` +
    encodeURIComponent(
      `Olá! Acabei de contratar o serviço de Nome Limpo Express (Protocolo: ${contract.protocolNumber}). Gostaria de confirmar os próximos passos!`
    )

  return (
    <div className="space-y-6 text-center animate-screen-in">
      <ConfettiEffect active={true} />

      {/* Ícone de Sucesso */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-signal/20 text-signal shadow-lg ring-4 ring-signal/30">
        <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
      </div>

      <div>
        <span className="rounded-full bg-signal/15 px-3.5 py-1 font-mono text-xs font-bold text-signal">
          ● Pagamento PIX Confirmado
        </span>
        <h3 className="font-wide mt-2 text-2xl sm:text-3xl font-black text-cream">
          Cadastro Ativado com Sucesso!
        </h3>
        <p className="mt-1 text-sm text-cream-dim">
          Seu serviço de manutenção e regularização cadastral já foi iniciado no sistema.
        </p>
      </div>

      {/* Cartão de Resumo do Contrato */}
      <div className="rounded-2xl border border-line bg-ink p-5 sm:p-6 text-left space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-line/70 pb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-cream-dim font-mono block">
              Número da Contratação / Protocolo
            </span>
            <span className="font-mono text-lg sm:text-xl font-black text-brand-light">
              {contract.protocolNumber}
            </span>
          </div>
          <span className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs font-bold uppercase text-brand-light">
            Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-cream-dim block text-xs">Titular:</span>
            <span className="font-bold text-cream truncate block text-base">{contract.customerName}</span>
          </div>
          <div>
            <span className="text-cream-dim block text-xs">Documento:</span>
            <span className="font-mono text-cream font-medium text-base">{contract.document}</span>
          </div>
          <div>
            <span className="text-cream-dim block text-xs">Plano Contratado:</span>
            <span className="font-bold text-brand-light text-base">{contract.planAmountFormatted}</span>
          </div>
          <div>
            <span className="text-cream-dim block text-xs flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-light" /> Previsão de Conclusão:
            </span>
            <span className="font-mono font-bold text-cream text-base">{contract.estimatedCompletionDate}</span>
          </div>
        </div>

        {/* Informação sobre a garantia */}
        <div className="rounded-2xl border border-line bg-ink-raised p-4 flex items-start gap-3 text-xs sm:text-sm text-cream-dim">
          <ShieldCheck className="h-5 w-5 text-signal shrink-0 mt-0.5" />
          <span>
            <strong className="text-cream">Garantia Contratual:</strong> {contract.warrantyTerms}
          </span>
        </div>
      </div>

      {/* Notificação de E-mail Despachado */}
      <div className="rounded-2xl border border-brand/30 bg-brand/10 p-4 text-xs sm:text-sm text-brand-light flex items-center justify-center gap-2.5">
        <Mail className="h-5 w-5 shrink-0" />
        <span>
          Enviamos a confirmação detalhada e o termo de adesão para <strong className="underline">{contract.email}</strong>.
        </span>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-signal px-6 py-4 text-sm font-bold text-ink hover:brightness-110 shadow-lg transition-all"
        >
          <MessageCircle className="h-5 w-5 fill-current" />
          <span>Acompanhar no WhatsApp</span>
        </a>

        <Button
          onClick={onClose}
          variant="secondary"
          size="lg"
          className="flex-1 justify-center gap-2.5 py-4 text-sm"
        >
          <span>Concluir &amp; Voltar ao Início</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
