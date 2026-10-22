using System.Net;
using System.Net.Mail;

namespace NomeLimpo.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string bodyHtml);
    Task SendOtpEmailAsync(string to, string code);
    Task SendActivationEmailAsync(string to, string nome, string protocolo, DateTime dataPrevisao);
    Task SendPaymentReceiptEmailAsync(string to, string nome, string protocolo, decimal valor, string txid);
    Task SendCompletionEmailAsync(string to, string nome, string protocolo);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string bodyHtml)
    {
        var smtpServer = _config["EmailSettings:SmtpServer"];
        var portStr = _config["EmailSettings:Port"];
        var senderEmail = _config["EmailSettings:SenderEmail"] ?? "nao-responder@nomelimpoexpress.com.br";
        var senderName = _config["EmailSettings:SenderName"] ?? "Nome Limpo Express";
        var username = _config["EmailSettings:Username"];
        var password = _config["EmailSettings:Password"];

        int port = int.TryParse(portStr, out var p) ? p : 587;

        // Se houver servidor SMTP real configurado
        if (!string.IsNullOrWhiteSpace(smtpServer) && smtpServer != "localhost" && !string.IsNullOrWhiteSpace(username))
        {
            try
            {
                using var client = new SmtpClient(smtpServer, port)
                {
                    EnableSsl = port != 25,
                    Credentials = new NetworkCredential(username, password)
                };

                using var msg = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = bodyHtml,
                    IsBodyHtml = true
                };
                msg.To.Add(to);

                await client.SendMailAsync(msg);
                _logger.LogInformation("E-mail disparado com sucesso via SMTP para {To}: {Subject}", to, subject);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha no envio SMTP para {To}. Gravando log transacional.", to);
            }
        }

        // Simulação / Registro de Desenvolvimento
        _logger.LogInformation("\n========== [DISPARO TRANSACIONAL DE E-MAIL] ==========\nPara: {To}\nAssunto: {Subject}\nCorpo: {BodySnippet}...\n=======================================================",
            to, subject, bodyHtml.Length > 200 ? bodyHtml[..200] : bodyHtml);
    }

    public Task SendOtpEmailAsync(string to, string code)
    {
        var subject = $"Seu Código de Validação: {code} — Nome Limpo Express";
        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;'>
                <h2 style='color: #10b981; margin-top: 0;'>Nome Limpo Express</h2>
                <p style='color: #94a3b8; font-size: 15px;'>Recebemos sua solicitação de cadastro para regularização de CPF/CNPJ.</p>
                <div style='background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;'>
                    <span style='font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;'>Código de Segurança</span>
                    <div style='font-size: 36px; font-weight: bold; color: #34d399; letter-spacing: 8px; margin-top: 8px;'>{code}</div>
                </div>
                <p style='color: #64748b; font-size: 13px;'>Este código é válido por 10 minutos. Se você não solicitou este cadastro, desconsidere esta mensagem.</p>
            </div>";

        return SendEmailAsync(to, subject, html);
    }

    public Task SendActivationEmailAsync(string to, string nome, string protocolo, DateTime dataPrevisao)
    {
        var subject = $"Serviço Ativado com Sucesso — Protocolo {protocolo}";
        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;'>
                <h2 style='color: #10b981; margin-top: 0;'>Serviço de Regularização Ativado!</h2>
                <p style='color: #cbd5e1; font-size: 15px;'>Olá, <strong>{nome}</strong>!</p>
                <p style='color: #94a3b8; font-size: 14px; line-height: 1.6;'>
                    Confirmamos o pagamento da primeira mensalidade de <strong>R$ 100,00</strong>. Sua esteira de regularização cadastral já foi iniciada junto aos birôs externos (Serasa Experian, SPC Brasil e Boa Vista SCPC).
                </p>
                <div style='background: #1e293b; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                    <p style='margin: 4px 0; color: #e2e8f0;'><strong>Número do Protocolo:</strong> <span style='color: #34d399; font-family: monospace;'>{protocolo}</span></p>
                    <p style='margin: 4px 0; color: #e2e8f0;'><strong>Data Prevista para Regularização:</strong> {dataPrevisao:dd/MM/yyyy}</p>
                    <p style='margin: 4px 0; color: #e2e8f0;'><strong>Garantia Contratual:</strong> 45 dias úteis ou 100% do seu dinheiro de volta</p>
                </div>
                <p style='color: #94a3b8; font-size: 13px;'>Você pode acompanhar o andamento em tempo real informando seu CPF ou Protocolo na nossa plataforma.</p>
            </div>";

        return SendEmailAsync(to, subject, html);
    }

    public Task SendPaymentReceiptEmailAsync(string to, string nome, string protocolo, decimal valor, string txid)
    {
        var subject = $"Comprovante de Pagamento — Mensalidade Nome Limpo ({protocolo})";
        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;'>
                <h2 style='color: #10b981; margin-top: 0;'>Pagamento Confirmado</h2>
                <p style='color: #cbd5e1;'>Olá, <strong>{nome}</strong>!</p>
                <p style='color: #94a3b8; font-size: 14px;'>Identificamos com sucesso o pagamento da sua mensalidade via PIX.</p>
                <div style='background: #1e293b; padding: 20px; border-radius: 12px; margin: 20px 0;'>
                    <p style='margin: 4px 0;'><strong>Valor:</strong> R$ {valor:N2}</p>
                    <p style='margin: 4px 0;'><strong>Protocolo:</strong> {protocolo}</p>
                    <p style='margin: 4px 0;'><strong>Transação ID:</strong> {txid}</p>
                    <p style='margin: 4px 0;'><strong>Status:</strong> Liquidado</p>
                </div>
            </div>";

        return SendEmailAsync(to, subject, html);
    }

    public Task SendCompletionEmailAsync(string to, string nome, string protocolo)
    {
        var subject = $"Parabéns! Regularização Concluída — Protocolo {protocolo}";
        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;'>
                <h2 style='color: #10b981; margin-top: 0;'>Processo Concluído com Sucesso!</h2>
                <p style='color: #cbd5e1;'>Prezado(a) <strong>{nome}</strong>,</p>
                <p style='color: #94a3b8; font-size: 14px; line-height: 1.6;'>
                    É com grande satisfação que informamos que o procedimento extrajudicial referente ao protocolo <strong>{protocolo}</strong> foi concluído com êxito.
                </p>
                <p style='color: #34d399; font-weight: bold;'>
                    Nenhum apontamento restritivo negativo encontra-se visível nas consultas públicas de proteção ao crédito (Serasa, SPC Brasil e Boa Vista).
                </p>
                <p style='color: #94a3b8; font-size: 13px; margin-top: 20px;'>
                    Sua assinatura mensal de R$ 100,00 segue ativa para garantir a manutenção contínua e a vigilância contra novas restrições indevidas.
                </p>
            </div>";

        return SendEmailAsync(to, subject, html);
    }
}
