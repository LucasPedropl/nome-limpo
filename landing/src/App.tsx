import { useState, useEffect } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingWhatsAppButton } from '@/components/ui/FloatingWhatsAppButton'
import { HeroSection } from '@/components/sections/HeroSection'
import { BenefitsSection } from '@/components/sections/BenefitsSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { PricingSection } from '@/components/sections/PricingSection'
import { ComparisonSection } from '@/components/sections/ComparisonSection'
import { FaqSection } from '@/components/sections/FaqSection'
import { LegalNoticeSection } from '@/components/sections/LegalNoticeSection'
import { CtaFinalSection } from '@/components/sections/CtaFinalSection'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { AreaClienteModal } from '@/components/portal/AreaClienteModal'

export function App() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDocType, setCheckoutDocType] = useState<'PF' | 'PJ'>('PF')
  const [areaClienteOpen, setAreaClienteOpen] = useState(false)

  // Gerenciamento de Tema (Claro por padrão, com suporte a persistência)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nl_theme')
      if (saved === 'dark' || saved === 'light') return saved
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('nl_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleOpenCheckout = (docType: 'PF' | 'PJ' = 'PF') => {
    setCheckoutDocType(docType)
    setCheckoutOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink text-cream selection:bg-brand/30 selection:text-cream transition-colors duration-200 overflow-x-hidden">
      {/* Acessibilidade: pular para conteúdo */}
      <a
        href="#conteudo-principal"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0 shadow-md"
      >
        Pular para o conteúdo principal
      </a>

      {/* Cabeçalho Fixo com tema, navegação e botão para Área do Cliente */}
      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAreaCliente={() => setAreaClienteOpen(true)}
      />

      {/* Conteúdo Principal da Landing Page */}
      <main id="conteudo-principal" className="flex-1">
        <HeroSection onOpenCheckout={() => handleOpenCheckout('PF')} />
        <BenefitsSection />
        <HowItWorksSection onOpenCheckout={() => handleOpenCheckout('PF')} />
        <PricingSection onOpenCheckout={() => handleOpenCheckout('PF')} />
        <ComparisonSection />
        <FaqSection />
        <LegalNoticeSection />
        <CtaFinalSection onOpenCheckout={() => handleOpenCheckout('PF')} />
      </main>

      {/* Rodapé e Botões Flutuantes */}
      <SiteFooter />
      <FloatingWhatsAppButton />

      {/* Modal do Fluxo de Contratação Seamless (Cadastro -> PIX Direto -> Ativação & Login) */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOpenAreaCliente={() => {
          setCheckoutOpen(false)
          setAreaClienteOpen(true)
        }}
        initialDocType={checkoutDocType}
      />

      {/* Modal da Área do Cliente (Consulta em Tempo Real de Processos e Birôs) */}
      <AreaClienteModal
        isOpen={areaClienteOpen}
        onClose={() => setAreaClienteOpen(false)}
      />
    </div>
  )
}
