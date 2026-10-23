import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar, TabType } from './components/Sidebar'
import { Header } from './components/Header'
import { DashboardView } from './views/DashboardView'
import { ProcessosView } from './views/ProcessosView'
import { ClientesView } from './views/ClientesView'
import { FinanceiroView } from './views/FinanceiroView'
import { ComunicacoesView } from './views/ComunicacoesView'
import { NovoClienteModal } from './views/NovoClienteModal'
import { AreaClienteSimulacaoModal } from './views/AreaClienteSimulacaoModal'
import { ToastProvider, useToast } from './components/Toast'
import { LoginView } from './views/LoginView'
import {
  api,
  AdminSession,
  SERVER_UNAVAILABLE_MESSAGE,
  UNAUTHORIZED_EVENT,
  UnauthorizedError,
} from './services/api'
import { Cliente, Processo, Assinatura, Cobranca, LogComunicacao, DashboardMetrics } from './types'

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(false)
  const [apiOnline, setApiOnline] = useState(true)
  const [isMockMode, setIsMockMode] = useState<boolean>(() => api.isMockMode())
  const [session, setSession] = useState<AdminSession | null>(() => api.getSession())
  const [sessionExpired, setSessionExpired] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { showToast } = useToast()

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [logs, setLogs] = useState<LogComunicacao[]>([])

  // Modal states
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null)
  const [modalNovoClienteOpen, setModalNovoClienteOpen] = useState(false)
  const [modalAreaClienteOpen, setModalAreaClienteOpen] = useState(false)

  const loadData = useCallback(async () => {
    // Sem login no modo API não há o que carregar: a tela de login é exibida
    if (!api.isMockMode() && !api.getSession()) return
    setLoading(true)
    const [m, p, c, a, cob, l] = await Promise.allSettled([
      api.getMetrics(),
      api.getProcessos(),
      api.getClientes(),
      api.getAssinaturas(),
      api.getCobrancas(),
      api.getComunicacoes(),
    ])

    // Só aplica o que veio da API; o que falhou mantém o último dado real (nunca dado simulado)
    if (m.status === 'fulfilled') setMetrics(m.value)
    if (p.status === 'fulfilled') setProcessos(p.value)
    if (c.status === 'fulfilled') setClientes(c.value)
    if (a.status === 'fulfilled') setAssinaturas(a.value)
    if (cob.status === 'fulfilled') setCobrancas(cob.value)
    if (l.status === 'fulfilled') setLogs(l.value)

    // 401/403 já leva para o login; qualquer outra falha vira estado de erro na tela
    const falha = [m, p, c, a, cob, l].find(
      (r): r is PromiseRejectedResult => r.status === 'rejected' && !(r.reason instanceof UnauthorizedError)
    )
    if (falha) {
      const mensagem = falha.reason instanceof Error ? falha.reason.message : SERVER_UNAVAILABLE_MESSAGE
      setLoadError(mensagem)
      setApiOnline(false)
      showToast('Erro ao Carregar', mensagem, 'error')
    } else {
      setLoadError(null)
      setApiOnline(true)
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData, session])

  // 401/403 da API: sessão descartada em services/api.ts, volta para o login
  useEffect(() => {
    const onUnauthorized = () => {
      setSession(null)
      setSessionExpired(true)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const handleToggleMockMode = (active: boolean) => {
    api.setMockMode(active)
    setIsMockMode(active)
    setTimeout(() => {
      loadData()
    }, 100)
  }

  const handleLogout = () => {
    api.logout()
    setSessionExpired(false)
    setSession(null)
  }

  if (!isMockMode && !session) {
    return (
      <LoginView
        sessionExpired={sessionExpired}
        onLoggedIn={(s) => {
          setSessionExpired(false)
          setSession(s)
        }}
        onUseMock={() => handleToggleMockMode(true)}
      />
    )
  }

  const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Visão Geral & Métricas Executivas',
      subtitle: 'Acompanhamento do pipeline de regularização cadastral e assinaturas de R$ 100/mês',
    },
    processos: {
      title: 'Gestão de Processos & Birôs',
      subtitle: 'Controle de ofícios expedidos aos birôs (Serasa, SPC, Boa Vista) e cumprimento de prazos',
    },
    clientes: {
      title: 'Base de Clientes (PF & PJ)',
      subtitle: 'Cadastros validados, status contratual e visão 360° do histórico',
    },
    financeiro: {
      title: 'Financeiro, PIX & Recorrência',
      subtitle: 'Gestão das cobranças mensais de R$ 100, conciliação e política de inadimplência',
    },
    comunicacoes: {
      title: 'Régua de Comunicação & Mensagens',
      subtitle: 'Histórico de e-mails transacionais e notificações WhatsApp automáticas',
    },
  }

  const processosPendentes = processos.filter(
    (p) => p.status === 'EmProcessamento' || p.status === 'NotificacaoBiro'
  ).length

  return (
    <div className="flex min-h-screen bg-slate-50/80 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar persistente */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab)
          setSelectedProcesso(null)
        }}
        totalProcessosPendentes={processosPendentes}
        apiOnline={apiOnline}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={tabTitles[currentTab].title}
          subtitle={tabTitles[currentTab].subtitle}
          onRefresh={loadData}
          onOpenNovoCliente={() => setModalNovoClienteOpen(true)}
          onOpenAreaClienteSimulacao={() => setModalAreaClienteOpen(true)}
          loading={loading}
          isMockMode={isMockMode}
          onToggleMockMode={handleToggleMockMode}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              processos={processos}
              onSelectProcesso={(p) => {
                setSelectedProcesso(p)
                setCurrentTab('processos')
              }}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'processos' && (
            <ProcessosView
              processos={processos}
              selectedProcesso={selectedProcesso}
              onSelectProcesso={setSelectedProcesso}
              onReload={loadData}
            />
          )}

          {currentTab === 'clientes' && (
            <ClientesView
              clientes={clientes}
              onOpenNovoCliente={() => setModalNovoClienteOpen(true)}
              onReload={loadData}
            />
          )}

          {currentTab === 'financeiro' && (
            <FinanceiroView
              cobrancas={cobrancas}
              assinaturas={assinaturas}
              onReload={loadData}
            />
          )}

          {currentTab === 'comunicacoes' && (
            <ComunicacoesView
              logs={logs}
              clientes={clientes}
              onReload={loadData}
            />
          )}
        </main>
      </div>

      {/* Modal de Nova Contratação */}
      <NovoClienteModal
        isOpen={modalNovoClienteOpen}
        onClose={() => setModalNovoClienteOpen(false)}
        onSuccess={loadData}
      />

      {/* Modal de Simulação da Área do Cliente */}
      <AreaClienteSimulacaoModal
        isOpen={modalAreaClienteOpen}
        onClose={() => setModalAreaClienteOpen(false)}
        clientes={clientes}
        processos={processos}
      />
    </div>
  )
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
