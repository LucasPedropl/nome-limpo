using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Processo> Processos => Set<Processo>();
    public DbSet<HistoricoStatus> HistoricosStatus => Set<HistoricoStatus>();
    public DbSet<Assinatura> Assinaturas => Set<Assinatura>();
    public DbSet<Cobranca> Cobrancas => Set<Cobranca>();
    public DbSet<LogComunicacao> LogsComunicacao => Set<LogComunicacao>();
    public DbSet<UsuarioAdmin> UsuariosAdmin => Set<UsuarioAdmin>();
    public DbSet<ConfiguracaoSistema> ConfiguracoesSistema => Set<ConfiguracaoSistema>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cliente
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CpfCnpj);
            entity.HasIndex(e => e.Email);
            entity.Property(e => e.NomeRazaoSocial).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CpfCnpj).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
        });

        // Processo
        modelBuilder.Entity<Processo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Protocolo).IsUnique();
            entity.HasOne(e => e.Cliente)
                  .WithMany(c => c.Processos)
                  .HasForeignKey(e => e.ClienteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // HistoricoStatus
        modelBuilder.Entity<HistoricoStatus>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Processo)
                  .WithMany(p => p.Historico)
                  .HasForeignKey(e => e.ProcessoId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Assinatura
        modelBuilder.Entity<Assinatura>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ValorMensal).HasPrecision(18, 2);
            entity.HasOne(e => e.Cliente)
                  .WithMany(c => c.Assinaturas)
                  .HasForeignKey(e => e.ClienteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Cobranca
        modelBuilder.Entity<Cobranca>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.HasOne(e => e.Assinatura)
                  .WithMany(a => a.Cobrancas)
                  .HasForeignKey(e => e.AssinaturaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // LogComunicacao
        modelBuilder.Entity<LogComunicacao>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Cliente)
                  .WithMany(c => c.Comunicacoes)
                  .HasForeignKey(e => e.ClienteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // UsuarioAdmin
        modelBuilder.Entity<UsuarioAdmin>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
        });

        // ConfiguracaoSistema
        modelBuilder.Entity<ConfiguracaoSistema>(entity =>
        {
            entity.HasKey(e => e.Chave);
            entity.Property(e => e.Chave).HasMaxLength(100);
            entity.Property(e => e.Valor).HasMaxLength(500).IsRequired();
            entity.Property(e => e.AlteradoPor).HasMaxLength(150);
        });
    }
}
