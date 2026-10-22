import { MAIN_BENEFITS, KEY_METRICS } from '@/content/benefits'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SECTION_IDS } from '@/content/site'

export function BenefitsSection() {
  return (
    <section
      id={SECTION_IDS.benefits}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Benefícios Reais"
          titleId="benefits-title"
          title="Tudo o que você precisa para reabilitar seu poder de compra"
          description="Procedimentos transparentes e seguros com foco exclusivo na regularização de apontamentos externos e manutenção contínua."
          alignment="center"
        />

        {/* Grid de Benefícios com Espaçamento Responsivo */}
        <div className="mt-12 sm:mt-20 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
          {MAIN_BENEFITS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`group relative flex flex-col justify-between rounded-3xl border p-5 sm:p-8 md:p-9 transition-all duration-300 hover:border-brand/50 hover:shadow-2xl min-w-0 ${
                  item.highlight
                    ? 'border-brand/40 bg-ink-raised ring-1 ring-brand/20 glow-box'
                    : 'border-line bg-ink-raised'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand-light transition-transform duration-300 group-hover:scale-110 shrink-0">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </span>
                    <span className="rounded-full border border-line bg-ink px-3 py-1 font-mono text-[11px] sm:text-xs font-semibold text-cream-dim">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-wide mt-5 sm:mt-6 text-lg sm:text-xl font-bold text-cream leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-base text-cream-dim/90 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 border-t border-line/60 pt-4 sm:pt-5">
                  <span className="font-mono text-[11px] sm:text-xs font-semibold text-brand-light flex items-center gap-2">
                    ● Atuação preventiva e contínua
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Métricas e Garantias */}
        <div className="mt-12 sm:mt-20 grid gap-6 rounded-3xl border border-line bg-ink p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-10 shadow-xl min-w-0">
          {KEY_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-line/60 pb-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6 text-center sm:text-left"
            >
              <span className="font-wide font-black text-3xl sm:text-5xl text-brand-light font-mono block">
                {metric.value}
              </span>
              <span className="mt-2 block font-bold text-sm sm:text-base text-cream">
                {metric.label}
              </span>
              <span className="mt-1 block text-xs sm:text-sm text-cream-dim leading-relaxed">
                {metric.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
