/**
 * Código de confirmação do checkout, gerado no navegador e enviado pelo WhatsApp da empresa.
 * Sem servidor a conferência também é local: confirma que o telefone é da pessoa, não é barreira
 * contra quem mexe no navegador. Sem o WhatsApp ligado o checkout pula esta etapa.
 */
import { maskPhone, sendWhatsAppMessage, toWhatsAppNumber, whatsappMessages } from '@/services/whatsappService'

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

const LIFETIME_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

interface PendingCode {
  code: string
  expiresAt: number
  issuedAt: number
  attempts: number
}

const pending = new Map<string, PendingCode>()
const keyFor = (document: string) => document.replace(/\D/g, '')

function newCode(): string {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return String(100000 + (value[0] % 900000))
}

export const tokenService = {
  /**
   * Gera o código e manda para o WhatsApp informado no cadastro
   */
  async sendToken(document: string, _email: string, phone?: string): Promise<TokenDispatchResult> {
    if (!toWhatsAppNumber(phone)) {
      return { success: false, message: 'Informe um celular com WhatsApp para receber o código.', expiresAt: 0 }
    }

    const key = keyFor(document)
    const now = Date.now()
    const current = pending.get(key)
    // Dentro do intervalo de reenvio não manda outro
    if (current && current.expiresAt > now && now - current.issuedAt < RESEND_COOLDOWN_MS) {
      return {
        success: true,
        message: `Código enviado para o WhatsApp ${maskPhone(phone)}.`,
        expiresAt: current.expiresAt,
        whatsappDestino: maskPhone(phone),
        simulatedCode: import.meta.env.DEV ? current.code : undefined,
      }
    }

    const code = newCode()
    const result = await sendWhatsAppMessage(phone, 'Cliente', whatsappMessages.code(code))
    if (!result.sent && !import.meta.env.DEV) {
      return {
        success: false,
        message: result.error || 'Não conseguimos enviar o código pelo WhatsApp agora. Tente novamente em alguns minutos.',
        expiresAt: 0,
      }
    }

    const entry = { code, expiresAt: now + LIFETIME_MS, issuedAt: now, attempts: 0 }
    pending.set(key, entry)
    return {
      success: true,
      message: `Código enviado para o WhatsApp ${maskPhone(phone)}.`,
      expiresAt: entry.expiresAt,
      whatsappDestino: maskPhone(phone),
      simulatedCode: import.meta.env.DEV ? code : undefined,
    }
  },

  /**
   * Confere o código digitado
   */
  async verifyToken(document: string, _email: string, inputCode: string): Promise<TokenVerifyResult> {
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
    if (entry.code !== cleanCode) {
      entry.attempts += 1
      if (entry.attempts >= MAX_ATTEMPTS) pending.delete(key)
      return { valid: false, message: 'Código inválido. Confira a mensagem no WhatsApp.' }
    }

    pending.delete(key)
    return { valid: true, message: 'Código validado com sucesso!', verificationToken: `whatsapp:${key}` }
  },
}
