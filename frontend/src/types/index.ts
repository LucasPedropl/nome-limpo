export interface Cliente {
  id: string
  tipoPessoa: 'PF' | 'PJ'
  nomeRazaoSocial: string
  cpfCnpj: string
  email: string
  telefone: string
  dataNascimentoFundacao?: string
  status: 'Ativo' | 'Inadimplente' | 'Cancelado'
  createdAt: string
  updatedAt: string
  processos?: Processo[]
  assinaturas?: Assinatura[]
  comunicacoes?: LogComunicacao[]
}

export interface Processo {
  id: string
  clienteId: string
  protocolo: string
  status: 'AguardandoPagamento' | 'EmProcessamento' | 'NotificacaoBiro' | 'EmAnalise' | 'Concluido' | 'Cancelado'
  birosNotificados: string
  dataInicio: string
  dataPrevistaConclusao: string
  dataConclusao?: string
  observacoes: string
  garantiaValida: boolean
  createdAt: string
  updatedAt: string
  cliente?: Cliente
  historico?: HistoricoStatus[]
}

export interface HistoricoStatus {
  id: string
  processoId: string
  status: string
  titulo: string
  descricao: string
  data: string
  autor: string
}

export interface Assinatura {
  id: string
  clienteId: string
  valorMensal: number
  status: 'Ativa' | 'Pendente' | 'Atrasada' | 'Cancelada'
  dataInicio: string
  proximoVencimento: string
  diaVencimento: number
  createdAt: string
  cliente?: Cliente
  cobrancas?: Cobranca[]
}

export interface Cobranca {
  id: string
  assinaturaId: string
  clienteId: string
  valor: number
  referenciaMes: string
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado'
  txId: string
  pixCopiaECola?: string
  qrCodeUrl?: string
  dataVencimento: string
  dataPagamento?: string
  createdAt: string
  assinatura?: Assinatura
}

export interface LogComunicacao {
  id: string
  clienteId: string
  tipo: string
  canal: 'Email' | 'WhatsApp'
  destinatario: string
  assunto: string
  conteudo: string
  status: 'Enviado' | 'Falha' | 'Pendente'
  dataEnvio: string
  cliente?: Cliente
}

export interface DashboardMetrics {
  totalClientes: number
  clientesAtivos: number
  clientesInadimplentes: number
  processosEmAndamento: number
  processosConcluidos: number
  receitaMensalRecorrente: number
  receitaTotalMesAtual: number
  taxaSucessoPercentual: number
  processosPertoVencimentoPrazo: number
}
