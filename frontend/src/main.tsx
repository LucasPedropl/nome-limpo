import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { setMockModeActive } from './services/api'
import './index.css'

// ?demo=1 (redirecionamento da landing após o pagamento) abre o sistema no modo mockado, sem login
const params = new URLSearchParams(window.location.search)
if (params.get('demo') === '1') {
  setMockModeActive(true)
  params.delete('demo')
  const query = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
