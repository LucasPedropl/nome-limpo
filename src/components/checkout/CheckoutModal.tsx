import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Step1RegisterForm, type RegistrationFormData } from './Step1RegisterForm'
import { Step2TokenValidation } from './Step2TokenValidation'
import { Step3PixPayment } from './Step3PixPayment'
import { Step4SuccessConfirmation } from './Step4SuccessConfirmation'
import { tokenService } from '@/services/tokenService'
import { pagwebService, type PixChargeResponse } from '@/services/pagwebService'
import { contractService, type ContractData } from '@/services/contractService'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  initialDocType?: 'PF' | 'PJ'
}

export function CheckoutModal({ isOpen, onClose, initialDocType = 'PF' }: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState<RegistrationFormData | null>(null)
  const [simulatedCode, setSimulatedCode] = useState<string | undefined>()
  const [pixCharge, setPixCharge] = useState<PixChargeResponse | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Reseta ao fechar
  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(1)
      setFormData(null)
      setPixCharge(null)
      setContract(null)
    }, 300)
  }

  // Passo 1 -> Passo 2 (Envia Token)
  const handleRegisterSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    try {
      setFormData(data)
      const res = await tokenService.sendToken(data.email)
      setSimulatedCode(res.simulatedCode)
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 2 -> Passo 3 (Valida Token e Gera PIX)
  const handleTokenVerified = async () => {
    if (!formData) return
    setIsLoading(true)
    try {
      const charge = await pagwebService.createPixCharge({
        customerName: formData.customerName,
        document: formData.document,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
      })
      setPixCharge(charge)
      setStep(3)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 3 -> Passo 4 (Pagamento Confirmado e Contrato Ativado)
  const handlePaymentSuccess = () => {
    if (!formData) return
    const newContract = contractService.createContract({
      customerName: formData.customerName,
      document: formData.document,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
    })
    setContract(newContract)
    setStep(4)
  }

  const stepTitles = {
    1: 'Contratação — Dados Cadastrais',
    2: 'Validação de Identidade (E-mail)',
    3: 'Pagamento PIX da Mensalidade',
    4: 'Contratação Concluída',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={stepTitles[step]}
      description={step < 4 ? `Etapa ${step} de 3 do processo de adesão` : undefined}
      maxWidth="lg"
    >
      {/* Indicador de Progresso das Etapas */}
      {step < 4 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-cream-dim mb-2">
            <span className={step >= 1 ? 'text-brand-light font-bold' : ''}>1. Cadastro</span>
            <span className={step >= 2 ? 'text-brand-light font-bold' : ''}>2. Token</span>
            <span className={step >= 3 ? 'text-brand-light font-bold' : ''}>3. PIX</span>
          </div>
          <div className="h-1.5 w-full bg-ink rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-gradient-to-r from-brand via-brand-light to-accent transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Renderização condicional dos passos */}
      {step === 1 && (
        <Step1RegisterForm
          initialDocType={initialDocType}
          onSubmit={handleRegisterSubmit}
          isLoading={isLoading}
        />
      )}

      {step === 2 && formData && (
        <Step2TokenValidation
          email={formData.email}
          simulatedCode={simulatedCode}
          onVerified={handleTokenVerified}
          onBack={() => setStep(1)}
          isLoading={isLoading}
        />
      )}

      {step === 3 && pixCharge && (
        <Step3PixPayment
          charge={pixCharge}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {step === 4 && contract && (
        <Step4SuccessConfirmation
          contract={contract}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
}
