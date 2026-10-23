import { Cliente, Processo, Assinatura, Cobranca, LogComunicacao, DashboardMetrics } from '../types'
import { mockStore } from './mockStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'
const MOCK_MODE_KEY = 'nomelimpo_mock_mode_active'
const TOKEN_KEY = 'nomelimpo_token'
const SESSION_KEY = 'nomelimpo_admin_session'
export const UNAUTHORIZED_EVENT = 'nomelimpo:unauthorized'

export interface AdminSession {
  token: string
  nome: string
  email: string
  perfil: string
}

/** Sessão expirada/ausente ou token sem perfil de backoffice: a tela volta para o login. */
export class UnauthorizedError extends Error {}

export const SERVER_UNAVAILABLE_MESSAGE = 'Não foi possível falar com o servidor. Tente novamente.'

/** Falha de rede ou erro 5xx: o servidor não respondeu como deveria. */
export class ServerUnavailableError extends Error {
  constructor() {
    super(SERVER_UNAVAILABLE_MESSAGE)
  }
}

/**
 * O modo mockado vem ATIVADO por padrão só em desenvolvimento (validação sem backend);
 * no build de produção o padrão é a API real, com login.
 */
export function isMockModeActive(): boolean {
  try {
    const saved = localStorage.getItem(MOCK_MODE_KEY)
    if (saved === null) return import.meta.env.DEV
    return saved === 'true'
  } catch {
    return import.meta.env.DEV
  }
}

export function setMockModeActive(active: boolean): void {
  try {
    localStorage.setItem(MOCK_MODE_KEY, active ? 'true' : 'false')
  } catch {
    // Ignore
  }
}

