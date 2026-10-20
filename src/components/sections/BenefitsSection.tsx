import { MAIN_BENEFITS, KEY_METRICS } from '@/content/benefits'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SECTION_IDS } from '@/content/site'

export function BenefitsSection() {
  return (
    <section
      id={SECTION_IDS.benefits}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-20 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <SectionHeader
          eyebrow="Benefícios Reais"
          titleId="benefits-title"
          title="Tudo o que você precisa para reabilitar seu poder de compra"
          description="Procedimentos transparentes e seguros com foco exclusivo na regularização de apontamentos externos e manutenção contínua."
          alignment="center"
        />

        {/* Grid de Benefícios com Mais Respiro */}
        <div className="mt-16 sm:mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {MAIN_BENEFITS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`group relative flex flex-col justify-between rounded-3xl border p-8 sm:p-9 transition-all duration-300 hover:border-brand/50 hover:shadow-2xl ${
                  item.highlight
                    ? 'border-brand/40 bg-ink-raised ring-1 ring-brand/20 glow-box'
                    : 'border-line bg-ink-raised'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand-light transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="rounded-full border border-line bg-ink px-3.5 py-1.5 font-mono text-xs font-semibold text-cream-dim">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-wide mt-6 text-xl font-bold text-cream leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-3.5 text-sm sm:text-base text-cream-dim/90 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 border-t border-line/60 pt-5">
                  <span className="font-mono text-xs font-semibold text-brand-light flex items-center gap-2">
                    ● Atuação preventiva e contínua
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Métricas e Garantias com Espaçamento Amplo */}
        <div className="mt-16 sm:mt-20 grid gap-6 rounded-3xl border border-line bg-ink p-8 sm:grid-cols-2 lg:grid-cols-4 sm:p-10 shadow-xl">
          {KEY_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-line/60 pb-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6 text-center sm:text-left"
            >
              <span className="font-wide font-black text-4xl sm:text-5xl text-brand-light font-mono block">
                {metric.value}
              </span>
              <span className="mt-2.5 block font-bold text-base text-cream">
                {metric.label}
              </span>
              <span className="mt-1.5 block text-xs sm:text-sm text-cream-dim leading-relaxed">
                {metric.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
