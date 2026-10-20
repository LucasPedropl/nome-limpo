import { generatePixEmv, DEFAULT_PIX_SUBSCRIPTION } from '@/lib/pix'

export interface CreatePixSubscriptionParams {
  customerName: string
  document: string
  email: string
  phone: string
  birthDate?: string
  amount?: number
}

export interface PixChargeResponse {
  txid: string
  amount: number
  pixEmv: string
  qrCodeUrl: string
  expiresAt: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  subscriptionId: string
  recurrentIntervalDays: number
}

export interface SubscriptionStatus {
  subscriptionId: string
  status: 'ACTIVE' | 'PENDING_PAYMENT' | 'OVERDUE' | 'CANCELLED'
  planName: string
  monthlyAmount: number
  lastPaymentAt?: string
  nextBillingAt: string
  delinquencyNotice?: string
}

const STORAGE_PAYMENTS_KEY = 'nl_payments_state'

export const pagwebService = {
  /**
   * Gera cobrança PIX imediata na tela simulando contrato da PagWeb API / Cora
   */
  async createPixCharge(params: CreatePixSubscriptionParams): Promise<PixChargeResponse> {
    const amount = params.amount || DEFAULT_PIX_SUBSCRIPTION.amount
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase()
    const txid = `NL${Date.now().toString().slice(-6)}${randomHex}`
    const subscriptionId = `SUB-NL-${Date.now().toString().slice(-5)}`

    // Gera o código EMV BACEN real
    const pixEmv = generatePixEmv({
      pixKey: DEFAULT_PIX_SUBSCRIPTION.key,
      merchantName: DEFAULT_PIX_SUBSCRIPTION.name,
      merchantCity: DEFAULT_PIX_SUBSCRIPTION.city,
      amount,
      txid,
    })

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

    const charge: PixChargeResponse = {
      txid,
      amount,
      pixEmv,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixEmv)}`,
      expiresAt,
      status: 'PENDING',
      subscriptionId,
      recurrentIntervalDays: 30,
    }

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
      stored[txid] = charge
      localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(stored))
    } catch {
      // Fallback local
    }

    // Delay de rede realista
    await new Promise((res) => setTimeout(res, 500))

    return charge
  },

  /**
   * Consulta o status do pagamento (polling ou webhook callback)
   */
  async checkPaymentStatus(txid: string): Promise<'PENDING' | 'PAID' | 'EXPIRED'> {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
      if (stored[txid]) {
        return stored[txid].status
      }
    } catch {
      // Ignore
    }
    return 'PENDING'
  },

  /**
   * Simula a confirmação instantânea do PIX (webhook emitido pela PagWeb / Cora)
   */
  async simulatePaymentApproval(txid: string): Promise<boolean> {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
      if (stored[txid]) {
        stored[txid].status = 'PAID'
        stored[txid].paidAt = new Date().toISOString()
        localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(stored))
        return true
      }
    } catch {
      // Ignore
    }
    return false
  },

  /**
   * Gestão de recorrência: cancelamento e reativação
   */
  async toggleSubscription(subscriptionId: string, action: 'CANCEL' | 'REACTIVATE'): Promise<SubscriptionStatus> {
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)

    return {
      subscriptionId,
      status: action === 'CANCEL' ? 'CANCELLED' : 'ACTIVE',
      planName: 'Plano Nome Limpo Mensal Recorrente',
      monthlyAmount: 100.0,
      nextBillingAt: nextMonth.toLocaleDateString('pt-BR'),
      delinquencyNotice:
        action === 'CANCEL'
          ? 'Assinatura pausada a pedido do titular. Os serviços de monitoramento foram suspensos.'
          : undefined,
    }
  },
}
