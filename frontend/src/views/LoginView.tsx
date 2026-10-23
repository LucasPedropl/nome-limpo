import React, { useState } from 'react'
import { ShieldCheck, LogIn, Sparkles, AlertCircle } from 'lucide-react'
import { api, AdminSession } from '../services/api'

interface LoginViewProps {
  onLoggedIn: (session: AdminSession) => void
  onUseMock: () => void
  sessionExpired?: boolean
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoggedIn, onUseMock, sessionExpired = false }) => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(sessionExpired ? 'Sua sessão expirou. Entre novamente.' : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await api.login(email.trim(), senha)
      onLoggedIn(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center p-6 font-sans antialiased text-slate-900">
      <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm tracking-tight">Nome Limpo — Backoffice</p>
            <p className="text-[11px] text-slate-500">Acesso restrito à equipe operacional</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={onUseMock}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 hover:underline font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Usar modo validação (dados de exemplo, sem API)</span>
        </button>
      </div>
    </div>
  )
}
