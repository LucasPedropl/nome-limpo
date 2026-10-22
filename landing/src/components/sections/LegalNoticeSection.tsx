import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react'
import { LEGAL_DISCLAIMER } from '@/content/legal'
import { SECTION_IDS } from '@/content/site'

export function LegalNoticeSection() {
  return (
    <section
      id={SECTION_IDS.legal}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl border border-line bg-ink-raised/80 p-5 sm:p-8 md:p-12 shadow-2xl min-w-0">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand-light shadow-inner">
              <ShieldAlert className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <div>
              <h3 className="font-wide text-lg sm:text-2xl font-bold text-cream">
                {LEGAL_DISCLAIMER.title}
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-cream-dim leading-relaxed">
                {LEGAL_DISCLAIMER.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2">
            {LEGAL_DISCLAIMER.points.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line/70 bg-ink p-4 sm:p-6 space-y-2.5 sm:space-y-3 shadow-sm min-w-0"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-signal shrink-0" />
                  <h4 className="text-xs sm:text-base font-bold text-cream font-mono">
                    {p.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-cream-dim leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 border-t border-line/70 pt-5 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-cream-dim gap-3 sm:gap-4">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-brand-light shrink-0" />
              <span>Contrato registrado e disponível após contratação</span>
            </span>
            <span className="font-mono text-signal font-semibold text-[11px] sm:text-sm">
              ● Conforme CDC e LGPD
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
