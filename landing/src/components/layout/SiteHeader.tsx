import { useState, useEffect } from 'react'
import { Menu, X, MessageCircle } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NAV_ITEMS, SALES_CONTACT_URL } from '@/content/site'
import { cn } from '@/lib/cn'

interface SiteHeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenAreaCliente?: () => void
}

export function SiteHeader({ theme, onToggleTheme, onOpenAreaCliente }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nl_client_session')
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }
    return null
  })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    const updateSession = () => {
      try {
        const raw = localStorage.getItem('nl_client_session')
        setSession(raw ? JSON.parse(raw) : null)
      } catch {
        setSession(null)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('nl_session_changed', updateSession)
    window.addEventListener('storage', updateSession)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('nl_session_changed', updateSession)
      window.removeEventListener('storage', updateSession)
    }
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        isScrolled
          ? 'border-b border-line bg-ink/90 shadow-sm backdrop-blur-md py-3 sm:py-3.5'
          : 'bg-transparent py-4 sm:py-5'
      )}
    >
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo da Marca - shrink-0 garante que nunca será comprimido ou sobreposto */}
        <a
          href="#inicio"
          aria-label="Página inicial do Nome Limpo Express"
          className="shrink-0 focus-visible:outline-none"
        >
          <BrandLogo size="md" />
        </a>

        {/* Desktop Navigation - ativado a partir de lg (1024px) com gaps responsivos */}
        <nav aria-label="Navegação principal" className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs xl:text-sm font-semibold text-cream-dim transition-colors hover:text-brand-light whitespace-nowrap py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions (Alternador de Tema + Área do Cliente + WhatsApp) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {onOpenAreaCliente && (
            <button
              type="button"
              onClick={onOpenAreaCliente}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap shadow-sm ${
                session
                  ? 'border-brand/50 bg-brand/15 hover:bg-brand/25 text-brand-light'
                  : 'border-brand/40 bg-brand/10 hover:bg-brand/20 text-brand'
              }`}
            >
              {session && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              <span>
                {session
                  ? `Meu Painel (${session.cliente?.nomeRazaoSocial?.split(' ')[0] || 'Assinante'})`
                  : 'Área do Cliente'}
              </span>
            </button>
          )}

          <a
            href={SALES_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-line bg-ink-raised px-3.5 py-2 xl:px-4 xl:py-2.5 text-xs font-semibold text-cream transition-colors hover:border-brand/40 hover:text-brand-light whitespace-nowrap shadow-sm"
          >
            <MessageCircle className="h-4 w-4 text-brand shrink-0" />
            <span>Falar no WhatsApp</span>
          </a>

          {/* Botão de Menu Mobile (visível abaixo de lg / 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-raised text-cream lg:hidden active:scale-95 shadow-sm"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-ink-raised/98 px-5 py-6 sm:px-8 sm:py-8 backdrop-blur-xl lg:hidden animate-screen-in shadow-xl">
          <nav className="flex flex-col gap-3" aria-label="Menu móvel">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-base sm:text-lg font-medium text-cream hover:text-brand-light transition-colors border-b border-line/40 last:border-none"
              >
                {item.label}
              </a>
            ))}

            <div className="mt-4 pt-4 border-t border-line flex flex-col gap-3">
              <a
                href={SALES_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-ink px-4 py-3.5 text-sm font-semibold text-cream hover:border-brand/40 hover:text-brand-light text-center transition-colors shadow-sm"
              >
                <MessageCircle className="h-4 w-4 text-brand" />
                <span>Atendimento via WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
