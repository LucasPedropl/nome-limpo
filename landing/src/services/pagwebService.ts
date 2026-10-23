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
  paymentId: string
  txid: string
  amount: number
  pixEmv: string
  qrCodeUrl: string
  expiresAt: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  subscriptionId?: string
  coraInvoiceId?: string
  recurrentIntervalDays: number
  protocolo?: string
  token?: string
  cliente?: {
    id: string
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
    status: string
  }
}

export interface PaymentStatusCheckResult {
  paymentId: string
  txId: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  isPaid: boolean
  paidAt?: string
  amount: number
  protocolo?: string
  token?: string
  cliente?: {
    id: string
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
    status: string
  }
}

export interface ClientSession {
  token: string
  protocolo: string
  cliente: {
    id: string
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
    status: string
  }
  loggedAt: string
}

const STORAGE_PAYMENTS_KEY = 'nl_payments_state'
const STORAGE_SESSION_KEY = 'nl_client_session'
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'

// Contingência local (PIX/pagamento simulado) só existe em desenvolvimento; em produção a falha chega ao usuário
const LOCAL_FALLBACK_ENABLED = import.meta.env.DEV
export const PIX_UNAVAILABLE_MESSAGE = 'Não foi possível gerar o Pix agora. Tente novamente em alguns minutos.'

// Erro com mensagem pronta para exibir ao usuário
export class ApiError extends Error {}

async function readApiError(response: Response): Promise<string | undefined> {
  try {
    const data = await response.json()
    return data?.error || data?.message
  } catch {
    return undefined
  }
}

