@echo off
setlocal
echo Starting CloakAPI.Api on http://localhost:8081
dotnet run --project backend\src\CloakAPI.Api\CloakAPI.Api.csproj
