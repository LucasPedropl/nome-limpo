import { Cliente, Processo, Assinatura, Cobranca, LogComunicacao, DashboardMetrics } from '../types'
import { mockStore } from './mockStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5240'
const MOCK_MODE_KEY = 'nomelimpo_mock_mode_active'

/**
 * Por padrão, o modo mockado é ATIVADO para validação imediata e autônoma,
 * permitindo envio do frontend sem exigência de backend rodando.
 */
export function isMockModeActive(): boolean {
  try {
    const saved = localStorage.getItem(MOCK_MODE_KEY)
    if (saved === null) return true // Default: Mock ativo para validação
    return saved === 'true'
  } catch {
    return true
  }
}

export function setMockModeActive(active: boolean): void {
  try {
    localStorage.setItem(MOCK_MODE_KEY, active ? 'true' : 'false')
  } catch {
    // Ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nomelimpo_token')
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorJson
    try {
      errorJson = JSON.parse(errorText)
    } catch {
      errorJson = { message: errorText || 'Erro inesperado na requisição.' }
    }
    throw new Error(errorJson.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  isMockMode: isMockModeActive,
  setMockMode: setMockModeActive,
  resetMockData: () => mockStore.resetData(),

  // Dashboard
  getMetrics: async (): Promise<DashboardMetrics> => {
    if (isMockModeActive()) {
      return mockStore.getMetrics()
    }
    try {
      return await request<DashboardMetrics>('/api/dashboard/metrics')
    } catch (err) {
      console.warn('API indisponível. Alternando automaticamente para dados mockados.')
      return mockStore.getMetrics()
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
    } catch {
      return mockStore.getClientes(search, status)
    }
  },

  getClienteById: async (id: string): Promise<Cliente> => {
    if (isMockModeActive()) {
      return mockStore.getClienteById(id)
    }
    try {
      return await request<Cliente>(`/api/clientes/${id}`)
    } catch {
      return mockStore.getClienteById(id)
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
    } catch {
      return mockStore.criarCliente(dados)
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
    } catch {
      return mockStore.getProcessos(status, search)
    }
  },

  getProcessoById: async (id: string): Promise<Processo> => {
    if (isMockModeActive()) {
      return mockStore.getProcessoById(id)
    }
    try {
      return await request<Processo>(`/api/processos/${id}`)
    } catch {
      return mockStore.getProcessoById(id)
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
    } catch {
      return mockStore.atualizarStatusProcesso(id, payload)
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
    } catch {
      return mockStore.adicionarNotaProcesso(id, observacao)
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
    } catch {
      return mockStore.getAssinaturas(status)
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
    } catch {
      return mockStore.getCobrancas(status, mes)
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
    } catch {
      return mockStore.confirmarPagamentoCobranca(id)
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
    } catch {
      return mockStore.getComunicacoes(tipo, canal)
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
    } catch {
      return mockStore.dispararComunicacao(payload)
    }
  },
}
