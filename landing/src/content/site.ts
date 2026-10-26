export const SITE_NAME = 'Nome Limpo Express'
export const SITE_TAGLINE = 'Manutenção e Regularização Cadastral de CPF e CNPJ'
export const SITE_DESCRIPTION =
  'Auxiliamos pessoas físicas e jurídicas na regularização de sua situação cadastral perante órgãos de proteção ao crédito, visando que restrições deixem de ser exibidas em consultas externas por uma assinatura de R$ 100,00/mês.'

export const PLAN_PRICE = 100.0
export const PLAN_PRICE_FORMATTED = 'R$\u00A0100,00'
export const ESTIMATED_DAYS_DELIVERY = '8 a 15 dias úteis'

export const SALES_WHATSAPP_RAW = '5531993585185'
export const SALES_WHATSAPP_DISPLAY = '(31) 9358-5185'
export const SUPPORT_EMAIL = 'suporte@nomelimpo.express'

export const SALES_CONTACT_URL =
  'https://wa.me/5531993585185?text=' +
  encodeURIComponent('Olá! Gostaria de tirar dúvidas sobre o serviço de Nome Limpo Express (R$ 100,00/mês).')

export const SECTION_IDS = {
  hero: 'inicio',
  benefits: 'beneficios',
  howItWorks: 'como-funciona',
  pricing: 'plano',
  comparison: 'comparativo',
  faq: 'duvidas',
  legal: 'aviso-legal',
} as const

export const NAV_ITEMS = [
  { label: 'Benefícios', href: `#${SECTION_IDS.benefits}` },
  { label: 'Como Funciona', href: `#${SECTION_IDS.howItWorks}` },
  { label: 'Plano Mensal', href: `#${SECTION_IDS.pricing}` },
  { label: 'Comparativo', href: `#${SECTION_IDS.comparison}` },
  { label: 'Dúvidas Frequentes', href: `#${SECTION_IDS.faq}` },
]
