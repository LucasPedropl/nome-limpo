import { Check, ShieldCheck, Sparkles, ArrowRight, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED, SECTION_IDS } from '@/content/site'

interface HeroSectionProps {
  onOpenCheckout: () => void
}

export function HeroSection({ onOpenCheckout }: HeroSectionProps) {
  return (
    <section
      id={SECTION_IDS.hero}
      className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 lg:pt-24"
    >
      {/* Luz ambiente de fundo verde esmeralda e azul */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[38rem] w-[62rem] rounded-full bg-brand/15 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-10 h-72 w-72 rounded-full bg-accent/10 blur-[110px]"
      />

      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Lado Esquerdo: Headline e Conversão */}
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-brand/35 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand-light">
              <Sparkles className="h-4 w-4 animate-pulse text-brand-light" />
              <span>Para Pessoas Físicas (CPF) &amp; Empresas (CNPJ)</span>
            </div>

            <h1 className="font-wide mt-6 text-3xl sm:text-5xl md:text-6xl font-black text-cream leading-[1.22] sm:leading-[1.16] tracking-normal sm:tracking-tight text-balance">
              Recupere a sua paz e o seu crédito com o{' '}
              <span className="text-brand-light">
                Nome Limpo
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl leading-relaxed sm:leading-loose text-cream-dim/90 max-w-xl">
              Serviço especializado de manutenção e regularização cadastral. 
              Elimine a exibição de restrições em consultas externas e abra caminho 
              para reabilitar seu perfil financeiro por apenas <strong className="text-cream font-bold">{PLAN_PRICE_FORMATTED}/mês</strong>.
            </p>

            {/* Destaque dos 3 pilares principais do serviço */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <p className="text-sm sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Não Exibição em Consultas Externas:</strong> Procedimento para que apontamentos negativos deixem de ser consultados por terceiros.
                </p>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <p className="text-sm sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Garantia ou Seu Dinheiro de Volta:</strong> Prazo contratual de 30 a 45 dias úteis com garantia formal documentada.
                </p>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-line/60 bg-ink-raised/50 p-4 transition-all hover:border-brand/40">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-light">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <p className="text-sm sm:text-base text-cream leading-relaxed font-normal">
                  <strong className="font-bold text-cream">Assinatura Transparente:</strong> Sem taxas escondidas, mensalidade de{' '}
                  <span className="text-brand-light font-bold whitespace-nowrap">{PLAN_PRICE_FORMATTED}</span> via PIX e sem fidelidade.
                </p>
              </div>
            </div>

            {/* CTAs Principais */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                onClick={onOpenCheckout}
                size="lg"
                className="w-full sm:w-auto gap-2.5 text-base px-8 py-4"
              >
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span>Regularizar Agora (R$ 100/mês)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <a
                href={`#${SECTION_IDS.simulator}`}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-ink-raised px-6 py-4 text-sm font-semibold text-cream transition-colors hover:bg-line text-center"
              >
                <TrendingUp className="h-4 w-4 mr-2 text-accent-light" />
                Simular Impacto no Score
              </a>
            </div>

            {/* Badges de Confiança */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-mono text-cream-dim">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-signal" />
                Garantia ou Reembolso
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-light" />
                PIX Direto na Tela
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Sem Multa Rescisória
              </span>
            </div>
          </div>

          {/* Lado Direito: Mockup do Card Interativo de Diagnóstico Cadastral */}
          <div className="relative">
            <div className="relative mx-auto max-w-lg rounded-3xl border border-line/90 bg-ink-raised/90 p-7 sm:p-9 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 glow-box">
              {/* Header do Card */}
              <div className="flex items-center justify-between border-b border-line/80 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand-light font-black text-sm">
                    NL
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-cream">Diagnóstico Cadastral</h4>
                    <p className="text-xs text-cream-dim font-mono mt-0.5">Status: Em Análise Ativa</p>
                  </div>
                </div>
                <span className="rounded-full bg-signal/15 px-3 py-1 text-xs font-mono font-semibold text-signal">
                  ● Sistema Online
                </span>
              </div>

              {/* Score Gauge Visual */}
              <div className="mt-6 rounded-2xl border border-line bg-ink p-5 text-center">
                <span className="text-xs uppercase tracking-wider text-cream-dim font-mono block">
                  Evolução Estimada do Perfil
                </span>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="text-left">
                    <span className="text-xs text-red-400 font-mono block">Antes (Negativado)</span>
                    <span className="text-2xl sm:text-3xl font-black text-red-400 font-mono">240</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-6 w-6 text-brand-light animate-pulse" />
                    <span className="text-[10px] text-brand-light font-mono font-bold mt-1">REABILITAÇÃO</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-brand-light font-mono block">Após Regularização</span>
                    <span className="text-3xl sm:text-4xl font-black text-brand-light font-mono">780+</span>
                  </div>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ink-raised">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-brand" />
                </div>
              </div>

              {/* Checklist de Itens Processados */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-ink/70 px-4 py-3 text-xs sm:text-sm border border-line/60">
                  <span className="text-cream">Apontamentos em Birôs Públicos</span>
                  <span className="text-brand-light font-mono font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Baixa Extrajudicial
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-ink/70 px-4 py-3 text-xs sm:text-sm border border-line/60">
                  <span className="text-cream">Prazo de Execução</span>
                  <span className="text-cream font-mono font-medium">30 a 45 dias úteis</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-ink/70 px-4 py-3 text-xs sm:text-sm border border-line/60">
                  <span className="text-cream">Investimento Mensal</span>
                  <span className="text-brand-light font-mono font-bold text-sm sm:text-base">R$ 100,00</span>
                </div>
              </div>

              {/* Botão de Ação Rápida */}
              <div className="mt-7 pt-5 border-t border-line/80">
                <Button
                  onClick={onOpenCheckout}
                  size="lg"
                  className="w-full justify-center gap-2 py-3.5 text-base"
                >
                  <span>Iniciar Regularização Cadastral</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-2.5 text-center text-xs text-cream-dim">
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
