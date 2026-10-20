import { Shield, Lock, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { NAV_ITEMS, SALES_WHATSAPP_DISPLAY, SUPPORT_EMAIL, SALES_CONTACT_URL } from '@/content/site'

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-line bg-ink-sunken text-cream-dim">
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-4 min-w-0">
          {/* Coluna 1: Marca e Missão */}
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <BrandLogo size="md" />
            <p className="text-xs sm:text-sm leading-relaxed text-cream-dim">
              Plataforma digital para assessoria, manutenção e reabilitação cadastral de CPF e CNPJ.
              Conduzimos procedimentos éticos e legais para que restrições deixem de ser exibidas em consultas externas.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-light font-medium">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Garantia de 45 dias úteis ou reembolso integral</span>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="min-w-0">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cream">
              Navegação
            </h4>
            <ul className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-cream"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Atendimento e Suporte */}
          <div className="min-w-0">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cream">
              Canais Oficiais
            </h4>
            <ul className="mt-4 sm:mt-5 space-y-3 text-xs sm:text-sm">
              <li>
                <span className="block text-[11px] sm:text-xs text-cream-dim/70">WhatsApp Comercial:</span>
                <a
                  href={SALES_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cream hover:text-brand-light mt-0.5 inline-block"
                >
                  {SALES_WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <span className="block text-[11px] sm:text-xs text-cream-dim/70">E-mail de Suporte:</span>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-cream hover:text-brand-light mt-0.5 inline-block truncate max-w-full"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <span className="block text-[11px] sm:text-xs text-cream-dim/70">Horário de Atendimento:</span>
                <span className="text-cream mt-0.5 block">Segunda a Sexta, das 09h às 18h</span>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Segurança e Compliance */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cream">
              Segurança &amp; LGPD
            </h4>
            <div className="rounded-2xl border border-line bg-ink-raised p-4 sm:p-5 space-y-2.5 sm:space-y-3 shadow-sm min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-cream font-medium">
                <Lock className="h-4 w-4 text-brand-light shrink-0" />
                <span>Dados Criptografados (SSL 256-bit)</span>
              </div>
              <p className="text-[11px] sm:text-xs text-cream-dim leading-relaxed">
                Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e o Código de Defesa do Consumidor.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-signal font-mono font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Pagamento Instantâneo via PIX BACEN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé inferior com aviso legal e direitos autorais */}
        <div className="mt-12 sm:mt-16 border-t border-line/70 pt-8 sm:pt-10 text-center sm:flex sm:items-center sm:justify-between text-xs sm:text-sm text-cream-dim/70">
          <p>© {currentYear} Nome Limpo Express. Todos os direitos reservados.</p>
          <p className="mt-2.5 sm:mt-0">
            Assinatura mensal de R$ 100,00 sem taxa de adesão e sem fidelidade.
          </p>
        </div>
      </div>
    </footer>
  )
}
