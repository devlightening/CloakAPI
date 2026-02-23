param(
  [string]$Project = "cloakapi"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting docker compose (build + detached)..." -ForegroundColor Cyan
docker compose -p $Project -f infra/docker-compose.yml up -d --build
