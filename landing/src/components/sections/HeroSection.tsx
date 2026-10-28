import { Check, ShieldCheck, Sparkles, ArrowRight, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED, SECTION_IDS } from '@/content/site'

interface HeroSectionProps {
  onOpenCheckout: () => void
}

export function HeroSection({ onOpenCheckout }: HeroSectionProps) {
  return (
    <section
      id={SECTION_IDS.hero}
      className="relative overflow-hidden pt-8 pb-16 sm:pt-20 sm:pb-32 lg:pt-24"
    >
      {/* Luz ambiente de fundo verde esmeralda e azul */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[38rem] w-[62rem] max-w-[100vw] rounded-full bg-brand/15 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-10 h-72 w-72 max-w-[100vw] rounded-full bg-accent/10 blur-[110px]"
      />

      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 min-w-0">
          {/* Lado Esquerdo: Headline e Conversão */}
          <div className="min-w-0 w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/10 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-brand-light max-w-full text-balance">
              <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-brand-light" />
              <span>Para Pessoas Físicas (CPF) &amp; Empresas (CNPJ)</span>
            </div>

            <h1 className="font-wide mt-5 sm:mt-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-cream leading-tight tracking-tight break-words text-balance">
              Recupere a sua paz e o seu crédito com o{' '}
              <span className="text-brand-light inline-block">
                Seu Nome Limpo
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl leading-relaxed sm:leading-loose text-cream-dim/90 max-w-xl">
              Serviço especializado de manutenção e regularização cadastral. 
              Elimine a exibição de restrições em consultas externas e abra caminho 
              para reabilitar seu perfil financeiro por apenas <strong className="text-cream font-bold whitespace-nowrap">{PLAN_PRICE_FORMATTED}/mês</strong>.
            </p>

            {/* Destaque dos 3 pilares principais do serviço */}
            <div className="mt-7 sm:mt-8 space-y-3">
              <div className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-3.5 sm:p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                </span>
                <p className="text-xs sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Não Exibição em Consultas Externas:</strong> Procedimento para que apontamentos negativos deixem de ser consultados por terceiros.
                </p>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-3.5 sm:p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                </span>
                <p className="text-xs sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Garantia ou Seu Dinheiro de Volta:</strong> Prazo de 8 a 12 dias úteis com garantia formal documentada.
                </p>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-3.5 sm:p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                </span>
                <p className="text-xs sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Assinatura Transparente:</strong> Sem taxas escondidas, mensalidade de{' '}
                  <span className="text-brand-light font-bold whitespace-nowrap">{PLAN_PRICE_FORMATTED}</span> via PIX e sem fidelidade.
                </p>
              </div>
            </div>

            {/* CTAs Principais */}
            <div className="mt-8 sm:mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button
                onClick={onOpenCheckout}
                size="lg"
                className="w-full sm:w-auto gap-2 text-sm sm:text-base px-6 py-3.5 sm:px-8 sm:py-4"
              >
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span>Regularizar Agora<span className="hidden sm:inline"> (R$ 100/mês)</span></span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>

              <a
                href={`#${SECTION_IDS.howItWorks}`}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-ink-raised px-5 py-3.5 text-xs sm:text-sm font-semibold text-cream transition-colors hover:bg-line text-center"
              >
                Como Funciona
              </a>
            </div>

            {/* Badges de Confiança */}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-sm font-mono text-cream-dim">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-signal shrink-0" />
                Garantia ou Reembolso
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-brand-light shrink-0" />
                PIX Direto na Tela
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                Sem Multa Rescisória
              </span>
            </div>
          </div>

          {/* Lado Direito: Mockup do Card Interativo de Diagnóstico Cadastral */}
          <div className="relative min-w-0 w-full mt-2 lg:mt-0">
            <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-line/90 bg-ink-raised/90 p-4.5 sm:p-7 md:p-9 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 glow-box min-w-0">
              {/* Header do Card */}
              <div className="flex items-center justify-between border-b border-line/80 pb-4 sm:pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-brand/20 text-brand-light font-black text-sm shrink-0">
                    NL
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-cream truncate">Diagnóstico Cadastral</h4>
                    <p className="text-[11px] sm:text-xs text-cream-dim font-mono mt-0.5">Status: Em Análise Ativa</p>
                  </div>
                </div>
                <span className="rounded-full bg-signal/15 px-2.5 py-1 text-[11px] sm:text-xs font-mono font-semibold text-signal shrink-0 whitespace-nowrap">
                  ● Online
                </span>
              </div>

              {/* Score Gauge Visual */}
              <div className="mt-5 rounded-2xl border border-line bg-ink p-3.5 sm:p-5 text-center min-w-0">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-cream-dim font-mono block">
                  Evolução Estimada do Perfil
                </span>
                <div className="mt-3 sm:mt-4 flex items-center justify-between sm:justify-center gap-2 sm:gap-6">
                  <div className="text-left min-w-0">
                    <span className="text-[10px] sm:text-xs text-red-400 font-mono block leading-tight">Antes (Negativado)</span>
                    <span className="text-xl sm:text-3xl font-black text-red-400 font-mono">240</span>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-brand-light animate-pulse" />
                    <span className="text-[9px] sm:text-[10px] text-brand-light font-mono font-bold mt-0.5">REABILITAÇÃO</span>
                  </div>
                  <div className="text-right min-w-0">
                    <span className="text-[10px] sm:text-xs text-brand-light font-mono block leading-tight">Após Regularização</span>
                    <span className="text-2xl sm:text-4xl font-black text-brand-light font-mono">780+</span>
                  </div>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="mt-3 sm:mt-4 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-ink-raised">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-brand" />
                </div>
              </div>

              {/* Checklist de Itens Processados */}
              <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between rounded-xl bg-ink/70 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-line/60 gap-x-2 gap-y-1">
                  <span className="text-cream">Apontamentos em Birôs Públicos</span>
                  <span className="text-brand-light font-mono font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap text-[11px] sm:text-sm">
                    <Check className="h-3.5 w-3.5" /> Baixa Extrajudicial
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between rounded-xl bg-ink/70 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-line/60 gap-x-2 gap-y-1">
                  <span className="text-cream">Prazo de Execução</span>
                  <span className="text-cream font-mono font-medium shrink-0 whitespace-nowrap text-[11px] sm:text-sm">8 a 12 dias úteis</span>
                </div>
                <div className="flex flex-wrap items-center justify-between rounded-xl bg-ink/70 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-line/60 gap-x-2 gap-y-1">
                  <span className="text-cream">Investimento Mensal</span>
                  <span className="text-brand-light font-mono font-bold text-xs sm:text-base shrink-0 whitespace-nowrap">R$ 100,00</span>
                </div>
              </div>

              {/* Botão de Ação Rápida */}
              <div className="mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-line/80">
                <Button
                  onClick={onOpenCheckout}
                  size="lg"
                  className="w-full justify-center gap-2 py-3 sm:py-3.5 text-sm sm:text-base"
                >
                  <span>Iniciar Regularização Cadastral</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>
                <p className="mt-2 text-center text-[11px] sm:text-xs text-cream-dim">
                  Contratação em 3 etapas sem sair da página
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
