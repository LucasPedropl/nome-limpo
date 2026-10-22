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
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'

export const pagwebService = {
  /**
   * Gera cobrança PIX imediata na tela conectando à API oficial
   */
  async createPixCharge(params: CreatePixSubscriptionParams): Promise<PixChargeResponse> {
    const amount = params.amount || DEFAULT_PIX_SUBSCRIPTION.amount

    try {
      const response = await fetch(`${API_URL}/api/public/checkout/iniciar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeRazaoSocial: params.customerName,
          cpfCnpj: params.document,
          email: params.email,
          telefone: params.phone,
          tipoPessoa: params.document.length > 14 ? 'PJ' : 'PF',
          valor: amount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const charge: PixChargeResponse = {
          txid: data.txid,
          amount: data.amount,
          pixEmv: data.pixEmv,
          qrCodeUrl: data.qrCodeUrl,
          expiresAt: data.expiresAt,
          status: 'PENDING',
          subscriptionId: data.subscriptionId,
          recurrentIntervalDays: 30,
        }

        try {
          const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
          stored[data.txid] = charge
          localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(stored))
        } catch {
          // ignore
        }

        return charge
      }
    } catch {
      // Fallback local caso a API esteja temporariamente fora
    }

    // Fallback local
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase()
    const txid = `NL${Date.now().toString().slice(-6)}${randomHex}`
    const subscriptionId = `SUB-NL-${Date.now().toString().slice(-5)}`

    const pixEmv = generatePixEmv({
      pixKey: DEFAULT_PIX_SUBSCRIPTION.key,
      merchantName: DEFAULT_PIX_SUBSCRIPTION.name,
      merchantCity: DEFAULT_PIX_SUBSCRIPTION.city,
      amount,
      txid,
    })

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

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
      // ignore
    }

    return charge
  },

  /**
   * Consulta o status do pagamento
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
   * Simula a confirmação instantânea do PIX (disparando webhook para a API e atualizando localmente)
   */
  async simulatePaymentApproval(txid: string): Promise<boolean> {
    try {
      // Notifica o endpoint de webhook na API
      fetch(`${API_URL}/api/webhooks/pix-confirmacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: txid, status: 'PAID' }),
      }).catch(() => {})

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
    return true
  },

  /**
   * Gestão de recorrência
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
