namespace NomeLimpo.Api.Dtos;

public record LoginRequest(string Email, string Senha);

public record LoginResponse(string Token, string Nome, string Email, string Perfil);

public record CriarClienteRequest(
    string TipoPessoa,
    string NomeRazaoSocial,
    string CpfCnpj,
    string Email,
    string Telefone,
    string? DataNascimentoFundacao
);

public record AtualizarStatusProcessoRequest(
    string NovoStatus,
    string Titulo,
    string Descricao,
    string Autor
);

public record AdicionarNotaRequest(
    string Observacao
);

public record RegistrarPagamentoRequest(
    string CobrancaId
);

public record EnviarMensagemRequest(
    string ClienteId,
    string Tipo,
    string Canal,
    string Assunto,
    string Mensagem
);

public record DashboardMetricsDto(
    int TotalClientes,
    int ClientesAtivos,
    int ClientesInadimplentes,
    int ProcessosEmAndamento,
    int ProcessosConcluidos,
    decimal ReceitaMensalRecorrente,
    decimal ReceitaTotalMesAtual,
    double TaxaSucessoPercentual,
    int ProcessosPertoVencimentoPrazo
);
