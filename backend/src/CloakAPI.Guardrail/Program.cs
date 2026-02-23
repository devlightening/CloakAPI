using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CloakAPI.Data;
using CloakAPI.Guardrail;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var issuer = builder.Configuration["Jwt:Issuer"];
        var audience = builder.Configuration["Jwt:Audience"];
        var key = builder.Configuration["Jwt:Key"];

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]
                  ?? builder.Configuration["Cors__AllowedOrigins"]
                  ?? "http://localhost:3000";

var allowedOrigins = corsOrigins
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevDashboard", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddSingleton<JsonMaskingService>();

builder.Services.AddDbContext<CloakDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default");
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<IAuditWriter, AuditWriter>();

var app = builder.Build();

app.UseCors("DevDashboard");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<JsonResponseMaskingMiddleware>();

app.MapGet("/", () => "Hello World!");

app.MapGet("/whoami", [Authorize] (ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    var role = user.FindFirstValue(ClaimTypes.Role);
    return Results.Ok(new { userId, role });
});

var adminGroup = app.MapGroup("/admin")
    .RequireAuthorization("AdminOnly");

adminGroup.MapGet("/audit", async (
    CloakDbContext db,
    int? page,
    int? pageSize,
    DateTime? fromUtc,
    DateTime? toUtc,
    string? endpoint,
    string? endpointContains,
    string? role,
    string? decision) =>
{
    var p = page.GetValueOrDefault(1);
    var ps = pageSize.GetValueOrDefault(20);
    if (p < 1) p = 1;
    if (ps < 1) ps = 1;
    if (ps > 200) ps = 200;

    var query = db.AuditEvents.AsNoTracking().AsQueryable();

    if (fromUtc is not null) query = query.Where(e => e.TimestampUtc >= fromUtc.Value);
    if (toUtc is not null) query = query.Where(e => e.TimestampUtc <= toUtc.Value);

    var endpointFilter = endpointContains ?? endpoint;
    if (!string.IsNullOrWhiteSpace(endpointFilter)) query = query.Where(e => e.Endpoint.Contains(endpointFilter));
    if (!string.IsNullOrWhiteSpace(role)) query = query.Where(e => e.Role == role);
    if (!string.IsNullOrWhiteSpace(decision)) query = query.Where(e => e.Decision == decision);

    var totalCount = await query.CountAsync();
    var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)ps));
    var items = await query
        .OrderByDescending(e => e.TimestampUtc)
        .Skip((p - 1) * ps)
        .Take(ps)
        .ToListAsync();

    var dtoItems = items.Select(AuditDtoMapper.ToDto).ToArray();
    return Results.Ok(new { items = dtoItems, totalCount, page = p, pageSize = ps, totalPages });
});

adminGroup.MapGet("/stats/summary", async (CloakDbContext db) =>
{
    var query = db.AuditEvents.AsNoTracking();

    var totalEvents = await query.CountAsync();
    var maskedEvents = await query.CountAsync(e => e.Decision == "Mask");
    var allowEvents = await query.CountAsync(e => e.Decision == "Allow");
    var uniqueEndpoints = await query.Select(e => e.Endpoint).Distinct().CountAsync();

    return Results.Ok(new { totalEvents, maskedEvents, allowEvents, uniqueEndpoints });
});

adminGroup.MapGet("/stats/pii-distribution", async (CloakDbContext db) =>
{
    var masked = await db.AuditEvents
        .AsNoTracking()
        .Where(e => e.Decision == "Mask")
        .Select(e => e.PiiTypesFoundJson)
        .ToListAsync();

    var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
    {
        ["Email"] = 0,
        ["Phone"] = 0,
        ["TCKN"] = 0,
        ["IP"] = 0,
        ["Location"] = 0
    };

    foreach (var json in masked)
    {
        string[] types;
        try
        {
            types = JsonSerializer.Deserialize<string[]>(json) ?? Array.Empty<string>();
        }
        catch
        {
            types = Array.Empty<string>();
        }

        foreach (var t in types)
        {
            if (counts.ContainsKey(t)) counts[t]++;
        }
    }

    return Results.Ok(counts);
});

adminGroup.MapGet("/stats/top-endpoints", async (CloakDbContext db, int? take, string? by) =>
{
    var top = take.GetValueOrDefault(10);
    if (top < 1) top = 1;
    if (top > 100) top = 100;

    var mode = string.IsNullOrWhiteSpace(by) ? "maskedEvents" : by;

    var baseQuery = db.AuditEvents.AsNoTracking().Where(e => e.Decision == "Mask");

    if (string.Equals(mode, "maskedCount", StringComparison.OrdinalIgnoreCase))
    {
        var rows = await baseQuery
            .GroupBy(e => e.Endpoint)
            .Select(g => new { endpoint = g.Key, maskedCount = g.Sum(x => x.MaskedCount), maskedEvents = g.Count() })
            .OrderByDescending(x => x.maskedCount)
            .ThenByDescending(x => x.maskedEvents)
            .Take(top)
            .ToListAsync();
        return Results.Ok(rows);
    }
    else
    {
        var rows = await baseQuery
            .GroupBy(e => e.Endpoint)
            .Select(g => new { endpoint = g.Key, maskedEvents = g.Count(), maskedCount = g.Sum(x => x.MaskedCount) })
            .OrderByDescending(x => x.maskedEvents)
            .ThenByDescending(x => x.maskedCount)
            .Take(top)
            .ToListAsync();
        return Results.Ok(rows);
    }
});

app.MapReverseProxy().RequireAuthorization();

app.Run();
