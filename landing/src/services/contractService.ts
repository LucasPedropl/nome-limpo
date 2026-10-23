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

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'

export const contractService = {
  async createContract(data: {
    customerName: string
    document: string
    email: string
    phone: string
    birthDate?: string
    txid?: string
    paymentId?: string
  }): Promise<ContractData> {
    const today = new Date()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 45)

    // Tenta persistir diretamente na API do Backoffice NomeLimpo
    try {
      const response = await fetch(`${API_URL}/api/public/checkout/concluir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeRazaoSocial: data.customerName,
          cpfCnpj: data.document,
          email: data.email,
          telefone: data.phone,
          tipoPessoa: data.document.length > 14 ? 'PJ' : 'PF',
          dataNascimentoFundacao: data.birthDate,
          txId: data.txid,
          paymentId: data.paymentId,
        }),
      })

      if (response.ok) {
        const apiContract = await response.json()
        const contract: ContractData = {
          protocolNumber: apiContract.protocolNumber,
          contractDate: apiContract.contractDate,
          estimatedCompletionDate: apiContract.estimatedCompletionDate,
          customerName: apiContract.customerName,
          document: apiContract.document,
          email: apiContract.email,
          phone: apiContract.phone,
          planName: apiContract.planName,
          planAmountFormatted: apiContract.planAmountFormatted,
          warrantyTerms: apiContract.warrantyTerms,
          status: apiContract.status,
        }

        try {
          localStorage.setItem('nl_active_contract', JSON.stringify(contract))
        } catch {
          // ignore
        }

        return contract
      }
    } catch {
      // Fallback (apenas em desenvolvimento)
    }

    if (!import.meta.env.DEV) {
      throw new Error(
        'Pagamento recebido, mas não conseguimos carregar o seu contrato agora. Consulte a Área do Cliente com seu CPF/CNPJ em alguns minutos.'
      )
    }

    // Fallback local se a API estiver offline (apenas em desenvolvimento)
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