export const pagwebService = {
  /**
   * Salva a sessão autenticada do assinante localmente
   */
  saveSession(session: ClientSession) {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session))
      // Dispara evento para sincronizar cabeçalho e componentes
      window.dispatchEvent(new Event('nl_session_changed'))
    } catch {
      // ignore
    }
  },

  /**
   * Obtém a sessão atual do assinante
   */
  getSession(): ClientSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  /**
   * Encerra a sessão do assinante
   */
  clearSession() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY)
      window.dispatchEvent(new Event('nl_session_changed'))
    } catch {
      // ignore
    }
  },

  /**
   * Gera cobrança PIX imediata da 1ª mensalidade conectando à arquitetura Bixs Cora Gateway na API
   */
  async createPixCharge(params: CreatePixSubscriptionParams): Promise<PixChargeResponse> {
    const amount = params.amount || DEFAULT_PIX_SUBSCRIPTION.amount

    try {
      const response = await fetch(`${API_URL}/api/public/pagamentos/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeRazaoSocial: params.customerName,
          cpfCnpj: params.document,
          email: params.email,
          telefone: params.phone,
          tipoPessoa: params.document.replace(/\D/g, '').length > 11 ? 'PJ' : 'PF',
          dataNascimentoFundacao: params.birthDate,
          valor: amount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const charge: PixChargeResponse = {
          paymentId: data.paymentId || data.txId,
          txid: data.txId,
          amount: data.amount,
          pixEmv: data.pixEmv,
          qrCodeUrl: data.qrCodeUrl,
          expiresAt: data.expiresAt || new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          status: data.status === 'PAID' ? 'PAID' : 'PENDING',
          coraInvoiceId: data.coraInvoiceId,
          subscriptionId: data.assinaturaId,
          recurrentIntervalDays: 30,
        }

        try {
          const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
          stored[data.txId] = charge
          localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(stored))
        } catch {
          // ignore
        }

        return charge
      }

      if (!LOCAL_FALLBACK_ENABLED) {
        const apiError = response.status < 500 ? await readApiError(response) : undefined
        throw new ApiError(apiError || PIX_UNAVAILABLE_MESSAGE)
      }
    } catch (err) {
      // Fallback contingência local apenas em desenvolvimento
      if (!LOCAL_FALLBACK_ENABLED) {
        throw err instanceof ApiError ? err : new ApiError(PIX_UNAVAILABLE_MESSAGE)
      }
    }

    // Fallback local caso a API não esteja rodando (apenas em desenvolvimento)
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase()
    const txid = `nl_local_${Date.now().toString().slice(-6)}${randomHex}`
    const paymentId = `pay_${randomHex.toLowerCase()}`

    const pixEmv = generatePixEmv({
      pixKey: DEFAULT_PIX_SUBSCRIPTION.key,
      merchantName: DEFAULT_PIX_SUBSCRIPTION.name,
      merchantCity: DEFAULT_PIX_SUBSCRIPTION.city,
      amount,
      txid,
    })

    const expiresAt = new Date(Date.now() + 25 * 60 * 1000).toISOString()

    const charge: PixChargeResponse = {
      paymentId,
      txid,
      amount,
      pixEmv,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixEmv)}`,
      expiresAt,
      status: 'PENDING',
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
   * Consulta o status do pagamento em tempo real (polling oficial no Bixs Gateway)
   */
  async checkPaymentStatus(txid: string, paymentId?: string): Promise<PaymentStatusCheckResult> {
    const queryId = paymentId || txid

    try {
      const response = await fetch(`${API_URL}/api/public/pagamentos/${encodeURIComponent(queryId)}/status`)
      if (response.ok) {
        const data = await response.json()
        const isPaid = data.isPaid || data.status === 'PAID'

        if (isPaid && data.token && data.cliente) {
          this.saveSession({
            token: data.token,
            protocolo: data.protocolo || `NL-${new Date().getFullYear()}-0001`,
            cliente: data.cliente,
            loggedAt: new Date().toISOString(),
          })
        }

        return {
          paymentId: data.paymentId || queryId,
          txId: data.txId || txid,
          status: isPaid ? 'PAID' : 'PENDING',
          isPaid,
          paidAt: data.paidAt,
          amount: data.amount || 100,
          protocolo: data.protocolo,
          token: data.token,
          cliente: data.cliente,
        }
      }
    } catch {
      // Fallback storage local (apenas em desenvolvimento)
    }

    if (!LOCAL_FALLBACK_ENABLED) {
      throw new ApiError('Não foi possível consultar o pagamento agora. Tente novamente em alguns instantes.')
    }

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
      if (stored[txid]) {
        const isPaid = stored[txid].status === 'PAID'
        return {
          paymentId: stored[txid].paymentId || txid,
          txId: txid,
          status: stored[txid].status,
          isPaid,
          amount: stored[txid].amount,
          protocolo: stored[txid].protocolo,
          token: stored[txid].token,
          cliente: stored[txid].cliente,
        }
      }
    } catch {
      // ignore
    }

    return {
      paymentId: queryId,
      txId: txid,
      status: 'PENDING',
      isPaid: false,
      amount: 100,
    }
  },

  /**
   * Simulação / Confirmação imediata no ambiente de teste (idêntico ao Contratos confirmPaymentTest)
   */
  async simulatePaymentApproval(txid: string, paymentId?: string): Promise<PaymentStatusCheckResult> {
    const queryId = paymentId || txid

    if (!LOCAL_FALLBACK_ENABLED) {
      throw new ApiError('Confirmação de teste indisponível em produção.')
    }

    try {
      const response = await fetch(`${API_URL}/api/public/pagamentos/${encodeURIComponent(queryId)}/confirm-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token && data.cliente) {
          this.saveSession({
            token: data.token,
            protocolo: data.protocolo || `NL-${new Date().getFullYear()}-0001`,
            cliente: data.cliente,
            loggedAt: new Date().toISOString(),
          })
        }

        return {
          paymentId: data.paymentId || queryId,
          txId: data.txId || txid,
          status: 'PAID',
          isPaid: true,
          amount: data.amount || 100,
          protocolo: data.protocolo,
          token: data.token,
          cliente: data.cliente,
        }
      }
    } catch {
      // Contingência local
    }

    // Fallback simulado local
    const mockProtocolo = `NL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const mockCliente = {
      id: 'cli_demo',
      nomeRazaoSocial: 'Cliente Assinante',
      cpfCnpj: '000.000.000-00',
      email: 'cliente@nomelimpo.com.br',
      telefone: '31999999999',
      status: 'Ativo',
    }

    this.saveSession({
      token: 'jwt_mock_token_demo',
      protocolo: mockProtocolo,
      cliente: mockCliente,
      loggedAt: new Date().toISOString(),
    })

    return {
      paymentId: queryId,
      txId: txid,
      status: 'PAID',
      isPaid: true,
      amount: 100,
      protocolo: mockProtocolo,
      token: 'jwt_mock_token_demo',
      cliente: mockCliente,
    }
  },

  /**
   * Login do cliente existente via CPF/CNPJ ou Protocolo
   */
  async loginCliente(termo: string): Promise<ClientSession | null> {
    try {
      const response = await fetch(`${API_URL}/api/auth/cliente-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: termo, email: termo, protocolo: termo }),
      })

      if (response.ok) {
        const data = await response.json()
        const session: ClientSession = {
          token: data.token,
          protocolo: data.protocolo,
          cliente: data.cliente,
          loggedAt: new Date().toISOString(),
        }
        this.saveSession(session)
        return session
      }
    } catch {
      // ignore
    }
    return null
  },
}
