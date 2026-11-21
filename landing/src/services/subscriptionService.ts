/**
 * Assinatura por plano na Bixs: o checkout cria (ou entra na) conta do próprio cliente, assina o plano
 * e a Bixs cuida das mensalidades seguintes (fatura mensal, bloqueio e liberação).
 *
 * Liga quando VITE_NOMELIMPO_PLAN_ID tem o UUID do plano. Vale só para CPF: a autoassinatura da Bixs
 * é de pessoa física (empresa recebe 403), então CNPJ continua no Pix avulso do pagwebService.
 *
 * Rotas (docs da Bixs): register/person/send-code, register/person (com plan_id), auth/login,
 * auth/refresh, billing/me, billing/pix, billing/sync-payment, directory/plans/{id}/request.
 * Todas como o cliente: nada aqui usa a conta da landing.
 */
import { BixsError, bixsCustomerRequest } from '@/services/bixsApi'
import { ApiError, PIX_UNAVAILABLE_MESSAGE, type PaymentStatusCheckResult, type PixChargeResponse } from '@/services/pagwebService'
import { sendWhatsAppMessage, whatsappMessages } from '@/services/whatsappService'

const PLAN_ID = (import.meta.env.VITE_NOMELIMPO_PLAN_ID || '').trim()
// O login do cliente filtra a assinatura pela aplicação (source). Hoje o cadastro PF só concede plus-web.
const APP_SOURCE = (import.meta.env.VITE_NOMELIMPO_APP_SOURCE || 'plus-web').trim()
const STORAGE_AUTH_KEY = 'nl_customer_auth'

export const MIN_PASSWORD_LENGTH = 8

export function isPlanCheckout(docType: 'PF' | 'PJ'): boolean {
  return Boolean(PLAN_ID) && docType === 'PF'
}

interface CustomerAuth {
  email: string
  accessToken: string
  refreshToken?: string
}

interface LoginPayload {
  access_token?: string
  token?: string
  refresh_token?: string
}

interface BillingMe {
  subscription?: { id?: string; status?: string; payment_status?: string; plan_id?: string }
  current_invoice?: { id?: string; amount_cents?: number; due_date?: string; status?: string; pix_emv?: string; paid_at?: string }
  payable?: boolean
}

export interface PlanCheckoutParams {
  customerName: string
  email: string
  document: string
  phone: string
  password: string
  verificationCode?: string // Sem código = conta já existe e entra com a senha
}

// Fica só nesta aba: a conta serve para o checkout acompanhar o pagamento
function readAuth(): CustomerAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_AUTH_KEY)
    return raw ? (JSON.parse(raw) as CustomerAuth) : null
  } catch {
    return null
  }
}

let auth: CustomerAuth | null = readAuth()

function saveAuth(email: string, login: LoginPayload | null | undefined): boolean {
  const accessToken = login?.access_token || login?.token
  if (!accessToken) return false
  auth = { email, accessToken, refreshToken: login?.refresh_token }
  try {
    sessionStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(auth))
  } catch {
    // ignore
  }
  return true
}

async function login(email: string, password: string): Promise<void> {
  let res: LoginPayload
  try {
    res = await bixsCustomerRequest<LoginPayload>('v1/auth/login', {
      method: 'POST',
      body: { email, password, source: APP_SOURCE, account_kind: 'person' },
    })
  } catch (err) {
    if (err instanceof BixsError && (err.status === 401 || err.status === 403)) {
      throw new ApiError('Este e-mail já tem cadastro e a senha não confere. Confira a senha ou fale com a gente no WhatsApp.')
    }
    throw new ApiError(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
  }
  if (!saveAuth(email, res)) throw new ApiError('O gateway não devolveu o acesso da sua conta. Tente novamente.')
}

async function refresh(): Promise<boolean> {
  if (!auth?.refreshToken) return false
  try {
    const res = await bixsCustomerRequest<LoginPayload>('v1/auth/refresh', { method: 'POST', body: { token: auth.refreshToken } })
    return saveAuth(auth.email, { ...res, refresh_token: res.refresh_token || auth.refreshToken })
  } catch {
    return false
  }
}

async function customerRequest<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
  if (!auth) throw new ApiError('Sua sessão de pagamento expirou. Refaça o cadastro para gerar o Pix.')
  const body = method === 'POST' ? {} : undefined
  try {
    return await bixsCustomerRequest<T>(path, { method, body, token: auth.accessToken })
  } catch (err) {
    if (err instanceof BixsError && err.status === 401 && (await refresh())) {
      return bixsCustomerRequest<T>(path, { method, body, token: auth.accessToken })
    }
    throw err
  }
}

