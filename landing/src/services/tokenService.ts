/**
 * Código de confirmação do checkout.
 * Principal: OTP no e-mail do titular pela Bixs (/v1/api/email-verification), gerado e conferido
 * lá, 6 dígitos, 15 minutos, uso único. Confirma que o e-mail é da pessoa.
 * Reserva: se o e-mail não sair (SMTP da Bixs fora) e o WhatsApp da empresa estiver ligado, o código
 * vai pelo WhatsApp. Esse é gerado e conferido no navegador: confirma o telefone, não é barreira
 * contra quem mexe no navegador.
 */
import { BixsError, bixsRequest } from '@/services/bixsApi'
import { isWhatsAppOn, maskPhone, sendWhatsAppMessage, toWhatsAppNumber, whatsappMessages } from '@/services/whatsappService'

export interface TokenDispatchResult {
  success: boolean
  message: string
  expiresAt: number
  emailDestino?: string
  whatsappDestino?: string // WhatsApp que recebeu o código (mascarado)
  simulatedCode?: string // Só em desenvolvimento, para o botão de preencher
}

export interface TokenVerifyResult {
  valid: boolean
  message: string
  verificationToken?: string
}

const EMAIL_LIFETIME_MS = 15 * 60 * 1000
const WHATSAPP_LIFETIME_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

type PendingCode =
  | { channel: 'email'; email: string; expiresAt: number; issuedAt: number; attempts: number }
  | { channel: 'whatsapp'; code: string; phone?: string; expiresAt: number; issuedAt: number; attempts: number }

const pending = new Map<string, PendingCode>()
const keyFor = (document: string) => document.replace(/\D/g, '')
const normalizeEmail = (email: string) => email.trim().toLowerCase()

function newCode(): string {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return String(100000 + (value[0] % 900000))
}

function dispatchResult(entry: PendingCode): TokenDispatchResult {
  if (entry.channel === 'email') {
    return {
      success: true,
      message: `Código enviado para o e-mail ${entry.email}.`,
      expiresAt: entry.expiresAt,
      emailDestino: entry.email,
    }
  }
  return {
    success: true,
    message: `Código enviado para o WhatsApp ${maskPhone(entry.phone)}.`,
    expiresAt: entry.expiresAt,
    whatsappDestino: maskPhone(entry.phone),
    simulatedCode: import.meta.env.DEV ? entry.code : undefined,
  }
}

async function sendEmailCode(email: string): Promise<{ expiresAt: number } | { error: string }> {
  try {
    const res = await bixsRequest<{ expires_in_seconds?: number } | null>('v1/api/email-verification/send-code', {
      method: 'POST',
      body: { email },
    })
    const seconds = Number(res?.expires_in_seconds)
    return { expiresAt: Date.now() + (seconds > 0 ? seconds * 1000 : EMAIL_LIFETIME_MS) }
  } catch (err) {
    if (err instanceof BixsError && err.status === 503) {
      return { error: 'O envio de e-mail está indisponível agora. Tente novamente em alguns minutos.' }
    }
    return { error: err instanceof Error ? err.message : 'Não conseguimos enviar o código para o seu e-mail.' }
  }
}

async function sendWhatsAppCode(phone?: string): Promise<PendingCode | { error: string }> {
  if (!toWhatsAppNumber(phone)) return { error: 'Telefone inválido para WhatsApp.' }
  const code = newCode()
  const result = await sendWhatsAppMessage(phone, 'Cliente', whatsappMessages.code(code))
  if (!result.sent && !import.meta.env.DEV) {
    return { error: result.error || 'Não conseguimos enviar o código pelo WhatsApp.' }
  }
  const now = Date.now()
  return { channel: 'whatsapp', code, phone, expiresAt: now + WHATSAPP_LIFETIME_MS, issuedAt: now, attempts: 0 }
}

export const tokenService = {
  /**
   * Manda o código para o e-mail do cadastro; sem e-mail, tenta o WhatsApp (se estiver ligado)
   */
  async sendToken(document: string, email: string, phone?: string): Promise<TokenDispatchResult> {
    const key = keyFor(document)
    const cleanEmail = normalizeEmail(email)
    const now = Date.now()
    const current = pending.get(key)
    // Dentro do intervalo de reenvio não manda outro (a não ser que o e-mail tenha mudado)
    const sameTarget = current?.channel === 'whatsapp' || (current?.channel === 'email' && current.email === cleanEmail)
    if (current && sameTarget && current.expiresAt > now && now - current.issuedAt < RESEND_COOLDOWN_MS) {
      return dispatchResult(current)
    }

    const sent = await sendEmailCode(cleanEmail)
    if ('expiresAt' in sent) {
      const entry: PendingCode = { channel: 'email', email: cleanEmail, expiresAt: sent.expiresAt, issuedAt: now, attempts: 0 }
      pending.set(key, entry)
      return dispatchResult(entry)
    }

    if (await isWhatsAppOn()) {
      const viaWhatsApp = await sendWhatsAppCode(phone)
      if ('channel' in viaWhatsApp) {
        pending.set(key, viaWhatsApp)
        return dispatchResult(viaWhatsApp)
      }
    }

    pending.delete(key)
    return { success: false, message: sent.error, expiresAt: 0 }
  },

  /**
   * Confere o código digitado (na Bixs, quando foi por e-mail)
   */
  async verifyToken(document: string, email: string, inputCode: string): Promise<TokenVerifyResult> {
    const cleanCode = inputCode.trim().replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      return { valid: false, message: 'O código deve ter exatamente 6 dígitos numéricos.' }
    }

    const key = keyFor(document)
    const entry = pending.get(key)
    if (!entry) return { valid: false, message: 'Código inválido ou não encontrado. Solicite um novo.' }
    if (Date.now() > entry.expiresAt) {
      pending.delete(key)
      return { valid: false, message: 'Código expirado. Solicite um novo.' }
    }

    const wrongCode = () => {
      entry.attempts += 1
      if (entry.attempts >= MAX_ATTEMPTS) {
        pending.delete(key)
        return { valid: false, message: 'Muitas tentativas erradas. Solicite um novo código.' }
      }
      return {
        valid: false,
        message: `Código inválido. Confira a mensagem ${entry.channel === 'email' ? 'no seu e-mail' : 'no WhatsApp'}.`,
      }
    }

    if (entry.channel === 'whatsapp') {
      if (entry.code !== cleanCode) return wrongCode()
      pending.delete(key)
      return { valid: true, message: 'Código validado com sucesso!', verificationToken: `whatsapp:${key}` }
    }

    // O código foi para o e-mail digitado no envio; trocar o e-mail exige um código novo
    if (normalizeEmail(email) !== entry.email) {
      return { valid: false, message: 'O e-mail mudou depois do envio. Solicite um novo código.' }
    }

    try {
      const res = await bixsRequest<{ valid?: boolean } | null>('v1/api/email-verification/validate', {
        method: 'POST',
        body: { email: entry.email, code: cleanCode },
      })
      if (res?.valid !== true) return wrongCode()
    } catch (err) {
      // 401 é código errado/vencido; com "token" na mensagem é a credencial da landing que falhou
      if (err instanceof BixsError && err.status === 401 && !/token/i.test(err.detail || '')) return wrongCode()
      return { valid: false, message: err instanceof Error ? err.message : 'Não foi possível validar o código agora.' }
    }

    pending.delete(key)
    return { valid: true, message: 'E-mail confirmado!', verificationToken: `email:${entry.email}` }
  },
}
