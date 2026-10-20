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
      className="relative overflow-hidden border-t border-line bg-ink py-20 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <SectionHeader
          eyebrow="Plano &amp; Investimento"
          titleId="pricing-title"
          title="Preço único, justo e sem surpresas no final do mês"
          description="Um único valor de assinatura mensal para manter seu nome limpo e protegido perante os órgãos de proteção ao crédito."
          alignment="center"
        />

        <div className="mt-16 sm:mt-20 max-w-2xl mx-auto">
          {/* Card Principal do Plano com Mais Respiro */}
          <div className="relative rounded-3xl border-2 border-brand bg-ink-raised p-8 sm:p-12 shadow-2xl ring-1 ring-brand/30 glow-box">
            {/* Tag Flutuante de Destaque */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-1.5 text-xs font-black uppercase tracking-wider text-ink shadow-lg">
                <Sparkles className="h-4 w-4 fill-current" />
                Assinatura Oficial
              </span>
            </div>

            <div className="text-center mt-3">
              <h3 className="font-wide text-2xl sm:text-3xl font-black text-cream">
                Plano Mensal Nome Limpo
              </h3>
              <p className="mt-2 text-sm text-cream-dim/90">
                Manutenção contínua e regularização completa para CPF ou CNPJ
              </p>

              {/* Bloco de Preço */}
              <div className="mt-7 flex items-baseline justify-center gap-2.5">
                <span className="font-mono text-5xl sm:text-6xl font-black text-brand-light tracking-tight">
                  {PLAN_PRICE_FORMATTED}
                </span>
                <span className="text-base font-semibold text-cream-dim">/mês</span>
              </div>
              <span className="mt-2 inline-block text-xs font-mono text-signal">
                ● Cobrança mensal via PIX sem fidelidade
              </span>
            </div>

            {/* Lista de Recursos Inclusos com Espaçamento Amplo */}
            <div className="mt-8 sm:mt-10 border-y border-line/80 py-7 space-y-4">
              {planFeatures.map((feat) => (
                <div key={feat} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span className="text-sm sm:text-base text-cream leading-relaxed font-normal">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA de Ação */}
            <div className="mt-9">
              <Button
                onClick={onOpenCheckout}
                size="lg"
                className="w-full justify-center gap-2.5 text-base py-4 shadow-xl"
              >
                <Zap className="h-5 w-5 fill-current" />
                <span>Contratar Plano Agora (R$ 100/mês)</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="mt-3.5 text-center text-xs text-cream-dim">
                Ativação em 1 minuto direto na tela com PIX instantâneo
              </p>
            </div>

            {/* Selo de Garantia Integrado */}
            <div className="mt-8 rounded-2xl border border-line bg-ink p-5 flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-signal">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-cream block text-sm">
                  Garantia de Devolução Integral
                </span>
                <span className="text-cream-dim/90 leading-relaxed text-xs block mt-0.5">
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
