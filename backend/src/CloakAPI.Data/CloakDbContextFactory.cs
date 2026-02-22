using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CloakAPI.Data;

public sealed class CloakDbContextFactory : IDesignTimeDbContextFactory<CloakDbContext>
{
    public CloakDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CLOAK_CONNECTIONSTRING")
                               ?? "Host=localhost;Port=5432;Database=cloak_audit;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<CloakDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new CloakDbContext(optionsBuilder.Options);
    }
}
