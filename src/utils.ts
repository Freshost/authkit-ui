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
