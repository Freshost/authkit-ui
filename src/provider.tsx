import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { createAuthkitClient, type AuthkitClient } from './api/client';
import { registerAuthkitI18n } from './i18n';
import { noopNotify, type NotifyAdapter } from './notify';

/** Branding passed through to the login page (logo, titles, background). */
export interface AuthkitBranding {
  logo?: string;
  logoAlt?: string;
  appName?: string;
  subtitle?: string;
  backgroundImage?: string;
}

/** Route paths the package navigates to. Override per app. */
export interface AuthkitRoutes {
  /** Where <AuthGuard> sends unauthenticated users. Default `/login`. */
  login: string;
  /** Where to land after a successful login. Default `/`. */
  home: string;
  /** Account / change-password route. Default `/account`. */
  account: string;
}

export interface AuthkitContextValue {
  client: AuthkitClient;
  /** Current backend guard name; required for automatic cross-guard stop handling. */
  guard?: string;
  notify: NotifyAdapter;
  branding: AuthkitBranding;
  routes: AuthkitRoutes;
  /** Min new-password length enforced client-side (match the backend). */
  minPasswordLength: number;
}

const AuthkitContext = createContext<AuthkitContextValue | null>(null);

const DEFAULT_ROUTES: AuthkitRoutes = { login: '/login', home: '/', account: '/account' };
const EMPTY_BRANDING: AuthkitBranding = {};

export interface AuthkitProviderProps {
  /** A pre-built client. Provide this OR {@link AuthkitProviderProps.baseURL}. */
  client?: AuthkitClient;
  /**
   * API base URL including the backend route prefix (e.g. `/api/v1`). Used to
   * build a default client when `client` is omitted.
   */
  baseURL?: string;
  /** Backend guard served by this provider (for example `admin` or `client`). */
  guard?: string;
  /** Toast adapter. Defaults to a silent no-op. */
  notify?: NotifyAdapter;
  /** Login-page branding. */
  branding?: AuthkitBranding;
  /** Route overrides. */
  routes?: Partial<AuthkitRoutes>;
  /** Min new-password length (match `authkit.min_password_length`). Default 8. */
  minPasswordLength?: number;
  children: ReactNode;
}

/**
 * Wires the package to the host app: the API client, the toast adapter, route
 * paths, branding and i18n. Place it inside the app's QueryClientProvider,
 * i18n provider and router.
 */
export function AuthkitProvider({
  client,
  baseURL,
  guard,
  notify,
  branding,
  routes,
  minPasswordLength,
  children,
}: AuthkitProviderProps): ReactNode {
  const { i18n } = useTranslation();
  registerAuthkitI18n(i18n);

  // Keep the client stable across renders — rebuilding it would spin up a new
  // axios instance (and drop interceptors) on every parent render.
  const resolvedClient = useMemo(
    () => client ?? createAuthkitClient({ baseURL: baseURL ?? '/api/v1' }),
    [client, baseURL],
  );

  const value = useMemo<AuthkitContextValue>(
    () => ({
      client: resolvedClient,
      guard,
      notify: notify ?? noopNotify,
      branding: branding ?? EMPTY_BRANDING,
      routes: { ...DEFAULT_ROUTES, ...routes },
      minPasswordLength: minPasswordLength ?? 8,
    }),
    [resolvedClient, guard, notify, branding, routes, minPasswordLength],
  );

  return <AuthkitContext.Provider value={value}>{children}</AuthkitContext.Provider>;
}

/** Access the package context. Throws if used outside <AuthkitProvider>. */
export function useAuthkit(): AuthkitContextValue {
  const ctx = useContext(AuthkitContext);
  if (!ctx) {
    throw new Error('useAuthkit must be used within <AuthkitProvider>');
  }
  return ctx;
}
