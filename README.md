# @freshost/authkit-ui

React companion UI for [goravel-authkit](https://github.com/Freshost/goravel-authkit) —
drop-in **login** (with two-step 2FA), **account / change-password**, **two-factor
setup & recovery**, and **user management**, built on
[`@freshost/ui`](https://github.com/Freshost/freshost-ui) (PatternFly v6).

It is framework-agnostic about your app's toast system, React Query config and
branding: everything is wired through a single `<AuthkitProvider>`. The package
talks to the backend through its own thin, typed client over the stable authkit
HTTP contract — no per-app SDK generation required.

- **Session-cookie auth** (httpOnly, `withCredentials`) — no tokens, no localStorage.
- **Three layers** — use the ready-made pages, or compose your own from the hooks.
- **Peer-dependency model** — React, PatternFly, router, query and i18next come
  from your app, so there's never a duplicate React/PatternFly instance.

## Install

```bash
pnpm add @freshost/authkit-ui
```

Peer dependencies (provided by your app):

```
@freshost/ui >=0.2 · react >=18 · react-dom >=18 · react-router >=7
@tanstack/react-query >=5 · react-i18next >=15 · i18next >=23
```

## Quick start

Mount `<AuthkitProvider>` inside your QueryClient, i18n and router providers:

```tsx
import { AuthkitProvider } from '@freshost/authkit-ui';

<QueryClientProvider client={queryClient}>
  <I18nextProvider i18n={i18n}>
    <BrowserRouter>
      <AuthkitProvider
        baseURL="/api/v1"
        notify={notifyAdapter}
        branding={{ appName: 'My App', logo: '/logo.svg' }}
        routes={{ login: '/login', home: '/', account: '/account' }}
        minPasswordLength={8}
      >
        <AppRoutes />
      </AuthkitProvider>
    </BrowserRouter>
  </I18nextProvider>
</QueryClientProvider>;
```

Then drop the pages into your routes:

```tsx
import { LoginPage, AuthGuard, AccountPage, UsersPage } from '@freshost/authkit-ui';

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/*"
    element={
      <AuthGuard>
        <AppShell>
          <Routes>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </AppShell>
      </AuthGuard>
    }
  />
</Routes>;
```

## The notify adapter

The package never assumes a toast mechanism — it calls `notify.success(msg)` /
`notify.error(msg)`. Wire whichever you have:

```ts
// dns-console — imperative store
import { notify } from '@/lib/notifications';
const notifyAdapter = { success: notify.success, error: notify.danger };
```

```tsx
// freshproxy — useToast() context (build the adapter where the hook is in scope)
import { useToast } from '@/components/ToastProvider';

function useNotifyAdapter() {
  const toast = useToast();
  return useMemo(
    () => ({
      success: (m: string) => toast({ variant: 'success', title: m }),
      error: (m: string) => toast({ variant: 'danger', title: m }),
    }),
    [toast],
  );
}
```

## Branding

`branding` is passed through to the PatternFly login page:

| field | meaning |
| --- | --- |
| `appName` | login title (and brand alt text) |
| `subtitle` | login subtitle |
| `logo` | brand image `src` |
| `logoAlt` | brand image alt (defaults to `appName`) |
| `backgroundImage` | login background `src` |

Colors come from `@freshost/ui` tokens (Freshost green) — no props needed.

## What's included

**Pages / components**

| export | purpose |
| --- | --- |
| `LoginPage` | email+password login; swaps to the 2FA challenge when required |
| `AuthGuard` | redirects to the login route until `useMe` resolves |
| `AccountPage` / `ChangePasswordModal` | change own password (card or modal) |
| `TwoFactorSetup` | enrollment: QR + secret → confirm → recovery codes |
| `RecoveryCodes` | one-time recovery codes with copy-all |
| `DisableTwoFactor` | password re-auth to turn 2FA off |
| `TwoFactorChallenge` | the login challenge step (also reusable standalone) |
| `UsersPage` + modals | user CRUD + reset-password (needs `user_management`) |

**Hooks** (compose your own UI)

`useMe` · `useLogin` · `useTwoFactorChallenge` · `useLogout` · `useChangePassword`
· `useEnableTwoFactor` · `useConfirmTwoFactor` · `useDisableTwoFactor` ·
`useRecoveryCodes` · `useRegenerateRecoveryCodes` · `useUsers` · `useCreateUser` ·
`useUpdateUser` · `useDeleteUser` · `useSetUserPassword`

The hooks set only **per-query** options (`retry`, `staleTime`) and never touch
your global `QueryClient` defaults.

## i18n

Strings live under the `authkit` namespace (registered automatically). Override
any key by adding your own bundle:

```ts
i18n.addResourceBundle('en', 'authkit', { login: { title: 'Sign in' } }, true, true);
```

## Local development (backend / package not yet published)

Point your app at a local checkout with a workspace override or a packed tarball:

```bash
# in this repo
pnpm build && pnpm pack            # → freshost-authkit-ui-0.1.0.tgz

# in the consuming app
pnpm add /absolute/path/to/freshost-authkit-ui-0.1.0.tgz
```

A tarball (rather than a bare `link:`) keeps a single React/PatternFly copy.

## License

MIT
