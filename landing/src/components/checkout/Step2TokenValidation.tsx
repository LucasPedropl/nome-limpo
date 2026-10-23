import { useState, useEffect, type FormEvent } from 'react'
import { KeyRound, Mail, ArrowRight, RotateCw, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { tokenService } from '@/services/tokenService'

interface Step2Props {
  document: string
  email: string
  emailDestino?: string
  simulatedCode?: string
  onVerified: (verificationToken: string) => Promise<void>
  onBack: () => void
  isLoading: boolean
}

export function Step2TokenValidation({
  document,
  email,
  emailDestino: initialEmailDestino,
  simulatedCode: initialCode,
  onVerified,
  onBack,
  isLoading,
}: Step2Props) {
  const [tokenInput, setTokenInput] = useState('')
  const [activeSimulatedCode, setActiveSimulatedCode] = useState(initialCode)
  const [emailDestino, setEmailDestino] = useState(initialEmailDestino || email)
  const [errorMessage, setErrorMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60)
  const [isResending, setIsResending] = useState(false)

  // Temporizador do cooldown de reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const res = await tokenService.verifyToken(document, email, tokenInput)
    if (!res.valid || !res.verificationToken) {
      setErrorMessage(res.message)
      return
    }

    await onVerified(res.verificationToken)
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setErrorMessage('')

    try {
      const res = await tokenService.sendToken(document, email)
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }
      if (res.emailDestino) {
        setEmailDestino(res.emailDestino)
      }
      if (res.simulatedCode) {
        setActiveSimulatedCode(res.simulatedCode)
      }
      setResendCooldown(60)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Envio */}
      <div className="rounded-2xl border border-line bg-ink p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand-light mb-4 shadow-sm">
          <Mail className="h-7 w-7" />
        </div>
        <h4 className="font-wide text-lg sm:text-xl font-bold text-cream">
          Código de Segurança Enviado
        </h4>
        <p className="mt-2 text-sm text-cream-dim leading-relaxed">
          Enviamos um código de validação de 6 dígitos para o e-mail:
          <span className="font-mono font-bold text-cream block mt-1 text-base">{emailDestino}</span>
        </p>
      </div>

      {/* Dica para Modo Demonstração / Testes */}
      {activeSimulatedCode && (
        <div className="rounded-2xl border border-brand/40 bg-brand/10 p-4 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-brand-light font-mono font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Código de teste recebido:</span>
          </div>
          <button
            type="button"
            onClick={() => setTokenInput(activeSimulatedCode)}
            className="rounded-xl bg-brand px-3 py-1.5 text-xs font-mono font-black text-ink hover:bg-brand-light transition-all shadow-sm"
          >
            Preencher {activeSimulatedCode}
          </button>
        </div>
      )}

      {/* Formulário de Digitação do Token */}
      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-2 text-center">
            Digite os 6 dígitos recebidos no e-mail:
          </label>
          <div className="flex justify-center">
            <input
              type="text"
              autoFocus
              maxLength={6}
              required
              placeholder="000000"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                setErrorMessage('')
              }}
              className="w-56 text-center rounded-2xl border-2 border-line bg-ink px-4 py-3.5 text-3xl font-mono font-bold tracking-[0.35em] text-cream focus:border-brand focus:outline-none shadow-inner"
            />
          </div>
          {errorMessage && (
            <p className="mt-3 text-center text-sm text-red-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/* Botão de Validação */}
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={tokenInput.length !== 6}
          size="lg"
          className="w-full justify-center gap-2.5 py-4 text-base font-bold shadow-lg"
        >
          <KeyRound className="h-5 w-5" />
          <span>Confirmar Token &amp; Gerar PIX</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      {/* Rodapé com Reenvio e Voltar */}
      <div className="flex items-center justify-between border-t border-line/60 pt-5 text-xs sm:text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-cream-dim hover:text-cream transition-colors font-medium"
        >
          ← Corrigir dados
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="font-mono text-brand-light hover:underline disabled:text-cream-dim/50 disabled:no-underline flex items-center gap-2"
        >
          <RotateCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
          <span>
            {resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Reenviar código agora'}
          </span>
        </button>
      </div>
    </div>
  )
}
