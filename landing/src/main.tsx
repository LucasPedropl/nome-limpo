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

  // Aceita também o endereço sem "#" (/whatsapp-nomelimpo-8317, reescrito no vercel.json)
  const isWhatsAppPage = hash === WHATSAPP_PAGE_HASH || window.location.pathname === WHATSAPP_PAGE_HASH.slice(1)
  return isWhatsAppPage ? <WhatsAppConnectPage /> : <App />
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
