import { ShieldCheck, ArrowRight, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED } from '@/content/site'

interface CtaFinalSectionProps {
  onOpenCheckout: () => void
}

export function CtaFinalSection({ onOpenCheckout }: CtaFinalSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-gradient-to-b from-ink to-ink-sunken py-24 sm:py-36">
      {/* Luz ambiente central */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[48rem] rounded-full bg-brand/15 blur-[140px]"
      />

      <div className="relative mx-auto max-w-site px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-brand/30 bg-brand/10 px-5 py-2 text-xs sm:text-sm font-semibold text-brand-light shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Regularize Seu Nome Hoje Mesmo</span>
        </div>

        <h2 className="font-wide mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl mx-auto text-balance leading-tight">
          Pronto para dar o primeiro passo e limpar o seu CPF ou CNPJ?
        </h2>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-cream-dim max-w-2xl mx-auto leading-relaxed">
          Assinatura de apenas <strong className="text-cream">{PLAN_PRICE_FORMATTED}/mês</strong> no PIX. Sem burocracia, 
          com ativação direta na tela e garantia de resultado ou devolução integral do seu dinheiro.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Button
            onClick={onOpenCheckout}
            size="lg"
            className="w-full sm:w-auto gap-3 text-base sm:text-lg px-9 py-5 shadow-2xl"
          >
            <Zap className="h-5 w-5 fill-current" />
            <span>Contratar Regularização Cadastral</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-xs sm:text-sm font-mono text-cream-dim">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light" />
            Ativação em 1 minuto
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light" />
            PIX automático na tela
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-brand-light" />
            Sem fidelidade contratual
          </span>
        </div>
      </div>
    </section>
  )
}
