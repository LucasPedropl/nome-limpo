import {
  UserCheck,
  KeyRound,
  QrCode,
  FileCheck2,
  TrendingUp,
} from 'lucide-react'

export interface ProcessStep {
  step: string
  title: string
  description: string
  badge: string
  icon: typeof UserCheck
  duration: string
}

export const WORK_STEPS: ProcessStep[] = [
  {
    step: '01',
    title: 'Cadastro e Verificação por Token',
    description:
      'Você informa seus dados (CPF ou CNPJ, nome, e-mail e telefone) e confirma a titularidade com o token de segurança enviado para o seu e-mail.',
    badge: '1 minuto',
    icon: KeyRound,
    duration: 'Imediato',
  },
  {
    step: '02',
    title: 'Pagamento do PIX na Própria Tela',
    description:
      'Sem redirecionamento externo. O QR Code do PIX de R$ 100,00 é gerado na tela com código Copia e Cola. O sistema detecta o pagamento automaticamente.',
    badge: 'Confirmação instantânea',
    icon: QrCode,
    duration: 'Automático',
  },
  {
    step: '03',
    title: 'Ativação & Protocolo Contratual',
    description:
      'Ao compensar o PIX, sua assinatura é ativada. Você recebe imediatamente por e-mail o número do contrato, garantias e data estimada de conclusão.',
    badge: 'E-mail oficial',
    icon: FileCheck2,
    duration: 'No mesmo dia',
  },
  {
    step: '04',
    title: 'Execução e Baixa nos Birôs Externos',
    description:
      'Nossos procedimentos de manutenção cadastral atuam para que restrições deixem de ser exibidas em consultas externas de terceiros.',
    badge: 'Conclusão técnica',
    icon: TrendingUp,
    duration: '30 a 45 dias úteis',
  },
]
