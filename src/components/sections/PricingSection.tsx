import { Check, ShieldCheck, Sparkles, ArrowRight, Zap } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED, SECTION_IDS } from '@/content/site'

interface PricingSectionProps {
  onOpenCheckout: () => void
}

export function PricingSection({ onOpenCheckout }: PricingSectionProps) {
  const planFeatures = [
    'Procedimentos extrajudiciais de reabilitação cadastral',
    'Ocultação de restrições em consultas públicas externas',
    'Válido para CPF (Pessoa Física) ou CNPJ (Empresa)',
    'Monitoramento mensal contínuo de novas negativações',
    'Sem taxas ocultas de consulta ou taxa de adesão extra',
    'Garantia contratual de 45 dias úteis ou dinheiro de volta',
    'Sem fidelidade: cancele ou pause quando desejar',
    'Pagamento automático e seguro via PIX sem burocracia',
  ]

  return (
    <section
      id={SECTION_IDS.pricing}
      className="relative overflow-hidden border-t border-line bg-ink py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Plano &amp; Investimento"
          titleId="pricing-title"
          title="Preço único, justo e sem surpresas no final do mês"
          description="Um único valor de assinatura mensal para manter seu nome limpo e protegido perante os órgãos de proteção ao crédito."
          alignment="center"
        />

        <div className="mt-12 sm:mt-20 max-w-2xl mx-auto min-w-0">
          {/* Card Principal do Plano com Espaçamento Responsivo */}
          <div className="relative rounded-3xl border-2 border-brand bg-ink-raised p-5 sm:p-8 md:p-12 shadow-2xl ring-1 ring-brand/30 glow-box min-w-0">
            {/* Tag Flutuante de Destaque */}
            <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-brand px-3.5 sm:px-5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white shadow-lg whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 fill-current shrink-0" />
                Assinatura Oficial
              </span>
            </div>

            <div className="text-center mt-2 sm:mt-3">
              <h3 className="font-wide text-xl sm:text-3xl font-black text-cream">
                Plano Mensal Nome Limpo
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-cream-dim/90">
                Manutenção contínua e regularização completa para CPF ou CNPJ
              </p>

              {/* Bloco de Preço */}
              <div className="mt-5 sm:mt-7 flex items-baseline justify-center gap-2">
                <span className="font-mono text-4xl sm:text-5xl md:text-6xl font-black text-brand-light tracking-tight">
                  {PLAN_PRICE_FORMATTED}
                </span>
                <span className="text-sm sm:text-base font-semibold text-cream-dim">/mês</span>
              </div>
              <span className="mt-2 inline-block text-[11px] sm:text-xs font-mono text-signal">
                ● Cobrança mensal via PIX sem fidelidade
              </span>
            </div>

            {/* Lista de Recursos Inclusos */}
            <div className="mt-6 sm:mt-10 border-y border-line/80 py-5 sm:py-7 space-y-3 sm:space-y-4">
              {planFeatures.map((feat) => (
                <div key={feat} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />
                  </span>
                  <span className="text-xs sm:text-base text-cream leading-relaxed font-normal">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA de Ação */}
            <div className="mt-7 sm:mt-9">
              <Button
                onClick={onOpenCheckout}
                size="lg"
                className="w-full justify-center gap-2 text-sm sm:text-base py-3.5 sm:py-4 px-4 sm:px-8 shadow-xl"
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current shrink-0" />
                <span>Contratar Plano Agora (R$ 100/mês)</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
              <p className="mt-2.5 sm:mt-3.5 text-center text-[11px] sm:text-xs text-cream-dim">
                Ativação em 1 minuto direto na tela com PIX instantâneo
              </p>
            </div>

            {/* Selo de Garantia Integrado */}
            <div className="mt-6 sm:mt-8 rounded-2xl border border-line bg-ink p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 sm:gap-4">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-signal">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-cream block text-xs sm:text-sm">
                  Garantia de Devolução Integral
                </span>
                <span className="text-cream-dim/90 leading-relaxed text-[11px] sm:text-xs block mt-0.5">
                  Caso a baixa dos apontamentos externos não ocorra no prazo contratual, reembolsamos 100% do seu pagamento.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
