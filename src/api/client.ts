import axios, { type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios';

import type {
  ChangePasswordRequest,
  CreateAPITokenRequest,
  CreateUserRequest,
  LoginHistoryEntry,
  APITokenResponse,
  IssuedAPITokenResponse,
  ImpersonateRequest,
  LoginRequest,
  LoginResult,
  MessageResponse,
  MetaResponse,
  RecoveryCodesResponse,
  RecoveryCodesStatusResponse,
  SessionResponse,
  SetPasswordRequest,
  TwoFactorChallengeRequest,
  TwoFactorConfirmRequest,
  TwoFactorDisableRequest,
  TwoFactorEnrollmentResponse,
  UpdateProfileRequest,
  UpdateUserRequest,
  UserResponse,
} from './types';

/**
 * Error thrown by every client method on a non-2xx response. Carries the HTTP
 * status and the backend's `{ error, message }` envelope so callers (and toast
 * adapters) can branch on `code` and show `message`.
 */
export class AuthkitError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthkitError';
    this.status = status;
    this.code = code;
  }
}

function toAuthkitError(err: unknown): AuthkitError {
  if (isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return new AuthkitError(
      status,
      data?.error ?? 'network_error',
      data?.message ?? err.message ?? 'Request failed',
    );
  }
  return new AuthkitError(0, 'unknown_error', err instanceof Error ? err.message : 'Request failed');
}

