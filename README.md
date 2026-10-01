# Drop

Location-based flash deals. Businesses publish short-lived "drops" with limited
capacity; nearby customers claim one and redeem it at the counter by scanning
the branch's rotating QR code.

| Part | Stack |
|---|---|
| API | ASP.NET Core (.NET 10), EF Core, PostgreSQL + PostGIS |
| Mobile | Expo / React Native, expo-router, TanStack Query |

## Run locally

```bash
docker compose up -d                       # PostgreSQL + PostGIS only
dotnet ef database update --project src/Drop.Infrastructure --startup-project src/Drop.Api
dotnet run --project src/Drop.Api --urls http://0.0.0.0:5072   # Swagger: http://localhost:5072/swagger

cd mobile/Drop.Mobile
cp .env.example .env                       # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npm install
npx expo start -c
```

In Development, password-reset e-mails are written to the API log when no SMTP
server is configured.

## Tests

```bash
dotnet test Drop.slnx   # needs Docker: integration tests use Testcontainers
```

CI (`.github/workflows/ci.yml`) runs the backend tests, mobile type check + lint
and a Docker build on every push to `main` and on pull requests.

## Deploy the API

```bash
cp .env.example .env    # fill in the secrets
docker compose --profile api up --build   # API on http://localhost:8080
```

The image runs as a non-root user and migrates the database on startup when
`Database__MigrateOnStartup=true`. It refuses to start with missing, short or
development secrets.

| Setting (env var) | Required | Notes |
|---|---|---|
| `ConnectionStrings__Database` | yes | PostgreSQL with PostGIS |
| `Jwt__Key` | yes | ≥ 32 chars, e.g. `openssl rand -base64 48` |
| `Qr__SigningKey` | yes | ≥ 32 chars; signs the rotating branch QR codes |
| `Email__ResendApiKey` / `Email__From` | for e-mail codes | Resend over HTTPS (works where SMTP ports are blocked, e.g. Railway); sends sign-up verification and password-reset codes |
| `Email__SmtpHost` / `SmtpPort` / `SmtpUser` / `SmtpPassword` | alternative | any SMTP provider, used when no Resend key is set |
| `Cors__AllowedOrigins__0` | no | only for browser clients; the mobile app needs none |
| `ReverseProxy__Enabled` | behind a load balancer | trusts `X-Forwarded-*` for client IP/HTTPS |
| `RateLimiting__AuthPerMinute` / `RedeemPerMinute` | no | defaults 10 / 20 |
| `Admin__Emails` | for business review | comma-separated e-mails of platform admins |
| `Sentry__Dsn` | no | reports unexpected (5xx) errors to Sentry; no request bodies or IPs are sent |
| `DATABASE_URL` / `PORT` | on Railway & co. | used when `ConnectionStrings__Database` / URLs aren't set; see `docs/DEPLOY.md` |

New businesses start as **Pending** and can publish drops only after an admin
approves them (Profile → Yönetim in the app, or `POST /api/admin/businesses/{id}/approve`).
Approval also requires the owner to have verified their e-mail with the code
sent at sign-up. Without SMTP, Development writes the codes to the API log; other
environments send nothing, so configure SMTP before inviting real businesses.

Rotating the JWT key signs everyone out; rotating the QR key invalidates codes
on screen for at most ~1 minute.