function toCharge(me: BillingMe): PixChargeResponse {
  const invoice = me.current_invoice
  if (!invoice?.pix_emv) throw new ApiError(PIX_UNAVAILABLE_MESSAGE)
  const id = invoice.id || me.subscription?.id || ''
  return {
    paymentId: id,
    txid: id,
    amount: (invoice.amount_cents || 0) / 100,
    pixEmv: invoice.pix_emv,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invoice.pix_emv)}`,
    expiresAt: invoice.due_date || '',
    dueDate: invoice.due_date,
    status: 'PENDING',
    recurrentIntervalDays: 30,
  }
}

function isSubscriptionPaid(me: BillingMe): boolean {
  const sub = me.subscription
  return sub?.status === 'active' && (sub.payment_status === 'ok' || !sub.payment_status) && !me.payable
}

function paidCharge(me: BillingMe): PixChargeResponse {
  const id = me.subscription?.id || ''
  return { paymentId: id, txid: id, amount: 0, pixEmv: '', qrCodeUrl: '', expiresAt: '', status: 'PAID', recurrentIntervalDays: 30 }
}

/** Conta que já existia: reaproveita o Pix em aberto deste plano ou assina de novo */
async function chargeForExistingAccount(): Promise<PixChargeResponse> {
  const me = await customerRequest<BillingMe>('v1/api/billing/me')
  if (isSubscriptionPaid(me) && me.subscription?.plan_id === PLAN_ID) return paidCharge(me)

  const samePlanOpen = me.subscription?.status === 'pending_payment' && me.subscription.plan_id === PLAN_ID
  if (samePlanOpen && me.current_invoice?.pix_emv) return toCharge(me)

  // Assinar cancela a assinatura aberta anterior e emite a fatura do plano
  try {
    await customerRequest(`v1/api/directory/plans/${encodeURIComponent(PLAN_ID)}/request`, 'POST')
  } catch (err) {
    throw new ApiError(err instanceof BixsError && err.detail ? `${PIX_UNAVAILABLE_MESSAGE} (${err.detail})` : PIX_UNAVAILABLE_MESSAGE)
  }
  return toCharge(await customerRequest<BillingMe>('v1/api/billing/pix', 'POST'))
}

async function registerAndSubscribe(params: PlanCheckoutParams & { verificationCode: string }): Promise<PixChargeResponse> {
  let res: { login?: LoginPayload | null }
  try {
    res = await bixsCustomerRequest<{ login?: LoginPayload | null }>('v1/auth/register/person', {
      method: 'POST',
      body: {
        email: params.email,
        name: params.customerName.trim(),
        cpf: params.document.replace(/\D/g, ''),
        password: params.password,
        cellphone: params.phone.replace(/\D/g, '') || undefined,
        verification_code: params.verificationCode,
        plan_id: PLAN_ID,
      },
    })
  } catch (err) {
    if (err instanceof BixsError && err.status === 401) throw new ApiError('Código inválido ou vencido. Confira o e-mail ou peça um novo.')
    if (err instanceof BixsError && err.status === 409) throw new ApiError('Este e-mail já tem cadastro. Volte e informe a senha dessa conta.')
    if (err instanceof BixsError && err.status === 400) throw new ApiError(err.detail || 'Confira os dados do cadastro.')
    throw new ApiError(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
  }

  // A conta foi criada mesmo se o login da resposta vier vazio
  if (!saveAuth(params.email, res.login)) await login(params.email, params.password)
  return toCharge(await customerRequest<BillingMe>('v1/api/billing/pix', 'POST'))
}

export const subscriptionService = {
  /**
   * Código do cadastro no e-mail. E-mail já cadastrado não recebe código: entra com a senha.
   */
  async sendSignupCode(email: string): Promise<{ status: 'sent'; expiresAt: number } | { status: 'exists' }> {
    try {
      const res = await bixsCustomerRequest<{ expires_in_seconds?: number } | null>('v1/auth/register/person/send-code', {
        method: 'POST',
        body: { email },
      })
      const seconds = Number(res?.expires_in_seconds) || 900
      return { status: 'sent', expiresAt: Date.now() + seconds * 1000 }
    } catch (err) {
      if (err instanceof BixsError && err.status === 409) return { status: 'exists' }
      if (err instanceof BixsError && err.status === 503) {
        throw new ApiError('O envio de e-mail está indisponível agora. Tente novamente em alguns minutos.')
      }
      throw new ApiError(err instanceof Error ? err.message : 'Não conseguimos enviar o código para o seu e-mail.')
    }
  },

  /**
   * Cria a conta e assina o plano (com código) ou entra na conta existente (sem código).
   * Devolve o Pix da 1ª mensalidade, ou status PAID se a assinatura já está paga.
   */
  async subscribe(params: PlanCheckoutParams): Promise<PixChargeResponse> {
    const email = params.email.trim().toLowerCase()
    let charge: PixChargeResponse
    if (params.verificationCode) {
      charge = await registerAndSubscribe({ ...params, email, verificationCode: params.verificationCode })
    } else {
      await login(email, params.password)
      charge = await chargeForExistingAccount()
    }

    if (charge.status === 'PENDING') {
      void (async () => {
        const first = await sendWhatsAppMessage(params.phone, params.customerName, whatsappMessages.pix(params.customerName, charge.amount))
        if (first.sent) await sendWhatsAppMessage(params.phone, params.customerName, charge.pixEmv)
      })()
    }
    return charge
  },

  /**
   * Situação da assinatura. manual = botão "Verificar": pede para a Bixs conferir na Cora.
   */
  async checkPaymentStatus(manual = false): Promise<PaymentStatusCheckResult> {
    let me: BillingMe
    try {
      me = manual
        ? await customerRequest<BillingMe>('v1/api/billing/sync-payment', 'POST')
        : await customerRequest<BillingMe>('v1/api/billing/me')
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError('Não foi possível consultar o pagamento agora. Tente novamente em alguns instantes.')
    }
    const isPaid = isSubscriptionPaid(me)
    const id = me.current_invoice?.id || me.subscription?.id || ''
    return {
      paymentId: id,
      txId: id,
      status: isPaid ? 'PAID' : 'PENDING',
      isPaid,
      paidAt: me.current_invoice?.paid_at,
      amount: (me.current_invoice?.amount_cents || 0) / 100,
    }
  },

  /**
   * Mensagem de pagamento confirmado no WhatsApp, uma vez por pagamento
   */
  async notifyPaymentConfirmed(paymentId: string, phone: string, name: string, protocol: string, estimatedDate: string) {
    const flag = `nl_whatsapp_pago_${paymentId}`
    try {
      if (!paymentId || localStorage.getItem(flag)) return
      localStorage.setItem(flag, '1')
    } catch {
      return
    }
    await sendWhatsAppMessage(phone, name, whatsappMessages.paid(name, protocol, estimatedDate))
  },
}
