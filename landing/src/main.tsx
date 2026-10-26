import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { WhatsAppConnectPage, WHATSAPP_PAGE_HASH } from './pages/WhatsAppConnectPage'
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

  return hash === WHATSAPP_PAGE_HASH ? <WhatsAppConnectPage /> : <App />
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
