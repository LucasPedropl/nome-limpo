import { useState } from 'react'
import {
  TrendingUp,
  CreditCard,
  Building,
  Home,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { PLAN_PRICE_FORMATTED, SECTION_IDS } from '@/content/site'

interface ScoreSimulatorProps {
  onOpenCheckout: (initialDocumentType?: 'PF' | 'PJ') => void
}

export function ScoreSimulatorSection({ onOpenCheckout }: ScoreSimulatorProps) {
  const [docType, setDocType] = useState<'PF' | 'PJ'>('PF')
  const [debtCount, setDebtCount] = useState<number>(2)
  const [goal, setGoal] = useState<string>('cartao')

  const goalsPF = [
    { id: 'cartao', label: 'Cartão de Crédito', icon: CreditCard, benefit: 'Acesso a limites de compras sem recusa imediata' },
    { id: 'financiamento', label: 'Carro ou Imóvel', icon: Home, benefit: 'Condição cadastral favorável para análise de crédito' },
    { id: 'paz', label: 'Paz Financeira', icon: Shield, benefit: 'Fim dos apontamentos públicos em seu CPF' },
  ]

  const goalsPJ = [
    { id: 'fornecedor', label: 'Prazo com Fornecedores', icon: Building, benefit: 'Liberação de compras faturadas no CNPJ' },
    { id: 'capital', label: 'Capital de Giro', icon: TrendingUp, benefit: 'Elegibilidade cadastral para linhas produtivas' },
    { id: 'certidoes', label: 'Certidões & Contratos', icon: Shield, benefit: 'Regularidade perante birôs e clientes B2B' },
  ]

  const currentGoals = docType === 'PF' ? goalsPF : goalsPJ
  const selectedGoalObj = currentGoals.find((g) => g.id === goal) || currentGoals[0]

  return (
    <section
      id={SECTION_IDS.simulator}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-20 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-5 sm:px-8">
        <SectionHeader
          eyebrow="Simulador Interativo"
          titleId="simulator-title"
          title="Simule o impacto da regularização no seu dia a dia"
          description="Descubra em tempo real como o fim da exibição de apontamentos negativos destrava novas oportunidades financeiras e comerciais."
          alignment="center"
        />

        <div className="mt-16 sm:mt-20 grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Controles da Simulação com Mais Espaçamento */}
          <div className="rounded-3xl border border-line bg-ink-raised p-8 sm:p-10 lg:col-span-7 space-y-8 shadow-xl">
            {/* Seletor PF ou PJ */}
            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-cream-dim block mb-3.5">
                1. Selecione o Tipo de Cadastro
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDocType('PF')
                    setGoal('cartao')
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-4 px-5 text-sm font-bold transition-all ${
                    docType === 'PF'
                      ? 'border-brand bg-brand/15 text-brand-light ring-2 ring-brand/30 shadow-md'
                      : 'border-line bg-ink text-cream-dim hover:text-cream hover:bg-line/50'
                  }`}
                >
                  <span>Pessoa Física (CPF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocType('PJ')
                    setGoal('fornecedor')
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-4 px-5 text-sm font-bold transition-all ${
                    docType === 'PJ'
                      ? 'border-brand bg-brand/15 text-brand-light ring-2 ring-brand/30 shadow-md'
                      : 'border-line bg-ink text-cream-dim hover:text-cream hover:bg-line/50'
                  }`}
                >
                  <span>Empresa (CNPJ)</span>
                </button>
              </div>
            </div>

            {/* Slider de Quantidade de Apontamentos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-cream-dim">
                  2. Quantidade Estimada de Restrições
                </label>
                <span className="font-mono text-base font-black text-brand-light">
                  {debtCount === 1 ? '1 restrição' : debtCount >= 5 ? '5 ou mais restrições' : `${debtCount} restrições`}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={debtCount}
                onChange={(e) => setDebtCount(parseInt(e.target.value, 10))}
                className="w-full accent-brand cursor-pointer h-2.5 bg-ink rounded-lg"
              />
              <div className="flex justify-between text-xs text-cream-dim font-mono mt-2">
                <span>1 dívida</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5+ dívidas</span>
              </div>
            </div>

            {/* Objetivo Principal */}
            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-cream-dim block mb-3.5">
                3. Qual o Seu Principal Objetivo com o Nome Limpo?
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {currentGoals.map((g) => {
                  const Icon = g.icon
                  const isSelected = goal === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-4.5 text-center transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand-light ring-2 ring-brand/30 shadow-md'
                          : 'border-line bg-ink text-cream-dim hover:text-cream hover:bg-line/40'
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2.5" />
                      <span className="text-xs sm:text-sm font-bold leading-tight">{g.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Resultado Projetado da Simulação */}
          <div className="rounded-3xl border border-brand/40 bg-ink-raised p-8 sm:p-10 lg:col-span-5 relative glow-box shadow-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3.5 py-1.5 text-xs font-mono font-bold text-brand-light">
              <Sparkles className="h-4 w-4" />
              <span>Projeção Cadastral Personalizada</span>
            </div>

            <div className="mt-7 space-y-5">
              <div className="rounded-2xl border border-line bg-ink p-5 sm:p-6">
                <span className="text-xs text-cream-dim font-mono block mb-1">Status Atual Previsto</span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-red-400">Restrição em Birôs de Crédito</span>
                  <span className="font-mono text-xs font-bold text-red-400">Score &lt; 300</span>
                </div>
              </div>

              <div className="rounded-2xl border border-brand/50 bg-brand/10 p-5 sm:p-6">
                <span className="text-xs text-brand-light font-mono block mb-1">Após Manutenção com Nome Limpo</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-cream flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-signal" />
                    Apontamentos Ocultados
                  </span>
                  <span className="font-mono text-xs font-bold text-signal px-2 py-0.5 rounded-md bg-signal/15">Regularizado</span>
                </div>
                <p className="mt-3 text-sm text-cream-dim/95 leading-relaxed font-normal">
                  {selectedGoalObj.benefit}.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-ink p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream-dim">Prazo de Baixa Externa:</span>
                  <span className="font-mono font-bold text-cream">30 a 45 dias úteis</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-line/60">
                  <span className="text-cream-dim">Assinatura Mensal:</span>
                  <span className="font-mono font-black text-brand-light text-xl">{PLAN_PRICE_FORMATTED}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-2">
              <Button
                onClick={() => onOpenCheckout(docType)}
                size="lg"
                className="w-full justify-center gap-2.5 py-4 text-base shadow-xl"
              >
                <span>Contratar Plano para {docType === 'PF' ? 'Meu CPF' : 'Minha Empresa'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-center text-xs text-cream-dim font-normal">
                Ativação imediata via PIX. Garantia contratual documentada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
