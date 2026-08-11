# authkit-ui demo (frontend)

A minimal Vite + React app that wires **@freshost/authkit-ui** with the least code
possible, so you can click through every feature: login, two-step 2FA, change
password, personal API tokens, and user management.

It consumes the library **from source** (no npm publish): `@freshost/authkit-ui`
is aliased to `../src` in `vite.config.ts`, so editing the package hot-reloads
here, with a single React / PatternFly copy (deduped).

## Prerequisites

- Node 20+, pnpm
- The **backend demo running on `:8099`** — it lives in the `goravel-authkit`
  repo under `demo/`. Start it first (see that repo's `demo/README.md`), then:

## Run (port 5173)

Driven through the `Makefile` (`make help` lists targets).

```bash
make install
make dev          # http://localhost:5173 — proxies /api → http://127.0.0.1:8099
```

Sign in with **admin@demo.test / password123**.

## The whole integration

- `src/main.tsx` — `<AuthkitProvider baseURL="/api/v1" notify={…} branding={…}>`
  inside the app's QueryClient / i18n / router, plus a tiny toast adapter (`src/notify.tsx`).
- `src/App.tsx` — routes using `<LoginPage>`, `<AuthGuard>`, `<AccountPage>`,
  `<UsersPage>`; the 2FA components are on `src/pages/SecurityPage.tsx`.
- `vite.config.ts` — the `@freshost/authkit-ui` → `../src` alias + the `/api` proxy.

## Try it

- **Login / guard** — the app redirects to `/login` until authenticated.
- **Account** — edit your profile, change your password, inspect sessions, and
  create/revoke expiring scoped API tokens (plaintext is shown once).
- **Security** — enroll in 2FA (scan the QR), sign out and back in to see the
  two-step challenge; regenerate / use recovery codes; disable 2FA (password re-auth).
- **Users** — create / edit / delete users and reset passwords.

## Notes

- Cookies are first-party because Vite proxies `/api` to the backend (same origin
  to the browser). In production serve both behind one origin or set CORS + cookie flags.
- For local exploration only; not hardened for deployment.
