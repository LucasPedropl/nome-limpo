import { ShieldCheck, ArrowRight, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED } from '@/content/site'

interface CtaFinalSectionProps {
  onOpenCheckout: () => void
}

export function CtaFinalSection({ onOpenCheckout }: CtaFinalSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-gradient-to-b from-ink to-ink-sunken py-16 sm:py-36">
      {/* Luz ambiente central */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[48rem] max-w-[100vw] rounded-full bg-brand/15 blur-[140px]"
      />

      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8 text-center min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-light shadow-sm max-w-full text-balance">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Regularize Seu Nome Hoje Mesmo</span>
        </div>

        <h2 className="font-wide mt-5 sm:mt-6 text-2xl font-black tracking-tight text-cream sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl mx-auto text-balance leading-tight">
          Pronto para dar o primeiro passo e limpar o seu CPF ou CNPJ?
        </h2>

        <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-cream-dim max-w-2xl mx-auto leading-relaxed">
          Assinatura de apenas <strong className="text-cream whitespace-nowrap">{PLAN_PRICE_FORMATTED}/mês</strong> no PIX. Sem burocracia, 
          com ativação direta na tela e garantia de resultado ou devolução integral do seu dinheiro.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          <Button
            onClick={onOpenCheckout}
            size="lg"
            className="w-full sm:w-auto gap-2.5 text-sm sm:text-lg px-6 py-4 sm:px-9 sm:py-5 shadow-2xl"
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current shrink-0" />
            <span>Contratar Regularização Cadastral</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          </Button>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-8 text-xs sm:text-sm font-mono text-cream-dim">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light shrink-0" />
            Ativação em 1 minuto
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light shrink-0" />
            PIX automático na tela
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light shrink-0" />
            Sem fidelidade contratual
          </span>
        </div>
      </div>
    </section>
  )
}
