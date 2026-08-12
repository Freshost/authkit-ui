// Integration-test helpers: build REAL AuthkitClients (no mocks) that talk to the
// running goravel-authkit backend, and render real components/hooks wired through
// the package's provider stack.
//
// Node's axios does NOT persist Set-Cookie across requests the way a browser does,
// so session flows (login → me → logout) would break with a bare client. We attach
// a fresh tough-cookie CookieJar per client via axios-cookiejar-support, giving
// each test an isolated browser-like session.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import axios from 'axios';
import { wrapper as cookieJarWrapper } from 'axios-cookiejar-support';
import i18next, { type i18n as I18nInstance } from 'i18next';
import { type ReactElement, type ReactNode } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { CookieJar } from 'tough-cookie';

import { createAuthkitClient, type AuthkitClient } from '../api/client';
import { AuthkitProvider } from '../provider';

/**
 * Read an env var without depending on `@types/node` (the package tsconfig has no
 * node types). `process` is available at runtime under vitest/node.
 */
function readEnv(key: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[key];
}

/** Base URL of the running backend, including the route prefix. */
export const BASE_URL = readEnv('AUTHKIT_E2E_BASE_URL') ?? 'http://127.0.0.1:8099/api/v1';

/**
 * A unique synthetic client IP per real client. The backend's login limiter keys
 * on the request IP (honouring X-Forwarded-For from the trusted localhost proxy),
 * so giving each client its own IP puts every test/actor in its own rate-limit
 * bucket — the suite stays green across back-to-back runs instead of draining a
 * single shared 127.0.0.1 bucket. (The pace/retry logic below is then just a
 * belt-and-suspenders fallback.)
 */
let ipCounter = 0;
function uniqueForwardedFor(): string {
  ipCounter += 1;
  // 10.x.x.x private space; vary all octets so parallel processes don't collide.
  const rand = () => Math.floor(Math.random() * 256);
  return `10.${rand()}.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

/**
 * Builds a REAL AuthkitClient backed by its own axios instance + fresh cookie jar.
 * Each call yields an isolated session — call once per test (or once per "actor").
 */
export function makeRealClient(): AuthkitClient {
  const jar = new CookieJar();
  // Force axios's Node `http` adapter. Under jsdom, axios would otherwise default
  // to the `xhr` adapter (jsdom provides XMLHttpRequest), which the cookie-jar
  // wrapper cannot intercept — every request then fails with "Network Error".
  const instance = cookieJarWrapper(
    axios.create({ jar, withCredentials: true, adapter: 'http' }),
  );
  // Node does not add browser origin headers. Authkit's fail-closed CSRF check
  // requires one for state-changing session requests, so model a same-origin
  // browser explicitly in the real-client integration harness.
  instance.defaults.headers.common.Origin = new URL(BASE_URL).origin;
  // Own rate-limit bucket per client (see uniqueForwardedFor).
  instance.defaults.headers.common['X-Forwarded-For'] = uniqueForwardedFor();
  return createAuthkitClient({ baseURL: BASE_URL, axiosInstance: instance });
}

/**
 * Logs in via the given client, transparently retrying when the backend's
 * per-IP login rate limiter (HTTP 429 `rate_limited`) trips. Integration tests
 * share one IP, so a burst of real logins can briefly exceed the limit — this is
 * expected backend behaviour, not a bug, so we back off and retry rather than
 * fail. Use for the seeded admin credentials in tests that need a session.
 */
// Process-wide pace gate: the login limiter penalises bursts, so we serialize
// admin logins and keep a minimum gap between them. `gate` chains pending logins;
// `MIN_GAP_MS` enforces spacing once it's this client's turn.
const MIN_GAP_MS = 2_000;
let gate: Promise<void> = Promise.resolve();
let lastLoginAt = 0;

async function paceLogin(): Promise<void> {
  const mine = gate.then(async () => {
    const wait = MIN_GAP_MS - (Date.now() - lastLoginAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastLoginAt = Date.now();
  });
  // Keep the chain alive even if a turn rejects (it won't — the body never throws).
  gate = mine.catch(() => undefined);
  await mine;
}

export async function loginWithRetry(
  client: AuthkitClient,
  body: { email: string; password: string; remember?: boolean },
  attempts = 12,
): Promise<Awaited<ReturnType<AuthkitClient['login']>>> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    await paceLogin();
    try {
      return await client.login(body);
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status !== 429) throw err;
      // 429 means the bucket is drained; wait longer than the pace gap to refill.
      await new Promise((resolve) => setTimeout(resolve, 2_500));
    }
  }
  throw lastErr;
}

/**
 * A real client whose `login` is the rate-limit-retrying variant. The hook and
 * component tests drive login through the package's mutation/UI (so they can't
 * call {@link loginWithRetry} directly) — wrapping the client lets those paths
 * survive the shared-IP rate limiter without touching production code.
 */
export function makeRealClientWithLoginRetry(): AuthkitClient {
  const client = makeRealClient();
  return {
    ...client,
    login: (body) => loginWithRetry(client, body),
  };
}

/** A fresh i18next instance (en, react bindings) for rendering package UI. */
export function makeI18n(): I18nInstance {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['authkit'],
    defaultNS: 'authkit',
    resources: {},
    interpolation: { escapeValue: false },
  });
  return instance;
}

/** A QueryClient with retries disabled — failed queries (401) surface immediately. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export interface AuthkitWrapperOptions {
  client: AuthkitClient;
  route?: string;
  i18n?: I18nInstance;
  queryClient?: QueryClient;
}

/** Composes the full provider stack the package expects, around `children`. */
function AuthkitTestProviders({
  children,
  client,
  route = '/',
  i18n,
  queryClient,
}: AuthkitWrapperOptions & { children: ReactNode }): ReactElement {
  return (
    <I18nextProvider i18n={i18n ?? makeI18n()}>
      <QueryClientProvider client={queryClient ?? makeQueryClient()}>
        <MemoryRouter initialEntries={[route]}>
          <AuthkitProvider client={client}>{children}</AuthkitProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

/** Render a component through the real provider stack against a real client. */
export function renderWithAuthkit(
  ui: ReactElement,
  options: AuthkitWrapperOptions & Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  const { client, route, i18n, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthkitTestProviders
        client={client}
        route={route}
        i18n={i18n}
        queryClient={queryClient}
      >
        {children}
      </AuthkitTestProviders>
    ),
    ...renderOptions,
  });
}

/** Returns a `wrapper` for `renderHook` that supplies the real provider stack. */
export function authkitHookWrapper(options: AuthkitWrapperOptions) {
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <AuthkitTestProviders {...options}>{children}</AuthkitTestProviders>;
  };
}
