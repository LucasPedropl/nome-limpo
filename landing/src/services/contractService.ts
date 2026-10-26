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

const STORAGE_CONTRACT_KEY = 'nl_active_contract'

/**
 * Contrato da assinatura depois do Pix confirmado. Sem servidor próprio, ele é montado aqui e fica
 * salvo neste navegador; o protocolo vai também no WhatsApp do cliente.
 */
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
    // Mesmo pagamento: devolve o mesmo contrato (a tela pode chamar de novo)
    const existing = this.getActiveContract()
    if (existing && existing.document === data.document && existing.paymentId === data.paymentId) {
      return existing
    }

    const today = new Date()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 45)

    // Protocolo derivado do id do pagamento: o mesmo Pix dá sempre o mesmo número
    const seed = (data.paymentId || data.txid || String(Date.now())).split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9000, 7)
    const protocolNumber = `NL-${today.getFullYear()}-${1000 + seed}`

    const contract: ContractData & { paymentId?: string } = {
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
      paymentId: data.paymentId,
    }

    try {
      localStorage.setItem(STORAGE_CONTRACT_KEY, JSON.stringify(contract))
    } catch {
      // ignore
    }

    return contract
  },

  getActiveContract(): (ContractData & { paymentId?: string }) | null {
    try {
      const raw = localStorage.getItem(STORAGE_CONTRACT_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}
