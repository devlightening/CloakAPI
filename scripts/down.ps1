param(
  [string]$Project = "cloakapi"
)

$ErrorActionPreference = "Stop"

Write-Host "Stopping docker compose..." -ForegroundColor Cyan
docker compose -p $Project -f infra/docker-compose.yml down
