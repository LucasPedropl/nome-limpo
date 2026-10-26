import { bixsRequest, BixsError } from '@/services/bixsApi'
import { sendWhatsAppMessage, whatsappMessages } from '@/services/whatsappService'

/**
 * Pix da 1ª mensalidade direto no gateway Bixs (fatura Cora), sem servidor próprio.
 * O status é consultado na própria Bixs; a sessão do assinante fica só neste navegador.
 */

export const MONTHLY_AMOUNT = 100

export interface CreatePixSubscriptionParams {
  customerName: string
  document: string
  email: string
  phone: string
  birthDate?: string
  verificationToken: string // Comprovante do código confirmado no WhatsApp ('' quando a etapa está desligada)
}

export interface PixChargeResponse {
  paymentId: string // id (UUID) da fatura na Bixs: a rota de status só aceita ele, não o cora_invoice_id
  coraInvoiceId?: string
  txid: string // external_code
  amount: number
  pixEmv: string
  qrCodeUrl: string
  expiresAt: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  recurrentIntervalDays: number
}

export interface PaymentStatusCheckResult {
  paymentId: string
  txId: string
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  isPaid: boolean
  paidAt?: string
  amount: number
}

export interface ClientSession {
  protocolo: string
  cliente: {
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
  }
  loggedAt: string
}

interface BixsInvoice {
  id?: string
  amount?: number
  total_paid?: number
  cora_invoice_id?: string
  external_code?: string
  pix_emv?: string
  status?: string
  paid_at?: string
}

const STORAGE_PAYMENTS_KEY = 'nl_payments_state'
const STORAGE_SESSION_KEY = 'nl_client_session'
const PIX_WINDOW_MS = 25 * 60 * 1000

export const PIX_UNAVAILABLE_MESSAGE = 'Não foi possível gerar o Pix agora. Tente novamente em alguns minutos.'

// Erro com mensagem pronta para exibir ao usuário
export class ApiError extends Error {}

type StoredCharge = PixChargeResponse & { document: string; customerName: string; phone: string; createdAt: number }

function readStoredCharges(): Record<string, StoredCharge> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PAYMENTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function storeCharge(charge: StoredCharge) {
  try {
    const stored = readStoredCharges()
    stored[charge.paymentId] = charge
    localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(stored))
  } catch {
    // ignore
  }
}

