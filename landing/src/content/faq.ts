export interface FaqItem {
  question: string
  answer: string
  category: 'servico' | 'pagamento' | 'credito' | 'garantia'
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'servico',
    question: 'O que é o serviço de Manutenção de Nome Limpo?',
    answer:
      'É uma assessoria especializada que atua para regularizar sua situação cadastral perante órgãos externos de proteção ao crédito (como SPC, Serasa e Boa Vista). O objetivo é fazer com que restrições e apontamentos negativos deixem de ser exibidos em consultas públicas de terceiros, permitindo a recomposição da sua idoneidade cadastral.',
  },
  {
    category: 'credito',
    question: 'A contratação garante aprovação imediata de empréstimos ou cartões?',
    answer:
      'Não. É fundamental deixar claro: o serviço NÃO garante aumento automático de score nem concessão obrigatória de crédito, cartões ou financiamentos por bancos. A concessão de crédito é uma prerrogativa exclusiva da política de risco interna de cada instituição financeira.',
  },
  {
    category: 'credito',
    question: 'O que é o histórico interno bancário (conhecido como "lista negra")?',
    answer:
      'Instituições financeiras nas quais você já tenha tido atrasos ou prejuízos anteriores costumam manter registros internos de relacionamento que não se apagam com a desnegativação nos birôs públicos. Por isso, para novas solicitações de crédito, recomendamos sempre buscar instituições com as quais você ainda não possua histórico anterior de débitos.',
  },
  {
    category: 'garantia',
    question: 'Como funciona a garantia ou dinheiro de volta?',
    answer:
      'Caso os procedimentos contratados não resultem na regularização cadastral perante os órgãos de proteção ao crédito no prazo estipulado contratualmente (8 a 15 dias úteis), o cliente tem direito à devolução integral do valor investido, conforme os termos operacionais pactuados no termo de adesão.',
  },
  {
    category: 'pagamento',
    question: 'Como funciona a cobrança mensal de R$ 100,00?',
    answer:
      'O serviço funciona no modelo de assinatura mensal de R$ 100,00. A primeira mensalidade é paga no ato da contratação via PIX gerado diretamente na tela. As renovações mensais continuam sendo processadas via PIX gerado pela plataforma para manter a manutenção do seu cadastro ativa.',
  },
  {
    category: 'servico',
    question: 'O serviço atende tanto CPF (Pessoa Física) quanto CNPJ (Pessoa Jurídica)?',
    answer:
      'Sim. Desenvolvemos o fluxo para atender tanto pessoas físicas que desejam recuperar seu poder de compra e dignidade cadastral, quanto micro, pequenas e médias empresas que precisam regularizar o CNPJ para emitir certidões e fechar parcerias comerciais.',
  },
  {
    category: 'pagamento',
    question: 'Existe fidelidade ou multa para cancelamento?',
    answer:
      'Não há fidelidade contratual e nem multa de rescisão. Você tem total liberdade para pausar ou cancelar sua assinatura a qualquer momento sem custos adicionais.',
  },
  {
    category: 'servico',
    question: 'Em quanto tempo meu nome deixa de constar como negativado?',
    answer:
      'O prazo médio legal e operacional para processamento junto aos órgãos de proteção ao crédito varia de 8 a 15 dias úteis a contar da compensação da taxa de adesão e envio dos documentos complementares, se houver.',
  },
]
