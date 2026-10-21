# Nome Limpo Express — Landing Page & Plataforma de Contratação

Landing page de marketing e conversão do **Projeto Nome Limpo**, desenvolvida para apresentar os benefícios do serviço de regularização cadastral perante órgãos externos de proteção ao crédito (Serasa, SPC, Boa Vista), explicar o processo operacional e conduzir o usuário até a contratação e ativação direta via PIX na tela.

Inspirada no layout, padrão visual, fluxo de navegação e estratégia de alta conversão do projeto **TV Studio** (`plus-tv-casa`).

---

## 1. Proposta de Valor & Funcionalidades

1. **Atuação em CPF & CNPJ**: Atendimento especializado para Pessoas Físicas e Empresas buscando reabilitar seu crédito.
2. **Não Exibição de Apontamentos**: Procedimentos extrajudiciais para baixa e ocultação de restrições em consultas públicas externas.
3. **Plano Único e Transparente**: Assinatura mensal fixa de **R$ 100,00/mês** via PIX, sem taxas ocultas e sem fidelidade.
4. **Garantia Contratual Documentada**: Prazo estimado de **30 a 45 dias úteis** para conclusão ou **100% do dinheiro de volta**.
5. **Conformidade com CDC e LGPD**: Disclaimers claros e transparentes (o serviço não promete concessão compulsória de crédito nem apaga restrições internas históricas mantidas por bancos).
6. **Comparativo Visual**: Tabela lado a lado entre permanecer com restrições vs manter o nome limpo.

---

## 2. Fluxo de Contratação Seamless (In-Screen Checkout)

O fluxo ocorre 100% na tela do cliente sem redirecionamento para gateways externos:

- **Etapa 1: Cadastro Inicial**
  - Toggle PF (Pessoa Física) / PJ (Empresa)
  - Nome completo ou Razão Social
  - E-mail e Telefone (WhatsApp)
  - CPF ou CNPJ com algoritmo de validação de dígitos verificadores
  - Data de nascimento ou fundação
- **Etapa 2: Validação via Token**
  - Envio de código OTP de 6 dígitos para o e-mail do titular
  - Input especializado com máscara, contagem regressiva e reenvio
- **Etapa 3: Geração de Cobrança PIX na Própria Tela**
  - QR Code visual em container branco de alto contraste
  - Código Copia e Cola (padrão BACEN BR Code com cálculo real de CRC16)
  - Temporizador regressivo de 15 minutos
  - Polling de verificação automática a cada 2.5s
  - Botão de simulação imediata para testes e demonstração
- **Etapa 4: Confirmação e Ativação do Serviço**
  - Celebração com confetes nativos em Canvas
  - Número de protocolo e contratação gerado (ex: `NL-2026-XXXX`)
  - Data prevista de conclusão calculada (45 dias úteis)
  - Termos da garantia contratual e confirmação de e-mail enviado

---

## 3. Avaliação da Integração com a Plataforma PagWeb

O relatório técnico completo para a diretoria e equipe de engenharia está disponível em:
[`docs/avaliacao_integracao_pagweb.md`](./docs/avaliacao_integracao_pagweb.md).

Principais conclusões:
- **PIX Direto:** O frontend abstrai a geração EMV e polling em `src/services/pagwebService.ts`. Recomenda-se criar um endpoint público desacoplado no backend PagWeb (`/api/v1/public/subscriptions/pix`) sem dependência de endereço prévio.
- **Recorrência:** Gestão via régua de notificações automáticas (D-3, D0, D+3) com PIX avulso enviado por WhatsApp e E-mail até a consolidação do Pix Automático no BACEN.
- **Inadimplência:** Tolerância de 5 dias úteis, suspensão preventiva no D+7 e cancelamento no D+30.

---

## 4. Nova Logo & Identidade Visual

- **Conceito**: Escudo geométrico institucional com vetor ascendente de score financeiro e checkmark de regularização em branco puro, circundado por gradiente de esmeralda (`#10b981`) a azul ciano (`#0284c7`).
- **Arquivos**:
  - `src/components/brand/BrandLogo.tsx`: Componente React vetorizado com microinterações de hover e glow.
  - `public/logo.svg`: Vetor standalone oficial da marca para web e mídia.
  - `public/favicon.svg`: Ícone para abas de navegadores e bookmarks.

---

## 5. Stack Técnica

- **React 19** + **TypeScript 6** + **Vite 8**
- **Tailwind CSS 3** (Paleta executiva dark financeiro com tokens HSL)
- **Lucide Icons**
- **Scripts Nativos**: Zero dependências pesadas, carregamento ultrarrápido (< 350kb bundle gzip).

---

## 6. Comandos e Execução

```bash
# Na pasta apps/Sites/nome-limpo

# 1. Desenvolvimento Local (Porta 5230)
npm run dev

# 2. Verificação de Tipos TypeScript (Strict)
npm run lint

# 3. Build de Produção
npm run build

# 4. Preview do Build
npm run preview
```
