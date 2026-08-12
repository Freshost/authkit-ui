import { AuthkitError } from './api/client';

/** Extracts a human-readable message from an unknown thrown value. */
export function messageFrom(err: unknown, fallback: string): string {
  if (err instanceof AuthkitError) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

/** Returns the backend error `code` if the value is an AuthkitError, else ''. */
export function codeFrom(err: unknown): string {
  return err instanceof AuthkitError ? err.code : '';
}

/** Maps a failed login to safe, actionable UI copy without mislabelling transport errors. */
export function loginErrorKey(
  err: unknown,
):
  | 'login.invalidCredentials'
  | 'login.networkError'
  | 'login.serverError'
  | 'login.rateLimited'
  | 'login.accountDisabled' {
  if (!(err instanceof AuthkitError)) {
    return 'login.serverError';
  }

  switch (err.code) {
    case 'invalid_credentials':
      return 'login.invalidCredentials';
    case 'network_error':
      return 'login.networkError';
    case 'rate_limited':
      return 'login.rateLimited';
    case 'account_disabled':
      return 'login.accountDisabled';
    default:
      return 'login.serverError';
  }
}
