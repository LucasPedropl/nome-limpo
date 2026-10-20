import { MessageCircle } from 'lucide-react'
import { SALES_CONTACT_URL } from '@/content/site'

export function FloatingWhatsAppButton() {
  return (
    <aside
      aria-label="Atendimento no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center"
    >
      <a
        href={SALES_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com especialista no WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-signal text-white shadow-[0_12px_32px_-6px_hsl(var(--signal)/0.6)] ring-2 ring-signal/40 transition-all duration-300 hover:scale-110 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 active:scale-95"
      >
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-4 w-4"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400"></span>
        </span>
        <MessageCircle className="h-7 w-7 fill-current stroke-[2.2]" aria-hidden="true" />
      </a>
    </aside>
  )
}
