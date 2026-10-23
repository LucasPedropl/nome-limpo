import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Step1RegisterForm, type RegistrationFormData } from './Step1RegisterForm'
import { Step3PixPayment } from './Step3PixPayment'
import { Step4SuccessConfirmation } from './Step4SuccessConfirmation'
import { pagwebService, type PixChargeResponse, type PaymentStatusCheckResult } from '@/services/pagwebService'
import { contractService, type ContractData } from '@/services/contractService'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAreaCliente?: () => void
  initialDocType?: 'PF' | 'PJ'
}

export function CheckoutModal({
  isOpen,
  onClose,
  onOpenAreaCliente,
  initialDocType = 'PF',
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<RegistrationFormData | null>(null)
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

  // Passo 1 -> Passo 2 (Gera cobrança PIX imediata via Bixs Cora Gateway)
  const handleRegisterSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    try {
      setFormData(data)
      const charge = await pagwebService.createPixCharge({
        customerName: data.customerName,
        document: data.document,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
      })
      setPixCharge(charge)
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 2 -> Passo 3 (Pagamento Confirmado no Gateway e Login Imediato no Sistema)
  const handlePaymentSuccess = async (statusResult?: PaymentStatusCheckResult) => {
    if (!formData) return
    setIsLoading(true)
    try {
      const protocolo = statusResult?.protocolo || pixCharge?.protocolo
      const token = statusResult?.token || pixCharge?.token

      const newContract = await contractService.createContract({
        customerName: formData.customerName,
        document: formData.document,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        txid: pixCharge?.txid,
      })

      if (protocolo) {
        newContract.protocolNumber = protocolo
      }

      setContract(newContract)

      // Garante que a sessão autenticada está salva
      if (token && statusResult?.cliente) {
        pagwebService.saveSession({
          token,
          protocolo: newContract.protocolNumber,
          cliente: statusResult.cliente,
          loggedAt: new Date().toISOString(),
        })
      }

      setStep(3)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSubscriberPortal = () => {
    handleClose()
    if (onOpenAreaCliente) {
      setTimeout(() => {
        onOpenAreaCliente()
      }, 200)
    }
  }

  const stepTitles = {
    1: 'Assinar Nome Limpo — Dados do Titular',
    2: 'Pagamento PIX da 1ª Mensalidade',
    3: 'Assinatura Ativa & Login Concluído',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={stepTitles[step]}
      description={step < 3 ? `Etapa ${step} de 2: Ativação imediata sem burocracia` : undefined}
      maxWidth="lg"
    >
      {/* Indicador de Progresso das Etapas */}
      {step < 3 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-cream-dim mb-2">
            <span className={step >= 1 ? 'text-brand-light font-bold' : ''}>1. Dados do Titular</span>
            <span className={step >= 2 ? 'text-brand-light font-bold' : ''}>2. Pagamento PIX (R$ 100)</span>
          </div>
          <div className="h-1.5 w-full bg-ink rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-gradient-to-r from-brand via-brand-light to-accent transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
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

      {step === 2 && pixCharge && (
        <Step3PixPayment
          charge={pixCharge}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {step === 3 && contract && (
        <Step4SuccessConfirmation
          contract={contract}
          onClose={handleClose}
          onOpenPortal={handleOpenSubscriberPortal}
        />
      )}
    </Modal>
  )
}
