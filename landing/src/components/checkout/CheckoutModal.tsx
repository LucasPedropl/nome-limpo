import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Step1RegisterForm, type RegistrationFormData } from './Step1RegisterForm'
import { Step2TokenValidation } from './Step2TokenValidation'
import { Step3PixPayment } from './Step3PixPayment'
import { Step4SuccessConfirmation } from './Step4SuccessConfirmation'
import {
  pagwebService,
  PIX_UNAVAILABLE_MESSAGE,
  type PixChargeResponse,
  type PaymentStatusCheckResult,
} from '@/services/pagwebService'
import { contractService, type ContractData } from '@/services/contractService'
import { tokenService } from '@/services/tokenService'

// VITE_CHECKOUT_EXIGIR_EMAIL=false oculta a etapa do código no e-mail (demonstração sem SMTP).
// A API precisa estar com Checkout__ExigirVerificacaoEmail=false, senão recusa o PIX sem o comprovante.
const EXIGIR_VERIFICACAO_EMAIL = import.meta.env.VITE_CHECKOUT_EXIGIR_EMAIL !== 'false'

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState<RegistrationFormData | null>(null)
  const [otpDispatch, setOtpDispatch] = useState<{ emailDestino?: string; simulatedCode?: string } | null>(null)
  const [pixCharge, setPixCharge] = useState<PixChargeResponse | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Reseta ao fechar
  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(1)
      setFormData(null)
      setOtpDispatch(null)
      setPixCharge(null)
      setContract(null)
      setErrorMessage('')
    }, 300)
  }

  // Gera a cobrança PIX imediata via Bixs Cora Gateway e vai para o pagamento
  const generatePixCharge = async (data: RegistrationFormData, verificationToken: string) => {
    const charge = await pagwebService.createPixCharge({
      customerName: data.customerName,
      document: data.document,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
      verificationToken,
    })
    setPixCharge(charge)
    setStep(3)
  }

  // Passo 1 -> Passo 2 (Envia o código de confirmação; CPF/CNPJ já cadastrado recebe no e-mail do cadastro)
  const handleRegisterSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setFormData(data)
      if (!EXIGIR_VERIFICACAO_EMAIL) {
        // Etapa do e-mail desligada: direto para o PIX
        await generatePixCharge(data, '')
        return
      }
      const res = await tokenService.sendToken(data.document, data.email)
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }
      setOtpDispatch({ emailDestino: res.emailDestino, simulatedCode: res.simulatedCode })
      setStep(2)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 2 -> Passo 3 (Código confirmado: gera cobrança PIX imediata via Bixs Cora Gateway)
  const handleCodeVerified = async (verificationToken: string) => {
    if (!formData) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      await generatePixCharge(formData, verificationToken)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 3 -> Passo 4 (Pagamento Confirmado no Gateway; o login é na Área do Cliente com código no e-mail)
  const handlePaymentSuccess = async (statusResult?: PaymentStatusCheckResult) => {
    if (!formData) return
    setIsLoading(true)
    setErrorMessage('')
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
        paymentId: statusResult?.paymentId || pixCharge?.paymentId,
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

      setStep(4)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível concluir sua assinatura agora. Tente novamente em alguns minutos.'
      )
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

  // Sem a etapa do e-mail o PIX vira a etapa 2 de 2
  const totalSteps = EXIGIR_VERIFICACAO_EMAIL ? 3 : 2
  const displayStep = !EXIGIR_VERIFICACAO_EMAIL && step === 3 ? 2 : step

  const stepTitles = {
    1: 'Assinar Nome Limpo — Dados do Titular',
    2: 'Confirmação do E-mail',
    3: 'Pagamento PIX da 1ª Mensalidade',
    4: 'Assinatura Ativa',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={stepTitles[step]}
      description={step < 4 ? `Etapa ${displayStep} de ${totalSteps}: Ativação imediata sem burocracia` : undefined}
      maxWidth="lg"
    >
      {/* Indicador de Progresso das Etapas */}
      {step < 4 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-cream-dim mb-2">
            <span className={step >= 1 ? 'text-brand-light font-bold' : ''}>1. Dados do Titular</span>
            {EXIGIR_VERIFICACAO_EMAIL && (
              <span className={step >= 2 ? 'text-brand-light font-bold' : ''}>2. Código no E-mail</span>
            )}
            <span className={step >= 3 ? 'text-brand-light font-bold' : ''}>
              {totalSteps}. Pagamento PIX (R$ 100)
            </span>
          </div>
          <div className="h-1.5 w-full bg-ink rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-gradient-to-r from-brand via-brand-light to-accent transition-all duration-300"
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-2.5 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Renderização condicional dos passos */}
      {step === 1 && (
        <Step1RegisterForm
          initialDocType={initialDocType}
          initialData={formData}
          onSubmit={handleRegisterSubmit}
          isLoading={isLoading}
          submitLabel={EXIGIR_VERIFICACAO_EMAIL ? undefined : 'Gerar PIX de Pagamento'}
        />
      )}

      {step === 2 && formData && (
        <Step2TokenValidation
          document={formData.document}
          email={formData.email}
          emailDestino={otpDispatch?.emailDestino}
          simulatedCode={otpDispatch?.simulatedCode}
          onVerified={handleCodeVerified}
          onBack={() => {
            setErrorMessage('')
            setStep(1)
          }}
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
          onOpenPortal={handleOpenSubscriberPortal}
        />
      )}
    </Modal>
  )
}