/** The typed surface over the stable goravel-authkit HTTP contract. */
export interface AuthkitClient {
  /** Public frontend config (role options, feature flags, password rules). */
  getMeta(): Promise<MetaResponse>;
  // --- auth ---
  login(body: LoginRequest): Promise<LoginResult>;
  twoFactorChallenge(body: TwoFactorChallengeRequest): Promise<UserResponse>;
  logout(): Promise<MessageResponse>;
  getMe(): Promise<UserResponse>;
  updateProfile(body: UpdateProfileRequest): Promise<UserResponse>;
  changePassword(body: ChangePasswordRequest): Promise<MessageResponse>;
  /** Switch this session into another user. Omit guard for same-guard impersonation. */
  impersonate(body: ImpersonateRequest): Promise<UserResponse>;
  /** End impersonation for this client's guard and restore the original actor. */
  stopImpersonating(): Promise<MessageResponse>;
  /** Recent successful sign-ins for the current user. */
  getLoginHistory(): Promise<LoginHistoryEntry[]>;
  // --- active sessions ---
  listSessions(): Promise<SessionResponse[]>;
  terminateSession(id: string): Promise<MessageResponse>;
  terminateOtherSessions(): Promise<MessageResponse>;
  // --- personal API tokens (session-authenticated management only) ---
  listAPITokens(): Promise<APITokenResponse[]>;
  createAPIToken(body: CreateAPITokenRequest): Promise<IssuedAPITokenResponse>;
  revokeAPIToken(id: string): Promise<MessageResponse>;
  revokeAllAPITokens(): Promise<MessageResponse>;
  // --- two-factor management ---
  enableTwoFactor(): Promise<TwoFactorEnrollmentResponse>;
  confirmTwoFactor(body: TwoFactorConfirmRequest): Promise<RecoveryCodesResponse>;
  disableTwoFactor(body: TwoFactorDisableRequest): Promise<MessageResponse>;
  getRecoveryCodesStatus(): Promise<RecoveryCodesStatusResponse>;
  regenerateRecoveryCodes(): Promise<RecoveryCodesResponse>;
  // --- user management ---
  listUsers(): Promise<UserResponse[]>;
  createUser(body: CreateUserRequest): Promise<UserResponse>;
  getUser(id: string): Promise<UserResponse>;
  updateUser(id: string, body: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(id: string): Promise<MessageResponse>;
  setUserPassword(id: string, body: SetPasswordRequest): Promise<UserResponse>;
  /** The underlying axios instance, for apps that want to share interceptors. */
  readonly axios: AxiosInstance;
}

export interface CreateAuthkitClientOptions {
  /**
   * API base URL, including the route prefix the backend is mounted under
   * (default `/api/v1`). The package paths are appended to this.
   */
  baseURL: string;
  /**
   * Optional pre-configured axios instance. When omitted, a dedicated instance
   * is created with `withCredentials: true` (session-cookie auth). Pass your own
   * to share interceptors/headers — `baseURL` and `withCredentials` are applied.
   */
  axiosInstance?: AxiosInstance;
}

/**
 * Builds a typed client for the goravel-authkit endpoints. Uses session-cookie
 * auth (`withCredentials: true`) — no bearer tokens, nothing in localStorage.
 */
export function createAuthkitClient(opts: CreateAuthkitClientOptions): AuthkitClient {
  const instance =
    opts.axiosInstance ?? axios.create({ baseURL: opts.baseURL, withCredentials: true });
  if (opts.axiosInstance) {
    instance.defaults.baseURL = opts.baseURL;
    instance.defaults.withCredentials = true;
  }

  async function request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const res = await instance.request<T>(config);
      return res.data;
    } catch (err) {
      throw toAuthkitError(err);
    }
  }

  return {
    axios: instance,

    getMeta: () => request<MetaResponse>({ method: 'GET', url: '/auth/meta' }),

    login: (body) => request<LoginResult>({ method: 'POST', url: '/auth/login', data: body }),
    twoFactorChallenge: (body) =>
      request<UserResponse>({ method: 'POST', url: '/auth/two-factor-challenge', data: body }),
    logout: () => request<MessageResponse>({ method: 'POST', url: '/auth/logout' }),
    getMe: () => request<UserResponse>({ method: 'GET', url: '/auth/me' }),
    updateProfile: (body) =>
      request<UserResponse>({ method: 'PUT', url: '/auth/me', data: body }),
    changePassword: (body) =>
      request<MessageResponse>({ method: 'PUT', url: '/auth/password', data: body }),
    impersonate: (body) =>
      request<UserResponse>({ method: 'POST', url: '/auth/impersonate', data: body }),
    stopImpersonating: () =>
      request<MessageResponse>({ method: 'POST', url: '/auth/impersonate/stop' }),

    getLoginHistory: () => request<LoginHistoryEntry[]>({ method: 'GET', url: '/auth/logins' }),
    listSessions: () => request<SessionResponse[]>({ method: 'GET', url: '/auth/sessions' }),
    terminateSession: (id) =>
      request<MessageResponse>({ method: 'DELETE', url: `/auth/sessions/${id}` }),
    terminateOtherSessions: () =>
      request<MessageResponse>({ method: 'DELETE', url: '/auth/sessions' }),

    listAPITokens: () => request<APITokenResponse[]>({ method: 'GET', url: '/auth/api-tokens' }),
    createAPIToken: (body) =>
      request<IssuedAPITokenResponse>({ method: 'POST', url: '/auth/api-tokens', data: body }),
    revokeAPIToken: (id) =>
      request<MessageResponse>({ method: 'DELETE', url: `/auth/api-tokens/${id}` }),
    revokeAllAPITokens: () =>
      request<MessageResponse>({ method: 'DELETE', url: '/auth/api-tokens' }),

    enableTwoFactor: () =>
      request<TwoFactorEnrollmentResponse>({ method: 'POST', url: '/auth/two-factor' }),
    confirmTwoFactor: (body) =>
      request<RecoveryCodesResponse>({ method: 'POST', url: '/auth/two-factor/confirm', data: body }),
    disableTwoFactor: (body) =>
      request<MessageResponse>({ method: 'DELETE', url: '/auth/two-factor', data: body }),
    getRecoveryCodesStatus: () =>
      request<RecoveryCodesStatusResponse>({ method: 'GET', url: '/auth/two-factor/recovery-codes' }),
    regenerateRecoveryCodes: () =>
      request<RecoveryCodesResponse>({ method: 'POST', url: '/auth/two-factor/recovery-codes' }),

    listUsers: () => request<UserResponse[]>({ method: 'GET', url: '/auth/users' }),
    createUser: (body) => request<UserResponse>({ method: 'POST', url: '/auth/users', data: body }),
    getUser: (id) => request<UserResponse>({ method: 'GET', url: `/auth/users/${id}` }),
    updateUser: (id, body) =>
      request<UserResponse>({ method: 'PUT', url: `/auth/users/${id}`, data: body }),
    deleteUser: (id) => request<MessageResponse>({ method: 'DELETE', url: `/auth/users/${id}` }),
    setUserPassword: (id, body) =>
      request<UserResponse>({ method: 'POST', url: `/auth/users/${id}/password`, data: body }),
  };
}
