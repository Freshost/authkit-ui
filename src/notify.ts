/**
 * Notification adapter. The package never assumes a toast mechanism — each app
 * passes one of these to <AuthkitProvider>. An app might wire an imperative
 * notification store, or wrap a context-based `useToast()`; both reduce to
 * "show a success string" / "show an error string".
 */
export interface NotifyAdapter {
  success(message: string): void;
  error(message: string): void;
}

/** Default adapter: silent. Apps should pass a real one to surface feedback. */
export const noopNotify: NotifyAdapter = {
  success: () => {},
  error: () => {},
};
