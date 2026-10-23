/**
 * Serviço de envio e validação do código de confirmação por e-mail do checkout.
 * A API amarra o código ao CPF/CNPJ: se o documento já tem cadastro, o código vai para o e-mail cadastrado.
 * A validação devolve o comprovante (verificationToken) exigido para gerar o PIX.
 */

export interface TokenDispatchResult {
  success: boolean
  message: string
  expiresAt: number
  emailDestino?: string // E-mail que recebeu o código (mascarado quando é o do cadastro)
  simulatedCode?: string // Exposto pela API só em Development, para o botão de preencher
}

export interface TokenVerifyResult {
  valid: boolean
  message: string
  verificationToken?: string
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'

export const tokenService = {
  /**
   * Solicita o envio do código de 6 dígitos para o e-mail do titular
   */
  async sendToken(document: string, email: string): Promise<TokenDispatchResult> {
    const cleanEmail = email.trim().toLowerCase()

    try {
      const response = await fetch(`${API_URL}/api/public/checkout/solicitar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: document, email: cleanEmail }),
      })

      const data = await response.json().catch(() => null)
      if (response.ok && data) {
        return {
          success: true,
          message: data.message || `Código enviado para ${cleanEmail}`,
          expiresAt: new Date(data.expiresAt).getTime(),
          emailDestino: data.emailDestino || cleanEmail,
          simulatedCode: data.simulatedCode || undefined,
        }
      }

      return {
        success: false,
        message: data?.message || 'Não foi possível enviar o código agora. Tente novamente em alguns minutos.',
        expiresAt: 0,
      }
    } catch {
      return {
        success: false,
        message: 'Não foi possível enviar o código agora. Tente novamente em alguns minutos.',
        expiresAt: 0,
      }
    }
  },

  /**
   * Confere o código na API e devolve o comprovante para gerar o PIX
   */
  async verifyToken(document: string, email: string, inputCode: string): Promise<TokenVerifyResult> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = inputCode.trim().replace(/\D/g, '')

    if (cleanCode.length !== 6) {
      return { valid: false, message: 'O código deve ter exatamente 6 dígitos numéricos.' }
    }

    try {
      const response = await fetch(`${API_URL}/api/public/checkout/validar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: document, email: cleanEmail, codigo: cleanCode }),
      })

      const data = await response.json().catch(() => null)
      if (response.ok && data?.verificationToken) {
        return {
          valid: true,
          message: data.message || 'Código validado com sucesso!',
          verificationToken: data.verificationToken,
        }
      }

      return { valid: false, message: data?.message || 'Código inválido ou expirado.' }
    } catch {
      return { valid: false, message: 'Não foi possível validar o código agora. Tente novamente em alguns minutos.' }
    }
  },
}
