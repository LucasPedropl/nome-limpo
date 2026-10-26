namespace NomeLimpo.Api.Models;

public class Cliente
{
    public string Id { get; set; } = string.Empty;
    public string TipoPessoa { get; set; } = "PF"; // "PF" | "PJ"
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string CpfCnpj { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? DataNascimentoFundacao { get; set; }
    public string Status { get; set; } = "Ativo"; // "Ativo", "Inadimplente", "Cancelado"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Processo> Processos { get; set; } = new();
    public List<Assinatura> Assinaturas { get; set; } = new();
    public List<LogComunicacao> Comunicacoes { get; set; } = new();
}

public class Processo
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string Protocolo { get; set; } = string.Empty; // ex: NL-2026-0042
    public string Status { get; set; } = "EmProcessamento"; 
    // Status possíveis: "AguardandoPagamento", "EmProcessamento", "NotificacaoBiro", "EmAnalise", "Concluido", "Cancelado"
    public string BirosNotificados { get; set; } = "Serasa, SPC Brasil, Boa Vista SCPC";
    public DateTime DataInicio { get; set; } = DateTime.UtcNow;
    public DateTime DataPrevistaConclusao { get; set; } = DateTime.UtcNow.AddDays(45); // 30 a 45 dias úteis
    public DateTime? DataConclusao { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public bool GarantiaValida { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Cliente? Cliente { get; set; }
    public List<HistoricoStatus> Historico { get; set; } = new();
}

public class HistoricoStatus
{
    public string Id { get; set; } = string.Empty;
    public string ProcessoId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public string Autor { get; set; } = "Sistema";

    public Processo? Processo { get; set; }
}

public class Assinatura
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public decimal ValorMensal { get; set; } = 100.00m; // Conforme modelo de negócio do documento (R$ 100,00/mês)
    public string Status { get; set; } = "Ativa"; // "Ativa", "Pendente", "Atrasada", "Cancelada"
    public DateTime DataInicio { get; set; } = DateTime.UtcNow;
    public DateTime ProximoVencimento { get; set; } = DateTime.UtcNow.AddMonths(1);
    public int DiaVencimento { get; set; } = DateTime.UtcNow.Day;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cliente? Cliente { get; set; }
    public List<Cobranca> Cobrancas { get; set; } = new();
}

public class Cobranca
{
    public string Id { get; set; } = string.Empty;
    public string AssinaturaId { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public decimal Valor { get; set; } = 100.00m;
    public int AmountCents { get; set; } = 10000;
    public string ReferenciaMes { get; set; } = DateTime.UtcNow.ToString("yyyy-MM");
    public string Status { get; set; } = "Pendente"; // "Pendente", "Pago", "Atrasado", "Cancelado"
    public string TxId { get; set; } = string.Empty;
    public string PixCopiaECola { get; set; } = string.Empty;
    public string? PixEmv { get; set; }
    public string QrCodeUrl { get; set; } = string.Empty;
    public string? CoraInvoiceId { get; set; }
    public string? ExternalCode { get; set; }
    public string? BankSlipUrl { get; set; }
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public DateTime DataVencimento { get; set; } = DateTime.UtcNow.AddDays(3);
    public DateTime? DataPagamento { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Assinatura? Assinatura { get; set; }
}

public class LogComunicacao
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty; 
    // "ConfirmacaoCadastro", "TokenValidacao", "CobrancaPix", "ConfirmacaoPagamento", "AtivacaoServico", "AvisoVencimento", "ConfirmacaoRenovacao", "ConclusaoProcesso"
    public string Canal { get; set; } = "Email"; // "Email", "WhatsApp"
    public string Destinatario { get; set; } = string.Empty;
    public string Assunto { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public string Status { get; set; } = "Enviado"; // "Enviado", "Falha", "Pendente"
    public DateTime DataEnvio { get; set; } = DateTime.UtcNow;

    public Cliente? Cliente { get; set; }
}

public class UsuarioAdmin
{
    public string Id { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string Perfil { get; set; } = "Admin"; // "Admin", "Operador"
    public bool Ativo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Chaves de configuração alteradas pelo backoffice em tempo de execução (ex.: WhatsApp ligado/desligado).</summary>
public class ConfiguracaoSistema
{
    public string Chave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? AlteradoPor { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
