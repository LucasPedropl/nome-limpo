using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// 1. Banco de Dados: SQL Server (se configurado) ou SQLite persistente em disco (nomelimpo.db)
var sqlConn = builder.Configuration.GetConnectionString("NomeLimpo");
if (!string.IsNullOrWhiteSpace(sqlConn))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(sqlConn));
}
else
{
    // SQLite persistente localmente para garantir retenção de dados entre restarts
    var dbPath = Path.Combine(AppContext.BaseDirectory, "nomelimpo.db");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite($"Data Source={dbPath}"));
}

// 2. CORS amplo para suportar o frontend backoffice (5242) e a landing page (5230)
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.SetIsOriginAllowed(origin => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// 3. Injeção de dependências
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<PixService>();

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "nomelimpo-secret-jwt-key-32-chars-dev-2026";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.FromSeconds(10)
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Nome Limpo Express — Backoffice & Checkout API",
        Version = "v1",
        Description = "API de Gestão de Clientes, Processos nos Birôs, Assinaturas R$ 100/mês, Checkout Público e Webhooks."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header via esquema Bearer. Exemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Inicialização e Seed do Banco
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<PasswordService>();

    db.Database.EnsureCreated();

    // 1. Admin Padrão
    if (!db.UsuariosAdmin.Any())
    {
        db.UsuariosAdmin.Add(new UsuarioAdmin
        {
            Id = "usr_admin",
            Nome = "Diretor Operacional",
            Email = "admin@nomelimpo.com.br",
            SenhaHash = hasher.Hash("admin123"),
            Perfil = "Admin",
            Ativo = true,
            CreatedAt = DateTime.UtcNow
        });
    }

    // 2. Seed de Clientes e Processos reais
    if (!db.Clientes.Any())
    {
        var c1 = new Cliente
        {
            Id = "cli_roberto",
            TipoPessoa = "PF",
            NomeRazaoSocial = "Roberto Silva Guimarães",
            CpfCnpj = "128.459.736-22",
            Email = "roberto.guimaraes@email.com",
            Telefone = "(31) 98452-1190",
            DataNascimentoFundacao = "14/05/1986",
            Status = "Ativo",
            CreatedAt = DateTime.UtcNow.AddDays(-12),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var p1 = new Processo
        {
            Id = "prc_001",
            ClienteId = c1.Id,
            Protocolo = "NL-2026-1048",
            Status = "EmProcessamento",
            BirosNotificados = "Serasa, SPC Brasil, Boa Vista SCPC",
            DataInicio = DateTime.UtcNow.AddDays(-12),
            DataPrevistaConclusao = DateTime.UtcNow.AddDays(33),
            GarantiaValida = true,
            Observacoes = "Ofícios protocolados eletronicamente junto aos birôs. Aguardando prazo legal de resposta (15 dias úteis).",
            CreatedAt = DateTime.UtcNow.AddDays(-12),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        };
        p1.Historico.Add(new HistoricoStatus
        {
            Id = "h_001",
            ProcessoId = p1.Id,
            Status = "EmProcessamento",
            Titulo = "Notificação aos Birôs Expedida",
            Descricao = "Ofício extrajudicial de pedido de baixa/ocultação enviado para Serasa Experian e SPC Brasil.",
            Data = DateTime.UtcNow.AddDays(-2),
            Autor = "Equipe Jurídica"
        });

        var a1 = new Assinatura
        {
            Id = "sub_001",
            ClienteId = c1.Id,
            ValorMensal = 100.00m,
            Status = "Ativa",
            DataInicio = DateTime.UtcNow.AddDays(-12),
            ProximoVencimento = DateTime.UtcNow.AddDays(18),
            DiaVencimento = 10,
            CreatedAt = DateTime.UtcNow.AddDays(-12)
        };
        a1.Cobrancas.Add(new Cobranca
        {
            Id = "cob_001",
            AssinaturaId = a1.Id,
            ClienteId = c1.Id,
            Valor = 100.00m,
            ReferenciaMes = DateTime.UtcNow.ToString("yyyy-MM"),
            Status = "Pago",
            TxId = "NL20261010001",
            DataVencimento = DateTime.UtcNow.AddDays(-12),
            DataPagamento = DateTime.UtcNow.AddDays(-12),
            CreatedAt = DateTime.UtcNow.AddDays(-12)
        });

        var c2 = new Cliente
        {
            Id = "cli_transporte",
            TipoPessoa = "PJ",
            NomeRazaoSocial = "TransLog Express Transportes LTDA",
            CpfCnpj = "34.591.204/0001-88",
            Email = "financeiro@translogexpress.com.br",
            Telefone = "(11) 97120-4491",
            DataNascimentoFundacao = "03/11/2018",
            Status = "Ativo",
            CreatedAt = DateTime.UtcNow.AddDays(-25),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var p2 = new Processo
        {
            Id = "prc_002",
            ClienteId = c2.Id,
            Protocolo = "NL-2026-1015",
            Status = "NotificacaoBiro",
            BirosNotificados = "Serasa Experian, Boa Vista SCPC",
            DataInicio = DateTime.UtcNow.AddDays(-25),
            DataPrevistaConclusao = DateTime.UtcNow.AddDays(20),
            GarantiaValida = true,
            Observacoes = "Restrições de protesto em cartório identificadas. Solicitação de sigilo pré-judicial acatada na Boa Vista.",
            CreatedAt = DateTime.UtcNow.AddDays(-25),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        p2.Historico.Add(new HistoricoStatus
        {
            Id = "h_002",
            ProcessoId = p2.Id,
            Status = "NotificacaoBiro",
            Titulo = "Acatado na Boa Vista SCPC",
            Descricao = "Apontamento retirado temporariamente de consultas externas na Boa Vista. Aguardando Serasa.",
            Data = DateTime.UtcNow.AddDays(-1),
            Autor = "Equipe Jurídica"
        });

        var a2 = new Assinatura
        {
            Id = "sub_002",
            ClienteId = c2.Id,
            ValorMensal = 100.00m,
            Status = "Ativa",
            DataInicio = DateTime.UtcNow.AddDays(-25),
            ProximoVencimento = DateTime.UtcNow.AddDays(5),
            DiaVencimento = 27,
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        };
        a2.Cobrancas.Add(new Cobranca
        {
            Id = "cob_002",
            AssinaturaId = a2.Id,
            ClienteId = c2.Id,
            Valor = 100.00m,
            ReferenciaMes = DateTime.UtcNow.ToString("yyyy-MM"),
            Status = "Pago",
            TxId = "NL20261010002",
            DataVencimento = DateTime.UtcNow.AddDays(-25),
            DataPagamento = DateTime.UtcNow.AddDays(-25),
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        });

        var c3 = new Cliente
        {
            Id = "cli_mariana",
            TipoPessoa = "PF",
            NomeRazaoSocial = "Mariana Albuquerque Ferreira",
            CpfCnpj = "087.319.442-05",
            Email = "mariana.albuquerque@gmail.com",
            Telefone = "(31) 99812-7003",
            DataNascimentoFundacao = "22/09/1992",
            Status = "Ativo",
            CreatedAt = DateTime.UtcNow.AddDays(-40),
            UpdatedAt = DateTime.UtcNow.AddDays(-3)
        };

        var p3 = new Processo
        {
            Id = "prc_003",
            ClienteId = c3.Id,
            Protocolo = "NL-2026-0982",
            Status = "Concluido",
            BirosNotificados = "Serasa, SPC Brasil, Boa Vista SCPC",
            DataInicio = DateTime.UtcNow.AddDays(-40),
            DataPrevistaConclusao = DateTime.UtcNow.AddDays(5),
            DataConclusao = DateTime.UtcNow.AddDays(-3),
            GarantiaValida = true,
            Observacoes = "Concluído com êxito. Nenhum apontamento visível em consultas públicas de CPF.",
            CreatedAt = DateTime.UtcNow.AddDays(-40),
            UpdatedAt = DateTime.UtcNow.AddDays(-3)
        };
        p3.Historico.Add(new HistoricoStatus
        {
            Id = "h_003",
            ProcessoId = p3.Id,
            Status = "Concluido",
            Titulo = "Regularização Concluída nos Birôs",
            Descricao = "Verificação realizada nos 3 birôs externos. Apontamentos 100% baixados e certidão emitida.",
            Data = DateTime.UtcNow.AddDays(-3),
            Autor = "Auditoria de Compliance"
        });

        var a3 = new Assinatura
        {
            Id = "sub_003",
            ClienteId = c3.Id,
            ValorMensal = 100.00m,
            Status = "Ativa",
            DataInicio = DateTime.UtcNow.AddDays(-40),
            ProximoVencimento = DateTime.UtcNow.AddDays(20),
            DiaVencimento = 12,
            CreatedAt = DateTime.UtcNow.AddDays(-40)
        };
        a3.Cobrancas.Add(new Cobranca
        {
            Id = "cob_003_1",
            AssinaturaId = a3.Id,
            ClienteId = c3.Id,
            Valor = 100.00m,
            ReferenciaMes = DateTime.UtcNow.AddMonths(-1).ToString("yyyy-MM"),
            Status = "Pago",
            TxId = "NL20260912001",
            DataVencimento = DateTime.UtcNow.AddDays(-40),
            DataPagamento = DateTime.UtcNow.AddDays(-40),
            CreatedAt = DateTime.UtcNow.AddDays(-40)
        });

        db.Clientes.AddRange(c1, c2, c3);
        db.Processos.AddRange(p1, p2, p3);
        db.Assinaturas.AddRange(a1, a2, a3);
        db.SaveChanges();
    }
}

// Configurações do pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Nome Limpo API V1");
    c.RoutePrefix = "swagger";
});

app.UseCors(MyAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    service = "Nome Limpo Express — Backoffice & Checkout API",
    status = "online",
    version = "1.0.0",
    docs = "/swagger"
}));

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
