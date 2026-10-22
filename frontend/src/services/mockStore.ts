import { Cliente, Processo, Assinatura, Cobranca, LogComunicacao, DashboardMetrics } from '../types'
import {
  INITIAL_CLIENTES,
  INITIAL_PROCESSOS,
  INITIAL_ASSINATURAS,
  INITIAL_COBRANCAS,
  INITIAL_COMUNICACOES,
} from './mockData'

const STORAGE_KEY = 'nomelimpo_mock_state_v2'

interface MockState {
  clientes: Cliente[]
  processos: Processo[]
  assinaturas: Assinatura[]
  cobrancas: Cobranca[]
  comunicacoes: LogComunicacao[]
}

function loadState(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.clientes && parsed.processos && parsed.assinaturas) {
        return parsed
      }
    }
  } catch {
    // Ignore error and initialize fresh
  }

  const initial: MockState = {
    clientes: JSON.parse(JSON.stringify(INITIAL_CLIENTES)),
    processos: JSON.parse(JSON.stringify(INITIAL_PROCESSOS)),
    assinaturas: JSON.parse(JSON.stringify(INITIAL_ASSINATURAS)),
    cobrancas: JSON.parse(JSON.stringify(INITIAL_COBRANCAS)),
    comunicacoes: JSON.parse(JSON.stringify(INITIAL_COMUNICACOES)),
  }
  saveState(initial)
  return initial
}

function saveState(state: MockState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage quota
  }
}

