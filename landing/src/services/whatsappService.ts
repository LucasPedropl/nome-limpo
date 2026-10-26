import { bixsRequest, isBixsConfigured } from '@/services/bixsApi'

/**
 * WhatsApp da empresa pela Bixs (API não oficial: disparo demais pode banir o número).
 * Ligado = o número do NomeLimpo está conectado na página secreta (#/whatsapp-nomelimpo).
 * Desligado = desconectado: sem instância conectada a landing não manda nada.
 * Só usa instâncias com nome "nomelimpo-..." da própria conta: nunca o número de outro sistema.
 */

export const INSTANCE_PREFIX = 'nomelimpo'

export interface WhatsAppInstance {
  id: string
  name: string
  status: string
  phoneNumber?: string
}

const CONNECTED = new Set(['open', 'connected'])
const ERROR_STATUSES = new Set([
  'client_outdated',
  'conflict',
  'unavailable',
  'timeout',
  'bad_session',
  'restart_required',
  'multidevice_mismatch',
])

export function isConnectedStatus(status?: string): boolean {
  return CONNECTED.has((status || '').trim().toLowerCase())
}

export function isErrorStatus(status?: string): boolean {
  return ERROR_STATUSES.has((status || '').trim().toLowerCase())
}

function toInstance(raw: unknown): WhatsAppInstance | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' || typeof r.id === 'number' ? String(r.id) : ''
  if (!id) return null
  return {
    id,
    name: typeof r.name === 'string' ? r.name : '',
    status: typeof r.status === 'string' ? r.status : '',
    phoneNumber: typeof r.phone_number === 'string' ? r.phone_number : undefined,
  }
}

export async function listNomeLimpoInstances(): Promise<WhatsAppInstance[]> {
  const data = await bixsRequest<unknown>('v1/api/instances')
  const list = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown> | null)?.data as unknown[]) || []
  return list
    .map(toInstance)
    .filter((i): i is WhatsAppInstance => !!i && i.name.toLowerCase().startsWith(INSTANCE_PREFIX))
}

export async function getInstanceStatus(id: string): Promise<string> {
  const data = await bixsRequest<{ status?: string }>(`v1/api/instances/${encodeURIComponent(id)}/status`)
  return data?.status || ''
}

export async function createInstance(): Promise<WhatsAppInstance> {
  const name = `${INSTANCE_PREFIX}-whatsapp-${Math.floor(1000 + Math.random() * 9000)}`
  const created = toInstance(await bixsRequest<unknown>('v1/api/instances', { method: 'POST', body: { name } }))
  if (!created) throw new Error('A Bixs criou a instância mas não devolveu o id.')
  return { ...created, name: created.name || name }
}

