import { CheckCircle2, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react'
import { WORK_STEPS } from '@/content/howItWorks'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { SALES_CONTACT_URL, SECTION_IDS } from '@/content/site'

interface HowItWorksSectionProps {
  onOpenCheckout: () => void
}

export function HowItWorksSection({ onOpenCheckout }: HowItWorksSectionProps) {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      className="relative overflow-hidden border-t border-line bg-ink py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Fluxo 100% Digital"
          titleId="how-it-works-title"
          title="Do cadastro à regularização em 4 etapas claras"
          description="Sem intermediários confusos, sem filas em cartório e sem ligações invasivas. Tudo é feito direto no seu navegador com confirmação imediata."
          alignment="center"
        />

        {/* Linha dos 4 Passos */}
        <div className="mt-12 sm:mt-20 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
          {WORK_STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.step}
                className="group relative flex flex-col justify-between rounded-3xl border border-line bg-ink-raised p-5 sm:p-8 transition-all duration-300 hover:border-brand/40 hover:shadow-2xl min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-brand-light">
                      {s.step}
                    </span>
                    <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand shrink-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  </div>

                  <h3 className="font-wide mt-5 sm:mt-6 text-base sm:text-lg font-bold text-cream leading-snug">
                    {s.title}
                  </h3>

                  <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-cream-dim/90 leading-relaxed font-normal">
                    {s.description}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 border-t border-line/60 pt-3.5 sm:pt-4 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-semibold text-brand-light">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-signal shrink-0" />
                    {s.badge}
                  </span>
                  <span className="font-mono text-[11px] sm:text-xs text-cream-dim">
                    {s.duration}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner de Garantia & Suporte Humano */}
        <div className="mt-12 sm:mt-16 rounded-3xl border border-line bg-ink-raised p-5 sm:p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 shadow-2xl min-w-0">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <span className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
              <ShieldCheck className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
            <div>
              <h4 className="font-bold text-base sm:text-lg text-cream">
                Dúvidas durante o preenchimento ou pagamento?
              </h4>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-cream-dim/90 leading-relaxed max-w-xl">
                Nossos consultores jurídicos e de atendimento acompanham você pelo WhatsApp caso precise de suporte para validar seu documento ou gerar o PIX.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
            <a
              href={SALES_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-cream hover:bg-line text-center transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-signal shrink-0" />
              <span>Chamar no WhatsApp</span>
            </a>

            <Button
              onClick={onOpenCheckout}
              size="lg"
              className="w-full sm:w-auto gap-2 px-6 py-3 sm:py-3.5 text-xs sm:text-sm"
            >
              <span>Iniciar Cadastro Agora</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
