import { useState, type FormEvent } from 'react'
import { User, Mail, Phone, Calendar, ArrowRight, ShieldCheck, Building } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { maskCpf, maskCnpj, maskPhone, maskDate } from '@/lib/masks'
import { isValidCpf, isValidCnpj, isValidEmail, isValidPhone, isValidDate } from '@/lib/validators'

export interface RegistrationFormData {
  docType: 'PF' | 'PJ'
  customerName: string
  email: string
  phone: string
  document: string
  birthDate: string
}

interface Step1Props {
  initialDocType?: 'PF' | 'PJ'
  onSubmit: (data: RegistrationFormData) => Promise<void>
  isLoading: boolean
}

export function Step1RegisterForm({ initialDocType = 'PF', onSubmit, isLoading }: Step1Props) {
  const [docType, setDocType] = useState<'PF' | 'PJ'>(initialDocType)
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (customerName.trim().length < 4) {
      errs.customerName = docType === 'PF' ? 'Informe o seu nome completo.' : 'Informe a razão social da sua empresa.'
    }

    if (!isValidEmail(email)) {
      errs.email = 'Informe um e-mail válido para receber o token e o contrato.'
    }

    if (!isValidPhone(phone)) {
      errs.phone = 'Informe o telefone com DDD (10 ou 11 dígitos).'
    }

    if (docType === 'PF') {
      if (!isValidCpf(document)) {
        errs.document = 'CPF inválido. Verifique os números digitados.'
      }
      if (!isValidDate(birthDate)) {
        errs.birthDate = 'Data de nascimento inválida (DD/MM/AAAA).'
      }
    } else {
      if (!isValidCnpj(document)) {
        errs.document = 'CNPJ inválido. Verifique os números digitados.'
      }
      if (!isValidDate(birthDate)) {
        errs.birthDate = 'Data de abertura inválida (DD/MM/AAAA).'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      docType,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      document: document.trim(),
      birthDate: birthDate.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Seletor PF / PJ */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border border-line bg-ink">
        <button
          type="button"
          onClick={() => {
            setDocType('PF')
            setDocument('')
            setErrors({})
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
            docType === 'PF'
              ? 'bg-brand text-ink shadow-md'
              : 'text-cream-dim hover:text-cream'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Pessoa Física (CPF)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setDocType('PJ')
            setDocument('')
            setErrors({})
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
            docType === 'PJ'
              ? 'bg-brand text-ink shadow-md'
              : 'text-cream-dim hover:text-cream'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Empresa (CNPJ)</span>
        </button>
      </div>

      {/* Nome Completo / Razão Social */}
      <div>
        <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-1.5">
          {docType === 'PF' ? 'Nome Completo *' : 'Razão Social da Empresa *'}
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder={docType === 'PF' ? 'Ex: Carlos Alberto da Silva' : 'Ex: Silva & Filhos Comércio LTDA'}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm sm:text-base text-cream placeholder-cream-dim/40 focus:border-brand focus:outline-none transition-colors"
          />
        </div>
        {errors.customerName && <p className="mt-1.5 text-xs text-red-400">{errors.customerName}</p>}
      </div>

      {/* Grid: Documento e Data de Nascimento/Abertura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-1.5">
            {docType === 'PF' ? 'CPF *' : 'CNPJ *'}
          </label>
          <input
            type="text"
            required
            placeholder={docType === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
            value={document}
            onChange={(e) => setDocument(docType === 'PF' ? maskCpf(e.target.value) : maskCnpj(e.target.value))}
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm sm:text-base font-mono text-cream placeholder-cream-dim/40 focus:border-brand focus:outline-none transition-colors"
          />
          {errors.document && <p className="mt-1.5 text-xs text-red-400">{errors.document}</p>}
        </div>

        <div>
          <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-1.5">
            {docType === 'PF' ? 'Data de Nascimento *' : 'Data de Fundação *'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChange={(e) => setBirthDate(maskDate(e.target.value))}
              className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm sm:text-base font-mono text-cream placeholder-cream-dim/40 focus:border-brand focus:outline-none transition-colors"
            />
            <Calendar className="h-5 w-5 absolute right-3.5 top-3.5 text-cream-dim/50 pointer-events-none" />
          </div>
          {errors.birthDate && <p className="mt-1.5 text-xs text-red-400">{errors.birthDate}</p>}
        </div>
      </div>

      {/* Grid: E-mail e Telefone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-1.5">
            E-mail para Receber o Token *
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm sm:text-base text-cream placeholder-cream-dim/40 focus:border-brand focus:outline-none transition-colors"
            />
            <Mail className="h-5 w-5 absolute right-3.5 top-3.5 text-cream-dim/50 pointer-events-none" />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="text-xs sm:text-sm font-mono text-cream-dim block mb-1.5">
            Telefone / WhatsApp *
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm sm:text-base font-mono text-cream placeholder-cream-dim/40 focus:border-brand focus:outline-none transition-colors"
            />
            <Phone className="h-5 w-5 absolute right-3.5 top-3.5 text-cream-dim/50 pointer-events-none" />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
        </div>
      </div>

      {/* Aviso de Segurança */}
      <div className="rounded-xl border border-line/60 bg-ink/70 p-3.5 flex items-center gap-3 text-xs text-cream-dim">
        <ShieldCheck className="h-5 w-5 text-brand-light shrink-0" />
        <span>Seus dados são criptografados com certificado SSL e protegidos nos termos da LGPD.</span>
      </div>

      {/* Botão de envio */}
      <div className="pt-2">
        <Button
          type="submit"
          isLoading={isLoading}
          size="lg"
          className="w-full justify-center gap-2.5 py-4 text-base font-bold shadow-lg"
        >
          <span>Gerar PIX da 1ª Mensalidade (R$ 100,00)</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
