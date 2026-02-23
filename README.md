# CloakAPI Privacy Firewall

CloakAPI is a small privacy firewall for APIs.

It consists of:

- **CloakAPI.Api**: issues JWTs and hosts the upstream API.
- **CloakAPI.Guardrail**: reverse proxy (YARP) in front of the API that enforces JWT RBAC and masks PII for Analyst users.
- **cloakapi-dashboard (Next.js)**: admin dashboard UI for audit and masking visibility.

## Architecture

```
                +--------------------+
                |  Next.js Dashboard |
                |  http://localhost:3000
                +---------+----------+
                          |
                          | Bearer JWT
                          v
+-------------------------+-------------------------+
|                 CloakAPI.Guardrail               |
|  http://localhost:8080                           |
|  - JWT validation + RBAC                          |
|  - YARP reverse proxy /api/* -> Api               |
|  - Analyst-only JSON response masking             |
|  - Audit trail writing (PostgreSQL)               |
|  - Admin-only /admin/* query + stats endpoints    |
+-------------------------+-------------------------+
                          |
                          | proxied HTTP
                          v
+-------------------------+-------------------------+
|                    CloakAPI.Api                  |
|  http://localhost:8081                           |
|  - POST /auth/token (issue JWT)                  |
|  - GET /users/me (sample PII JSON)               |
|  - GET /health (text/plain "ok")                 |
+-------------------------+-------------------------+
                          |
                          v
                   +-------------+
                   | PostgreSQL  |
                   | audit_events|
                   +-------------+
```

## Features

- **JWT issuing** in `CloakAPI.Api` (`/auth/token`) with claims:
  - `sub` = userId
  - `role` = Admin | Analyst
- **JWT validation + RBAC** in `CloakAPI.Guardrail`
- **YARP reverse proxy** in Guardrail:
  - `/api/{**catch-all}` forwarded to Api
  - `/api` prefix removed when forwarding
- **Analyst-only masking** for JSON responses:
  - Email, Phone, Turkish TCKN (11 digits), IPv4, Location precision
  - Free-text masking (e.g. `notes`)
- **Persistent audit trail** in PostgreSQL (EF Core): decision Allow/Mask, masked counts, detected PII types, etc.
- **Admin dashboard** (Next.js) consuming Guardrail admin endpoints:
  - `/admin/audit`
  - `/admin/stats/*`

## Configuration notes

### JWT settings must be consistent

Ensure `Jwt:Issuer`, `Jwt:Audience`, and `Jwt:Key` match across **Api** and **Guardrail**.

Example (Guardrail `appsettings.json`):

```json
{
  "Jwt": {
    "Issuer": "CloakAPI",
    "Audience": "CloakAPI.Clients",
    "Key": "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS"
  }
}
```

### Database connection string

Guardrail reads PostgreSQL connection from:

- `ConnectionStrings:Default` (appsettings) OR
- environment variable `ConnectionStrings__Default`

Example:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=cloak_audit;Username=postgres;Password=postgres"
  }
}
```

## Local run (Windows)

### Ports

- Dashboard: `http://localhost:3000`
- Guardrail: `http://localhost:8080`
- Api: `http://localhost:8081`
- Postgres: `localhost:5433` (maps to container `5432`)
- pgAdmin: `http://localhost:5050`

### 1) Start PostgreSQL

Option A: use the repo docker compose (db + pgAdmin)

```bash
docker compose -p cloakapi -f infra/docker-compose.yml up -d postgres pgadmin
```

Option B: run your own Postgres and set Guardrail `ConnectionStrings:Default` accordingly.

### 2) Run migrations

From repo root, set the design-time factory connection string and apply migrations:

PowerShell:

```powershell
$env:CLOAK_CONNECTIONSTRING = "Host=localhost;Port=5433;Database=cloakapi;Username=cloak;Password=cloakpass"

dotnet ef database update --project backend/src/CloakAPI.Data/CloakAPI.Data.csproj --context CloakDbContext
```

### 3) Start API + Guardrail

- Api: `http://localhost:8081`
- Guardrail: `http://localhost:8080`

You can use the scripts:

```bat
scripts\run-api.bat
scripts\run-guardrail.bat
```

### 4) Start Next.js dashboard

```bat
scripts\run-dashboard.bat
```

Open:

- `http://localhost:3000/login`
- `http://localhost:3000/admin`
- `http://localhost:3000/admin/audit`
- `http://localhost:3000/me`

### pgAdmin connection info

- URL: `http://localhost:5050`
- Email: `admin@example.com`
- Password: `admin`

Inside pgAdmin, add a server with:

- Host: `postgres`
- Port: `5432`
- Database: `cloakapi`
- Username: `cloak`
- Password: `cloakpass`

## Docker (full stack)

From repo root:

```bash
docker compose -p cloakapi -f infra/docker-compose.yml up -d --build
```

You can also use the PowerShell helpers:

```powershell
scripts\up.ps1
scripts\down.ps1
```

The compose file configures CORS for local dev (dashboard origin) via:

- `Cors__AllowedOrigins=http://localhost:3000`

Services:

- Dashboard: `http://localhost:3000`
- Guardrail: `http://localhost:8080`
- Api: `http://localhost:8081`

## Example curl commands

### 1) Get token from API

```bash
curl -s -X POST http://localhost:8081/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"u_admin","role":"Admin"}'
```

### 2) Call proxied endpoint (PII JSON)

```bash
curl -s http://localhost:8080/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 3) Call admin stats summary (Admin-only)

```bash
curl -s http://localhost:8080/admin/stats/summary \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Demo steps (10 minutes)

1. Start the stack:

```powershell
scripts\up.ps1
```

2. Generate demo traffic (writes audit events):

```powershell
scripts\load-demo.ps1 -Count 300
```

3. Open dashboard:

- `http://localhost:3000/login`

4. Login as Admin:

- Visit `Admin` and `Admin Audit`

5. Login as Analyst:

- Visit `User Me` and observe masked output vs Admin
