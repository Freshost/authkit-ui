import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { Bullseye, Spinner } from '@freshost/ui';

import { useMe } from '../hooks/useAuth';
import { useAuthkit } from '../provider';

export interface AuthGuardProps {
  children: ReactNode;
  /** Rendered while the session check is in flight. Default: centered spinner. */
  fallback?: ReactNode;
  /** Redirect target when unauthenticated. Defaults to the provider's login route. */
  redirectTo?: string;
}

/**
 * Gates its children behind an authenticated session. While `useMe` is loading
 * it shows a spinner; on 401/no-user it redirects to the login route. Apps that
 * need extra logic (e.g. an installer probe) can compose their own guard from
 * {@link useMe} instead.
 */
export function AuthGuard({ children, fallback, redirectTo }: AuthGuardProps): ReactNode {
  const { routes } = useAuthkit();
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      fallback ?? (
        <Bullseye>
          <Spinner aria-label="Loading" />
        </Bullseye>
      )
    );
  }

  if (isError || !data) {
    return <Navigate to={redirectTo ?? routes.login} replace />;
  }

  return children;
}