function addDays(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export const pagwebService = {
  /**
   * Salva a sessão do assinante neste navegador (cabeçalho e Área do Cliente)
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

  getSession(): ClientSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY)
      window.dispatchEvent(new Event('nl_session_changed'))
    } catch {
      // ignore
    }
  },

  /**
   * Gera a fatura Pix da 1ª mensalidade na Bixs e manda os dados do Pix no WhatsApp (se ligado)
   */
  async createPixCharge(params: CreatePixSubscriptionParams): Promise<PixChargeResponse> {
    const document = params.document.replace(/\D/g, '')

    // Mesmo CPF/CNPJ neste navegador nos últimos 25 min: reaproveita o Pix em vez de gerar outro
    const reuse = Object.values(readStoredCharges()).find(
      (c) => c.document === document && c.status === 'PENDING' && Date.now() - c.createdAt < PIX_WINDOW_MS
    )
    if (reuse) return reuse

    const externalCode = `nl_${document}_${Math.floor(Date.now() / 1000)}`
    let invoice: BixsInvoice
    try {
      invoice = await bixsRequest<BixsInvoice>('v1/api/payment/invoices', {
        method: 'POST',
        withApiKey: true,
        body: {
          amount: MONTHLY_AMOUNT * 100,
          payment_type: 'pix',
          external_code: externalCode,
          due_date: addDays(3),
          service_name: '1ª Mensalidade - Nome Limpo Express',
          service_desc: 'Assinatura do serviço de manutenção e regularização de nome limpo para CPF/CNPJ.',
          customer_payment: {
            name: params.customerName.trim(),
            email: params.email.trim().toLowerCase(),
            phone: params.phone.replace(/\D/g, '') || '31999999999',
            document,
            document_type: document.length > 11 ? 'CNPJ' : 'CPF',
            // A Bixs exige endereço e o checkout não pede: endereço comercial padrão
            address: {
              street: 'Av. Principal',
              number: '100',
              district: 'Centro',
              city: 'Belo Horizonte',
              state: 'MG',
              zip_code: '30140071',
              country: 'BRA',
            },
          },
        },
      })
    } catch (err) {
      throw new ApiError(err instanceof BixsError ? `${PIX_UNAVAILABLE_MESSAGE} (${err.message})` : PIX_UNAVAILABLE_MESSAGE)
    }

    if (!invoice?.pix_emv) {
      throw new ApiError(PIX_UNAVAILABLE_MESSAGE)
    }

    // A criação devolve a fatura com o id; se vier sem, acha na listagem (mais recentes primeiro)
    let invoiceId = invoice.id
    if (!invoiceId) {
      try {
        const list = await bixsRequest<{ items?: BixsInvoice[] }>('v1/api/payment/invoices', { withApiKey: true })
        invoiceId = list?.items?.find(
          (i) => i.external_code === externalCode || (invoice.cora_invoice_id && i.cora_invoice_id === invoice.cora_invoice_id)
        )?.id
      } catch {
        // sem id o Pix ainda é pago normalmente; só a confirmação automática na tela fica indisponível
      }
    }

    const charge: StoredCharge = {
      paymentId: invoiceId || externalCode,
      coraInvoiceId: invoice.cora_invoice_id,
      txid: invoice.external_code || externalCode,
      amount: MONTHLY_AMOUNT,
      pixEmv: invoice.pix_emv,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invoice.pix_emv)}`,
      expiresAt: new Date(Date.now() + PIX_WINDOW_MS).toISOString(),
      status: 'PENDING',
      recurrentIntervalDays: 30,
      document,
      customerName: params.customerName.trim(),
      phone: params.phone,
      createdAt: Date.now(),
    }
    storeCharge(charge)

    // Dados do Pix também no WhatsApp (não segura a tela do Pix)
    void (async () => {
      const first = await sendWhatsAppMessage(params.phone, charge.customerName, whatsappMessages.pix(charge.customerName, charge.amount))
      if (first.sent) await sendWhatsAppMessage(params.phone, charge.customerName, charge.pixEmv)
    })()

    return charge
  },

  /**
   * Consulta a fatura na Bixs (polling da tela do Pix)
   */
  async checkPaymentStatus(txid: string, paymentId?: string): Promise<PaymentStatusCheckResult> {
    const id = paymentId || txid
    const stored = readStoredCharges()[id]

    let invoice: BixsInvoice
    try {
      invoice = await bixsRequest<BixsInvoice>(`v1/api/payment/invoices/${encodeURIComponent(id)}`, { withApiKey: true })
    } catch {
      throw new ApiError('Não foi possível consultar o pagamento agora. Tente novamente em alguns instantes.')
    }

    const expectedCents = (stored?.amount ?? MONTHLY_AMOUNT) * 100
    const paidCents = invoice?.total_paid || invoice?.amount || 0
    const isPaid = (invoice?.status || '').toUpperCase() === 'PAID' && paidCents >= expectedCents

    if (isPaid && stored && stored.status !== 'PAID') {
      storeCharge({ ...stored, status: 'PAID' })
    }

    return {
      paymentId: id,
      txId: invoice?.external_code || txid,
      status: isPaid ? 'PAID' : 'PENDING',
      isPaid,
      paidAt: invoice?.paid_at,
      amount: paidCents / 100 || MONTHLY_AMOUNT,
    }
  },

  /**
   * Confirmação imediata para testar a tela (só em desenvolvimento: não passa pela Bixs)
   */
  async simulatePaymentApproval(txid: string, paymentId?: string): Promise<PaymentStatusCheckResult> {
    if (!import.meta.env.DEV) {
      throw new ApiError('Confirmação de teste indisponível em produção.')
    }
    const id = paymentId || txid
    const stored = readStoredCharges()[id]
    if (stored) storeCharge({ ...stored, status: 'PAID' })
    return { paymentId: id, txId: txid, status: 'PAID', isPaid: true, amount: MONTHLY_AMOUNT }
  },

  /**
   * Mensagem de pagamento confirmado no WhatsApp, uma vez por fatura
   */
  async notifyPaymentConfirmed(paymentId: string, protocol: string, estimatedDate: string) {
    const stored = readStoredCharges()[paymentId]
    const flag = `nl_whatsapp_pago_${paymentId}`
    try {
      if (!stored || localStorage.getItem(flag)) return
      localStorage.setItem(flag, '1')
    } catch {
      return
    }
    await sendWhatsAppMessage(stored.phone, stored.customerName, whatsappMessages.paid(stored.customerName, protocol, estimatedDate))
  },
}
