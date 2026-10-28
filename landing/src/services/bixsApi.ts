/**
 * Cliente da API Bixs chamado direto do navegador (a landing não tem servidor próprio).
 * As credenciais vêm das variáveis VITE_BIXS_* da Vercel e ficam visíveis no bundle publicado:
 * risco aceito pelo Pedro em 26/10/2026. Elas nunca vão para o git (o repositório é público).
 */

const BIXS_API_BASE = (import.meta.env.VITE_BIXS_API_BASE || 'https://api.bixs.com.br').replace(/\/$/, '')
const TOKEN_LIFETIME_MS = 50 * 60 * 1000

export class BixsError extends Error {
  status?: number
  detail?: string // Mensagem crua da Bixs, sem o "(status)" do fim

  constructor(message: string, status?: number, detail?: string) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null
let pendingLogin: Promise<string> | null = null

export function isBixsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_BIXS_EMAIL && import.meta.env.VITE_BIXS_PASSWORD)
}

async function login(): Promise<string> {
  if (!isBixsConfigured()) {
    throw new BixsError('Pagamento indisponível: credenciais da Bixs não configuradas (VITE_BIXS_EMAIL / VITE_BIXS_PASSWORD).')
  }

  let response: Response
  try {
    response = await fetch(`${BIXS_API_BASE}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: import.meta.env.VITE_BIXS_EMAIL,
        password: import.meta.env.VITE_BIXS_PASSWORD,
        mac: 'nomelimpo-app',
        source: 'api_externa',
      }),
    })
  } catch {
    throw new BixsError('Não foi possível falar com o gateway de pagamento. Verifique sua conexão.')
  }

  if (!response.ok) {
    throw new BixsError(`Falha na autenticação com o gateway de pagamento (${response.status}).`)
  }

  const data = await response.json()
  const token: string | undefined = data?.access_token || data?.token
  if (!token) throw new BixsError('O gateway de pagamento não devolveu o token de acesso.')

  cachedToken = { value: token, expiresAt: Date.now() + TOKEN_LIFETIME_MS }
  return token
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value
  // Várias chamadas ao mesmo tempo (polling + envio) dividem um login só
  pendingLogin ??= login().finally(() => {
    pendingLogin = null
  })
  return pendingLogin
}

interface BixsRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  /**
   * Manda o X-API-Key. Só nas rotas de pagamento: no WhatsApp a chave troca a conta da consulta
   * (com ela aparecem as instâncias do Contratos), e o NomeLimpo usa a instância da própria conta.
   */
  withApiKey?: boolean
}

export async function bixsRequest<T>(path: string, options: BixsRequestOptions = {}): Promise<T> {
  const send = async (token: string) => {
    const headers: Record<string, string> = { accept: 'application/json', Authorization: `Bearer ${token}` }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (options.withApiKey && import.meta.env.VITE_BIXS_API_KEY) headers['X-API-Key'] = import.meta.env.VITE_BIXS_API_KEY
    return fetch(`${BIXS_API_BASE}/${path.replace(/^\//, '')}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  }

  let response: Response
  try {
    response = await send(await getToken())
    // Token vencido antes da hora: um novo login e uma nova tentativa.
    // A Bixs também responde 401 para código de e-mail errado; esse não é do token e não repete.
    if (response.status === 401 && /token/i.test(await response.clone().text())) {
      cachedToken = null
      response = await send(await getToken())
    }
  } catch (err) {
    if (err instanceof BixsError) throw err
    throw new BixsError('Não foi possível falar com o gateway. Verifique sua conexão e tente novamente.')
  }

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const detail = String(record.message || record.error || '').trim()
    throw new BixsError(
      detail ? `${detail} (${response.status})` : `Erro ${response.status} no gateway.`,
      response.status,
      detail || undefined
    )
  }

  return data as T
}
