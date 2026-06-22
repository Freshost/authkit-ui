import { useSyncExternalStore } from 'react';

import { Alert, AlertActionCloseButton, AlertGroup } from '@freshost/ui';
import type { NotifyAdapter } from '@freshost/authkit-ui';

// A tiny external toast store — mirrors how dns-console surfaces notifications.
// The adapter is what we hand to <AuthkitProvider notify={...}>.

type Variant = 'success' | 'danger';
interface Toast {
  id: number;
  variant: Variant;
  title: string;
}

let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(variant: Variant, title: string) {
  const toast: Toast = { id: ++nextId, variant, title };
  toasts = [toast, ...toasts];
  emit();
  setTimeout(() => dismiss(toast.id), 6000);
}

export const notifyAdapter: NotifyAdapter = {
  success: (m) => push('success', m),
  error: (m) => push('danger', m),
};

export function Toasts() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
  );
  return (
    <AlertGroup isToast isLiveRegion>
      {list.map((t) => (
        <Alert
          key={t.id}
          variant={t.variant}
          title={t.title}
          timeout={6000}
          actionClose={<AlertActionCloseButton onClose={() => dismiss(t.id)} />}
        />
      ))}
    </AlertGroup>
  );
}
