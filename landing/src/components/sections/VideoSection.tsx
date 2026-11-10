import { CheckCircle2, ArrowRight, MessageCircle } from 'lucide-react'
import institutionalVideoUrl from '@/assets/video/video.mp4'
import institutionalVideoPoster from '@/assets/video/poster.jpg'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ESTIMATED_DAYS_DELIVERY, SALES_CONTACT_URL, SECTION_IDS } from '@/content/site'

interface VideoSectionProps {
  onOpenCheckout: () => void
}

const VIDEO_HIGHLIGHTS: readonly string[] = [
  'Processo 100% digital e acompanhado',
  'Atendimento humano pelo WhatsApp',
  `Prazo estimado de ${ESTIMATED_DAYS_DELIVERY}`,
]

export function VideoSection({ onOpenCheckout }: VideoSectionProps) {
  return (
    <section
      id={SECTION_IDS.video}
      aria-labelledby="video-title"
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-16 sm:py-32"
    >
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <SectionHeader
              eyebrow="Veja em 1 minuto"
              titleId="video-title"
              title="Entenda como o Seu Nome Limpo funciona"
              description="Assista ao vídeo e veja, de forma simples, como acontece a regularização do seu cadastro do começo ao fim."
              alignment="left"
            />

            <ul className="mt-8 space-y-3.5">
              {VIDEO_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-cream">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={onOpenCheckout}
                size="lg"
                className="w-full sm:w-auto gap-2 px-6 py-3 sm:py-3.5 text-xs sm:text-sm"
              >
                <span>Iniciar Cadastro Agora</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>

              <a
                href={SALES_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-cream hover:bg-line text-center transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-signal shrink-0" />
                <span>Chamar no WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="relative isolate">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div className="h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px] rounded-[2rem] border border-line bg-ink-raised p-2 shadow-2xl">
              <video
                className="block w-full aspect-[9/16] rounded-[1.6rem] object-cover bg-black"
                controls
                playsInline
                preload="metadata"
                poster={institutionalVideoPoster}
                src={institutionalVideoUrl}
                aria-label="Vídeo institucional do Seu Nome Limpo"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
