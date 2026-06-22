// Mirrors the goravel-authkit HTTP DTOs (http/responses/responses.go) exactly,
// including the JSON field casing the backend emits. This is the stable contract
// the package owns — keep these in lockstep with the Go responses package.

/** Public view of a user — never includes the password hash. */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  /** RFC3339 timestamp. */
  createdAt: string;
}

/** Standard error envelope: `{ error, message }`. */
export interface ErrorResponse {
  error: string;
  message: string;
}

/** Simple `{ message }` envelope. */
export interface MessageResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
