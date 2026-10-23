# Nome Limpo Express — Ecossistema Completo

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
   - Conciliação manual e recepção de webhooks bancários (`POST /api/webhooks/pix-confirmacao`);
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
