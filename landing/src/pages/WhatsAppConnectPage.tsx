import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, CheckCircle2, Power, QrCode, RefreshCw, Send, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { isBixsConfigured } from '@/services/bixsApi'
import {
  createInstance,
  deleteInstance,
  getInstanceQrCode,
  getInstanceStatus,
  isConnectedStatus,
  listNomeLimpoInstances,
  sendWhatsAppMessage,
  type WhatsAppInstance,
} from '@/services/whatsappService'

/** Endereço da página (não aparece em nenhum link do site). */
export const WHATSAPP_PAGE_HASH = '#/whatsapp-nomelimpo-8317'

function formatPhone(phone?: string): string {
  const d = (phone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone || ''
}

// A Bixs devolve o QR como texto de pareamento ou como imagem base64
function QrImage({ value }: { value: string }) {
  if (value.startsWith('data:image')) return <img src={value} alt="QR Code do WhatsApp" className="h-64 w-64" />
  if (value.startsWith('iVBOR')) return <img src={`data:image/png;base64,${value}`} alt="QR Code do WhatsApp" className="h-64 w-64" />
  return <QRCodeSVG value={value} size={256} aria-label="QR Code do WhatsApp" />
}

/**
 * Página secreta: liga (conecta pelo QR Code) e desliga (desconecta) o WhatsApp que manda
 * código, Pix e confirmação aos clientes. Sem número conectado, a landing não envia nada.
 */
export function WhatsAppConnectPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [connected, setConnected] = useState<WhatsAppInstance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmOff, setConfirmOff] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listNomeLimpoInstances()
      setInstances(list)
      let found = list.find((i) => isConnectedStatus(i.status)) || null
      if (!found) {
        for (const instance of list) {
          if (isConnectedStatus(await getInstanceStatus(instance.id))) {
            found = instance
            break
          }
        }
      }
      setConnected(found)
      if (found) {
        setQrCode(null)
        stopPolling()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível consultar a Bixs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Página fora do Google
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = 'WhatsApp — Nome Limpo'
    refresh()
    return () => {
      meta.remove()
      stopPolling()
    }
  }, [refresh])

  // Enquanto o QR está na tela, confere a cada 4 s se o celular já conectou
  const watchConnection = (id: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        if (isConnectedStatus(await getInstanceStatus(id))) {
          stopPolling()
          setNotice('WhatsApp conectado: os envios estão LIGADOS.')
          await refresh()
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 4000)
  }

  const handleConnect = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      // Reaproveita a instância do NomeLimpo; só cria se não houver nenhuma
      const instance = instances[0] || (await createInstance())
      if (!instances.length) setInstances([instance])
      if (isConnectedStatus(await getInstanceStatus(instance.id))) {
        await refresh()
        return
      }
      setQrCode(await getInstanceQrCode(instance.id))
      watchConnection(instance.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o QR Code.')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      // Só as instâncias do NomeLimpo: o número de outros sistemas da conta não é tocado
      for (const instance of instances) {
        await deleteInstance(instance.id)
      }
      setConfirmOff(false)
      setQrCode(null)
      stopPolling()
      setNotice('WhatsApp desconectado: os envios estão DESLIGADOS.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível desconectar.')
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async (e: FormEvent) => {
    e.preventDefault()
    setTesting(true)
    setError(null)
    setNotice(null)
    const result = await sendWhatsAppMessage(
      testPhone,
      'Teste',
      '*Nome Limpo Express*\n\nMensagem de teste: o WhatsApp da landing está funcionando.',
      { instance: connected, skipLimit: true }
    )
    if (result.sent) setNotice('Mensagem de teste enviada.')
    else setError(result.error || 'A mensagem de teste não foi enviada.')
    setTesting(false)
  }

  const isOn = connected !== null

  return (
    <div className="min-h-screen bg-ink text-cream px-4 py-10">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
            <Smartphone className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-wide text-xl font-bold">WhatsApp da Empresa</h1>
            <p className="text-xs text-cream-dim">Código de verificação, Pix e confirmação de pagamento para os clientes</p>
          </div>
        </header>

        {!isBixsConfigured() && (
          <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            Credenciais da Bixs não configuradas no build (VITE_BIXS_EMAIL / VITE_BIXS_PASSWORD).
          </p>
        )}

        <section className="rounded-3xl border border-line bg-ink-raised p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-cream-dim">Envio automático</div>
              <div className={`text-2xl font-black ${isOn ? 'text-brand-light' : 'text-cream-dim'}`}>
                {loading ? 'Consultando…' : isOn ? 'LIGADO' : 'DESLIGADO'}
              </div>
              {isOn && <div className="text-sm text-cream mt-0.5">Número conectado: {formatPhone(connected?.phoneNumber)}</div>}
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Atualizar"
              className="rounded-xl border border-line p-2.5 text-cream-dim hover:text-cream disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isOn ? (
            confirmOff ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 space-y-3">
                <p className="text-sm text-red-300">
                  Desligar desconecta o número da Bixs. Para ligar de novo será preciso escanear o QR Code com o celular da empresa.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="danger" size="sm" isLoading={busy} onClick={handleDisconnect}>
                    Sim, desligar agora
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOff(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => setConfirmOff(true)}>
                <Power className="h-4 w-4" />
                Desligar WhatsApp
              </Button>
            )
          ) : (
            <Button type="button" className="w-full justify-center gap-2" isLoading={busy} disabled={loading} onClick={handleConnect}>
              <QrCode className="h-4 w-4" />
              {qrCode ? 'Gerar novo QR Code' : 'Ligar WhatsApp (conectar pelo QR Code)'}
            </Button>
          )}

          {qrCode && !isOn && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5">
              <QrImage value={qrCode} />
              <p className="text-center text-xs text-slate-600">
                No celular da empresa: WhatsApp → Aparelhos conectados → Conectar aparelho.
                <br />
                Esta página percebe sozinha quando conectar.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
            <span>
              O número usa uma API não oficial do WhatsApp: mensagens automáticas demais podem fazer o WhatsApp bloquear o número.
              Deixe ligado só quando for usar e desligue aqui a qualquer momento.
            </span>
          </div>
        </section>

        {isOn && (
          <form onSubmit={handleTest} className="rounded-3xl border border-line bg-ink-raised p-5 space-y-3">
            <label htmlFor="telefone-teste" className="block text-sm font-semibold">
              Enviar mensagem de teste
            </label>
            <div className="flex gap-2">
              <input
                id="telefone-teste"
                type="tel"
                inputMode="numeric"
                placeholder="DDD + número"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream focus:border-brand focus:outline-none"
              />
              <Button type="submit" size="sm" isLoading={testing} disabled={!testPhone} className="gap-1.5">
                <Send className="h-4 w-4" />
                Testar
              </Button>
            </div>
          </form>
        )}

        {notice && (
          <p className="flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm text-brand-light">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
