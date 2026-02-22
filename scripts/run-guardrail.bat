@echo off
setlocal
echo Starting CloakAPI.Guardrail on http://localhost:8080
dotnet run --project backend\src\CloakAPI.Guardrail\CloakAPI.Guardrail.csproj
