import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { WhatsAppConnectPage, WHATSAPP_PAGE_PATHS } from './pages/WhatsAppConnectPage'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Falha ao encontrar o elemento root no DOM.')
}

// Página secreta do WhatsApp por hash: funciona na Vercel sem regra de rota
function Root() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Aceita com e sem "#" e o atalho /whatsapp (igual ao site da Bixs); os caminhos sem # são reescritos no vercel.json
  const path = window.location.pathname.replace(/\/$/, '')
  const isWhatsAppPage = WHATSAPP_PAGE_PATHS.some((p) => hash === `#${p}` || path === p)
  return isWhatsAppPage ? <WhatsAppConnectPage /> : <App />
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
