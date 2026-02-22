using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

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

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapPost("/auth/token", (TokenRequest request, IConfiguration configuration) =>
{
    if (string.IsNullOrWhiteSpace(request.UserId))
    {
        return Results.BadRequest(new { error = "userId is required" });
    }

    if (request.Role is not ("Admin" or "Analyst"))
    {
        return Results.BadRequest(new { error = "role must be Admin or Analyst" });
    }

    var issuer = configuration["Jwt:Issuer"];
    var audience = configuration["Jwt:Audience"];
    var key = configuration["Jwt:Key"];

    var now = DateTime.UtcNow;
    var expires = now.AddHours(1);

    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, request.UserId),
        new(ClaimTypes.Role, request.Role)
    };

    var signingCredentials = new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!)),
        SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        notBefore: now,
        expires: expires,
        signingCredentials: signingCredentials);

    var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new TokenResponse(accessToken, expiresIn: 3600));
});

app.MapGet("/secure/ping", [Authorize] (ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    var role = user.FindFirstValue(ClaimTypes.Role);
    return Results.Ok(new { ok = true, userId, role });
});

app.MapGet("/users/me", () => Results.Ok(new
{
    email = "john.doe@example.com",
    phone = "+90 555 123 4567",
    tckn = "10000000146",
    ip = "192.168.10.25",
    location = new { lat = 41.015137, lon = 28.979530 },
    notes = "Reach me at john.doe@example.com or +90 555 123 4567. TCKN: 10000000146. IP: 192.168.10.25"
}));

app.MapGet("/health", () => Results.Text("ok", "text/plain"));

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

record TokenRequest(string UserId, string Role);
record TokenResponse(string AccessToken, int ExpiresIn);
