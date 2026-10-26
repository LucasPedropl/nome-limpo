# Nome Limpo Express — Ecossistema Completo

> **A landing (`landing/`) funciona sozinha**, falando direto com a Bixs (Pix e WhatsApp): veja `landing/README.md`. A `api/` e o `frontend/` (backoffice) foram criados por engano e a landing não depende deles; o serviço `nomelimpo-api` no Render pode ser desligado depois que a landing nova estiver no ar.

Plataforma digital integrada para contratação e gestão do serviço de manutenção de nome limpo e regularização cadastral de CPF e CNPJ perante os órgãos externos de proteção ao crédito (Serasa Experian, SPC Brasil e Boa Vista SCPC), com modelo de assinatura mensal de R$ 100,00 via PIX e garantia documentada de 30 a 45 dias úteis (ou 100% de restituição).

---

## 1. Estrutura do Projeto

```
apps/nomelimpo/
├── api/             # Backend .NET 8 Web API + SQLite/SQL Server (Porta 5240)
├── frontend/        # Backoffice Operacional Administrativo em React 19 + Vite (Porta 5242)
├── landing/         # Landing Page de Marketing & Checkout Seamless em React 19 + Vite (Porta 5230)
└── run.ps1          # Script PowerShell de inicialização simultânea dos 3 serviços
```

---

## 2. Portas e Serviços Locais

| Módulo | Stack | Porta / URL | Finalidade |
| :--- | :--- | :--- | :--- |
| **`api`** | .NET 8, EF Core, SQLite | [http://localhost:5240](http://localhost:5240) | Controllers de Processos, Clientes, Financeiro, Checkout Público, Webhooks e Régua de Mensageria. Documentação Swagger em `/swagger`. |
| **`frontend`** | React 19, Vite, Tailwind | [http://localhost:5242](http://localhost:5242) | Backoffice operacional da equipe jurídica e administrativa para despacho de processos, alteração de fases, conciliação e simulação da Área do Cliente. |
| **`landing`** | React 19, Vite, Tailwind | [http://localhost:5230](http://localhost:5230) | Página de alta conversão para captação de clientes PF/PJ, checkout em modal (Cadastro -> OTP -> PIX -> Ativação) e consulta pública da Área do Cliente. |

---

## 3. Funcionalidades Implementadas (Conforme Projeto Nome Limpo.pdf)

1. **Funil de Contratação Seamless:**
   - Onboarding direto na Landing Page com toggle PF/PJ, validação de token OTP por e-mail, geração de PIX EMV BACEN real com CRC16 e ativação instantânea.
2. **Esteira de Regularização nos Birôs:**
   - Fases: *Em Processamento* (Triagem), *Notificado aos Birôs* (Serasa/SPC/Boa Vista), *Em Análise* e *Concluído*;
   - Histórico cronológico com autor, despacho e data;
   - Notas internas para a equipe jurídica;
   - Monitoramento do prazo de 30 a 45 dias úteis com controle de garantia ativa.
3. **Gestão Financeira & Cobrança Recorrente:**
   - Mensalidade fixa de R$ 100,00/mês;
   - Conciliação manual e recepção do webhook Bixs (`POST /api/public/pagamentos/webhook`, confirmado por reconsulta à Bixs); os webhooks legados `/api/webhooks/*` só respondem em Development;
   - Política de inadimplência em 4 etapas (D-3 preventivo, D+5 tolerância, D+7 suspensão e D+30 cancelamento).
4. **Motor de Mensageria Automática & Régua Transacional:**
   - Registro e envio de e-mails para os 8 eventos obrigatórios do documento:
     1. Confirmação de cadastro
     2. Validação OTP de conta
     3. Emissão de cobrança PIX
     4. Confirmação de pagamento
     5. Ativação do serviço
     6. Aviso de vencimento
     7. Confirmação de renovação
     8. Conclusão do processo
5. **Área do Cliente Pública:**
   - Acessível na Landing Page (`Área do Cliente`) e no Backoffice (`Simulação`);
   - Consulta em tempo real usando apenas CPF/CNPJ ou número de protocolo `NL-2026-XXXX`.

---

## 4. Como Executar

```powershell
# Executar todos os serviços de uma vez:
powershell -ExecutionPolicy Bypass -File apps/nomelimpo/run.ps1

# Ou executar individualmente:
# 1. API:
cd apps/nomelimpo/api && dotnet run --launch-profile http

# 2. Backoffice:
cd apps/nomelimpo/frontend && npm run dev

# 3. Landing Page:
cd apps/nomelimpo/landing && npm run dev
```

> **Credenciais da API**: nunca ficam no `appsettings*.json` (lá os campos estão vazios). Em dev, defina-as com `dotnet user-secrets set "<chave>" "<valor>"` dentro de `api/`: `Jwt:Key`, `Bixs:Email`, `Bixs:Password`, `Bixs:ApiKey`, `Bixs:Mac`, `Bixs:Source` (e os aliases `BixAPI:Email`, `BixAPI:Password`, `BixAPI:API-Key`).
> Em produção, use variáveis de ambiente (`Jwt__Key`, `Bixs__ApiKey`, ...). Sem `Jwt:Key` a API não sobe; sem as credenciais Bixs o checkout PIX falha com erro explícito.
> E-mail: mesmo SMTP do PagWeb e do Contratos (`mail.uaipdv.com.br:587`, sem SSL, conta `uai@uaipdv.com.br`, já no `appsettings.json`). Só a senha é segredo: `EmailSettings:Password` (produção: `EmailSettings__Password`). Sem ela os pedidos de código respondem 503 fora de Development.
> Admin inicial (fora de Development): `Admin__Email` e `Admin__Password` criam o primeiro admin quando a base não tem nenhum; sem eles nenhum admin é criado (só um aviso no log). O seed `admin@nomelimpo.com.br`/`admin123` e os clientes de demonstração existem só em Development.
> Autenticação: toda rota da API exige token de usuário do backoffice (Perfil `Admin`/`Operador`, via `POST /api/auth/login`) por padrão; as públicas (checkout, login, status/webhook de pagamento, health) são marcadas `[AllowAnonymous]`. Token de cliente recebe 403 no backoffice. O backoffice (`frontend/`) pede login quando o modo validação (mock) está desligado — padrão no build de produção.
> Checkout: `iniciar` exige o `verificationToken` devolvido por `POST /api/public/checkout/validar-otp`, amarrado ao CPF/CNPJ e ao e-mail que recebeu o código. CPF/CNPJ já cadastrado recebe o código no e-mail do cadastro, e o cadastro existente não é alterado pelo checkout.
> WhatsApp: sai pela instância de WhatsApp da mesma conta Bixs do Pix (número da empresa conectado por QR Code, API **não oficial**). Começa **desligado** e é ligado/desligado a qualquer momento no backoffice (aba `E-mails & WhatsApp`), porque disparo automático por API não oficial pode fazer o número ser banido. Ligado, manda o código de verificação do checkout e da Área do Cliente (para o telefone do cadastro, quando o CPF/CNPJ já existe), os dados do Pix e a confirmação do pagamento. A chave fica no banco (`ConfiguracoesSistema`); sem registro vale `WhatsApp__Ativo` (padrão `false`) — útil enquanto o banco do Render é recriado a cada reinício. Com o WhatsApp ligado o código chega mesmo sem SMTP.
