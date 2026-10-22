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
import { ToastProvider } from './components/Toast'
import { api } from './services/api'
import { Cliente, Processo, Assinatura, Cobranca, LogComunicacao, DashboardMetrics } from './types'

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(false)
  const [apiOnline, setApiOnline] = useState(true)
  const [isMockMode, setIsMockMode] = useState<boolean>(() => api.isMockMode())

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
    try {
      setLoading(true)
      const [m, p, c, a, cob, l] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getProcessos().catch(() => []),
        api.getClientes().catch(() => []),
        api.getAssinaturas().catch(() => []),
        api.getCobrancas().catch(() => []),
        api.getComunicacoes().catch(() => []),
      ])

      if (m) {
        setMetrics(m)
        setApiOnline(true)
      }
      setProcessos(p)
      setClientes(c)
      setAssinaturas(a)
      setCobrancas(cob)
      setLogs(l)
    } catch {
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleMockMode = (active: boolean) => {
    api.setMockMode(active)
    setIsMockMode(active)
    setTimeout(() => {
      loadData()
    }, 100)
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
