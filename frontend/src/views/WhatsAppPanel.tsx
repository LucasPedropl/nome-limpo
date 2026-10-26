import React, { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, Loader2, QrCode, RefreshCw, Send, Smartphone } from 'lucide-react'
import { api, UnauthorizedError, WhatsAppStatus } from '../services/api'
import { useToast } from '../components/Toast'

function formatarTelefone(telefone?: string | null): string {
  const digitos = (telefone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return telefone || ''
}

// A Bixs devolve o QR como imagem (data URI / base64 PNG) ou como o texto de pareamento
function QrCodeWhatsApp({ valor }: { valor: string }) {
  if (valor.startsWith('data:image')) {
    return <img src={valor} alt="QR Code para conectar o WhatsApp" className="w-56 h-56" />
  }
  if (valor.startsWith('iVBOR')) {
    return <img src={`data:image/png;base64,${valor}`} alt="QR Code para conectar o WhatsApp" className="w-56 h-56" />
  }
  return <QRCodeSVG value={valor} size={224} aria-label="QR Code para conectar o WhatsApp" />
}

/**
 * Liga/desliga dos envios automáticos por WhatsApp. O número é conectado pela Bixs (API não oficial):
 * fica desligado por padrão e pode ser desligado a qualquer momento para não arriscar o bloqueio do número.
 */
export const WhatsAppPanel: React.FC<{ onChanged?: () => void }> = ({ onChanged }) => {
  const { showToast } = useToast()
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [conectando, setConectando] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [telefoneTeste, setTelefoneTeste] = useState('')
  const [testando, setTestando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const s = await api.getWhatsAppStatus()
      setStatus(s)
      setErro(null)
      if (s.conectado) setQrCode(null)
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) {
        setErro(err instanceof Error ? err.message : 'Não foi possível consultar o WhatsApp.')
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const alternar = async () => {
    if (!status || salvando) return
    const ligar = !status.ativo
    setSalvando(true)
    try {
      const s = await api.setWhatsAppAtivo(ligar)
      setStatus(s)
      showToast(
        ligar ? 'WhatsApp ligado' : 'WhatsApp desligado',
        ligar ? 'Os envios automáticos por WhatsApp começaram a valer agora.' : 'Nenhuma mensagem sai mais pelo WhatsApp.',
        'success'
      )
      onChanged?.()
    } catch (err) {
      showToast('Erro', err instanceof Error ? err.message : 'Não foi possível alterar o WhatsApp.', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const conectar = async () => {
    setConectando(true)
    try {
      const conexao = await api.conectarWhatsApp()
      if (conexao.conectado) {
        setQrCode(null)
        showToast('WhatsApp conectado', 'O número da empresa já está conectado.', 'success')
        await carregar()
      } else {
        setQrCode(conexao.qrCode || null)
      }
    } catch (err) {
      showToast('Erro ao conectar', err instanceof Error ? err.message : 'Não foi possível gerar o QR Code.', 'error')
    } finally {
      setConectando(false)
    }
  }

  const testar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telefoneTeste) return
    setTestando(true)
    try {
      const res = await api.testarWhatsApp(telefoneTeste)
      showToast('Teste enviado', res.message, 'success')
    } catch (err) {
      showToast('Teste não enviado', err instanceof Error ? err.message : 'Falha ao enviar o teste.', 'error')
    } finally {
      setTestando(false)
    }
  }

  const ativo = status?.ativo ?? false

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start gap-5">
        {/* Estado e chave */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">WhatsApp da Empresa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {carregando && !status ? (
                    'Consultando…'
                  ) : status?.conectado ? (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                      Conectado {status.telefone ? `· ${formatarTelefone(status.telefone)}` : ''}
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 align-middle" />
                      Desconectado
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              aria-label="Atualizar status do WhatsApp"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Envio automático por WhatsApp: {ativo ? 'Ligado' : 'Desligado'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Código de verificação (cadastro e Área do Cliente), dados do Pix e confirmação do pagamento.
              </p>
              {status?.alteradoEm && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Alterado {status.alteradoPor ? `por ${status.alteradoPor} ` : ''}em{' '}
                  {new Date(status.alteradoEm).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              aria-label="Ligar ou desligar o envio por WhatsApp"
              onClick={alternar}
              disabled={!status || salvando}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                ativo ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              {salvando ? (
                <Loader2 className="absolute left-1/2 -translate-x-1/2 w-4 h-4 animate-spin text-white" />
              ) : (
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    ativo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>
              O número é conectado por uma API não oficial do WhatsApp. Muitos envios automáticos podem fazer o
              WhatsApp bloquear o número. Deixe ligado só quando for usar e desligue a qualquer momento por aqui.
            </span>
          </div>

          {(erro || status?.erro) && (
            <p role="alert" className="text-xs text-rose-600">
              {erro || status?.erro}
            </p>
          )}
        </div>

        {/* Conexão e teste */}
        <div className="lg:w-72 shrink-0 space-y-3">
          {!status?.conectado && (
            <button
              type="button"
              onClick={conectar}
              disabled={conectando}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              {conectando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              <span>{qrCode ? 'Gerar novo QR Code' : 'Conectar WhatsApp'}</span>
            </button>
          )}

          {qrCode && !status?.conectado && (
            <div className="rounded-xl border border-slate-200 p-3 flex flex-col items-center gap-2">
              <QrCodeWhatsApp valor={qrCode} />
              <p className="text-[11px] text-slate-500 text-center">
                No celular da empresa: WhatsApp → Aparelhos conectados → Conectar aparelho. Depois toque em atualizar.
              </p>
            </div>
          )}

          <form onSubmit={testar} className="space-y-2">
            <label htmlFor="whatsapp-teste" className="block text-[11px] font-medium text-slate-600">
              Enviar mensagem de teste
            </label>
            <div className="flex gap-2">
              <input
                id="whatsapp-teste"
                type="tel"
                inputMode="numeric"
                placeholder="DDD + número"
                value={telefoneTeste}
                onChange={(e) => setTelefoneTeste(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                disabled={!ativo || !telefoneTeste || testando}
                title={ativo ? undefined : 'Ligue o envio por WhatsApp para testar'}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
              >
                {testando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Testar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
