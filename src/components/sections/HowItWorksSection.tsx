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
      className="relative overflow-hidden border-t border-line bg-ink py-20 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <SectionHeader
          eyebrow="Fluxo 100% Digital"
          titleId="how-it-works-title"
          title="Do cadastro à regularização em 4 etapas claras"
          description="Sem intermediários confusos, sem filas em cartório e sem ligações invasivas. Tudo é feito direto no seu navegador com confirmação imediata."
          alignment="center"
        />

        {/* Linha dos 4 Passos com Mais Espaço */}
        <div className="mt-16 sm:mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {WORK_STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.step}
                className="group relative flex flex-col justify-between rounded-3xl border border-line bg-ink-raised p-8 transition-all duration-300 hover:border-brand/40 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-4xl font-black text-brand-light">
                      {s.step}
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>

                  <h3 className="font-wide mt-6 text-lg font-bold text-cream leading-snug">
                    {s.title}
                  </h3>

                  <p className="mt-3 text-sm text-cream-dim/90 leading-relaxed font-normal">
                    {s.description}
                  </p>
                </div>

                <div className="mt-8 border-t border-line/60 pt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-brand-light">
                    <CheckCircle2 className="h-4 w-4 text-signal" />
                    {s.badge}
                  </span>
                  <span className="font-mono text-xs text-cream-dim">
                    {s.duration}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner de Garantia & Suporte Humano */}
        <div className="mt-16 rounded-3xl border border-line bg-ink-raised p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex items-start sm:items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
              <ShieldCheck className="h-9 w-9" />
            </span>
            <div>
              <h4 className="font-bold text-lg text-cream">
                Dúvidas durante o preenchimento ou pagamento?
              </h4>
              <p className="mt-2 text-sm text-cream-dim/90 leading-relaxed max-w-xl">
                Nossos consultores jurídicos e de atendimento acompanham você pelo WhatsApp caso precise de suporte para validar seu documento ou gerar o PIX.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto shrink-0">
            <a
              href={SALES_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink px-6 py-3.5 text-xs sm:text-sm font-semibold text-cream hover:bg-line text-center transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-signal" />
              <span>Chamar no WhatsApp</span>
            </a>

            <Button
              onClick={onOpenCheckout}
              size="lg"
              className="w-full sm:w-auto gap-2 px-7 py-3.5"
            >
              <span>Iniciar Cadastro Agora</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
