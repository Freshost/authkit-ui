/**
 * Notification adapter. The package never assumes a toast mechanism — each app
 * passes one of these to <AuthkitProvider>. dns-console wires its imperative
 * `notify` store; freshproxy wraps its `useToast()` context. Both reduce to
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
