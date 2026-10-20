export interface ContractData {
  protocolNumber: string
  contractDate: string
  estimatedCompletionDate: string
  customerName: string
  document: string
  email: string
  phone: string
  planName: string
  planAmountFormatted: string
  warrantyTerms: string
  status: 'ATIVO' | 'PROCESSANDO'
}

export const contractService = {
  createContract(data: {
    customerName: string
    document: string
    email: string
    phone: string
    birthDate?: string
  }): ContractData {
    const today = new Date()

    // Calcula 45 dias úteis (aproximadamente 63 dias corridos)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 45)

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const protocolNumber = `NL-${today.getFullYear()}-${randomSuffix}`

    const contract: ContractData = {
      protocolNumber,
      contractDate: today.toLocaleDateString('pt-BR'),
      estimatedCompletionDate: targetDate.toLocaleDateString('pt-BR'),
      customerName: data.customerName,
      document: data.document,
      email: data.email,
      phone: data.phone,
      planName: 'Plano Nome Limpo Mensal Recorrente',
      planAmountFormatted: 'R$ 100,00/mês',
      warrantyTerms:
        'Garantia contratual de 45 dias úteis ou restituição de 100% dos valores pagos, caso os apontamentos não deixem de ser exibidos em consultas externas nos órgãos de proteção ao crédito.',
      status: 'ATIVO',
    }

    try {
      localStorage.setItem('nl_active_contract', JSON.stringify(contract))
    } catch {
      // Ignore
    }

    return contract
  },

  getActiveContract(): ContractData | null {
    try {
      const raw = localStorage.getItem('nl_active_contract')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}