// Small latency simulation to make interactions feel realistic and smooth
const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockStore = {
  resetData(): void {
    localStorage.removeItem(STORAGE_KEY)
    loadState()
  },

  async getMetrics(): Promise<DashboardMetrics> {
    await delay(60)
    const state = loadState()

    const totalClientes = state.clientes.length
    const clientesAtivos = state.clientes.filter((c) => c.status === 'Ativo').length
    const clientesInadimplentes = state.clientes.filter((c) => c.status === 'Inadimplente').length

    const processosEmAndamento = state.processos.filter(
      (p) => p.status === 'EmProcessamento' || p.status === 'NotificacaoBiro' || p.status === 'EmAnalise'
    ).length

    const processosConcluidos = state.processos.filter((p) => p.status === 'Concluido').length

    // MRR: Assinaturas ativas * R$ 100/mês
    const receitaMensalRecorrente = state.assinaturas
      .filter((a) => a.status === 'Ativa')
      .reduce((acc, curr) => acc + curr.valorMensal, 0)

    // Total arrecadado no mês atual
    const mesAtual = new Date().toISOString().slice(0, 7)
    const receitaTotalMesAtual = state.cobrancas
      .filter((c) => c.status === 'Pago' && (c.referenciaMes === mesAtual || c.referenciaMes === '2026-10'))
      .reduce((acc, curr) => acc + curr.valor, 0)

    const totalFinalizados = processosConcluidos + state.processos.filter((p) => p.status === 'Cancelado').length
    const taxaSucessoPercentual = totalFinalizados > 0
      ? Math.round((processosConcluidos / totalFinalizados) * 1000) / 10
      : 98.4

    // Processos com previsão próxima (< 15 dias)
    const agora = new Date().getTime()
    const limite = agora + 15 * 86400000
    const processosPertoVencimentoPrazo = state.processos.filter((p) => {
      if (p.status === 'Concluido' || p.status === 'Cancelado') return false
      const prev = new Date(p.dataPrevistaConclusao).getTime()
      return prev <= limite
    }).length

    return {
      totalClientes,
      clientesAtivos,
      clientesInadimplentes,
      processosEmAndamento,
      processosConcluidos,
      receitaMensalRecorrente,
      receitaTotalMesAtual,
      taxaSucessoPercentual,
      processosPertoVencimentoPrazo,
    }
  },

  async getClientes(search?: string, status?: string): Promise<Cliente[]> {
    await delay(70)
    const state = loadState()
    let list = state.clientes.map((c) => ({
      ...c,
      processos: state.processos.filter((p) => p.clienteId === c.id),
      assinaturas: state.assinaturas.filter((a) => a.clienteId === c.id),
      comunicacoes: state.comunicacoes.filter((m) => m.clienteId === c.id),
    }))

    if (search) {
      const term = search.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.nomeRazaoSocial.toLowerCase().includes(term) ||
          c.cpfCnpj.includes(term) ||
          c.email.toLowerCase().includes(term)
      )
    }

    if (status && status !== 'Todos') {
      list = list.filter((c) => c.status === status)
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getClienteById(id: string): Promise<Cliente> {
    await delay(50)
    const state = loadState()
    const c = state.clientes.find((cli) => cli.id === id)
    if (!c) throw new Error('Cliente não encontrado.')

    return {
      ...c,
      processos: state.processos.filter((p) => p.clienteId === c.id),
      assinaturas: state.assinaturas.filter((a) => a.clienteId === c.id),
      comunicacoes: state.comunicacoes.filter((m) => m.clienteId === c.id),
    }
  },

  async criarCliente(dados: {
    tipoPessoa: string
    nomeRazaoSocial: string
    cpfCnpj: string
    email: string
    telefone: string
    dataNascimentoFundacao?: string
  }): Promise<Cliente> {
    await delay(120)
    const state = loadState()

    const novoId = 'cli_' + Math.random().toString(36).substring(2, 9)
    const now = new Date().toISOString()

    const novoCliente: Cliente = {
      id: novoId,
      tipoPessoa: dados.tipoPessoa === 'PJ' ? 'PJ' : 'PF',
      nomeRazaoSocial: dados.nomeRazaoSocial.trim(),
      cpfCnpj: dados.cpfCnpj.trim(),
      email: dados.email.trim().toLowerCase(),
      telefone: dados.telefone.trim(),
      dataNascimentoFundacao: dados.dataNascimentoFundacao,
      status: 'Ativo',
      createdAt: now,
      updatedAt: now,
    }

    // 1. Cria Processo com número de protocolo automático
    const anoAtual = new Date().getFullYear()
    const sufixo = Math.floor(1000 + Math.random() * 9000)
    const protocolo = `NL-${anoAtual}-${sufixo}`
    const dataPrevista = new Date(Date.now() + 45 * 86400000).toISOString()

    const novoProcesso: Processo = {
      id: 'prc_' + Math.random().toString(36).substring(2, 9),
      clienteId: novoId,
      protocolo,
      status: 'EmProcessamento',
      birosNotificados: 'Serasa Experian, SPC Brasil, Boa Vista SCPC',
      dataInicio: now,
      dataPrevistaConclusao: dataPrevista,
      observacoes: 'Processo contratado e cadastrado no Backoffice. Ofícios aos birôs em confecção.',
      garantiaValida: true,
      createdAt: now,
      updatedAt: now,
      historico: [
        {
          id: 'h_' + Math.random().toString(36).substring(2, 9),
          processoId: '',
          status: 'EmProcessamento',
          titulo: 'Processo Formalizado & Protocolo Gerado',
          descricao: `Abertura oficial do atendimento sob o protocolo ${protocolo}. Primeira mensalidade de R$ 100 quitada.`,
          data: now,
          autor: 'Sistema',
        },
      ],
    }

    // 2. Cria Assinatura de R$ 100/mês
    const novaAssinatura: Assinatura = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      clienteId: novoId,
      valorMensal: 100.0,
      status: 'Ativa',
      dataInicio: now,
      proximoVencimento: new Date(Date.now() + 30 * 86400000).toISOString(),
      diaVencimento: new Date().getDate(),
      createdAt: now,
    }

    // 3. Primeira cobrança liquidada
    const novaCobranca: Cobranca = {
      id: 'cob_' + Math.random().toString(36).substring(2, 9),
      assinaturaId: novaAssinatura.id,
      clienteId: novoId,
      valor: 100.0,
      referenciaMes: now.slice(0, 7),
      status: 'Pago',
      txId: 'NL' + Date.now().toString().slice(-8),
      dataVencimento: now,
      dataPagamento: now,
      createdAt: now,
    }

    // 4. Log da régua de comunicação
    const novaComunicacao: LogComunicacao = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      clienteId: novoId,
      tipo: 'AtivacaoServico',
      canal: 'Email',
      destinatario: novoCliente.email,
      assunto: `Serviço Ativado — Protocolo ${protocolo}`,
      conteudo: `Olá ${novoCliente.nomeRazaoSocial}, seu serviço de regularização cadastral foi ativado com sucesso! Protocolo: ${protocolo}. Garantia de 45 dias úteis válida.`,
      status: 'Enviado',
      dataEnvio: now,
    }

    state.clientes.unshift(novoCliente)
    state.processos.unshift(novoProcesso)
    state.assinaturas.unshift(novaAssinatura)
    state.cobrancas.unshift(novaCobranca)
    state.comunicacoes.unshift(novaComunicacao)

    saveState(state)
    return novoCliente
  },

  async getProcessos(status?: string, search?: string): Promise<Processo[]> {
    await delay(70)
    const state = loadState()
    let list = state.processos.map((p) => ({
      ...p,
      cliente: state.clientes.find((c) => c.id === p.clienteId),
    }))

    if (status && status !== 'Todos') {
      list = list.filter((p) => p.status === status)
    }

    if (search) {
      const term = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.protocolo.toLowerCase().includes(term) ||
          (p.cliente?.nomeRazaoSocial || '').toLowerCase().includes(term) ||
          (p.cliente?.cpfCnpj || '').includes(term)
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getProcessoById(id: string): Promise<Processo> {
    await delay(50)
    const state = loadState()
    const proc = state.processos.find((p) => p.id === id)
    if (!proc) throw new Error('Processo não encontrado.')
    return {
      ...proc,
      cliente: state.clientes.find((c) => c.id === proc.clienteId),
    }
  },

  async atualizarStatusProcesso(
    id: string,
    payload: {
      novoStatus: string
      titulo: string
      descricao: string
      autor: string
    }
  ): Promise<Processo> {
    await delay(100)
    const state = loadState()
    const procIndex = state.processos.findIndex((p) => p.id === id)
    if (procIndex === -1) throw new Error('Processo não encontrado.')

    const now = new Date().toISOString()
    const proc = state.processos[procIndex]

    proc.status = payload.novoStatus as any
    proc.updatedAt = now

    if (payload.novoStatus === 'Concluido' && !proc.dataConclusao) {
      proc.dataConclusao = now
    }

    const novoHistorico = {
      id: 'h_' + Math.random().toString(36).substring(2, 9),
      processoId: proc.id,
      status: payload.novoStatus,
      titulo: payload.titulo,
      descricao: payload.descricao,
      data: now,
      autor: payload.autor || 'Operador Backoffice',
    }

    proc.historico = [novoHistorico, ...(proc.historico || [])]

    // Se concluído, registra log de comunicação correspondente ao passo 8 da régua
    if (payload.novoStatus === 'Concluido') {
      const cliente = state.clientes.find((c) => c.id === proc.clienteId)
      if (cliente) {
        state.comunicacoes.unshift({
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          clienteId: cliente.id,
          tipo: 'ConclusaoProcesso',
          canal: 'Email',
          destinatario: cliente.email,
          assunto: `Parabéns! Regularização Concluída — Protocolo ${proc.protocolo}`,
          conteudo: `Prezado(a) ${cliente.nomeRazaoSocial}, informamos com satisfação que a baixa dos apontamentos perante os birôs foi homologada com êxito! Protocolo: ${proc.protocolo}.`,
          status: 'Enviado',
          dataEnvio: now,
        })
      }
    }

    state.processos[procIndex] = proc
    saveState(state)

    return {
      ...proc,
      cliente: state.clientes.find((c) => c.id === proc.clienteId),
    }
  },

  async adicionarNotaProcesso(id: string, observacao: string): Promise<Processo> {
    await delay(80)
    const state = loadState()
    const procIndex = state.processos.findIndex((p) => p.id === id)
    if (procIndex === -1) throw new Error('Processo não encontrado.')

    const proc = state.processos[procIndex]
    const dataFmt = new Date().toLocaleString('pt-BR')
    const novaLinha = `[${dataFmt}] ${observacao.trim()}`

    proc.observacoes = proc.observacoes ? `${proc.observacoes}\n${novaLinha}` : novaLinha
    proc.updatedAt = new Date().toISOString()

    state.processos[procIndex] = proc
    saveState(state)

    return {
      ...proc,
      cliente: state.clientes.find((c) => c.id === proc.clienteId),
    }
  },

  async getAssinaturas(status?: string): Promise<Assinatura[]> {
    await delay(70)
    const state = loadState()
    let list = state.assinaturas.map((a) => ({
      ...a,
      cliente: state.clientes.find((c) => c.id === a.clienteId),
      cobrancas: state.cobrancas
        .filter((cob) => cob.assinaturaId === a.id)
        .sort((x, y) => new Date(y.dataVencimento).getTime() - new Date(x.dataVencimento).getTime()),
    }))

    if (status && status !== 'Todos') {
      list = list.filter((a) => a.status === status)
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getCobrancas(status?: string, mes?: string): Promise<Cobranca[]> {
    await delay(70)
    const state = loadState()
    let list = state.cobrancas.map((c) => {
      const ass = state.assinaturas.find((a) => a.id === c.assinaturaId)
      return {
        ...c,
        assinatura: ass
          ? {
              ...ass,
              cliente: state.clientes.find((cli) => cli.id === ass.clienteId),
            }
          : undefined,
      }
    })

    if (status && status !== 'Todos') {
      list = list.filter((c) => c.status === status)
    }

    if (mes) {
      list = list.filter((c) => c.referenciaMes === mes)
    }

    return list.sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime())
  },

  async confirmarPagamentoCobranca(id: string): Promise<Cobranca> {
    await delay(120)
    const state = loadState()
    const cobIndex = state.cobrancas.findIndex((c) => c.id === id)
    if (cobIndex === -1) throw new Error('Cobrança não encontrada.')

    const cob = state.cobrancas[cobIndex]
    if (cob.status === 'Pago') throw new Error('Esta cobrança já foi liquidada.')

    const now = new Date().toISOString()
    cob.status = 'Pago'
    cob.dataPagamento = now

    // Reativa a assinatura e cliente caso estivessem em atraso
    const assIndex = state.assinaturas.findIndex((a) => a.id === cob.assinaturaId)
    if (assIndex !== -1) {
      const ass = state.assinaturas[assIndex]
      ass.status = 'Ativa'
      const prox = new Date()
      prox.setMonth(prox.getMonth() + 1)
      ass.proximoVencimento = prox.toISOString()
      state.assinaturas[assIndex] = ass

      const cliIndex = state.clientes.findIndex((c) => c.id === ass.clienteId)
      if (cliIndex !== -1) {
        state.clientes[cliIndex].status = 'Ativo'

        // Log da régua de comunicação: confirmação de pagamento
        state.comunicacoes.unshift({
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          clienteId: state.clientes[cliIndex].id,
          tipo: 'ConfirmacaoPagamento',
          canal: 'Email',
          destinatario: state.clientes[cliIndex].email,
          assunto: `Pagamento Confirmado — Mensalidade R$ ${cob.valor.toFixed(2)}`,
          conteudo: `Confirmamos a liquidação manual da sua mensalidade via PIX no valor de R$ ${cob.valor.toFixed(2)}. Manutenção do Nome Limpo estendida com sucesso.`,
          status: 'Enviado',
          dataEnvio: now,
        })
      }
    }

    state.cobrancas[cobIndex] = cob
    saveState(state)
    return cob
  },

  async getComunicacoes(tipo?: string, canal?: string): Promise<LogComunicacao[]> {
    await delay(60)
    const state = loadState()
    let list = state.comunicacoes.map((log) => ({
      ...log,
      cliente: state.clientes.find((c) => c.id === log.clienteId),
    }))

    if (tipo && tipo !== 'Todos') {
      list = list.filter((l) => l.tipo === tipo)
    }

    if (canal && canal !== 'Todos') {
      list = list.filter((l) => l.canal === canal)
    }

    return list.sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime())
  },

  async dispararComunicacao(payload: {
    clienteId: string
    tipo: string
    canal: string
    assunto: string
    mensagem: string
  }): Promise<LogComunicacao> {
    await delay(100)
    const state = loadState()
    const cliente = state.clientes.find((c) => c.id === payload.clienteId)
    if (!cliente) throw new Error('Cliente selecionado não foi encontrado.')

    const novoLog: LogComunicacao = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      clienteId: cliente.id,
      tipo: payload.tipo,
      canal: payload.canal as any,
      destinatario: payload.canal === 'WhatsApp' ? cliente.telefone : cliente.email,
      assunto: payload.assunto,
      conteudo: payload.mensagem,
      status: 'Enviado',
      dataEnvio: new Date().toISOString(),
      cliente,
    }

    state.comunicacoes.unshift(novoLog)
    saveState(state)
    return novoLog
  },
}
