import { XCircle, CheckCircle2 } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SECTION_IDS } from '@/content/site'

export function ComparisonSection() {
  const comparisons = [
    {
      criterion: 'Consultas em Birôs Públicos',
      negative: 'Exibição pública de pendências e restrições cadastrais para terceiros.',
      positive: 'Baixa e ocultação dos apontamentos em consultas externas de crédito.',
    },
    {
      criterion: 'Tentativas de Crédito e Cartão',
      negative: 'Recusa sumária logo na primeira triagem cadastral automatizada.',
      positive: 'Cadastro apto a passar da triagem inicial e avançar para análise do banco.',
    },
    {
      criterion: 'Contratos e Compras Faturadas (PJ)',
      negative: 'Bloqueio de limites com fornecedores e veto em certidões comerciais.',
      positive: 'CNPJ regularizado para negociar faturamento e compras com parceiros.',
    },
    {
      criterion: 'Locação de Imóveis e Serviços',
      negative: 'Exigência de caução excessiva, múltiplos fiadores ou rejeição cadastral.',
      positive: 'Processo de locação simplificado sem bloqueios na análise do CPF.',
    },
    {
      criterion: 'Paz e Estabilidade',
      negative: 'Insegurança constante ao realizar qualquer compra ou movimentação.',
      positive: 'Acompanhamento mensal com equipe cuidando da regularidade cadastral.',
    },
  ]

  return (
    <section
      id={SECTION_IDS.comparison}
      className="relative overflow-hidden border-t border-line bg-ink-sunken py-16 sm:py-32"
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Comparativo Direto"
          titleId="comparison-title"
          title="O impacto real de um CPF e CNPJ regularizados"
          description="Entenda claramente a diferença entre permanecer com o nome negativado e contar com o suporte ativo do Nome Limpo Express."
          alignment="center"
        />

        <div className="mt-12 sm:mt-20 overflow-hidden rounded-3xl border border-line bg-ink-raised shadow-2xl min-w-0">
          {/* Header da Tabela Desktop */}
          <div className="hidden grid-cols-12 border-b border-line bg-ink p-5 sm:p-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider sm:grid">
            <div className="col-span-4 text-cream-dim">Aspecto Analisado</div>
            <div className="col-span-4 text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Com Restrições no Nome
            </div>
            <div className="col-span-4 text-brand-light flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-signal" /> Com Nome Limpo Express
            </div>
          </div>

          {/* Linhas de Comparação */}
          <div className="divide-y divide-line/70">
            {comparisons.map((c) => (
              <div
                key={c.criterion}
                className="grid gap-3 p-4.5 sm:p-7 sm:grid-cols-12 sm:items-center sm:gap-6 transition-colors hover:bg-ink/50"
              >
                <div className="sm:col-span-4">
                  <span className="font-bold text-sm sm:text-base text-cream block sm:inline">
                    {c.criterion}
                  </span>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 sm:p-0 text-xs sm:text-sm text-red-300 sm:col-span-4 sm:border-0 sm:bg-transparent leading-relaxed font-normal">
                  <div className="flex items-start gap-2 sm:block">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 sm:hidden mt-0.5" />
                    <span>{c.negative}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 sm:p-0 text-xs sm:text-sm text-cream sm:col-span-4 sm:border-0 sm:bg-transparent leading-relaxed font-normal">
                  <div className="flex items-start gap-2 sm:block">
                    <CheckCircle2 className="h-4 w-4 text-signal shrink-0 sm:hidden mt-0.5" />
                    <span>{c.positive}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
