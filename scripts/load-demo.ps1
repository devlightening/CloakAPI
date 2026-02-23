param(
  [int]$Count = 300,
  [string]$ApiBaseUrl = "http://localhost:8081",
  [string]$GuardrailBaseUrl = "http://localhost:8080",
  [int]$Concurrency = 8
)

$ErrorActionPreference = "Stop"

function Invoke-WithRetry {
  param(
    [scriptblock]$Action,
    [int]$Attempts = 2
  )

  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      return & $Action
    } catch {
      if ($i -ge $Attempts) { throw }
      Start-Sleep -Milliseconds (Get-Random -Minimum 200 -Maximum 501)
    }
  }
}

function Get-Token {
  param(
    [string]$Role,
    [string]$UserId
  )

  $body = @{ userId = $UserId; role = $Role } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/token" -ContentType "application/json" -Body $body
  return $res.accessToken
}

$adminToken = Get-Token -Role "Admin" -UserId "demo-admin"
$analystToken = Get-Token -Role "Analyst" -UserId "demo-analyst"

Write-Host "Admin token acquired: $($adminToken.Substring(0, 16))..." -ForegroundColor Green
Write-Host "Analyst token acquired: $($analystToken.Substring(0, 16))..." -ForegroundColor Green

Write-Host "Waiting for Guardrail readiness..." -ForegroundColor Cyan
$readyStart = Get-Date
$deadline = (Get-Date).AddSeconds(60)
while ($true) {
  if ((Get-Date) -gt $deadline) {
    throw "Guardrail not ready after 60s"
  }

  try {
    $healthOk = $false
    $statsOk = $false

    try {
      $health = Invoke-WebRequest -Method GET -Uri "$GuardrailBaseUrl/api/health" -UseBasicParsing -TimeoutSec 5
      $healthOk = ($health.StatusCode -eq 200) -and ($health.Content -match "ok")
    } catch { }

    try {
      $headers = @{ Authorization = "Bearer $adminToken" }
      $stats = Invoke-WebRequest -Method GET -Uri "$GuardrailBaseUrl/admin/stats/summary" -Headers $headers -UseBasicParsing -TimeoutSec 5
      $statsOk = ($stats.StatusCode -eq 200)
    } catch { }

    if ($healthOk -and $statsOk) { break }
  } catch { }

  Start-Sleep -Milliseconds 500
}

$readySeconds = [Math]::Round(((Get-Date) - $readyStart).TotalSeconds, 1)
Write-Host "Ready in ${readySeconds}s" -ForegroundColor Green

$endpoints = @(
  @{ method = "GET"; url = "$GuardrailBaseUrl/api/users/me"; token = $adminToken },
  @{ method = "GET"; url = "$GuardrailBaseUrl/api/users/me"; token = $analystToken },
  @{ method = "GET"; url = "$GuardrailBaseUrl/api/health"; token = $adminToken },
  @{ method = "GET"; url = "$GuardrailBaseUrl/admin/stats/summary"; token = $adminToken },
  @{ method = "GET"; url = "$GuardrailBaseUrl/admin/audit?page=1&pageSize=20"; token = $adminToken }
)

$jobs = [System.Collections.ArrayList]::new()
$sent = 0
$ok = 0
$fail = 0

function Invoke-Once {
  param(
    [hashtable]$ep
  )

  $headers = @{ Authorization = "Bearer $($ep.token)" }
  try {
    Invoke-WithRetry -Attempts 2 -Action {
      $null = Invoke-WebRequest -Method $ep.method -Uri $ep.url -Headers $headers -UseBasicParsing -TimeoutSec 15
      return $true
    }
  } catch {
    return $false
  }
}

while ($sent -lt $Count) {
  while (($jobs.Count -lt $Concurrency) -and ($sent -lt $Count)) {
    $ep = $endpoints | Get-Random
    [void]$jobs.Add((Start-Job -ScriptBlock ${function:Invoke-Once} -ArgumentList $ep))
    $sent++
  }

  $done = Wait-Job -Job ($jobs.ToArray()) -Any -Timeout 30
  if ($null -ne $done) {
    $result = Receive-Job -Job $done
    if ($result -eq $true) { $ok++ } else { $fail++ }
    Remove-Job -Job $done
    $running = $jobs.ToArray() | Where-Object { $_.State -eq "Running" }
    $jobs.Clear() | Out-Null
    foreach ($r in $running) { [void]$jobs.Add($r) }
  }

  if (($sent % 50) -eq 0) {
    Write-Host "Sent=$sent Ok=$ok Fail=$fail" -ForegroundColor Cyan
  }
}

if ($jobs.Count -gt 0) {
  Wait-Job -Job ($jobs.ToArray()) | Out-Null
}
foreach ($j in $jobs.ToArray()) {
  $result = Receive-Job -Job $j
  if ($result -eq $true) { $ok++ } else { $fail++ }
  Remove-Job -Job $j
}

Write-Host "Done. Sent=$sent Ok=$ok Fail=$fail" -ForegroundColor Green
