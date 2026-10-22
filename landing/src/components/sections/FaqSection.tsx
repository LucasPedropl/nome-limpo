import { useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { FAQ_ITEMS } from '@/content/faq'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SALES_CONTACT_URL, SECTION_IDS } from '@/content/site'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [filterCategory, setFilterCategory] = useState<string>('todos')

  const categories = [
    { id: 'todos', label: 'Todas as Dúvidas' },
    { id: 'servico', label: 'Sobre o Serviço' },
    { id: 'credito', label: 'Crédito e Bancos' },
    { id: 'garantia', label: 'Garantia e Prazos' },
    { id: 'pagamento', label: 'Pagamentos' },
  ]

  const filteredFaqs = filterCategory === 'todos'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((f) => f.category === filterCategory)

  return (
    <section
      id={SECTION_IDS.faq}
      className="relative overflow-hidden border-t border-line bg-ink py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tire Suas Dúvidas"
          titleId="faq-title"
          title="Perguntas Frequentes &amp; Transparência Total"
          description="Acreditamos em uma relação transparente com nossos clientes. Veja as principais respostas sobre o funcionamento do serviço de regularização cadastral."
          alignment="center"
        />

        {/* Filtros de Categoria */}
        <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFilterCategory(cat.id)
                setOpenIndex(null)
              }}
              className={`rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 font-mono text-xs sm:text-sm font-semibold transition-all ${
                filterCategory === cat.id
                  ? 'border border-brand bg-brand/20 text-brand-light shadow-md'
                  : 'border border-line bg-ink-raised text-cream-dim hover:text-cream hover:bg-line/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Acordeão com Espaçamento Responsivo */}
        <div className="mt-8 sm:mt-12 max-w-3xl mx-auto space-y-3.5 sm:space-y-4 min-w-0">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-line bg-ink-raised transition-all duration-200 min-w-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-4.5 sm:p-7 text-left transition-colors hover:bg-line/20 gap-3"
                >
                  <span className="font-bold text-sm sm:text-lg text-cream flex items-start sm:items-center gap-2.5 sm:gap-3.5 pr-2">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-brand-light shrink-0 mt-0.5 sm:mt-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 sm:h-5 sm:w-5 text-cream-dim transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-brand-light' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-line/60 bg-ink/60 px-4.5 py-4 sm:px-7 sm:py-6 text-xs sm:text-base text-cream-dim leading-relaxed animate-screen-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Suporte Direto */}
        <div className="mt-12 sm:mt-20 text-center px-2">
          <p className="text-xs sm:text-base text-cream-dim">
            Ainda ficou com alguma dúvida sobre o seu caso específico?
          </p>
          <a
            href={SALES_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-2.5 rounded-2xl border border-line bg-ink-raised px-4.5 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-base font-bold text-cream hover:bg-line transition-all shadow-md max-w-full text-center"
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-signal shrink-0" />
            <span className="truncate sm:whitespace-normal">Conversar no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
