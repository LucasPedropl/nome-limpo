import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react'
import { LEGAL_DISCLAIMER } from '@/content/legal'
import { SECTION_IDS } from '@/content/site'

export function LegalNoticeSection() {
  return (
    <section
      id={SECTION_IDS.legal}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-20 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl border border-line bg-ink-raised/80 p-8 sm:p-12 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand-light shadow-inner">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <div>
              <h3 className="font-wide text-xl sm:text-2xl font-bold text-cream">
                {LEGAL_DISCLAIMER.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-cream-dim leading-relaxed">
                {LEGAL_DISCLAIMER.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {LEGAL_DISCLAIMER.points.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line/70 bg-ink p-6 space-y-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-signal shrink-0" />
                  <h4 className="text-sm sm:text-base font-bold text-cream font-mono">
                    {p.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-cream-dim leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-line/70 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-cream-dim gap-4">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-light shrink-0" />
              <span>Contrato de Prestação de Serviços registrado e disponível após contratação</span>
            </span>
            <span className="font-mono text-signal font-semibold">
              ● Rigorosamente conforme CDC e LGPD
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
