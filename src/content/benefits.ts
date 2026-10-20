import {
  ShieldCheck,
  TrendingUp,
  Building2,
  BadgeCheck,
  Clock,
  Sparkles,
} from 'lucide-react'

export interface BenefitItem {
  icon: typeof ShieldCheck
  title: string
  description: string
  tag: string
  highlight?: boolean
}

export const MAIN_BENEFITS: BenefitItem[] = [
  {
    icon: ShieldCheck,
    title: 'Não Exibição de Apontamentos',
    description:
      'Procedimentos técnicos e extrajudiciais para que restrições e pendências deixem de ser exibidas em consultas externas nos birôs de crédito.',
    tag: 'Segurança Cadastral',
    highlight: true,
  },
  {
    icon: TrendingUp,
    title: 'Recuperação Gradual do Score',
    description:
      'Com a limpeza dos registros negativos em consultas públicas, seu score e perfil cadastral ganham espaço para crescimento orgânico.',
    tag: 'Perfil Financeiro',
  },
  {
    icon: Building2,
    title: 'Válido para CPF & CNPJ',
    description:
      'Atendemos pessoas físicas que buscam reabilitar seu crédito e empresas que precisam destravar compras com fornecedores e certidões.',
    tag: 'Pessoa Física e Jurídica',
  },
  {
    icon: BadgeCheck,
    title: 'Garantia ou Seu Dinheiro de Volta',
    description:
      'Compromisso contratual claro: caso a regularização não seja concretizada no prazo pactuado, você tem garantia de reembolso integral.',
    tag: 'Risco Zero',
    highlight: true,
  },
  {
    icon: Clock,
    title: 'Manutenção Mensal Contínua',
    description:
      'Enquanto a assinatura de R$ 100,00/mês estiver ativa, nossa equipe monitora sua situação para garantir a estabilidade do cadastro.',
    tag: 'R$ 100/mês',
  },
  {
    icon: Sparkles,
    title: 'Processo 100% Digital e Seguro',
    description:
      'Sem burocracia física, sem filas e sem complicação. Ativação imediata com validação por token e pagamento PIX direto na tela.',
    tag: 'Agilidade',
  },
]

export const KEY_METRICS = [
  {
    value: '30-45d',
    label: 'Prazo médio de conclusão',
    detail: 'Dias úteis para baixa das restrições externas',
  },
  {
    value: '100%',
    label: 'Digital e sem burocracia',
    detail: 'Acompanhamento na plataforma e e-mail',
  },
  {
    value: 'R$ 100',
    label: 'Assinatura mensal fixa',
    detail: 'Sem multas e com cancelamento a qualquer momento',
  },
  {
    value: 'Garantia',
    label: 'Contratual documentada',
    detail: 'Resultado comprovado ou devolução',
  },
]
