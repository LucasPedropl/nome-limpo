import React, { useState } from 'react'
import { X, User, Building, ShieldCheck } from 'lucide-react'
import { api } from '../services/api'

import { useToast } from '../components/Toast'

interface NovoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const NovoClienteModal: React.FC<NovoClienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast()
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF')
  const [nomeRazaoSocial, setNomeRazaoSocial] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    try {
      setLoading(true)
      const novo = await api.criarCliente({
        tipoPessoa,
        nomeRazaoSocial,
        cpfCnpj,
        email,
        telefone,
        dataNascimentoFundacao: dataNasc,
      })
      showToast('Cliente Cadastrado', `Protocolo gerado e plano ativado para ${novo.nomeRazaoSocial}.`, 'success')
      onSuccess()
      onClose()
      setNomeRazaoSocial('')
      setCpfCnpj('')
      setEmail('')
      setTelefone('')
      setDataNasc('')
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar novo cliente.')
      showToast('Erro no Cadastro', err.message || 'Falha ao cadastrar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Nova Contratação & Cliente
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Abertura de processo de regularização e assinatura de R$ 100/mês
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {erro && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Segmented Toggle PF / PJ */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setTipoPessoa('PF')}
              className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                tipoPessoa === 'PF'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Pessoa Física (CPF)</span>
            </button>
            <button
              type="button"
              onClick={() => setTipoPessoa('PJ')}
              className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                tipoPessoa === 'PJ'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Pessoa Jurídica (CNPJ)</span>
            </button>
          </div>

          <div>
            <label className="text-slate-600 font-medium mb-1 block">
              {tipoPessoa === 'PF' ? 'Nome Completo do Titular' : 'Razão Social da Empresa'}
            </label>
            <input
              type="text"
              value={nomeRazaoSocial}
              onChange={(e) => setNomeRazaoSocial(e.target.value)}
              required
              placeholder={tipoPessoa === 'PF' ? 'Ex: Carlos Eduardo de Souza' : 'Ex: Souza Transportes LTDA'}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium mb-1 block">
                {tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                required
                placeholder={tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium mb-1 block">
                {tipoPessoa === 'PF' ? 'Data de Nascimento' : 'Data de Fundação'}
              </label>
              <input
                type="text"
                value={dataNasc}
                onChange={(e) => setDataNasc(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-medium mb-1 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="cliente@email.com"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium mb-1 block">Telefone (WhatsApp)</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                placeholder="(31) 90000-0000"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900 block">Automações Executadas ao Cadastrar:</span>
            <p>• Geração automática do protocolo exclusivo NL-{new Date().getFullYear()}-XXXX</p>
            <p>• Início da contagem do prazo da garantia (45 dias úteis)</p>
            <p>• Criação da assinatura recorrente de R$ 100,00 e primeira cobrança PIX</p>
            <p>• Disparo de e-mail de confirmação e ativação com termos de serviço</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Criar Contratação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

