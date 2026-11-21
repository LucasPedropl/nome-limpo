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
import {
  isPlanCheckout,
  MIN_PASSWORD_LENGTH,
  subscriptionService,
} from '@/services/subscriptionService'

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
  const [formDataState, setFormData] = useState<RegistrationFormData | null>(null)
  const [otpDispatch, setOtpDispatch] = useState<{ emailDestino?: string; whatsappDestino?: string; simulatedCode?: string } | null>(null)
  const [pixChargeState, setPixCharge] = useState<PixChargeResponse | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const formData = formDataState
  const pixCharge = pixChargeState
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

  const planMode = formData ? isPlanCheckout(formData.docType) : false

  // Assinatura por plano: cria/entra na conta do cliente e assina; já paga vai direto ao sucesso
  const startPlanCheckout = async (data: RegistrationFormData, verificationCode?: string) => {
    const charge = await subscriptionService.subscribe({
      customerName: data.customerName,
      email: data.email,
      document: data.document,
      phone: data.phone,
      password: data.password ?? '',
      verificationCode,
    })
    setPixCharge(charge)
    if (charge.status === 'PAID') {
      await handlePaymentSuccess(undefined, data, charge)
      return
    }
    setStep(3)
  }

  // Gera a cobrança PIX na Bixs e vai para o pagamento
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

  // Passo 1 -> Passo 2 (código no e-mail; pelo WhatsApp só se o e-mail não sair)
  const handleRegisterSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setFormData(data)
      if (isPlanCheckout(data.docType)) {
        const sent = await subscriptionService.sendSignupCode(data.email)
        if (sent.status === 'exists') {
          // E-mail com conta: entra com a senha digitada, sem código
          await startPlanCheckout(data)
          return
        }
        setOtpDispatch({ emailDestino: data.email })
        setStep(2)
        return
      }
      const res = await tokenService.sendToken(data.document, data.email, data.phone)
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }
      setOtpDispatch({ emailDestino: res.emailDestino, whatsappDestino: res.whatsappDestino, simulatedCode: res.simulatedCode })
      setStep(2)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 2 -> Passo 3 (Código confirmado: gera cobrança PIX)
  const handleCodeVerified = async (verificationToken: string) => {
    if (!formData) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      if (isPlanCheckout(formData.docType)) {
        await startPlanCheckout(formData, verificationToken)
      } else {
        await generatePixCharge(formData, verificationToken)
      }
    } catch (err) {
      // Código errado (WrongCodeError) e os outros erros ficam na etapa 2, com a mensagem no topo
      setErrorMessage(err instanceof Error ? err.message : PIX_UNAVAILABLE_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  // Passo 3 -> Passo 4 (Pagamento confirmado na Bixs)
  // data/charge vêm direto quando a assinatura já estava paga (o estado ainda não atualizou)
  const handlePaymentSuccess = async (
    statusResult?: PaymentStatusCheckResult,
    dataOverride?: RegistrationFormData,
    chargeOverride?: PixChargeResponse
  ) => {
    const formData = dataOverride ?? formDataState
    const pixCharge = chargeOverride ?? pixChargeState
    if (!formData) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const paymentId = statusResult?.paymentId || pixCharge?.paymentId
      const newContract = await contractService.createContract({
        customerName: formData.customerName,
        document: formData.document,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        txid: pixCharge?.txid,
        paymentId,
      })
      setContract(newContract)

      pagwebService.saveSession({
        protocolo: newContract.protocolNumber,
        cliente: {
          nomeRazaoSocial: formData.customerName,
          cpfCnpj: formData.document,
          email: formData.email,
          telefone: formData.phone,
        },
        loggedAt: new Date().toISOString(),
      })

      if (paymentId && isPlanCheckout(formData.docType)) {
        void subscriptionService.notifyPaymentConfirmed(
          paymentId,
          formData.phone,
          formData.customerName,
          newContract.protocolNumber,
          newContract.estimatedCompletionDate
        )
      } else if (paymentId) {
        void pagwebService.notifyPaymentConfirmed(paymentId, newContract.protocolNumber, newContract.estimatedCompletionDate)
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

  const totalSteps = 3

  const stepTitles = {
    1: 'Assinar Seu Nome Limpo — Dados do Titular',
    2: 'Código de Confirmação',
    3: 'Pagamento PIX da 1ª Mensalidade',
    4: 'Assinatura Ativa',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={stepTitles[step]}
      description={step < 4 ? `Etapa ${step} de ${totalSteps}: Ativação imediata sem burocracia` : undefined}
      maxWidth="lg"
    >
      {/* Indicador de Progresso das Etapas */}
      {step < 4 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-cream-dim mb-2">
            <span className={step >= 1 ? 'text-brand-light font-bold' : ''}>1. Dados do Titular</span>
            <span className={step >= 2 ? 'text-brand-light font-bold' : ''}>2. Código</span>
            <span className={step >= 3 ? 'text-brand-light font-bold' : ''}>
              {totalSteps}. Pagamento PIX (R$ 129,90)
            </span>
          </div>
          <div className="h-1.5 w-full bg-ink rounded-full overflow-hidden border border-line">
            <div
              className="h-full bg-gradient-to-r from-brand via-brand-light to-accent transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
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
          submitLabel="Receber Código no E-mail"
          needsPassword={isPlanCheckout}
          minPasswordLength={MIN_PASSWORD_LENGTH}
        />
      )}

      {step === 2 && formData && (
        <Step2TokenValidation
          document={formData.document}
          email={formData.email}
          phone={formData.phone}
          emailDestino={otpDispatch?.emailDestino}
          whatsappDestino={otpDispatch?.whatsappDestino}
          simulatedCode={otpDispatch?.simulatedCode}
          onVerified={handleCodeVerified}
          {...(planMode && {
            // O cadastro na Bixs confere o código; aqui só o formato
            verifyCode: async (code: string) =>
              /^\d{6}$/.test(code)
                ? { valid: true, message: '', verificationToken: code }
                : { valid: false, message: 'O código deve ter exatamente 6 dígitos numéricos.' },
            resendCode: async () => {
              try {
                const sent = await subscriptionService.sendSignupCode(formData.email)
                return sent.status === 'sent'
                  ? { success: true, message: '', expiresAt: sent.expiresAt, emailDestino: formData.email }
                  : { success: false, message: 'Este e-mail já tem cadastro. Volte e informe a senha dessa conta.', expiresAt: 0 }
              } catch (err) {
                return { success: false, message: err instanceof Error ? err.message : 'Não foi possível reenviar.', expiresAt: 0 }
              }
            },
          })}
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
          {...(planMode && { checkStatus: subscriptionService.checkPaymentStatus, allowSimulation: false })}
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
