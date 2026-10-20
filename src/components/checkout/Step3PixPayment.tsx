import { useState, useEffect } from 'react'
import { Copy, Check, Clock, QrCode, Zap, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { pagwebService, type PixChargeResponse } from '@/services/pagwebService'

interface Step3Props {
  charge: PixChargeResponse
  onPaymentSuccess: () => void
}

export function Step3PixPayment({ charge, onPaymentSuccess }: Step3Props) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos
  const [isSimulating, setIsSimulating] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Polling automático a cada 2.5s para checar status
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const status = await pagwebService.checkPaymentStatus(charge.txid)
      if (status === 'PAID') {
        clearInterval(pollInterval)
        onPaymentSuccess()
      }
    }, 2500)

    return () => clearInterval(pollInterval)
  }, [charge.txid, onPaymentSuccess])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(charge.pixEmv)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setCopied(true)
    }
  }

  const handleSimulatePayment = async () => {
    setIsSimulating(true)
    await pagwebService.simulatePaymentApproval(charge.txid)
    setIsSimulating(false)
    onPaymentSuccess()
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="space-y-6 text-center">
      {/* Header do PIX */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3.5 py-1 text-xs sm:text-sm font-mono font-semibold text-brand-light">
          <QrCode className="h-4 w-4" />
          <span>PIX Gerado na Tela</span>
        </span>
        <h3 className="font-wide mt-3 text-2xl font-bold text-cream">
          Pague R$ 100,00 para Ativar seu Plano
        </h3>
        <p className="mt-1.5 text-sm text-cream-dim leading-relaxed">
          Abra o aplicativo do seu banco, escaneie o QR Code ou use o Copia e Cola.
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
          <span>Expira em:</span>
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
      <div className="rounded-2xl border border-line/80 bg-ink-raised p-4 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-light"></span>
          </span>
          <span className="font-medium text-cream">
            Aguardando compensação do Banco Central...
          </span>
        </div>
        <span className="text-xs font-mono text-cream-dim">Instantâneo</span>
      </div>

      {/* Botão de Demonstração / Teste Imediato */}
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
          <span>⚡ Simular Pagamento Aprovado (Demonstração)</span>
        </Button>
      </div>

      {/* Aviso de Confirmação Automática */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-cream-dim">
        <ShieldCheck className="h-4 w-4 text-signal shrink-0" />
        <span>Assim que o PIX for pago, a tela avançará sozinha automaticamente.</span>
      </div>
    </div>
  )
}