export function getSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const session: AdminSession | null = raw ? JSON.parse(raw) : null
    return session?.token && localStorage.getItem(TOKEN_KEY) === session.token ? session : null
  } catch {
    return null
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const errorText = await response.text()
  try {
    return JSON.parse(errorText).message || `Erro ${response.status}: ${response.statusText}`
  } catch {
    return errorText || 'Erro inesperado na requisição.'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ServerUnavailableError()
  }

  if (response.status === 401 || response.status === 403) {
    clearSession()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new UnauthorizedError('Sessão expirada. Entre novamente.')
  }

  if (response.status >= 500) {
    throw new ServerUnavailableError()
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}

// Só em desenvolvimento a falha da API cai nos dados mockados; em produção o erro sobe para
// a tela (leituras e gravações falham de verdade). Falta de login vai para a tela de login.
function fallbackToMock<T>(err: unknown, mock: () => T): T {
  if (err instanceof UnauthorizedError || !import.meta.env.DEV) throw err
  console.warn('API indisponível. Alternando automaticamente para dados mockados.')
  return mock()
}

export const api = {
  isMockMode: isMockModeActive,
  setMockMode: setMockModeActive,
  resetMockData: () => mockStore.resetData(),
  getSession,

  // Autenticação do backoffice (POST /api/auth/login)
  login: async (email: string, senha: string): Promise<AdminSession> => {
    let response: Response
    try {
      response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
    } catch {
      throw new Error('Não foi possível conectar à API. Tente novamente em instantes.')
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }

    const data = await response.json()
    const session: AdminSession = { token: data.token, nome: data.nome, email: data.email, perfil: data.perfil }
    localStorage.setItem(TOKEN_KEY, session.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  logout: () => clearSession(),

  // Dashboard
  getMetrics: async (): Promise<DashboardMetrics> => {
    if (isMockModeActive()) {
      return mockStore.getMetrics()
    }
    try {
      return await request<DashboardMetrics>('/api/dashboard/metrics')
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getMetrics())
    }
  },

  // Clientes
  getClientes: async (search?: string, status?: string): Promise<Cliente[]> => {
    if (isMockModeActive()) {
      return mockStore.getClientes(search, status)
    }
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status && status !== 'Todos') params.append('status', status)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return await request<Cliente[]>(`/api/clientes${qs}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getClientes(search, status))
    }
  },

  getClienteById: async (id: string): Promise<Cliente> => {
    if (isMockModeActive()) {
      return mockStore.getClienteById(id)
    }
    try {
      return await request<Cliente>(`/api/clientes/${id}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getClienteById(id))
    }
  },

  criarCliente: async (dados: {
    tipoPessoa: string
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
    dataNascimentoFundacao?: string
  }): Promise<Cliente> => {
    if (isMockModeActive()) {
      return mockStore.criarCliente(dados)
    }
    try {
      return await request<Cliente>('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(dados),
      })
    } catch (err) {
      return fallbackToMock(err, () => mockStore.criarCliente(dados))
    }
  },

  // Processos
  getProcessos: async (status?: string, search?: string): Promise<Processo[]> => {
    if (isMockModeActive()) {
      return mockStore.getProcessos(status, search)
    }
    try {
      const params = new URLSearchParams()
      if (status && status !== 'Todos') params.append('status', status)
      if (search) params.append('search', search)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return await request<Processo[]>(`/api/processos${qs}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getProcessos(status, search))
    }
  },

  getProcessoById: async (id: string): Promise<Processo> => {
    if (isMockModeActive()) {
      return mockStore.getProcessoById(id)
    }
    try {
      return await request<Processo>(`/api/processos/${id}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getProcessoById(id))
    }
  },

  atualizarStatusProcesso: async (
    id: string,
    payload: {
      novoStatus: string
      titulo: string
      descricao: string
      autor: string
    }
  ): Promise<Processo> => {
    if (isMockModeActive()) {
      return mockStore.atualizarStatusProcesso(id, payload)
    }
    try {
      return await request<Processo>(`/api/processos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      return fallbackToMock(err, () => mockStore.atualizarStatusProcesso(id, payload))
    }
  },

  adicionarNotaProcesso: async (id: string, observacao: string): Promise<Processo> => {
    if (isMockModeActive()) {
      return mockStore.adicionarNotaProcesso(id, observacao)
    }
    try {
      return await request<Processo>(`/api/processos/${id}/notas`, {
        method: 'POST',
        body: JSON.stringify({ observacao }),
      })
    } catch (err) {
      return fallbackToMock(err, () => mockStore.adicionarNotaProcesso(id, observacao))
    }
  },

  // Financeiro & Assinaturas
  getAssinaturas: async (status?: string): Promise<Assinatura[]> => {
    if (isMockModeActive()) {
      return mockStore.getAssinaturas(status)
    }
    try {
      const params = new URLSearchParams()
      if (status && status !== 'Todos') params.append('status', status)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return await request<Assinatura[]>(`/api/financeiro/assinaturas${qs}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getAssinaturas(status))
    }
  },

  getCobrancas: async (status?: string, mes?: string): Promise<Cobranca[]> => {
    if (isMockModeActive()) {
      return mockStore.getCobrancas(status, mes)
    }
    try {
      const params = new URLSearchParams()
      if (status && status !== 'Todos') params.append('status', status)
      if (mes) params.append('mes', mes)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return await request<Cobranca[]>(`/api/financeiro/cobrancas${qs}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getCobrancas(status, mes))
    }
  },

  confirmarPagamentoCobranca: async (id: string): Promise<Cobranca> => {
    if (isMockModeActive()) {
      return mockStore.confirmarPagamentoCobranca(id)
    }
    try {
      return await request<Cobranca>(`/api/financeiro/cobrancas/${id}/confirmar-pagamento`, {
        method: 'POST',
      })
    } catch (err) {
      return fallbackToMock(err, () => mockStore.confirmarPagamentoCobranca(id))
    }
  },

  // Comunicações
  getComunicacoes: async (tipo?: string, canal?: string): Promise<LogComunicacao[]> => {
    if (isMockModeActive()) {
      return mockStore.getComunicacoes(tipo, canal)
    }
    try {
      const params = new URLSearchParams()
      if (tipo && tipo !== 'Todos') params.append('tipo', tipo)
      if (canal && canal !== 'Todos') params.append('canal', canal)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return await request<LogComunicacao[]>(`/api/comunicacoes${qs}`)
    } catch (err) {
      return fallbackToMock(err, () => mockStore.getComunicacoes(tipo, canal))
    }
  },

  dispararComunicacao: async (payload: {
    clienteId: string
    tipo: string
    canal: string
    assunto: string
    mensagem: string
  }): Promise<LogComunicacao> => {
    if (isMockModeActive()) {
      return mockStore.dispararComunicacao(payload)
    }
    try {
      return await request<LogComunicacao>('/api/comunicacoes/disparar', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      return fallbackToMock(err, () => mockStore.dispararComunicacao(payload))
    }
  },
}
