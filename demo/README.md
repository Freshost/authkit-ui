# authkit demo

A minimal, runnable full-stack playground for **goravel-authkit** (backend) and
**@freshost/authkit-ui** (frontend). It wires both packages with the least code
possible so you can click through every feature: login, two-step 2FA, change
password, and user management.

```
demo/
├── backend/    Goravel v1.17.2 skeleton + goravel-authkit (local replace)
└── frontend/   Vite + React, @freshost/authkit-ui aliased to the lib source
```

Both packages are consumed **locally** (no GitHub / npm publish needed): the Go
backend uses a `replace` directive to `../../../goravel-authkit`, and the Vite
frontend aliases `@freshost/authkit-ui` to `../../src` (so editing the library
hot-reloads here).

## Prerequisites

- Go 1.25+, Node 20+, pnpm
- PostgreSQL on `127.0.0.1:5432` (the package migrations are Postgres-specific)

## Run the backend (port 8090)

```bash
cd demo/backend
cp .env.example .env                 # then set DB_USERNAME/DB_PASSWORD for your Postgres
createdb authkit_demo                # or: psql -c 'create database authkit_demo'
go run . artisan key:generate
go run . artisan migrate
go run . artisan auth:create-user --email=admin@demo.test --password=password123 --name=Admin
go run .                             # serves http://127.0.0.1:8090
```

The only authkit wiring is in:
- `bootstrap/providers.go` — registers `&authkit.ServiceProvider{}`
- `bootstrap/app.go` — global `StartSession()` middleware
- `routes/web.go` — `authkitroutes.Register(facades.Route(), authkitroutes.OptionsFromConfig())`
- `config/auth.go` — a session `admin` guard; `config/authkit.go` — package config

## Run the frontend (port 5173)

```bash
cd demo/frontend
pnpm install
pnpm dev                             # http://localhost:5173 (proxies /api → :8090)
```

Sign in with **admin@demo.test / password123**.

The whole integration is `src/main.tsx` (the `<AuthkitProvider>` + a notify
adapter) and `src/App.tsx` (routes using `<LoginPage>`, `<AuthGuard>`,
`<AccountPage>`, `<UsersPage>`, and the 2FA components on `src/pages/SecurityPage.tsx`).

## Try it

- **Login / guard** — the app redirects to `/login` until authenticated.
- **Account** — change your password (other sessions are signed out).
- **Security** — enroll in 2FA (scan the QR), then sign out and back in to see the
  two-step challenge; regenerate or use recovery codes; disable 2FA (password re-auth).
- **Users** — create / edit / delete users and reset passwords.

## Notes

- Cookies are first-party because Vite proxies `/api` to the backend (same origin
  to the browser). In production serve both behind one origin or set CORS + cookie flags.
- This demo is for local exploration; it is not hardened for deployment.
