// Mirrors the goravel-authkit HTTP DTOs (http/responses/responses.go) exactly,
// including the JSON field casing the backend emits. This is the stable contract
// the package owns — keep these in lockstep with the Go responses package.

/** Public view of a user — never includes the password hash. */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  /** Whether the user has confirmed TOTP two-factor. */
  twoFactorEnabled: boolean;
  /** Whether the account is locked (login + sessions refused). */
  disabled: boolean;
  /** RFC3339 timestamp. */
  createdAt: string;
  /** Present only while this session is acting as another user. */
  impersonatedBy?: ImpersonatorRef;
}

/** The original actor retained by the backend during impersonation. */
export interface ImpersonatorRef {
  guard: string;
  id: string;
  email: string;
}

/** Starts impersonation. Omit guard for a user in the current guard. */
export interface ImpersonateRequest {
  userId: string;
  guard?: string;
}

/** Standard error envelope: `{ error, message }`. */
export interface ErrorResponse {
  error: string;
  message: string;
}

/** Feature toggles mirrored from the backend `authkit.features` config. */
export interface MetaFeatures {
  userManagement: boolean;
  twoFactor: boolean;
  auditLog: boolean;
  sessions: boolean;
  impersonation?: boolean;
  apiTokens: boolean;
}

export interface APITokenMeta {
  allowedScopes: string[];
  defaultLifetimeDays: number;
  maxLifetimeDays: number;
  maxPerUser: number;
}

/** One active session (the secret session id is never exposed). */
export interface SessionResponse {
  id: string;
  ip: string;
  userAgent: string;
  /** Whether this is the session making the request. */
  current: boolean;
  createdAt: string;
  lastActiveAt: string;
}

/** One recent successful sign-in. */
export interface LoginHistoryEntry {
  /** `auth.login` (password) or `auth.login_remember` (remember cookie). */
  action: string;
  ip: string;
  createdAt: string;
}

/** One successful sign-in visible in the role-gated administrator overview. */
export interface AdminLoginEvent {
  id: string;
  /** Null only when a legacy audit event has no actor id. */
  userId: string | null;
  userName: string;
  userEmail: string;
  /** `auth.login` (password) or `auth.login_remember` (remember cookie). */
  action: string;
  ip: string;
  createdAt: string;
}

export interface AdminLoginPage {
  items: AdminLoginEvent[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface AdminLoginQuery {
  page?: number;
  perPage?: number;
  /** Case-insensitive substring matched against the user's current name or email. */
  user?: string;
  /** Literal case-insensitive substring matched against the recorded IP address. */
  ip?: string;
  /** Successful sign-in method. */
  method?: 'password' | 'remember';
  /** Sort direction for the sign-in timestamp. Defaults to newest first. */
  sort?: 'asc' | 'desc';
}

/**
 * Non-sensitive frontend config served at `/auth/meta` — the single source of
 * truth for role options, password rules and feature flags. The UI fetches this
 * instead of hardcoding/duplicating the backend config.
 */
export interface MetaResponse {
  /** Assignable role values (empty = any role accepted). */
  roles: string[];
  minPasswordLength: number;
  features: MetaFeatures;
  apiTokens?: APITokenMeta;
}

export interface APITokenResponse {
  id: string;
  name: string;
  scopes: string[];
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateAPITokenRequest {
  name: string;
  expiresAt: string;
  scopes: string[];
  password: string;
  twoFactorCode?: string;
}

export interface IssuedAPITokenResponse extends APITokenResponse {
  /** Plaintext is returned exactly once and must not be persisted by the UI. */
  token: string;
}

/** Simple `{ message }` envelope. */
export interface MessageResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Issue a persistent "remember me" cookie so the login survives session expiry. */
  remember?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** The current user's own profile fields (name + email). */
export interface UpdateProfileRequest {
  email: string;
  name?: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  password: string;
  role?: string;
}

export interface UpdateUserRequest {
  email: string;
  name?: string;
  role?: string;
  /** Lock (true) or unlock (false) the account; omit to leave unchanged. */
  disabled?: boolean;
}

export interface SetPasswordRequest {
  password: string;
}

/**
 * Login returns this (instead of a UserResponse) when the user has 2FA enabled:
 * the session is NOT established yet; the client must call the challenge endpoint.
 */
export interface TwoFactorRequiredResponse {
  two_factor: boolean;
}

/** Login resolves to a logged-in user, or a pending 2FA challenge. */
export type LoginResult = UserResponse | TwoFactorRequiredResponse;

/** Narrows a {@link LoginResult} to the pending-2FA case. */
export function isTwoFactorRequired(
  result: LoginResult,
): result is TwoFactorRequiredResponse {
  return (result as TwoFactorRequiredResponse).two_factor === true;
}

/** Complete a 2FA login with EITHER a TOTP code OR a recovery code (exactly one). */
export interface TwoFactorChallengeRequest {
  code?: string;
  recoveryCode?: string;
}

export interface TwoFactorConfirmRequest {
  code: string;
}

export interface TwoFactorDisableRequest {
  password: string;
}

/** Returned when enrollment starts: the secret + the otpauth:// URL to render as QR. */
export interface TwoFactorEnrollmentResponse {
  secret: string;
  otpauthUrl: string;
}

/** One-time recovery codes (shown once on confirmation/regeneration). */
export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

/**
 * Status of a user's recovery codes. Codes are hashed at rest, so they can never
 * be re-read after generation — the GET endpoint only reports how many remain.
 */
export interface RecoveryCodesStatusResponse {
  remaining: number;
}