export async function deleteInstance(id: string): Promise<void> {
  await bixsRequest<unknown>(`v1/api/instances/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Texto de pareamento (ou imagem base64) para escanear. A Bixs responde 200 com erro no status. */
export async function getInstanceQrCode(id: string): Promise<string> {
  const data = await bixsRequest<unknown>(`v1/api/instances/${encodeURIComponent(id)}/qrcode`)
  if (typeof data === 'string' && data.trim() && !data.trim().startsWith('{')) return data.trim()

  const r = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const status = typeof r.status === 'string' ? r.status : ''
  if (isErrorStatus(status)) {
    throw new Error(
      status === 'client_outdated'
        ? 'O WhatsApp do gateway está desatualizado (client_outdated): a Bixs precisa atualizar o servidor antes de gerar QR Code.'
        : `A instância falhou (status: ${status}). Desligue e conecte de novo.`
    )
  }
  for (const field of ['qrcode', 'code', 'base64']) {
    const value = r[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  throw new Error('A Bixs não devolveu o QR Code. Tente de novo em alguns segundos.')
}

/** Instância do NomeLimpo conectada agora, ou null (WhatsApp desligado). */
export async function findConnectedInstance(): Promise<WhatsAppInstance | null> {
  if (!isBixsConfigured()) return null
  const instances = await listNomeLimpoInstances()
  const inline = instances.find((i) => isConnectedStatus(i.status))
  if (inline) return inline
  for (const instance of instances) {
    if (isConnectedStatus(await getInstanceStatus(instance.id))) return instance
  }
  return null
}

export async function isWhatsAppOn(): Promise<boolean> {
  try {
    return (await findConnectedInstance()) !== null
  } catch {
    return false
  }
}

// --- Telefone ---

/** DDD + número (com ou sem 55) no formato da Bixs: só dígitos com 55. Mesmas regras do Contratos. */
export function toWhatsAppNumber(phone?: string): string | null {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2)
  if (digits.length !== 10 && digits.length !== 11) return null
  const ddd = Number(digits.slice(0, 2))
  if (ddd < 11 || ddd > 99) return null
  if (digits.length === 11 && digits[2] !== '9') return null
  if (/^(\d)\1+$/.test(digits)) return null
  return `55${digits}`
}

export function maskPhone(phone?: string): string {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2)
  return digits.length < 6 ? '***' : `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`
}

function samePhone(a: string, b: string): boolean {
  const local = (t: string) => {
    const d = t.replace(/\D/g, '')
    return d.startsWith('55') && d.length > 11 ? d.slice(2) : d
  }
  const la = local(a)
  const lb = local(b)
  return !!la && !!lb && (la === lb || la.endsWith(lb) || lb.endsWith(la))
}

// --- Freio de envios ---
// Por navegador: um cadastro normal gasta 4 mensagens (código, Pix em 2 partes, confirmação).
// Não segura quem chamar a Bixs por fora, mas evita que um clique repetido vire rajada.
const LIMIT_KEY = 'nl_whatsapp_envios'
const LIMIT_WINDOW_MS = 10 * 60 * 1000
const LIMIT_PER_BROWSER = 8

function reserveSend(): boolean {
  try {
    const now = Date.now()
    const recent = (JSON.parse(sessionStorage.getItem(LIMIT_KEY) || '[]') as number[]).filter((t) => now - t < LIMIT_WINDOW_MS)
    if (recent.length >= LIMIT_PER_BROWSER) return false
    recent.push(now)
    sessionStorage.setItem(LIMIT_KEY, JSON.stringify(recent))
    return true
  } catch {
    return true
  }
}

export interface SendResult {
  sent: boolean
  error?: string
}

/** Envia se o WhatsApp do NomeLimpo estiver conectado. Nunca lança: falha volta em SendResult. */
export async function sendWhatsAppMessage(
  phone: string | undefined,
  toName: string,
  message: string,
  options: { instance?: WhatsAppInstance | null; skipLimit?: boolean } = {}
): Promise<SendResult> {
  const to = toWhatsAppNumber(phone)
  if (!to) return { sent: false, error: 'Telefone inválido para WhatsApp.' }

  try {
    const instance = options.instance ?? (await findConnectedInstance())
    if (!instance) return { sent: false, error: 'O WhatsApp da empresa está desligado.' }
    if (instance.phoneNumber && samePhone(to, instance.phoneNumber)) {
      return { sent: false, error: 'O destino é o próprio número da empresa.' }
    }
    if (!options.skipLimit && !reserveSend()) {
      return { sent: false, error: 'Muitas mensagens em pouco tempo. Aguarde alguns minutos.' }
    }

    const result = await bixsRequest<{ success?: boolean; message?: string; error?: string } | null>('v1/api/messages/send', {
      method: 'POST',
      body: {
        audio_url: '',
        document_url: '',
        image_url: '',
        instance_id: instance.id,
        message,
        to,
        to_name: toName,
        video_url: '',
      },
    })
    if (result && result.success === false) {
      const detail = result.message || result.error || ''
      return {
        sent: false,
        error: detail.includes('463') ? 'O WhatsApp não entregou para este número. Confira se ele tem WhatsApp ativo.' : detail,
      }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Falha ao enviar pelo WhatsApp.' }
  }
}

// --- Mensagens ---

const brl = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'cliente'

export const whatsappMessages = {
  code: (code: string) =>
    `*Nome Limpo Express*\n\nSeu código de verificação é: *${code}*\n\nEle vale por 10 minutos. Não compartilhe este código com ninguém.`,
  // O código Pix vai sozinho na mensagem seguinte, para o cliente copiar sem pegar texto junto
  pix: (name: string, amount: number) =>
    `*Nome Limpo Express*\n\nOlá, ${firstName(name)}! Recebemos seu cadastro.\n\n` +
    `Para ativar a regularização, pague a 1ª mensalidade de *R$ ${brl(amount)}* com o Pix Copia e Cola da próxima mensagem (toque e segure para copiar).`,
  paid: (name: string, protocol: string, estimatedDate: string) =>
    `*Nome Limpo Express*\n\n✅ Pagamento confirmado, ${firstName(name)}!\n\n` +
    `Seu processo de regularização já começou.\nProtocolo: *${protocol}*\nPrevisão de conclusão: ${estimatedDate}\n\n` +
    'Qualquer dúvida, é só responder por aqui.',
}
