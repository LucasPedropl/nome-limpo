using System.Text.Json.Serialization;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Dtos;

// --- DTOs de envio para o Gateway Bixs (v1/api/payment/invoices) ---

public class PaymentRequestDto
{
    [JsonPropertyName("provider")]
    public string? Provider { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; } // Em centavos

    [JsonPropertyName("customer_payment")]
    public CustomerPaymentRequestDto? CustomerPayment { get; set; }

    [JsonPropertyName("due_date")]
    public string? DueDate { get; set; } // yyyy-MM-dd

    [JsonPropertyName("external_code")]
    public string? ExternalCode { get; set; }

    [JsonPropertyName("payment_type")]
    public string? PaymentType { get; set; } = "pix";

    [JsonPropertyName("service_desc")]
    public string? ServiceDesc { get; set; }

    [JsonPropertyName("service_name")]
    public string? ServiceName { get; set; }
}

public class CustomerPaymentRequestDto
{
    [JsonPropertyName("address")]
    public AddressDto? Address { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("document_type")]
    public string? DocumentType { get; set; } = "CPF";

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}

public class AddressDto
{
    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; } = "BRA";

    [JsonPropertyName("district")]
    public string? District { get; set; }

    [JsonPropertyName("number")]
    public string? Number { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("street")]
    public string? Street { get; set; }

    [JsonPropertyName("zip_code")]
    public string? ZipCode { get; set; }
}

// --- DTOs de resposta do Gateway Bixs ---

public class PaymentResponseDto
{
    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("bank_slip_url")]
    public string? BankSlipUrl { get; set; }

    [JsonPropertyName("barcode")]
    public string? Barcode { get; set; }

    [JsonPropertyName("cora_invoice_id")]
    public string? CoraInvoiceId { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("digitable_line")]
    public string? DigitableLine { get; set; }

    [JsonPropertyName("due_date")]
    public string? DueDate { get; set; }

    [JsonPropertyName("external_code")]
    public string? ExternalCode { get; set; }

    [JsonPropertyName("idempotency_key")]
    public string? IdempotencyKey { get; set; }

    [JsonPropertyName("paid_at")]
    public string? PaidAt { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("payment_type")]
    public string? PaymentType { get; set; }

    [JsonPropertyName("pix_emv")]
    public string? PixEmv { get; set; }

    [JsonPropertyName("service_desc")]
    public string? ServiceDesc { get; set; }

    [JsonPropertyName("service_name")]
    public string? ServiceName { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("total_paid")]
    public int TotalPaid { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

// --- DTOs da API pública para Landing Page e Frontend ---

public class IniciarPagamentoRequest
{
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string CpfCnpj { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? TipoPessoa { get; set; } // "PF" | "PJ"
    public string? DataNascimentoFundacao { get; set; }
    public decimal? Valor { get; set; }
    public string? DueDate { get; set; }
    public AddressDto? Endereco { get; set; }
}

public class PaymentResultDto
{
    public string PaymentId { get; set; } = string.Empty;
    public string TxId { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string AssinaturaId { get; set; } = string.Empty;
    public int AmountCents { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? PixEmv { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? CoraInvoiceId { get; set; }
    public string? ExternalCode { get; set; }
    public string? BankSlipUrl { get; set; }
    public string? DueDate { get; set; }
    public string? ExpiresAt { get; set; }
    public string? PaidAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class PaymentStatusResponse
{
    public string PaymentId { get; set; } = string.Empty;
    public string TxId { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public bool IsPaid { get; set; }
    public string? PaidAt { get; set; }
    public decimal Amount { get; set; }
    public string? Protocolo { get; set; }
    public string? Token { get; set; }
    public ClienteSummaryDto? Cliente { get; set; }
}

public class ClienteSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string NomeRazaoSocial { get; set; } = string.Empty;
    public string CpfCnpj { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Status { get; set; } = "Ativo";
}

public class ClienteLoginRequest
{
    public string? CpfCnpj { get; set; }
    public string? Email { get; set; }
    public string? Protocolo { get; set; }
}

// --- Webhook de Repasse / Notificação Bixs ---

public class PagamentoRepasse
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("delivered_at")]
    public DateTime? DeliveredAt { get; set; }

    [JsonPropertyName("data")]
    public PagamentoRepasseData? Data { get; set; }
}

public class PagamentoRepasseData
{
    [JsonPropertyName("invoice_id")]
    public string? InvoiceId { get; set; }

    [JsonPropertyName("cora_invoice_id")]
    public string? CoraInvoiceId { get; set; }

    [JsonPropertyName("external_code")]
    public string? ExternalCode { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("total_paid")]
    public decimal TotalPaid { get; set; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}
