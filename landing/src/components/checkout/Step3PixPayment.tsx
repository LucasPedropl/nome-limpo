import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Clock, QrCode, Zap, ShieldCheck, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { pagwebService, type PixChargeResponse, type PaymentStatusCheckResult } from '@/services/pagwebService'

interface Step3Props {
  charge: PixChargeResponse
  onPaymentSuccess: (statusResult?: PaymentStatusCheckResult) => void
}

export function Step3PixPayment({ charge, onPaymentSuccess }: Step3Props) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutos
  const [isSimulating, setIsSimulating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isPaid, setIsPaid] = useState(charge.status === 'PAID')
  const [checkStatusText, setCheckStatusText] = useState('')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || isPaid) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isPaid])

  // Polling automático a cada 5 segundos consultando a fatura direto na Bixs
  useEffect(() => {
    if (isPaid) return

    pollingRef.current = setInterval(async () => {
      try {
        const result = await pagwebService.checkPaymentStatus(charge.txid, charge.paymentId)
        if (result.isPaid || result.status === 'PAID') {
          setIsPaid(true)
          if (pollingRef.current) clearInterval(pollingRef.current)
          setTimeout(() => {
            onPaymentSuccess(result)
          }, 1500)
        }
      } catch {
        // Silencioso no polling contínuo
      }
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [charge.txid, charge.paymentId, isPaid, onPaymentSuccess])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(charge.pixEmv)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setCopied(true)
    }
  }

  // Checagem manual de status
  const handleCheckStatus = async () => {
    if (isPaid) return
    setIsChecking(true)
    setCheckStatusText('')
    try {
      const result = await pagwebService.checkPaymentStatus(charge.txid, charge.paymentId)
      if (result.isPaid || result.status === 'PAID') {
        setIsPaid(true)
        if (pollingRef.current) clearInterval(pollingRef.current)
        setTimeout(() => {
          onPaymentSuccess(result)
        }, 1500)
      } else {
        setCheckStatusText('Pagamento ainda em processamento pelo Banco Central. Aguardando compensação...')
        setTimeout(() => setCheckStatusText(''), 4000)
      }
    } catch (err) {
      setCheckStatusText(err instanceof Error ? err.message : 'Erro ao consultar gateway. Tentando novamente...')
    } finally {
      setIsChecking(false)
    }
  }

  // Simulação / Teste imediato (contingência e homologação)
  const handleSimulatePayment = async () => {
    if (isPaid) return
    setIsSimulating(true)
    try {
      const res = await pagwebService.simulatePaymentApproval(charge.txid, charge.paymentId)
      if (res.isPaid) {
        setIsPaid(true)
        if (pollingRef.current) clearInterval(pollingRef.current)
        setTimeout(() => {
          onPaymentSuccess(res)
        }, 1500)
      }
    } catch (err) {
      setCheckStatusText(err instanceof Error ? err.message : 'Não foi possível confirmar o pagamento de teste.')
    } finally {
      setIsSimulating(false)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  if (isPaid) {
    return (
      <div className="py-8 text-center space-y-5 animate-screen-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/15 text-brand-light ring-8 ring-brand/10 shadow-2xl">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5] animate-bounce" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3.5 py-1 text-xs font-mono font-bold text-brand-light">
            <Sparkles className="h-3.5 w-3.5" />
            1ª Mensalidade Liquidada
          </span>
          <h3 className="font-wide mt-3 text-2xl sm:text-3xl font-black text-cream">
            Pagamento Confirmado!
          </h3>
          <p className="mt-2 text-sm text-cream-dim leading-relaxed max-w-md mx-auto">
            Recebemos a confirmação bancária da sua primeira mensalidade de R$ 100,00.
          </p>
        </div>

        <div className="rounded-2xl border border-brand/30 bg-brand/10 p-4 text-xs sm:text-sm text-brand-light flex items-center justify-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>Ativando sua assinatura e gerando seu contrato...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center animate-screen-in">
      {/* Header do PIX */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3.5 py-1 text-xs sm:text-sm font-mono font-semibold text-brand-light">
          <QrCode className="h-4 w-4" />
          <span>PIX Bixs Cora Gateway</span>
        </span>
        <h3 className="font-wide mt-3 text-2xl font-bold text-cream">
          Pague R$ 100,00 para Iniciar a Regularização
        </h3>
        <p className="mt-1.5 text-sm text-cream-dim leading-relaxed">
          Abra o app do seu banco, escaneie o QR Code ou utilize o código Copia e Cola.
        </p>
      </div>

      {/* QR Code em container branco de alto contraste */}
      <div className="mx-auto flex flex-col items-center">
        <div className="rounded-3xl bg-white p-5 shadow-2xl ring-4 ring-brand/25">
          <img
            src={charge.qrCodeUrl}
            alt="QR Code PIX para pagamento de R$ 100,00"
            className="h-52 w-52 object-contain sm:h-56 sm:w-56"
          />
        </div>

        {/* Temporizador */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-ink px-4 py-1.5 font-mono text-xs sm:text-sm text-cream-dim">
          <Clock className="h-4 w-4 text-brand-light" />
          <span>Vencimento em:</span>
          <span className="font-bold text-cream">{formattedTime}</span>
        </div>
      </div>

      {/* Código Copia e Cola */}
      <div className="rounded-2xl border border-line bg-ink p-4 sm:p-5 text-left space-y-2">
        <label className="text-xs sm:text-sm font-mono text-cream-dim block">
          Código PIX Copia e Cola:
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={charge.pixEmv}
            className="w-full rounded-xl border border-line/80 bg-ink-sunken px-4 py-3 text-xs sm:text-sm font-mono text-cream-dim truncate focus:outline-none"
          />
          <button
            type="button"
            onClick={copyToClipboard}
            className={`flex items-center justify-center gap-2 shrink-0 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition-all ${
              copied
                ? 'bg-signal text-ink shadow-md'
                : 'bg-brand text-ink hover:bg-brand-light'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status de Polling em Tempo Real */}
      <div className="rounded-2xl border border-line/80 bg-ink-raised p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-light"></span>
          </span>
          <span className="font-medium text-cream text-left">
            Aguardando compensação do Banco Central...
          </span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button
            type="button"
            onClick={handleCheckStatus}
            isLoading={isChecking}
            variant="ghost"
            size="sm"
            className="text-xs text-brand-light hover:bg-brand/10"
          >
            Verificar Status
          </Button>
        </div>
      </div>

      {checkStatusText && (
        <p className="text-xs text-brand-light font-mono animate-screen-in">{checkStatusText}</p>
      )}

      {/* Botão de Demonstração / Teste Imediato (Padrão Contratos) — apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <div className="pt-1">
          <Button
            type="button"
            onClick={handleSimulatePayment}
            isLoading={isSimulating}
            variant="secondary"
            size="md"
            className="w-full justify-center gap-2 border-brand/30 text-brand-light hover:bg-brand/10 font-mono text-xs sm:text-sm py-3"
          >
            <Zap className="h-4 w-4 text-signal" />
            <span>⚡ Confirmar Pagamento (Ambiente de Teste / Aprovação Imediata)</span>
          </Button>
        </div>
      )}

      {/* Aviso de Confirmação Automática */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-cream-dim">
        <ShieldCheck className="h-4 w-4 text-signal shrink-0" />
        <span>Assim que o pagamento for liquidado, sua assinatura é ativada na hora.</span>
      </div>
    </div>
  )
}
